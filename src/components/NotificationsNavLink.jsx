import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    fetchUnreadNotificationsCount
} from "../utils/notificationsStorage";

function NotificationsNavLink({ currentUser, onNavigate }) {
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshCount = useCallback(async () => {
        if (!currentUser?.id) {
            setUnreadCount(0);
            return;
        }

        try {
            const count = await fetchUnreadNotificationsCount();
            setUnreadCount(count);
        } catch {
            setUnreadCount(0);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        const initialTimeoutId = window.setTimeout(refreshCount, 0);

        const intervalId = window.setInterval(refreshCount, 45000);

        window.addEventListener("notificationsChanged", refreshCount);
        window.addEventListener("focus", refreshCount);

        return () => {
            window.clearTimeout(initialTimeoutId);
            window.clearInterval(intervalId);
            window.removeEventListener("notificationsChanged", refreshCount);
            window.removeEventListener("focus", refreshCount);
        };
    }, [refreshCount]);

    if (!currentUser) return null;

    return (
        <Link
            to="/notifications"
            onClick={onNavigate}
            className="notifications-nav-link"
            aria-label={
                unreadCount > 0
                    ? `${unreadCount} notificaciones sin leer`
                    : "Notificaciones"
            }
        >
            Avisos
            {unreadCount > 0 && (
                <span className="notifications-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </Link>
    );
}

export default NotificationsNavLink;
