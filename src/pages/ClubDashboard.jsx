import { useNavigate, useParams } from "react-router-dom";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

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
    const jobs = getAllJobs(staticJobs);
    const events = getAllEvents(staticEvents);
    const applications = getApplications();

    const club = clubs.find(
        item => Number(item.id) === Number(clubId)
    );

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

    const clubJobs = jobs.filter(
        job => Number(job.clubId) === Number(clubId)
    );

    const clubEvents = events.filter(
        event => Number(event.clubId) === Number(clubId)
    );

    const clubJobIds = clubJobs.map(
        job => Number(job.id)
    );

    const clubApplications = applications.filter(application => {
        const belongsByClubId =
            application.clubId &&
            Number(application.clubId) === Number(clubId);

        const belongsByJobId =
            clubJobIds.includes(Number(application.jobId));

        return belongsByClubId || belongsByJobId;
    });

    const pendingApplications = clubApplications.filter(
        application => application.status === APPLICATION_STATUS.PENDING
    );

    const acceptedApplications = clubApplications.filter(
        application => application.status === APPLICATION_STATUS.ACCEPTED
    );

    const latestOpportunities = [...clubJobs]
        .sort((a, b) => Number(b.id) - Number(a.id))
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

    function getApplicationJob(application) {
        return clubJobs.find(
            job => Number(job.id) === Number(application.jobId)
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
                            Panel de gestión para publicar oportunidades,
                            convocatorias, eventos y revisar postulaciones.
                        </p>

                        <p>
                            {club.city}, {club.country}
                        </p>
                    </div>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() =>
                            navigate(`/club-dashboard/${clubId}/new-job`)
                        }
                    >
                        Publicar oportunidad
                    </button>

                    <button
                        className="apply-button"
                        onClick={() =>
                            navigate(`/club-dashboard/${clubId}/new-event`)
                        }
                    >
                        Proponer evento
                    </button>

                    <button
                        className="apply-button"
                        onClick={() =>
                            navigate(`/applications/${clubId}`)
                        }
                    >
                        Ver postulaciones
                    </button>
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
                                    {job.city}, {job.country}
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
                                    {event.city}, {event.country}
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