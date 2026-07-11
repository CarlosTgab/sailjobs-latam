import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    SAILING_CLASSES,
    COUNTRIES
} from "../config/appConfig";

import staticEvents from "../data/events";
import { getApprovedEvents } from "../utils/eventsStorage";

function Calendar() {

    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");

    const events = getApprovedEvents(staticEvents)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const classes = [
        ...new Set([
            ...SAILING_CLASSES,
            ...events.map(event => event.className)
        ])
    ].filter(Boolean);

    const countries = [
        ...new Set([
            ...COUNTRIES,
            ...events.map(event => event.country)
        ])
    ].filter(Boolean);

    const filteredEvents = events.filter((event) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            event.title.toLowerCase().includes(searchText) ||
            event.className.toLowerCase().includes(searchText) ||
            event.city.toLowerCase().includes(searchText) ||
            event.country.toLowerCase().includes(searchText) ||
            (event.source && event.source.toLowerCase().includes(searchText));

        const matchesClass =
            selectedClass === "" ||
            event.className === selectedClass;

        const matchesCountry =
            selectedCountry === "" ||
            event.country === selectedCountry;

        return matchesSearch && matchesClass && matchesCountry;
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
        setSelectedCountry("");
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
                    placeholder="Buscar evento, clase, ciudad, país o fuente..."
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
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                >
                    <option value="">
                        Todos los países
                    </option>

                    {countries.map((country) => (

                        <option
                            key={country}
                            value={country}
                        >
                            {country}
                        </option>

                    ))}
                </select>

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
                                        Oficial
                                    </span>
                                ) : (
                                    <span className="event-proposed-badge">
                                        Comunidad
                                    </span>
                                )}

                            </div>

                            <h2>{event.title}</h2>

                            <p>
                                📍 {event.city}, {event.country}
                            </p>

                            <p>
                                📅 {formatDate(event.startDate)}
                                {" "}
                                -
                                {" "}
                                {formatDate(event.endDate)}
                            </p>

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
                            Probá cambiar la clase, el país o el texto buscado.
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