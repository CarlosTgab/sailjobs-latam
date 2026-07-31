# SailJobs LATAM — Resumen para continuar en un chat nuevo

## 1. Estado general del proyecto

SailJobs LATAM es una SPA construida con React + Vite y desplegada en Vercel.

Ruta local habitual:

```powershell
C:\Users\gabas\Documents\proyectos\sailjobs-latam
```

URL beta:

```text
https://sailjobs-latam.vercel.app
```

Repositorio conectado a GitHub y Vercel. Vercel hace deploy automático después de cada `git push`.

Comandos habituales:

```powershell
npm run dev
npm run build

git status
git add .
git commit -m "mensaje"
git push
```

## 2. Stack utilizado

- React + Vite: frontend.
- React Router: navegación.
- Git: control de versiones local.
- GitHub: repositorio remoto.
- Vercel: hosting y despliegue.
- Supabase:
  - Authentication.
  - PostgreSQL.
  - RLS y políticas.
  - Futuro Storage para CV, logos e imágenes.
- `country-state-city`: selectores de país, provincia/estado y ciudad.
- `localStorage`: todavía funciona como caché/fallback en partes del proyecto, pero se está retirando como fuente principal.

No incluir ni compartir:

```text
.env
.env.local
```

## 3. Modelo de usuarios y permisos

### Usuario normal

- Explora oportunidades, calendario, clasificados y clubes.
- Puede publicar clasificados.
- Puede activar perfil profesional.

### Profesional náutico

- Mantiene cuenta personal.
- Tiene perfil profesional.
- Puede postularse a oportunidades.
- Ve sus postulaciones.
- Usa clasificados.

### Club náutico

- Cuenta institucional.
- Administra un club.
- Publica oportunidades.
- Recibe postulaciones.
- Propone eventos.
- No debe caer en el flujo de profesional.
- Clasificados no es sección principal.

### Organización náutica

Ejemplos:

- FAY.
- AAL / ILCA Argentina.
- Asociaciones de clase.
- Escuelas o empresas náuticas.
- Organizadores de circuitos o campeonatos.

Puede:

- Publicar eventos directamente.
- Revisar propuestas de eventos enviadas por clubes.
- Aprobar, rechazar o pedir cambios.
- Modificar eventos bajo su responsabilidad.
- Publicar oportunidades institucionales.
- Recibir postulaciones.

No debe:

- Activar perfil profesional.
- Postularse.
- Tener CV o “mis postulaciones”.
- Ser tratada como un usuario personal.

### Superadmin

Cuenta creada:

```text
superadmin@sailjobs.test
```

Rol esperado en `public.profiles`:

```text
role = superadmin
permissions = ["superadmin"]
```

Puede:

- Moderar eventos.
- Moderar oportunidades.
- Moderar clasificados.
- Ver mensajes.
- Dar de baja y restaurar contenido.
- Intervenir globalmente.

No debe:

- Activar perfil profesional.
- Postularse.
- Ser tratado como usuario común.

## 4. Navegación por rol

### Visitante / usuario / profesional

- Inicio.
- Oportunidades.
- Calendario.
- Clasificados.
- Clubes.
- Ranking.
- Sobre nosotros / Feedback.
- Mi perfil, una sola vez.

### Club

- Inicio adaptado.
- Calendario.
- Oportunidades.
- Clubes.
- Mi club.

Las acciones como publicar oportunidad, proponer evento y ver postulaciones deben vivir dentro de “Mi club”, no saturar la navbar.

### Organización

- Inicio adaptado.
- Calendario.
- Oportunidades.
- Clubes.
- Mi organización.

Las solicitudes, publicar evento, publicar oportunidad y demás acciones deben vivir dentro de “Mi organización”.

### Superadmin

- Inicio.
- Panel admin.
- Moderación de eventos, oportunidades y clasificados.
- Mensajes / feedback.

Siempre debe existir acceso a “Sobre nosotros” y “Feedback/Contacto”.

