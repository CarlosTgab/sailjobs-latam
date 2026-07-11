import { useNavigate } from "react-router-dom";

import {
    getUsers,
    hasProfessionalProfile
} from "../utils/authStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";

import { getApplications } from "../utils/applicationsStorage";

import {
    OPPORTUNITY_TYPES,
    OPPORTUNITY_TYPE_LABELS,
    APPLICATION_STATUS
} from "../config/appConfig";

function AdminDashboard() {
    const navigate = useNavigate();

    const users = getUsers();
    const clubs = getAllClubs(staticClubs);
    const jobs = getAllJobs(staticJobs);
    const events = getAllEvents(staticEvents);
    const applications = getApplications();

    const professionalUsers = users.filter(
        user => hasProfessionalProfile(user)
    );

    const clubUsers = users.filter(
        user => user.role === "club"
    );

    const organizationAdmins = users.filter(
        user => user.role === "organization_admin"
    );

    const superadmins = users.filter(
        user =>
            user.role === "superadmin" ||
            user.role === "admin" ||
            user.permissions?.includes("superadmin")
    );

    const employmentOpportunities = jobs.filter(
        job =>
            job.opportunityType ===
            OPPORTUNITY_TYPES.EMPLOYMENT
    );

    const eventRoleOpportunities = jobs.filter(
        job =>
            job.opportunityType ===
            OPPORTUNITY_TYPES.EVENT_ROLE
    );

    const volunteerOpportunities = jobs.filter(
        job =>
            job.opportunityType ===
            OPPORTUNITY_TYPES.VOLUNTEER
    );

    const pendingApplications = applications.filter(
        application =>
            application.status ===
            APPLICATION_STATUS.PENDING
    );

    const acceptedApplications = applications.filter(
        application =>
            application.status ===
            APPLICATION_STATUS.ACCEPTED
    );

    const rejectedApplications = applications.filter(
        application =>
            application.status ===
            APPLICATION_STATUS.REJECTED
    );

    const latestUsers = [...users]
        .sort(
            (a, b) =>
                Number(b.id) -
                Number(a.id)
        )
        .slice(0, 5);

    const latestOpportunities = [...jobs]
        .sort(
            (a, b) =>
                Number(b.id) -
                Number(a.id)
        )
        .slice(0, 5);

    const latestApplications = [...applications]
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        )
        .slice(0, 5);

    const latestEvents = [...events]
        .sort(
            (a, b) =>
                new Date(a.startDate) -
                new Date(b.startDate)
        )
        .slice(0, 5);

    function getClub(clubId) {
        return clubs.find(
            club =>
                Number(club.id) ===
                Number(clubId)
        );
    }

    function getJob(jobId) {
        return jobs.find(
            job =>
                Number(job.id) ===
                Number(jobId)
        );
    }

    function getOpportunityTypeLabel(type) {
        return (
            OPPORTUNITY_TYPE_LABELS[type] ||
            "Trabajo profesional"
        );
    }

    function getUserTypeLabel(user) {
        if (
            user.role === "superadmin" ||
            user.role === "admin" ||
            user.permissions?.includes("superadmin")
        ) {
            return "Superadmin";
        }

        if (user.role === "organization_admin") {
            return "Administrador de organización";
        }

        if (user.role === "club") {
            return "Club / organización";
        }

        if (hasProfessionalProfile(user)) {
            return "Profesional náutico";
        }

        return "Usuario general";
    }

    function getStatusClass(status) {
        if (status === APPLICATION_STATUS.ACCEPTED) {
            return "status-pill approved";
        }

        if (status === APPLICATION_STATUS.REJECTED) {
            return "status-pill rejected";
        }

        return "status-pill pending";
    }

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(date).toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div>
                    <h1>Superadmin</h1>

                    <p>
                        Panel global para revisar usuarios, organizaciones,
                        oportunidades, convocatorias, eventos y postulaciones
                        de SailJobs LATAM.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/admin/events")}
                    >
                        Moderar eventos
                    </button>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/admin/messages")}
                    >
                        Mensajes de contacto
                    </button>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/jobs")}
                    >
                        Ver oportunidades
                    </button>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{users.length}</h2>
                    <p>Usuarios registrados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{professionalUsers.length}</h2>
                    <p>Profesionales náuticos</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{clubs.length}</h2>
                    <p>Clubes / organizaciones</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{jobs.length}</h2>
                    <p>Oportunidades publicadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{applications.length}</h2>
                    <p>Postulaciones totales</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{events.length}</h2>
                    <p>Eventos en calendario</p>
                </div>
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Resumen de oportunidades</h2>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/jobs")}
                    >
                        Ver todas
                    </button>
                </div>

                <div className="dashboard-stats">
                    <div className="dashboard-stat-card">
                        <h2>{employmentOpportunities.length}</h2>
                        <p>Trabajos profesionales</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{eventRoleOpportunities.length}</h2>
                        <p>Cargos técnicos</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{volunteerOpportunities.length}</h2>
                        <p>Voluntariados</p>
                    </div>
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
                                        {club ? club.name : "No encontrada"}
                                    </p>

                                    <p>
                                        <strong>Ubicación:</strong>{" "}
                                        {job.city}, {job.country}
                                    </p>

                                    <p>
                                        <strong>Vacantes:</strong>{" "}
                                        {job.openings || 1}
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
                    <p>
                        Todavía no hay oportunidades publicadas.
                    </p>
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Resumen de postulaciones</h2>
                </div>

                <div className="dashboard-stats">
                    <div className="dashboard-stat-card">
                        <h2>{pendingApplications.length}</h2>
                        <p>Pendientes</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{acceptedApplications.length}</h2>
                        <p>Aceptadas</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{rejectedApplications.length}</h2>
                        <p>Rechazadas</p>
                    </div>
                </div>

                {latestApplications.length > 0 ? (
                    <div className="dashboard-grid">
                        {latestApplications.map(application => {
                            const job = getJob(application.jobId);
                            const club = job ? getClub(job.clubId) : null;

                            return (
                                <div
                                    key={application.id}
                                    className="dashboard-card"
                                >
                                    <div className="event-card-top">
                                        <span
                                            className={getStatusClass(
                                                application.status
                                            )}
                                        >
                                            {application.status || "Pendiente"}
                                        </span>
                                    </div>

                                    <h3>{application.name}</h3>

                                    <p>
                                        <strong>Oportunidad:</strong>{" "}
                                        {job ? job.title : "No encontrada"}
                                    </p>

                                    <p>
                                        <strong>Organización:</strong>{" "}
                                        {club ? club.name : "No encontrada"}
                                    </p>

                                    <p>
                                        <strong>Email:</strong>{" "}
                                        {application.email}
                                    </p>

                                    <p>
                                        <strong>Fecha:</strong>{" "}
                                        {formatDate(application.createdAt)}
                                    </p>

                                    <button
                                        className="apply-button"
                                        onClick={() =>
                                            navigate(`/applicant/${application.id}`)
                                        }
                                    >
                                        Ver postulación
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>
                        Todavía no hay postulaciones recibidas.
                    </p>
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Usuarios y permisos</h2>
                </div>

                <div className="dashboard-stats">
                    <div className="dashboard-stat-card">
                        <h2>{superadmins.length}</h2>
                        <p>Superadmins</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{organizationAdmins.length}</h2>
                        <p>Admins de organización</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{clubUsers.length}</h2>
                        <p>Cuentas de organización</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <h2>{professionalUsers.length}</h2>
                        <p>Profesionales activos</p>
                    </div>
                </div>

                {latestUsers.length > 0 ? (
                    <div className="dashboard-grid">
                        {latestUsers.map(user => (
                            <div
                                key={user.id}
                                className="dashboard-card"
                            >
                                <span className="sidebar-tag">
                                    {getUserTypeLabel(user)}
                                </span>

                                <h3>{user.name}</h3>

                                <p>
                                    <strong>Email:</strong>{" "}
                                    {user.email}
                                </p>

                                <p>
                                    <strong>Rol interno:</strong>{" "}
                                    {user.role || "user"}
                                </p>

                                {user.profiles?.length > 0 && (
                                    <p>
                                        <strong>Perfiles:</strong>{" "}
                                        {user.profiles.join(", ")}
                                    </p>
                                )}

                                {user.permissions?.length > 0 && (
                                    <p>
                                        <strong>Permisos:</strong>{" "}
                                        {user.permissions.join(", ")}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        Todavía no hay usuarios registrados.
                    </p>
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Eventos recientes</h2>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/calendar")}
                    >
                        Ver calendario
                    </button>
                </div>

                {latestEvents.length > 0 ? (
                    <div className="dashboard-grid">
                        {latestEvents.map(event => {
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
                                        {club ? club.name : "No encontrada"}
                                    </p>

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
                            );
                        })}
                    </div>
                ) : (
                    <p>
                        Todavía no hay eventos cargados.
                    </p>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;