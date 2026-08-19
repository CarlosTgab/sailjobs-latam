/*
 * SailJobs LATAM — cuentas y emails
 *
 * - Mantiene public.profiles.email sincronizado con Supabase Auth.
 * - Registra entregas de emails transaccionales para evitar duplicados.
 * - Notifica al postulante que su postulación fue recibida.
 *
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

create table if not exists public.email_deliveries (
    id uuid primary key default gen_random_uuid(),
    notification_id uuid not null unique
        references public.notifications(id) on delete cascade,
    recipient_email text not null default '',
    status text not null default 'processing'
        check (status in ('processing', 'sent', 'failed', 'skipped')),
    provider_message_id text,
    error_message text,
    attempts integer not null default 1 check (attempts > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    sent_at timestamptz
);

create index if not exists email_deliveries_status_created_idx
on public.email_deliveries (status, created_at desc);

alter table public.email_deliveries enable row level security;

revoke all on table public.email_deliveries from public;
revoke all on table public.email_deliveries from anon;
revoke all on table public.email_deliveries from authenticated;

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if old.email is distinct from new.email then
        update public.profiles
        set email = coalesce(new.email, '')
        where id = new.id;
    end if;

    return new;
end;
$$;

drop trigger if exists sync_profile_email_from_auth_trigger
on auth.users;

create trigger sync_profile_email_from_auth_trigger
after update of email on auth.users
for each row
execute function public.sync_profile_email_from_auth();

create or replace function public.notify_application_submitted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    recipient_id uuid;
    opportunity_id uuid;
    opportunity_title text;
begin
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

    insert into public.notifications (
        recipient_user_id,
        type,
        title,
        body,
        link_url,
        metadata
    ) values (
        recipient_id,
        'application_submitted',
        'Recibimos tu postulación',
        'Tu postulación para “' ||
            coalesce(opportunity_title, 'una oportunidad') ||
            '” fue enviada correctamente.',
        case
            when opportunity_id is not null
                then '/jobs/' || opportunity_id::text
            else '/profile'
        end,
        jsonb_build_object(
            'applicationId', new.id,
            'opportunityId', opportunity_id,
            'status', coalesce(new.status, 'pending')
        )
    );

    return new;
end;
$$;

drop trigger if exists notify_application_submitted_trigger
on public.applications;

create trigger notify_application_submitted_trigger
after insert on public.applications
for each row
execute function public.notify_application_submitted();

revoke all on function public.sync_profile_email_from_auth() from public;
revoke all on function public.notify_application_submitted() from public;

commit;
