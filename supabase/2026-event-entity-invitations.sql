/*
 * SailJobs LATAM — Fase 4
 * Invitaciones formales de coorganización entre clubes y organizaciones.
 *
 * Una invitación pendiente no otorga permisos. Al aceptarla, la entidad puede
 * editar el evento y publicar oportunidades vinculadas desde su propio panel.
 * Idempotente: puede ejecutarse más de una vez.
 */

create extension if not exists pgcrypto;

begin;

create table if not exists public.event_entity_invitations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    inviter_entity_id uuid not null references public.clubs(id) on delete cascade,
    invited_entity_id uuid not null references public.clubs(id) on delete cascade,
    role text not null default 'coorganizer',
    status text not null default 'pending',
    invited_by uuid references auth.users(id) on delete set null,
    responded_by uuid references auth.users(id) on delete set null,
    responded_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint event_entity_invitations_unique
        unique (event_id, invited_entity_id),
    constraint event_entity_invitations_different_entities
        check (inviter_entity_id <> invited_entity_id),
    constraint event_entity_invitations_status_check
        check (status in ('pending', 'accepted', 'rejected', 'cancelled'))
);

create index if not exists event_entity_invitations_invited_status_idx
on public.event_entity_invitations (invited_entity_id, status, created_at desc);

create index if not exists event_entity_invitations_event_idx
on public.event_entity_invitations (event_id);

alter table public.event_entity_invitations enable row level security;

drop policy if exists event_entity_invitations_select_managers
on public.event_entity_invitations;

create policy event_entity_invitations_select_managers
on public.event_entity_invitations
for select
to authenticated
using (
    public.is_superadmin(auth.uid())
    or public.can_manage_club(inviter_entity_id, auth.uid())
    or public.can_manage_club(invited_entity_id, auth.uid())
);

create or replace function public.sync_event_entity_invitations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    inviter_id_value uuid;
    invited_id_value uuid;
    invitation_item jsonb;
    invitation_status text;
begin
    inviter_id_value := coalesce(
        new.club_id,
        new.proposed_by_id,
        new.organization_id,
        new.owner_id
    );

    if inviter_id_value is null then
        return new;
    end if;

    if not exists (
        select 1
        from public.clubs inviter_entity
        where inviter_entity.id = inviter_id_value
    ) then
        return new;
    end if;

    for invitation_item in
        select value
        from jsonb_array_elements(
            coalesce(new.invited_entities, '[]'::jsonb)
        ) as invitation(value)
    loop
        if coalesce(
            invitation_item ->> 'entityId',
            invitation_item ->> 'entity_id',
            ''
        ) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
            continue;
        end if;

        invited_id_value := coalesce(
            invitation_item ->> 'entityId',
            invitation_item ->> 'entity_id'
        )::uuid;

        if invited_id_value = inviter_id_value then
            continue;
        end if;

        if not exists (
            select 1
            from public.clubs invited_entity
            where invited_entity.id = invited_id_value
        ) then
            continue;
        end if;

        invitation_status := coalesce(
            invitation_item ->> 'status',
            'pending'
        );

        if invitation_status not in ('pending', 'accepted', 'rejected', 'cancelled') then
            invitation_status := 'pending';
        end if;

        insert into public.event_entity_invitations (
            event_id,
            inviter_entity_id,
            invited_entity_id,
            role,
            status,
            invited_by,
            updated_at
        )
        values (
            new.id,
            inviter_id_value,
            invited_id_value,
            coalesce(nullif(trim(invitation_item ->> 'role'), ''), 'coorganizer'),
            invitation_status,
            new.created_by,
            now()
        )
        on conflict (event_id, invited_entity_id)
        do update set
            inviter_entity_id = excluded.inviter_entity_id,
            role = excluded.role,
            updated_at = now(),
            status = case
                when event_entity_invitations.status in ('accepted', 'rejected')
                    then event_entity_invitations.status
                else excluded.status
            end;
    end loop;

    update public.event_entity_invitations existing_invitation
    set
        status = 'cancelled',
        updated_at = now()
    where existing_invitation.event_id = new.id
      and existing_invitation.status = 'pending'
      and not exists (
          select 1
          from jsonb_array_elements(
              coalesce(new.invited_entities, '[]'::jsonb)
          ) as invitation(value)
          where coalesce(
              invitation.value ->> 'entityId',
              invitation.value ->> 'entity_id',
              ''
          ) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            and coalesce(
                invitation.value ->> 'entityId',
                invitation.value ->> 'entity_id'
            )::uuid = existing_invitation.invited_entity_id
      );

    return new;
