import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    SAILING_CLASSES
} from "../config/appConfig";

import LocationFilterSelects from "../components/LocationFilterSelects";

import staticEvents from "../data/events";
import {
    eventHasClass,
    getApprovedEvents,
    getEventClassLabel,
    getEventClassNames,
    syncEventsFromSupabase
} from "../utils/eventsStorage";
import { getCurrentUser } from "../utils/authStorage";
import {
    canManageEvent
} from "../utils/permissions";

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function getEventCityName(event) {
    if (event.cityName) {
        return event.cityName;
    }

    if (event.city && event.city.includes(",")) {
        return event.city.split(",")[0].trim();
    }

    return event.city || "";
}

function getLocationLabel(event) {
    const parts = [
        getEventCityName(event),
        event.state,
        event.country
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

function parseEventDate(value) {
    if (!value) return null;

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthGroup(event) {
    const date = parseEventDate(event.startDate);

    if (!date) {
        return {
            key: "date-to-confirm",
            label: "Fecha a confirmar"
        };
    }

    const rawLabel = date.toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric"
    });

    return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
    };
}


function Calendar() {

    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [search, setSearch] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSource, setSelectedSource] = useState("");

    const [selectedCountryCode, setSelectedCountryCode] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");

    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [selectedState, setSelectedState] = useState("");

    const [selectedCity, setSelectedCity] = useState("");

    const [events, setEvents] = useState(() =>
        getApprovedEvents(staticEvents)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    );

    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsError, setEventsError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                setEventsLoading(true);

                const syncedEvents = await syncEventsFromSupabase(staticEvents);

                if (!isMounted) return;

                setEvents(
                    syncedEvents
                        .filter(event =>
                            event.status === "approved" ||
                            event.status === "published" ||
                            event.status === undefined
                        )
                        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                );

                setEventsError("");
            } catch {
                if (!isMounted) return;

                setEventsError(
                    "No se pudo sincronizar el calendario online. Mostrando datos guardados localmente."
                );
            } finally {
                if (isMounted) {
                    setEventsLoading(false);
                }
            }
        }

        function refreshFromLocalCache() {
            setEvents(
                getApprovedEvents(staticEvents)
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            );
        }

        loadEvents();
        window.addEventListener("eventsChanged", refreshFromLocalCache);

        return () => {
            isMounted = false;
            window.removeEventListener("eventsChanged", refreshFromLocalCache);
        };
    }, []);

    const classes = [
        ...new Set([
            ...SAILING_CLASSES,
            ...events.flatMap(event => getEventClassNames(event))
        ])
    ].filter(Boolean);

    const sources = [
        ...new Set(
            events
                .map(event => event.source)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "es"));

    function matchesCountry(event) {
        if (!selectedCountry) return true;

        return (
            normalizeText(event.country) === normalizeText(selectedCountry) ||
            normalizeText(event.countryCode) === normalizeText(selectedCountryCode)
        );
    }

    function matchesState(event) {
        if (!selectedState) return true;

        return (
            normalizeText(event.state) === normalizeText(selectedState) ||
            normalizeText(event.stateCode) === normalizeText(selectedStateCode) ||
            normalizeText(event.city).includes(normalizeText(selectedState))
        );
    }

    function matchesCity(event) {
        if (!selectedCity) return true;

        return (
            normalizeText(getEventCityName(event)) === normalizeText(selectedCity) ||
            normalizeText(event.city).includes(normalizeText(selectedCity))
        );
    }

    const filteredEvents = events.filter((event) => {
        const searchText = search.toLowerCase();

        const searchableText = [
            event.title,
            ...getEventClassNames(event),
            event.city,
            event.cityName,
            event.state,
            event.country,
            event.source,
            event.organizationName,
            event.organizingClubName,
            event.description
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !searchText ||
            searchableText.includes(searchText);

        const matchesClass =
            selectedClass === "" ||
            eventHasClass(event, selectedClass);

        const matchesSource =
            selectedSource === "" ||
            event.source === selectedSource;

        return (
            matchesSearch &&
            matchesClass &&
            matchesSource &&
            matchesCountry(event) &&
            matchesState(event) &&
            matchesCity(event)
        );
    });

    const eventsByMonth = [...filteredEvents.reduce((groups, event) => {
        const month = getMonthGroup(event);
        const currentGroup = groups.get(month.key);

        if (currentGroup) {
            currentGroup.events.push(event);
        } else {
            groups.set(month.key, {
                ...month,
                events: [event]
            });
        }

        return groups;
    }, new Map()).values()];

    function formatDate(date) {
        const parsedDate = parseEventDate(date);

        if (!parsedDate) {
            return "Fecha a confirmar";
        }

        return parsedDate.toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    }

    function clearFilters() {
        setSearch("");
        setSelectedClass("");
        setSelectedSource("");
        setSelectedCountryCode("");
        setSelectedCountry("");
        setSelectedStateCode("");
        setSelectedState("");
        setSelectedCity("");
    }

    return (

        <div className="page calendar-page">

            <div className="page-header">

                <div>
                    <h1>Calendario de regatas</h1>

                    <p>
                        Eventos nacionales e internacionales de vela deportiva.
                    </p>
                </div>

            </div>

            <div className="calendar-filters">

                <input
                    type="text"
                    placeholder="Buscar evento, clase, ciudad, país, fuente u organizador..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    <option value="">
                        Todas las clases
                    </option>

                    {classes.map((className) => (

                        <option
                            key={className}
                            value={className}
                        >
                            {className}
                        </option>

                    ))}
                </select>

                <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                >
                    <option value="">
                        Todas las fuentes
                    </option>

                    {sources.map((source) => (
                        <option
                            key={source}
                            value={source}
                        >
                            {source}
                        </option>
                    ))}
                </select>

                <LocationFilterSelects
                    countryCode={selectedCountryCode}
                    setCountryCode={setSelectedCountryCode}
                    country={selectedCountry}
                    setCountry={setSelectedCountry}
                    stateCode={selectedStateCode}
                    setStateCode={setSelectedStateCode}
                    state={selectedState}
                    setState={setSelectedState}
                    city={selectedCity}
                    setCity={setSelectedCity}
                />

                <button
                    className="filter-clear-button"
                    onClick={clearFilters}
                >
                    Limpiar filtros
                </button>

            </div>

            {eventsLoading && (
                <div className="detail-card">
                    <p>Sincronizando calendario online...</p>
                </div>
            )}

            {eventsError && (
                <div className="detail-card">
                    <p style={{ color: "#b42318" }}>
                        {eventsError}
                    </p>
                </div>
            )}

            {eventsByMonth.length > 0 ? (

                <div className="calendar-months">

                    {eventsByMonth.map((month) => (

                        <section
                            className="calendar-month-section"
                            key={month.key}
                        >

                            <div className="calendar-month-divider">
                                <h2>{month.label}</h2>
                                <span className="calendar-month-line" />
                                <span className="calendar-month-count">
                                    {month.events.length} {month.events.length === 1 ? "evento" : "eventos"}
                                </span>
                            </div>

                            <div className="event-grid calendar-month-grid">

                                {month.events.map((event) => (

                                    <div
                                        className="event-card"
                                        key={event.id}
                                        onClick={() => navigate(`/calendar/${event.id}`)}
                                    >

                                        <div className="event-card-top">

                                            <span className="sidebar-tag">
                                                {getEventClassLabel(event)}
                                            </span>

                                            {event.isOfficial ? (
                                                <span className="event-official-badge">
                                                    {event.source === "FAY" ? "Oficial FAY" : "Oficial"}
                                                </span>
                                            ) : (
                                                <span className="event-proposed-badge">
                                                    Comunidad
                                                </span>
                                            )}

                                        </div>

                                        <h2>{event.title}</h2>

                                        <p>
                                            📍 {getLocationLabel(event)}
                                        </p>

                                        <p>
                                            📅 {formatDate(event.startDate)}
                                            {" "}
                                            -
                                            {" "}
                                            {formatDate(event.endDate)}
                                        </p>

                                        {event.organizationName && (
                                            <p>
                                                Organización: <strong>{event.organizationName}</strong>
                                            </p>
                                        )}

                                        {event.organizingClubName && (
                                            <p>
                                                Organizador indicado: <strong>{event.organizingClubName}</strong>
                                            </p>
                                        )}

                                        {event.source && (
                                            <p>
                                                Fuente: <strong>{event.source}</strong>
                                            </p>
                                        )}

                                        {canManageEvent(currentUser, event) && (
                                            <button
                                                type="button"
                                                className="small-action-button"
                                                onClick={(clickEvent) => {
                                                    clickEvent.preventDefault();
                                                    clickEvent.stopPropagation();
                                                    navigate(`/calendar/${event.id}/edit`);
                                                }}
                                            >
                                                Editar evento
                                            </button>
                                        )}

                                    </div>

                                ))}

                            </div>

                        </section>

                    ))}

                </div>

            ) : (

                <div className="detail-card calendar-empty-state">

                    <h2>No se encontraron eventos</h2>

                    <p>
                        Probá cambiar la clase, fuente, ubicación o el texto buscado.
                    </p>

                    <button
                        className="back-button"
                        onClick={clearFilters}
                    >
                        Limpiar filtros
                    </button>

                </div>

            )}

        </div>

    );
}

export default Calendar;
