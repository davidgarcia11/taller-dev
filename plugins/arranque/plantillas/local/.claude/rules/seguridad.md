---
paths:
  - "RUTAS_SENSIBLES"
---

# Zonas sensibles

Autenticación, permisos, pagos y datos personales.

- Usa la librería de autenticación del proyecto; nada de criptografía ni sesiones hechas a mano.
- Denegar por defecto: cada permiso nuevo se concede de forma explícita y se prueba que se deniega a quien no lo tiene.
- Comparaciones de secretos en tiempo constante; tokens con aleatoriedad criptográfica.
- Al cambiar contraseña o permisos, invalida las sesiones afectadas.
- Cada cambio en esta zona lleva tests de acceso permitido y denegado.
