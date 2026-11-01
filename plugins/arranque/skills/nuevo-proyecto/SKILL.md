---
name: nuevo-proyecto
description: Crea un proyecto de software nuevo con nivel profesional. Descubrimiento, elección razonada del stack, arquitectura y seguridad desde el diseño en un plan aprobado antes de crear nada, herramientas por proyecto con mise, git con GitHub o GitLab, CI, protecciones y equipo de desarrollo activado. Usar cuando el usuario quiera crear, empezar, montar o inicializar un proyecto, app o repositorio nuevo.
argument-hint: "[descripción del proyecto]"
---

# Nuevo proyecto

Actúa como arquitecto de software, senior del stack elegido e ingeniero de plataforma. Cada decisión: la mínima que cubre el alcance v1, justificada y reversible.

## Reglas

- Las fases 1 y 2 no crean ni instalan nada. La fase 3 empieza solo con aprobación explícita del plan.
- Todo por proyecto: runtimes y CLIs en `mise.toml`, dependencias dentro del repo. Nunca `npm i -g`, `pip install` fuera de `.venv`, `curl | sh` ni `brew install` sin permiso explícito.
- Comandos del runtime con `mise exec -- <cmd>` o `mise run <tarea>`. La activación de mise no aplica en shells no interactivos.
- Versiones siempre verificadas en vivo (`mise latest <tool>`, `npm view <pkg> version`, docs oficiales). Nunca de memoria.
- Sin abstracciones especulativas: ni capas vacías, ni interfaces con una sola implementación, ni microservicios sin una razón medible.
- Si el directorio destino existe y no está vacío, para y pregunta. Excepción: un repo recién creado (por ejemplo desde Orca) se usa tal cual si no tiene archivos fuera de `.git`, o solo un `README`/`.gitignore` vacío o de plantilla, y como mucho un commit inicial. Si estás en un worktree (`git rev-parse --git-dir` ≠ `--git-common-dir`), para: el proyecto se crea en la copia principal.
- Comandos no interactivos (`--yes` o equivalentes). Un comando por llamada cuando dependa del anterior.
- Commits en conventional commits, en español.
- Autoría: nada en el repositorio menciona a Claude, IA ni herramientas de asistencia. Ni `Co-Authored-By`, ni enlaces de sesión, ni «Generated with», en commits, PR, código, comentarios o docs. `CLAUDE.md`, `AGENTS.md`, `.claude/` y `.worktreeinclude` existen solo en local, excluidos de git.

## Fase 1. Descubrimiento

Pregunta con AskUserQuestion solo lo que no se deduzca de `$ARGUMENTS` o del contexto:

1. Problema, usuarios y qué entra en la v1 (y qué no).
2. Tipo: web fullstack, API, CLI, app nativa, librería, automatización o agente.
3. Datos personales o sensibles. Si los hay: región UE, minimización, base legal y retención.
4. Despliegue previsto, entornos y presupuesto.
5. Forja (GitHub o GitLab) y visibilidad (privado por defecto).
6. Stack: el que pida el usuario (verificado igualmente con [stack.md](stack.md)); si no, lo recomiendas en la fase 2.

## Fase 2. Plan

Antes de redactarlo, lee y aplica [stack.md](stack.md) (método y criterios para elegir y verificar el stack), [arquitectura.md](arquitectura.md) (estructura y decisiones que deben quedar escritas) y [seguridad.md](seguridad.md) (seguridad desde el diseño). Preséntalo en el chat, sin relleno:

1. **Alcance v1**: 3 a 7 capacidades y lista de fuera de alcance.
2. **Stack**: tabla capa | elección | versión verificada | fin de soporte | motivo | alternativa descartada. Capas: runtime, framework, datos, auth, hosting, tests, lint/formato.
3. **Arquitectura**: estilo, diagrama Mermaid, árbol de carpetas, modelo de datos inicial, límites entre módulos y las decisiones de la tabla de [arquitectura.md](arquitectura.md).
4. **Principios del proyecto**: los cinco base de `docs/ARCHITECTURE.md` más los propios del dominio. Son la referencia de cada especificación futura.
5. **Calidad**: qué se testea y a qué nivel; qué ejecuta `mise run check`.
6. **Seguridad y privacidad**: modelo de amenazas, autenticación, autorización, datos personales (RGPD), secretos, dependencias y cabeceras, según [seguridad.md](seguridad.md).
7. **Operación**: entornos, despliegue, migraciones, copias de seguridad, logs y errores, secretos en producción.
8. **Documentación**: siempre README, arquitectura, ADR, especificaciones, comentarios de documentación en la API pública y CHANGELOG desde los commits. Si hay API: referencia OpenAPI generada desde el código. Si hay despliegue: runbook.
9. **Instalación**: lista exacta de lo que va a `mise.toml`, servicios locales (contenedores) y lo que, si algo, queda global.
10. **Riesgos y decisiones abiertas.**

