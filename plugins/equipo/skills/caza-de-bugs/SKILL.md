---
name: caza-de-bugs
description: Conocimiento del agente cazabugs - técnicas para encontrar y reproducir bugs.
user-invocable: false
---

# Caza de bugs

Parte de que el código está roto y demuéstralo. Los tests existentes prueban lo que el desarrollador pensó; tú buscas lo que no pensó.

## Dónde mirar

El diff de la rama contra `main` y todo lo que interactúa con él: quién llama al código cambiado, qué datos comparte y qué flujos de usuario lo atraviesan.

## Técnicas

| Técnica | Qué probar |
|---|---|
| Valores límite | 0, 1, máximo, máximo+1, negativo, vacío, nulo o ausente, listas de un elemento y enormes |
| Texto | cadena vacía, solo espacios, muy larga, Unicode y emojis, acentos y ñ, mayúsculas, comillas, caracteres de control |
| Números y dinero | decimales y redondeo, coma decimal (formato español), divisiones por cero, desbordamiento, céntimos |
| Fechas | zonas horarias, cambio de horario, fin de mes, 29 de febrero, medianoche, fechas pasadas y futuras |
| Entradas inválidas | tipos incorrectos, campos de más o de menos, JSON mal formado, archivos vacíos, enormes o de otro tipo |
| Estados | doble envío, pasos fuera de orden, reintentos, cancelar a mitad, volver atrás, recargar, sesión caducada |
| Concurrencia | dos usuarios editando lo mismo, peticiones simultáneas, condiciones de carrera, idempotencia |
| Fallos externos | base de datos, red o API externa caída o lenta, respuesta inesperada; ¿queda el sistema consistente? |
| Integridad | duplicados, registros huérfanos, borrados en cascada, restricciones que solo existen en código |
| Permisos funcionales | acceder a datos de otro usuario o de otra empresa por ID; acciones sin el rol adecuado |
| Interfaz | flujos críticos extremo a extremo (Playwright si es web), móvil, red lenta, teclado, mensajes de error |
| Propiedades | para lógica pura, pruebas basadas en propiedades (fast-check, Hypothesis) si el stack las tiene |

Prioriza por impacto: datos y dinero primero, después permisos, después flujos principales, después el resto.

## Cómo trabajar

- Explora ejecutando: tests puntuales, la aplicación en local, scripts y peticiones contra ella. Los scripts y archivos temporales van fuera del repositorio.
- No modificas archivos del repositorio. Para y borra todo lo que arranques o crees.
- Solo reportas como bug lo que has reproducido. Lo que sospechas sin evidencia va en «Riesgos sin confirmar».

## Escala de gravedad

| Gravedad | Cuándo | Efecto |
|---|---|---|
| CRÍTICO | Pérdida o corrupción de datos, dinero mal calculado, acceso a datos ajenos, caída | Bloquea |
| ALTO | Un flujo principal falla o da un resultado incorrecto | Bloquea |
| MEDIO | Fallo en un caso poco frecuente pero realista, mensaje de error engañoso | Se corrige salvo que el usuario lo aplace |
| BAJO | Detalle menor | Se anota en la PR |

## Formato del informe

````markdown
## Veredicto: APROBADO | CAMBIOS NECESARIOS

### [GRAVEDAD] B-1. Título corto
- Dónde: `ruta/archivo.ext:línea` (causa probable)
- Reproducción: pasos o comando exactos.
- Esperado: …
- Obtenido: … (salida real)
- Test que lo reproduce (falla hoy y pasará cuando se corrija):
  ```lenguaje
  // ruta/del/test.ext
  código completo, listo para añadir
  ```

## Riesgos sin confirmar
- Sospecha, por qué y cómo se comprobaría.

## Probado sin fallos
- Técnica y área, en una línea cada una.
````

«APROBADO» solo sin críticos ni altos. El test propuesto sigue las convenciones de la suite del proyecto.
