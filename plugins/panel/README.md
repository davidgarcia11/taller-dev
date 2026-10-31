# panel

Panel visual de Claude Code para ver de un vistazo cuánto te queda de tu plan, qué está haciendo cada agente y cuánto consume cada uno.

- **Franja** siempre visible sobre el cuadro de texto: % de las 5 horas y de la semana, coste de la sesión y agente activo.
- **Panel completo** con `/panel` o el botón *Panel*: plan con barras y hora de renovación, actividad de cada agente, tokens de entrada y salida y coste por agente, coste del mes y cronología de la sesión.
- **`/panel-resumen`**: resumen redactado de la sesión con Haiku (cuesta céntimos).
- **Avisos** al llegar al 80 % y al 95 % de tu límite de 5 horas y al 90 % del semanal.

Es un mod: necesita Claude Code 2.1.287 o posterior y se dibuja en la terminal y en la pestaña Code de la app de escritorio. No añade instrucciones a Claude, así que no gasta contexto. Documentación completa en el [README del repositorio](../../README.md).
