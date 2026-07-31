/*
 * SailJobs LATAM
 * Compatibilidad de postulaciones: esquema legado + frontend actual
 *
 * Este script es idempotente y refleja la corrección validada en Supabase
 * el 2026-07-30.
 */

begin;

/*
 * El frontend actual usa user_id y job_id/job_legacy_id. Las columnas
 * heredadas se conservan para compatibilidad, pero ya no bloquean inserts.
 */
alter table public.applications
    alter column opportunity_id drop not null,
    alter column applicant_id drop not null,
    alter column club_id drop not null,
    alter column status set default 'pending';

/*
 * Completa ambas representaciones cuando existan filas anteriores.
 */
update public.applications
set
    user_id = coalesce(user_id, applicant_id),
    applicant_id = coalesce(applicant_id, user_id),
    job_id = coalesce(job_id, opportunity_id),
    opportunity_id = coalesce(opportunity_id, job_id)
where user_id is null
   or applicant_id is null
   or job_id is null
   or opportunity_id is null;

create or replace function public.sync_application_compatibility_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.user_id := coalesce(new.user_id, new.applicant_id);
    new.applicant_id := coalesce(new.applicant_id, new.user_id);
    new.job_id := coalesce(new.job_id, new.opportunity_id);
    new.opportunity_id := coalesce(new.opportunity_id, new.job_id);

    return new;
end;
$$;

drop trigger if exists sync_application_compatibility_columns_trigger
on public.applications;

create trigger sync_application_compatibility_columns_trigger
before insert or update on public.applications
for each row
execute function public.sync_application_compatibility_columns();

alter table public.applications
    drop constraint if exists applications_job_reference_check;

alter table public.applications
    add constraint applications_job_reference_check
    check (
        job_id is not null
        or nullif(btrim(job_legacy_id), '') is not null
    );

commit;
