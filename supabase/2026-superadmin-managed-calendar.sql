/*
 * SailJobs LATAM - calendario administrado exclusivamente por superadmin.
 *
 * Los clubes y organizaciones conservan la lectura del calendario público y
 * pueden vincular oportunidades a eventos existentes, pero no pueden crear,
 * editar ni eliminar registros de public.events.
 */

begin;

alter table public.events enable row level security;

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

create policy events_select_public_or_superadmin
on public.events
for select
to anon, authenticated
using (
    status in ('approved', 'published')
    or public.is_superadmin(auth.uid())
);

create policy events_insert_superadmin
on public.events
for insert
to authenticated
with check (
    public.is_superadmin(auth.uid())
);

create policy events_update_superadmin
on public.events
for update
to authenticated
using (
    public.is_superadmin(auth.uid())
)
with check (
    public.is_superadmin(auth.uid())
);

create policy events_delete_superadmin
on public.events
for delete
to authenticated
using (
    public.is_superadmin(auth.uid())
);

/*
 * El flujo de invitaciones entre entidades queda archivado. Esta función era
 * SECURITY DEFINER y podía actualizar un evento al aceptar una colaboración,
 * por eso se revoca su ejecución para cuentas de la aplicación.
 */
do $$
begin
    if to_regprocedure(
        'public.respond_to_event_entity_invitation(uuid,text)'
    ) is not null then
        revoke execute on function public.respond_to_event_entity_invitation(uuid, text)
        from public, anon, authenticated;
    end if;
end;
$$;

commit;
