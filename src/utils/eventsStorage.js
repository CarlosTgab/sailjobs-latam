import { supabase } from "../lib/supabaseClient";
import { sameId } from "./idUtils";
import { EVENT_STATUS } from "../config/appConfig";

const EVENTS_STORAGE_KEY = "storedEvents";

function readStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function safeDispatchEventsChanged() {
    try {
        window.dispatchEvent(new Event("eventsChanged"));
    } catch {
        // No-op outside browser contexts.
    }
}

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(value || "")
    );
}

function toUuidOrNull(value) {
    return isUuid(value) ? String(value) : null;
}

function normalizeEventStatus(status) {
    if (status === "pending_review") {
        return EVENT_STATUS.PENDING;
    }

    if (status === "published") {
        return EVENT_STATUS.APPROVED;
    }

    return status || EVENT_STATUS.APPROVED;
}

function getCityName(event) {
    if (event.cityName || event.city_name) {
        return event.cityName || event.city_name;
    }

    if (event.city && String(event.city).includes(",")) {
        return String(event.city).split(",")[0].trim();
    }

    return event.city || "";
}

function getLegacyId(event) {
    if (!event) return "";

    return (
        event.legacyId ||
        event.legacy_id ||
        (!isUuid(event.id) ? event.id : "") ||
        ""
    );
}

function uniqueStrings(values) {
    const result = [];

    (Array.isArray(values) ? values : []).forEach(value => {
        const normalizedValue = String(value || "").trim();

        if (
            normalizedValue &&
            !result.some(item => item.toLowerCase() === normalizedValue.toLowerCase())
        ) {
            result.push(normalizedValue);
        }
    });

    return result;
}

function normalizeEventEntities(entities, defaultStatus = "pending") {
    const result = [];

    (Array.isArray(entities) ? entities : []).forEach(entity => {
        const entityId = entity?.entityId || entity?.entity_id || entity?.id || "";
        const entityName = entity?.entityName || entity?.entity_name || entity?.name || "";

        if (!entityId && !entityName) return;

        if (
            result.some(item =>
                (entityId && sameId(item.entityId, entityId)) ||
                (
                    !entityId &&
                    entityName &&
                    item.entityName.toLowerCase() === String(entityName).trim().toLowerCase()
                )
            )
        ) {
            return;
        }

        result.push({
            entityId,
            entityName: String(entityName || "Entidad").trim(),
            entityType: entity?.entityType || entity?.entity_type || "organization",
            role: entity?.role || "coorganizer",
            status: entity?.status || defaultStatus
        });
    });

    return result;
}

export function getEventClassNames(event) {
    if (!event) return [];

    if (Array.isArray(event.classNames)) {
        return uniqueStrings(event.classNames);
    }

    if (Array.isArray(event.class_names)) {
        return uniqueStrings(event.class_names);
    }

    if (Array.isArray(event.metadata?.classNames)) {
        return uniqueStrings(event.metadata.classNames);
    }

    return uniqueStrings([
        event.className,
        event.class_name
    ]);
}

export function getEventClassLabel(event) {
    const classNames = getEventClassNames(event);

    return classNames.length > 0
        ? classNames.join(" · ")
        : "Clase no informada";
}

export function eventHasClass(event, className) {
    if (!className) return true;

    return getEventClassNames(event).some(item =>
        item.toLowerCase() === String(className).trim().toLowerCase()
    );
}

export function eventBelongsToEntity(event, entityId) {
    if (!event || !entityId) return false;

    const directIds = [
        event.clubId,
        event.proposedById,
        event.reviewingOrganizationId,
        event.ownerId,
        event.organizationId
    ].filter(Boolean);

    if (directIds.some(id => sameId(id, entityId))) {
        return true;
    }

    return [
        ...(Array.isArray(event.organizerEntities) ? event.organizerEntities : []),
        ...(Array.isArray(event.invitedEntities) ? event.invitedEntities : [])
    ].some(entity => sameId(entity.entityId, entityId));
}

export function isPublishedEvent(event) {
    return (
        event?.status === EVENT_STATUS.APPROVED ||
        event?.status === EVENT_STATUS.PUBLISHED ||
        event?.status === undefined
    );
}

