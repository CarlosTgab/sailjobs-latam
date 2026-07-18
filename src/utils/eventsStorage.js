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

    return {
        id: event.id || crypto.randomUUID?.() || Date.now(),
        title: event.title || "Evento sin título",
        clubId: event.clubId || event.club_id || "",
        className: event.className || event.class_name || "",
        country: event.country || "",
        city: event.city || "",
        startDate: event.startDate || event.start_date || "",
        endDate: event.endDate || event.end_date || "",
        website: event.website || "",
        source: event.source || "Club",
        sourceUrl: event.sourceUrl || event.source_url || "",
        status: event.status || "pending",
        isOfficial: Boolean(event.isOfficial || event.is_official),
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

        if (!result.some(item => sameId(item.id, normalized.id))) {
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
        createdAt: eventData.createdAt || new Date().toISOString()
    });

    saveStoredEvents([
        ...events,
        newEvent
    ]);

    return newEvent;
}

export function updateStoredEventStatus(eventId, newStatus) {
    const events = getStoredEvents();

    const updatedEvents = events.map(event => {
        if (sameId(event.id, eventId)) {
            return normalizeEvent({
                ...event,
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
        }

        return event;
    });

    saveStoredEvents(updatedEvents);
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
