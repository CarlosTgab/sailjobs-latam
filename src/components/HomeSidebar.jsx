import { useNavigate } from "react-router-dom";

import articles from "../data/articles";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticEvents from "../data/events";
import { getApprovedEvents } from "../utils/eventsStorage";

import { getAllClassifieds } from "../utils/classifiedsStorage";
import { sortByNewest } from "../utils/idUtils";

import {
    getCurrentUser,
    hasProfessionalProfile
} from "../utils/authStorage";

function HomeSidebar() {

    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const jobs = getAllJobs(staticJobs);

    const events = getApprovedEvents(
        staticEvents
    );

    const classifieds =
        getAllClassifieds();

    const latestJobs = sortByNewest(jobs)
        .slice(0, 2);

    const upcomingEvents = [
        ...events
    ]
        .sort(
            (a, b) =>
                new Date(a.startDate) -
                new Date(b.startDate)
        )
        .slice(0, 2);

    const latestClassifieds = [
        ...classifieds
    ]
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        )
        .slice(0, 2);

    const news = [

        ...latestJobs.map(job => ({

            id: `job-${job.id}`,

            type: "Oportunidad",

            title: job.title,

            text:
                `${job.city}, ${job.country}`,

            action: () =>
                navigate(
                    `/jobs/${job.id}`
                )

        })),

        ...upcomingEvents.map(event => ({

            id: `event-${event.id}`,

            type: "Evento",

            title: event.title,

            text:
                `${event.city}, ${event.country}`,

            action: () =>
                navigate(
                    `/calendar/${event.id}`
                )

        })),

        ...latestClassifieds.map(item => ({

            id:
                `classified-${item.id}`,

            type: "Clasificado",

            title: item.title,

            text: item.price,

            action: () =>
                navigate(
                    `/classifieds/${item.id}`
                )

        }))

    ].slice(0, 5);

    function getRoleCard() {

        if (!currentUser) {

            return {

                title:
                    "Entrá a la comunidad",

                text:
                    "Creá una cuenta para publicar clasificados, participar en la comunidad o activar tu perfil profesional.",

                button:
                    "Crear cuenta",

                action: () =>
                    navigate("/signup")

            };

        }

        if (
            currentUser.role ===
                "superadmin" ||
            currentUser.role ===
                "admin"
        ) {

            return {

                title:
                    "Administración global",

                text:
                    "Gestioná usuarios, organizaciones, eventos, mensajes y actividad general de SailJobs LATAM.",

                button:
                    "Ir al superadmin",

                action: () =>
                    navigate(
                        "/superadmin"
                    )

            };

        }

        if (
            currentUser.role ===
            "organization_admin"
        ) {

            return {

                title:
                    "Tu organización",

                text:
                    "Administrá las clases, eventos, rankings y contenido asignado a tu organización.",

                button:
                    "Ir a mi organización",

                action: () =>
                    navigate(
                        "/organization-admin"
                    )

            };

        }

        if (
            currentUser.role ===
            "club"
        ) {

            return {

                title:
                    "Panel de tu organización",

                text:
                    "Publicá oportunidades, revisá postulaciones y proponé eventos para el calendario.",

                button:
                    "Ir a mi organización",

                action: () =>
                    navigate(
                        `/club-dashboard/${currentUser.clubId}`
                    )

            };

        }

        if (
            hasProfessionalProfile(
                currentUser
            )
        ) {

            return {

                title:
                    "Tu perfil profesional",

                text:
                    "Actualizá tu experiencia y CV, revisá tus postulaciones y buscá oportunidades náuticas.",

                button:
                    "Ir a mi perfil profesional",

                action: () =>
                    navigate(
                        "/coach-dashboard"
                    )

            };

        }

        return {

            title:
                "Tu espacio personal",

            text:
                "Publicá clasificados, consultá eventos y activá tu perfil profesional cuando quieras.",

            button:
                "Ir a mi perfil",

            action: () =>
                navigate(
                    "/user-dashboard"
                )

        };

    }

    const roleCard =
        getRoleCard();

    return (

        <aside className="home-sidebar">

            <div
                className={
                    "home-sidebar-card home-role-card"
                }
            >

                <span className="sidebar-tag">
                    Para vos
                </span>

                <h3>
                    {roleCard.title}
                </h3>

                <p>
                    {roleCard.text}
                </p>

                <button
                    className={
                        "small-action-button"
                    }
                    onClick={
                        roleCard.action
                    }
                >
                    {roleCard.button}
                </button>

            </div>

            <div className="home-sidebar-card">

                <div className="section-header">

                    <h3>
                        📰 Novedades
                    </h3>

                </div>

                {news.length > 0 ? (

                    <div className="sidebar-list">

                        {news.map(item => (

                            <div
                                key={item.id}
                                className={
                                    "sidebar-item"
                                }
                                onClick={
                                    item.action
                                }
                            >

                                <span
                                    className={
                                        "sidebar-tag"
                                    }
                                >
                                    {item.type}
                                </span>

                                <h4>
                                    {item.title}
                                </h4>

                                <p>
                                    {item.text}
                                </p>

                            </div>

                        ))}

                    </div>

                ) : (

                    <p>
                        Todavía no hay
                        novedades publicadas.
                    </p>

                )}

            </div>

            <div className="home-sidebar-card">

                <div className="section-header">

                    <h3>
                        📚 Artículos y guías
                    </h3>

                </div>

                <div className="sidebar-list">

                    {articles
                        .slice(0, 4)
                        .map(article => (

                            <div
                                key={
                                    article.id
                                }
                                className={
                                    "sidebar-item"
                                }
                                onClick={() => {

                                    if (
                                        article.url !==
                                        "#"
                                    ) {

                                        window.open(
                                            article.url,
                                            "_blank",
                                            "noopener,noreferrer"
                                        );

                                    }

                                }}
                            >

                                <span
                                    className={
                                        "sidebar-tag"
                                    }
                                >
                                    {
                                        article.category
                                    }
                                </span>

                                <h4>
                                    {
                                        article.title
                                    }
                                </h4>

                                <p>
                                    {
                                        article.excerpt
                                    }
                                </p>

                                <div
                                    className={
                                        "article-meta"
                                    }
                                >

                                    <small>
                                        {
                                            article.readTime
                                        }
                                    </small>

                                    {
                                        article.url ===
                                            "#" && (

                                            <small>
                                                Próximamente
                                            </small>

                                        )
                                    }

                                </div>

                            </div>

                        ))}

                </div>

            </div>

        </aside>

    );
}

export default HomeSidebar;