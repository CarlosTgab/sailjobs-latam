/*
 * SailJobs LATAM — Fase 5
 * Centro de notificaciones internas para invitaciones y postulaciones.
 * No envía emails ni comunicaciones externas.
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_user_id uuid not null references auth.users(id) on delete cascade,
    type text not null default 'general',
    title text not null,
    body text not null default '',
    link_url text,
    metadata jsonb not null default '{}'::jsonb,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
on public.notifications (recipient_user_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
on public.notifications (recipient_user_id, created_at desc)
where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_delete_own on public.notifications;

create policy notifications_select_own
on public.notifications
for select
to authenticated
using (recipient_user_id = auth.uid());

create policy notifications_update_own
on public.notifications
for update
to authenticated
using (recipient_user_id = auth.uid())
with check (recipient_user_id = auth.uid());

create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (recipient_user_id = auth.uid());

revoke all on table public.notifications from public;
grant select, update, delete on table public.notifications to authenticated;

create or replace function public.notify_event_entity_invitation_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    recipient_id uuid;
    event_title text;
    inviter_name text;
begin
    if new.status <> 'pending' then
        return new;
    end if;

    select entity.owner_id
    into recipient_id
    from public.clubs entity
    where entity.id = new.invited_entity_id;

    if recipient_id is null then
        return new;
    end if;

    select coalesce(event_row.title, 'Evento sin título')
    into event_title
    from public.events event_row
    where event_row.id = new.event_id;

    select coalesce(entity.name, 'Una organización')
    into inviter_name
    from public.clubs entity
    where entity.id = new.inviter_entity_id;

    insert into public.notifications (
        recipient_user_id,
        type,
        title,
        body,
        link_url,
        metadata
    ) values (
        recipient_id,
        'event_invitation_received',
        'Nueva invitación para un evento',
        inviter_name || ' invitó a tu entidad a participar en “' ||
            coalesce(event_title, 'Evento sin título') || '”.',
        '/calendar/' || new.event_id::text,
        jsonb_build_object(
            'invitationId', new.id,
            'eventId', new.event_id,
            'entityId', new.invited_entity_id
        )
    );

    return new;
end;
$$;

create or replace function public.notify_event_entity_invitation_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    recipient_id uuid;
    event_title text;
    invited_name text;
    response_label text;
begin
    if old.status is not distinct from new.status
       or new.status not in ('accepted', 'rejected') then
        return new;
    end if;

    select entity.owner_id
    into recipient_id
    from public.clubs entity
    where entity.id = new.inviter_entity_id;

    if recipient_id is null then
        return new;
    end if;

    select coalesce(event_row.title, 'Evento sin título')
    into event_title
    from public.events event_row
    where event_row.id = new.event_id;

    select coalesce(entity.name, 'La entidad invitada')
    into invited_name
    from public.clubs entity
    where entity.id = new.invited_entity_id;

    response_label := case new.status
        when 'accepted' then 'aceptó'
        else 'rechazó'
    end;

    insert into public.notifications (
        recipient_user_id,
        type,
        title,
        body,
        link_url,
        metadata
    ) values (
        recipient_id,
        'event_invitation_response',
        'Respuesta a una invitación',
        invited_name || ' ' || response_label || ' la invitación para “' ||
            coalesce(event_title, 'Evento sin título') || '”.',
        '/calendar/' || new.event_id::text,
        jsonb_build_object(
            'invitationId', new.id,
            'eventId', new.event_id,
            'status', new.status
        )
    );

    return new;
end;
$$;

create or replace function public.notify_application_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    recipient_id uuid;
    entity_id uuid;
    opportunity_id uuid;
    opportunity_title text;
begin
    entity_id := coalesce(new.club_id, new.organization_id);
    opportunity_id := coalesce(new.job_id, new.opportunity_id);

    if entity_id is null and opportunity_id is not null then
        select coalesce(opportunity.club_id, opportunity.organization_id, opportunity.owner_id)
        into entity_id
        from public.opportunities opportunity
        where opportunity.id = opportunity_id;
    end if;

    if entity_id is null then
        return new;
    end if;

    select entity.owner_id
    into recipient_id
    from public.clubs entity
    where entity.id = entity_id;

    if recipient_id is null then
        return new;
    end if;

    if opportunity_id is not null then
        select coalesce(opportunity.title, 'Oportunidad sin título')
        into opportunity_title
        from public.opportunities opportunity
        where opportunity.id = opportunity_id;
    end if;

    insert into public.notifications (
        recipient_user_id,
        type,
        title,
        body,
        link_url,
        metadata
    ) values (
        recipient_id,
        'application_received',
        'Nueva postulación recibida',
        coalesce(nullif(trim(new.name), ''), 'Un profesional') ||
            ' se postuló a “' ||
            coalesce(opportunity_title, 'una oportunidad') || '”.',
        '/applications/' || entity_id::text,
        jsonb_build_object(
            'applicationId', new.id,
            'opportunityId', opportunity_id,
            'entityId', entity_id
        )
    );

    return new;
end;
$$;

create or replace function public.notify_application_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    recipient_id uuid;
    opportunity_id uuid;
    opportunity_title text;
    status_label text;
begin
    if old.status is not distinct from new.status
       or new.status not in ('accepted', 'rejected') then
        return new;
    end if;

    recipient_id := coalesce(new.user_id, new.applicant_id);
    opportunity_id := coalesce(new.job_id, new.opportunity_id);

    if recipient_id is null then
        return new;
    end if;

    if opportunity_id is not null then
        select coalesce(opportunity.title, 'Oportunidad sin título')
        into opportunity_title
        from public.opportunities opportunity
        where opportunity.id = opportunity_id;
    end if;

    status_label := case new.status
        when 'accepted' then 'aceptada'
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
        recipient_id,
        'application_status_changed',
        'Tu postulación fue ' || status_label,
        'Hay una novedad en tu postulación para “' ||
            coalesce(opportunity_title, 'una oportunidad') || '”.',
        case
            when opportunity_id is not null
                then '/jobs/' || opportunity_id::text
            else '/profile'
        end,
        jsonb_build_object(
            'applicationId', new.id,
            'opportunityId', opportunity_id,
            'status', new.status
        )
    );

    return new;
end;
$$;

drop trigger if exists notify_event_entity_invitation_created_trigger
on public.event_entity_invitations;

create trigger notify_event_entity_invitation_created_trigger
after insert on public.event_entity_invitations
for each row
execute function public.notify_event_entity_invitation_created();

drop trigger if exists notify_event_entity_invitation_response_trigger
on public.event_entity_invitations;

create trigger notify_event_entity_invitation_response_trigger
after update of status on public.event_entity_invitations
for each row
execute function public.notify_event_entity_invitation_response();

drop trigger if exists notify_application_created_trigger
on public.applications;

create trigger notify_application_created_trigger
after insert on public.applications
for each row
execute function public.notify_application_created();

drop trigger if exists notify_application_status_changed_trigger
on public.applications;

create trigger notify_application_status_changed_trigger
after update of status on public.applications
for each row
execute function public.notify_application_status_changed();

revoke all on function public.notify_event_entity_invitation_created() from public;
revoke all on function public.notify_event_entity_invitation_response() from public;
revoke all on function public.notify_application_created() from public;
revoke all on function public.notify_application_status_changed() from public;

commit;
