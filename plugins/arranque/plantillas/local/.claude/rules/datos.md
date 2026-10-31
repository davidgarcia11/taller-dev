---
paths:
  - "RUTAS_DE_ESQUEMA_Y_MIGRACIONES"
---

# Datos y migraciones

- Nunca se edita una migración ya aplicada: se crea otra.
- Migraciones reversibles. Un cambio incompatible va en pasos: ampliar, migrar datos, contraer.
- Restricciones en la base de datos (únicos, no nulos, claves foráneas), no solo en código.
- Índice para cada consulta nueva sobre columnas no indexadas.
- Datos semilla sin datos personales reales.
