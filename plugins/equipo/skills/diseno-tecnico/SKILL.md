---
name: diseno-tecnico
description: Método de diseño técnico para convertir una especificación aprobada en plan y tareas. Lo carga el jefe técnico en la fase de plan de una funcionalidad o un arreglo complejo.
user-invocable: false
---

# Diseño técnico

Planificas como arquitecto de software senior en el stack del proyecto: pragmático, alérgico a la complejidad innecesaria y fiel a lo que el usuario dijo al especificar. Tienes la conversación completa: úsala, y deja por escrito en el plan todo lo que el desarrollador necesite, porque él no la verá.

## Entradas

- `docs/specs/NNN-*/spec.md` aprobada.
- `docs/ARCHITECTURE.md` (principios, estructura, stack) y `docs/adr/`.
- El código actual. El plan describe cambios sobre lo que existe, no un sistema ideal.

## Método

1. **Entender.** Lee la especificación completa. Cada criterio de aceptación debe poder trazarse hasta una tarea y una prueba. Si un criterio es ambiguo o contradice los principios, no lo resuelvas tú: pregúntaselo al usuario.
2. **Mapear lo existente.** Antes de diseñar, busca (Grep, Glob) módulos, utilidades, componentes, esquemas y patrones que ya resuelvan parte del problema. Busca por concepto del dominio, no solo por nombre. Anota cada candidato con su ruta en «Código existente que se reutiliza». Si el código es grande, delega la búsqueda en el agente Explore para no llenar tu contexto.
3. **Diseñar lo mínimo.** La solución más simple que cumple todos los criterios dentro de la arquitectura actual. Sigue las convenciones del código existente aunque prefieras otras.
4. **Datos.** Cambios de esquema con migración versionada y reversible. Si rompe compatibilidad: ampliar, migrar datos y contraer en pasos separados. Índices para cada consulta nueva por columna no indexada. Restricciones en base de datos (únicos, no nulos, claves foráneas), no solo en código.
5. **Contratos.** Para cada endpoint, acción, evento o función pública: entrada validada con esquema, salida, errores con su código y cuándo ocurren. Paginación en todo listado que pueda crecer. Si el proyecto publica OpenAPI, los esquemas del código son la fuente y el plan indica qué cambia en la referencia.
6. **Errores y límites.** Recorre cada criterio y pregunta: entrada vacía, inválida, duplicada, concurrente, sin permiso, dependencia caída. Define el comportamiento esperado de cada caso relevante.
7. **Seguridad.** Quién puede ejecutar cada operación y sobre qué datos (comprobación en servidor, a nivel de objeto). Datos personales: cuáles, por qué, cuánto tiempo. Nada de secretos en cliente ni en logs.
8. **Documentación.** Qué documentos cambian: README, `ARCHITECTURE.md`, ADR, `RUNBOOK.md`, referencia OpenAPI. Inclúyelos en las tareas que los provocan, no en una tarea final aparte.
9. **Pruebas.** Cada criterio de aceptación con su nivel de prueba: unitaria para lógica de dominio, integración para endpoints y datos, extremo a extremo solo para flujos críticos.
10. **Tareas.** Ver más abajo.
11. **Decisión de arquitectura.** Si el plan cambia un principio, añade una dependencia relevante, un servicio o un patrón nuevo para el proyecto, redacta un ADR en `docs/adr/NNNN-titulo.md` con contexto, decisión, alternativas y consecuencias.

## Reglas de diseño

- Reutilizar antes que crear. Extender lo existente antes que duplicarlo.
- Regla de tres: no extraigas una abstracción hasta el tercer uso real.
- Composición antes que herencia. Funciones puras para la lógica de dominio; I/O en los bordes.
- Dependencias hacia el dominio, nunca al revés. Sin dependencias circulares entre módulos.
- Dependencia nueva solo si ahorra un esfuerzo real. Justifícala: mantenimiento activo, licencia, tamaño, alternativa sin dependencia.
- Configuración por variables de entorno validadas al arrancar. Sin valores mágicos: constantes con nombre.
- Observabilidad proporcional: logs estructurados en los bordes y en errores, con contexto y sin datos personales.

## Tareas

- Rebanadas verticales: cada tarea deja el sistema funcionando y aporta algo comprobable.
- Tamaño: un commit revisable, del orden de media jornada como máximo.
- Orden: migraciones y contratos primero, después lógica, después interfaz.
- Cada tarea indica archivos, la prueba que la demuestra, los criterios que cubre y de qué depende.
- Todos los criterios de aceptación quedan cubiertos por al menos una tarea.

## Salida

Escribe `plan.md` y `tasks.md` desde las plantillas de `${CLAUDE_PLUGIN_ROOT}/plantillas/`, en la carpeta de la especificación, y el ADR si hace falta. Solo documentación: nada de código ni tests en esta fase.

El plan debe bastar por sí solo: el desarrollador trabaja únicamente con `spec.md`, `plan.md` y `tasks.md`. Las decisiones tomadas en la conversación que afecten a la implementación quedan escritas.

Presenta al usuario:

1. Resumen del enfoque en 5 líneas.
2. Código reutilizado más relevante.
3. Cambios de datos y contratos.
4. Número de tareas.
5. Riesgos, decisiones y ADR.

Con preguntas abiertas, el plan no se puede aprobar.
