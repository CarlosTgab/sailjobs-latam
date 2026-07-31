import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import HomeSidebar from "../components/HomeSidebar";

import {
    getCurrentUser,
    getUsers,
    hasProfessionalProfile
} from "../utils/authStorage";

import {
    EXPERIENCE_TYPES,
    getExperienceType,
    getHomeActionsForUser,
    getHomeExperienceCopy,
    shouldFeatureClassifieds
} from "../config/roleExperience";

import staticJobs from "../data/jobs";
import {
    getAllJobs,
    syncJobsFromSupabase
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import staticEvents from "../data/events";
import {
    getAllEvents,
    isPendingReviewEvent,
    isPublishedEvent
} from "../utils/eventsStorage";

import useApplications from "../hooks/useApplications";
import { getAllClassifieds } from "../utils/classifiedsStorage";
import { sameId, hasId, sortByNewest } from "../utils/idUtils";

import {
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

function normalizeText(value) {
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

function getEntityName(user) {
    return (
        user?.organizationName ||
        user?.clubName ||
        user?.entityName ||
        user?.name ||
        "Cuenta institucional"
    );
}

function getOrganizationId(user) {
    return user?.organizationId || user?.entityId || null;
}

function eventBelongsToOrganization(event, user) {
    const organizationId = getOrganizationId(user);
    const organizationName = normalizeText(getEntityName(user));
    const managedClasses = Array.isArray(user?.managedClasses)
        ? user.managedClasses
        : [];

    const matchesId =
        organizationId &&
        (
            sameId(event.reviewingOrganizationId, organizationId) ||
            sameId(event.organizationId, organizationId) ||
            sameId(event.ownerId, organizationId)
        );

    const matchesName =
        organizationName &&
        [
            event.reviewingOrganizationName,
            event.organizationName,
            event.ownerName,
            event.source
        ]
            .filter(Boolean)
            .some(value => normalizeText(value) === organizationName);

    const matchesManagedClass =
        managedClasses.length > 0 &&
        managedClasses.includes(event.className);

    return Boolean(matchesId || matchesName || matchesManagedClass);
}

function eventBelongsToClub(event, user) {
    if (!user?.clubId) {
        return false;
    }

    return (
        sameId(event.clubId, user.clubId) ||
        sameId(event.proposedById, user.clubId) ||
        sameId(event.ownerId, user.clubId)
    );
}

function jobBelongsToEntity(job, entityId, entityName) {
    if (entityId && sameId(job.clubId, entityId)) {
        return true;
    }

    const normalizedEntityName = normalizeText(entityName);

    return Boolean(
        normalizedEntityName &&
        [
            job.clubName,
            job.organizationName
        ]
            .filter(Boolean)
            .some(value => normalizeText(value) === normalizedEntityName)
    );
}

function Home() {
    const navigate = useNavigate();

    const { applications } = useApplications();

    const currentUser = getCurrentUser();
    const experienceType = getExperienceType(currentUser);
    const homeCopy = getHomeExperienceCopy(currentUser);
    const homeActions = getHomeActionsForUser(currentUser);
    const showClassifiedsStat = shouldFeatureClassifieds(currentUser);

    const users = getUsers();
    const [jobs, setJobs] = useState(() => getAllJobs(staticJobs));

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
    const clubs = getAllClubs(staticClubs);
    const events = getAllEvents(staticEvents);
    const classifieds = getAllClassifieds();

    const professionals = users.filter(user =>
        hasProfessionalProfile(user)
    );

    const latestOpportunities = sortByNewest(jobs)
        .slice(0, 3);

    const upcomingEvents = [...events]
        .filter(isPublishedEvent)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 3);

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

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(`${date}T00:00:00`).toLocaleDateString("es-AR");
    }

    function renderInstitutionalHome() {
        const isOrganization = experienceType === EXPERIENCE_TYPES.ORGANIZATION;
        const isClub = experienceType === EXPERIENCE_TYPES.CLUB;
        const isSuperadmin = experienceType === EXPERIENCE_TYPES.SUPERADMIN;

        if (!isOrganization && !isClub && !isSuperadmin) {
            return null;
        }

        if (isSuperadmin) {
            const pendingEvents = events.filter(isPendingReviewEvent);
            const hiddenJobs = jobs.filter(job => job.status === "hidden" || job.status === "inactive");
            const hiddenClassifieds = classifieds.filter(item => item.status === "hidden" || item.status === "inactive");

            return (
                <>
                    <div className="dashboard-stats">
                        <div className="dashboard-stat-card">
                            <h2>{pendingEvents.length}</h2>
                            <p>Eventos pendientes</p>
                        </div>

                        <div className="dashboard-stat-card">
                            <h2>{jobs.length}</h2>
                            <p>Oportunidades totales</p>
                        </div>

                        <div className="dashboard-stat-card">
                            <h2>{classifieds.length}</h2>
                            <p>Clasificados totales</p>
                        </div>

                        <div className="dashboard-stat-card">
                            <h2>{hiddenJobs.length + hiddenClassifieds.length}</h2>
                            <p>Publicaciones dadas de baja</p>
                        </div>
                    </div>

                    <div className="dashboard-main-grid">
                        <section className="detail-card">
                            <div className="section-header">
                                <h2>Acciones administrativas</h2>
                            </div>

                            <div className="dashboard-actions">
                                <button className="apply-button" onClick={() => navigate("/admin/events")}>Moderar eventos</button>
                                <button className="apply-button" onClick={() => navigate("/admin/jobs")}>Moderar oportunidades</button>
                                <button className="apply-button" onClick={() => navigate("/admin/classifieds")}>Moderar clasificados</button>
                                <button className="apply-button" onClick={() => navigate("/admin/import-fay")}>Importar FAY</button>
                            </div>
                        </section>

                        <section className="detail-card">
                            <div className="section-header">
                                <h2>Eventos pendientes</h2>

                                <button className="small-action-button" onClick={() => navigate("/admin/events")}>Ver todos</button>
                            </div>

                            {pendingEvents.length > 0 ? (
                                <div className="dashboard-list">
                                    {pendingEvents.slice(0, 4).map(event => (
                                        <div key={event.id} className="dashboard-list-item" onClick={() => navigate(`/calendar/${event.id}`)}>
                                            <div>
                                                <h4>{event.title}</h4>
                                                <p>{event.className} · {getLocationLabel(event)}</p>
                                            </div>
                                            <span>Ver</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No hay eventos pendientes.</p>
                            )}
                        </section>
                    </div>
                </>
            );
        }

        const entityId = isOrganization
            ? getOrganizationId(currentUser)
            : currentUser?.clubId;

        const entityName = getEntityName(currentUser);

        const entityEvents = events.filter(event =>
            isOrganization
                ? eventBelongsToOrganization(event, currentUser)
                : eventBelongsToClub(event, currentUser)
        );

        const entityJobs = jobs.filter(job =>
            jobBelongsToEntity(job, entityId, entityName)
        );

        const entityJobIds = entityJobs.map(job => job.id);

        const entityApplications = applications.filter(application =>
            (entityId && sameId(application.clubId, entityId)) ||
            hasId(entityJobIds, application.jobId)
        );

        const pendingRequests = isOrganization
            ? entityEvents.filter(isPendingReviewEvent)
            : [];

        const publishedEntityEvents = entityEvents
            .filter(isPublishedEvent)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        return (
            <>
                <div className="dashboard-stats">
                    {isOrganization && (
                        <div className="dashboard-stat-card">
                            <h2>{pendingRequests.length}</h2>
                            <p>Solicitudes pendientes</p>
                        </div>
                    )}

                    <div className="dashboard-stat-card">
                        <h2>{publishedEntityEvents.length}</h2>
                        <p>Eventos publicados</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{entityJobs.length}</h2>
                        <p>Oportunidades publicadas</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{entityApplications.length}</h2>
                        <p>Postulaciones recibidas</p>
                    </div>
                </div>

                <div className="dashboard-main-grid">
                    <section className="detail-card">
                        <div className="section-header">
                            <h2>
                                {isOrganization
                                    ? "Acciones institucionales"
                                    : "Acciones del club"}
                            </h2>
                        </div>

                        <p>
                            {isOrganization
                                ? "Gestioná eventos, solicitudes de clubes y convocatorias publicadas por tu organización."
                                : "Gestioná oportunidades, postulaciones recibidas y propuestas de eventos de tu club."}
                        </p>

                        <div className="dashboard-actions">
                            <button
                                className="apply-button"
                                onClick={() => navigate(isOrganization ? "/organization-admin" : `/club-dashboard/${entityId}`)}
                            >
                                {isOrganization ? "Mi organización" : "Mi club"}
                            </button>

                            <button
                                className="apply-button"
                                onClick={() => navigate(isOrganization ? "/organization-admin/new-event" : `/club-dashboard/${entityId}/new-event`)}
                            >
                                {isOrganization ? "Publicar evento" : "Proponer evento"}
                            </button>

                            {entityId && (
                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/club-dashboard/${entityId}/new-job`)}
                                >
                                    Publicar oportunidad
                                </button>
                            )}

                            {entityId && (
                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/applications/${entityId}`)}
                                >
                                    Ver postulaciones
                                </button>
                            )}
                        </div>
                    </section>

                    {isOrganization && (
                        <section className="detail-card">
                            <div className="section-header">
                                <h2>Solicitudes de eventos</h2>

                                <button
                                    className="small-action-button"
                                    onClick={() => navigate("/organization-admin")}
                                >
                                    Revisar
                                </button>
                            </div>

                            {pendingRequests.length > 0 ? (
                                <div className="dashboard-list">
                                    {pendingRequests.slice(0, 4).map(event => (
                                        <div
                                            key={event.id}
                                            className="dashboard-list-item"
                                            onClick={() => navigate(`/calendar/${event.id}`)}
                                        >
                                            <div>
                                                <h4>{event.title}</h4>
                                                <p>{event.className} · {getLocationLabel(event)}</p>
                                                {event.proposedByName && (
                                                    <p>Propuesto por: {event.proposedByName}</p>
                                                )}
                                            </div>

                                            <span>Ver</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No hay solicitudes pendientes para tu organización.</p>
                            )}
                        </section>
                    )}

                    <section className="detail-card">
                        <div className="section-header">
                            <h2>Eventos próximos</h2>

                            <button
                                className="small-action-button"
                                onClick={() => navigate("/calendar")}
                            >
                                Ver calendario
                            </button>
                        </div>

                        {publishedEntityEvents.length > 0 ? (
                            <div className="dashboard-list">
                                {publishedEntityEvents.slice(0, 4).map(event => (
                                    <div
                                        key={event.id}
                                        className="dashboard-list-item"
                                        onClick={() => navigate(`/calendar/${event.id}`)}
                                    >
                                        <div>
                                            <h4>{event.title}</h4>
                                            <p>{event.className} · {getLocationLabel(event)}</p>
                                            <p>{formatDate(event.startDate)}</p>
                                        </div>

                                        <span>Ver</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>
                                {isOrganization
                                    ? "Todavía no hay eventos publicados por tu organización."
                                    : "Todavía no hay eventos vinculados a tu club."}
                            </p>
                        )}
                    </section>

                    <section className="detail-card">
                        <div className="section-header">
                            <h2>Oportunidades publicadas</h2>

                            {entityId && (
                                <button
                                    className="small-action-button"
                                    onClick={() => navigate(`/club-dashboard/${entityId}/new-job`)}
                                >
                                    Nueva oportunidad
                                </button>
                            )}
                        </div>

                        {entityJobs.length > 0 ? (
                            <div className="dashboard-list">
                                {sortByNewest(entityJobs).slice(0, 4).map(job => (
                                    <div
                                        key={job.id}
                                        className="dashboard-list-item"
                                        onClick={() => navigate(`/jobs/${job.id}`)}
                                    >
                                        <div>
                                            <h4>{job.title}</h4>
                                            <p>{job.category} · {getLocationLabel(job)}</p>
                                        </div>

                                        <span>Ver</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No hay oportunidades publicadas desde esta cuenta institucional.</p>
                        )}
                    </section>
                </div>
            </>
        );
    }

    function renderCommunityHome() {
        return (
            <>
                <div className="dashboard-stats">
                    <div className="dashboard-stat-card">
                        <h2>{jobs.length}</h2>
                        <p>Oportunidades y convocatorias</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{professionals.length}</h2>
                        <p>Profesionales náuticos</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{clubs.length}</h2>
                        <p>Clubes / organizaciones</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{events.length}</h2>
                        <p>Eventos en calendario</p>
                    </div>

                    {showClassifiedsStat && (
                        <div className="dashboard-stat-card">
                            <h2>{classifieds.length}</h2>
                            <p>Clasificados publicados</p>
                        </div>
                    )}
                </div>

                <div className="home-dashboard-layout">
                    <main className="home-main-content">
                        <section className="detail-card">
                            <div className="section-header">
                                <h2>Oportunidades recientes</h2>

                                <button
                                    className="small-action-button"
                                    onClick={() => navigate("/jobs")}
                                >
                                    Ver todas
                                </button>
                            </div>

                            {latestOpportunities.length > 0 ? (
                                <div className="dashboard-grid">
                                    {latestOpportunities.map(job => {
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

                                                <h3>{job.title}</h3>

                                                <p>
                                                    <strong>Organización:</strong>{" "}
                                                    {club ? club.name : job.clubName || job.organizationName || "No informada"}
                                                </p>

                                                <p>
                                                    <strong>Ubicación:</strong>{" "}
                                                    {getLocationLabel(job)}
                                                </p>

                                                <p>
                                                    <strong>Compensación:</strong>{" "}
                                                    {getCompensationLabel(job)}
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
                                <p>Todavía no hay oportunidades publicadas.</p>
                            )}
                        </section>

                        <section className="detail-card">
                            <div className="section-header">
                                <h2>Próximos eventos</h2>

                                <button
                                    className="small-action-button"
                                    onClick={() => navigate("/calendar")}
                                >
                                    Ver calendario
                                </button>
                            </div>

                            {upcomingEvents.length > 0 ? (
                                <div className="dashboard-grid">
                                    {upcomingEvents.map(event => {
                                        const club = getClub(event.clubId);

                                        return (
                                            <div
                                                key={event.id}
                                                className="dashboard-card"
                                            >
                                                <div className="event-card-top">
                                                    <span className="sidebar-tag">
                                                        {event.className}
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
                                                    <strong>Organización:</strong>{" "}
                                                    {event.organizationName || event.ownerName || club?.name || "No informada"}
                                                </p>

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
                                        );
                                    })}
                                </div>
                            ) : (
                                <p>Todavía no hay eventos cargados.</p>
                            )}
                        </section>
                    </main>

                    <HomeSidebar />
                </div>
            </>
        );
    }

    return (
        <div className="dashboard-page">
            <section className="home-landing-hero">
                <div className="home-landing-overlay">
                    <div className="home-landing-content">
                        <span className="sidebar-tag">
                            {homeCopy.tag}
                        </span>

                        <h1>{homeCopy.title}</h1>

                        <p>{homeCopy.description}</p>

                        <div className="dashboard-actions">
                            {homeActions.map(action => (
                                <button
                                    key={`${action.to}-${action.label}`}
                                    className="apply-button"
                                    onClick={() => navigate(action.to)}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {experienceType === EXPERIENCE_TYPES.ORGANIZATION ||
            experienceType === EXPERIENCE_TYPES.CLUB ||
            experienceType === EXPERIENCE_TYPES.SUPERADMIN
                ? renderInstitutionalHome()
                : renderCommunityHome()}
        </div>
    );
}

export default Home;
