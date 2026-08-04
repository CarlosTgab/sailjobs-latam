/*
 * SailJobs LATAM
 * Clasificados persistentes y fotos públicas optimizadas.
 *
 * Estructura de objetos: classified-images/{user_id}/{classified_id}/{uuid}.jpg
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

create extension if not exists pgcrypto;

create table if not exists public.classifieds (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    category text not null,
    price text not null,
    club_name text not null default '',
    model_year integer,
    serial_number text not null default '',
    country text not null,
    country_code text not null default '',
    state text not null default '',
    state_code text not null default '',
    city text not null,
    city_name text not null default '',
    description text not null,
    image_paths text[] not null default '{}'::text[],
    seller_name text not null,
    seller_email text not null,
    seller_phone text not null default '',
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'active'
        check (status in ('active', 'hidden', 'deleted')),
    moderation_reason text not null default '',
    moderated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

/*
 * Una versión anterior de la aplicación podía haber creado la tabla con menos
 * columnas. CREATE TABLE IF NOT EXISTS no completa una tabla ya existente, por
 * eso agregamos cada columna de forma explícita e idempotente.
 */
alter table public.classifieds
add column if not exists title text not null default '',
add column if not exists category text not null default '',
add column if not exists price text not null default '',
add column if not exists club_name text not null default '',
add column if not exists model_year integer,
add column if not exists serial_number text not null default '',
add column if not exists country text not null default '',
add column if not exists country_code text not null default '',
add column if not exists state text not null default '',
add column if not exists state_code text not null default '',
add column if not exists city text not null default '',
add column if not exists city_name text not null default '',
add column if not exists description text not null default '',
add column if not exists image_paths text[] not null default '{}'::text[],
add column if not exists seller_name text not null default '',
add column if not exists seller_email text not null default '',
add column if not exists seller_phone text not null default '',
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists status text not null default 'active',
add column if not exists moderation_reason text not null default '',
add column if not exists moderated_at timestamptz,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

update public.classifieds
set updated_at = coalesce(created_at, now())
where updated_at is null;

alter table public.classifieds
alter column updated_at set default now(),
alter column updated_at set not null;

update public.classifieds
set category = 'Casco'
where lower(trim(category)) = 'barco';

create index if not exists classifieds_status_created_at_idx
on public.classifieds (status, created_at desc);

create index if not exists classifieds_user_id_created_at_idx
on public.classifieds (user_id, created_at desc);

alter table public.classifieds enable row level security;

drop policy if exists classifieds_select_public_owner_or_superadmin
on public.classifieds;
drop policy if exists classifieds_insert_owner
on public.classifieds;
drop policy if exists classifieds_update_owner_or_superadmin
on public.classifieds;
drop policy if exists classifieds_delete_owner_or_superadmin
on public.classifieds;

create policy classifieds_select_public_owner_or_superadmin
on public.classifieds
for select
to anon, authenticated
using (
    status = 'active'
    or user_id = auth.uid()
    or public.is_superadmin(auth.uid())
);

create policy classifieds_insert_owner
on public.classifieds
for insert
to authenticated
with check (
    user_id = auth.uid()
    and not public.is_superadmin(auth.uid())
);

create policy classifieds_update_owner_or_superadmin
on public.classifieds
for update
to authenticated
using (
    user_id = auth.uid()
    or public.is_superadmin(auth.uid())
)
with check (
    user_id = auth.uid()
    or public.is_superadmin(auth.uid())
);

create policy classifieds_delete_owner_or_superadmin
on public.classifieds
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.is_superadmin(auth.uid())
);

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'classified-images',
    'classified-images',
    true,
    5242880,
    array['image/jpeg']::text[]
)
on conflict (id)
do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists classified_images_select_public
on storage.objects;
drop policy if exists classified_images_insert_own
on storage.objects;
drop policy if exists classified_images_delete_owner_or_superadmin
on storage.objects;

create policy classified_images_select_public
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'classified-images');

create policy classified_images_insert_own
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'classified-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_superadmin(auth.uid())
);

create policy classified_images_delete_owner_or_superadmin
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'classified-images'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_superadmin(auth.uid())
    )
);

notify pgrst, 'reload schema';

commit;
