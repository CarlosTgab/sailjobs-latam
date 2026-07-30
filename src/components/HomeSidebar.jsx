import { useNavigate } from "react-router-dom";

import articles from "../data/articles";

import staticJobs from "../data/jobs";
import { getAllJobs } from "../utils/jobsStorage";

import staticEvents from "../data/events";
import { getApprovedEvents } from "../utils/eventsStorage";

import { getAllClassifieds } from "../utils/classifiedsStorage";
import { sortByNewest } from "../utils/idUtils";

import {
    getCurrentUser
} from "../utils/authStorage";

import {
    getExperienceLabel,
    getHomeActionsForUser,
    getHomeExperienceCopy,
    shouldFeatureClassifieds
} from "../config/roleExperience";

function HomeSidebar() {

    const navigate = useNavigate();

    const currentUser = getCurrentUser();
    const roleCopy = getHomeExperienceCopy(currentUser);
    const roleActions = getHomeActionsForUser(currentUser);
    const showClassifieds = shouldFeatureClassifieds(currentUser);

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

    const latestClassifieds = showClassifieds
        ? [
            ...classifieds
        ]
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
            .slice(0, 2)
        : [];

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

    const primaryAction = roleActions[0] || {
        label: "Ir al inicio",
        to: "/"
    };

    return (

        <aside className="home-sidebar">

            <div
                className={
                    "home-sidebar-card home-role-card"
                }
            >

                <span className="sidebar-tag">
                    {getExperienceLabel(currentUser)}
                </span>

                <h3>
                    {roleCopy.tag}
                </h3>

                <p>
                    {roleCopy.description}
                </p>

                <button
                    className={
                        "small-action-button"
                    }
                    onClick={() => navigate(primaryAction.to)}
                >
                    {primaryAction.label}
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
