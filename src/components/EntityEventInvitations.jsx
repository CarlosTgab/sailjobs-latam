import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import staticEvents from "../data/events";
import {
    syncEventsFromSupabase
} from "../utils/eventsStorage";
import {
    fetchEntityEventInvitations,
    respondToEventInvitation
} from "../utils/eventInvitationsStorage";

function formatDate(value) {
    if (!value) return "Fecha a confirmar";

    return new Date(`${value}T00:00:00`).toLocaleDateString(
        "es-AR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function getStatusLabel(status) {
    if (status === "accepted") return "Aceptada";
    if (status === "rejected") return "Rechazada";
    if (status === "cancelled") return "Cancelada";
    return "Pendiente";
}

function EntityEventInvitations({ entityId }) {
    const navigate = useNavigate();

    const [invitations, setInvitations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busyInvitationId, setBusyInvitationId] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadInvitations() {
            try {
                const loadedInvitations =
                    await fetchEntityEventInvitations(entityId);

                if (isMounted) {
                    setInvitations(loadedInvitations);
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error.message ||
                        "No se pudieron cargar las invitaciones institucionales."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        if (entityId) {
            loadInvitations();
        }

        return () => {
            isMounted = false;
        };
    }, [entityId]);

    const pendingInvitations = useMemo(
        () => invitations.filter(invitation => invitation.status === "pending"),
        [invitations]
    );

    const resolvedInvitations = useMemo(
        () => invitations.filter(invitation => invitation.status !== "pending"),
        [invitations]
    );

    async function refreshInvitations() {
        const loadedInvitations =
            await fetchEntityEventInvitations(entityId);

        setInvitations(loadedInvitations);
    }

    async function handleResponse(invitation, status) {
        setMessage("");
        setErrorMessage("");
        setBusyInvitationId(invitation.id);

        try {
            await respondToEventInvitation(invitation.id, status);
            await Promise.all([
                refreshInvitations(),
                syncEventsFromSupabase(staticEvents)
            ]);

            window.dispatchEvent(new Event("eventsChanged"));
            setMessage(
                status === "accepted"
                    ? `Invitación aceptada. ${invitation.eventTitle} ya forma parte de los eventos de tu entidad.`
                    : `Invitación rechazada para ${invitation.eventTitle}.`
            );
        } catch (error) {
            setErrorMessage(
                error.message || "No se pudo responder la invitación."
            );
        } finally {
            setBusyInvitationId("");
        }
    }

    function renderInvitation(invitation, allowResponse = false) {
        const isBusy = busyInvitationId === invitation.id;

        return (
            <div
                className="dashboard-list-item entity-event-invitation"
                key={invitation.id}
            >
                <div>
                    <div className="event-card-top">
                        <span className="sidebar-tag">
                            Coorganización
                        </span>

                        <span className={`status-pill ${
                            invitation.status === "accepted"
                                ? "approved"
                                : invitation.status === "rejected"
                                    ? "rejected"
                                    : "pending"
                        }`}>
                            {getStatusLabel(invitation.status)}
                        </span>
                    </div>

                    <h4>{invitation.eventTitle}</h4>

                    <p>
                        Invitación de: <strong>{invitation.inviterEntityName}</strong>
                    </p>

                    <p>{formatDate(invitation.eventStartDate)}</p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="small-action-button"
                        onClick={() => navigate(`/calendar/${invitation.eventId}`)}
                    >
                        Ver evento
                    </button>

                    {allowResponse && (
                        <>
                            <button
                                className="accept-button"
                                disabled={isBusy}
                                onClick={() => handleResponse(invitation, "accepted")}
                            >
                                {isBusy ? "Procesando..." : "Aceptar"}
                            </button>

                            <button
                                className="reject-button"
                                disabled={isBusy}
                                onClick={() => handleResponse(invitation, "rejected")}
                            >
                                Rechazar
                            </button>
                        </>
                    )}

                    {invitation.status === "accepted" && (
                        <button
                            className="apply-button"
                            onClick={() => navigate(
                                `/club-dashboard/${entityId}/new-job?eventId=${invitation.eventId}`
                            )}
                        >
                            Publicar oportunidad
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            id="entity-event-invitations"
            className="detail-card entity-event-invitations-card"
        >
            <div className="section-header">
                <div>
                    <h2>Invitaciones institucionales</h2>

                    <p>
                        Aceptá o rechazá invitaciones para colaborar en la organización
                        de eventos.
                    </p>
                </div>

                {pendingInvitations.length > 0 && (
                    <span className="invitation-count-badge">
                        {pendingInvitations.length} pendiente{pendingInvitations.length === 1 ? "" : "s"}
                    </span>
                )}
            </div>

            {message && (
                <p className="status-pill approved invitation-feedback">
                    {message}
                </p>
            )}

            {errorMessage && (
                <p className="status-pill rejected invitation-feedback">
                    {errorMessage}
                </p>
            )}

            {isLoading ? (
                <p>Cargando invitaciones...</p>
            ) : pendingInvitations.length > 0 ? (
                <div className="dashboard-list">
                    {pendingInvitations.map(invitation =>
                        renderInvitation(invitation, true)
                    )}
                </div>
            ) : (
                <p>No tenés invitaciones pendientes.</p>
            )}

            {resolvedInvitations.length > 0 && (
                <details className="invitation-history">
                    <summary>
                        Ver historial ({resolvedInvitations.length})
                    </summary>

                    <div className="dashboard-list">
                        {resolvedInvitations.map(invitation =>
                            renderInvitation(invitation)
                        )}
                    </div>
                </details>
            )}
        </div>
    );
}

export default EntityEventInvitations;