export function isPendingReviewEvent(event) {
    return (
        event?.status === EVENT_STATUS.PENDING ||
        event?.status === EVENT_STATUS.PENDING_REVIEW
    );
}

export function normalizeEvent(event) {
    if (!event) {
        return null;
    }

    const cityName = getCityName(event);
    const legacyId = getLegacyId(event);

    const proposedByType =
        event.proposedByType ||
        event.proposed_by_type ||
        (event.clubId || event.club_id ? "club" : "organization");

    const proposedById =
        event.proposedById ||
        event.proposed_by_id ||
        event.clubId ||
        event.club_id ||
        "";

    const proposedByName =
        event.proposedByName ||
        event.proposed_by_name ||
        event.organizingClubName ||
        event.organizing_club_name ||
        "";

    const organizationId =
        event.organizationId ||
        event.organization_id ||
        event.reviewingOrganizationId ||
        event.reviewing_organization_id ||
        "";

    const organizationName =
        event.organizationName ||
        event.organization_name ||
        event.reviewingOrganizationName ||
        event.reviewing_organization_name ||
        "";

    const ownerType =
        event.ownerType ||
        event.owner_type ||
        (organizationId || organizationName ? "organization" : "club");

    const ownerId =
        event.ownerId ||
        event.owner_id ||
        organizationId ||
        event.clubId ||
        event.club_id ||
        "";

    const ownerName =
        event.ownerName ||
        event.owner_name ||
        organizationName ||
        proposedByName ||
        "";

    const organizerType =
        event.organizerType ||
        event.organizer_type ||
        ownerType;

    const classNames = getEventClassNames(event);
    const primaryClassName =
        event.className ||
        event.class_name ||
        classNames[0] ||
        "";

    const organizerEntities = normalizeEventEntities(
        event.organizerEntities ||
        event.organizer_entities ||
        event.metadata?.organizerEntities ||
        [],
        "accepted"
    );

    const invitedEntities = normalizeEventEntities(
        event.invitedEntities ||
        event.invited_entities ||
        event.metadata?.invitedEntities ||
        [],
        "pending"
    );

    const metadata = {
        ...(event.metadata || {}),
        classNames,
        organizerEntities,
        invitedEntities
    };

    return {
        id: event.id || crypto.randomUUID?.() || String(Date.now()),
        legacyId,
        title: event.title || "Evento sin título",

        clubId: event.clubId || event.club_id || "",
        organizerType,
        organizerEntities,
        invitedEntities,

        proposedByType,
        proposedById,
        proposedByName,

        reviewingOrganizationId:
            event.reviewingOrganizationId ||
            event.reviewing_organization_id ||
            organizationId,

        reviewingOrganizationName:
            event.reviewingOrganizationName ||
            event.reviewing_organization_name ||
            organizationName,

        ownerType,
        ownerId,
        ownerName,

        organizationId,
        organizationName,
        organizingClubName:
            event.organizingClubName ||
            event.organizing_club_name ||
            proposedByName,

        className: primaryClassName,
        classNames,

        country: event.country || "",
        countryCode: event.countryCode || event.country_code || "",
        state: event.state || event.province || event.region || "",
        stateCode: event.stateCode || event.state_code || "",
        city: event.city || "",
        cityName,

        startDate: event.startDate || event.start_date || "",
        endDate: event.endDate || event.end_date || "",
        website: event.website || "",
        description: event.description || "",

        source:
            event.source ||
            organizationName ||
            "Club",

        sourceUrl: event.sourceUrl || event.source_url || "",
        status: normalizeEventStatus(event.status),
        isOfficial: Boolean(event.isOfficial || event.is_official),

        reviewMessage:
            event.reviewMessage ||
            event.review_message ||
            "",

        reviewedBy:
            event.reviewedBy ||
            event.reviewed_by ||
            "",

        reviewedAt:
            event.reviewedAt ||
            event.reviewed_at ||
            "",

        externalSource: event.externalSource || event.external_source || "",
        externalId: event.externalId || event.external_id || "",
        externalCalendarType: event.externalCalendarType || event.external_calendar_type || "",
        importedAt: event.importedAt || event.imported_at || "",
        metadata,

        createdBy: event.createdBy || event.created_by || "",
        updatedBy: event.updatedBy || event.updated_by || "",

        createdAt: event.createdAt || event.created_at || new Date().toISOString(),
        updatedAt: event.updatedAt || event.updated_at || null
    };
}

