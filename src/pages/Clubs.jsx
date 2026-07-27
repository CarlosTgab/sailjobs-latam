import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    COUNTRIES,
    ENTITY_TYPE_LABELS
} from "../config/appConfig";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getEntityType,
    getEntityTypeLabel,
    getOrganizationTypeLabel,
    isOrganizationEntity
} from "../utils/clubsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";
import { sameId } from "../utils/idUtils";

function getCityLabel(entity) {
    if (entity.cityName) {
        return entity.cityName;
    }

    if (entity.city && String(entity.city).includes(",")) {
        return String(entity.city).split(",")[0].trim();
    }

    return entity.city || "";
}

function getLocationLabel(entity) {
    const parts = [
        getCityLabel(entity),
        entity.state,
        entity.country
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

function Clubs() {
    const navigate = useNavigate();

    const clubs = getAllClubs(staticClubs);
    const jobs = getAllJobs(staticJobs);
    const events = getAllEvents(staticEvents);

    const [search, setSearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedEntityType, setSelectedEntityType] = useState("");

    const countries = [
        ...new Set([
            ...COUNTRIES,
            ...clubs.map(club => club.country)
        ])
    ].filter(Boolean);

    const clubCount = clubs.filter(
        entity => getEntityType(entity) === "club"
    ).length;

    const organizationCount = clubs.filter(
        entity => getEntityType(entity) === "organization"
    ).length;

    const filteredClubs = clubs
        .filter(club => {
            const searchableText = [
                club.name,
                club.city,
                club.cityName,
                club.state,
                club.country,
                club.description,
                club.website,
                getEntityTypeLabel(club),
                getOrganizationTypeLabel(club)
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !search.trim() ||
                searchableText.includes(search.trim().toLowerCase());

            const matchesCountry =
                !selectedCountry ||
                club.country === selectedCountry;

            const matchesEntityType =
                !selectedEntityType ||
                getEntityType(club) === selectedEntityType;

            return matchesSearch && matchesCountry && matchesEntityType;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    function getClubOpportunities(clubId) {
        return jobs.filter(
            job => sameId(job.clubId, clubId)
        );
    }

    function getClubEvents(clubId) {
        return events.filter(
            event => sameId(event.clubId, clubId)
        );
    }

    function clearFilters() {
        setSearch("");
        setSelectedCountry("");
        setSelectedEntityType("");
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div>
                    <h1>Clubes y organizaciones</h1>

                    <p>
                        Explorá clubes, federaciones, asociaciones de clase,
                        organizadores de eventos y entidades que publican
                        actividad náutica en SailJobs LATAM.
                    </p>
                </div>
            </div>

            <div className="calendar-filters">
                <input
                    type="text"
                    placeholder="Buscar por nombre, ciudad, país o tipo"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    value={selectedEntityType}
                    onChange={(event) => setSelectedEntityType(event.target.value)}
                >
                    <option value="">
                        Todos los tipos
                    </option>

                    {Object.entries(ENTITY_TYPE_LABELS).map(
                        ([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        )
                    )}
                </select>

                <select
                    value={selectedCountry}
                    onChange={(event) => setSelectedCountry(event.target.value)}
                >
                    <option value="">
                        Todos los países
                    </option>

                    {countries.map(country => (
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

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{filteredClubs.length}</h2>
                    <p>Resultados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{clubCount}</h2>
                    <p>Clubes náuticos</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{organizationCount}</h2>
                    <p>Organizaciones</p>
                </div>
            </div>

            {filteredClubs.length > 0 ? (
                <div className="dashboard-grid">
                    {filteredClubs.map(club => {
                        const clubOpportunities = getClubOpportunities(club.id);
                        const clubEvents = getClubEvents(club.id);
                        const entityIsOrganization = isOrganizationEntity(club);

                        return (
                            <div
                                key={club.id}
                                className="dashboard-card"
                            >
                                <div className="event-card-top">
                                    <span className="sidebar-tag">
                                        {getEntityTypeLabel(club)}
                                    </span>

                                    {entityIsOrganization && (
                                        <span className="status-pill pending">
                                            {getOrganizationTypeLabel(club)}
                                        </span>
                                    )}
                                </div>

                                <div className="dashboard-hero-info">
                                    <img
                                        src={club.logo || "/logos/default-club.svg"}
                                        alt={club.name}
                                        className="club-mini-logo"
                                    />

                                    <div>
                                        <h2>{club.name}</h2>

                                        <p>
                                            {getLocationLabel(club)}
                                        </p>
                                    </div>
                                </div>

                                <p>
                                    {club.description || "Entidad náutica registrada en SailJobs LATAM."}
                                </p>

                                <p>
                                    <strong>Oportunidades:</strong>{" "}
                                    {clubOpportunities.length}
                                </p>

                                <p>
                                    <strong>Eventos:</strong>{" "}
                                    {clubEvents.length}
                                </p>

                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/clubs/${club.id}`)}
                                >
                                    {entityIsOrganization
                                        ? "Ver organización"
                                        : "Ver club"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="detail-card">
                    <h2>No encontramos entidades</h2>

                    <p>
                        Probá cambiar los filtros o revisar nuevamente más adelante.
                    </p>
                </div>
            )}
        </div>
    );
}

export default Clubs;
