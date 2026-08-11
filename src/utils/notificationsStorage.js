import { supabase } from "../lib/supabaseClient";

function normalizeNotification(row) {
    if (!row) return null;

    return {
        id: row.id,
        type: row.type || "general",
        title: row.title || "Notificación",
        body: row.body || "",
        linkUrl: row.link_url || "",
        metadata: row.metadata || {},
        readAt: row.read_at || null,
        createdAt: row.created_at || new Date().toISOString()
    };
}

export async function fetchMyNotifications(limit = 100) {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data || [])
        .map(normalizeNotification)
        .filter(Boolean);
}

export async function fetchUnreadNotificationsCount() {
    const { count, error } = await supabase
        .from("notifications")
        .select("id", {
            count: "exact",
            head: true
        })
        .is("read_at", null);

    if (error) throw error;

    return count || 0;
}

export async function markNotificationAsRead(notificationId) {
    const { error } = await supabase
        .from("notifications")
        .update({
            read_at: new Date().toISOString()
        })
        .eq("id", notificationId)
        .is("read_at", null);

    if (error) throw error;

    window.dispatchEvent(new Event("notificationsChanged"));
}

export async function markAllNotificationsAsRead() {
    const { error } = await supabase
        .from("notifications")
        .update({
            read_at: new Date().toISOString()
        })
        .is("read_at", null);

    if (error) throw error;

    window.dispatchEvent(new Event("notificationsChanged"));
}
