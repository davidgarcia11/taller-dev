---
name: control-calidad
description: Conocimiento del agente qa - comprobaciones de calidad y estabilidad con evidencia.
user-invocable: false
---

# Control de calidad

Tu trabajo es demostrar con ejecuciones reales que la rama es estable y cumple la especificación. Lo que no ejecutas no lo das por bueno.

## Comprobaciones

Ejecuta en este orden y registra comando, resultado y duración:

1. **Check completo.** `mise run check`. Cualquier fallo es CRÍTICO.
2. **Criterios de aceptación.** Para cada CA de `spec.md`, localiza los tests que lo demuestran y ejecútalos por separado. Construye la matriz CA → tests → resultado. Un criterio sin test o con un test que no lo prueba de verdad es ALTO.
3. **Cobertura de lo cambiado.** Ejecuta los tests con cobertura (vitest `--coverage`, pytest `--cov`, `go test -cover`, JaCoCo…) y mide las líneas cambiadas (`git diff main...HEAD`). Objetivo: 80 % en el código cambiado y cerca del 100 % en lógica de dominio. Por debajo, MEDIO con las ramas sin cubrir.
4. **Tests intermitentes.** Ejecuta la suite afectada tres veces seguidas (y en orden aleatorio si el runner lo permite). Cualquier diferencia entre ejecuciones es ALTO.
5. **Regresión.** La suite completa pasa, no solo los tests nuevos. Compara con `main` si un test antiguo cambia de comportamiento.
6. **Build y arranque.** El build de producción termina sin errores ni advertencias nuevas. Si es un servicio: arráncalo, comprueba que responde (salud o ruta principal) y páralo. Si es una CLI: ejecuta la ayuda y un caso real.
7. **Migraciones** (si las hay). Aplicar sobre una base limpia, revertir y volver a aplicar. Usa una base temporal, nunca la de desarrollo: con servicios locales, `docker compose exec db createdb <temporal>`, apunta la URL de conexión a ella y bórrala al terminar.
8. **Dependencias.** El lockfile está actualizado y la instalación limpia funciona (`npm ci`, `uv sync --locked`…).
9. **Requisitos no funcionales.** Si la especificación fija rendimiento o límites, mídelos con una prueba reproducible.
10. **Salida limpia.** Sin errores ni advertencias nuevas en la salida de los tests y del build.

## Reglas

- No modificas archivos del repositorio. Los artefactos temporales van fuera del repositorio y los borras al terminar.
- Para cada proceso que arranques, asegúrate de pararlo.
- Si un comando no existe en el proyecto, dilo como hallazgo en lugar de inventar uno.

## Escala de gravedad

| Gravedad | Cuándo | Efecto |
|---|---|---|
| CRÍTICO | Check en rojo, build roto, la aplicación no arranca, migración que falla | Bloquea |
| ALTO | Criterio sin test o fallando, test intermitente, regresión | Bloquea |
| MEDIO | Cobertura insuficiente en lo cambiado, advertencias nuevas | Se corrige salvo que el usuario lo aplace |
| BAJO | Mejora menor de la suite | Se anota en la PR |

## Formato del informe

```markdown
## Veredicto: APROBADO | CAMBIOS NECESARIOS

| Comprobación | Comando | Resultado |
|---|---|---|

### Criterios de aceptación
| CA | Tests | Resultado |
|---|---|---|

### [GRAVEDAD] Q-1. Título corto
- Evidencia: comando y salida relevante.
- Problema e impacto.
- Propuesta.
```

«APROBADO» solo sin críticos ni altos.
