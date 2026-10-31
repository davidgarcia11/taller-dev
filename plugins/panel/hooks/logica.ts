import type { ModelUsage } from 'claude-code'

import type { Agente, Evento } from '../types'

export const PRINCIPAL = 'principal'

const MILLON = 1_000_000

/** Precios de la API en dólares por millón de tokens (platform.claude.com, octubre de 2026). */
type Tarifa = { entrada: number; salida: number; escrituraCache: number; lecturaCache: number }

const TARIFAS: ReadonlyArray<{ patron: RegExp; tarifa: Tarifa }> = [
  { patron: /fable|mythos/, tarifa: { entrada: 10, salida: 50, escrituraCache: 12.5, lecturaCache: 0.25 } },
  { patron: /opus-5-5|opus-5\.5/, tarifa: { entrada: 4, salida: 20, escrituraCache: 5, lecturaCache: 0.2 } },
  { patron: /opus/, tarifa: { entrada: 5, salida: 25, escrituraCache: 6.25, lecturaCache: 0.5 } },
  { patron: /sonnet-5-5|sonnet-5\.5/, tarifa: { entrada: 2, salida: 10, escrituraCache: 2.5, lecturaCache: 0.1 } },
  { patron: /sonnet/, tarifa: { entrada: 2, salida: 10, escrituraCache: 2.5, lecturaCache: 0.2 } },
]

const HAIKU_CORTO: Tarifa = { entrada: 0.1, salida: 0.5, escrituraCache: 0.125, lecturaCache: 0.01 }
const HAIKU_LARGO: Tarifa = { entrada: 0.5, salida: 2.5, escrituraCache: 0.625, lecturaCache: 0.05 }
const UMBRAL_HAIKU = 100_000

/** Tokens de entrada de una petición: sin caché, escritos en caché y leídos de caché. */
export function entradaTotal(uso: ModelUsage): number {
  return uso.input_tokens + uso.cache_creation_input_tokens + uso.cache_read_input_tokens
}

function tarifaDe(modelo: string, uso: ModelUsage): Tarifa | null {
  const id = modelo.toLowerCase()
  if (id.includes('haiku')) {
    return entradaTotal(uso) > UMBRAL_HAIKU ? HAIKU_LARGO : HAIKU_CORTO
  }
  return TARIFAS.find(t => t.patron.test(id))?.tarifa ?? null
}

/**
 * Coste en dólares de API de una petición, o `null` si el modelo no está en la tabla.
 * La escritura en caché se cuenta a la tarifa de 5 minutos.
 */
export function coste(modelo: string, uso: ModelUsage): number | null {
  const t = tarifaDe(modelo, uso)
  if (!t) return null
  return (
    (uso.input_tokens * t.entrada +
      uso.output_tokens * t.salida +
      uso.cache_creation_input_tokens * t.escrituraCache +
      uso.cache_read_input_tokens * t.lecturaCache) /
    MILLON
  )
}

/** Nombre corto del modelo para mostrar: Opus, Sonnet, Haiku, Fable. */
export function nombreModelo(modelo: string): string {
  const id = modelo.toLowerCase()
  for (const nombre of ['Fable', 'Opus', 'Sonnet', 'Haiku']) {
    if (id.includes(nombre.toLowerCase())) return nombre
  }
  return modelo || '—'
}

/** `equipo:desarrollador` → `desarrollador`; `Explore` → `explore`. */
export function nombreAgente(tipo: string): string {
  const corto = tipo.includes(':') ? tipo.slice(tipo.lastIndexOf(':') + 1) : tipo
  return (corto || 'agente').toLowerCase()
}

function base(ruta: unknown): string {
  const texto = typeof ruta === 'string' ? ruta : ''
  return texto.slice(texto.lastIndexOf('/') + 1) || texto
}

export function corta(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return limpio.length > max ? limpio.slice(0, max - 1) + '…' : limpio
}

/** Qué está haciendo un agente, en pocas palabras, a partir de la herramienta que usa. */
export function actividad(herramienta: string, datos: Record<string, unknown>): string {
  switch (herramienta) {
    case 'Bash': {
      const comando = String(datos.command ?? '').replace(/^cd\s+\S+\s*&&\s*/, '')
      return 'ejecuta ' + corta(comando, 48)
    }
    case 'Read':
      return 'lee ' + base(datos.file_path)
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return 'edita ' + base(datos.file_path ?? datos.notebook_path)
    case 'Write':
      return 'escribe ' + base(datos.file_path)
    case 'Grep':
      return 'busca «' + corta(String(datos.pattern ?? ''), 30) + '»'
    case 'Glob':
      return 'busca archivos ' + corta(String(datos.pattern ?? ''), 30)
    case 'Agent':
    case 'Task':
      return 'lanza ' + nombreAgente(String(datos.subagent_type ?? 'agente'))
    case 'Skill':
      return 'carga ' + String(datos.skill ?? datos.name ?? 'una skill')
    case 'WebFetch':
    case 'WebSearch':
      return 'consulta la web'
    case 'TaskCreate':
    case 'TaskUpdate':
      return 'actualiza las tareas'
    case 'AskUserQuestion':
      return 'te pregunta'
    default:
      return 'usa ' + herramienta
  }
}

