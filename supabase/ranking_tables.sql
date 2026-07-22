create extension if not exists pgcrypto;

create or replace function public.is_superadmin(user_id uuid default auth.uid())
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
          and (
            role in ('superadmin', 'admin')
            or 'superadmin' = any(coalesce(permissions, array[]::text[]))
          )
    );
$$;

create table if not exists public.ranking_imports (
    id uuid primary key default gen_random_uuid(),
    title text not null default 'Ranking',
    source_file_name text,
    source_url text,
    source_type text not null default 'file',
    imported_by uuid references auth.users(id) on delete set null,
    status text not null default 'published',
    is_active boolean not null default true,
    row_count integer not null default 0,
    created_at timestamptz not null default now()
);

alter table public.ranking_imports
add column if not exists source_url text;

alter table public.ranking_imports
add column if not exists source_type text not null default 'file';

create table if not exists public.ranking_entries (
    id uuid primary key default gen_random_uuid(),
    import_id uuid not null references public.ranking_imports(id) on delete cascade,
    class_name text not null,
    position integer not null,
    last_name text,
    first_name text,
    full_name text not null,
    club text,
    category text,
    net_points numeric,
    total_points numeric,
    events integer not null default 0,
    raw jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.ranking_sources (
    id uuid primary key default gen_random_uuid(),
    name text not null default 'Ranking externo',
    source_url text not null,
    source_type text not null default 'url',
    is_active boolean not null default true,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ranking_imports_active_idx
on public.ranking_imports (is_active, status, created_at desc);

create index if not exists ranking_entries_import_class_position_idx
on public.ranking_entries (import_id, class_name, position);

create index if not exists ranking_sources_active_idx
on public.ranking_sources (is_active, updated_at desc);

alter table public.ranking_imports enable row level security;
alter table public.ranking_entries enable row level security;
alter table public.ranking_sources enable row level security;

drop policy if exists "Public can read active ranking imports" on public.ranking_imports;
create policy "Public can read active ranking imports"
on public.ranking_imports
for select
to anon, authenticated
using (
    status = 'published'
    and is_active = true
);

drop policy if exists "Public can read active ranking entries" on public.ranking_entries;
create policy "Public can read active ranking entries"
on public.ranking_entries
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.ranking_imports ri
        where ri.id = ranking_entries.import_id
          and ri.status = 'published'
          and ri.is_active = true
    )
);

drop policy if exists "Public can read active ranking sources" on public.ranking_sources;
create policy "Public can read active ranking sources"
on public.ranking_sources
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Superadmins manage ranking imports" on public.ranking_imports;
create policy "Superadmins manage ranking imports"
on public.ranking_imports
for all
to authenticated
using (public.is_superadmin(auth.uid()))
with check (public.is_superadmin(auth.uid()));

drop policy if exists "Superadmins manage ranking entries" on public.ranking_entries;
create policy "Superadmins manage ranking entries"
on public.ranking_entries
for all
to authenticated
using (public.is_superadmin(auth.uid()))
with check (public.is_superadmin(auth.uid()));

drop policy if exists "Superadmins manage ranking sources" on public.ranking_sources;
create policy "Superadmins manage ranking sources"
on public.ranking_sources
for all
to authenticated
using (public.is_superadmin(auth.uid()))
with check (public.is_superadmin(auth.uid()));

create or replace function public.upsert_ranking_source(
    source_name_param text,
    source_url_param text,
    source_type_param text default 'url'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    source_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Tenés que iniciar sesión para guardar la fuente del ranking.';
    end if;

    if not public.is_superadmin(auth.uid()) then
        raise exception 'Solo un superadmin puede guardar la fuente del ranking.';
    end if;

    if nullif(trim(source_url_param), '') is null then
        raise exception 'La URL de la fuente no puede estar vacía.';
    end if;

    update public.ranking_sources
    set is_active = false
    where is_active = true;

    insert into public.ranking_sources (
        name,
        source_url,
        source_type,
        is_active,
        created_by,
        updated_at
    )
    values (
        coalesce(nullif(trim(source_name_param), ''), 'Ranking externo'),
        trim(source_url_param),
        coalesce(nullif(trim(source_type_param), ''), 'url'),
        true,
        auth.uid(),
        now()
    )
    returning id into source_id;

    return source_id;
end;
$$;

create or replace function public.publish_ranking_import_v2(
    import_title_param text,
    source_file_name_param text,
    source_url_param text,
    source_type_param text,
    entries_param jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    new_import_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Tenés que iniciar sesión para publicar ranking.';
    end if;

    if not public.is_superadmin(auth.uid()) then
        raise exception 'Solo un superadmin puede publicar ranking.';
    end if;

    if entries_param is null or jsonb_typeof(entries_param) <> 'array' or jsonb_array_length(entries_param) = 0 then
        raise exception 'No hay registros para importar.';
    end if;

    update public.ranking_imports
    set is_active = false
    where is_active = true;

    insert into public.ranking_imports (
        title,
        source_file_name,
        source_url,
        source_type,
        imported_by,
        status,
        is_active,
        row_count
    )
    values (
        coalesce(nullif(trim(import_title_param), ''), 'Ranking'),
        nullif(trim(source_file_name_param), ''),
        nullif(trim(source_url_param), ''),
        coalesce(nullif(trim(source_type_param), ''), 'file'),
        auth.uid(),
        'published',
        true,
        jsonb_array_length(entries_param)
    )
    returning id into new_import_id;

    insert into public.ranking_entries (
        import_id,
        class_name,
        position,
        last_name,
        first_name,
        full_name,
        club,
        category,
        net_points,
        total_points,
        events,
        raw
    )
    select
        new_import_id,
        nullif(trim(entry.class_name), ''),
        entry.position,
        nullif(trim(entry.last_name), ''),
        nullif(trim(entry.first_name), ''),
        nullif(trim(entry.full_name), ''),
        nullif(trim(entry.club), ''),
        nullif(trim(entry.category), ''),
        entry.net_points,
        entry.total_points,
        coalesce(entry.events, 0),
        coalesce(entry.raw, '{}'::jsonb)
    from jsonb_to_recordset(entries_param) as entry(
        class_name text,
        position integer,
        last_name text,
        first_name text,
        full_name text,
        club text,
        category text,
        net_points numeric,
        total_points numeric,
        events integer,
        raw jsonb
    )
    where
        nullif(trim(entry.class_name), '') is not null
        and entry.position is not null
        and nullif(trim(entry.full_name), '') is not null;

    update public.ranking_imports
    set row_count = (
        select count(*)
        from public.ranking_entries
        where import_id = new_import_id
    )
    where id = new_import_id;

    return new_import_id;
end;
$$;

grant execute on function public.upsert_ranking_source(text, text, text) to authenticated;
grant execute on function public.publish_ranking_import_v2(text, text, text, text, jsonb) to authenticated;
