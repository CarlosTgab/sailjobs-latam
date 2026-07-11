import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    COUNTRIES
} from "../config/appConfig";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";

function Clubs() {
    const navigate = useNavigate();

    const clubs = getAllClubs(staticClubs);
    const jobs = getAllJobs(staticJobs);
    const events = getAllEvents(staticEvents);

    const [search, setSearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");

    const countries = [
        ...new Set([
            ...COUNTRIES,
            ...clubs.map(club => club.country)
        ])
    ].filter(Boolean);

    const filteredClubs = clubs
        .filter(club => {
            const searchableText = [
                club.name,
                club.city,
                club.country,
                club.description,
                club.website
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

            return matchesSearch && matchesCountry;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    function getClubOpportunities(clubId) {
        return jobs.filter(
            job => Number(job.clubId) === Number(clubId)
        );
    }

    function getClubEvents(clubId) {
        return events.filter(
            event => Number(event.clubId) === Number(clubId)
        );
    }

    function clearFilters() {
        setSearch("");
        setSelectedCountry("");
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div>
                    <h1>Clubes y organizaciones</h1>

                    <p>
                        Explorá clubes, asociaciones, clases y organizaciones
                        que publican eventos, oportunidades y convocatorias
                        dentro de la comunidad náutica.
                    </p>
                </div>
            </div>

            <div className="calendar-filters">
                <input
                    type="text"
                    placeholder="Buscar por nombre, ciudad o país"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

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
                    <h2>{clubs.length}</h2>
                    <p>Organizaciones registradas</p>
                </div>
            </div>

            {filteredClubs.length > 0 ? (
                <div className="dashboard-grid">
                    {filteredClubs.map(club => {
                        const clubOpportunities = getClubOpportunities(club.id);
                        const clubEvents = getClubEvents(club.id);

                        return (
                            <div
                                key={club.id}
                                className="dashboard-card"
                            >
                                <div className="dashboard-hero-info">
                                    <img
                                        src={club.logo || "/logos/default-club.svg"}
                                        alt={club.name}
                                        className="club-mini-logo"
                                    />

                                    <div>
                                        <h2>{club.name}</h2>

                                        <p>
                                            {club.city}, {club.country}
                                        </p>
                                    </div>
                                </div>

                                <p>
                                    {club.description || "Organización náutica registrada en SailJobs LATAM."}
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
                                    Ver organización
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="detail-card">
                    <h2>No encontramos organizaciones</h2>

                    <p>
                        Probá cambiar los filtros o revisar nuevamente más adelante.
                    </p>
                </div>
            )}
        </div>
    );
}

export default Clubs;