/** Hitos que merece la pena anotar de un comando de shell que terminó bien. */
export function hito(comando: string, salida: string): string | null {
  if (/\bgit\s+commit\b/.test(comando)) {
    const mensaje = /-m\s+(?:"([^"]+)"|'([^']+)')/.exec(comando)
    const primera = (mensaje?.[1] ?? mensaje?.[2] ?? '').split('\n')[0] ?? ''
    return primera ? 'Commit: ' + corta(primera, 70) : 'Commit'
  }
  if (/\b(gh\s+pr\s+create|glab\s+mr\s+create)\b/.test(comando)) {
    const url = /https?:\/\/\S+\/(?:pull|merge_requests)\/\d+/.exec(salida)?.[0]
    return url ? 'PR abierta: ' + url : 'PR abierta'
  }
  if (/\bgit\s+push\b/.test(comando)) return 'Push de la rama'
  return null
}

/** Veredicto de un informe de auditoría, si lo trae. */
export function veredicto(respuesta: string): string | null {
  return /Veredicto:\s*(APROBADO|CAMBIOS NECESARIOS)/i.exec(respuesta)?.[1]?.toUpperCase() ?? null
}

function decimal(n: number, decimales: number): string {
  return n.toFixed(decimales).replace('.', ',')
}

/** 950 · 38,2 k · 1,24 M */
export function fmtTokens(n: number): string {
  if (n >= MILLON) return decimal(n / MILLON, 2) + ' M'
  if (n >= 1000) return decimal(n / 1000, 1) + ' k'
  return String(Math.round(n))
}

/** 10,80 $ · <0,01 $ */
export function fmtUsd(n: number): string {
  if (n > 0 && n < 0.01) return '<0,01 $'
  return decimal(n, 2) + ' $'
}

/** Tiempo que falta hasta una fecha ISO: «2 h 10 min», «3 d 4 h», «12 min». */
export function fmtFalta(iso: string | undefined, ahora: number): string {
  if (!iso) return ''
  const ms = Date.parse(iso) - ahora
  if (!Number.isFinite(ms)) return ''
  if (ms <= 0) return 'ya'
  const min = Math.ceil(ms / 60_000)
  const dias = Math.floor(min / 1440)
  const horas = Math.floor((min % 1440) / 60)
  const resto = min % 60
  if (dias > 0) return `${dias} d ${horas} h`
  if (horas > 0) return `${horas} h ${resto} min`
  return `${resto} min`
}

/** Duración en milisegundos: «45 s», «3 min», «1 h 12 min». */
export function fmtDuracion(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  const min = Math.floor(s / 60)
  if (min < 60) return `${min} min`
  return min % 60 === 0 ? `${Math.floor(min / 60)} h` : `${Math.floor(min / 60)} h ${min % 60} min`
}

/** Hora local hh:mm de un instante. */
export function fmtHora(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Barra de progreso de texto. */
export function barra(porcentaje: number, ancho: number): string {
  const llenas = Math.round((Math.min(100, Math.max(0, porcentaje)) / 100) * ancho)
  return '█'.repeat(llenas) + '░'.repeat(ancho - llenas)
}

export type ColorUso = 'success' | 'warning' | 'error'

export function colorUso(porcentaje: number): ColorUso {
  if (porcentaje >= 85) return 'error'
  if (porcentaje >= 60) return 'warning'
  return 'success'
}

export function nombreLimite(tipo: string): string {
  if (tipo === 'five_hour') return '5 horas'
  if (tipo === 'seven_day') return 'Semana'
  if (tipo === 'spend_limit') return 'Gasto'
  return tipo
}

/** Clave del mes de un instante: `2026-10`. */
export function claveMes(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Mes anterior a una clave `AAAA-MM`. */
export function mesAnterior(clave: string): string {
  const [a, m] = clave.split('-').map(Number)
  const anio = a ?? 0
  const mes = m ?? 1
  return mes === 1 ? `${anio - 1}-12` : `${anio}-${String(mes - 1).padStart(2, '0')}`
}

/** Umbrales de aviso alcanzados que aún no se avisaron en esta ventana. */
export function avisosPendientes(
  tipo: string,
  porcentaje: number,
  renueva: string | undefined,
  avisados: readonly string[],
): { clave: string; umbral: number }[] {
  const umbrales = tipo === 'five_hour' ? [80, 95] : tipo === 'seven_day' ? [90] : []
  return umbrales
    .filter(u => porcentaje >= u)
    .map(u => ({ clave: `${tipo}:${renueva ?? ''}:${u}`, umbral: u }))
    .filter(a => !avisados.includes(a.clave))
}

/** Orden de la tabla: la sesión principal primero, después por orden de llegada. */
export function ordenar(agentes: readonly Agente[]): Agente[] {
  return [...agentes].sort((a, b) =>
    a.id === PRINCIPAL ? -1 : b.id === PRINCIPAL ? 1 : a.desde - b.desde,
  )
}

/** Texto plano de la sesión para pedir el resumen redactado. */
export function textoParaResumen(eventos: readonly Evento[], agentes: readonly Agente[]): string {
  const lineas = eventos.map(e => `${fmtHora(e.hora)} ${e.texto}`)
  const consumo = ordenar(agentes).map(
    a =>
      `${a.nombre} (${nombreModelo(a.modelo)}): entrada ${fmtTokens(a.entrada)}, salida ${fmtTokens(a.salida)}, ${fmtUsd(a.usd)}`,
  )
  return ['Cronología:', ...lineas, '', 'Consumo por agente:', ...consumo].join('\n')
}
