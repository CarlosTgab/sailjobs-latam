import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import staticEvents from "../data/events";
import { getAllEvents, syncEventsFromSupabase } from "../utils/eventsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";
import { sameId } from "../utils/idUtils";
import { getCurrentUser } from "../utils/authStorage";
import {
    canManageEvent
} from "../utils/permissions";

import {
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

function getEventCityName(event) {
    if (event?.cityName) {
        return event.cityName;
    }

    if (event?.city && event.city.includes(",")) {
        return event.city.split(",")[0].trim();
    }

    return event?.city || "";
}

function getEventLocationLabel(event) {
    const parts = [
        getEventCityName(event),
        event?.state,
        event?.country
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(", ");
    }

    return "Ubicación no informada";
}

function getJobCityName(job) {
    if (job?.cityName) {
        return job.cityName;
    }

    if (job?.city && job.city.includes(",")) {
        return job.city.split(",")[0].trim();
    }

    return job?.city || "";
}

function getJobLocationLabel(job) {
    const parts = [
        getJobCityName(job),
        job?.state,
        job?.country
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(", ");
    }

    return "Ubicación no informada";
}

function getEventOrganizerName(event, club) {
    if (club) {
        return club.name;
    }

    if (event?.organizationName) {
        return event.organizationName;
    }

    if (event?.organizingClubName) {
        return event.organizingClubName;
    }

    if (event?.source) {
        return event.source;
    }

    return "Organizador no informado";
}

function getEventOrganizerLabel(event, club) {
    if (club) {
        return "Club organizador";
    }

    if (event?.organizerType === "organization" || event?.organizationName) {
        return "Organización";
    }

    if (event?.organizingClubName) {
        return "Organizador indicado";
    }

    return "Organizador";
}


function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const [events, setEvents] = useState(() => getAllEvents(staticEvents));
    const [isLoadingOnlineEvent, setIsLoadingOnlineEvent] = useState(true);

    const clubs = getAllClubs(staticClubs);
    const jobs = getAllJobs(staticJobs);

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const syncedEvents = await syncEventsFromSupabase(staticEvents);

                if (isMounted) {
                    setEvents(syncedEvents);
                }
            } catch {
                if (isMounted) {
                    setEvents(getAllEvents(staticEvents));
                }
            } finally {
                if (isMounted) {
                    setIsLoadingOnlineEvent(false);
                }
            }
        }

        function refreshFromLocalCache() {
            setEvents(getAllEvents(staticEvents));
        }

        loadEvents();
        window.addEventListener("eventsChanged", refreshFromLocalCache);

        return () => {
            isMounted = false;
            window.removeEventListener("eventsChanged", refreshFromLocalCache);
        };
    }, []);

    const event = events.find(
        item =>
            sameId(item.id, id) ||
            sameId(item.legacyId, id)
    );

    if (!event) {
        return (
            <div className="dashboard-page">
                <h1>{isLoadingOnlineEvent ? "Buscando evento..." : "Evento no encontrado"}</h1>

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
        item => sameId(item.id, event.clubId)
    );

    const organizerName = getEventOrganizerName(event, club);
    const organizerLabel = getEventOrganizerLabel(event, club);
    const userCanEditEvent = canManageEvent(currentUser, event);

    const linkedOpportunities = jobs.filter(
        job => sameId(job.eventId, event.id)
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
                            {event.source === "FAY" ? "Oficial FAY" : "Oficial"}
                        </span>
                    )}

                    {!event.isOfficial && (
                        <span className="status-pill pending">
                            Comunitario
                        </span>
                    )}

                    <h1>{event.title}</h1>

                    <p>
                        {getEventLocationLabel(event)}
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Información del evento</h2>

                    {userCanEditEvent && (
                        <button
                            className="small-action-button"
                            onClick={() => navigate(`/calendar/${event.id}/edit`)}
                        >
                            Editar evento
                        </button>
                    )}
                </div>

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
                    {getEventLocationLabel(event)}
                </p>

                {event.state && (
                    <p>
                        <strong>Provincia / Estado:</strong>{" "}
                        {event.state}
                    </p>
                )}

                <p>
                    <strong>{organizerLabel}:</strong>{" "}

                    {club ? (
                        <span
                            className="detail-link"
                            onClick={() => navigate(`/clubs/${club.id}`)}
                        >
                            {organizerName}
                        </span>
                    ) : (
                        organizerName
                    )}
                </p>

                {event.organizingClubName && !club && event.organizationName && (
                    <p>
                        <strong>Club / sede indicada por FAY:</strong>{" "}
                        {event.organizingClubName}
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
                                    <strong>Ubicación:</strong>{" "}
                                    {getJobLocationLabel(job)}
                                </p>

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
