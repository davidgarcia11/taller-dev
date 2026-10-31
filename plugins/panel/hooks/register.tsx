import { atom, read, update } from 'claude-code'
import type { EngineInterface, ModelUsage, Register, SessionRateLimit } from 'claude-code'

import type { Agente, Evento, Mes, Plan, Resumen } from '../types'
import {
  PRINCIPAL,
  actividad,
  avisosPendientes,
  barra,
  claveMes,
  colorUso,
  corta,
  coste,
  entradaTotal,
  fmtDuracion,
  fmtFalta,
  fmtHora,
  fmtTokens,
  fmtUsd,
  hito,
  mesAnterior,
  nombreAgente,
  nombreLimite,
  nombreModelo,
  ordenar,
  textoParaResumen,
  veredicto,
} from './logica'

const PANE = 'panel'
const TITULO = 'Panel'
const MAX_EVENTOS = 80

// Cambia la etiqueta `shape` si cambia la forma de un valor: descarta lo que guardó una versión anterior.
const plan = atom({ plugin: 'panel', key: 'plan' } as const, { limites: [], sesionUsd: 0, inicio: 0 } satisfies Plan, {
  shape: 'plan-1',
})
const agentes = atom({ plugin: 'panel', key: 'agentes' } as const, [] as Agente[], { shape: 'agentes-1' })
const linea = atom({ plugin: 'panel', key: 'linea' } as const, [] as Evento[], { shape: 'linea-1' })
const mes = atom({ plugin: 'panel', key: 'mes' } as const, { clave: '', usd: 0 } satisfies Mes, { shape: 'mes-1' })
const resumen = atom({ plugin: 'panel', key: 'resumen' } as const, null as Resumen | null, { shape: 'resumen-1' })
const ultimoUsd = atom({ plugin: 'panel', key: 'ultimoUsd' } as const, -1)
const avisos = atom({ plugin: 'panel', key: 'avisos' } as const, [] as string[])

type Motor = EngineInterface

function agenteNuevo(id: string, desde: number): Agente {
  return {
    id,
    nombre: id === PRINCIPAL ? 'sesión principal' : 'agente',
    modelo: '',
    estado: 'esperando',
    actividad: '',
    entrada: 0,
    salida: 0,
    usd: 0,
    costeConocido: true,
    desde,
  }
}

async function conAgente($: Motor, id: string, cambio: (a: Agente) => Agente): Promise<void> {
  const ahora = await $.clock.now()
  await update($, agentes, lista => {
    const actual = lista.find(a => a.id === id) ?? agenteNuevo(id, ahora)
    return [...lista.filter(a => a.id !== id), cambio(actual)]
  })
}

async function anotar($: Motor, texto: string): Promise<void> {
  const hora = await $.clock.now()
  await update($, linea, l => [...l, { hora, texto }].slice(-MAX_EVENTOS))
}

async function abrirPanel($: Motor): Promise<void> {
  await $.ui.open({ id: PANE, title: TITULO })
}

const claveStore = (clave: string) => `mes:${clave}`

async function cargarMes($: Motor): Promise<void> {
  const clave = claveMes(await $.clock.now())
  const usd = Number((await $.store.get(claveStore(clave))) ?? 0)
  const anteriorClave = mesAnterior(clave)
  const anteriorUsd = Number((await $.store.get(claveStore(anteriorClave))) ?? 0)
  const valor: Mes = { clave, usd, ...(anteriorUsd > 0 ? { anterior: { clave: anteriorClave, usd: anteriorUsd } } : {}) }
  await update($, mes, () => valor)
}

async function sumarAlMes($: Motor, delta: number): Promise<void> {
  const clave = claveMes(await $.clock.now())
  const usd = Number((await $.store.get(claveStore(clave))) ?? 0) + delta
  await $.store.set(claveStore(clave), usd)
  const actual = await read($, mes)
  if (actual.clave === clave) {
    await update($, mes, m => ({ ...m, usd }))
  } else {
    await cargarMes($)
  }
}

