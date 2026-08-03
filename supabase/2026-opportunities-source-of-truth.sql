/*
 * SailJobs LATAM
 * Oportunidades persistentes y políticas mínimas de lanzamiento.
 * Idempotente: puede ejecutarse más de una vez en Supabase SQL Editor.
 */

begin;

create extension if not exists pgcrypto;

create table if not exists public.opportunities (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    title text not null,
    category text not null default 'Coach',
    club_id uuid,
    club_name text,
    organization_id uuid,
    organization_name text,
    owner_type text not null default 'club',
    owner_id uuid,
    owner_name text,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    opportunity_type text not null default 'employment',
    compensation_type text not null default 'to_confirm',
    compensation_details text,
    salary text,
    country text,
    country_code text,
    state text,
    state_code text,
    city text,
    city_name text,
    duration text,
    openings integer not null default 1,
    application_deadline date,
    event_id uuid,
    eligible_profiles text[] not null default array['professional']::text[],
    description text,
    requirements text[] not null default '{}'::text[],
    apply_link text,
    website text,
    status text not null default 'published',
    moderation_reason text,
    moderated_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint opportunities_openings_positive check (openings > 0)
);

alter table public.opportunities
    add column if not exists legacy_id text,
    add column if not exists title text,
    add column if not exists category text default 'Coach',
    add column if not exists club_id uuid,
    add column if not exists club_name text,
    add column if not exists organization_id uuid,
    add column if not exists organization_name text,
    add column if not exists owner_type text default 'club',
    add column if not exists owner_id uuid,
    add column if not exists owner_name text,
    add column if not exists created_by uuid references auth.users(id) on delete set null,
    add column if not exists updated_by uuid references auth.users(id) on delete set null,
    add column if not exists opportunity_type text default 'employment',
    add column if not exists compensation_type text default 'to_confirm',
    add column if not exists compensation_details text,
    add column if not exists salary text,
    add column if not exists country text,
    add column if not exists country_code text,
    add column if not exists state text,
    add column if not exists state_code text,
    add column if not exists city text,
    add column if not exists city_name text,
    add column if not exists duration text,
    add column if not exists openings integer default 1,
    add column if not exists application_deadline date,
    add column if not exists event_id uuid,
    add column if not exists eligible_profiles text[] default array['professional']::text[],
    add column if not exists description text,
    add column if not exists requirements text[] default '{}'::text[],
    add column if not exists apply_link text,
    add column if not exists website text,
    add column if not exists status text default 'published',
    add column if not exists moderation_reason text,
    add column if not exists moderated_at timestamptz,
    add column if not exists metadata jsonb default '{}'::jsonb,
    add column if not exists created_at timestamptz default now(),
    add column if not exists updated_at timestamptz default now();

create unique index if not exists opportunities_legacy_id_unique
on public.opportunities (legacy_id)
where legacy_id is not null;

create index if not exists opportunities_status_created_at_idx
on public.opportunities (status, created_at desc);

create index if not exists opportunities_created_by_idx
on public.opportunities (created_by);

create or replace function public.set_opportunities_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists set_opportunities_updated_at_trigger
on public.opportunities;

create trigger set_opportunities_updated_at_trigger
before update on public.opportunities
for each row
execute function public.set_opportunities_updated_at();

alter table public.opportunities enable row level security;

alter table public.opportunities
    alter column status set default 'published';

/*
 * Las políticas de lanzamiento se aplican en una migración separada para que
 * puedan auditarse y probarse sin mezclar el cambio con la carga inicial.
 */

/* Datos iniciales que antes vivían solamente en src/data/jobs.js. */
insert into public.opportunities (
    legacy_id, title, category, club_id, club_name, owner_type, owner_name,
    opportunity_type, compensation_type, compensation_details, salary,
    country, city, city_name, duration, openings, eligible_profiles,
    description, requirements, status, metadata
)
values
    (
        'seed-coach-ilca-ycu', 'Coach ILCA', 'Coach',
        (select id from public.clubs where name = 'Club Test SailJobs' order by created_at limit 1),
        'Club Test SailJobs', 'club', 'Club Test SailJobs',
        'employment', 'paid', 'USD 1800/mes', 'USD 1800/mes',
        'Uruguay', 'Montevideo', 'Montevideo', '6 meses', 1,
        array['professional']::text[],
        'Buscamos entrenador para programa juvenil de ILCA.',
        array['Experiencia internacional', 'Disponibilidad para viajar', 'Inglés intermedio']::text[],
        'published', '{"is_demo": true, "demo_original_club": "Yacht Club Uruguayo"}'::jsonb
    ),
    (
        'seed-coach-optimist-barlovento', 'Coach Optimist', 'Coach',
        (select id from public.clubs where name = 'Club Test SailJobs' order by created_at limit 1),
        'Club Test SailJobs', 'club', 'Club Test SailJobs',
        'employment', 'paid', 'USD 1200/mes', 'USD 1200/mes',
        'Argentina', 'Buenos Aires', 'Buenos Aires', 'Temporada 2027', 1,
        array['professional']::text[],
        'Entrenador para flota Optimist avanzada.',
        array['Experiencia con Optimist', 'Carnet náutico', 'Disponibilidad fines de semana']::text[],
        'published', '{"is_demo": true, "demo_original_club": "Club de Veleros Barlovento"}'::jsonb
    ),
    (
        'seed-coach-optimist-cvr', 'Coach Optimist', 'Coach',
        (select id from public.clubs where name = 'Club Test SailJobs' order by created_at limit 1),
        'Club Test SailJobs', 'club', 'Club Test SailJobs',
        'employment', 'to_confirm', 'A convenir', 'A convenir',
        'Argentina', 'Rosario', 'Rosario', 'Temporada 2027', 1,
        array['professional']::text[],
        'Búsqueda de entrenador para equipo Optimist.',
        array['Experiencia en Optimist', 'Disponibilidad fines de semana']::text[],
        'published', '{"is_demo": true, "demo_original_club": "Club de Velas Rosario"}'::jsonb
    )
on conflict (legacy_id) where legacy_id is not null
do update set
    title = excluded.title,
    category = excluded.category,
    club_id = excluded.club_id,
    club_name = excluded.club_name,
    owner_name = excluded.owner_name,
    opportunity_type = excluded.opportunity_type,
    compensation_type = excluded.compensation_type,
    compensation_details = excluded.compensation_details,
    salary = excluded.salary,
    country = excluded.country,
    city = excluded.city,
    city_name = excluded.city_name,
    duration = excluded.duration,
    openings = excluded.openings,
    eligible_profiles = excluded.eligible_profiles,
    description = excluded.description,
    requirements = excluded.requirements,
    status = excluded.status,
    metadata = excluded.metadata;

commit;
