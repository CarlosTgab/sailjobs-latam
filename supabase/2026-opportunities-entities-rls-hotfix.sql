/*
 * SailJobs LATAM
 * Permisos de oportunidades para clubes y organizaciones náuticas.
 *
 * Idempotente: puede ejecutarse más de una vez en Supabase SQL Editor.
 */

begin;

alter table public.opportunities enable row level security;

/* Elimina políticas históricas para evitar combinaciones contradictorias. */
do $$
declare
    policy_record record;
begin
    for policy_record in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = 'opportunities'
    loop
        execute format(
            'drop policy if exists %I on public.opportunities',
            policy_record.policyname
        );
    end loop;
end;
$$;

create policy opportunities_select_public_or_manager
on public.opportunities
for select
to anon, authenticated
using (
    status = 'published'
    or public.is_superadmin(auth.uid())
    or created_by = auth.uid()
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
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

create policy opportunities_insert_entity_manager
on public.opportunities
for insert
to authenticated
with check (
    public.is_superadmin(auth.uid())
    or (
        created_by = auth.uid()
        and (
            (
                club_id is not null
                and public.can_manage_club(club_id, auth.uid())
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
    )
);

create policy opportunities_update_entity_manager
on public.opportunities
for update
to authenticated
using (
    public.is_superadmin(auth.uid())
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
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
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
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

create policy opportunities_delete_entity_manager
on public.opportunities
for delete
to authenticated
using (
    public.is_superadmin(auth.uid())
    or (
        club_id is not null
        and public.can_manage_club(club_id, auth.uid())
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

commit;
