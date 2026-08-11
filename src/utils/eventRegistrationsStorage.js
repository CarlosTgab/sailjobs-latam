import { supabase } from "../lib/supabaseClient";

function normalizeRegistration(row) {
    if (!row) return null;

    return {
        id: row.registration_id || row.id,
        eventId: row.event_id || "",
        userId: row.user_id || "",
        participantName: row.participant_name || "Participante",
        participantEmail: row.participant_email || "",
        status: row.registration_status || row.status || "pending",
        className: row.class_name || "",
        sailNumber: row.sail_number || "",
        crewName: row.crew_name || "",
        notes: row.notes || "",
        managerNotes: row.manager_notes || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export async function fetchMyEventRegistration(eventId) {
    const { data, error } = await supabase.rpc(
        "get_my_event_registration",
        { event_id_param: eventId }
    );

    if (error) throw error;

    return normalizeRegistration(data?.[0]);
}

export async function fetchEventRegistrations(eventId) {
    const { data, error } = await supabase.rpc(
        "get_event_registrations",
        { event_id_param: eventId }
    );

    if (error) throw error;

    return (data || [])
        .map(normalizeRegistration)
        .filter(Boolean);
}

export async function submitEventRegistration({
    eventId,
    className,
    sailNumber,
    crewName,
    notes
}) {
    const { data, error } = await supabase.rpc(
        "register_for_event",
        {
            event_id_param: eventId,
            class_name_param: className || "",
            sail_number_param: sailNumber || "",
            crew_name_param: crewName || "",
            notes_param: notes || ""
        }
    );

    if (error) throw error;

    window.dispatchEvent(new Event("eventRegistrationsChanged"));
    return data;
}

export async function cancelEventRegistration(eventId) {
    const { error } = await supabase.rpc(
        "cancel_my_event_registration",
        { event_id_param: eventId }
    );

    if (error) throw error;

    window.dispatchEvent(new Event("eventRegistrationsChanged"));
}

export async function reviewEventRegistration({
    registrationId,
    status,
    managerNotes
}) {
    const { error } = await supabase.rpc(
        "review_event_registration",
        {
            registration_id_param: registrationId,
            status_param: status,
            manager_notes_param: managerNotes || ""
        }
    );

    if (error) throw error;

    window.dispatchEvent(new Event("eventRegistrationsChanged"));
}
