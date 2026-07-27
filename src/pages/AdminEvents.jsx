import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { isSuperadmin } from "../utils/permissions";

import {
    EVENT_STATUS,
    EVENT_STATUS_LABELS
} from "../config/appConfig";

import {
    getStoredEvents,
    updateStoredEventStatus,
    deleteStoredEvent
} from "../utils/eventsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import { getCurrentUser } from "../utils/authStorage";
import { sameId } from "../utils/idUtils";

function getEventCityName(event) {
    if (event.cityName) {
        return event.cityName;
    }

    if (event.city && String(event.city).includes(",")) {
        return String(event.city).split(",")[0].trim();
    }

    return event.city || "";
}

function getLocationLabel(event) {
    const parts = [
        getEventCityName(event),
        event.state,
        event.country
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

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

    function handleDelete(eventId) {
        const confirmed = window.confirm(
            "¿Seguro que querés eliminar este evento importado o propuesto?"
        );

        if (!confirmed) return;

        deleteStoredEvent(eventId);
        refreshEvents();
    }

    function getClub(clubId) {
        return clubs.find(
            club => sameId(club.id, clubId)
        );
    }

    function getOrganizerName(event) {
        const club = getClub(event.clubId);

        if (club) {
            return club.name;
        }

        if (event.organizationName) {
            return event.organizationName;
        }

        if (event.organizingClubName) {
            return event.organizingClubName;
        }

        if (event.source) {
            return event.source;
        }

        return "Organizador no informado";
    }

    function getOrganizerLabel(event) {
        if (event.organizerType === "organization" || event.organizationName) {
            return "Organización";
        }

        if (event.organizingClubName && !event.clubId) {
            return "Organizador indicado";
        }

        return "Club";
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

    const fayEvents = storedEvents.filter(
        event => event.externalSource === "fay" || event.source === "FAY"
    );

    function renderEventCard(event, mode) {
        const club = getClub(event.clubId);

        return (
            <div
                className="dashboard-card"
                key={event.id}
            >

                <div className="event-card-top">

                    <span className="sidebar-tag">
                        {event.className || "Evento"}
                    </span>

                    <span
                        className={
                            event.status === EVENT_STATUS.APPROVED
                                ? "status-pill approved"
                                : event.status === EVENT_STATUS.REJECTED
                                    ? "status-pill rejected"
                                    : "status-pill pending"
                        }
                    >
                        {getStatusLabel(event.status)}
                    </span>

                </div>

                <h3>{event.title}</h3>

                <p>
                    <strong>{getOrganizerLabel(event)}:</strong>{" "}
                    {getOrganizerName(event)}
                </p>

                <p>
                    <strong>Ubicación:</strong>{" "}
                    {getLocationLabel(event)}
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

                    {mode === "pending" && (
                        <>
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
                        </>
                    )}

                    {mode === "reviewed" && event.status === EVENT_STATUS.REJECTED && (
                        <button
                            className="accept-button"
                            onClick={() => handleApprove(event.id)}
                        >
                            Restaurar / aprobar
                        </button>
                    )}

                    {event.status === EVENT_STATUS.APPROVED && (
                        <button
                            className="small-action-button"
                            onClick={() => navigate(`/calendar/${event.id}`)}
                        >
                            Ver público
                        </button>
                    )}

                    <button
                        className="reject-button"
                        onClick={() => handleDelete(event.id)}
                    >
                        Eliminar
                    </button>

                </div>

            </div>
        );
    }

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
                        Aprobá o rechazá eventos propuestos por clubes y organizaciones.
                        También podés controlar eventos oficiales importados desde FAY.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/admin/import-fay")}
                    >
                        Importar calendario FAY
                    </button>

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

                <div className="dashboard-stat-card">
                    <h2>{fayEvents.length}</h2>
                    <p>Importados desde FAY</p>
                </div>

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Eventos pendientes</h2>
                </div>

                {pendingEvents.length > 0 ? (

                    <div className="dashboard-grid">
                        {pendingEvents.map(event => renderEventCard(event, "pending"))}
                    </div>

                ) : (

                    <p>
                        No hay eventos pendientes de revisión.
                    </p>

                )}

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Eventos revisados e importados</h2>
                </div>

                {reviewedEvents.length > 0 ? (
                    <div className="dashboard-grid">
                        {reviewedEvents.map(event => renderEventCard(event, "reviewed"))}
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
