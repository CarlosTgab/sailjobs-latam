import { sameId } from "./idUtils";

const EVENTS_STORAGE_KEY = "storedEvents";

function readStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function normalizeEvent(event) {
    if (!event) {
        return null;
    }

    const cityName =
        event.cityName ||
        event.city_name ||
        event.city ||
        "";

    const organizerType =
        event.organizerType ||
        event.organizer_type ||
        (event.organizationName || event.organization_name
            ? "organization"
            : "club");

    return {
        id: event.id || crypto.randomUUID?.() || Date.now(),
        title: event.title || "Evento sin título",

        clubId: event.clubId || event.club_id || "",
        organizerType,
        organizationId: event.organizationId || event.organization_id || "",
        organizationName: event.organizationName || event.organization_name || "",
        organizingClubName: event.organizingClubName || event.organizing_club_name || "",

        className: event.className || event.class_name || "",

        country: event.country || "",
        countryCode: event.countryCode || event.country_code || "",
        state: event.state || event.province || event.region || "",
        stateCode: event.stateCode || event.state_code || "",
        city: event.city || "",
        cityName,

        startDate: event.startDate || event.start_date || "",
        endDate: event.endDate || event.end_date || "",
        website: event.website || "",
        source: event.source || "Club",
        sourceUrl: event.sourceUrl || event.source_url || "",
        status: event.status || "pending",
        isOfficial: Boolean(event.isOfficial || event.is_official),

        externalSource: event.externalSource || event.external_source || "",
        externalId: event.externalId || event.external_id || "",
        externalCalendarType: event.externalCalendarType || event.external_calendar_type || "",
        importedAt: event.importedAt || event.imported_at || "",
        metadata: event.metadata || {},

        description: event.description || "",
        createdAt: event.createdAt || event.created_at || new Date().toISOString(),
        updatedAt: event.updatedAt || event.updated_at || null
    };
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
            (
                item.externalSource &&
                normalized.externalSource &&
                item.externalId &&
                normalized.externalId &&
                item.externalSource === normalized.externalSource &&
                item.externalId === normalized.externalId
            )
        );

        if (!alreadyExists) {
            result.push(normalized);
        }
    });

    return result;
}

export function getStoredEvents() {
    return uniqueEvents(readStorageArray(EVENTS_STORAGE_KEY));
}

export function saveStoredEvents(events) {
    const normalized = uniqueEvents(events);

    localStorage.setItem(
        EVENTS_STORAGE_KEY,
        JSON.stringify(normalized)
    );

    window.dispatchEvent(new Event("eventsChanged"));

    return normalized;
}

export function createStoredEvent(eventData) {
    const events = getStoredEvents();

    const newEvent = normalizeEvent({
        ...eventData,
        id: eventData.id || crypto.randomUUID?.() || Date.now(),
        createdAt: eventData.createdAt || new Date().toISOString(),
        updatedAt: null
    });

    saveStoredEvents([
        ...events,
        newEvent
    ]);

    return newEvent;
}

export function upsertStoredEvents(eventsToUpsert) {
    const currentEvents = getStoredEvents();
    const normalizedIncomingEvents = uniqueEvents(eventsToUpsert);

    const keptEvents = currentEvents.filter(existingEvent =>
        !normalizedIncomingEvents.some(incomingEvent =>
            sameId(existingEvent.id, incomingEvent.id) ||
            (
                existingEvent.externalSource &&
                incomingEvent.externalSource &&
                existingEvent.externalId &&
                incomingEvent.externalId &&
                existingEvent.externalSource === incomingEvent.externalSource &&
                existingEvent.externalId === incomingEvent.externalId
            )
        )
    );

    const updatedEvents = saveStoredEvents([
        ...keptEvents,
        ...normalizedIncomingEvents.map(event => ({
            ...event,
            updatedAt: new Date().toISOString()
        }))
    ]);

    return normalizedIncomingEvents.map(incomingEvent =>
        updatedEvents.find(event =>
            sameId(event.id, incomingEvent.id) ||
            (
                event.externalSource &&
                incomingEvent.externalSource &&
                event.externalId &&
                incomingEvent.externalId &&
                event.externalSource === incomingEvent.externalSource &&
                event.externalId === incomingEvent.externalId
            )
        ) || incomingEvent
    );
}

export function deleteStoredEvent(eventId) {
    const events = getStoredEvents();

    const updatedEvents = events.filter(event =>
        !sameId(event.id, eventId)
    );

    saveStoredEvents(updatedEvents);
}

export function updateStoredEventStatus(eventId, newStatus) {
    const events = getStoredEvents();

    const updatedEvents = events.map(event => {
        if (sameId(event.id, eventId)) {
            return normalizeEvent({
                ...event,
                status: newStatus,
                isOfficial: newStatus === "approved" ? event.isOfficial : event.isOfficial,
                updatedAt: new Date().toISOString()
            });
        }

        return event;
    });

    saveStoredEvents(updatedEvents);
}

export function getImportedEventsBySource(source) {
    return getStoredEvents().filter(event =>
        event.externalSource === source ||
        event.source === source
    );
}

export function getAllEvents(staticEvents = []) {
    return uniqueEvents([
        ...staticEvents,
        ...getStoredEvents()
    ]);
}

export function getApprovedEvents(staticEvents = []) {
    const allEvents = getAllEvents(staticEvents);

    return allEvents.filter(
        event =>
            event.status === "approved" ||
            event.status === undefined
    );
}