end;
$$;

drop trigger if exists sync_event_entity_invitations_trigger
on public.events;

create trigger sync_event_entity_invitations_trigger
after insert or update of invited_entities
on public.events
for each row
execute function public.sync_event_entity_invitations();

with parsed_invitations as (
    select
        event_row.id as event_id,
        coalesce(
            event_row.club_id,
            event_row.proposed_by_id,
            event_row.organization_id,
            event_row.owner_id
        ) as inviter_entity_id,
        case
            when coalesce(
                invitation.value ->> 'entityId',
                invitation.value ->> 'entity_id',
                ''
            ) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then coalesce(
                invitation.value ->> 'entityId',
                invitation.value ->> 'entity_id'
            )::uuid
            else null
        end as invited_entity_id,
        coalesce(
            nullif(trim(invitation.value ->> 'role'), ''),
            'coorganizer'
        ) as invitation_role,
        case
            when invitation.value ->> 'status' in (
                'pending', 'accepted', 'rejected', 'cancelled'
            ) then invitation.value ->> 'status'
            else 'pending'
        end as invitation_status,
        event_row.created_by as invited_by
    from public.events event_row
    cross join lateral jsonb_array_elements(
        coalesce(event_row.invited_entities, '[]'::jsonb)
    ) as invitation(value)
)
insert into public.event_entity_invitations (
    event_id,
    inviter_entity_id,
    invited_entity_id,
    role,
    status,
    invited_by
)
select
    parsed.event_id,
    parsed.inviter_entity_id,
    parsed.invited_entity_id,
    parsed.invitation_role,
    parsed.invitation_status,
    parsed.invited_by
from parsed_invitations parsed
join public.clubs inviter_entity
  on inviter_entity.id = parsed.inviter_entity_id
join public.clubs invited_entity
  on invited_entity.id = parsed.invited_entity_id
where parsed.invited_entity_id is not null
  and parsed.invited_entity_id <> parsed.inviter_entity_id
on conflict (event_id, invited_entity_id) do nothing;

create or replace function public.can_manage_event_collaboration(
    event_id_param uuid,
    user_id_param uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.event_entity_invitations invitation
        where invitation.event_id = event_id_param
          and invitation.status = 'accepted'
          and public.can_manage_club(
              invitation.invited_entity_id,
              user_id_param
          )
    );
$$;

drop policy if exists events_select_accepted_collaborator
on public.events;

create policy events_select_accepted_collaborator
on public.events
for select
to authenticated
using (
    public.can_manage_event_collaboration(id, auth.uid())
);

drop policy if exists events_update_accepted_collaborator
on public.events;

create policy events_update_accepted_collaborator
on public.events
for update
to authenticated
using (
    public.can_manage_event_collaboration(id, auth.uid())
)
with check (
    public.can_manage_event_collaboration(id, auth.uid())
);

