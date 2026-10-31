---
paths:
  - "RUTAS_DE_TESTS"
---

# Tests

- Un comportamiento por test; nombre que describe el comportamiento esperado.
- Preparar, actuar, comprobar. Aserciones concretas, nunca solo «no lanza error».
- Deterministas: reloj, aleatoriedad y red inyectados o simulados en los unitarios. Sin `sleep`.
- Integración contra la base de datos real en contenedor, no simulada.
- Datos de prueba con factorías; nunca datos personales reales.
- Ejecutar un archivo: COMANDO_TEST_ARCHIVO
