---
name: actualizar-proyecto
description: Pone al día un proyecto que ya sigue el estándar con las mejoras de la última versión de las plantillas - reglas, hooks, CI, permisos y documentos base - sin borrar ni cambiar lo que el proyecto ya tiene. Usar cuando el usuario actualice los plugins y quiera llevar las novedades a un proyecto existente, o pida poner al día el estándar de un proyecto.
argument-hint: "[ruta del proyecto]"
---

# Actualizar proyecto

Llevas a un proyecto las novedades del estándar. Solo añades lo que falta: nunca borras, nunca sustituyes un archivo entero y nunca cambias una línea que el proyecto haya adaptado sin enseñársela al usuario.

## 1. Comprobar

```bash
git status --porcelain          # si no está vacío, para y pregunta
test -f CLAUDE.md && test -d .githooks && test -d .claude/rules && echo estandar || echo sin-estandar
git remote get-url origin       # github o gitlab
```

Si sale `sin-estandar`, el proyecto nunca se adaptó: propón `/arranque:adaptar-proyecto` y para.

## 2. Generar la referencia

Genera la base actual en una carpeta temporal, con las mismas opciones que el proyecto (`--servicios` si tiene `compose.yaml`, `--runbook` si tiene `docs/RUNBOOK.md`):

```bash
ref="$(mktemp -d)" && git -C "$ref" init -q
"${CLAUDE_PLUGIN_ROOT}/bin/taller-base" --forja <github|gitlab> [--servicios] [--runbook] --dir "$ref"
```

Las tareas de mise de referencia están en `${CLAUDE_PLUGIN_ROOT}/plantillas/tareas/<stack>.toml` y `version.toml`.

## 3. Comparar

Recorre cada archivo de `$ref` (sin `.git/`) frente al del proyecto:

| Caso | Qué propones |
|---|---|
| Falta en el proyecto | Crearlo, rellenando los marcadores en MAYÚSCULAS con los datos reales del proyecto |
| `.claude/rules/*.md`, `CLAUDE.md` | Solo las reglas de la referencia que no estén ya, con estas u otras palabras. Ignora marcadores, ejemplos y lo que el proyecto ha concretado |
| `.claude/settings.json` | Entradas de `allow` y `deny` y hooks que falten. Nunca quitar una entrada del proyecto |
| `.githooks/*`, `.claude/hooks/*` | Si difieren, el diff completo y si el cambio del proyecto parece intencionado |
| CI, plantillas de PR, `cliff.toml`, `dependabot.yml` | Lo que falte de la referencia, adaptado al stack y a los comandos del proyecto |
| `docs/` | Solo secciones que falten en los documentos base. Nunca reescribir contenido del proyecto |
| `mise.toml` | Tareas de la referencia que no existan; sin tocar las versiones fijadas |
| `.worktreeinclude`, `.gitignore`, `.git/info/exclude` | Líneas que falten |

Si el proyecto tiene base de datos y sus tests usan la de desarrollo, propón la base de tests separada: el script de `docker/postgres/`, el montaje en `compose.yaml`, la variable de los tests y la creación manual de la base en el volumen existente (`docker compose exec db createdb -U <usuario> <base>_test`), porque el script solo se ejecuta con un volumen nuevo.

Comprueba además que `git config core.hooksPath` es `.githooks` y que ningún archivo del asistente está en git (`git ls-files | grep -iE 'claude|agents\.md|worktreeinclude'`).

## 4. Proponer

Presenta una tabla por archivo con qué falta y la propuesta, y separa:

- **Local** (`CLAUDE.md`, `.claude/`, `.worktreeinclude`): no llega a git.
- **Repositorio** (hooks, CI, docs, `mise.toml`…): irá en una rama con PR.

Pregunta con AskUserQuestion qué se aplica; permite elegir por archivo. Si no falta nada, dilo y termina.

## 5. Aplicar

1. Lo local aprobado, directamente. Si estás en un worktree, aplícalo en la copia principal (`dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`), que es de donde copian las tareas nuevas, y también en el worktree actual. Mejor aún, ejecuta este comando desde la copia principal.
2. Lo del repositorio aprobado, en una rama:
   - En la copia principal: `git switch main && git pull --ff-only && git switch -c chore/actualizar-estandar`.
   - En un worktree: no cambies a `main`; `git fetch origin`, y si la rama actual no tiene commits propios, `git reset --hard origin/main` y `git branch -m chore/actualizar-estandar`.
3. Commits lógicos (`chore: …`, `ci: …`, `docs: …`), `mise run check` en verde, push y PR con la plantilla del proyecto. Nada menciona a Claude, IA ni asistentes. El merge lo hace el usuario.
4. Borra la carpeta temporal: `rm -rf "$ref"`.

## Cierre

En 5 líneas como máximo: qué se añadió en local, URL de la PR si la hay y lo que el usuario dejó fuera. Termina con: «Abre una sesión nueva para cargar las reglas actualizadas».
