/** Una ventana de límite del plan: `five_hour`, `seven_day` u otra. */
export type Limite = { tipo: string; porcentaje: number; renueva?: string }

/** Lo que Claude Code mide de la sesión y del plan. */
export type Plan = { limites: Limite[]; sesionUsd: number; inicio: number }

export type EstadoAgente = 'activo' | 'esperando' | 'terminado'

/** Un hilo de trabajo: la sesión principal o un agente. */
export type Agente = {
  id: string
  nombre: string
  modelo: string
  estado: EstadoAgente
  actividad: string
  entrada: number
  salida: number
  usd: number
  costeConocido: boolean
  desde: number
}

/** Una línea del resumen automático de la sesión. */
export type Evento = { hora: number; texto: string }

/** Coste en dólares de API del mes en curso y del anterior. */
export type Mes = { clave: string; usd: number; anterior?: { clave: string; usd: number } }

/** Resumen redactado bajo demanda. */
export type Resumen = { texto: string; generando: boolean; hora: number }

declare module 'claude-code' {
  interface PluginState {
    panel: {
      plan: Shaped<Plan>
      agentes: Shaped<Agente[]>
      linea: Shaped<Evento[]>
      mes: Shaped<Mes>
      resumen: Shaped<Resumen | null>
      ultimoUsd: number
      avisos: string[]
    }
  }
}