async function registrarMedida(
  $: Motor,
  limites: readonly SessionRateLimit[],
  usd: number | undefined,
  inicio: number | undefined,
): Promise<void> {
  await update($, plan, p => ({
    limites: limites.map(l => ({ tipo: l.kind, porcentaje: l.percentUsed, ...(l.resetsAt ? { renueva: l.resetsAt } : {}) })),
    sesionUsd: usd ?? p.sesionUsd,
    inicio: inicio ?? p.inicio,
  }))

  if (usd !== undefined) {
    const anterior = await read($, ultimoUsd)
    if (anterior >= 0 && usd > anterior) await sumarAlMes($, usd - anterior)
    if (anterior < 0 || usd !== anterior) await update($, ultimoUsd, () => usd)
  }

  const avisados = await read($, avisos)
  const ahora = await $.clock.now()
  for (const l of limites) {
    for (const aviso of avisosPendientes(l.kind, l.percentUsed, l.resetsAt, avisados)) {
      const falta = fmtFalta(l.resetsAt, ahora)
      $.ui.toast(
        `Llevas el ${Math.round(l.percentUsed)} % de tu límite de ${nombreLimite(l.kind).toLowerCase()}.` +
          (falta ? ` Se renueva en ${falta}.` : ''),
      )
      await update($, avisos, lista => [...lista, aviso.clave].slice(-50))
    }
  }
}

async function sumarUso($: Motor, id: string, uso: ModelUsage, modelo: string): Promise<void> {
  const usd = coste(modelo, uso)
  await conAgente($, id, a => ({
    ...a,
    modelo: modelo || a.modelo,
    entrada: a.entrada + entradaTotal(uso),
    salida: a.salida + uso.output_tokens,
    usd: a.usd + (usd ?? 0),
    costeConocido: a.costeConocido && usd !== null,
  }))
}

