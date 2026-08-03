/*
 * SailJobs LATAM
 * Bucket privado para CVs y acceso limitado al postulante, managers
 * relacionados con una postulación y superadmins.
 *
 * Estructura de objetos: resumes/{user_id}/{uuid}-{archivo}
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'resumes',
    'resumes',
    false,
    5242880,
    array[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
)
on conflict (id)
do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists resumes_insert_own
on storage.objects;
drop policy if exists resumes_select_authorized
on storage.objects;
drop policy if exists resumes_delete_own
on storage.objects;

create policy resumes_insert_own
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy resumes_select_authorized
on storage.objects
for select
to authenticated
using (
    bucket_id = 'resumes'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_superadmin(auth.uid())
        or exists (
            select 1
            from public.applications application
            where application.user_id::text =
                (storage.foldername(storage.objects.name))[1]
              and (
                  (
                      application.club_id is not null
                      and public.can_manage_club(application.club_id, auth.uid())
                  )
                  or (
                      application.organization_id is not null
                      and public.can_manage_club(application.organization_id, auth.uid())
                  )
              )
        )
    )
);

create policy resumes_delete_own
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
