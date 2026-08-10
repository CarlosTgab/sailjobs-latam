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
