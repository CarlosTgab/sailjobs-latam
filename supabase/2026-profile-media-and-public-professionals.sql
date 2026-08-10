/*
 * SailJobs LATAM — Fase 2
 * Fotos de perfil, logos institucionales y directorio público profesional.
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

drop policy if exists resumes_insert_own on storage.objects;
drop policy if exists resumes_select_authorized on storage.objects;
drop policy if exists resumes_delete_own on storage.objects;

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

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'profile-media',
    'profile-media',
    true,
    3145728,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]::text[]
)
on conflict (id)
do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_media_select_public on storage.objects;
drop policy if exists profile_media_insert_own on storage.objects;
drop policy if exists profile_media_update_own on storage.objects;
drop policy if exists profile_media_delete_own on storage.objects;

create policy profile_media_select_public
on storage.objects
for select
to public
using (bucket_id = 'profile-media');

create policy profile_media_insert_own
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy profile_media_update_own
on storage.objects
for update
to authenticated
using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy profile_media_delete_own
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.save_my_personal_profile(
    name_param text,
    phone_param text,
    city_param text,
    country_param text,
    description_param text,
    profile_image_url_param text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
begin
    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if trim(coalesce(name_param, '')) = '' then
        raise exception 'Name is required';
    end if;

    update public.profiles
    set
        name = trim(name_param),
        phone = trim(coalesce(phone_param, '')),
        city = trim(coalesce(city_param, '')),
        country = trim(coalesce(country_param, '')),
        description = trim(coalesce(description_param, '')),
        profile_image_url = trim(coalesce(profile_image_url_param, ''))
    where id = current_user_id;
end;
$$;

revoke all on function public.save_my_personal_profile(
    text, text, text, text, text, text
) from public;

grant execute on function public.save_my_personal_profile(
    text, text, text, text, text, text
) to authenticated;

create or replace function public.save_my_entity_profile(
    entity_id_param uuid,
    name_param text,
    description_param text,
    website_param text,
    city_param text,
    country_param text,
    logo_url_param text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
begin
    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not public.can_manage_club(entity_id_param, current_user_id)
       and not public.is_superadmin(current_user_id) then
        raise exception 'Not authorized';
    end if;

    if trim(coalesce(name_param, '')) = '' then
        raise exception 'Entity name is required';
    end if;

    update public.clubs
    set
        name = trim(name_param),
        description = trim(coalesce(description_param, '')),
        website = trim(coalesce(website_param, '')),
        city = trim(coalesce(city_param, '')),
        country = trim(coalesce(country_param, '')),
        logo_url = trim(coalesce(logo_url_param, '')),
        updated_at = now()
    where id = entity_id_param;

    if not found then
        raise exception 'Entity not found';
    end if;
end;
$$;

revoke all on function public.save_my_entity_profile(
    uuid, text, text, text, text, text, text
) from public;

grant execute on function public.save_my_entity_profile(
    uuid, text, text, text, text, text, text
) to authenticated;

create or replace function public.get_public_professionals()
returns table (
    user_id uuid,
    name text,
    profile_image_url text,
    title text,
    summary text,
    specialties text[],
    certifications text[],
    experience text[],
    languages text[],
    availability text,
    city text,
    country text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        profile.id,
        coalesce(profile.name, ''),
        coalesce(profile.profile_image_url, ''),
        coalesce(professional.title, ''),
        coalesce(professional.summary, ''),
        coalesce(professional.specialties, '{}'::text[]),
        coalesce(professional.certifications, '{}'::text[]),
        coalesce(professional.experience, '{}'::text[]),
        coalesce(professional.languages, '{}'::text[]),
        coalesce(professional.availability, ''),
        coalesce(professional.city, profile.city, ''),
        coalesce(professional.country, profile.country, '')
    from public.professional_profiles professional
    join public.profiles profile
      on profile.id = professional.user_id
    join auth.users authenticated_user
      on authenticated_user.id = profile.id
    where professional.active is true
    order by profile.name asc;
$$;

revoke all on function public.get_public_professionals() from public;
grant execute on function public.get_public_professionals() to anon, authenticated;

commit;
