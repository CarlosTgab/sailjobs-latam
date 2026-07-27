import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import { isOrganizationAdmin } from "../utils/permissions";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getOrganizationTypeLabel
} from "../utils/clubsStorage";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import { getApplications } from "../utils/applicationsStorage";
import { sameId, hasId, sortByNewest } from "../utils/idUtils";

import rankings from "../data/rankings";

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

function OrganizationAdminDashboard() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    if (!currentUser || !isOrganizationAdmin(currentUser)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    Este panel es únicamente para administradores de organizaciones.
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

    const organizationId =
        currentUser.organizationId ||
        currentUser.entityId ||
        null;

    const allEntities = getAllClubs(staticClubs);
    const organization = organizationId
        ? allEntities.find(entity => sameId(entity.id, organizationId))
        : null;

    const organizationName =
        organization?.name ||
        currentUser.organizationName ||
        currentUser.entityName ||
        "Mi organización";

    const managedClasses = Array.isArray(currentUser.managedClasses)
        ? currentUser.managedClasses
        : [];

    const allEvents = getAllEvents(staticEvents);
    const allJobs = getAllJobs(staticJobs);
    const applications = getApplications();

    const organizationEvents = allEvents.filter(event => {
        const belongsToOrganization =
            organizationId && sameId(event.clubId, organizationId);

        const belongsToManagedClass =
            managedClasses.includes(event.className);

        return belongsToOrganization || belongsToManagedClass;
    });

    const organizationJobs = allJobs.filter(job =>
        organizationId && sameId(job.clubId, organizationId)
    );

    const organizationJobIds = organizationJobs.map(job => job.id);

    const organizationApplications = applications.filter(application => {
        const belongsByOrganizationId =
            organizationId && application.clubId && sameId(application.clubId, organizationId);

        const belongsByJobId =
            hasId(organizationJobIds, application.jobId);

        return belongsByOrganizationId || belongsByJobId;
    });

    const pendingEvents = organizationEvents.filter(
        event => event.status === "pending"
    );

    const approvedEvents = organizationEvents.filter(
        event =>
            event.status === "approved" ||
            event.status === undefined
    );

    const organizationRankings = rankings.filter(
        ranking => managedClasses.includes(ranking.className)
    );

    const upcomingEvents = [...approvedEvents]
        .sort(
            (a, b) =>
                new Date(a.startDate) -
                new Date(b.startDate)
        )
        .slice(0, 5);

    const latestJobs = sortByNewest(organizationJobs)
        .slice(0, 5);

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div className="dashboard-hero-info">
                    <div className="dashboard-avatar">
                        ORG
                    </div>

                    <div>
                        <h1>{organizationName}</h1>

                        <p>
                            Administrador de organización
                        </p>

                        <p>
                            {organization
                                ? getOrganizationTypeLabel(organization)
                                : "Organización náutica"}
                        </p>

                        <p>
                            {organization
                                ? getLocationLabel(organization)
                                : `${currentUser.name} · ${currentUser.email}`}
                        </p>
                    </div>
                </div>

                <div className="dashboard-actions">
                    {organizationId && (
                        <>
                            <button
                                className="apply-button"
                                onClick={() => navigate(`/club-dashboard/${organizationId}/new-job`)}
                            >
                                Publicar oportunidad
                            </button>

                            <button
                                className="apply-button"
                                onClick={() => navigate(`/club-dashboard/${organizationId}/new-event`)}
                            >
                                Proponer evento
                            </button>

                            <button
                                className="apply-button"
                                onClick={() => navigate(`/applications/${organizationId}`)}
                            >
                                Ver postulaciones
                            </button>
                        </>
                    )}

                    <button
                        className="apply-button"
                        onClick={() => navigate("/calendar")}
                    >
                        Ver calendario
                    </button>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{organizationJobs.length}</h2>
                    <p>Oportunidades publicadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{organizationApplications.length}</h2>
                    <p>Postulaciones recibidas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{organizationEvents.length}</h2>
                    <p>Eventos vinculados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{pendingEvents.length}</h2>
                    <p>Eventos pendientes</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{managedClasses.length}</h2>
                    <p>Clases administradas</p>
                </div>
            </div>

            <div className="dashboard-main-grid">
                <div className="detail-card">
                    <div className="section-header">
                        <h3>Oportunidades recientes</h3>

                        {organizationId && (
                            <button
                                className="small-action-button"
                                onClick={() => navigate(`/club-dashboard/${organizationId}/new-job`)}
                            >
                                Nueva oportunidad
                            </button>
                        )}
                    </div>

                    {latestJobs.length > 0 ? (
                        <div className="dashboard-list">
                            {latestJobs.map(job => (
                                <div
                                    key={job.id}
                                    className="dashboard-list-item"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    <div>
                                        <h4>{job.title}</h4>

                                        <p>
                                            {job.category}
                                        </p>
                                    </div>

                                    <span>
                                        Ver
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>
                            Esta organización todavía no publicó oportunidades.
                        </p>
                    )}
                </div>

                <div className="detail-card">
                    <div className="section-header">
                        <h3>Próximos eventos</h3>

                        {organizationId && (
                            <button
                                className="small-action-button"
                                onClick={() => navigate(`/club-dashboard/${organizationId}/new-event`)}
                            >
                                Proponer evento
                            </button>
                        )}
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="dashboard-list">
                            {upcomingEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="dashboard-list-item"
                                    onClick={() => navigate(`/calendar/${event.id}`)}
                                >
                                    <div>
                                        <h4>{event.title}</h4>

                                        <p>
                                            {event.className}
                                        </p>

                                        <p>
                                            {getLocationLabel(event)}
                                        </p>
                                    </div>

                                    <span>
                                        {formatDate(event.startDate)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>
                            No hay próximos eventos vinculados a esta organización.
                        </p>
                    )}
                </div>

                <div className="detail-card">
                    <div className="section-header">
                        <h3>Revisión pendiente</h3>
                    </div>

                    {pendingEvents.length > 0 ? (
                        <div className="dashboard-list">
                            {pendingEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="dashboard-list-item"
                                    onClick={() => navigate(`/calendar/${event.id}`)}
                                >
                                    <div>
                                        <h4>{event.title}</h4>

                                        <p>
                                            {event.className}
                                        </p>

                                        <p>
                                            {getLocationLabel(event)}
                                        </p>
                                    </div>

                                    <span className="status-pill pending">
                                        Pendiente
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>
                            No hay eventos pendientes para revisar.
                        </p>
                    )}
                </div>

                <div className="detail-card">
                    <div className="section-header">
                        <h3>Alcance de esta cuenta</h3>
                    </div>

                    <p>
                        Esta cuenta administra una organización, no un club náutico.
                        Puede publicar oportunidades, proponer eventos y revisar
                        postulaciones asociadas a esa organización.
                    </p>

                    <p>
                        No tiene acceso global a usuarios, mensajes generales ni
                        moderación de toda la plataforma. Eso queda reservado al
                        superadmin.
                    </p>

                    {organizationRankings.length > 0 && (
                        <p>
                            También tiene rankings vinculados a sus clases asignadas.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrganizationAdminDashboard;
