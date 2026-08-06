import { useParams, useNavigate } from "react-router-dom";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getEntityTypeLabel,
    getOrganizationTypeLabel,
    isOrganizationEntity
} from "../utils/clubsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticEvents from "../data/events";
import {
    eventBelongsToEntity,
    getAllEvents,
    getEventClassLabel
} from "../utils/eventsStorage";

import useApplications from "../hooks/useApplications";

import { getCurrentUser } from "../utils/authStorage";
import { canManageClub } from "../utils/permissions";

import {
    sameId,
    hasId,
    sortByNewest
} from "../utils/idUtils";

import {
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

function getCityLabel(entity) {
    if (entity?.cityName) {
        return entity.cityName;
    }

    if (entity?.city && String(entity.city).includes(",")) {
        return String(entity.city).split(",")[0].trim();
    }

    return entity?.city || "";
}

function getLocationLabel(entity) {
    const parts = [
        getCityLabel(entity),
        entity?.state,
        entity?.country
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

function ClubDetail() {
    const { applications } = useApplications();
    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const clubs = getAllClubs(staticClubs);
    const jobs = getAllJobs(staticJobs);
    const events = getAllEvents(staticEvents);

    const club = clubs.find(
        item => sameId(item.id, id)
    );

    if (!club) {
        return (
            <div className="dashboard-page">
                <h1>Organización no encontrada</h1>

                <p>
                    No pudimos encontrar el club u organización solicitado.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/clubs")}
                >
                    ← Volver a organizaciones
                </button>
            </div>
        );
    }

    const entityIsOrganization =
        isOrganizationEntity(club);

    const entityLabel =
        getEntityTypeLabel(club);

    const dashboardLabel =
        entityIsOrganization
            ? "Panel de organización"
            : "Panel del club";

    const clubOpportunities = sortByNewest(
        jobs.filter(job => sameId(job.clubId, club.id))
    );

    const clubEvents = events
        .filter(event => eventBelongsToEntity(event, club.id))
        .sort((a, b) => {
            const dateA = a.startDate || a.start_date || "";
            const dateB = b.startDate || b.start_date || "";

            return new Date(dateA) - new Date(dateB);
        });

    const clubJobIds = clubOpportunities.map(
        job => job.id
    );

    const clubApplications = applications.filter(application => {
        const belongsByClubId =
            application.clubId &&
            sameId(application.clubId, club.id);

        const belongsByJobId =
            hasId(clubJobIds, application.jobId);

        return belongsByClubId || belongsByJobId;
    });

    const userCanManageClub =
        currentUser &&
        canManageClub(currentUser, club.id);

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

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(`${date}T00:00:00`).toLocaleDateString("es-AR");
    }

    return (
        <div className="event-detail">
            <button
                className="back-button"
                onClick={() => navigate("/clubs")}
            >
                ← Volver a organizaciones
            </button>

            <div className="detail-card">
                <div className="dashboard-hero-info">
                    <img
                        src={
                            club.logo ||
                            club.logoUrl ||
                            "/logos/default-club.svg"
                        }
                        alt={club.name}
                        className="dashboard-club-logo"
                    />

                    <div>
                        <h1>{club.name}</h1>

                        <p>
                            {getLocationLabel(club)}
                        </p>

                        <p>
                            {entityLabel}
                            {entityIsOrganization
                                ? ` · ${getOrganizationTypeLabel(club)}`
                                : ""}
                        </p>
                    </div>
                </div>

                {club.description && (
                    <p>
                        {club.description}
                    </p>
                )}

                {club.website && (
                    <p>
                        <strong>Web:</strong>{" "}

                        <a
                            href={club.website}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {club.website}
                        </a>
                    </p>
                )}

                {club.email && (
                    <p>
                        <strong>Email:</strong>{" "}

                        <a href={`mailto:${club.email}`}>
                            {club.email}
                        </a>
                    </p>
                )}

                {userCanManageClub && (
                    <div className="dashboard-actions">
                        <button
                            className="apply-button"
                            onClick={() => navigate(`/club-dashboard/${club.id}`)}
                        >
                            {dashboardLabel}
                        </button>

                        <button
                            className="apply-button"
                            onClick={() => navigate(`/club-dashboard/${club.id}/new-job`)}
                        >
                            Publicar oportunidad
                        </button>

                        <button
                            className="apply-button"
                            onClick={() => navigate(`/club-dashboard/${club.id}/new-event`)}
                        >
                            Proponer evento
                        </button>
                    </div>
                )}
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{clubOpportunities.length}</h2>
                    <p>Oportunidades publicadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{clubEvents.length}</h2>
                    <p>Eventos vinculados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{clubApplications.length}</h2>
                    <p>Postulaciones recibidas</p>
                </div>
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Oportunidades y convocatorias</h2>

                    {userCanManageClub && (
                        <button
                            className="small-action-button"
                            onClick={() => navigate(`/club-dashboard/${club.id}/new-job`)}
                        >
                            Nueva oportunidad
                        </button>
                    )}
                </div>

                {clubOpportunities.length > 0 ? (
                    <div className="dashboard-grid">
                        {clubOpportunities.map(job => (
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

                                <h3>{job.title}</h3>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {getLocationLabel(job)}
                                </p>

                                <p>
                                    <strong>Compensación:</strong>{" "}
                                    {getCompensationLabel(job)}
                                </p>

                                <p>
                                    <strong>Vacantes:</strong>{" "}
                                    {job.openings || 1}
                                </p>

                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    Ver oportunidad
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        Esta organización todavía no publicó oportunidades ni convocatorias.
                    </p>
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Eventos</h2>

                    {userCanManageClub && (
                        <button
                            className="small-action-button"
                            onClick={() => navigate(`/club-dashboard/${club.id}/new-event`)}
                        >
                            Proponer evento
                        </button>
                    )}
                </div>

                {clubEvents.length > 0 ? (
                    <div className="dashboard-grid">
                        {clubEvents.map(event => (
                            <div
                                key={event.id}
                                className="dashboard-card"
                            >
                                <div className="event-card-top">
                                    <span className="sidebar-tag">
                                        {getEventClassLabel(event)}
                                    </span>

                                    {event.isOfficial ? (
                                        <span className="status-pill approved">
                                            Oficial
                                        </span>
                                    ) : (
                                        <span className="status-pill pending">
                                            Comunitario
                                        </span>
                                    )}
                                </div>

                                <h3>{event.title}</h3>

                                <p>
                                    <strong>Fecha:</strong>{" "}
                                    {formatDate(event.startDate)}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {getLocationLabel(event)}
                                </p>

                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/calendar/${event.id}`)}
                                >
                                    Ver evento
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        Esta organización todavía no tiene eventos vinculados.
                    </p>
                )}
            </div>
        </div>
    );
}

export default ClubDetail;
