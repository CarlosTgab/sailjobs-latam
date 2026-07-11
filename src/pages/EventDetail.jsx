import { useParams, useNavigate } from "react-router-dom";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import {
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const events = getAllEvents(staticEvents);
    const clubs = getAllClubs(staticClubs);
    const jobs = getAllJobs(staticJobs);

    const event = events.find(
        item => Number(item.id) === Number(id)
    );

    if (!event) {
        return (
            <div className="dashboard-page">
                <h1>Evento no encontrado</h1>

                <button
                    className="back-button"
                    onClick={() => navigate("/calendar")}
                >
                    ← Volver al calendario
                </button>
            </div>
        );
    }

    const club = clubs.find(
        item => Number(item.id) === Number(event.clubId)
    );

    const linkedOpportunities = jobs.filter(
        job => Number(job.eventId) === Number(event.id)
    );

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

    return (
        <div className="event-detail">
            <button
                className="back-button"
                onClick={() => navigate("/calendar")}
            >
                ← Volver al calendario
            </button>

            <div className="event-detail-hero">
                <div>
                    <span className="sidebar-tag">
                        {event.className}
                    </span>

                    {event.isOfficial && (
                        <span className="status-pill approved">
                            Oficial
                        </span>
                    )}

                    {!event.isOfficial && (
                        <span className="status-pill pending">
                            Comunitario
                        </span>
                    )}

                    <h1>{event.title}</h1>

                    <p>
                        {event.city}, {event.country}
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <h2>Información del evento</h2>

                <p>
                    <strong>Clase:</strong>{" "}
                    {event.className}
                </p>

                <p>
                    <strong>Fecha de inicio:</strong>{" "}
                    {formatDate(event.startDate)}
                </p>

                <p>
                    <strong>Fecha de finalización:</strong>{" "}
                    {formatDate(event.endDate)}
                </p>

                <p>
                    <strong>Ubicación:</strong>{" "}
                    {event.city}, {event.country}
                </p>

                {club && (
                    <p>
                        <strong>Organizador:</strong>{" "}

                        <span
                            className="detail-link"
                            onClick={() => navigate(`/clubs/${club.id}`)}
                        >
                            {club.name}
                        </span>
                    </p>
                )}

                {event.description && (
                    <>
                        <p>
                            <strong>Descripción:</strong>
                        </p>

                        <p>{event.description}</p>
                    </>
                )}

                {event.website && (
                    <p>
                        <strong>Web:</strong>{" "}

                        <a
                            href={event.website}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Ver sitio
                        </a>
                    </p>
                )}

                {event.source && (
                    <p>
                        <strong>Fuente:</strong>{" "}
                        {event.source}
                    </p>
                )}

                {event.sourceUrl && (
                    <p>
                        <strong>Fuente original:</strong>{" "}

                        <a
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Ver fuente
                        </a>
                    </p>
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Convocatorias del campeonato</h2>

                    {club && (
                        <button
                            className="small-action-button"
                            onClick={() =>
                                navigate(`/club-dashboard/${club.id}/new-job`)
                            }
                        >
                            Publicar convocatoria
                        </button>
                    )}
                </div>

                {linkedOpportunities.length > 0 ? (
                    <div className="dashboard-grid">
                        {linkedOpportunities.map(job => (
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
                                    <strong>Vacantes:</strong>{" "}
                                    {job.openings || 1}
                                </p>

                                <p>
                                    <strong>Compensación:</strong>{" "}
                                    {getCompensationLabel(job)}
                                </p>

                                {job.applicationDeadline && (
                                    <p>
                                        <strong>Fecha límite:</strong>{" "}
                                        {formatDate(job.applicationDeadline)}
                                    </p>
                                )}

                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    Ver convocatoria
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        Este evento todavía no tiene convocatorias publicadas
                        para jurados, oficiales de regata, chairman, medidores,
                        voluntarios u otros roles.
                    </p>
                )}
            </div>
        </div>
    );
}

export default EventDetail;