async function redactarResumen($: Motor): Promise<string> {
  await update($, resumen, r => ({ texto: r?.texto ?? '', generando: true, hora: r?.hora ?? 0 }))
  void abrirPanel($)
  const eventos = await read($, linea)
  const lista = await read($, agentes)
  const respuesta = await $.model.complete({
    model: 'haiku',
    maxTokens: 700,
    system:
      'Eres un jefe técnico que resume una sesión de desarrollo para quien la dirigió. Escribe en español, sin preámbulos.',
    prompt:
      'Resume esta sesión en 4 a 8 viñetas breves: qué se pidió, qué se decidió, qué se construyó o corrigió, ' +
      'el resultado de las revisiones, qué quedó pendiente y en qué se fue el consumo. No inventes nada que no esté aquí.\n\n' +
      textoParaResumen(eventos, lista),
  })
  const texto = respuesta.isAnswered
    ? respuesta.text.trim()
    : `No se pudo redactar el resumen (${respuesta.reason}). La cronología del panel sigue disponible.`
  const hora = await $.clock.now()
  await update($, resumen, () => ({ texto, generando: false, hora }))
  return texto
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: 'panel', description: 'Abre el panel: uso del plan, agentes, consumo y resumen' })
      await $.command.register({
        name: 'panel-resumen',
        description: 'Redacta un resumen de la sesión con Haiku (cuesta céntimos)',
      })
      await cargarMes($)
      const uso = await $.session.usage()
      await registrarMedida($, uso.rateLimits, uso.cost?.usd, uso.startedAt)
    } catch {
      // El panel nunca debe impedir que la sesión arranque.
    }
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    try {
      await registrarMedida($, e.rateLimits, e.cost?.usd, undefined)
    } catch {
      // Medida perdida: llegará otra.
    }
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    try {
      if (!e.isMeta) await anotar($, e.command ? `Comando /${e.command.name}` : 'Tú: ' + corta(e.text, 70))
    } catch {
      // Solo observa.
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    try {
      if (r.agentId) {
        const nombre = nombreAgente(e.subagentType || 'agente')
        const modelo = r.model
        await conAgente($, r.agentId, a => ({ ...a, nombre, modelo, estado: 'activo', actividad: 'empieza' }))
        await anotar($, `Lanza ${nombre}` + (e.description ? `: ${corta(e.description, 60)}` : ''))
      }
    } catch {
      // Solo observa.
    }
    return r
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    try {
      const id = e.agentId ?? PRINCIPAL
      await conAgente($, id, a => ({
        ...a,
        estado: 'activo',
        actividad: id === PRINCIPAL ? 'piensa' : a.actividad || 'empieza',
      }))
    } catch {
      // Solo observa.
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    try {
      if (r.usage) await sumarUso($, e.agentId ?? PRINCIPAL, r.usage, r.usage.model)
    } catch {
      // Solo observa.
    }
    return r
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId ?? PRINCIPAL
    const herramienta = String(e.tool)
    const datos = e as unknown as Record<string, unknown>
    try {
      await conAgente($, id, a => ({ ...a, estado: 'activo', actividad: actividad(herramienta, datos) }))
    } catch {
      // Solo observa.
    }
    const r = await next(e)
    try {
      if (herramienta === 'Bash' && !r.deny && !r.isError) {
        const nota = hito(String(datos.command ?? ''), r.text ?? '')
        if (nota) await anotar($, nota)
      }
    } catch {
      // Solo observa.
    }
    return r
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    try {
      const id = e.agentId ?? PRINCIPAL
      await conAgente($, id, a => ({ ...a, estado: id === PRINCIPAL ? 'esperando' : 'terminado', actividad: '' }))
      if (e.agentId) {
        const nombre = (await read($, agentes)).find(a => a.id === id)?.nombre ?? 'agente'
        const v = e.reason === 'answer' ? veredicto(e.answer) : null
        const fin = e.reason === 'answer' ? 'termina' : e.reason === 'aborted' ? 'se interrumpe' : 'falla'
        await anotar($, `${nombre} ${fin} (${fmtDuracion(e.durationMs)})` + (v ? ` · ${v}` : ''))
      }
    } catch {
      // Solo observa.
    }
    return next(e)
  })

  on('command.run', { command: 'panel' }, async $ => {
    await abrirPanel($)
    return { text: 'Panel abierto.' }
  })

  on('command.run', { command: 'panel-resumen' }, async $ => {
    const texto = await redactarResumen($)
    return { text: texto }
  })

  // Franja compacta sobre el cuadro de texto.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const p = await read($, plan)
    const lista = await read($, agentes)
    if (p.limites.length === 0 && lista.length === 0) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)
    const ahora = await $.clock.now()
    const cinco = p.limites.find(l => l.tipo === 'five_hour')
    const semana = p.limites.find(l => l.tipo === 'seven_day')
    const total = Math.max(p.sesionUsd, lista.reduce((s, a) => s + a.usd, 0))
    const activos = ordenar(lista).filter(a => a.estado === 'activo')
    const foco = activos.find(a => a.id !== PRINCIPAL) ?? activos[0]
    const otros = activos.length - (foco ? 1 : 0)

    return (
      <Box flexDirection="row" columnGap={1}>
        <Box flexGrow={1} flexShrink={1}>
          <Text wrap="truncate-end">
            {cinco && (
              <Text color={colorUso(cinco.porcentaje)}>
                5 h {Math.round(cinco.porcentaje)} %
              </Text>
            )}
            {cinco && <Text dimColor> ({fmtFalta(cinco.renueva, ahora)})</Text>}
            {semana && <Text dimColor> · semana </Text>}
            {semana && <Text color={colorUso(semana.porcentaje)}>{Math.round(semana.porcentaje)} %</Text>}
            <Text dimColor> · sesión </Text>
            <Text>{fmtUsd(total)}</Text>
            {foco && <Text color="claude"> · ● {foco.nombre}</Text>}
            {foco && foco.actividad !== '' && <Text dimColor>: {foco.actividad}</Text>}
            {otros > 0 && <Text dimColor> (+{otros})</Text>}
          </Text>
        </Box>
        <Button key="abrir-panel" label="Panel" onPress={() => abrirPanel($)} />
      </Box>
    )
  })

  // Panel completo.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const p = await read($, plan)
    const lista = ordenar(await read($, agentes))
    const eventos = await read($, linea)
    const m = await read($, mes)
    const r = await read($, resumen)
    const ahora = await $.clock.now()

    const ancho = e.props.bodyColumns
    const barraAncho = Math.max(8, Math.min(24, ancho - 34))
    const conModelo = ancho >= 58
    const sumaAgentes = lista.reduce((s, a) => s + a.usd, 0)
    const total = Math.max(p.sesionUsd, sumaAgentes)
    const otros = p.sesionUsd - sumaAgentes
    const activos = lista.filter(a => a.estado === 'activo')
    const recientes = lista.filter(a => a.estado === 'terminado').slice(-3)
    const filasLinea = Math.max(4, (e.viewport?.rows ?? 40) - 22 - lista.length)

    const fila = (nombre: string, modelo: string, entrada: string, salida: string, usd: string) =>
      nombre.padEnd(18).slice(0, 18) +
      (conModelo ? modelo.padEnd(8) : '') +
      entrada.padStart(9) +
      salida.padStart(9) +
      usd.padStart(10)

    return (
      <Box flexDirection="column" rowGap={1}>
        <Box flexDirection="column">
          <Text bold>Sesión · {p.inicio > 0 ? fmtDuracion(ahora - p.inicio) : 'empezando'}</Text>
          <Text dimColor>Coste de la sesión a precio de API: {fmtUsd(total)}</Text>
        </Box>

        <Box flexDirection="column">
          <Text bold color="claude">TU PLAN</Text>
          {p.limites.length === 0 && (
            <Text dimColor>Sin datos todavía: llegan con la próxima respuesta de Claude.</Text>
          )}
          {p.limites.map(l => (
            <Text>
              <Text>{nombreLimite(l.tipo).padEnd(8)}</Text>
              <Text color={colorUso(l.porcentaje)}>{barra(l.porcentaje, barraAncho)}</Text>
              <Text bold> {String(Math.round(l.porcentaje)).padStart(3)} %</Text>
              {l.renueva && <Text dimColor>  se renueva en {fmtFalta(l.renueva, ahora)}</Text>}
            </Text>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold color="claude">AHORA</Text>
          {activos.length === 0 && <Text dimColor>Nadie trabajando.</Text>}
          {activos.map(a => (
            <Text wrap="truncate-end">
              <Text color="success">● </Text>
              <Text bold>{a.nombre}</Text>
              <Text dimColor> {nombreModelo(a.modelo)}</Text>
              {a.actividad !== '' && <Text> · {a.actividad}</Text>}
            </Text>
          ))}
          {recientes.map(a => (
            <Text dimColor wrap="truncate-end">
              ✓ {a.nombre} {nombreModelo(a.modelo)} · terminado
            </Text>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold color="claude">CONSUMO DE LA SESIÓN</Text>
          <Text mono dimColor>{fila('', conModelo ? 'Modelo' : '', 'Entrada', 'Salida', 'API $')}</Text>
          {lista.map(a => (
            <Text mono>
              {fila(a.nombre, nombreModelo(a.modelo), fmtTokens(a.entrada), fmtTokens(a.salida), a.costeConocido ? fmtUsd(a.usd) : '—')}
            </Text>
          ))}
          {otros >= 0.01 && (
            <Text mono dimColor>{fila('otros', '', '', '', fmtUsd(otros))}</Text>
          )}
          <Text mono bold>
            {fila(
              'Total',
              '',
              fmtTokens(lista.reduce((s, a) => s + a.entrada, 0)),
              fmtTokens(lista.reduce((s, a) => s + a.salida, 0)),
              fmtUsd(total),
            )}
          </Text>
          {m.clave !== '' && (
            <Text>
              <Text dimColor>Este mes en Claude Code: </Text>
              <Text bold>{fmtUsd(m.usd)}</Text>
              {m.anterior && <Text dimColor> · mes anterior: {fmtUsd(m.anterior.usd)}</Text>}
            </Text>
          )}
          <Text dimColor>
            Dólares a precio de API: con tu suscripción no pagas esto. La entrada incluye los tokens leídos de caché.
            {otros >= 0.01 ? ' «otros» son tareas internas y lo consumido antes de cargar el panel.' : ''}
          </Text>
        </Box>

        <Box flexDirection="column">
          <Box flexDirection="row" columnGap={1}>
            <Text bold color="claude">RESUMEN</Text>
            <Button
              key="resumir"
              label={r?.generando ? 'Redactando…' : 'Redactar con Haiku'}
              onPress={() => {
                if (!r?.generando) void $.command.run({ command: 'panel-resumen', args: '' })
              }}
            />
          </Box>
          {r && r.texto !== '' && (
            <Box flexDirection="column" marginBottom={1}>
              <Text dimColor>Redactado a las {fmtHora(r.hora)}:</Text>
              <Text>{r.texto}</Text>
            </Box>
          )}
          {eventos.length === 0 && <Text dimColor>Aún no ha pasado nada en esta sesión.</Text>}
          {eventos.slice(-filasLinea).map(ev => (
            <Text wrap="truncate-end">
              <Text dimColor>{fmtHora(ev.hora)}  </Text>
              {ev.texto}
            </Text>
          ))}
        </Box>
      </Box>
    )
  })
}
