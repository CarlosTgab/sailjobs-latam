/*
 * SailJobs LATAM — Fases 6, 7 y 8
 * - Inscripciones internas a eventos y gestión de participantes.
 * - Vinculación automática conservadora de rankings por nombre exacto.
 * - Historial deportivo público de perfiles profesionales.
 *
 * Requiere las migraciones de fases 3, 4 y 5.
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

create table if not exists public.event_registrations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pending',
    class_name text not null,
    sail_number text not null default '',
    crew_name text not null default '',
    notes text not null default '',
    manager_notes text not null default '',
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint event_registrations_event_user_unique
        unique (event_id, user_id),
    constraint event_registrations_status_check
        check (status in ('pending', 'confirmed', 'waitlist', 'rejected', 'cancelled')),
    constraint event_registrations_class_not_empty
        check (nullif(trim(class_name), '') is not null)
);

create index if not exists event_registrations_event_status_idx
on public.event_registrations (event_id, status, created_at);

create index if not exists event_registrations_user_created_idx
on public.event_registrations (user_id, created_at desc);

alter table public.event_registrations enable row level security;

create or replace function public.can_manage_event_registration(
    event_id_param uuid,
    user_id_param uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        public.is_superadmin(user_id_param)
        or public.can_manage_event_collaboration(event_id_param, user_id_param)
        or exists (
            select 1
            from public.events event_row
            where event_row.id = event_id_param
              and (
                  event_row.created_by = user_id_param
                  or (
                      event_row.club_id is not null
                      and public.can_manage_club(event_row.club_id, user_id_param)
                  )
                  or (
                      event_row.proposed_by_id is not null
                      and public.can_manage_club(event_row.proposed_by_id, user_id_param)
                  )
                  or (
                      event_row.organization_id is not null
                      and public.can_manage_club(event_row.organization_id, user_id_param)
                  )
                  or (
                      event_row.owner_id is not null
                      and public.can_manage_club(event_row.owner_id, user_id_param)
                  )
              )
        );
$$;

drop policy if exists event_registrations_select_authorized
on public.event_registrations;

create policy event_registrations_select_authorized
on public.event_registrations
for select
to authenticated
using (
    user_id = auth.uid()
    or public.can_manage_event_registration(event_id, auth.uid())
);

revoke all on table public.event_registrations from public;
grant select on table public.event_registrations to authenticated;

create or replace function public.set_event_registration_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists set_event_registration_updated_at_trigger
on public.event_registrations;

create trigger set_event_registration_updated_at_trigger
before update on public.event_registrations
for each row
execute function public.set_event_registration_updated_at();

create or replace function public.register_for_event(
    event_id_param uuid,
    class_name_param text,
    sail_number_param text default '',
    crew_name_param text default '',
    notes_param text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
    registration_id uuid;
begin
    if current_user_id is null then
        raise exception 'Tenés que iniciar sesión para inscribirte.';
    end if;

    if nullif(trim(class_name_param), '') is null then
        raise exception 'Seleccioná la clase en la que participás.';
    end if;

    if not exists (
        select 1
        from public.events event_row
        where event_row.id = event_id_param
          and coalesce(event_row.status, 'approved') in ('approved', 'published')
    ) then
        raise exception 'El evento no está disponible para inscripciones.';
    end if;

    insert into public.event_registrations (
        event_id,
        user_id,
        status,
        class_name,
        sail_number,
        crew_name,
        notes,
        manager_notes,
        reviewed_by,
        reviewed_at
    ) values (
        event_id_param,
        current_user_id,
        'pending',
        trim(class_name_param),
        trim(coalesce(sail_number_param, '')),
        trim(coalesce(crew_name_param, '')),
        trim(coalesce(notes_param, '')),
        '',
        null,
        null
    )
    on conflict (event_id, user_id)
    do update set
        status = 'pending',
        class_name = excluded.class_name,
        sail_number = excluded.sail_number,
        crew_name = excluded.crew_name,
        notes = excluded.notes,
        manager_notes = '',
        reviewed_by = null,
        reviewed_at = null,
        updated_at = now()
    where event_registrations.status in ('cancelled', 'rejected')
    returning id into registration_id;

    if registration_id is null then
        raise exception 'Ya tenés una inscripción activa para este evento.';
    end if;

    return registration_id;
end;
$$;

create or replace function public.cancel_my_event_registration(
    event_id_param uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'Tenés que iniciar sesión.';
    end if;

    update public.event_registrations
    set
        status = 'cancelled',
        reviewed_by = null,
        reviewed_at = now()
    where event_id = event_id_param
      and user_id = auth.uid()
      and status not in ('cancelled', 'rejected');

    if not found then
        raise exception 'No se encontró una inscripción activa para cancelar.';
    end if;
end;
$$;

create or replace function public.get_my_event_registration(
    event_id_param uuid
)
returns table (
    registration_id uuid,
    event_id uuid,
    user_id uuid,
    participant_name text,
    participant_email text,
    registration_status text,
    class_name text,
    sail_number text,
    crew_name text,
    notes text,
    manager_notes text,
    created_at timestamptz,
    updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
    select
        registration.id,
        registration.event_id,
        registration.user_id,
        coalesce(profile.name, 'Participante'),
        coalesce(profile.email, ''),
        registration.status,
        registration.class_name,
        registration.sail_number,
        registration.crew_name,
        registration.notes,
        registration.manager_notes,
        registration.created_at,
        registration.updated_at
    from public.event_registrations registration
    left join public.profiles profile
      on profile.id = registration.user_id
    where registration.event_id = event_id_param
      and registration.user_id = auth.uid()
    limit 1;
$$;

create or replace function public.get_event_registrations(
    event_id_param uuid
)
returns table (
    registration_id uuid,
    event_id uuid,
    user_id uuid,
    participant_name text,
    participant_email text,
    registration_status text,
    class_name text,
    sail_number text,
    crew_name text,
    notes text,
    manager_notes text,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if auth.uid() is null
       or (
           not public.can_manage_event_registration(event_id_param, auth.uid())
       ) then
        raise exception 'No tenés permiso para consultar estas inscripciones.';
    end if;

    return query
    select
        registration.id,
        registration.event_id,
        registration.user_id,
        coalesce(profile.name, 'Participante'),
        coalesce(profile.email, ''),
        registration.status,
        registration.class_name,
        registration.sail_number,
        registration.crew_name,
        registration.notes,
        registration.manager_notes,
        registration.created_at,
        registration.updated_at
    from public.event_registrations registration
    left join public.profiles profile
      on profile.id = registration.user_id
    where registration.event_id = event_id_param
    order by
        case registration.status
            when 'pending' then 1
            when 'waitlist' then 2
            when 'confirmed' then 3
            else 4
        end,
        registration.created_at asc;
end;
$$;

create or replace function public.review_event_registration(
    registration_id_param uuid,
    status_param text,
    manager_notes_param text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    registration_record public.event_registrations%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Tenés que iniciar sesión.';
    end if;

    if status_param not in ('pending', 'confirmed', 'waitlist', 'rejected') then
        raise exception 'El estado seleccionado no es válido.';
    end if;

    select *
    into registration_record
    from public.event_registrations
    where id = registration_id_param;

    if registration_record.id is null then
        raise exception 'La inscripción no existe.';
    end if;

    if not public.can_manage_event_registration(
        registration_record.event_id,
        auth.uid()
    ) then
        raise exception 'No tenés permiso para gestionar esta inscripción.';
    end if;

    update public.event_registrations
    set
        status = status_param,
        manager_notes = trim(coalesce(manager_notes_param, '')),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = registration_id_param;
end;
$$;

create or replace function public.notify_event_registration_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    recipient_id uuid;
    entity_id uuid;
    event_title text;
    participant_name text;
begin
    select
        coalesce(
            event_row.club_id,
            event_row.proposed_by_id,
            event_row.organization_id,
            event_row.owner_id
        ),
        coalesce(event_row.title, 'Evento sin título')
    into entity_id, event_title
    from public.events event_row
    where event_row.id = new.event_id;

    select entity.owner_id
    into recipient_id
    from public.clubs entity
    where entity.id = entity_id;

    if recipient_id is null then
        return new;
    end if;

    select coalesce(profile.name, 'Un participante')
    into participant_name
    from public.profiles profile
    where profile.id = new.user_id;

    insert into public.notifications (
        recipient_user_id,
        type,
        title,
        body,
        link_url,
        metadata
    ) values (
        recipient_id,
        'event_registration_received',
        'Nueva inscripción a un evento',
        coalesce(participant_name, 'Un participante') ||
            ' se inscribió a “' || event_title || '”.',
        '/calendar/' || new.event_id::text,
        jsonb_build_object(
            'registrationId', new.id,
            'eventId', new.event_id
        )
    );

    return new;
end;
$$;

create or replace function public.notify_event_registration_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    event_title text;
    status_label text;
begin
    if old.status is not distinct from new.status
       or new.status not in ('confirmed', 'waitlist', 'rejected') then
        return new;
    end if;

    select coalesce(event_row.title, 'Evento sin título')
    into event_title
    from public.events event_row
    where event_row.id = new.event_id;

    status_label := case new.status
        when 'confirmed' then 'confirmada'
        when 'waitlist' then 'en lista de espera'
        else 'rechazada'
    end;

    insert into public.notifications (
        recipient_user_id,
        type,
        title,
        body,
        link_url,
        metadata
    ) values (
        new.user_id,
        'event_registration_status_changed',
        'Tu inscripción fue ' || status_label,
        'Hay una novedad en tu inscripción para “' || event_title || '”.',
        '/calendar/' || new.event_id::text,
        jsonb_build_object(
            'registrationId', new.id,
            'eventId', new.event_id,
            'status', new.status
        )
    );

    return new;
end;
$$;

drop trigger if exists notify_event_registration_created_trigger
on public.event_registrations;

create trigger notify_event_registration_created_trigger
after insert on public.event_registrations
for each row
execute function public.notify_event_registration_created();

drop trigger if exists notify_event_registration_status_changed_trigger
on public.event_registrations;

create trigger notify_event_registration_status_changed_trigger
after update of status on public.event_registrations
for each row
execute function public.notify_event_registration_status_changed();

/* Vinculación automática: sólo nombre exacto y un único perfil activo. */
alter table public.ranking_profile_links
    add column if not exists link_source text not null default 'manual';

