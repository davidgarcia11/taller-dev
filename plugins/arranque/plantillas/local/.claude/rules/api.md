---
paths:
  - "RUTAS_DE_API"
---

# API

- Toda entrada se valida con el esquema del proyecto antes de usarla; si no valida, error 400 con el formato común.
- Cada operación comprueba en servidor quién la pide y si puede actuar sobre ese recurso concreto (no solo el rol).
- Formato de error único: código estable, mensaje legible, sin trazas internas.
- Listados siempre paginados con límite máximo.
- Los esquemas del código son la fuente de OpenAPI: descripción, ejemplos y respuestas de error en cada endpoint.
- Nada de datos personales, tokens ni contraseñas en logs.
