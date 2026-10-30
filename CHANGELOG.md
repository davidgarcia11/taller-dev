# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

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
