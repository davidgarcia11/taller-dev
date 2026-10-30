---
name: codigo-limpio
description: Conocimiento del agente desarrollador - tests primero, código limpio y commits por tarea.
user-invocable: false
---

# Código limpio

## Antes de escribir

1. Lee la tarea, el plan y los criterios que cubre.
2. Lee el código que vas a tocar y su entorno: cómo se nombra, se estructura, se valida y se testea en este proyecto. Imítalo.
3. Busca si ya existe lo que necesitas (Grep por concepto y por nombre). Si existe, reutilízalo o extiéndelo. Si encuentras algo casi igual, adáptalo en lugar de duplicarlo.

## Ciclo por tarea

1. **Rojo.** Escribe el test que demuestra la tarea. Ejecútalo y comprueba que falla por el motivo esperado, no por un error de compilación o de importación.
2. **Verde.** Implementa lo mínimo para que pase.
3. **Refactor.** Mejora nombres, elimina duplicación y simplifica con los tests en verde.
4. **Check.** `mise run check` en verde.
5. **Commit.** Marca la tarea `[x]` en `tasks.md` y haz commit de todo junto: `tipo(ámbito): descripción` en español, en imperativo y en minúscula. Un commit por tarea.

## Código

- Nombres que revelan intención, con el vocabulario del dominio de `CLAUDE.md`. Sin abreviaturas ambiguas.
- Funciones pequeñas que hacen una cosa. Cláusulas de guarda en lugar de anidar.
- Sin números ni cadenas mágicas: constantes con nombre.
- Inmutabilidad por defecto. Sin estado global mutable.
- Tipado estricto: sin `any`, `Object`, `interface{}` o equivalentes salvo en bordes justificados.
- Comentarios en el cuerpo del código solo para explicar por qué, nunca qué. Sin código comentado, `console.log`, `print` de depuración ni `TODO` sin issue.
- Sin abstracciones especulativas: ni interfaces con una sola implementación, ni parámetros «por si acaso».
- Sin dependencias nuevas fuera del plan.

## Documentación

- **API pública documentada.** Todo lo que otro módulo usa (funciones y clases exportadas, endpoints, componentes compartidos, comandos de CLI) lleva comentario de documentación en el formato del stack: TSDoc/JSDoc, docstrings con la convención del proyecto, Javadoc o comentarios de Go. Contenido: qué hace y para qué, parámetros y retorno cuando no son evidentes por el tipo, errores que lanza y un ejemplo si el uso no es obvio. Sin repetir lo que ya dice la firma.
- **Código interno**: sin comentarios de documentación obligatorios; nombres claros.
- **OpenAPI** (si el proyecto tiene API): los contratos salen del código y sus esquemas (descripciones, ejemplos y respuestas de error incluidos). Si cambia un contrato, regenera la referencia con `mise run api-docs` en el mismo commit.
- **README y runbook**: si la tarea cambia comandos, configuración, variables de entorno o el despliegue, actualízalos en el mismo commit.
- **CHANGELOG**: nunca a mano. Se genera de los commits, así que el mensaje del commit es la entrada del CHANGELOG: escríbelo para quien lo lea al publicar una versión.

## Errores y entradas

- Valida toda entrada externa en el borde con el esquema del proyecto y rechaza con un error claro.
- Nunca tragues una excepción. Captura solo lo que sabes manejar; el resto, propágalo con contexto.
- Errores de dominio con tipo propio y mensaje útil para quien los recibe. Sin trazas internas hacia el usuario.
- Operaciones que modifican varios datos: en una transacción, o idempotentes si no es posible.
- Nada de secretos ni datos personales en código, logs o mensajes de error.

## Tests

- Prueban comportamiento observable, no detalles de implementación.
- Un comportamiento por test. Nombre que describe el comportamiento esperado.
- Preparar, actuar, comprobar. Aserciones concretas, nunca solo «no lanza error».
- Deterministas: reloj, aleatoriedad, red y servicios externos inyectados o simulados en los unitarios. Sin `sleep`.
- Incluye los casos límite y de error del plan, no solo el camino feliz.
- Datos de prueba con factorías o constructores, sin datos personales reales.

## Interfaz (si aplica)

- Accesible: etiquetas en formularios, navegación con teclado, foco visible, contraste suficiente, textos alternativos.
- Estados de carga, vacío y error en cada vista que dependa de datos.
- Usable en móvil si el producto se usa en móvil.

## Límites

- Si el plan es imposible, contradictorio o requiere una decisión de diseño no prevista, para y explícalo en tu mensaje final. No improvises arquitectura.
- Nunca commit en `main`, `--no-verify` ni cambios fuera del alcance de la tarea.
- Nunca menciones a Claude, IA ni asistentes en commits, código o comentarios.

## Salida

Mensaje final con: tareas completadas y sus commits, desviaciones del plan y su motivo, y cualquier riesgo detectado.
