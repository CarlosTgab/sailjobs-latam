import { supabase } from "../lib/supabaseClient";

function normalizeList(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function normalizePublicProfessional(profile) {
    if (!profile) return null;

    return {
        id: profile.id || profile.userId || profile.user_id,
        name: profile.name || "Profesional náutico",
        profileImage: profile.profileImage || profile.profile_image_url || "",
        title: profile.title || "Profesional náutico",
        summary: profile.summary || "",
        specialties: normalizeList(profile.specialties),
        certifications: normalizeList(profile.certifications),
        experience: normalizeList(profile.experience),
        languages: normalizeList(profile.languages),
        availability: profile.availability || "",
        city: profile.city || "",
        country: profile.country || ""
    };
}

export async function fetchPublicProfessionals() {
    const { data, error } = await supabase.rpc("get_public_professionals");

    if (error) throw error;

    return (data || [])
        .map(normalizePublicProfessional)
        .filter(profile => profile?.id);
}

export async function fetchProfessionalSportHistory(profileId) {
    if (!profileId) return [];

    const { data, error } = await supabase.rpc(
        "get_public_professional_sport_history",
        { profile_id_param: profileId }
    );

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.entry_id,
        rankingTitle: row.ranking_title || "Ranking",
        rankingDate: row.ranking_date,
        className: row.class_name || "",
        position: Number(row.position) || 0,
        club: row.club || "",
        category: row.category || "",
        netPoints: row.net_points === null ? null : Number(row.net_points),
        totalPoints: row.total_points === null ? null : Number(row.total_points),
        events: Number(row.events) || 0
    }));
}
