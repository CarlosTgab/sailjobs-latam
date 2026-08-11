import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    cancelEventRegistration,
    fetchEventRegistrations,
    fetchMyEventRegistration,
    reviewEventRegistration,
    submitEventRegistration
} from "../utils/eventRegistrationsStorage";

import {
    isClubAdmin,
    isOrganizationAdmin,
    isSuperadmin
} from "../utils/permissions";

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(value || "")
    );
}

function getStatusLabel(status) {
    if (status === "confirmed") return "Confirmada";
    if (status === "waitlist") return "Lista de espera";
    if (status === "rejected") return "Rechazada";
    if (status === "cancelled") return "Cancelada";
    return "Pendiente";
}

function getStatusClass(status) {
    if (status === "confirmed") return "approved";
    if (status === "rejected" || status === "cancelled") return "rejected";
    return "pending";
}

function EventRegistrationPanel({ event, currentUser, canManage }) {
    const navigate = useNavigate();

    const [myRegistration, setMyRegistration] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [className, setClassName] = useState("");
    const [sailNumber, setSailNumber] = useState("");
    const [crewName, setCrewName] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const eventIdIsValid = isUuid(event?.id);
    const isEntityAccount = Boolean(
        currentUser && (
            isClubAdmin(currentUser) ||
            isOrganizationAdmin(currentUser) ||
            isSuperadmin(currentUser)
        )
    );
    const canRegister = Boolean(currentUser && !isEntityAccount && eventIdIsValid);

    const classOptions = useMemo(() => {
        const values = Array.isArray(event?.classNames)
            ? event.classNames
            : Array.isArray(event?.classes)
                ? event.classes
            : String(event?.className || event?.class || "")
                .split(/[,/]/);

        return [...new Set(
            values.map(value => String(value || "").trim()).filter(Boolean)
        )];
    }, [event]);

    const loadRegistrations = useCallback(async () => {
        if (!eventIdIsValid || !currentUser) {
            setIsLoading(false);
            return;
        }

        try {
            const tasks = [];

            if (canRegister) {
                tasks.push(
                    fetchMyEventRegistration(event.id).then(setMyRegistration)
                );
            }

            if (canManage) {
                tasks.push(
                    fetchEventRegistrations(event.id).then(setRegistrations)
                );
            }

            await Promise.all(tasks);
            setErrorMessage("");
        } catch (error) {
            setErrorMessage(
                error?.message || "No se pudieron cargar las inscripciones."
            );
        } finally {
            setIsLoading(false);
        }
    }, [canManage, canRegister, currentUser, event.id, eventIdIsValid]);

    useEffect(() => {
        const initialTimeoutId = window.setTimeout(loadRegistrations, 0);
        window.addEventListener("eventRegistrationsChanged", loadRegistrations);

        return () => {
            window.clearTimeout(initialTimeoutId);
            window.removeEventListener("eventRegistrationsChanged", loadRegistrations);
        };
    }, [loadRegistrations]);

    async function handleSubmit(eventSubmit) {
        eventSubmit.preventDefault();
        setBusyId("self");
        setMessage("");
        setErrorMessage("");

        try {
            await submitEventRegistration({
                eventId: event.id,
                className,
                sailNumber,
                crewName,
                notes
            });
            await loadRegistrations();
            setMessage("Tu inscripción fue enviada correctamente.");
        } catch (error) {
            setErrorMessage(error?.message || "No se pudo enviar la inscripción.");
        } finally {
            setBusyId("");
        }
    }

    async function handleCancel() {
        if (!window.confirm("¿Cancelar tu inscripción a este evento?")) return;

        setBusyId("self");
        setMessage("");
        setErrorMessage("");

        try {
            await cancelEventRegistration(event.id);
            await loadRegistrations();
            setMessage("La inscripción fue cancelada.");
        } catch (error) {
            setErrorMessage(error?.message || "No se pudo cancelar la inscripción.");
        } finally {
            setBusyId("");
        }
    }

    async function handleReview(registration, status) {
        setBusyId(registration.id);
        setMessage("");
        setErrorMessage("");

        try {
            await reviewEventRegistration({
                registrationId: registration.id,
                status,
                managerNotes: registration.managerNotes
            });
            await loadRegistrations();
            setMessage(`Inscripción de ${registration.participantName} actualizada.`);
        } catch (error) {
            setErrorMessage(error?.message || "No se pudo actualizar la inscripción.");
        } finally {
            setBusyId("");
        }
    }

    function updateManagerNotes(registrationId, value) {
        setRegistrations(currentRegistrations =>
            currentRegistrations.map(registration =>
                registration.id === registrationId
                    ? { ...registration, managerNotes: value }
                    : registration
            )
        );
    }

    if (!eventIdIsValid) return null;

    return (
        <div className="detail-card event-registration-panel">
            <div className="section-header">
                <div>
                    <h2>Inscripciones</h2>
                    <p>Inscripción interna para participantes del evento.</p>
                </div>
                {canManage && (
                    <span className="invitation-count-badge">
                        {registrations.filter(item => item.status !== "cancelled").length}
                    </span>
                )}
            </div>

            {message && <p className="status-pill approved registration-feedback">{message}</p>}
            {errorMessage && <p className="status-pill rejected registration-feedback">{errorMessage}</p>}

            {!currentUser && (
                <div className="registration-login-prompt">
                    <p>Iniciá sesión para inscribirte.</p>
                    <button className="apply-button" onClick={() => navigate("/login")}>Ingresar</button>
                </div>
            )}

            {isLoading && currentUser && <p>Cargando inscripciones...</p>}

            {!isLoading && canRegister && !myRegistration && (
                <form className="registration-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label>
                            Clase
                            {classOptions.length > 0 ? (
                                <select value={className} onChange={e => setClassName(e.target.value)} required>
                                    <option value="">Seleccionar clase...</option>
                                    {classOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            ) : (
                                <input value={className} onChange={e => setClassName(e.target.value)} placeholder="Ej.: ILCA 7" required />
                            )}
                        </label>

                        <label>
                            Número de vela
                            <input value={sailNumber} onChange={e => setSailNumber(e.target.value)} placeholder="Ej.: ARG 123456" />
                        </label>

                        <label>
                            Tripulante
                            <input value={crewName} onChange={e => setCrewName(e.target.value)} placeholder="Si corresponde" />
                        </label>
                    </div>

                    <label>
                        Notas para la organización
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" />
                    </label>

                    <button className="apply-button" type="submit" disabled={busyId === "self"}>
                        {busyId === "self" ? "Enviando..." : "Inscribirme"}
                    </button>
                </form>
            )}

            {!isLoading && canRegister && myRegistration && (
                <div className="my-registration-card">
                    <div>
                        <span className={`status-pill ${getStatusClass(myRegistration.status)}`}>
                            {getStatusLabel(myRegistration.status)}
                        </span>
                        <h3>{myRegistration.className || "Clase no informada"}</h3>
                        {myRegistration.sailNumber && <p><strong>Vela:</strong> {myRegistration.sailNumber}</p>}
                        {myRegistration.crewName && <p><strong>Tripulante:</strong> {myRegistration.crewName}</p>}
                        {myRegistration.managerNotes && <p><strong>Respuesta:</strong> {myRegistration.managerNotes}</p>}
                    </div>

                    {!['cancelled', 'rejected'].includes(myRegistration.status) && (
                        <button className="reject-button" type="button" disabled={busyId === "self"} onClick={handleCancel}>
                            Cancelar inscripción
                        </button>
                    )}
                </div>
            )}

            {!isLoading && canManage && (
                <div className="registration-management">
                    <h3>Participantes</h3>
                    {registrations.length === 0 ? (
                        <p>Todavía no hay inscripciones.</p>
                    ) : (
                        <div className="registration-list">
                            {registrations.map(registration => (
                                <article className="registration-item" key={registration.id}>
                                    <div className="registration-item-header">
                                        <div>
                                            <h4>{registration.participantName}</h4>
                                            <p>{registration.participantEmail}</p>
                                        </div>
                                        <span className={`status-pill ${getStatusClass(registration.status)}`}>
                                            {getStatusLabel(registration.status)}
                                        </span>
                                    </div>
                                    <p><strong>Clase:</strong> {registration.className || "No informada"}</p>
                                    {registration.sailNumber && <p><strong>Vela:</strong> {registration.sailNumber}</p>}
                                    {registration.crewName && <p><strong>Tripulante:</strong> {registration.crewName}</p>}
                                    {registration.notes && <p><strong>Notas:</strong> {registration.notes}</p>}

                                    <label>
                                        Nota interna / respuesta
                                        <textarea
                                            rows="2"
                                            value={registration.managerNotes}
                                            onChange={e => updateManagerNotes(registration.id, e.target.value)}
                                        />
                                    </label>

                                    <div className="status-actions">
                                        <button className="accept-button" type="button" disabled={busyId === registration.id} onClick={() => handleReview(registration, "confirmed")}>Confirmar</button>
                                        <button className="small-action-button" type="button" disabled={busyId === registration.id} onClick={() => handleReview(registration, "waitlist")}>En espera</button>
                                        <button className="reject-button" type="button" disabled={busyId === registration.id} onClick={() => handleReview(registration, "rejected")}>Rechazar</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EventRegistrationPanel;
