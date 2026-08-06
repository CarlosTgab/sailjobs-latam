/*
 * SailJobs LATAM
 * Permite que una organización publique un evento sin club asociado.
 * Idempotente: puede ejecutarse más de una vez.
 */

begin;

alter table public.events
    alter column club_id drop not null;

/*
 * Un evento debe seguir teniendo una entidad responsable, aunque no tenga club.
 * Se deja como NOT VALID para no bloquear registros históricos incompletos.
 */
alter table public.events
    drop constraint if exists events_responsible_entity_check;

alter table public.events
    add constraint events_responsible_entity_check
    check (
        club_id is not null
        or proposed_by_id is not null
        or organization_id is not null
        or owner_id is not null
    ) not valid;

commit;
