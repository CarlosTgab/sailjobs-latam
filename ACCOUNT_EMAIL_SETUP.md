# SailJobs LATAM — activación de cuentas y emails

El código de la aplicación ya incluye:

- confirmación y reenvío de email;
- recuperación y cambio de contraseña;
- cambio seguro de email;
- finalización del perfil después de confirmar una cuenta;
- emails transaccionales de postulaciones mediante Supabase Edge Functions y Resend.

Las claves y el proveedor de correo se configuran en los paneles; nunca deben guardarse en GitHub.

## 1. Ejecutar la migración

En Supabase → SQL Editor, abrir y ejecutar:

`supabase/2026-account-and-email-foundation.sql`

El resultado esperado es `Success. No rows returned`.

## 2. Configurar las URLs de Auth

En Supabase → Authentication → URL Configuration:

- Site URL: `https://sailjobs-latam.vercel.app`
- Redirect URL de producción: `https://sailjobs-latam.vercel.app/**`
- Desarrollo local: `http://localhost:5173/**`

Para probar deployments Preview de Vercel también se puede autorizar el patrón correspondiente a las previews. Producción no depende de ese patrón.

## 3. Activar la verificación de email

En Supabase → Authentication → Providers → Email:

- mantener habilitado Email + Password;
- habilitar Confirm email;
- mantener habilitado Secure email change.

Luego, en Authentication → Email Templates, copiar:

- Confirm signup: `supabase/email-templates/confirmation.html`
- Reset password: `supabase/email-templates/recovery.html`
- Change email address: `supabase/email-templates/email-change.html`

Asuntos recomendados:

- `Confirmá tu cuenta de SailJobs LATAM`
- `Recuperá tu cuenta de SailJobs LATAM`
- `Confirmá tu nuevo email de SailJobs LATAM`

## 4. Configurar SMTP para los correos de Auth

El servicio de correo integrado de Supabase es solamente de prueba y no entrega emails libremente a usuarios externos. Antes de abrir el registro público hay que configurar un SMTP propio en Authentication → SMTP Settings.

Se puede usar Resend u otro proveedor. Verificar el dominio remitente y cargar en Supabase los datos SMTP entregados por el proveedor. No guardar la contraseña SMTP en `.env`, GitHub ni archivos del proyecto.

## 5. Desplegar los emails de postulaciones

Crear una API key en Resend y verificar el dominio remitente. Después instalar o usar Supabase CLI y ejecutar desde la raíz del proyecto:

```powershell
npx supabase login
npx supabase link --project-ref zwycpxgxvhvyblqidgrs
npx supabase functions deploy send-notification-email --no-verify-jwt
```

Crear un valor aleatorio largo para `SAILJOBS_WEBHOOK_SECRET`. Luego cargar los secretos sin pegarlos en el chat ni guardarlos en Git:

```powershell
npx supabase secrets set RESEND_API_KEY=TU_API_KEY
npx supabase secrets set "SAILJOBS_FROM_EMAIL=SailJobs LATAM <notificaciones@tu-dominio.com>"
npx supabase secrets set SAILJOBS_SITE_URL=https://sailjobs-latam.vercel.app
npx supabase secrets set SAILJOBS_WEBHOOK_SECRET=TU_SECRETO_ALEATORIO
```

## 6. Crear el Database Webhook

En Supabase → Database → Webhooks:

- Nombre: `send-notification-email`
- Tabla: `public.notifications`
- Evento: `INSERT`
- Método: `POST`
- URL: `https://zwycpxgxvhvyblqidgrs.supabase.co/functions/v1/send-notification-email`
- Header: `x-sailjobs-webhook-secret` con el mismo valor cargado en `SAILJOBS_WEBHOOK_SECRET`

La función solamente envía emails para:

- postulación enviada al postulante;
- nueva postulación al club u organización;
- cambio de estado al postulante.

Las demás notificaciones continúan siendo internas. La tabla privada `email_deliveries` evita envíos duplicados y permite revisar errores.

## 7. Configurar Vercel

Agregar en Vercel → Project Settings → Environment Variables:

`VITE_PUBLIC_SITE_URL=https://sailjobs-latam.vercel.app`

Conservar las variables existentes de Supabase. No reemplazar la clave publicable por una clave secreta.

## 8. Prueba final

1. Registrar un email nuevo y confirmar la cuenta.
2. Cerrar sesión y recuperar la contraseña.
3. Cambiar email y contraseña desde `Tu cuenta`.
4. Postularse a una oportunidad.
5. Confirmar que el postulante y el responsable reciban el email.
6. Cambiar la postulación a aceptada o rechazada y verificar el tercer correo.