create or replace function public.get_my_entity_event_invitations(
    entity_id_param uuid
)
returns table (
    invitation_id uuid,
    event_id uuid,
    event_title text,
    event_start_date text,
    event_status text,
    inviter_entity_id uuid,
    inviter_entity_name text,
    invited_entity_id uuid,
    invited_entity_name text,
    invitation_role text,
    invitation_status text,
    created_at timestamptz,
    responded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'Tenés que iniciar sesión para consultar invitaciones.';
    end if;

    if not public.is_superadmin(auth.uid())
       and not public.can_manage_club(entity_id_param, auth.uid()) then
        raise exception 'No tenés permiso para consultar estas invitaciones.';
    end if;

    return query
    select
        invitation.id,
        invitation.event_id,
        coalesce(event_row.title, 'Evento'),
        event_row.start_date::text,
        coalesce(event_row.status, ''),
        invitation.inviter_entity_id,
        coalesce(inviter.name, 'Entidad organizadora'),
        invitation.invited_entity_id,
        coalesce(invited.name, 'Entidad invitada'),
        invitation.role,
        invitation.status,
        invitation.created_at,
        invitation.responded_at
    from public.event_entity_invitations invitation
    join public.events event_row
      on event_row.id = invitation.event_id
    join public.clubs inviter
      on inviter.id = invitation.inviter_entity_id
    join public.clubs invited
      on invited.id = invitation.invited_entity_id
    where invitation.invited_entity_id = entity_id_param
    order by
        case invitation.status
            when 'pending' then 0
            when 'accepted' then 1
            when 'rejected' then 2
            else 3
        end,
        invitation.created_at desc;
end;
$$;

create or replace function public.respond_to_event_entity_invitation(
    invitation_id_param uuid,
    response_status_param text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    invitation_record public.event_entity_invitations%rowtype;
    invited_entity_record public.clubs%rowtype;
    event_record public.events%rowtype;
    updated_invited_entities jsonb;
    updated_organizer_entities jsonb;
begin
    if auth.uid() is null then
        raise exception 'Tenés que iniciar sesión para responder la invitación.';
    end if;

    if response_status_param is null
       or response_status_param not in ('accepted', 'rejected') then
        raise exception 'La respuesta debe ser accepted o rejected.';
    end if;

    select *
    into invitation_record
    from public.event_entity_invitations invitation
    where invitation.id = invitation_id_param
    for update;

    if not found then
        raise exception 'La invitación no existe.';
    end if;

    if not public.is_superadmin(auth.uid())
       and not public.can_manage_club(
           invitation_record.invited_entity_id,
           auth.uid()
       ) then
        raise exception 'No tenés permiso para responder esta invitación.';
    end if;

    if invitation_record.status <> 'pending' then
        raise exception 'La invitación ya fue respondida o cancelada.';
    end if;

    select *
    into invited_entity_record
    from public.clubs invited_entity
    where invited_entity.id = invitation_record.invited_entity_id;

    select *
    into event_record
    from public.events event_row
    where event_row.id = invitation_record.event_id
    for update;

    if not found then
        raise exception 'El evento de la invitación ya no existe.';
    end if;

    update public.event_entity_invitations
    set
        status = response_status_param,
        responded_by = auth.uid(),
        responded_at = now(),
        updated_at = now()
    where id = invitation_record.id;

    select coalesce(
        jsonb_agg(
            case
                when coalesce(
                    invitation_item ->> 'entityId',
                    invitation_item ->> 'entity_id',
                    ''
                ) = invitation_record.invited_entity_id::text
                then jsonb_set(
                    invitation_item,
                    '{status}',
                    to_jsonb(response_status_param),
                    true
                )
                else invitation_item
            end
        ),
        '[]'::jsonb
    )
    into updated_invited_entities
    from jsonb_array_elements(
        coalesce(event_record.invited_entities, '[]'::jsonb)
    ) as invitation(invitation_item);

    select coalesce(jsonb_agg(organizer_item), '[]'::jsonb)
    into updated_organizer_entities
    from jsonb_array_elements(
        coalesce(event_record.organizer_entities, '[]'::jsonb)
    ) as organizer(organizer_item)
    where coalesce(
        organizer_item ->> 'entityId',
        organizer_item ->> 'entity_id',
        ''
    ) <> invitation_record.invited_entity_id::text;

    if response_status_param = 'accepted' then
        updated_organizer_entities := updated_organizer_entities ||
            jsonb_build_array(
                jsonb_build_object(
                    'entityId', invitation_record.invited_entity_id,
                    'entityName', invited_entity_record.name,
                    'entityType', coalesce(
                        invited_entity_record.entity_type,
                        'club'
                    ),
                    'role', invitation_record.role,
                    'status', 'accepted'
                )
            );
    end if;

    update public.events
    set
        invited_entities = updated_invited_entities,
        organizer_entities = updated_organizer_entities,
        updated_by = auth.uid(),
        updated_at = now()
    where id = invitation_record.event_id;
end;
$$;

revoke all on function public.sync_event_entity_invitations() from public;
revoke all on function public.can_manage_event_collaboration(uuid, uuid) from public;
revoke all on function public.get_my_entity_event_invitations(uuid) from public;
revoke all on function public.respond_to_event_entity_invitation(uuid, text) from public;

grant execute on function public.can_manage_event_collaboration(uuid, uuid)
to authenticated;

grant execute on function public.get_my_entity_event_invitations(uuid)
to authenticated;

grant execute on function public.respond_to_event_entity_invitation(uuid, text)
to authenticated;

commit;
