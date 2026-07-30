import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getEntityTypeLabel,
    isOrganizationEntity
} from "../utils/clubsStorage";

import {
    getCurrentUser
} from "../utils/authStorage";

import {
    sameId,
    hasId,
    sortByNewest
} from "../utils/idUtils";

import staticJobs from "../data/jobs";
import {
    getAllJobs,
    syncJobsFromSupabase
} from "../utils/jobsStorage";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";

import { getApplications } from "../utils/applicationsStorage";

import {
    OPPORTUNITY_TYPE_LABELS,
    APPLICATION_STATUS
} from "../config/appConfig";

function ClubDashboard() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const clubs = getAllClubs(staticClubs);
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
    const events = getAllEvents(staticEvents);
    const applications = getApplications();

    const currentUser =
        getCurrentUser();

    const clubFromLocalData =
        clubs.find(
            item =>
                sameId(item.id, clubId)
        );

    const clubFromCurrentUser =
        currentUser &&
            sameId(currentUser.clubId, clubId)
            ? {
                id: currentUser.clubId,
                name: currentUser.clubName || currentUser.name || "Mi organización",
                country: currentUser.country || "",
                city: currentUser.city || "",
                description: currentUser.description || "",
                website: "",
                logo: currentUser.profileImage || "",
                logoUrl: currentUser.profileImage || "",
                entityType: currentUser.entityType || "club",
                organizationType: currentUser.organizationType || "club"
            }
            : null;

    const club =
        clubFromLocalData ||
        clubFromCurrentUser;

    if (!club) {
        return (
            <div className="dashboard-page">
                <h1>Organización no encontrada</h1>

                <p>
                    No pudimos encontrar el club u organización asociado a este panel.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/clubs")}
                >
                    ← Volver a clubes
                </button>
            </div>
        );
    }

    const entityIsOrganization =
        isOrganizationEntity(club);

    const entityLabel =
        getEntityTypeLabel(club);

    const clubJobs = jobs.filter(
        job => sameId(job.clubId, clubId)
    );

    const clubEvents = events.filter(
        event => sameId(event.clubId, clubId)
    );

    const clubJobIds = clubJobs.map(
        job => job.id
    );

    const clubApplications = applications.filter(application => {
        const belongsByClubId =
            application.clubId &&
            sameId(application.clubId, clubId);

        const belongsByJobId =
            hasId(clubJobIds, application.jobId);

        return belongsByClubId || belongsByJobId;
    });

    const pendingApplications = clubApplications.filter(
        application => application.status === APPLICATION_STATUS.PENDING
    );

    const acceptedApplications = clubApplications.filter(
        application => application.status === APPLICATION_STATUS.ACCEPTED
    );

    const latestOpportunities = sortByNewest(clubJobs)
        .slice(0, 4);

    const latestApplications = [...clubApplications]
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        )
        .slice(0, 4);

    const upcomingEvents = [...clubEvents]
        .sort(
            (a, b) =>
                new Date(a.startDate) -
                new Date(b.startDate)
        )
        .slice(0, 4);

    function getOpportunityTypeLabel(type) {
        return OPPORTUNITY_TYPE_LABELS[type] || "Trabajo profesional";
    }

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "es-AR"
        );
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

    function getApplicationJob(application) {
        return clubJobs.find(
            job => sameId(job.id, application.jobId)
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div className="dashboard-hero-info">
                    <img
                        src={club.logo || "/logos/default-club.svg"}
                        alt={club.name}
                        className="dashboard-club-logo"
                    />

                    <div>
                        <h1>{club.name}</h1>

                        <p>
                            {entityIsOrganization
                                ? "Panel de gestión de organización para publicar oportunidades, proponer eventos y revisar postulaciones."
                                : "Panel de gestión del club para publicar oportunidades, convocatorias, eventos y revisar postulaciones."}
                        </p>

                        <p>
                            {getLocationLabel(club)}
                        </p>

                        <p>
                            {entityLabel}
                        </p>
                    </div>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate(`/clubs/${clubId}`)}
                    >
                        Ver perfil público
                    </button>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/contact")}
                    >
                        Enviar feedback
                    </button>
                </div>
            </div>


            <div className="detail-card">
                <div className="section-header">
                    <div>
                        <h2>Centro de gestión del club</h2>
                        <p>
                            Accesos principales para administrar oportunidades, postulaciones,
                            propuestas de eventos y canales de soporte.
                        </p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <span className="sidebar-tag">Convocatorias</span>
                        <h3>Publicar oportunidad</h3>
                        <p>
                            Cargá búsquedas para coaches, instructores, oficiales, jurados,
                            medidores, voluntarios u otros perfiles náuticos.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() => navigate(`/club-dashboard/${clubId}/new-job`)}
                        >
                            Nueva oportunidad
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Calendario</span>
                        <h3>Proponer evento</h3>
                        <p>
                            Enviá una propuesta de evento para que una organización revisora
                            la apruebe antes de publicarla.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() => navigate(`/club-dashboard/${clubId}/new-event`)}
                        >
                            Proponer evento
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Postulaciones</span>
                        <h3>Postulaciones recibidas</h3>
                        <p>
                            Revisá candidatos y profesionales que aplicaron a oportunidades
                            publicadas por el club.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() => navigate(`/applications/${clubId}`)}
                        >
                            Ver postulaciones
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Público</span>
                        <h3>Perfil público del club</h3>
                        <p>
                            Mirá cómo ven el club los visitantes, profesionales y otras
                            instituciones dentro de SailJobs LATAM.
                        </p>
                        <button
                            className="apply-button"
                            onClick={() => navigate(`/clubs/${clubId}`)}
                        >
                            Ver perfil público
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Agenda</span>
                        <h3>Calendario</h3>
                        <p>
                            Revisá eventos publicados, eventos pendientes y actividad
                            vinculada al calendario náutico.
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
                            Consultá información del proyecto o mandá sugerencias para
                            mejorar la experiencia de clubes.
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
                    <h2>{clubJobs.length}</h2>
                    <p>Oportunidades publicadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{clubApplications.length}</h2>
                    <p>Postulaciones recibidas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{pendingApplications.length}</h2>
                    <p>Postulaciones pendientes</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{acceptedApplications.length}</h2>
                    <p>Postulaciones aceptadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{clubEvents.length}</h2>
                    <p>Eventos vinculados</p>
                </div>
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Oportunidades y convocatorias</h2>

                    <button
                        className="small-action-button"
                        onClick={() =>
                            navigate(`/club-dashboard/${clubId}/new-job`)
                        }
                    >
                        Nueva oportunidad
                    </button>
                </div>

                {latestOpportunities.length > 0 ? (
                    <div className="dashboard-grid">
                        {latestOpportunities.map(job => (
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
                                    <strong>Vacantes:</strong>{" "}
                                    {job.openings || 1}
                                </p>

                                {job.applicationDeadline && (
                                    <p>
                                        <strong>Fecha límite:</strong>{" "}
                                        {formatDate(job.applicationDeadline)}
                                    </p>
                                )}

                                <button
                                    className="apply-button"
                                    onClick={() =>
                                        navigate(`/jobs/${job.id}`)
                                    }
                                >
                                    Ver oportunidad
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        Todavía no publicaste oportunidades ni convocatorias.
                    </p>
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Últimas postulaciones</h2>

                    <button
                        className="small-action-button"
                        onClick={() =>
                            navigate(`/applications/${clubId}`)
                        }
                    >
                        Ver todas
                    </button>
                </div>

                {latestApplications.length > 0 ? (
                    <div className="dashboard-grid">
                        {latestApplications.map(application => {
                            const job = getApplicationJob(application);

                            return (
                                <div
                                    key={application.id}
                                    className="dashboard-card"
                                >
                                    <div className="event-card-top">
                                        <span className="sidebar-tag">
                                            {application.status || "Pendiente"}
                                        </span>
                                    </div>

                                    <h3>{application.name}</h3>

                                    <p>
                                        <strong>Oportunidad:</strong>{" "}
                                        {job ? job.title : "Oportunidad no encontrada"}
                                    </p>

                                    <p>
                                        <strong>Email:</strong>{" "}
                                        {application.email}
                                    </p>

                                    <p>
                                        <strong>País:</strong>{" "}
                                        {application.country || "No informado"}
                                    </p>

                                    <button
                                        className="apply-button"
                                        onClick={() =>
                                            navigate(`/applicant/${application.id}`)
                                        }
                                    >
                                        Ver perfil completo
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>
                        Todavía no recibiste postulaciones.
                    </p>
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Eventos de la organización</h2>

                    <button
                        className="small-action-button"
                        onClick={() =>
                            navigate(`/club-dashboard/${clubId}/new-event`)
                        }
                    >
                        Proponer evento
                    </button>
                </div>

                {upcomingEvents.length > 0 ? (
                    <div className="dashboard-grid">
                        {upcomingEvents.map(event => (
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
                                    <strong>Fecha:</strong>{" "}
                                    {formatDate(event.startDate)}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {getLocationLabel(event)}
                                </p>

                                <button
                                    className="apply-button"
                                    onClick={() =>
                                        navigate(`/calendar/${event.id}`)
                                    }
                                >
                                    Ver evento
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        Todavía no hay eventos vinculados a esta organización.
                    </p>
                )}
            </div>
        </div>
    );
}

export default ClubDashboard;