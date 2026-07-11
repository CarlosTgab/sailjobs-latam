export function getStoredEvents() {
    const data = localStorage.getItem("storedEvents");

    return data ? JSON.parse(data) : [];
}

export function saveStoredEvents(events) {
    localStorage.setItem(
        "storedEvents",
        JSON.stringify(events)
    );
}

export function createStoredEvent(eventData) {
    const events = getStoredEvents();

    const newEvent = {
        id: Date.now(),
        title: eventData.title,
        clubId: eventData.clubId,
        className: eventData.className,
        country: eventData.country,
        city: eventData.city,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        website: eventData.website || "",
        source: eventData.source || "Club",
        sourceUrl: eventData.sourceUrl || "",
        status: eventData.status || "pending",
        isOfficial: eventData.isOfficial || false,
        createdAt: new Date().toISOString()
    };

    const updatedEvents = [
        ...events,
        newEvent
    ];

    saveStoredEvents(updatedEvents);

    return newEvent;
}

export function updateStoredEventStatus(eventId, newStatus) {
    const events = getStoredEvents();

    const updatedEvents = events.map((event) => {
        if (event.id === eventId) {
            return {
                ...event,
                status: newStatus
            };
        }

        return event;
    });

    saveStoredEvents(updatedEvents);
}

export function getAllEvents(staticEvents) {
    const storedEvents = getStoredEvents();

    return [
        ...staticEvents,
        ...storedEvents
    ];
}

export function getApprovedEvents(staticEvents) {
    const allEvents = getAllEvents(staticEvents);

    return allEvents.filter(
        event =>
            event.status === "approved" ||
            event.status === undefined
    );
}