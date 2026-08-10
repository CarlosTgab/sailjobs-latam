/*
 * SailJobs LATAM — Fase 3
 * Vinculación manual y persistente entre identidades del ranking y perfiles
 * profesionales públicos.
 *
 * La clave se compone de nombre + club normalizados. De esta forma el vínculo
 * sobrevive a nuevas importaciones, pero evita adivinar perfiles por similitud.
 * Idempotente: puede ejecutarse más de una vez.
 */

create extension if not exists pgcrypto;

begin;

create or replace function public.normalize_ranking_identity(value_param text)
returns text
language sql
immutable
set search_path = public
as $$
    select trim(
        regexp_replace(
            translate(
                lower(coalesce(value_param, '')),
                'áàäâãéèëêíìïîóòöôõúùüûñç',
                'aaaaaeeeeiiiiooooouuuunc'
            ),
            '[^a-z0-9]+',
            ' ',
            'g'
        )
    );
$$;

create table if not exists public.ranking_profile_links (
    id uuid primary key default gen_random_uuid(),
    ranking_name text not null,
    ranking_club text not null default '',
    normalized_name text not null,
    normalized_club text not null default '',
    profile_id uuid not null references public.profiles(id) on delete cascade,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ranking_profile_links_identity_unique
        unique (normalized_name, normalized_club),
    constraint ranking_profile_links_name_not_empty
        check (normalized_name <> '')
);

create index if not exists ranking_profile_links_profile_idx
on public.ranking_profile_links (profile_id);

alter table public.ranking_profile_links enable row level security;

drop policy if exists "Superadmins manage ranking profile links"
on public.ranking_profile_links;

create policy "Superadmins manage ranking profile links"
on public.ranking_profile_links
for all
to authenticated
using (public.is_superadmin(auth.uid()))
with check (public.is_superadmin(auth.uid()));

create or replace function public.get_published_ranking_entries_with_profiles(
    import_id_param uuid
)
returns table (
    id uuid,
    import_id uuid,
    class_name text,
    "position" integer,
    last_name text,
    first_name text,
    full_name text,
    club text,
    category text,
    net_points numeric,
    total_points numeric,
    events integer,
    raw jsonb,
    created_at timestamptz,
    profile_id uuid,
    profile_name text,
    profile_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        entry.id,
        entry.import_id,
        entry.class_name,
        entry.position,
        entry.last_name,
        entry.first_name,
        entry.full_name,
        entry.club,
        entry.category,
        entry.net_points,
        entry.total_points,
        entry.events,
        entry.raw,
        entry.created_at,
        case
            when authenticated_user.id is not null then profile.id
            else null
        end as profile_id,
        case
            when authenticated_user.id is not null then coalesce(profile.name, '')
            else ''
        end as profile_name,
        case
            when authenticated_user.id is not null then coalesce(profile.profile_image_url, '')
            else ''
        end as profile_image_url
    from public.ranking_entries entry
    left join public.ranking_profile_links profile_link
      on profile_link.normalized_name =
            public.normalize_ranking_identity(entry.full_name)
     and profile_link.normalized_club =
            public.normalize_ranking_identity(entry.club)
    left join public.professional_profiles professional
      on professional.user_id = profile_link.profile_id
     and professional.active is true
    left join public.profiles profile
      on profile.id = professional.user_id
    left join auth.users authenticated_user
      on authenticated_user.id = profile.id
    where entry.import_id = import_id_param
      and exists (
          select 1
          from public.ranking_imports ranking_import
          where ranking_import.id = entry.import_id
            and ranking_import.status = 'published'
            and ranking_import.is_active is true
      )
    order by entry.class_name asc, entry.position asc;
$$;

create or replace function public.get_ranking_profile_links()
returns table (
    id uuid,
    ranking_name text,
    ranking_club text,
    normalized_name text,
    normalized_club text,
    profile_id uuid,
    profile_name text,
    profile_image_url text,
    profile_active boolean,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if auth.uid() is null or not public.is_superadmin(auth.uid()) then
        raise exception 'Solo un superadmin puede administrar los vínculos del ranking.';
    end if;

    return query
    select
        profile_link.id,
        profile_link.ranking_name,
        profile_link.ranking_club,
        profile_link.normalized_name,
        profile_link.normalized_club,
        profile_link.profile_id,
        coalesce(profile.name, ''),
        coalesce(profile.profile_image_url, ''),
        coalesce(professional.active, false)
            and authenticated_user.id is not null as profile_active,
        profile_link.created_at,
        profile_link.updated_at
    from public.ranking_profile_links profile_link
    left join public.profiles profile
      on profile.id = profile_link.profile_id
    left join public.professional_profiles professional
      on professional.user_id = profile_link.profile_id
    left join auth.users authenticated_user
      on authenticated_user.id = profile_link.profile_id
    order by profile_link.ranking_name asc, profile_link.ranking_club asc;
end;
$$;

create or replace function public.upsert_ranking_profile_link(
    ranking_name_param text,
    ranking_club_param text,
    profile_id_param uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    normalized_name_value text :=
        public.normalize_ranking_identity(ranking_name_param);
    normalized_club_value text :=
        public.normalize_ranking_identity(ranking_club_param);
    link_id uuid;
begin
    if auth.uid() is null or not public.is_superadmin(auth.uid()) then
        raise exception 'Solo un superadmin puede administrar los vínculos del ranking.';
    end if;

    if normalized_name_value = '' then
        raise exception 'El nombre del timonel no puede estar vacío.';
    end if;

    if not exists (
        select 1
        from public.professional_profiles professional
        join public.profiles profile
          on profile.id = professional.user_id
        join auth.users authenticated_user
          on authenticated_user.id = profile.id
        where professional.user_id = profile_id_param
          and professional.active is true
    ) then
        raise exception 'El perfil seleccionado no existe o no está activo.';
    end if;

    insert into public.ranking_profile_links (
        ranking_name,
        ranking_club,
        normalized_name,
        normalized_club,
        profile_id,
        created_by,
        updated_at
    )
    values (
        trim(ranking_name_param),
        trim(coalesce(ranking_club_param, '')),
        normalized_name_value,
        normalized_club_value,
        profile_id_param,
        auth.uid(),
        now()
    )
    on conflict (normalized_name, normalized_club)
    do update set
        ranking_name = excluded.ranking_name,
        ranking_club = excluded.ranking_club,
        profile_id = excluded.profile_id,
        updated_at = now()
    returning id into link_id;

    return link_id;
end;
$$;

create or replace function public.delete_ranking_profile_link(
    link_id_param uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null or not public.is_superadmin(auth.uid()) then
        raise exception 'Solo un superadmin puede administrar los vínculos del ranking.';
    end if;

    delete from public.ranking_profile_links
    where id = link_id_param;
end;
$$;

revoke all on function public.normalize_ranking_identity(text) from public;
revoke all on function public.get_published_ranking_entries_with_profiles(uuid) from public;
revoke all on function public.get_ranking_profile_links() from public;
revoke all on function public.upsert_ranking_profile_link(text, text, uuid) from public;
revoke all on function public.delete_ranking_profile_link(uuid) from public;

grant execute on function public.get_published_ranking_entries_with_profiles(uuid)
to anon, authenticated;

grant execute on function public.get_ranking_profile_links()
to authenticated;

grant execute on function public.upsert_ranking_profile_link(text, text, uuid)
to authenticated;

grant execute on function public.delete_ranking_profile_link(uuid)
to authenticated;

commit;
