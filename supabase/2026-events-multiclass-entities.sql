/*
 * SailJobs LATAM / FAY
 * Eventos multiclase, entidades organizadoras y permisos institucionales.
 *
 * Idempotente: puede ejecutarse más de una vez en Supabase SQL Editor.
 */

begin;

alter table public.clubs enable row level security;

drop policy if exists clubs_select_public_entities
on public.clubs;

create policy clubs_select_public_entities
on public.clubs
for select
to anon, authenticated
using (
    true
);

alter table public.events
    add column if not exists class_names text[] not null default '{}'::text[],
    add column if not exists organizer_entities jsonb not null default '[]'::jsonb,
    add column if not exists invited_entities jsonb not null default '[]'::jsonb,
    add column if not exists created_by uuid references auth.users(id) on delete set null,
    add column if not exists updated_by uuid references auth.users(id) on delete set null;

update public.events
set class_names = array[class_name]::text[]
where coalesce(array_length(class_names, 1), 0) = 0
  and nullif(trim(class_name), '') is not null;

update public.events
set organizer_entities = jsonb_build_array(
    jsonb_build_object(
        'entityId', coalesce(club_id, proposed_by_id, organization_id, owner_id),
        'entityName', coalesce(proposed_by_name, organizing_club_name, organization_name, owner_name, 'Entidad organizadora'),
        'entityType', coalesce(organizer_type, proposed_by_type, owner_type, 'organization'),
        'role', 'organizer',
        'status', 'accepted'
    )
)
where organizer_entities = '[]'::jsonb
  and coalesce(club_id, proposed_by_id, organization_id, owner_id) is not null;

create index if not exists events_class_names_gin_idx
on public.events using gin (class_names);

create index if not exists events_organizer_entities_gin_idx
on public.events using gin (organizer_entities);

create index if not exists events_invited_entities_gin_idx
on public.events using gin (invited_entities);

alter table public.events enable row level security;

/* Reemplaza las políticas históricas por un conjunto único y auditable. */
do $$
declare
    policy_record record;
begin
    for policy_record in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = 'events'
    loop
        execute format(
            'drop policy if exists %I on public.events',
            policy_record.policyname
        );
    end loop;
end;
$$;

create policy events_select_public_or_manager
on public.events
for select
to anon, authenticated
using (
    status in ('approved', 'published')
    or public.is_superadmin(auth.uid())
    or created_by = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        proposed_by_id is not null
        and public.can_manage_club(proposed_by_id, auth.uid())
    )
    or (
        reviewing_organization_id is not null
        and public.can_manage_club(reviewing_organization_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
    or (
        owner_id is not null
        and public.can_manage_club(owner_id, auth.uid())
    )
);

create policy events_insert_manager_or_superadmin
on public.events
for insert
to authenticated
with check (
    public.is_superadmin(auth.uid())
    or created_by = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        proposed_by_id is not null
        and public.can_manage_club(proposed_by_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
);

create policy events_update_manager_reviewer_or_superadmin
on public.events
for update
to authenticated
using (
    public.is_superadmin(auth.uid())
    or created_by = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        proposed_by_id is not null
        and public.can_manage_club(proposed_by_id, auth.uid())
    )
    or (
        reviewing_organization_id is not null
        and public.can_manage_club(reviewing_organization_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
    or (
        owner_id is not null
        and public.can_manage_club(owner_id, auth.uid())
    )
)
with check (
    public.is_superadmin(auth.uid())
    or created_by = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        proposed_by_id is not null
        and public.can_manage_club(proposed_by_id, auth.uid())
    )
    or (
        reviewing_organization_id is not null
        and public.can_manage_club(reviewing_organization_id, auth.uid())
    )
    or (
        organization_id is not null
        and public.can_manage_club(organization_id, auth.uid())
    )
    or (
        owner_id is not null
        and public.can_manage_club(owner_id, auth.uid())
    )
);

create policy events_delete_manager_or_superadmin
on public.events
for delete
to authenticated
using (
    public.is_superadmin(auth.uid())
    or created_by = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
    )
    or (
        proposed_by_id is not null
        and public.can_manage_club(proposed_by_id, auth.uid())
    )
);

alter table public.opportunities
    alter column event_id drop not null;

commit;
