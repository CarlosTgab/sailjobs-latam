import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { isSuperadmin } from "../utils/permissions";

import {
    EVENT_STATUS,
    EVENT_STATUS_LABELS
} from "../config/appConfig";

import {
    getStoredEvents,
    updateStoredEventStatus
} from "../utils/eventsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import { getCurrentUser } from "../utils/authStorage";
import { sameId } from "../utils/idUtils";

function AdminEvents() {

    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const [storedEvents, setStoredEvents] = useState(getStoredEvents());

    const clubs = getAllClubs(staticClubs);

    if (!currentUser || !isSuperadmin(currentUser)) {
        return (
            <div className="dashboard-page">

                <h1>Acceso denegado</h1>

                <p>
                    Solo un administrador puede revisar eventos pendientes.
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

    function refreshEvents() {
        setStoredEvents(getStoredEvents());
    }

    function handleApprove(eventId) {
        updateStoredEventStatus(eventId, EVENT_STATUS.APPROVED);
        refreshEvents();
    }

    function handleReject(eventId) {
        updateStoredEventStatus(eventId, EVENT_STATUS.REJECTED);
        refreshEvents();
    }

    function getClubName(clubId) {
        const club = clubs.find(
            club => sameId(club.id, clubId)
        );

        return club ? club.name : "Club no encontrado";
    }

    function getClub(clubId) {
        return clubs.find(
            club => sameId(club.id, clubId)
        );
    }

    function getStatusLabel(status) {
        return EVENT_STATUS_LABELS[status] || status;
    }

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(date + "T00:00:00").toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    }

    const pendingEvents = storedEvents.filter(
        event => event.status === EVENT_STATUS.PENDING
    );

    const reviewedEvents = storedEvents.filter(
        event =>
            event.status === EVENT_STATUS.APPROVED ||
            event.status === EVENT_STATUS.REJECTED
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
                    <h1>Revisión de eventos</h1>

                    <p>
                        Aprobá o rechazá los eventos propuestos por clubes antes
                        de publicarlos en el calendario.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/calendar")}
                    >
                        Ver calendario público
                    </button>
                </div>

            </div>

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <h2>{pendingEvents.length}</h2>
                    <p>Pendientes</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>
                        {
                            reviewedEvents.filter(
                                event => event.status === EVENT_STATUS.APPROVED
                            ).length
                        }
                    </h2>
                    <p>Aprobados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>
                        {
                            reviewedEvents.filter(
                                event => event.status === EVENT_STATUS.REJECTED
                            ).length
                        }
                    </h2>
                    <p>Rechazados</p>
                </div>

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Eventos pendientes</h2>
                </div>

                {pendingEvents.length > 0 ? (

                    <div className="dashboard-grid">

                        {pendingEvents.map(event => {

                            const club = getClub(event.clubId);

                            return (

                                <div
                                    className="dashboard-card"
                                    key={event.id}
                                >

                                    <div className="event-card-top">

                                        <span className="sidebar-tag">
                                            {event.className}
                                        </span>

                                        <span className="status-pill pending">
                                            {getStatusLabel(event.status)}
                                        </span>

                                    </div>

                                    <h3>{event.title}</h3>

                                    <p>
                                        <strong>Club:</strong>{" "}
                                        {getClubName(event.clubId)}
                                    </p>

                                    <p>
                                        <strong>Ubicación:</strong>{" "}
                                        {event.city}, {event.country}
                                    </p>

                                    <p>
                                        <strong>Fecha:</strong>{" "}
                                        {formatDate(event.startDate)}
                                        {" "}
                                        -
                                        {" "}
                                        {formatDate(event.endDate)}
                                    </p>

                                    {event.source && (
                                        <p>
                                            <strong>Fuente:</strong>{" "}
                                            {event.source}
                                        </p>
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

                                    {club && (
                                        <p
                                            className="detail-link"
                                            onClick={() => navigate(`/clubs/${club.id}`)}
                                        >
                                            Ver club organizador
                                        </p>
                                    )}

                                    <div className="status-actions">

                                        <button
                                            className="accept-button"
                                            onClick={() => handleApprove(event.id)}
                                        >
                                            Aprobar
                                        </button>

                                        <button
                                            className="reject-button"
                                            onClick={() => handleReject(event.id)}
                                        >
                                            Rechazar
                                        </button>

                                    </div>

                                </div>

                            );

                        })}

                    </div>

                ) : (

                    <p>
                        No hay eventos pendientes de revisión.
                    </p>

                )}

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Eventos revisados</h2>
                </div>

                {reviewedEvents.length > 0 ? (

                    <div className="dashboard-list">

                        {reviewedEvents.map(event => (

                            <div
                                key={event.id}
                                className="dashboard-list-item"
                                onClick={() => {
                                    if (event.status === EVENT_STATUS.APPROVED) {
                                        navigate(`/calendar/${event.id}`);
                                    }
                                }}
                            >

                                <div>
                                    <h4>{event.title}</h4>

                                    <p>
                                        {event.className}
                                        {" "}
                                        ·
                                        {" "}
                                        {event.city}, {event.country}
                                        {" "}
                                        ·
                                        {" "}
                                        {getClubName(event.clubId)}
                                    </p>
                                </div>

                                <span
                                    className={
                                        event.status === EVENT_STATUS.APPROVED
                                            ? "status-pill approved"
                                            : "status-pill rejected"
                                    }
                                >
                                    {getStatusLabel(event.status)}
                                </span>

                            </div>

                        ))}

                    </div>

                ) : (

                    <p>
                        Todavía no hay eventos aprobados o rechazados.
                    </p>

                )}

            </div>

        </div>

    );
}

export default AdminEvents;