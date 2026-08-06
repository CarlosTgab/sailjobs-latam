/*
 * SailJobs LATAM
 * Lectura administrativa segura para el panel de superadmin.
 *
 * Idempotente: puede ejecutarse más de una vez en Supabase SQL Editor.
 */

begin;

create or replace function public.get_superadmin_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
    result jsonb;
begin
    if current_user_id is null
       or not public.is_superadmin(current_user_id) then
        raise exception 'No autorizado para consultar usuarios.'
            using errcode = '42501';
    end if;

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', profile.id,
                'email', coalesce(profile.email, ''),
                'name', coalesce(profile.name, ''),
                'role', coalesce(profile.role, 'user'),
                'profileTypes', coalesce(profile.profile_types, '{}'::text[]),
                'permissions', coalesce(profile.permissions, '{}'::text[]),
                'organizationId', to_jsonb(profile) -> 'organization_id',
                'organizationName', coalesce(to_jsonb(profile) ->> 'organization_name', ''),
                'professionalActive', coalesce(professional.active, false),
                'entityId', entity.id,
                'entityName', coalesce(entity.name, ''),
                'entityType', entity.entity_type,
                'organizationType', entity.organization_type,
                'createdAt', coalesce(to_jsonb(profile) ->> 'created_at', '')
            )
            order by coalesce(profile.name, profile.email, '') asc
        ),
        '[]'::jsonb
    )
    into result
    from public.profiles profile
    left join public.professional_profiles professional
      on professional.user_id = profile.id
    left join lateral (
        select
            managed_entity.id,
            managed_entity.name,
            managed_entity.entity_type,
            managed_entity.organization_type
        from public.clubs managed_entity
        where managed_entity.owner_id = profile.id
        order by managed_entity.id
        limit 1
    ) entity on true;

    return result;
end;
$$;

revoke all on function public.get_superadmin_users() from public;
grant execute on function public.get_superadmin_users() to authenticated;

commit;
