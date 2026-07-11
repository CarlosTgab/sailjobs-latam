import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import { isOrganizationAdmin } from "../utils/permissions";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";

import rankings from "../data/rankings";

function OrganizationAdminDashboard() {

    const navigate = useNavigate();
    const currentUser = getCurrentUser();

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

    const managedClasses = Array.isArray(currentUser.managedClasses)
        ? currentUser.managedClasses
        : [];

    const allEvents = getAllEvents(staticEvents);

    const organizationEvents = allEvents.filter(
        event => managedClasses.includes(event.className)
    );

    const pendingEvents = organizationEvents.filter(
        event => event.status === "pending"
    );

    const approvedEvents = organizationEvents.filter(
        event =>
            event.status === "approved" ||
            event.status === undefined
    );

    const organizationRankings = rankings.filter(
        ranking => managedClasses.includes(ranking.className)
    );

    const upcomingEvents = [...approvedEvents]
        .sort(
            (a, b) =>
                new Date(a.startDate) -
                new Date(b.startDate)
        )
        .slice(0, 5);

    const organizationName =
        currentUser.organizationName ||
        `Organización ${currentUser.organizationId || ""}`;

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
                            {currentUser.name} · {currentUser.email}
                        </p>
                    </div>

                </div>

                <div className="dashboard-actions">

                    <button
                        className="apply-button"
                        onClick={() => navigate("/calendar")}
                    >
                        Ver calendario
                    </button>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/ranking")}
                    >
                        Ver rankings
                    </button>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/clubs")}
                    >
                        Ver clubes
                    </button>

                </div>

            </div>

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <h2>{managedClasses.length}</h2>
                    <p>Clases administradas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{organizationEvents.length}</h2>
                    <p>Eventos vinculados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{pendingEvents.length}</h2>
                    <p>Eventos pendientes</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{organizationRankings.length}</h2>
                    <p>Registros de ranking</p>
                </div>

            </div>

            <div className="dashboard-main-grid">

                <div className="detail-card">

                    <div className="section-header">
                        <h3>⛵ Clases administradas</h3>
                    </div>

                    {managedClasses.length > 0 ? (

                        <div className="dashboard-list">

                            {managedClasses.map(className => (

                                <div
                                    key={className}
                                    className="dashboard-list-item"
                                    onClick={() => navigate("/ranking")}
                                >
                                    <div>
                                        <h4>{className}</h4>

                                        <p>
                                            Eventos, rankings y contenido de la clase.
                                        </p>
                                    </div>

                                    <span>
                                        Administrar
                                    </span>
                                </div>

                            ))}

                        </div>

                    ) : (

                        <p>
                            Esta cuenta todavía no tiene clases asignadas.
                        </p>

                    )}

                </div>

                <div className="detail-card">

                    <div className="section-header">
                        <h3>📅 Próximos eventos</h3>
                    </div>

                    {upcomingEvents.length > 0 ? (

                        <div className="dashboard-list">

                            {upcomingEvents.map(event => (

                                <div
                                    key={event.id}
                                    className="dashboard-list-item"
                                    onClick={() => navigate(`/calendar/${event.id}`)}
                                >
                                    <div>
                                        <h4>{event.title}</h4>

                                        <p>
                                            {event.className}
                                        </p>

                                        <p>
                                            {event.city}, {event.country}
                                        </p>
                                    </div>

                                    <span>
                                        {formatDate(event.startDate)}
                                    </span>
                                </div>

                            ))}

                        </div>

                    ) : (

                        <p>
                            No hay próximos eventos para las clases asignadas.
                        </p>

                    )}

                </div>

                <div className="detail-card">

                    <div className="section-header">
                        <h3>🕒 Revisión pendiente</h3>
                    </div>

                    {pendingEvents.length > 0 ? (

                        <div className="dashboard-list">

                            {pendingEvents.map(event => (

                                <div
                                    key={event.id}
                                    className="dashboard-list-item"
                                >
                                    <div>
                                        <h4>{event.title}</h4>

                                        <p>
                                            {event.className}
                                        </p>

                                        <p>
                                            {event.city}, {event.country}
                                        </p>
                                    </div>

                                    <span className="status-pill pending">
                                        Pendiente
                                    </span>
                                </div>

                            ))}

                        </div>

                    ) : (

                        <p>
                            No hay eventos pendientes para revisar.
                        </p>

                    )}

                    <p className="dashboard-note">
                        En la próxima etapa vamos a permitir aprobar o rechazar
                        únicamente eventos de las clases asignadas.
                    </p>

                </div>

                <div className="detail-card">

                    <div className="section-header">
                        <h3>🔐 Alcance de esta cuenta</h3>
                    </div>

                    <p>
                        Esta cuenta puede administrar exclusivamente la organización
                        y las clases que le fueron asignadas.
                    </p>

                    <p>
                        No tiene acceso a usuarios globales, configuraciones técnicas,
                        mensajes generales ni otras organizaciones.
                    </p>

                </div>

            </div>

        </div>

    );
}

export default OrganizationAdminDashboard;