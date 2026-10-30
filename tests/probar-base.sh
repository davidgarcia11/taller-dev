#!/usr/bin/env bash
# Prueba taller-base y los hooks de las plantillas en un repositorio temporal.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fallos=0
ok()    { printf '  \033[32m✓\033[0m %s\n' "$1"; }
falla() { printf '  \033[31m✗\033[0m %s\n' "$1"; fallos=$((fallos + 1)); }
comprueba() { if eval "$2"; then ok "$1"; else falla "$1"; fi; }

# mise falso: el hook pre-commit lo invoca para gitleaks.
mkdir -p "$tmp/bin"
printf '#!/bin/sh\nexit 0\n' > "$tmp/bin/mise"
chmod +x "$tmp/bin/mise"
export PATH="$tmp/bin:$PATH"

repo="$tmp/repo"
git init -q -b main "$repo"
cd "$repo"
git config user.email prueba@example.com
git config user.name Prueba

echo "taller-base"
"$raiz/plugins/arranque/bin/taller-base" --forja github --servicios > "$tmp/salida.txt"
comprueba "crea los hooks de git" "[ -x .githooks/pre-commit ] && [ -x .githooks/commit-msg ]"
comprueba "configura core.hooksPath" "[ \"\$(git config core.hooksPath)\" = .githooks ]"
comprueba "crea CI, docs y compose" "[ -f .github/workflows/ci.yml ] && [ -f docs/ARCHITECTURE.md ] && [ -f compose.yaml ]"
comprueba "excluye los archivos del asistente" "git check-ignore -q CLAUDE.md && git check-ignore -q .claude/settings.json && git check-ignore -q .worktreeinclude"
comprueba "no muestra archivos del asistente en git status" "! git status --porcelain | grep -qiE 'claude|worktreeinclude'"
"$raiz/plugins/arranque/bin/taller-base" --forja github > "$tmp/salida2.txt"
comprueba "es idempotente" "! grep -q Creados \"$tmp/salida2.txt\" && [ \"\$(grep -cxF CLAUDE.md .git/info/exclude)\" = 1 ]"

echo "commit-msg"
intenta() { git commit -q --allow-empty -m "$1" 2>/dev/null; }
comprueba "rechaza un mensaje sin formato" "! intenta 'mensaje sin formato'"
comprueba "rechaza un tipo en mayúscula" "! intenta 'Feat: algo'"
comprueba "acepta conventional commits" "intenta 'feat(api): añade endpoint'"
comprueba "acepta cambios incompatibles" "intenta 'fix(auth)!: corrige sesión'"
printf 'feat: con autoría\n\nCuerpo.\n\nCo-Authored-By: Asistente <a@example.com>\nAlgo-Session: https://example.com/x\n\nGenerated with [Herramienta](https://example.com)\n' |
  git commit -q --allow-empty -F -
comprueba "elimina trailers de autoría" "! git log -1 --format=%B | grep -qiE 'co-authored|session:|generated with'"

echo "no-commit-main"
comprueba "bloquea commits en main con historial" "! echo '{\"cwd\":\"$repo\"}' | bash .claude/hooks/no-commit-main.sh 2>/dev/null"
git switch -q -c feat/prueba
comprueba "permite commits en una rama" "echo '{\"cwd\":\"$repo\"}' | bash .claude/hooks/no-commit-main.sh"

echo
if [ "$fallos" -eq 0 ]; then echo "Todo correcto."; else echo "$fallos comprobaciones fallidas."; exit 1; fi