Pide aprobación explícita e itera hasta tenerla.

### Servicios locales

Solo si el plan los necesita (Postgres, Redis, correo de pruebas…): contenedores con Colima y un `compose.yaml` en el proyecto. La aplicación corre en el Mac con mise. Nada de servicios instalados con brew.

## Fase 3. Ejecución

Plantillas: `${CLAUDE_PLUGIN_ROOT}/plantillas`. Crea una lista de tareas con estos pasos y márcalos al terminar cada uno.

### 1. Comprobaciones

```bash
command -v git mise jq claude
git config user.name && git config user.email
gh auth status        # GitLab: glab auth status
```

Si falta algo, para y dilo. Ruta por defecto: `~/Projects/<nombre>`, o la carpeta actual si es un repo vacío.

Si `jq '.attribution' ~/.claude/settings.json` no devuelve `commit: ""`, `pr: ""` y `sessionUrl: false`, aplícalo (el usuario lo pidió para siempre):

```bash
mkdir -p ~/.claude && f=~/.claude/settings.json && { [ -s "$f" ] || echo "{}" > "$f"; } && jq '.attribution = {commit: "", pr: "", sessionUrl: false}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
```

Con servicios locales, sigue [servicios.md](servicios.md) para comprobar o instalar Colima.

### 2. Scaffold y runtimes

Con la carpeta vacía, scaffold primero con versión explícita y sin git propio; después fija las herramientas. Si ya estás dentro de un repo recién creado (ver reglas), trabaja en esa carpeta: sáltate el `mkdir` y el `git init`. Si tiene un commit inicial, bórralo para que el historial empiece con el tuyo (`git update-ref -d HEAD`, y elimina el README o `.gitignore` de plantilla si los hay). Deja la rama en `main` con `git symbolic-ref HEAD refs/heads/main`.

```bash
mkdir -p ~/Projects/<nombre> && cd ~/Projects/<nombre>   # salvo repo vacío ya abierto
mise exec <tool>@<versión> -- <comando de scaffold>
mise use --pin <tool>@<versión>      # una vez por herramienta del plan
mise use --pin gitleaks@latest
mise use --pin osv-scanner@latest    # si no está en el registro: aqua:google/osv-scanner@latest
mise use --pin git-cliff@latest
mise trust
git init -b main                     # si el scaffold ya creó el repo: git branch -M main
```

Si el scaffold hizo su propio commit, borra `.git` y vuelve a `git init -b main`: el historial debe empezar con tu primer commit. Si generó `CLAUDE.md` o `AGENTS.md`, consérvalos solo como referencia local: integra su contenido en tu `CLAUDE.md` (por ejemplo `@AGENTS.md`).

### 3. Base del estándar

```bash
"${CLAUDE_PLUGIN_ROOT}/bin/taller-base" --forja github   # o gitlab; --servicios y --runbook si el plan los incluye
```

Copia sin sobrescribir: hooks de git (secretos y formato de commits), `cliff.toml` para el CHANGELOG, CI, plantilla de PR/MR, `docs/` (arquitectura, ADR, especificaciones), `CLAUDE.md`, `.claude/` (permisos, hook que bloquea commits en `main`, skill `verify`, reglas por zona en `rules/`), `.worktreeinclude`, con `--servicios` un `compose.yaml` y con `--runbook` un `docs/RUNBOOK.md`. Configura `core.hooksPath`, la exclusión local y el `.gitignore`. Lee su salida y resuelve lo que indique.

### 4. Rellenar con el plan aprobado

