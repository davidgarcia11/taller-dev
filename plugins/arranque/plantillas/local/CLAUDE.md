# NOMBRE

<!-- Una frase: qué hace y para quién. -->

## Contexto

- Stack: <!-- runtime · framework · datos · auth · hosting -->. Versiones en `mise.toml`.
- Arquitectura y principios: `docs/ARCHITECTURE.md`. Decisiones: `docs/adr/`. Especificaciones: `docs/specs/`.
- Léelos antes de diseñar o cambiar estructura.

## Vocabulario del dominio

- <!-- término correcto --> (nunca "<!-- término genérico -->")

## Cómo se trabaja

- Funcionalidad nueva o cambio de comportamiento: `/equipo:funcionalidad`.
- Bug: `/equipo:arreglo`.
- Nada se programa sin especificación y plan aprobados por el usuario.
- Cambios no triviales fuera de esos flujos: modo plan y aprobación antes de tocar código.

## Reglas

- Herramientas y dependencias solo dentro del proyecto (`mise.toml` o gestor del stack). Nada global.
- Comandos del runtime con `mise exec --` o `mise run`.
- Valida entradas en los bordes con <!-- zod/pydantic/... -->.
- <!-- Reglas del dominio: "nunca hagas X" -->
- Si cambia la estructura o el stack, actualiza `docs/ARCHITECTURE.md` o añade un ADR en la misma PR.
- API pública con comentarios de documentación; OpenAPI generado desde el código si hay API; README y runbook al día en el mismo commit que los cambia.
- `CHANGELOG.md` nunca a mano: sale de los commits.
- Autoría: commits, PR, código, comentarios y docs nunca mencionan a Claude, IA ni herramientas de asistencia. Sin `Co-Authored-By`, enlaces de sesión ni «Generated with».

## Comandos

- `mise run setup`: tras clonar
- `mise run check`: lint, formato, tipos, tests, build, secretos y dependencias (igual que CI)
- `mise run changelog`: regenera el CHANGELOG · `mise run version`: prepara una versión
- <!-- arranque en desarrollo -->
- <!-- servicios locales: mise run db / mise run db:reset -->

## Flujo de git

1. Rama desde `main`: `feat/`, `fix/`, `chore/` o `docs/` + número y nombre corto.
2. Commits pequeños en conventional commits, en español.
3. `mise run check` en verde antes de cada commit.
4. `git push -u`, luego PR/MR con la plantilla del repositorio.
5. Nunca commit en `main`, merge, force push ni `--no-verify`. El merge lo hace el usuario tras revisar el diff.

## Alcance actual

<!-- Qué NO construir todavía. -->

## Decisiones abiertas

<!-- Pendientes. No asumir ninguna opción. -->
