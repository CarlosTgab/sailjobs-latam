import { useState } from "react";
import { useNavigate } from "react-router-dom";

import staticJobs from "../data/jobs";
import staticClubs from "../data/clubs";

import {
    getAllJobsForAdmin,
    hideStoredJob,
    restoreStoredJob
} from "../utils/jobsStorage";

import { getAllClubs } from "../utils/clubsStorage";
import { getCurrentUser } from "../utils/authStorage";
import { isSuperadmin } from "../utils/permissions";
import { sameId, sortByNewest } from "../utils/idUtils";

import {
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

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

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

function AdminJobs() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [refreshKey, setRefreshKey] = useState(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const jobs = getAllJobsForAdmin(staticJobs);
    const clubs = getAllClubs(staticClubs);

    if (!currentUser || !isSuperadmin(currentUser)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    Solo un superadmin puede moderar oportunidades.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/")}
                >
                    ← Volver al inicio
                </button>
            </div>
        );
    }

    function refresh() {
        setRefreshKey(refreshKey + 1);
    }

    function getClub(clubId) {
        return clubs.find(club =>
            sameId(club.id, clubId)
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

    function getStatusLabel(status) {
        if (status === "hidden") {
            return "Dada de baja";
        }

        return "Activa";
    }

    function getStatusClass(status) {
        if (status === "hidden") {
            return "status-pill rejected";
        }

        return "status-pill approved";
    }

    function handleHide(jobId) {
        const confirmed = window.confirm(
            "¿Seguro que querés dar de baja esta oportunidad? No se verá en la página pública."
        );

        if (!confirmed) {
            return;
        }

        hideStoredJob(jobId);
        refresh();
    }

    function handleRestore(jobId) {
        const confirmed = window.confirm(
            "¿Querés restaurar esta oportunidad y volver a mostrarla públicamente?"
        );

        if (!confirmed) {
            return;
        }

        restoreStoredJob(jobId);
        refresh();
    }

    const activeJobs = jobs.filter(job => job.status !== "hidden");
    const hiddenJobs = jobs.filter(job => job.status === "hidden");

    const filteredJobs = sortByNewest(
        jobs.filter(job => {
            const club = getClub(job.clubId);
            const searchText = [
                job.title,
                job.category,
                job.country,
                job.state,
                job.city,
                job.cityName,
                job.description,
                club?.name,
                job.clubName,
                job.organizationName
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !search.trim() ||
                searchText.includes(normalizeText(search));

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && job.status !== "hidden") ||
                (statusFilter === "hidden" && job.status === "hidden");

            return matchesSearch && matchesStatus;
        })
    );

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() => navigate("/superadmin")}
            >
                ← Volver al panel admin
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Moderación de oportunidades</h1>

                    <p>
                        Revisá y moderá oportunidades publicadas por clubes u organizaciones.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/jobs")}
                    >
                        Ver página pública
                    </button>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{jobs.length}</h2>
                    <p>Total</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{activeJobs.length}</h2>
                    <p>Activas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{hiddenJobs.length}</h2>
                    <p>Dadas de baja</p>
                </div>
            </div>

            <div className="calendar-filters">
                <input
                    type="text"
                    placeholder="Buscar por título, club, ciudad o categoría"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activas</option>
                    <option value="hidden">Dadas de baja</option>
                </select>

                <button
                    className="filter-clear-button"
                    onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                    }}
                >
                    Limpiar filtros
                </button>
            </div>

            {filteredJobs.length > 0 ? (
                <div className="dashboard-grid">
                    {filteredJobs.map(job => {
                        const club = getClub(job.clubId);
                        const isHidden = job.status === "hidden";

                        return (
                            <div
                                key={job.id}
                                className="dashboard-card"
                            >
                                <div className="event-card-top">
                                    <span className="sidebar-tag">
                                        {getOpportunityTypeLabel(job.opportunityType)}
                                    </span>

                                    <span className={getStatusClass(job.status)}>
                                        {getStatusLabel(job.status)}
                                    </span>
                                </div>

                                <h3>{job.title}</h3>

                                <p>
                                    <strong>Club / organización:</strong>{" "}
                                    {club?.name || job.clubName || job.organizationName || "No informado"}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {getLocationLabel(job)}
                                </p>

                                <p>
                                    <strong>Categoría:</strong>{" "}
                                    {job.category}
                                </p>

                                <p>
                                    <strong>Compensación:</strong>{" "}
                                    {getCompensationLabel(job)}
                                </p>

                                <div className="dashboard-actions">
                                    {!isHidden && (
                                        <button
                                            className="apply-button"
                                            onClick={() => navigate(`/jobs/${job.id}`)}
                                        >
                                            Ver pública
                                        </button>
                                    )}

                                    {!isHidden ? (
                                        <button
                                            className="reject-button"
                                            onClick={() => handleHide(job.id)}
                                        >
                                            Dar de baja
                                        </button>
                                    ) : (
                                        <button
                                            className="accept-button"
                                            onClick={() => handleRestore(job.id)}
                                        >
                                            Restaurar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="detail-card">
                    <h2>No encontramos oportunidades</h2>

                    <p>
                        Probá cambiar los filtros de moderación.
                    </p>
                </div>
            )}
        </div>
    );
}

export default AdminJobs;
