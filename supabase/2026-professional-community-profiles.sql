begin;

create or replace function public.save_my_professional_profile(
    title_param text,
    summary_param text,
    specialties_param text[],
    certifications_param text[],
    experience_param text[],
    languages_param text[],
    availability_param text,
    phone_param text,
    city_param text,
    country_param text,
    cv_file_name_param text,
    cv_url_param text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
begin
    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    update public.profiles
    set profile_types = array(
        select distinct profile_type
        from unnest(
            coalesce(profile_types, '{}'::text[])
            || array['user', 'professional']::text[]
        ) as profile_type
    )
    where id = current_user_id;

    insert into public.professional_profiles (
        user_id,
        active,
        title,
        summary,
        specialties,
        certifications,
        experience,
        languages,
        availability,
        phone,
        city,
        country,
        cv_file_name,
        cv_url
    )
    values (
        current_user_id,
        true,
        trim(coalesce(title_param, '')),
        trim(coalesce(summary_param, '')),
        coalesce(specialties_param, '{}'::text[]),
        coalesce(certifications_param, '{}'::text[]),
        coalesce(experience_param, '{}'::text[]),
        coalesce(languages_param, '{}'::text[]),
        coalesce(availability_param, ''),
        trim(coalesce(phone_param, '')),
        trim(coalesce(city_param, '')),
        coalesce(country_param, ''),
        coalesce(cv_file_name_param, ''),
        trim(coalesce(cv_url_param, ''))
    )
    on conflict (user_id) do update
    set
        active = true,
        title = excluded.title,
        summary = excluded.summary,
        specialties = excluded.specialties,
        certifications = excluded.certifications,
        experience = excluded.experience,
        languages = excluded.languages,
        availability = excluded.availability,
        phone = excluded.phone,
        city = excluded.city,
        country = excluded.country,
        cv_file_name = excluded.cv_file_name,
        cv_url = excluded.cv_url;
end;
$$;

revoke all on function public.save_my_professional_profile(
    text,
    text,
    text[],
    text[],
    text[],
    text[],
    text,
    text,
    text,
    text,
    text,
    text
) from public;

grant execute on function public.save_my_professional_profile(
    text,
    text,
    text[],
    text[],
    text[],
    text[],
    text,
    text,
    text,
    text,
    text,
    text
) to authenticated;

commit;
