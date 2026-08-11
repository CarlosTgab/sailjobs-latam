# SailJobs LATAM — Checklist de lanzamiento

## Accesos y permisos

- Verificar inicio y cierre de sesión para usuario, profesional, club, organización y superadmin.
- Confirmar que cada entidad sólo puede modificar sus eventos, oportunidades y postulaciones.
- Confirmar que una invitación pendiente no otorga permisos y una aceptada sí.

## Eventos e inscripciones

- Crear un evento desde una organización e invitar a un club.
- Aceptar la invitación desde el club.
- Inscribir un usuario al evento, confirmar la inscripción y cancelarla.
- Revisar que los avisos aparezcan en las cuentas correspondientes.

## Oportunidades y profesionales

- Publicar una oportunidad general y otra vinculada a un evento.
- Enviar una postulación y cambiarla entre pendiente, aceptada y rechazada.
- Confirmar privacidad del teléfono y CV fuera de una postulación autorizada.

## Ranking y perfiles

- Publicar un ranking nuevo.
- Verificar vínculos automáticos de nombre exacto y vínculos manuales ambiguos.
- Abrir un perfil profesional desde el ranking y revisar su historial deportivo.

## Interfaz y publicación

- Revisar escritorio y celular en la URL principal de producción.
- Ejecutar `npm run lint` y `npm run build` antes del push final.
- Verificar que Vercel despliegue `main` y que la URL no sea una preview antigua.