function areSameExternalEvent(firstEvent, secondEvent) {
    return Boolean(
        firstEvent.externalSource &&
        secondEvent.externalSource &&
        firstEvent.externalId &&
        secondEvent.externalId &&
        firstEvent.externalSource === secondEvent.externalSource &&
        firstEvent.externalId === secondEvent.externalId
    );
}

function areSameLegacyEvent(firstEvent, secondEvent) {
    return Boolean(
        (firstEvent.legacyId && secondEvent.legacyId && sameId(firstEvent.legacyId, secondEvent.legacyId)) ||
        (firstEvent.legacyId && secondEvent.id && sameId(firstEvent.legacyId, secondEvent.id)) ||
        (firstEvent.id && secondEvent.legacyId && sameId(firstEvent.id, secondEvent.legacyId))
    );
}

function uniqueEvents(events) {
    const result = [];

    events.forEach(event => {
        const normalized = normalizeEvent(event);

        if (!normalized) {
            return;
        }

        const alreadyExists = result.some(item =>
            sameId(item.id, normalized.id) ||
            areSameExternalEvent(item, normalized) ||
            areSameLegacyEvent(item, normalized)
        );

        if (!alreadyExists) {
            result.push(normalized);
        }
    });

    return result;
}

function saveEventsToLocalCache(events) {
    const normalized = uniqueEvents(events);

    localStorage.setItem(
        EVENTS_STORAGE_KEY,
        JSON.stringify(normalized)
    );

    safeDispatchEventsChanged();

    return normalized;
}

function mapSupabaseEvent(row) {
    if (!row) return null;

    return normalizeEvent({
        id: row.id,
        legacyId: row.legacy_id || "",
        title: row.title,
        clubId: row.club_id,
        organizerType: row.organizer_type,
        proposedByType: row.proposed_by_type,
        proposedById: row.proposed_by_id,
        proposedByName: row.proposed_by_name,
        reviewingOrganizationId: row.reviewing_organization_id,
        reviewingOrganizationName: row.reviewing_organization_name,
        ownerType: row.owner_type,
        ownerId: row.owner_id,
        ownerName: row.owner_name,
        organizationId: row.organization_id,
        organizationName: row.organization_name,
        organizingClubName: row.organizing_club_name,
        className: row.class_name,
        classNames: row.class_names,
        organizerEntities: row.organizer_entities,
        invitedEntities: row.invited_entities,
        country: row.country,
        countryCode: row.country_code,
        state: row.state,
        stateCode: row.state_code,
        city: row.city,
        cityName: row.city_name,
        startDate: row.start_date,
        endDate: row.end_date,
        website: row.website,
        description: row.description,
        source: row.source,
        sourceUrl: row.source_url,
        status: row.status,
        isOfficial: row.is_official,
        reviewMessage: row.review_message,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        externalSource: row.external_source,
        externalId: row.external_id,
        externalCalendarType: row.external_calendar_type,
        importedAt: row.imported_at,
        metadata: row.metadata,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    });
}

