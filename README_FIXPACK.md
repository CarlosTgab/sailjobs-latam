# SailJobs LATAM — Fixpack separación Club / Organización

## Objetivo

Este paquete separa mejor las cuentas de:

- Usuario común
- Profesional náutico
- Club náutico
- Organización náutica
- Superadmin

La diferencia principal queda así:

- **Club náutico**: yacht club, club de vela, club organizador local, sede deportiva.
- **Organización náutica**: federación, asociación de clase, organizador de eventos, escuela/academia o entidad no club.

## Archivos modificados

```txt
src/config/appConfig.js
src/utils/clubsStorage.js
src/utils/permissions.js
src/utils/supabaseAuth.js
src/utils/authStorage.js
src/pages/Signup.jsx
src/components/Navbar.jsx
src/pages/Clubs.jsx
src/pages/ClubDetail.jsx
src/pages/ClubDashboard.jsx
src/pages/OrganizationAdminDashboard.jsx
sql/2026-organization-account-separation.sql
```

## Qué cambia en la app

1. En signup ahora aparecen cuentas separadas:
   - Perfil profesional náutico
   - Cuenta personal
   - Club náutico
   - Organización náutica

2. Si el usuario elige **Club náutico**, queda como:
   - `role = club`
   - `entityType = club`
   - Dashboard principal: `/club-dashboard/:id`

3. Si el usuario elige **Organización náutica**, queda como:
   - `role = organization_admin`
   - `permissions = ["organization_admin"]`
   - `entityType = organization`
   - Dashboard principal: `/organization-admin`

4. La página `/clubs` ahora permite filtrar por:
   - Todos los tipos
   - Club náutico
   - Organización náutica

5. El panel de organización ya no se plantea como club disfrazado. Muestra:
   - Oportunidades publicadas
   - Postulaciones recibidas
   - Eventos vinculados
   - Eventos pendientes
   - Clases administradas

## Paso obligatorio en Supabase

Antes de probar una cuenta nueva de tipo **Organización náutica**, corré este SQL:

```txt
sql/2026-organization-account-separation.sql
```

Ese SQL:

- Agrega `entity_type` a `public.clubs`.
- Agrega `organization_type` a `public.clubs`.
- Actualiza el trigger de protección de perfiles.
- Agrega una versión nueva de `setup_new_account` compatible con organizaciones.

## Cómo aplicar

Desde la raíz del proyecto:

```powershell
Expand-Archive -Path .\sailjobs_entity_separation_fixpack.zip -DestinationPath . -Force
npm run build
npm run dev
```

Después corré el SQL en Supabase y probá:

1. Crear cuenta tipo Club náutico.
2. Confirmar que entra al panel del club.
3. Crear cuenta tipo Organización náutica.
4. Confirmar que entra a `/organization-admin`.
5. Ir a `/clubs` y filtrar por Club / Organización.

## Nota

Por ahora seguimos usando la tabla `public.clubs` como tabla genérica de entidades, con `entity_type = 'club'` o `entity_type = 'organization'`. Más adelante podemos migrar el nombre conceptual a `organizations`, pero no conviene hacerlo todavía porque rompería muchas rutas y relaciones ya armadas.
