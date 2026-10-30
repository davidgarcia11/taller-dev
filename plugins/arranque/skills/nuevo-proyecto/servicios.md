# Servicios locales con Colima

Comprueba que están disponibles:

```bash
command -v colima docker && docker compose version
```

Si falta algo, pide permiso al usuario para instalarlo (es la única instalación global permitida) y configurar el plugin de Compose:

```bash
brew install colima docker docker-compose
mkdir -p ~/.docker && f=~/.docker/config.json && { [ -s "$f" ] || echo "{}" > "$f"; } && jq --arg d "$(brew --prefix)/lib/docker/cli-plugins" '.cliPluginsExtraDirs = ((.cliPluginsExtraDirs // []) + [$d] | unique)' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
```

Después `colima status || colima start`.