alter table public.ranking_profile_links
    drop constraint if exists ranking_profile_links_source_check;

alter table public.ranking_profile_links
    add constraint ranking_profile_links_source_check
    check (link_source in ('manual', 'automatic'));

create or replace function public.preserve_manual_ranking_profile_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is not null and public.is_superadmin(auth.uid()) then
        new.link_source := 'manual';
        new.created_by := auth.uid();
    end if;

    return new;
end;
$$;

drop trigger if exists preserve_manual_ranking_profile_link_trigger
on public.ranking_profile_links;

create trigger preserve_manual_ranking_profile_link_trigger
before update of profile_id on public.ranking_profile_links
for each row
execute function public.preserve_manual_ranking_profile_link();

create or replace function public.auto_link_ranking_entry_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    candidate_profile_id uuid;
    candidate_count integer;
begin
    select count(*), min(profile.id::text)::uuid
    into candidate_count, candidate_profile_id
    from public.profiles profile
    join public.professional_profiles professional
      on professional.user_id = profile.id
     and professional.active is true
    where public.normalize_ranking_identity(profile.name) =
          public.normalize_ranking_identity(new.full_name);

    if candidate_count = 1 then
        insert into public.ranking_profile_links (
            ranking_name,
            ranking_club,
            normalized_name,
            normalized_club,
            profile_id,
            created_by,
            link_source,
            updated_at
        ) values (
            trim(new.full_name),
            trim(coalesce(new.club, '')),
            public.normalize_ranking_identity(new.full_name),
            public.normalize_ranking_identity(new.club),
            candidate_profile_id,
            null,
            'automatic',
            now()
        )
        on conflict (normalized_name, normalized_club) do nothing;
    else
        delete from public.ranking_profile_links
        where normalized_name = public.normalize_ranking_identity(new.full_name)
          and link_source = 'automatic';
    end if;

    return new;
