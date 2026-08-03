/*
 * SailJobs LATAM
 * Endurecimiento de permisos para public.opportunities.
 *
 * Resultado esperado:
 * - Visitantes: solo pueden leer oportunidades publicadas.
 * - Managers de un club: administran únicamente las oportunidades de su club.
 * - Superadmins: pueden administrar todas las oportunidades.
 *
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

alter table public.opportunities enable row level security;

/* Políticas históricas demasiado amplias o reemplazadas. */
drop policy if exists opportunities_select_public
on public.opportunities;
drop policy if exists opportunities_select_public_or_manager
on public.opportunities;
drop policy if exists opportunities_insert_authenticated
on public.opportunities;
drop policy if exists opportunities_insert_manager
on public.opportunities;
drop policy if exists opportunities_update_authenticated
on public.opportunities;
drop policy if exists opportunities_update_manager
on public.opportunities;
drop policy if exists opportunities_delete_manager
on public.opportunities;
drop policy if exists opportunities_delete_superadmin
on public.opportunities;

drop policy if exists "Public reads active opportunities"
on public.opportunities;
drop policy if exists "Authenticated users create own opportunities"
on public.opportunities;
drop policy if exists "Owners update opportunities"
on public.opportunities;
drop policy if exists "Owners delete opportunities"
on public.opportunities;

create policy opportunities_select_public_or_manager
on public.opportunities
for select
to anon, authenticated
using (
    status = 'published'
    or public.can_manage_club(club_id)
    or public.is_superadmin(auth.uid())
);

create policy opportunities_insert_manager_or_superadmin
on public.opportunities
for insert
to authenticated
with check (
    public.can_manage_club(club_id)
    or public.is_superadmin(auth.uid())
);

create policy opportunities_update_manager_or_superadmin
on public.opportunities
for update
to authenticated
using (
    public.can_manage_club(club_id)
    or public.is_superadmin(auth.uid())
)
with check (
    public.can_manage_club(club_id)
    or public.is_superadmin(auth.uid())
);

create policy opportunities_delete_manager_or_superadmin
on public.opportunities
for delete
to authenticated
using (
    public.can_manage_club(club_id)
    or public.is_superadmin(auth.uid())
);

commit;
