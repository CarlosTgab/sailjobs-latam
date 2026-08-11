import { supabase } from "../lib/supabaseClient";

function normalizeInvitation(row) {
    return {
        id: row.invitation_id || row.id,
        eventId: row.event_id || "",
        eventTitle: row.event_title || "Evento",
        eventStartDate: row.event_start_date || "",
        eventStatus: row.event_status || "",
        inviterEntityId: row.inviter_entity_id || "",
        inviterEntityName: row.inviter_entity_name || "Entidad organizadora",
        invitedEntityId: row.invited_entity_id || "",
        invitedEntityName: row.invited_entity_name || "Entidad invitada",
        role: row.invitation_role || row.role || "coorganizer",
        status: row.invitation_status || row.status || "pending",
        createdAt: row.created_at || "",
        respondedAt: row.responded_at || ""
    };
}

export async function fetchEntityEventInvitations(entityId) {
    if (!entityId) return [];

    const { data, error } = await supabase.rpc(
        "get_my_entity_event_invitations",
        {
            entity_id_param: entityId
        }
    );

    if (error) throw error;

    return (data || []).map(normalizeInvitation);
}

export async function respondToEventInvitation(
    invitationId,
    status
) {
    if (!invitationId) {
        throw new Error("La invitación no tiene un identificador válido.");
    }

    if (!["accepted", "rejected"].includes(status)) {
        throw new Error("La respuesta de la invitación no es válida.");
    }

    const { error } = await supabase.rpc(
        "respond_to_event_entity_invitation",
        {
            invitation_id_param: invitationId,
            response_status_param: status
        }
    );

    if (error) throw error;
}
