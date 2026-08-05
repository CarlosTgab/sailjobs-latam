/*
 * SailJobs LATAM
 * Permisos de postulaciones para profesionales, managers y superadmins.
 *
 * Resultado esperado:
 * - Un profesional autenticado crea, consulta y puede retirar únicamente
 *   sus propias postulaciones.
 * - El club u organización destinataria consulta y gestiona únicamente las
 *   postulaciones que le corresponden.
 * - Los superadmins pueden consultar y gestionar todas las postulaciones.
 * - Los postulantes no pueden aprobarse, rechazarse ni escribir notas
 *   internas por cuenta propia.
 *
 * Idempotente: puede ejecutarse más de una vez en Supabase SQL Editor.
 */

begin;

alter table public.applications enable row level security;

revoke all on table public.applications
from anon, authenticated;

grant select, insert, update, delete
on table public.applications
to authenticated;

/*
 * En cada alta autenticada, la identidad se toma del JWT de Supabase y no
 * del payload del navegador. Además de evitar suplantaciones, esto mantiene
 * sincronizadas las columnas user_id y applicant_id del esquema actual y el
 * esquema legado.
 */
create or replace function public.sync_application_compatibility_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        if auth.uid() is null then
            raise exception 'Authentication required';
        end if;

        new.user_id := auth.uid();
        new.applicant_id := auth.uid();
        new.status := 'pending';
        new.reviewed_by := null;
        new.reviewed_at := null;
        new.internal_notes := null;
    else
        new.user_id := coalesce(new.user_id, new.applicant_id);
        new.applicant_id := coalesce(new.applicant_id, new.user_id);
    end if;

    new.job_id := coalesce(new.job_id, new.opportunity_id);
    new.opportunity_id := coalesce(new.opportunity_id, new.job_id);

    return new;
end;
$$;

drop trigger if exists sync_application_compatibility_columns_trigger
on public.applications;

drop trigger if exists force_new_application_pending_trigger
on public.applications;

create trigger sync_application_compatibility_columns_trigger
before insert or update on public.applications
for each row
execute function public.sync_application_compatibility_columns();

/*
 * Se reemplazan todas las políticas históricas de esta tabla. PostgreSQL
 * combina políticas permisivas con OR; conservar una política antigua y
 * demasiado amplia podría anular el endurecimiento de permisos.
 */
do $$
declare
    existing_policy record;
begin
    for existing_policy in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = 'applications'
    loop
        execute format(
            'drop policy if exists %I on public.applications',
            existing_policy.policyname
        );
    end loop;
end;
$$;

create policy applications_select_authorized
on public.applications
for select
to authenticated
using (
    user_id = auth.uid()
    or applicant_id = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
    or public.is_superadmin(auth.uid())
);

create policy applications_insert_own_pending
on public.applications
for insert
to authenticated
with check (
    true
);

create policy applications_update_manager_or_superadmin
on public.applications
for update
to authenticated
using (
    (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
    or public.is_superadmin(auth.uid())
)
with check (
    (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
    or public.is_superadmin(auth.uid())
);

create policy applications_delete_authorized
on public.applications
for delete
to authenticated
using (
    user_id = auth.uid()
    or applicant_id = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
    or public.is_superadmin(auth.uid())
);

commit;