function eventToSupabaseRow(event) {
    const normalized = normalizeEvent(event);
    const idIsUuid = isUuid(normalized.id);

    const row = {
        legacy_id: normalized.legacyId || (!idIsUuid ? String(normalized.id) : null),
        title: normalized.title,
        club_id: toUuidOrNull(normalized.clubId),
        organizer_type: normalized.organizerType || null,
        proposed_by_type: normalized.proposedByType || null,
        proposed_by_id: toUuidOrNull(normalized.proposedById),
        proposed_by_name: normalized.proposedByName || null,
        reviewing_organization_id: toUuidOrNull(normalized.reviewingOrganizationId),
        reviewing_organization_name: normalized.reviewingOrganizationName || null,
        owner_type: normalized.ownerType || null,
        owner_id: toUuidOrNull(normalized.ownerId),
        owner_name: normalized.ownerName || null,
        organization_id: toUuidOrNull(normalized.organizationId),
        organization_name: normalized.organizationName || null,
        organizing_club_name: normalized.organizingClubName || null,
        class_name: normalized.className || null,
        class_names: normalized.classNames,
        organizer_entities: normalized.organizerEntities,
        invited_entities: normalized.invitedEntities,
        country: normalized.country || null,
        country_code: normalized.countryCode || null,
        state: normalized.state || null,
        state_code: normalized.stateCode || null,
        city: normalized.city || null,
        city_name: normalized.cityName || null,
        start_date: normalized.startDate || null,
        end_date: normalized.endDate || null,
        website: normalized.website || null,
        description: normalized.description || null,
        source: normalized.source || null,
        source_url: normalized.sourceUrl || null,
        status: normalizeEventStatus(normalized.status),
        is_official: Boolean(normalized.isOfficial),
        review_message: normalized.reviewMessage || null,
        reviewed_by: normalized.reviewedBy || null,
        reviewed_at: normalized.reviewedAt || null,
        external_source: normalized.externalSource || null,
        external_id: normalized.externalId || null,
        external_calendar_type: normalized.externalCalendarType || null,
        imported_at: normalized.importedAt || null,
        metadata: normalized.metadata || {},
        created_by: toUuidOrNull(normalized.createdBy),
        updated_by: toUuidOrNull(normalized.updatedBy || normalized.createdBy),
        updated_at: new Date().toISOString()
    };

    if (idIsUuid) {
        row.id = normalized.id;
    }

    return row;
}

export function getStoredEvents() {
    return uniqueEvents(readStorageArray(EVENTS_STORAGE_KEY));
}

export function saveStoredEvents(events) {
    return saveEventsToLocalCache(events);
}

async function findSupabaseEvent(event) {
    const normalized = normalizeEvent(event);

    if (isUuid(normalized.id)) {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", normalized.id)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    if (normalized.externalSource && normalized.externalId) {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("external_source", normalized.externalSource)
            .eq("external_id", normalized.externalId)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    const legacyId = normalized.legacyId || (!isUuid(normalized.id) ? String(normalized.id) : "");

    if (legacyId) {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("legacy_id", legacyId)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    return null;
}

async function upsertSupabaseEvent(event) {
    const row = eventToSupabaseRow(event);
    const existingRow = await findSupabaseEvent(event);

    if (existingRow?.id) {
        const { data, error } = await supabase
            .from("events")
            .update({
                ...row,
                id: existingRow.id
            })
            .eq("id", existingRow.id)
            .select("*")
            .single();

        if (error) throw error;
        return mapSupabaseEvent(data);
    }

    const { data, error } = await supabase
        .from("events")
        .insert(row)
        .select("*")
        .single();

    if (error) throw error;
    return mapSupabaseEvent(data);
}

export async function fetchSupabaseEvents() {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true, nullsFirst: false });

    if (error) throw error;

    return uniqueEvents((data || []).map(mapSupabaseEvent));
}

export async function syncEventsFromSupabase(staticEvents = []) {
    const remoteEvents = await fetchSupabaseEvents();
    const syncedEvents = saveEventsToLocalCache(remoteEvents);

    return uniqueEvents([
        ...syncedEvents,
        ...staticEvents
    ]);
}

export async function createStoredEvent(eventData) {
    const events = getStoredEvents();

    const newEvent = normalizeEvent({
        ...eventData,
        id: eventData.id || crypto.randomUUID?.() || String(Date.now()),
        createdAt: eventData.createdAt || new Date().toISOString(),
        updatedAt: null
    });

    try {
        const savedEvent = await upsertSupabaseEvent(newEvent);

        saveEventsToLocalCache([
            savedEvent,
            ...getStoredEvents()
        ]);

        return savedEvent;
    } catch (error) {
        saveEventsToLocalCache(events);
        throw error;
    }
}