- `mise.toml`: añade las tareas de `${CLAUDE_PLUGIN_ROOT}/plantillas/tareas/<stack>.toml` más `version.toml` (y `servicios.toml` si hay contenedores), adaptadas al proyecto. `check` debe incluir lint, formato, tipos, tests, build, `gitleaks` y `osv-scanner`.
- Herramientas de lint, formato y test del stack como dependencias de desarrollo, con su configuración.
- Documentación de la API pública exigida por el linter cuando el stack lo permita sin ruido (por ejemplo, reglas `D` de ruff con convención Google, `revive` con `exported` en Go).
- Con API: OpenAPI generado desde el código, nunca escrito a mano (FastAPI nativo, `@fastify/swagger` o `hono-openapi` con zod, springdoc-openapi, huma en Go), servido en desarrollo y exportado a `docs/api/openapi.json` con una tarea `mise run api-docs`; `check` falla si el exportado no coincide con el código.
- `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/adr/0001-stack-y-arquitectura.md` y, con despliegue, `docs/RUNBOOK.md` con el plan aprobado. Borra las secciones que no apliquen.
- `.claude/rules/`: en cada regla, sustituye `RUTAS_*` por los patrones reales de la estructura aprobada (por ejemplo `src/**/*.test.ts`) y `COMANDO_TEST_ARCHIVO` por el comando del stack. Borra las que no apliquen y añade las del dominio. En `CLAUDE.md` solo lo que vale para todo el proyecto; lo de una zona del código va en su regla.
- Seguridad del código inicial según [seguridad.md](seguridad.md): cabeceras, validación de configuración y autenticación de librería, presentes desde el primer commit.
- `README.md`: qué es, requisitos (mise; Colima si hay servicios), arranque (`mise trust && mise install && mise run setup`) y comandos.
- `.env.example`: cada variable que necesite el proyecto, sin valores.
- GitHub: `ECOSISTEMA` en `.github/dependabot.yml`. GitLab: `VERSION_MISE` en `.gitlab-ci.yml` (salida de `mise --version`).
- Servicios: versiones de imagen verificadas en `compose.yaml`.
- Comprueba las versiones mayores actuales de las actions del CI antes de dejarlas.

No debe quedar ningún marcador:

```bash
grep -rnE 'NOMBRE|VERSION_[A-Z]+|ECOSISTEMA|AAAA-MM-DD|RUTAS_[A-Z_]+|COMANDO_TEST' --exclude-dir={.git,node_modules,.venv,target,.mise} . .claude
grep -n '<!--' CLAUDE.md docs/ARCHITECTURE.md docs/adr/0001-*.md docs/RUNBOOK.md 2>/dev/null
```

### 5. Probar las protecciones

Cada uno de estos commits debe fallar:

```bash
printf 'token=ghp_%s\n' "$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 36)" > leak-test.txt
git add leak-test.txt && git commit -m "test: gitleaks"
git rm --cached -q leak-test.txt && rm leak-test.txt
```

```bash
git commit --allow-empty -m "mensaje sin formato"
```

Si alguno pasa, para: la protección no funciona. Deshaz el commit con `git update-ref -d HEAD` si es el primero.

### 6. Activar el equipo

```bash
claude plugin install equipo@taller-dev --scope local
```

Queda registrado en `.claude/settings.local.json`, fuera de git.

### 7. Verificación local

```bash
mise run setup
mise run db       # solo con servicios
mise run check
```

Corrige hasta que pase. No sigas con errores.

### 8. Primer commit y repositorio

```bash
git add -A
git status --short     # nada de .env, node_modules, binarios, secretos ni archivos del asistente
git commit -m "chore: estructura inicial del proyecto"
```

GitHub:

```bash
gh repo create <nombre> --private --source=. --remote=origin --push
```

Si ya existe `origin` (repo creado antes, por ejemplo para Orca): `git push -u origin main` y no crees otro.

GitLab:

```bash
glab repo create <nombre> --private --defaultBranch main
git remote -v          # si no hay origin: git remote add origin <url>
git push -u origin main
```

GitHub: activa las alertas y actualizaciones de seguridad de Dependabot con los dos comandos de [seguridad.md](seguridad.md). Un repositorio privado gratuito no protege ramas: el hook de Claude hace de barrera. GitLab protege `main` por defecto.

### 9. Comprobación de limpieza

- `mise ls`: cada herramienta con origen en el `mise.toml` del proyecto.
- `npm ls -g --depth=0` (stacks Node): solo `npm` y `corepack`.
- Nada nuevo en `brew list` salvo lo aprobado.
- `git ls-files | grep -iE 'claude|agents\.md'` y `git log --format=%B | grep -i claude`: ambos vacíos.

### 10. Cierre

Resume en 8 líneas como máximo: ruta, stack, URL del repo y comandos (`mise run setup`, `mise run check`). Termina con: «Abre una sesión nueva en la carpeta del proyecto (o usa `/cd <ruta>`) para cargar su CLAUDE.md, permisos, hooks y el equipo. Para la primera funcionalidad: `/equipo:funcionalidad`.»

Añade siempre: «Si usas Orca: en Ajustes → Repositorio pon como rama base `origin/main` y como hook de preparación `mise trust && mise install && mise run setup`. Cada worktree nuevo copia `CLAUDE.md`, `.claude/` y `.env` gracias a `.worktreeinclude`.»
