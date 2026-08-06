import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import {
    canReviewEvent,
    isOrganizationAdmin
} from "../utils/permissions";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getOrganizationTypeLabel
} from "../utils/clubsStorage";

import staticEvents from "../data/events";
import {
    eventHasClass,
    getAllEvents,
    getEventClassLabel,
    syncEventsFromSupabase,
    isPendingReviewEvent,
    isPublishedEvent,
    updateStoredEventStatus
} from "../utils/eventsStorage";

import staticJobs from "../data/jobs";
import {
    getAllJobs,
    syncJobsFromSupabase
} from "../utils/jobsStorage";

import useApplications from "../hooks/useApplications";
import { sameId, hasId, sortByNewest } from "../utils/idUtils";

import {
    EVENT_STATUS,
    EVENT_STATUS_LABELS
} from "../config/appConfig";

import rankings from "../data/rankings";

function normalizeName(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

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

function getStatusLabel(status) {
    return EVENT_STATUS_LABELS[status] || status || "Sin estado";
}

function OrganizationAdminDashboard() {
    const navigate = useNavigate();

    const { applications } = useApplications();
    const currentUser = getCurrentUser();

    const [allEvents, setAllEvents] = useState(() => getAllEvents(staticEvents));
    const [eventsMessage, setEventsMessage] = useState("");
    const [allJobs, setAllJobs] = useState(() => getAllJobs(staticJobs));
    const [jobsMessage, setJobsMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const syncedEvents = await syncEventsFromSupabase(staticEvents);

                if (isMounted) {
                    setAllEvents(syncedEvents);
                    setEventsMessage("");
                }
            } catch {
                if (isMounted) {
                    setAllEvents(getAllEvents(staticEvents));
                    setEventsMessage("No se pudo sincronizar con Supabase. Mostrando datos locales.");
                }
            }
        }

        async function loadJobs() {
            try {
                const syncedJobs = await syncJobsFromSupabase(staticJobs);

                if (isMounted) {
                    setAllJobs(syncedJobs);
                    setJobsMessage("");
                }
            } catch {
                if (isMounted) {
                    setAllJobs(getAllJobs(staticJobs));
                    setJobsMessage("No se pudo sincronizar oportunidades con Supabase. Mostrando datos locales.");
                }
            }
        }

        function refreshEventsFromLocalCache() {
            setAllEvents(getAllEvents(staticEvents));
        }

        function refreshJobsFromLocalCache() {
            setAllJobs(getAllJobs(staticJobs));
        }

        loadEvents();
        loadJobs();
        window.addEventListener("eventsChanged", refreshEventsFromLocalCache);
        window.addEventListener("jobsChanged", refreshJobsFromLocalCache);

        return () => {
            isMounted = false;
            window.removeEventListener("eventsChanged", refreshEventsFromLocalCache);
            window.removeEventListener("jobsChanged", refreshJobsFromLocalCache);
        };
    }, []);

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
        currentUser.name ||
        "Mi organización";

    const managedClasses = Array.isArray(currentUser.managedClasses)
        ? currentUser.managedClasses
        : [];


    async function refreshEvents() {
        try {
            const syncedEvents = await syncEventsFromSupabase(staticEvents);
            setAllEvents(syncedEvents);
            setEventsMessage("");
        } catch {
            setAllEvents(getAllEvents(staticEvents));
            setEventsMessage("No se pudo sincronizar con Supabase. Mostrando datos locales.");
        }
    }

    function eventBelongsToThisOrganization(event) {
        const matchesId =
            organizationId &&
            (
                sameId(event.reviewingOrganizationId, organizationId) ||
                sameId(event.organizationId, organizationId) ||
                sameId(event.ownerId, organizationId)
            );

        const normalizedOrganizationName = normalizeName(organizationName);

        const matchesName =
            normalizedOrganizationName &&
            [
                event.reviewingOrganizationName,
                event.organizationName,
                event.ownerName,
                event.source
            ]
                .filter(Boolean)
                .some(value => normalizeName(value) === normalizedOrganizationName);

        const matchesManagedClass =
            managedClasses.length > 0 &&
            managedClasses.some(className => eventHasClass(event, className));

        return matchesId || matchesName || matchesManagedClass;
    }

    const organizationEvents = allEvents.filter(eventBelongsToThisOrganization);

    const reviewRequests = organizationEvents.filter(isPendingReviewEvent);

    const publishedEvents = organizationEvents.filter(isPublishedEvent);

    const rejectedEvents = organizationEvents.filter(
        event => event.status === EVENT_STATUS.REJECTED
    );

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

    const organizationRankings = rankings.filter(
        ranking => managedClasses.includes(ranking.className)
    );

    const upcomingEvents = [...publishedEvents]
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

    async function approveEvent(event) {
        await updateStoredEventStatus(
            event.id,
            EVENT_STATUS.APPROVED,
            {
                ownerType: "organization",
                ownerId: organizationId || event.ownerId,
                ownerName: organizationName,
                organizationId: organizationId || event.organizationId,
                organizationName,
                reviewingOrganizationId: organizationId || event.reviewingOrganizationId,
                reviewingOrganizationName: organizationName,
                source: organizationName,
                isOfficial: true,
                reviewedBy: currentUser.name || currentUser.email,
                reviewMessage: "Aprobado y publicado por la organización."
            }
        );

        await refreshEvents();
    }

    async function rejectEvent(event) {
        const reason = window.prompt(
            "Motivo del rechazo:",
            event.reviewMessage || ""
        );

        if (reason === null) return;

        await updateStoredEventStatus(
            event.id,
            EVENT_STATUS.REJECTED,
            {
                ownerType: "organization",
                ownerId: organizationId || event.ownerId,
                ownerName: organizationName,
                organizationId: organizationId || event.organizationId,
                organizationName,
                reviewingOrganizationId: organizationId || event.reviewingOrganizationId,
                reviewingOrganizationName: organizationName,
                reviewedBy: currentUser.name || currentUser.email,
                reviewMessage: reason.trim() || "Rechazado por la organización."
            }
        );

        await refreshEvents();
    }

    async function requestChanges(event) {
        const reason = window.prompt(
            "Indicá qué cambios debe hacer el club:",
            event.reviewMessage || ""
        );

        if (reason === null) return;

        await updateStoredEventStatus(
            event.id,
            EVENT_STATUS.CHANGES_REQUESTED,
            {
                ownerType: "organization",
                ownerId: organizationId || event.ownerId,
                ownerName: organizationName,
                organizationId: organizationId || event.organizationId,
                organizationName,
                reviewingOrganizationId: organizationId || event.reviewingOrganizationId,
                reviewingOrganizationName: organizationName,
                reviewedBy: currentUser.name || currentUser.email,
                reviewMessage: reason.trim() || "La organización solicitó cambios."
            }
        );

        await refreshEvents();
    }

    function renderEventItem(event, mode = "view") {
        const userCanReview = canReviewEvent(currentUser, event);

        return (
            <div
                key={event.id}
                className="dashboard-list-item"
            >
                <div>
                    <h4>{event.title}</h4>

                    <p>
                        {getEventClassLabel(event)} · {getLocationLabel(event)}
                    </p>

                    <p>
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </p>

                    {event.proposedByName && (
                        <p>
                            Propuesto por: <strong>{event.proposedByName}</strong>
                        </p>
                    )}

                    {event.reviewMessage && (
                        <p>
                            Observación: {event.reviewMessage}
                        </p>
                    )}
                </div>

                <div className="dashboard-actions">
                    <span
                        className={
                            event.status === EVENT_STATUS.REJECTED
                                ? "status-pill rejected"
                                : isPublishedEvent(event)
                                    ? "status-pill approved"
                                    : "status-pill pending"
                        }
                    >
                        {getStatusLabel(event.status)}
                    </span>

                    <button
                        className="small-action-button"
                        onClick={() => navigate(`/calendar/${event.id}`)}
                    >
                        Ver
                    </button>

                    {userCanReview && (
                        <button
                            className="small-action-button"
                            onClick={() => navigate(`/calendar/${event.id}/edit`)}
                        >
                            Editar
                        </button>
                    )}

                    {mode === "review" && userCanReview && (
                        <>
                            <button
                                className="accept-button"
                                onClick={() => approveEvent(event)}
                            >
                                Aprobar y publicar
                            </button>

                            <button
                                className="small-action-button"
                                onClick={() => requestChanges(event)}
                            >
                                Pedir cambios
                            </button>

                            <button
                                className="reject-button"
                                onClick={() => rejectEvent(event)}
                            >
                                Rechazar
                            </button>
                        </>
                    )}
                </div>
            </div>
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
                    <button
                        className="apply-button"
                        onClick={() => navigate("/calendar")}
                    >
                        Ver calendario público
                    </button>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/contact")}
                    >
                        Enviar feedback
                    </button>
                </div>
            </div>

            {(eventsMessage || jobsMessage) && (
                <div className="detail-card">
                    {eventsMessage && (
                        <p style={{ color: "#b42318" }}>
                            {eventsMessage}
                        </p>
                    )}
                    {jobsMessage && (
                        <p style={{ color: "#b42318" }}>
                            {jobsMessage}
                        </p>
                    )}
                </div>
            )}


            <div className="detail-card">
                <div className="section-header">
                    <div>
                        <h2>Centro de gestión institucional</h2>
                        <p>
                            Desde acá se concentran las acciones de la organización: solicitudes,
                            eventos, oportunidades, postulaciones y soporte.
                        </p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <span className="sidebar-tag">Revisión</span>
                        <h3>Solicitudes de eventos</h3>
                        <p>
                            Revisá propuestas enviadas por clubes y decidí si se publican,
                            se rechazan o necesitan cambios.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() => {
                                const section = document.getElementById("organization-event-requests");
                                if (section) {
                                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                            }}
                        >
                            Ver solicitudes
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Calendario</span>
                        <h3>Publicar evento</h3>
                        <p>
                            Creá un evento institucional directamente en el calendario público
                            bajo responsabilidad de la organización.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() => navigate("/organization-admin/new-event")}
                        >
                            Publicar evento
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Convocatorias</span>
                        <h3>Publicar oportunidad</h3>
                        <p>
                            Cargá búsquedas institucionales para coaches, oficiales, jurados,
                            medidores, voluntarios u otros perfiles.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() =>
                                organizationId
                                    ? navigate(`/club-dashboard/${organizationId}/new-job`)
                                    : navigate("/organization-admin")
                            }
                        >
                            Nueva oportunidad
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Postulaciones</span>
                        <h3>Postulaciones recibidas</h3>
                        <p>
                            Revisá los profesionales que se postularon a oportunidades
                            publicadas por esta organización.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() =>
                                organizationId
                                    ? navigate(`/applications/${organizationId}`)
                                    : navigate("/organization-admin")
                            }
                        >
                            Ver postulaciones
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Público</span>
                        <h3>Calendario público</h3>
                        <p>
                            Controlá cómo se ven los eventos publicados para usuarios,
                            profesionales, clubes y visitantes.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() => navigate("/calendar")}
                        >
                            Ver calendario
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Soporte</span>
                        <h3>Feedback y sobre SailJobs</h3>
                        <p>
                            Accedé a la información del proyecto o enviá feedback para
                            mejorar la experiencia institucional.
                        </p>
                        <div className="dashboard-actions">
                            <button
                                className="small-action-button"
                                onClick={() => navigate("/about")}
                            >
                                Sobre nosotros
                            </button>

                            <button
                                className="small-action-button"
                                onClick={() => navigate("/contact")}
                            >
                                Feedback
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{reviewRequests.length}</h2>
                    <p>Solicitudes de eventos</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{publishedEvents.length}</h2>
                    <p>Eventos publicados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{organizationJobs.length}</h2>
                    <p>Oportunidades publicadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{organizationApplications.length}</h2>
                    <p>Postulaciones recibidas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{managedClasses.length}</h2>
                    <p>Clases administradas</p>
                </div>
            </div>

            <div className="dashboard-main-grid">
                <div
                    id="organization-event-requests"
                    className="detail-card"
                >
                    <div className="section-header">
                        <h3>Solicitudes de eventos</h3>
                    </div>

                    {reviewRequests.length > 0 ? (
                        <div className="dashboard-list">
                            {reviewRequests.map(event => renderEventItem(event, "review"))}
                        </div>
                    ) : (
                        <p>
                            No hay solicitudes pendientes para esta organización.
                        </p>
                    )}
                </div>

                <div className="detail-card">
                    <div className="section-header">
                        <h3>Eventos publicados</h3>

                        <button
                            className="small-action-button"
                            onClick={() => navigate("/organization-admin/new-event")}
                        >
                            Nuevo evento
                        </button>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="dashboard-list">
                            {upcomingEvents.map(event => renderEventItem(event))}
                        </div>
                    ) : (
                        <p>
                            Esta organización todavía no tiene eventos publicados.
                        </p>
                    )}
                </div>

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
                        <h3>Eventos rechazados / con cambios</h3>
                    </div>

                    {rejectedEvents.length > 0 ? (
                        <div className="dashboard-list">
                            {rejectedEvents.map(event => renderEventItem(event))}
                        </div>
                    ) : (
                        <p>
                            No hay eventos rechazados para esta organización.
                        </p>
                    )}
                </div>

                <div className="detail-card">
                    <div className="section-header">
                        <h3>Alcance de esta cuenta</h3>
                    </div>

                    <p>
                        Esta cuenta representa una organización náutica. Puede publicar
                        eventos directamente, revisar propuestas enviadas por clubes y
                        modificar los eventos del calendario que están bajo su responsabilidad.
                    </p>

                    <p>
                        El superadmin conserva la potestad de intervenir globalmente,
                        pero la aprobación deportiva o institucional normal queda en manos
                        de la organización revisora.
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
