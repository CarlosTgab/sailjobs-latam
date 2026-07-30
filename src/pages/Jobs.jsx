import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    JOB_CATEGORIES,
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

import LocationFilterSelects from "../components/LocationFilterSelects";

import staticJobs from "../data/jobs";
import {
    getAllJobs,
    syncJobsFromSupabase
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";
import { sameId, sortByNewest } from "../utils/idUtils";

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function getJobCityName(job) {
    if (job.cityName) {
        return job.cityName;
    }

    if (job.city && job.city.includes(",")) {
        return job.city.split(",")[0].trim();
    }

    return job.city || "";
}

function getLocationLabel(job) {
    const parts = [
        getJobCityName(job),
        job.state,
        job.country
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(", ");
    }

    return "Ubicación no informada";
}

function Jobs() {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState(() => getAllJobs(staticJobs));
    const clubs = getAllClubs(staticClubs);

    useEffect(() => {
        let isMounted = true;

        async function loadJobs() {
            try {
                const syncedJobs = await syncJobsFromSupabase(staticJobs);

                if (isMounted) {
                    setJobs(syncedJobs);
                }
            } catch {
                if (isMounted) {
                    setJobs(getAllJobs(staticJobs));
                }
            }
        }

        function refreshFromLocalCache() {
            setJobs(getAllJobs(staticJobs));
        }

        loadJobs();
        window.addEventListener("jobsChanged", refreshFromLocalCache);

        return () => {
            isMounted = false;
            window.removeEventListener("jobsChanged", refreshFromLocalCache);
        };
    }, []);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedType, setSelectedType] = useState("");

    const [selectedCountryCode, setSelectedCountryCode] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");

    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [selectedState, setSelectedState] = useState("");

    const [selectedCity, setSelectedCity] = useState("");

    function getClub(clubId) {
        return clubs.find(
            club => sameId(club.id, clubId)
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

    function matchesCountry(job) {
        if (!selectedCountry) return true;

        return (
            normalizeText(job.country) === normalizeText(selectedCountry) ||
            normalizeText(job.countryCode) === normalizeText(selectedCountryCode)
        );
    }

    function matchesState(job) {
        if (!selectedState) return true;

        return (
            normalizeText(job.state) === normalizeText(selectedState) ||
            normalizeText(job.stateCode) === normalizeText(selectedStateCode) ||
            normalizeText(job.city).includes(normalizeText(selectedState))
        );
    }

    function matchesCity(job) {
        if (!selectedCity) return true;

        return (
            normalizeText(getJobCityName(job)) === normalizeText(selectedCity) ||
            normalizeText(job.city).includes(normalizeText(selectedCity))
        );
    }

    const filteredJobs = jobs
        .filter(job => {
            const club = getClub(job.clubId);

            const searchableText = [
                job.title,
                job.category,
                job.city,
                job.cityName,
                job.state,
                job.country,
                job.description,
                job.duration,
                job.compensationDetails,
                job.salary,
                club?.name,
                job.clubName,
                job.organizationName,
                getOpportunityTypeLabel(job.opportunityType)
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !search.trim() ||
                searchableText.includes(search.trim().toLowerCase());

            const matchesCategory =
                !selectedCategory ||
                job.category === selectedCategory;

            const matchesType =
                !selectedType ||
                job.opportunityType === selectedType;

            return (
                matchesSearch &&
                matchesCountry(job) &&
                matchesState(job) &&
                matchesCity(job) &&
                matchesCategory &&
                matchesType
            );
        });

    const sortedJobs = sortByNewest(filteredJobs);

    function clearFilters() {
        setSearch("");
        setSelectedCategory("");
        setSelectedType("");

        setSelectedCountryCode("");
        setSelectedCountry("");

        setSelectedStateCode("");
        setSelectedState("");

        setSelectedCity("");
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

                <LocationFilterSelects
                    countryCode={selectedCountryCode}
                    setCountryCode={setSelectedCountryCode}
                    setCountry={setSelectedCountry}
                    stateCode={selectedStateCode}
                    setStateCode={setSelectedStateCode}
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

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{sortedJobs.length}</h2>
                    <p>Resultados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{jobs.length}</h2>
                    <p>Oportunidades totales</p>
                </div>
            </div>

            {sortedJobs.length > 0 ? (
                <div className="dashboard-grid">
                    {sortedJobs.map(job => {
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
                                    {club?.name || job.clubName || job.organizationName || "No informado"}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {getLocationLabel(job)}
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
