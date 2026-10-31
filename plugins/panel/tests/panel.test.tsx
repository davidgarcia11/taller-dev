import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'

const AHORA = Date.parse('2026-10-31T12:00:00Z')

const PANEL = {
  plugin: 'panel',
  component: 'Pane',
  requestId: 'panel',
  props: {
    title: 'Panel',
    isFocused: false,
    bodyColumns: 70,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 60 },
    view: {},
  },
  viewport: { columns: 120, rows: 60 },
} as const

const FRANJA = {
  plugin: 'panel',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 4,
    bodyColumns: 110,
    scroll: { offset: 0, bodyRows: 4 },
    view: {},
  },
} as const

const USO = {
  input_tokens: 1000,
  output_tokens: 2000,
  cache_read_input_tokens: 100_000,
  cache_creation_input_tokens: 0,
}

/** El motor bajo el plugin: lo mínimo para arrancar una sesión con datos del plan. */
function motor(on: On, porcentaje = 52) {
  mock.clock(on, { now: AHORA })
  mock.store(on, { 'mes:2026-09': 98.1 })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({
    value: {
      startedAt: AHORA - 60 * 60_000,
      context: { window: 200_000 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: porcentaje, resetsAt: '2026-10-31T14:10:00Z' },
        { kind: 'seven_day', percentUsed: 21, resetsAt: '2026-11-02T08:00:00Z' },
      ],
      cost: { usd: 4 },
    },
  }))
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'a1' }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.step', async function* (_, e) {
    return {
      turnId: e.turnId,
      index: e.index,
      answer: '',
      toolUses: [],
      stopReason: 'end_turn' as const,
      usage: { ...USO, model: e.agentId ? 'claude-sonnet-5-5' : 'claude-opus-5-5' },
    }
  })
  on('tool.call', () => ({ result: {}, text: 'https://github.com/davidgarcia11/demo/pull/14' }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('session.measure', (_, e) => ({ changed: e.changed }))
}

async function trabajar($: Engine) {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.agent.spawn({
    tool_use_id: 't1',
    prompt: 'Implementa T1',
    description: 'Implementa T1-T3',
    subagentType: 'equipo:desarrollador',
  } as never)
  for await (const _ of $.turn.step({ turnId: 'u1', index: 0, model: 'claude-opus-5-5', messageCount: 1 })) {
    // consume la respuesta
  }
  for await (const _ of $.turn.step({ turnId: 'u2', index: 0, model: 'claude-sonnet-5-5', messageCount: 1, agentId: 'a1' })) {
    // consume la respuesta
  }
  await $.tool.call({ tool: 'Edit', file_path: '/repo/src/partes.ts', old_string: 'a', new_string: 'b', agentId: 'a1' } as never)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat(partes): firma desde el móvil"' } as never)
  await $.tool.call({ tool: 'Bash', command: 'gh pr create --fill' } as never)
}

test('la franja muestra el plan, el coste y el agente activo', async ($, on) => {
  motor(on)
  await trabajar($)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...FRANJA, surface })
    const texto = (await ui.find({ type: 'Text', text: /5 h 52 %/ }))?.text ?? ''
    expect(texto).toContain('5 h 52 %')
    expect(texto).toContain('2 h 10 min')
    expect(texto).toContain('semana 21 %')
    expect(texto).toContain('desarrollador: edita partes.ts')
    expect(await ui.find({ key: 'abrir-panel' })).toBeDefined()
    await ui.unmount()
  }
})

test('el panel muestra tokens y coste por agente, el mes y la cronología', async ($, on) => {
  motor(on)
  await trabajar($)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANEL, surface })
    // Opus 5.5: 1000×4 + 2000×20 + 100000×0,2 = 64 000 / 1e6 = 0,064 $
    const principal = (await ui.find({ type: 'Text', text: /^sesión principal\s/ }))?.text ?? ''
    expect(principal).toContain('Opus')
    expect(principal).toContain('101,0 k')
    expect(principal).toContain('2,0 k')
    expect(principal).toContain('0,06 $')
    // Sonnet 5.5: 1000×2 + 2000×10 + 100000×0,1 = 32 000 / 1e6 = 0,032 $
    const dev = (await ui.find({ type: 'Text', text: /^desarrollador\s+Sonnet/ }))?.text ?? ''
    expect(dev).toContain('0,03 $')
    expect((await ui.find({ type: 'Text', text: /mes anterior/ }))?.text).toContain('98,10 $')
    expect(await ui.find({ type: 'Text', text: /Commit: feat\(partes\): firma desde el móvil/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /PR abierta: https:\/\/github.com\/davidgarcia11\/demo\/pull\/14/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Lanza desarrollador: Implementa T1-T3/ })).toBeDefined()
    await ui.unmount()
  }
})

test('avisa al cruzar el 80 % de las 5 horas, una sola vez', async ($, on) => {
  motor(on, 81)
  const avisos: string[] = []
  on('ui.toast', (_, e) => {
    avisos.push(e.text)
    return { value: undefined }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 82, resetsAt: '2026-10-31T14:10:00Z' }],
    cost: { usd: 5 },
    changed: ['rateLimits'],
  } as never)
  expect(avisos.length).toBe(1)
  expect(avisos[0]).toContain('81 %')
})

test('suma al mes solo lo gastado desde que se abrió la sesión', async ($, on) => {
  motor(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [],
    cost: { usd: 6.5 },
    changed: ['cost'],
  } as never)
  const ui = await $.ui.mount({ ...PANEL, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /Este mes en Claude Code/ }))?.text).toContain('2,50 $')
  await ui.unmount()
})
