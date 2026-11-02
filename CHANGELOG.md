# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

## [1.8.2] - 2026-11-03

### Corregido

- **equipo**: en un worktree (Orca), los cambios en `CLAUDE.md` y `.claude/` se aplican también en la copia principal, de donde copian las tareas nuevas. Antes se perdían al borrar la tarea.
- **arranque**: `actualizar-proyecto` aplica lo local en la copia principal aunque se lance desde un worktree.

## [1.8.1] - 2026-11-03

### Corregido

- **arranque**: los proyectos con base de datos tienen una base de tests separada (`<base>_test`), creada por un script de inicio de Postgres. Los tests la usan siempre y nunca tocan la de desarrollo. `actualizar-proyecto` lo propone en los proyectos que no la tienen.

## [1.8.0] - 2026-11-03

### Añadido

- **arranque**: `/arranque:actualizar-proyecto` compara un proyecto con la última versión de las plantillas y propone solo lo que falta (reglas, permisos, hooks, CI, documentos base, tareas de mise). Nunca borra ni sustituye lo que el proyecto ya tiene; lo local se aplica directamente y lo del repositorio va en una PR.
- **arranque**: incluye las plantillas de la 1.7.0 (test en rojo y base de tests en la regla de tests).

## [1.7.0] - 2026-11-02

### Añadido

- **equipo**: paso de comprobación de los tests antes de las auditorías. La sesión principal rompe a propósito las reglas críticas y las amenazas del plan y confirma que algún test falla; si no, el desarrollador añade el test que falta.
- **equipo**: datos de referencia (divisas, países, impuestos…) siempre desde una fuente oficial o una librería mantenida, con la URL y la fecha en el código.

### Cambiado

- **equipo**: el desarrollador informa por tarea del motivo con el que falló el test en rojo y de toda desviación del plan; la sesión principal lo comprueba en cada bloque.
- **equipo**: las pruebas que rompen código o meten datos inválidos van contra la base de tests, nunca contra la de desarrollo.
- **equipo**: la sesión principal no edita código ni ejecuta pruebas destructivas mientras un agente trabaja en la carpeta.
- **equipo**: todos los agentes fijan esfuerzo `medium`, para que subir el esfuerzo de la sesión al planificar no encarezca el resto.
- **arranque**: la regla de tests de cada proyecto incluye ver el test en rojo y usar la base de tests para las pruebas destructivas.

## [1.6.1] - 2026-11-02

### Cambiado

- **equipo**: cazabugs vuelve a Opus. En la primera funcionalidad real encontró bugs sutiles con impacto en seguridad.
- **equipo**: el plan recoge casos límite y amenazas con su prueba, y cada tarea los lleva a tests desde el principio, para que las auditorías encuentren menos.
- **equipo**: como máximo 2 rondas de corrección. Solo los hallazgos críticos y altos hacen relanzar auditores; los medios los verifica la sesión principal. Tras la segunda ronda decide el usuario.
- **equipo**: una especificación de más de unos 15 criterios se propone dividida en varias funcionalidades.

## [1.6.0] - 2026-11-02

### Cambiado

- **equipo**: en modo completo, los auditores se eligen según el riesgo del cambio. QA y revisor siempre; seguridad si toca accesos, datos personales, pagos, secretos, dependencias o entradas de usuario; cazabugs si hay estados, cálculos, concurrencia, integraciones o migraciones. El usuario ve la elección antes y puede añadir auditores.
- **equipo**: revisor y cazabugs pasan a Sonnet. Seguridad sigue en Opus.

## [1.5.1] - 2026-11-02

### Cambiado

- **arranque**: `nuevo-proyecto` acepta también un repo recién creado con un commit inicial o un README de plantilla (como el de «Crear nuevo proyecto» en Orca) y rehace el historial desde cero. Si se lanza en un worktree, para y pide hacerlo en la copia principal.

## [1.5.0] - 2026-11-02

### Añadido

- **arranque**: `nuevo-proyecto` acepta un repo git vacío ya creado (el que se añade a Orca) y no crea otra carpeta ni otro repositorio.
- **arranque**: el cierre de `nuevo-proyecto` y `adaptar-proyecto` recuerda la configuración de Orca (rama base y hook de preparación).
- **arranque**: `.worktreeinclude` copia también `.claude/skills/` a los worktrees.
- **README**: sección para trabajar con Orca.

### Cambiado

- **equipo**: `funcionalidad` y `arreglo` detectan si están en un worktree; ahí renombran la rama actual sobre `origin/main` en lugar de cambiar a `main`.
- **equipo**: el número de especificación se calcula con `docs/specs/` y con las ramas `feat/NNN-*` locales y remotas, para que los worktrees en paralelo no repitan número.

## [1.4.1] - 2026-11-02

### Corregido

- **panel**: las barras del plan se ajustan al ancho del panel y la hora de renovación ya no salta de línea.

## [1.4.0] - 2026-10-31

### Añadido

- **arranque**: método para elegir el stack con criterios eliminatorios y verificación en vivo de versión, fin de soporte, mantenimiento, vulnerabilidades y licencia (`stack.md`).
- **arranque**: guía de arquitectura con las decisiones que el plan debe dejar escritas (`arquitectura.md`).
- **arranque**: seguridad desde el diseño: modelo de amenazas, autenticación, autorización, RGPD, secretos, dependencias, cabeceras y alertas de Dependabot activadas al crear el repositorio (`seguridad.md`).
- **arranque**: reglas por zona del código en `.claude/rules/` (tests, API, datos, interfaz y zonas sensibles), que se cargan solo al tocar esos archivos.

### Cambiado

- **equipo**: al cerrar una funcionalidad, las reglas nuevas van a `CLAUDE.md` si son generales o a su regla de `.claude/rules/` si son de una zona.

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