## 5. Flujo institucional de eventos

### Caso 1: club propone

```text
Club propone evento
→ elige una organización revisora
→ queda pendiente
→ organización revisa
→ aprueba, rechaza o pide cambios
→ si aprueba, se publica en el calendario
```

La organización aprobadora queda como responsable editorial del evento.

### Caso 2: organización publica directamente

```text
Organización crea evento
→ se publica directamente en calendario
```

En ambos casos, la organización responsable puede modificar el evento.

El superadmin puede intervenir globalmente, pero la aprobación institucional normal corresponde a la organización.

## 6. Calendario FAY

Existe un importador semi-automático:

```text
/admin/import-fay
```

Funcionamiento:

1. Copiar filas del calendario FAY.
2. Pegarlas en el importador.
3. Previsualizar.
4. Seleccionar.
5. Importar.

Los eventos FAY se guardan con datos similares a:

```text
source = FAY
external_source = fay
organizer_type = organization
organization_name = Federación Argentina de Yachting
status = approved
is_official = true
```

Se verificó en Supabase una fila:

```text
Evento Test Supabase
```

Eso confirmó que la importación FAY ya puede escribir en `public.events`.

## 7. Supabase: estado de migraciones

### Authentication y perfiles

Ya se usa Supabase Auth.

Tablas relevantes:

```text
profiles
professional_profiles
clubs
club_memberships
events
opportunities
applications
classifieds
contact_messages
files
```

Existen funciones/políticas/triggers como:

```text
setup_new_account
is_superadmin
can_manage_club
protect_profile_privileged_fields
set_updated_at
handle_new_user
```

Atención: el trigger `protect_profile_privileged_fields` bloqueó la conversión manual del superadmin. Se eliminó temporalmente, se actualizó el usuario y luego debía recrearse.

### Eventos

Migración aplicada para eventos online.

Se detectó inicialmente un error 400 al consultar `public.events`. Se corrigieron columnas, permisos, RLS y recarga de PostgREST.

Verificación exitosa:

```sql
select *
from public.events
order by created_at desc;
```

El evento de prueba apareció en Supabase.

### Oportunidades

Se aplicó el fixpack de oportunidades en Supabase y el usuario confirmó que funciona.

El flujo esperado:

```text
Club/organización publica
→ se guarda en Supabase
→ todos la ven
→ superadmin puede dar de baja/restaurar
```

### Postulaciones

Se aplicó el último fixpack:

```text
sailjobs_applications_supabase_fixpack.zip
```

Incluía:

```text
sql/2026-applications-online-supabase.sql
```

Pero todavía falta confirmar que:

- El SQL fue ejecutado.
- Una postulación nueva aparece en `public.applications`.
- El club/organización la ve desde otro navegador.
- El cambio de estado se sincroniza.
- El profesional ve el estado actualizado.

Query de control:

```sql
select
    id,
    user_id,
    job_id,
    job_legacy_id,
    club_id,
    organization_id,
    status,
    name,
    email,
    created_at,
    updated_at
from public.applications
order by created_at desc;
```

Este es el primer punto que debe probarse en el chat nuevo.

### Clasificados

Todavía deben migrarse completamente a Supabase.

### Archivos

CV, fotos, logos e imágenes todavía necesitan Supabase Storage real.

## 8. Ubicación

Se incorporó selección jerárquica:

```text
País
→ Provincia / Estado
→ Ciudad / Localidad
```

Archivos centrales:

```text
src/components/LocationSelects.jsx
src/components/LocationFilterSelects.jsx
```

Se usa en:

- Signup.
- Crear/editar oportunidad.
- Crear/editar evento.
- Filtros.

Campos esperados:

```text
country
countryCode
state
stateCode
city
cityName
```

## 9. Identificadores

Supabase usa UUID.

Se creó:

```text
src/utils/idUtils.js
```

Funciones:

```text
sameId
hasId
sortByNewest
```

Evitar:

