# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

## [1.3.0] - 2026-10-31

### Añadido

- **panel**: nuevo plugin (mod) con una franja sobre el cuadro de texto y un panel completo (`/panel`):
  - uso del plan de 5 horas y semanal con la hora de renovación y avisos al 80 % y al 95 %;
  - qué está haciendo cada agente en cada momento;
  - tokens de entrada y salida y coste a precio de API por agente y de la sesión;
  - coste acumulado del mes en Claude Code y el del mes anterior;
  - cronología automática de la sesión y resumen redactado con Haiku bajo demanda (`/panel-resumen`).

## [1.2.0] - 2026-10-31

### Cambiado

- **equipo**: el plan técnico lo redacta la sesión principal con la skill `diseno-tecnico`, en lugar de un agente aparte. Conserva el contexto de la conversación de especificación y gasta menos tokens. Se elimina el agente `arquitecto`.

## [1.1.0] - 2026-10-30

### Añadido

- **arranque**: CHANGELOG generado desde los commits con git-cliff (`cliff.toml` y tareas `changelog` y `version`).
- **arranque**: runbook de operación opcional (`taller-base --runbook`) para proyectos con despliegue.
- **arranque**: referencia OpenAPI generada desde el código en proyectos con API, verificada en el check.
- **equipo**: API pública con comentarios de documentación obligatorios; el revisor lo comprueba.
- **equipo**: el plan indica qué documentación cambia y cada tarea la actualiza en su propio commit.
- **equipo**: propuesta de informe de incidencia para bugs graves en producción.
- Mapa de la documentación en `ARCHITECTURE.md`.

## [1.0.0] - 2026-10-30

### Añadido

- **arranque**: `nuevo-proyecto` y `adaptar-proyecto`, con plantillas de hooks, CI (GitHub y GitLab), plantilla de PR/MR, documentación de arquitectura, ADR y especificaciones, servicios locales con Compose y tareas de mise por stack.
- **arranque**: script `taller-base` que aplica la base sin sobrescribir nada.
- **equipo**: flujos `funcionalidad` y `arreglo` con desarrollo guiado por especificación.
- **equipo**: agentes `arquitecto`, `desarrollador`, `revisor`, `qa`, `cazabugs` y `seguridad`, cada uno con su skill de conocimiento.
- Validación en CI de manifiestos, scripts y hooks.