end;
$$;

drop trigger if exists auto_link_ranking_entry_profile_trigger
on public.ranking_entries;

create trigger auto_link_ranking_entry_profile_trigger
after insert or update of full_name, club
on public.ranking_entries
for each row
execute function public.auto_link_ranking_entry_profile();

create or replace function public.auto_link_professional_ranking_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    profile_name text;
    normalized_profile_name text;
    candidate_count integer;
begin
    select profile.name
    into profile_name
    from public.profiles profile
    where profile.id = new.user_id;

    normalized_profile_name := public.normalize_ranking_identity(profile_name);

    if normalized_profile_name = '' then
        return new;
    end if;

    delete from public.ranking_profile_links
    where normalized_name = normalized_profile_name
      and link_source = 'automatic';

    if new.active is not true then
        return new;
    end if;

    select count(*)
    into candidate_count
    from public.profiles profile
    join public.professional_profiles professional
      on professional.user_id = profile.id
     and professional.active is true
    where public.normalize_ranking_identity(profile.name) = normalized_profile_name;

    if candidate_count <> 1 then
        return new;
    end if;

    insert into public.ranking_profile_links (
        ranking_name,
        ranking_club,
        normalized_name,
        normalized_club,
        profile_id,
        created_by,
        link_source,
        updated_at
    )
    select distinct on (
        public.normalize_ranking_identity(entry.full_name),
        public.normalize_ranking_identity(entry.club)
    )
        entry.full_name,
        coalesce(entry.club, ''),
        public.normalize_ranking_identity(entry.full_name),
        public.normalize_ranking_identity(entry.club),
        new.user_id,
        null,
        'automatic',
        now()
    from public.ranking_entries entry
    where public.normalize_ranking_identity(entry.full_name) = normalized_profile_name
    order by
        public.normalize_ranking_identity(entry.full_name),
        public.normalize_ranking_identity(entry.club),
        entry.created_at desc
    on conflict (normalized_name, normalized_club) do nothing;

    return new;
