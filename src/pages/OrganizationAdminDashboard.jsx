import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import { isOrganizationAdmin } from "../utils/permissions";
import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getOrganizationTypeLabel
} from "../utils/clubsStorage";
import staticEvents from "../data/events";
import {
    eventHasClass,
    getAllEvents,
    getEventClassLabel,
    isPublishedEvent,
    syncEventsFromSupabase
} from "../utils/eventsStorage";
import staticJobs from "../data/jobs";
import {
    getAllJobs,
    syncJobsFromSupabase
} from "../utils/jobsStorage";
import useApplications from "../hooks/useApplications";
import { sameId, hasId, sortByNewest } from "../utils/idUtils";

function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
}

function getCityLabel(entity) {
    if (entity?.cityName) return entity.cityName;
    if (entity?.city && String(entity.city).includes(",")) {
        return String(entity.city).split(",")[0].trim();
    }
    return entity?.city || "";
}

function getLocationLabel(entity) {
    const parts = [getCityLabel(entity), entity?.state, entity?.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Ubicación no informada";
}

function OrganizationAdminDashboard() {
    const navigate = useNavigate();
    const { applications } = useApplications();
    const currentUser = getCurrentUser();
    const [allEvents, setAllEvents] = useState(() => getAllEvents(staticEvents));
    const [eventsMessage, setEventsMessage] = useState("");
    const [allJobs, setAllJobs] = useState(() => getAllJobs(staticJobs));
    const [jobsMessage, setJobsMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const syncedEvents = await syncEventsFromSupabase(staticEvents);
                if (isMounted) {
                    setAllEvents(syncedEvents);
                    setEventsMessage("");
                }
            } catch {
                if (isMounted) {
                    setAllEvents(getAllEvents(staticEvents));
                    setEventsMessage("No se pudo sincronizar el calendario. Mostrando datos locales.");
                }
            }
        }

        async function loadJobs() {
            try {
                const syncedJobs = await syncJobsFromSupabase(staticJobs);
                if (isMounted) {
                    setAllJobs(syncedJobs);
                    setJobsMessage("");
                }
            } catch {
                if (isMounted) {
                    setAllJobs(getAllJobs(staticJobs));
                    setJobsMessage("No se pudieron sincronizar las oportunidades. Mostrando datos locales.");
                }
            }
        }

        function refreshEvents() {
            setAllEvents(getAllEvents(staticEvents));
        }

        function refreshJobs() {
            setAllJobs(getAllJobs(staticJobs));
        }

        loadEvents();
        loadJobs();
        window.addEventListener("eventsChanged", refreshEvents);
        window.addEventListener("jobsChanged", refreshJobs);

        return () => {
            isMounted = false;
            window.removeEventListener("eventsChanged", refreshEvents);
            window.removeEventListener("jobsChanged", refreshJobs);
        };
    }, []);

    if (!currentUser || !isOrganizationAdmin(currentUser)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>
                <p>Este panel es únicamente para administradores de organizaciones.</p>
                <button className="back-button" onClick={() => navigate("/")}>
                    ← Volver al inicio
                </button>
            </div>
        );
    }

    const organizationId = currentUser.organizationId || currentUser.entityId || null;
    const organization = organizationId
        ? getAllClubs(staticClubs).find(entity => sameId(entity.id, organizationId))
        : null;
    const organizationName =
        organization?.name ||
        currentUser.organizationName ||
        currentUser.entityName ||
        currentUser.name ||
        "Mi organización";
    const managedClasses = Array.isArray(currentUser.managedClasses)
        ? currentUser.managedClasses
        : [];

    function eventBelongsToOrganization(event) {
        const matchesId = organizationId && [
            event.organizationId,
            event.ownerId,
            event.clubId,
            event.proposedById
        ].some(id => sameId(id, organizationId));
        const normalizedOrganizationName = normalizeName(organizationName);
        const matchesName = [
            event.organizationName,
            event.ownerName,
            event.organizingClubName,
            event.source
        ].filter(Boolean).some(value => normalizeName(value) === normalizedOrganizationName);
        const matchesManagedClass = managedClasses.some(className => eventHasClass(event, className));

        return matchesId || matchesName || matchesManagedClass;
    }

    const organizationEvents = allEvents
        .filter(isPublishedEvent)
        .filter(eventBelongsToOrganization);
    const organizationJobs = allJobs.filter(job =>
        organizationId && sameId(job.clubId, organizationId)
    );
    const organizationJobIds = organizationJobs.map(job => job.id);
    const organizationApplications = applications.filter(application =>
        (organizationId && sameId(application.clubId, organizationId)) ||
        hasId(organizationJobIds, application.jobId)
    );
    const upcomingEvents = [...organizationEvents]
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);
    const latestJobs = sortByNewest(organizationJobs).slice(0, 5);

    function formatDate(date) {
        if (!date) return "Fecha a confirmar";
        return new Date(`${date}T00:00:00`).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div className="dashboard-hero-info">
                    <div className="dashboard-avatar">ORG</div>
                    <div>
                        <h1>{organizationName}</h1>
                        <p>Administrador de organización</p>
                        <p>{organization ? getOrganizationTypeLabel(organization) : "Organización náutica"}</p>
                        <p>{organization ? getLocationLabel(organization) : `${currentUser.name} · ${currentUser.email}`}</p>
                    </div>
                </div>

                <div className="dashboard-actions">
                    <button className="apply-button" onClick={() => navigate("/jobs")}>
                        Ver oportunidades
                    </button>
                    <button className="small-action-button" onClick={() => navigate("/calendar")}>
                        Ver calendario
                    </button>
                </div>
            </div>

            {(eventsMessage || jobsMessage) && (
                <div className="detail-card">
                    {eventsMessage && <p style={{ color: "#b42318" }}>{eventsMessage}</p>}
                    {jobsMessage && <p style={{ color: "#b42318" }}>{jobsMessage}</p>}
                </div>
            )}

            <div className="detail-card">
                <div className="section-header">
                    <div>
                        <h2>Centro de oportunidades</h2>
                        <p>Publicá búsquedas, encontrá profesionales y gestioná postulaciones desde un solo lugar.</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <span className="sidebar-tag">Convocatorias</span>
                        <h3>Publicar oportunidad</h3>
                        <p>Cargá búsquedas para coaches, oficiales, jurados, medidores, voluntarios u otros perfiles.</p>
                        <button
                            className="apply-button"
                            onClick={() => organizationId && navigate(`/club-dashboard/${organizationId}/new-job`)}
                        >
                            Nueva oportunidad
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Postulaciones</span>
                        <h3>Postulaciones recibidas</h3>
                        <p>Revisá las personas que se postularon a búsquedas publicadas por tu organización.</p>
                        <button
                            className="apply-button"
                            onClick={() => organizationId && navigate(`/applications/${organizationId}`)}
                        >
                            Ver postulaciones
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Directorio</span>
                        <h3>Buscar profesionales</h3>
                        <p>Explorá perfiles públicos por rol, experiencia, ubicación y disponibilidad.</p>
                        <button className="apply-button" onClick={() => navigate("/professionals")}>
                            Ver profesionales
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Calendario oficial</span>
                        <h3>Eventos y campeonatos</h3>
                        <p>Consultá el calendario curado por SailJobs y vinculá oportunidades al evento correspondiente.</p>
                        <button className="apply-button" onClick={() => navigate("/calendar")}>
                            Ver calendario
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Público</span>
                        <h3>Perfil de la organización</h3>
                        <p>Revisá cómo se presentan tu organización y sus oportunidades dentro de SailJobs.</p>
                        <button
                            className="apply-button"
                            onClick={() => organizationId && navigate(`/clubs/${organizationId}`)}
                        >
                            Ver perfil público
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <span className="sidebar-tag">Soporte</span>
                        <h3>Informar un evento o corrección</h3>
                        <p>El calendario lo administra SailJobs. Enviá cualquier alta o corrección para que sea verificada.</p>
                        <button className="apply-button" onClick={() => navigate("/contact")}>
                            Contactar a SailJobs
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card"><h2>{organizationJobs.length}</h2><p>Oportunidades publicadas</p></div>
                <div className="dashboard-stat-card"><h2>{organizationApplications.length}</h2><p>Postulaciones recibidas</p></div>
                <div className="dashboard-stat-card"><h2>{organizationEvents.length}</h2><p>Eventos vinculados</p></div>
                <div className="dashboard-stat-card"><h2>{managedClasses.length}</h2><p>Clases relacionadas</p></div>
            </div>

            <div className="dashboard-main-grid">
                <div className="detail-card">
                    <div className="section-header">
                        <h3>Oportunidades recientes</h3>
                        {organizationId && (
                            <button className="small-action-button" onClick={() => navigate(`/club-dashboard/${organizationId}/new-job`)}>
                                Nueva oportunidad
                            </button>
                        )}
                    </div>

                    {latestJobs.length > 0 ? (
                        <div className="dashboard-list">
                            {latestJobs.map(job => (
                                <div key={job.id} className="dashboard-list-item" onClick={() => navigate(`/jobs/${job.id}`)}>
                                    <div><h4>{job.title}</h4><p>{job.category}</p></div>
                                    <span>Ver</span>
                                </div>
                            ))}
                        </div>
                    ) : <p>Esta organización todavía no publicó oportunidades.</p>}
                </div>

                <div className="detail-card">
                    <div className="section-header"><h3>Próximos eventos vinculados</h3></div>
                    {upcomingEvents.length > 0 ? (
                        <div className="dashboard-list">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="dashboard-list-item" onClick={() => navigate(`/calendar/${event.id}`)}>
                                    <div>
                                        <h4>{event.title}</h4>
                                        <p>{getEventClassLabel(event)} · {getLocationLabel(event)}</p>
                                        <p>{formatDate(event.startDate)}</p>
                                    </div>
                                    <span>Ver</span>
                                </div>
                            ))}
                        </div>
                    ) : <p>No hay eventos oficiales vinculados a esta organización.</p>}
                </div>

                <div className="detail-card">
                    <div className="section-header"><h3>Alcance de esta cuenta</h3></div>
                    <p>
                        Esta cuenta puede publicar oportunidades, gestionar postulaciones y consultar profesionales.
                        El calendario oficial es administrado exclusivamente por el superadmin de SailJobs.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default OrganizationAdminDashboard;