export async function updateStoredEvent(eventId, updatedData) {
    const currentEvents = getStoredEvents();

    const previousStoredEvent =
        currentEvents.find(event => sameId(event.id, eventId)) ||
        normalizeEvent({ ...updatedData, id: eventId });

    const updatedEvent = normalizeEvent({
        ...previousStoredEvent,
        ...updatedData,
        id: previousStoredEvent?.id || eventId,
        legacyId:
            previousStoredEvent?.legacyId ||
            updatedData.legacyId ||
            (!isUuid(eventId) ? String(eventId) : ""),
        createdAt:
            previousStoredEvent?.createdAt ||
            updatedData.createdAt ||
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    try {
        const savedEvent = await upsertSupabaseEvent(updatedEvent);

        saveEventsToLocalCache([
            savedEvent,
            ...getStoredEvents()
        ]);

        return savedEvent;
    } catch (error) {
        saveEventsToLocalCache(currentEvents);
        throw error;
    }
}

export async function upsertStoredEvents(eventsToUpsert) {
    const currentEvents = getStoredEvents();
    const normalizedIncomingEvents = uniqueEvents(eventsToUpsert);

    const keptEvents = currentEvents.filter(existingEvent =>
        !normalizedIncomingEvents.some(incomingEvent =>
            sameId(existingEvent.id, incomingEvent.id) ||
            areSameExternalEvent(existingEvent, incomingEvent) ||
            areSameLegacyEvent(existingEvent, incomingEvent)
        )
    );

    saveEventsToLocalCache([
        ...normalizedIncomingEvents,
        ...keptEvents
    ]);

    const savedEvents = [];

    for (const event of normalizedIncomingEvents) {
        try {
            const savedEvent = await upsertSupabaseEvent(event);
            savedEvents.push(savedEvent);
        } catch (error) {
            console.warn("No se pudo importar este evento en Supabase. Se conservó localmente.", event, error);
            savedEvents.push(event);
        }
    }

    saveEventsToLocalCache([
        ...savedEvents,
        ...getStoredEvents()
    ]);

    return savedEvents;
}

export async function deleteStoredEvent(eventId) {
    const events = getStoredEvents();
    const eventToDelete = events.find(event =>
        sameId(event.id, eventId) ||
        sameId(event.legacyId, eventId)
    );

    const updatedEvents = events.filter(event =>
        !sameId(event.id, eventId) &&
        !sameId(event.legacyId, eventId)
    );

    saveEventsToLocalCache(updatedEvents);

    try {
        if (eventToDelete) {
            const existingRow = await findSupabaseEvent(eventToDelete);

            if (existingRow?.id) {
                const { error } = await supabase
                    .from("events")
                    .delete()
                    .eq("id", existingRow.id);

                if (error) throw error;
            }
        }
    } catch (error) {
        console.warn("No se pudo eliminar el evento en Supabase. Se eliminó solo localmente.", error);
    }
}

export async function updateStoredEventStatus(eventId, newStatus, reviewData = {}) {
    const events = getStoredEvents();
    const currentEvent = events.find(event =>
        sameId(event.id, eventId) ||
        sameId(event.legacyId, eventId)
    );

    if (!currentEvent) return null;

    const normalizedStatus = normalizeEventStatus(newStatus);

    return updateStoredEvent(eventId, {
        ...currentEvent,
        ...reviewData,
        status: normalizedStatus,
        isOfficial:
            normalizedStatus === EVENT_STATUS.APPROVED
                ? true
                : currentEvent.isOfficial,
        reviewedAt:
            reviewData.reviewedAt ||
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
}

export function getImportedEventsBySource(source) {
    return getStoredEvents().filter(event =>
        event.externalSource === source ||
        event.source === source
    );
}

export function getAllEvents(staticEvents = []) {
    return uniqueEvents([
        ...getStoredEvents(),
        ...staticEvents
    ]);
}

export function getApprovedEvents(staticEvents = []) {
    const allEvents = getAllEvents(staticEvents);

    return allEvents.filter(isPublishedEvent);
}

export function getEventsForOrganization(organizationId, organizationName, staticEvents = []) {
    const normalizedName = String(organizationName || "")
        .trim()
        .toLowerCase();

    return getAllEvents(staticEvents).filter(event => {
        const matchesId =
            organizationId &&
            (
                sameId(event.reviewingOrganizationId, organizationId) ||
                sameId(event.organizationId, organizationId) ||
                sameId(event.ownerId, organizationId)
            );

        const matchesName =
            normalizedName &&
            [
                event.reviewingOrganizationName,
                event.organizationName,
                event.ownerName,
                event.source
            ]
                .filter(Boolean)
                .some(value => String(value).trim().toLowerCase() === normalizedName);

        return matchesId || matchesName;
    });
}