end;
$$;

drop trigger if exists auto_link_professional_ranking_history_trigger
on public.professional_profiles;

create trigger auto_link_professional_ranking_history_trigger
after insert or update of active on public.professional_profiles
for each row
execute function public.auto_link_professional_ranking_history();

with unique_professional_names as (
    select
        public.normalize_ranking_identity(profile.name) as normalized_name,
        min(profile.id::text)::uuid as profile_id
    from public.profiles profile
    join public.professional_profiles professional
      on professional.user_id = profile.id
     and professional.active is true
    where nullif(public.normalize_ranking_identity(profile.name), '') is not null
    group by public.normalize_ranking_identity(profile.name)
    having count(*) = 1
), unique_ranking_identities as (
    select distinct on (
        public.normalize_ranking_identity(entry.full_name),
        public.normalize_ranking_identity(entry.club)
    )
        entry.full_name,
        coalesce(entry.club, '') as club,
        public.normalize_ranking_identity(entry.full_name) as normalized_name,
        public.normalize_ranking_identity(entry.club) as normalized_club
    from public.ranking_entries entry
    order by
        public.normalize_ranking_identity(entry.full_name),
        public.normalize_ranking_identity(entry.club),
        entry.created_at desc
)
insert into public.ranking_profile_links (
    ranking_name,
    ranking_club,
    normalized_name,
    normalized_club,
    profile_id,
    created_by,
    link_source,
    updated_at
)
select
    identity.full_name,
    identity.club,
    identity.normalized_name,
    identity.normalized_club,
    professional.profile_id,
    null,
    'automatic',
    now()
from unique_ranking_identities identity
join unique_professional_names professional
  on professional.normalized_name = identity.normalized_name
where identity.normalized_name <> ''
on conflict (normalized_name, normalized_club) do nothing;

create or replace function public.get_public_professional_sport_history(
    profile_id_param uuid
)
returns table (
    entry_id uuid,
    ranking_title text,
    ranking_date timestamptz,
    class_name text,
    "position" integer,
    club text,
    category text,
    net_points numeric,
    total_points numeric,
    events integer
)
language sql
stable
security definer
set search_path = public
as $$
    select
        entry.id,
        ranking_import.title,
        ranking_import.created_at,
        entry.class_name,
        entry.position,
        coalesce(entry.club, ''),
        coalesce(entry.category, ''),
        entry.net_points,
        entry.total_points,
        entry.events
    from public.ranking_profile_links profile_link
    join public.ranking_entries entry
      on public.normalize_ranking_identity(entry.full_name) =
            profile_link.normalized_name
     and public.normalize_ranking_identity(entry.club) =
            profile_link.normalized_club
    join public.ranking_imports ranking_import
      on ranking_import.id = entry.import_id
     and ranking_import.status = 'published'
    where profile_link.profile_id = profile_id_param
      and exists (
          select 1
          from public.professional_profiles professional
          where professional.user_id = profile_id_param
            and professional.active is true
      )
    order by ranking_import.created_at desc, entry.class_name, entry.position;
$$;

revoke all on function public.set_event_registration_updated_at() from public;
revoke all on function public.notify_event_registration_created() from public;
revoke all on function public.notify_event_registration_status_changed() from public;
revoke all on function public.auto_link_ranking_entry_profile() from public;
revoke all on function public.auto_link_professional_ranking_history() from public;
revoke all on function public.preserve_manual_ranking_profile_link() from public;
revoke all on function public.can_manage_event_registration(uuid, uuid) from public;

revoke all on function public.register_for_event(uuid, text, text, text, text) from public;
revoke all on function public.cancel_my_event_registration(uuid) from public;
revoke all on function public.get_my_event_registration(uuid) from public;
revoke all on function public.get_event_registrations(uuid) from public;
revoke all on function public.review_event_registration(uuid, text, text) from public;
revoke all on function public.get_public_professional_sport_history(uuid) from public;

grant execute on function public.register_for_event(uuid, text, text, text, text)
to authenticated;

grant execute on function public.can_manage_event_registration(uuid, uuid)
to authenticated;

grant execute on function public.cancel_my_event_registration(uuid)
to authenticated;

grant execute on function public.get_my_event_registration(uuid)
to authenticated;

grant execute on function public.get_event_registrations(uuid)
to authenticated;

grant execute on function public.review_event_registration(uuid, text, text)
to authenticated;

grant execute on function public.get_public_professional_sport_history(uuid)
to anon, authenticated;

commit;
