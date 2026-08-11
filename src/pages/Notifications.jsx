import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    fetchMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from "../utils/notificationsStorage";

function formatNotificationDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}

function Notifications() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const unreadCount = useMemo(
        () => notifications.filter(notification => !notification.readAt).length,
        [notifications]
    );

    useEffect(() => {
        let isMounted = true;

        async function loadNotifications() {
            try {
                const items = await fetchMyNotifications();

                if (isMounted) {
                    setNotifications(items);
                    setErrorMessage("");
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error?.message || "No se pudieron cargar las notificaciones."
                    );
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadNotifications();

        return () => {
            isMounted = false;
        };
    }, []);

    async function openNotification(notification) {
        try {
            if (!notification.readAt) {
                await markNotificationAsRead(notification.id);
                setNotifications(currentNotifications =>
                    currentNotifications.map(currentNotification =>
                        currentNotification.id === notification.id
                            ? {
                                ...currentNotification,
                                readAt: new Date().toISOString()
                            }
                            : currentNotification
                    )
                );
            }

            if (notification.linkUrl) {
                navigate(notification.linkUrl);
            }
        } catch (error) {
            setErrorMessage(
                error?.message || "No se pudo actualizar la notificación."
            );
        }
    }

    async function handleMarkAllAsRead() {
        setIsUpdating(true);
        setErrorMessage("");

        try {
            await markAllNotificationsAsRead();
            const readAt = new Date().toISOString();

            setNotifications(currentNotifications =>
                currentNotifications.map(notification => ({
                    ...notification,
                    readAt: notification.readAt || readAt
                }))
            );
        } catch (error) {
            setErrorMessage(
                error?.message || "No se pudieron marcar los avisos como leídos."
            );
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <main className="page-container notifications-page">
            <section className="content-card">
                <div className="section-header notifications-page-header">
                    <div>
                        <h1>Notificaciones</h1>
                        <p>
                            {unreadCount > 0
                                ? `${unreadCount} sin leer`
                                : "No tenés avisos pendientes"}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="small-action-button"
                            onClick={handleMarkAllAsRead}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "Actualizando..." : "Marcar todo como leído"}
                        </button>
                    )}
                </div>

                {errorMessage && (
                    <p className="status-pill rejected notification-message">
                        {errorMessage}
                    </p>
                )}

                {isLoading && <p>Cargando notificaciones...</p>}

                {!isLoading && notifications.length === 0 && (
                    <div className="empty-notifications">
                        <h2>Todo al día</h2>
                        <p>Los nuevos avisos van a aparecer acá.</p>
                    </div>
                )}

                {!isLoading && notifications.length > 0 && (
                    <div className="notifications-list">
                        {notifications.map(notification => (
                            <button
                                key={notification.id}
                                type="button"
                                className={`notification-item ${
                                    notification.readAt ? "is-read" : "is-unread"
                                }`}
                                onClick={() => openNotification(notification)}
                            >
                                <span className="notification-status-dot" />
                                <span className="notification-copy">
                                    <strong>{notification.title}</strong>
                                    {notification.body && <span>{notification.body}</span>}
                                    <small>{formatNotificationDate(notification.createdAt)}</small>
                                </span>
                                {notification.linkUrl && (
                                    <span className="notification-action">Ver</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default Notifications;
