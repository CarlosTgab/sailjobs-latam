import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    JOB_CATEGORIES,
    COUNTRIES,
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

function Jobs() {
    const navigate = useNavigate();

    const jobs = getAllJobs(staticJobs);
    const clubs = getAllClubs(staticClubs);

    const [search, setSearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedType, setSelectedType] = useState("");

    const countries = [
        ...new Set([
            ...COUNTRIES,
            ...jobs.map(job => job.country)
        ])
    ].filter(Boolean);

    function getClub(clubId) {
        return clubs.find(
            club => Number(club.id) === Number(clubId)
        );
    }

    function getOpportunityTypeLabel(type) {
        return OPPORTUNITY_TYPE_LABELS[type] || "Trabajo profesional";
    }

    function getCompensationLabel(job) {
        if (job.compensationDetails) {
            return job.compensationDetails;
        }

        if (job.compensationType) {
            return COMPENSATION_TYPE_LABELS[job.compensationType] || "A confirmar";
        }

        return job.salary || "A confirmar";
    }

    const filteredJobs = jobs
        .filter(job => {
            const club = getClub(job.clubId);

            const searchableText = [
                job.title,
                job.category,
                job.city,
                job.country,
                job.description,
                job.duration,
                job.compensationDetails,
                job.salary,
                club?.name,
                getOpportunityTypeLabel(job.opportunityType)
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !search.trim() ||
                searchableText.includes(search.trim().toLowerCase());

            const matchesCountry =
                !selectedCountry ||
                job.country === selectedCountry;

            const matchesCategory =
                !selectedCategory ||
                job.category === selectedCategory;

            const matchesType =
                !selectedType ||
                job.opportunityType === selectedType;

            return (
                matchesSearch &&
                matchesCountry &&
                matchesCategory &&
                matchesType
            );
        })
        .sort((a, b) => Number(b.id) - Number(a.id));

    function clearFilters() {
        setSearch("");
        setSelectedCountry("");
        setSelectedCategory("");
        setSelectedType("");
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div>
                    <h1>Oportunidades náuticas</h1>

                    <p>
                        Encontrá trabajos profesionales, cargos técnicos en campeonatos
                        y convocatorias de voluntarios en la comunidad náutica.
                    </p>
                </div>
            </div>

            <div className="calendar-filters">
                <input
                    type="text"
                    placeholder="Buscar por puesto, club, ciudad, categoría o evento"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    value={selectedType}
                    onChange={(event) => setSelectedType(event.target.value)}
                >
                    <option value="">
                        Todos los tipos
                    </option>

                    {Object.entries(OPPORTUNITY_TYPE_LABELS).map(
                        ([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        )
                    )}
                </select>

                <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                >
                    <option value="">
                        Todas las categorías
                    </option>

                    {JOB_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedCountry}
                    onChange={(event) => setSelectedCountry(event.target.value)}
                >
                    <option value="">
                        Todos los países
                    </option>

                    {countries.map(country => (
                        <option key={country} value={country}>
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
                    <h2>{filteredJobs.length}</h2>
                    <p>Resultados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{jobs.length}</h2>
                    <p>Oportunidades totales</p>
                </div>
            </div>

            {filteredJobs.length > 0 ? (
                <div className="dashboard-grid">
                    {filteredJobs.map(job => {
                        const club = getClub(job.clubId);

                        return (
                            <div
                                key={job.id}
                                className="dashboard-card"
                            >
                                <div className="event-card-top">
                                    <span className="sidebar-tag">
                                        {getOpportunityTypeLabel(job.opportunityType)}
                                    </span>

                                    <span className="status-pill pending">
                                        {job.category}
                                    </span>
                                </div>

                                <h2>{job.title}</h2>

                                <p>
                                    <strong>Club / organización:</strong>{" "}
                                    {club ? club.name : "No informado"}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {job.city}, {job.country}
                                </p>

                                <p>
                                    <strong>Compensación:</strong>{" "}
                                    {getCompensationLabel(job)}
                                </p>

                                <p>
                                    <strong>Duración:</strong>{" "}
                                    {job.duration || "A confirmar"}
                                </p>

                                {job.openings && (
                                    <p>
                                        <strong>Vacantes:</strong>{" "}
                                        {job.openings}
                                    </p>
                                )}

                                {job.applicationDeadline && (
                                    <p>
                                        <strong>Fecha límite:</strong>{" "}
                                        {new Date(`${job.applicationDeadline}T00:00:00`)
                                            .toLocaleDateString("es-AR")}
                                    </p>
                                )}

                                <p>
                                    {job.description && job.description.length > 180
                                        ? `${job.description.slice(0, 180)}...`
                                        : job.description}
                                </p>

                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    Ver oportunidad
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="detail-card">
                    <h2>No encontramos oportunidades</h2>

                    <p>
                        Probá cambiar los filtros o revisar nuevamente más adelante.
                    </p>
                </div>
            )}
        </div>
    );
}

export default Jobs;