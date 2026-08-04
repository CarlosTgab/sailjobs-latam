/*
 * SailJobs LATAM
 * Backend canónico de clasificados y fotos públicas optimizadas.
 *
 * Se usa public.classified_listings para no colisionar con una tabla
 * public.classifieds histórica que tenía otro contrato. La tabla anterior no
 * se modifica ni se elimina.
 *
 * Estructura de objetos: classified-images/{user_id}/{classified_id}/{uuid}.jpg
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

create extension if not exists pgcrypto;

create table if not exists public.classified_listings (
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
    status text not null default 'active',
    moderation_reason text not null default '',
    moderated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

/* Protección frente a una ejecución parcial o una ampliación futura. */
alter table public.classified_listings
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

update public.classified_listings
set
    category = case
        when lower(trim(category)) = 'barco' then 'Casco'
        else category
    end,
    updated_at = coalesce(updated_at, created_at, now())
where
    lower(trim(category)) = 'barco'
    or updated_at is null;

alter table public.classified_listings
alter column updated_at set default now(),
alter column updated_at set not null;

alter table public.classified_listings
drop constraint if exists classified_listings_status_check;

alter table public.classified_listings
add constraint classified_listings_status_check
check (status in ('active', 'hidden', 'deleted'));

alter table public.classified_listings
drop constraint if exists classified_listings_model_year_check;

alter table public.classified_listings
add constraint classified_listings_model_year_check
check (model_year is null or model_year between 1900 and 2200);

alter table public.classified_listings
drop constraint if exists classified_listings_image_count_check;

alter table public.classified_listings
add constraint classified_listings_image_count_check
check (cardinality(image_paths) <= 3);

create index if not exists classified_listings_status_created_at_idx
on public.classified_listings (status, created_at desc);

create index if not exists classified_listings_user_id_created_at_idx
on public.classified_listings (user_id, created_at desc);

create or replace function public.set_classified_listing_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists classified_listings_set_updated_at
on public.classified_listings;

create trigger classified_listings_set_updated_at
before update on public.classified_listings
for each row
execute function public.set_classified_listing_updated_at();

create or replace function public.can_publish_classified(
    user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = user_id
          and coalesce(role, 'user') not in (
              'admin',
              'superadmin',
              'club',
              'organization_admin'
          )
    )
    and not public.is_superadmin(user_id);
$$;

revoke all on function public.can_publish_classified(uuid)
from public;

grant execute on function public.can_publish_classified(uuid)
to authenticated;

alter table public.classified_listings enable row level security;

revoke all on table public.classified_listings
from anon, authenticated;

grant select on table public.classified_listings
to anon, authenticated;

grant insert, update, delete on table public.classified_listings
to authenticated;

drop policy if exists classified_listings_select_public_owner_or_superadmin
on public.classified_listings;
drop policy if exists classified_listings_insert_owner
on public.classified_listings;
drop policy if exists classified_listings_update_owner_or_superadmin
on public.classified_listings;
drop policy if exists classified_listings_delete_owner_or_superadmin
on public.classified_listings;

create policy classified_listings_select_public_owner_or_superadmin
on public.classified_listings
for select
to anon, authenticated
using (
    status = 'active'
    or user_id = auth.uid()
    or public.is_superadmin(auth.uid())
);

create policy classified_listings_insert_owner
on public.classified_listings
for insert
to authenticated
with check (
    user_id = auth.uid()
    and public.can_publish_classified(auth.uid())
);

create policy classified_listings_update_owner_or_superadmin
on public.classified_listings
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

create policy classified_listings_delete_owner_or_superadmin
on public.classified_listings
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
    and public.can_publish_classified(auth.uid())
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

/* Auditoría del contrato requerido por el frontend antes de confirmar. */
do $$
declare
    missing_columns text;
    policies_count integer;
    storage_policies_count integer;
begin
    select string_agg(required.column_name, ', ' order by required.column_name)
    into missing_columns
    from (
        values
            ('id'),
            ('title'),
            ('category'),
            ('price'),
            ('club_name'),
            ('model_year'),
            ('serial_number'),
            ('country'),
            ('country_code'),
            ('state'),
            ('state_code'),
            ('city'),
            ('city_name'),
            ('description'),
            ('image_paths'),
            ('seller_name'),
            ('seller_email'),
            ('seller_phone'),
            ('user_id'),
            ('status'),
            ('moderation_reason'),
            ('moderated_at'),
            ('created_at'),
            ('updated_at')
    ) as required(column_name)
    where not exists (
        select 1
        from information_schema.columns existing
        where existing.table_schema = 'public'
          and existing.table_name = 'classified_listings'
          and existing.column_name = required.column_name
    );

    if missing_columns is not null then
        raise exception
            'classified_listings: faltan columnas requeridas: %',
            missing_columns;
    end if;

    if not exists (
        select 1
        from pg_class relation
        join pg_namespace namespace
          on namespace.oid = relation.relnamespace
        where namespace.nspname = 'public'
          and relation.relname = 'classified_listings'
          and relation.relrowsecurity = true
    ) then
        raise exception
            'classified_listings: RLS no quedó habilitado';
    end if;

    select count(*)
    into policies_count
    from pg_policies
    where schemaname = 'public'
      and tablename = 'classified_listings'
      and policyname in (
          'classified_listings_select_public_owner_or_superadmin',
          'classified_listings_insert_owner',
          'classified_listings_update_owner_or_superadmin',
          'classified_listings_delete_owner_or_superadmin'
      );

    if policies_count <> 4 then
        raise exception
            'classified_listings: se esperaban 4 políticas RLS y se encontraron %',
            policies_count;
    end if;

    if not has_table_privilege(
        'anon',
        'public.classified_listings',
        'select'
    ) or not has_table_privilege(
        'authenticated',
        'public.classified_listings',
        'select'
    ) or not has_table_privilege(
        'authenticated',
        'public.classified_listings',
        'insert'
    ) or not has_table_privilege(
        'authenticated',
        'public.classified_listings',
        'update'
    ) or not has_table_privilege(
        'authenticated',
        'public.classified_listings',
        'delete'
    ) then
        raise exception
            'classified_listings: faltan permisos SQL para anon o authenticated';
    end if;

    if not exists (
        select 1
        from storage.buckets
        where id = 'classified-images'
          and public = true
          and file_size_limit = 5242880
    ) then
        raise exception
            'classified-images: el bucket no coincide con la configuración requerida';
    end if;

    select count(*)
    into storage_policies_count
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
          'classified_images_select_public',
          'classified_images_insert_own',
          'classified_images_delete_owner_or_superadmin'
      );

    if storage_policies_count <> 3 then
        raise exception
            'classified-images: se esperaban 3 políticas y se encontraron %',
            storage_policies_count;
    end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
