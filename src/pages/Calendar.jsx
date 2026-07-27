import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    SAILING_CLASSES
} from "../config/appConfig";

import LocationFilterSelects from "../components/LocationFilterSelects";

import staticEvents from "../data/events";
import { getApprovedEvents } from "../utils/eventsStorage";

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

function Calendar() {

    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSource, setSelectedSource] = useState("");

    const [selectedCountryCode, setSelectedCountryCode] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");

    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [selectedState, setSelectedState] = useState("");

    const [selectedCity, setSelectedCity] = useState("");

    const events = getApprovedEvents(staticEvents)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const classes = [
        ...new Set([
            ...SAILING_CLASSES,
            ...events.map(event => event.className)
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
            event.className,
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
            event.className === selectedClass;

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

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(date + "T00:00:00").toLocaleDateString(
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

            <div className="event-grid">

                {filteredEvents.length > 0 ? (

                    filteredEvents.map((event) => (

                        <div
                            className="event-card"
                            key={event.id}
                            onClick={() => navigate(`/calendar/${event.id}`)}
                        >

                            <div className="event-card-top">

                                <span className="sidebar-tag">
                                    {event.className}
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

                        </div>

                    ))

                ) : (

                    <div className="detail-card">

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

        </div>

    );
}

export default Calendar;
