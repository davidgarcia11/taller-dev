---
name: adaptar-proyecto
description: Adapta un proyecto existente al estándar profesional sin romper lo que funciona. Diagnóstico, plan aprobado y cambios en una rama con PR - herramientas por proyecto con mise, hooks de git, CI, documentación de arquitectura, protecciones y equipo de desarrollo activado. Usar cuando el usuario quiera poner al día, estandarizar, profesionalizar o preparar un proyecto o repositorio que ya existe.
argument-hint: "[ruta del proyecto]"
---

# Adaptar proyecto

Actúa como ingeniero de plataforma y arquitecto que hereda un proyecto en producción: primero entiende, después propone, nunca rompe. Plantillas: `${CLAUDE_PLUGIN_ROOT}/plantillas`.

## Reglas

- Las fases 1 y 2 son de solo lectura. La fase 3 empieza solo con aprobación explícita.
- Todo el cambio va en la rama `chore/adaptar-estandar` y termina en una PR/MR. El merge lo hace el usuario.
- No reescribas historial, no hagas force push y no borres ramas sin una confirmación explícita y separada para esa acción.
- No silencies reglas de lint ni desactives tests para que el check pase. Si algo no se puede arreglar dentro de esta PR, lo decide el usuario.
- Sin refactors de código de producto: esta PR cambia herramientas, configuración y documentación.
- Mismas reglas de instalación y autoría que `nuevo-proyecto`: todo por proyecto con mise y nada que mencione a Claude, IA o asistentes en el repositorio.

## Fase 1. Diagnóstico

Si `git status --porcelain` no está vacío, para y pregunta. Después revisa, sin modificar nada:

| Área | Qué mirar |
|---|---|
| Forja y ramas | remoto, rama por defecto, protección de `main` |
| Stack | manifiestos (`package.json`, `pyproject.toml`, `pom.xml`, `go.mod`…), versiones de runtime y dónde se fijan (`.nvmrc`, `.tool-versions`, `engines`) |
| Herramientas | `mise.toml`, lint, formato, tipos, tests y si pasan hoy |
| Git | hooks (`.githooks`, husky, pre-commit), formato de commits recientes |
| CI | qué ejecuta y si coincide con lo local |
| Documentación | README, arquitectura, decisiones, `.env.example` |
| Secretos | `.env` rastreado y secretos en todo el historial |
| Dependencias | vulnerabilidades conocidas |
| Archivos del asistente | rastreados en git |
| Autoría | trailers de coautoría o «Generated with» en el historial |

```bash
mise exec gitleaks@latest -- gitleaks git --redact --no-banner
mise exec osv-scanner@latest -- osv-scanner scan source -r .
git ls-files | grep -iE 'claude|agents\.md|\.cursor'
git log --format=%B | grep -icE 'co-authored-by: claude|generated with \[claude'
```

## Fase 2. Propuesta

Presenta, sin relleno:

1. **Diagnóstico**: tabla área | estado | acción propuesta.
2. **Riesgos inmediatos**: secretos encontrados (primero se rotan; limpiar el historial es una decisión aparte), dependencias vulnerables, tests rotos y las carencias frente a `${CLAUDE_PLUGIN_ROOT}/skills/nuevo-proyecto/seguridad.md` (autorización, cabeceras, gestión de secretos, datos personales).
3. **Cambios de esta PR**, en commits lógicos.
4. **Fuera de esta PR**: deuda que no se toca, con su motivo.
5. **Decisiones para el usuario**: qué hacer si el check no pasa con el código actual; si se limpia el historial; si hay hooks o CI previos, si se reemplazan o se integran.

Pide aprobación explícita e itera hasta tenerla.

## Fase 3. Ejecución

Crea una lista de tareas con estos pasos.

1. **Rama**: `git switch -c chore/adaptar-estandar`.
2. **Runtimes**: `mise use --pin` con las versiones que el proyecto usa hoy, más `gitleaks`, `osv-scanner` y `git-cliff`. `mise trust`.
3. **Base**: `"${CLAUDE_PLUGIN_ROOT}/bin/taller-base" --forja <github|gitlab>` (más `--servicios` y `--runbook` si aplican). Integra a mano lo que el script omita por existir ya: conserva los jobs de CI existentes y añade `mise run check`.
4. **Archivos del asistente fuera de git**: `git rm -r --cached --quiet` sobre los que el script avise. Siguen en disco.
5. **Tareas de mise**: `setup`, `check`, `changelog` y `version` (desde `${CLAUDE_PLUGIN_ROOT}/plantillas/tareas/`) envolviendo los scripts existentes del proyecto.
6. **Check en verde**: correcciones automáticas de formato y lint en un commit propio (`style: aplica formato automático`). Lo que no sea automático se resuelve según lo que decidió el usuario.
7. **Documentación**:
   - `docs/ARCHITECTURE.md` describiendo el sistema tal como es hoy: lee el código (usa el agente Explore para mapearlo) y no inventes intenciones.
   - `docs/adr/0001-stack-y-arquitectura.md` registrando el stack existente como decisión aceptada.
   - `docs/specs/README.md` para las funcionalidades futuras.
   - README con requisitos, arranque y comandos.
   - `CHANGELOG.md`: si el historial ya usa conventional commits, `mise run changelog`; si no, empieza desde esta PR con una entrada que resuma el estado actual.
   - Si hay API sin referencia: propón OpenAPI generado desde el código como trabajo aparte, no en esta PR.
   - Si hay despliegue: `docs/RUNBOOK.md` con lo que hoy se hace de verdad; marca como pendiente lo que no exista (por ejemplo, copias sin prueba de restauración).
8. **CLAUDE.md y `.claude/rules/`** con la realidad del proyecto: vocabulario, reglas generales y comandos en `CLAUDE.md`; reglas de cada zona (tests, API, datos, interfaz, zonas sensibles) con los patrones de ruta reales del código.
9. **Equipo**: `claude plugin install equipo@taller-dev --scope local`.
10. **Protecciones**: las dos pruebas de `nuevo-proyecto` (secreto y mensaje sin formato) deben fallar.
11. **PR**: commits lógicos, `mise run check` en verde, push y PR/MR con la plantilla. Resume diagnóstico, cambios y deuda pendiente.

### Limpieza del historial (solo si el usuario la pidió en la fase 2)

Antes de nada: secretos rotados, copia completa (`git clone --mirror`) y aviso a quien tenga el repositorio clonado. Usa `git filter-repo` en una copia, enseña el resultado y pide confirmación para el force push. Nunca en la misma PR que la adaptación.

## Cierre

Resume en 8 líneas como máximo: qué tenía, qué cambia, URL de la PR, deuda pendiente y riesgos abiertos. Termina con: «Tras hacer el merge, abre una sesión nueva en el proyecto para cargar su CLAUDE.md, permisos, hooks y el equipo.»
