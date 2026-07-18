import { useNavigate } from "react-router-dom";

import HomeSidebar from "../components/HomeSidebar";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import staticEvents from "../data/events";
import { getAllEvents } from "../utils/eventsStorage";

import { getAllClassifieds } from "../utils/classifiedsStorage";
import { sameId, sortByNewest } from "../utils/idUtils";

import {
    getUsers,
    hasProfessionalProfile
} from "../utils/authStorage";

import {
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

function Home() {
    const navigate = useNavigate();

    const users = getUsers();
    const jobs = getAllJobs(staticJobs);
    const clubs = getAllClubs(staticClubs);
    const events = getAllEvents(staticEvents);
    const classifieds = getAllClassifieds();

    const professionals = users.filter(user =>
        hasProfessionalProfile(user)
    );

    const latestOpportunities = sortByNewest(jobs)
        .slice(0, 3);

    const upcomingEvents = [...events]
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 3);

    function getClub(clubId) {
        return clubs.find(
            club => sameId(club.id, clubId)
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

    function formatDate(date) {
        if (!date) {
            return "Fecha a confirmar";
        }

        return new Date(`${date}T00:00:00`).toLocaleDateString("es-AR");
    }

    return (
        <div className="dashboard-page">

            <section className="home-landing-hero">

                <div className="home-landing-overlay">

                    <div className="home-landing-content">

                        <span className="sidebar-tag">
                            Comunidad náutica latinoamericana
                        </span>

                        <h1>
                            Oportunidades, convocatorias y profesionales náuticos
                            en un solo lugar.
                        </h1>

                        <p>
                            SailJobs LATAM conecta clubes, organizaciones,
                            profesionales, voluntarios y eventos de la comunidad
                            náutica regional.
                        </p>

                        <div className="dashboard-actions">

                            <button
                                className="apply-button"
                                onClick={() => navigate("/jobs")}
                            >
                                Ver oportunidades
                            </button>

                            <button
                                className="apply-button"
                                onClick={() => navigate("/signup")}
                            >
                                Crear cuenta
                            </button>

                            <button
                                className="apply-button"
                                onClick={() => navigate("/calendar")}
                            >
                                Ver calendario
                            </button>

                        </div>

                    </div>

                </div>

            </section>

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <h2>{jobs.length}</h2>
                    <p>Oportunidades y convocatorias</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{professionals.length}</h2>
                    <p>Profesionales náuticos</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{clubs.length}</h2>
                    <p>Clubes / organizaciones</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{events.length}</h2>
                    <p>Eventos en calendario</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{classifieds.length}</h2>
                    <p>Clasificados publicados</p>
                </div>

            </div>

            <div className="home-dashboard-layout">

                <main className="home-main-content">

                    <section className="detail-card">

                        <div className="section-header">

                            <h2>
                                Oportunidades recientes
                            </h2>

                            <button
                                className="small-action-button"
                                onClick={() => navigate("/jobs")}
                            >
                                Ver todas
                            </button>

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
                                                {club ? club.name : "No informada"}
                                            </p>

                                            <p>
                                                <strong>Ubicación:</strong>{" "}
                                                {job.city}, {job.country}
                                            </p>

                                            <p>
                                                <strong>Compensación:</strong>{" "}
                                                {getCompensationLabel(job)}
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

                    </section>

                    <section className="detail-card">

                        <div className="section-header">

                            <h2>
                                Próximos eventos
                            </h2>

                            <button
                                className="small-action-button"
                                onClick={() => navigate("/calendar")}
                            >
                                Ver calendario
                            </button>

                        </div>

                        {upcomingEvents.length > 0 ? (

                            <div className="dashboard-grid">

                                {upcomingEvents.map(event => {

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
                                                {club ? club.name : "No informada"}
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
                                                onClick={() => navigate(`/calendar/${event.id}`)}
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

                    </section>

                </main>

                <HomeSidebar />

            </div>

        </div>
    );
}

export default Home;