```js
Number(id)
Number(jobId)
Number(clubId)
Number(userId)
```

Auditoría útil:

```powershell
Select-String -Path src\**\*.jsx,src\**\*.js -Pattern "Number\("
```

`Number(openings)` y cantidades son válidos. Conversiones de IDs no.

## 10. Interfaz y experiencia

Cambios realizados:

- Navbar dinámica por rol.
- Inicio adaptado por rol.
- Panel institucional para club.
- Panel institucional para organización.
- Panel global de superadmin.
- Eliminación de duplicaciones como “Mi perfil” + nombre clickeable.
- `ScrollToTop` para evitar que una navegación nueva abra al final.
- Modal de postulación corregido.
- CSS específico del importador FAY.

Debe mantenerse:

```text
Sobre nosotros
Feedback / Contacto
```

## 11. Archivos/fixpacks históricos relevantes

No volver a aplicar indiscriminadamente fixpacks viejos sobre el proyecto actualizado, porque pueden sobrescribir cambios posteriores.

Entre los paquetes aplicados estuvieron:

```text
sailjobs_opportunities_filters_fixpack.zip
sailjobs_events_location_fixpack.zip
sailjobs_superadmin_real_fixpack.zip
sailjobs_entity_separation_fixpack.zip
sailjobs_fay_import_fixpack.zip
sailjobs_fay_css_fixpack.zip
sailjobs_edit_events_fixpack.zip
sailjobs_organization_profile_fixpack.zip
sailjobs_event_workflow_fixpack.zip
sailjobs_events_supabase_fixpack.zip
sailjobs_role_experience_fixpack.zip
sailjobs_navbar_role_cleanup_v2_fixpack.zip
sailjobs_home_by_role_v2_fixpack.zip
sailjobs_institutional_dashboards_v2_fixpack.zip
sailjobs_profile_stability_v2_fixpack.zip
sailjobs_opportunities_supabase_fixpack.zip
sailjobs_applications_supabase_fixpack.zip
```

La fuente de verdad para continuar debe ser el ZIP completo actualizado que el usuario suba al nuevo chat, no estos paquetes antiguos.

## 12. Próximos pasos recomendados

### Paso inmediato

Validar Postulaciones en Supabase:

1. Ejecutar el SQL de postulaciones si todavía no se hizo.
2. Crear una postulación como profesional.
3. Confirmar la fila en `public.applications`.
4. Verla como club/organización desde otro navegador.
5. Cambiar su estado.
6. Confirmar que el profesional ve el cambio.

### Después

1. Migrar clasificados a Supabase.
2. Implementar Supabase Storage:
   - CV.
   - Fotos de perfil.
   - Logos.
   - Imágenes de clasificados.
3. Crear perfiles públicos diferenciados:
   - Profesional.
   - Club.
   - Organización.
4. Mejorar notificaciones y emails.
5. Configurar SMTP propio para producción.
6. Comprar dominio propio cuando la beta esté más consolidada.
7. Revisar responsive/mobile y estados de carga/error.

## 13. Costos y servicios

Actualmente puede funcionar en beta con:

```text
GitHub Free
Vercel Hobby
Supabase Free
```

Para producción/comercial probablemente se necesite:

```text
Vercel Pro
Supabase Pro
Dominio propio
Servicio SMTP/email
Storage adicional según uso
```

No transferir un proyecto vendido manteniéndolo en cuentas personales del desarrollador. El comprador debería tener sus propias cuentas de GitHub, Vercel, Supabase, dominio y email.

## 14. Cómo continuar en un chat nuevo

Subir al nuevo chat:

1. ZIP completo actualizado del proyecto.
2. Este archivo de resumen.

Mensaje inicial sugerido:

```text
Este es el proyecto completo actualizado de SailJobs LATAM y el resumen del chat anterior. Usá el ZIP como fuente de verdad. No apliques fixpacks viejos sobre él. Primero auditá el estado actual del proyecto y después continuemos validando Postulaciones en Supabase.
```
