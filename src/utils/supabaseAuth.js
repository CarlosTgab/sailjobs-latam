import { supabase } from "../lib/supabaseClient";
import {
    setCurrentUser,
    logout as clearLocalSession
} from "./authStorage";

const DEFAULT_PROFESSIONAL_PROFILE = {
    active: false,
    title: "",
    summary: "",
    specialties: [],
    certifications: [],
    experience: [],
    languages: [],
    availability: "",
    phone: "",
    city: "",
    country: "",
    cvFileName: "",
    cvUrl: ""
};

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function validatePassword(password) {
    const hasMinimumLength =
        String(password || "").length >= 8;

    const hasLetter =
        /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password || "");

    const hasNumber =
        /\d/.test(password || "");

    return hasMinimumLength && hasLetter && hasNumber;
}

function mapProfessionalProfile(row) {
    if (!row) {
        return {
            ...DEFAULT_PROFESSIONAL_PROFILE
        };
    }

    return {
        active: Boolean(row.active),
        title: row.title || "",
        summary: row.summary || "",
        specialties: row.specialties || [],
        certifications: row.certifications || [],
        experience: row.experience || [],
        languages: row.languages || [],
        availability: row.availability || "",
        phone: row.phone || "",
        city: row.city || "",
        country: row.country || "",
        cvFileName: row.cv_file_name || "",
        cvUrl: row.cv_url || ""
    };
}

function mapProfileToAppUser(profile, professionalProfile, club) {
    return {
        id: profile.id,
        email: profile.email,
        name: profile.name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        country: profile.country || "",
        description: profile.description || "",
        profileImage: profile.profile_image_url || "",
        role: profile.role || "user",
        profiles: profile.profile_types || ["user"],
        permissions: profile.permissions || [],
        professionalProfile:
            mapProfessionalProfile(professionalProfile),
        clubId: club?.id || null,
        clubName: club?.name || ""
    };
}

export async function fetchSupabaseCurrentUser(userId) {
    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

    if (profileError) {
        throw profileError;
    }

    const { data: professionalProfile } =
        await supabase
            .from("professional_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

    const { data: club } =
        await supabase
            .from("clubs")
            .select("*")
            .eq("owner_id", userId)
            .maybeSingle();

    return mapProfileToAppUser(
        profile,
        professionalProfile,
        club
    );
}

async function upsertBaseProfile(user, userData) {
    const accountType =
        userData.accountType || "user";

    const isClub =
        accountType === "club";

    const isProfessional =
        accountType === "professional" ||
        accountType === "coach";

    const profileTypes =
        isClub
            ? []
            : isProfessional
                ? ["user", "professional"]
                : ["user"];

    const role =
        isClub
            ? "club"
            : "user";

    const { error } =
        await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                email: normalizeEmail(user.email),
                name: userData.name?.trim() || "",
                phone: userData.phone?.trim() || "",
                city: userData.city?.trim() || "",
                country: userData.country || "",
                role,
                profile_types: profileTypes,
                permissions: []
            });

    if (error) {
        throw error;
    }
}

async function createProfessionalProfile(userId, userData) {
    const { error } =
        await supabase
            .from("professional_profiles")
            .upsert({
                user_id: userId,
                active: true,
                title: userData.professionalTitle || "",
                summary: userData.professionalSummary || "",
                phone: userData.phone || "",
                city: userData.city || "",
                country: userData.country || ""
            });

    if (error) {
        throw error;
    }
}

async function createClubAccount(userId, userData) {
    const clubName =
        userData.clubName?.trim() ||
        userData.name?.trim() ||
        "Club sin nombre";

    const { data: club, error: clubError } =
        await supabase
            .from("clubs")
            .insert({
                owner_id: userId,
                name: clubName,
                country:
                    userData.clubCountry ||
                    userData.country ||
                    "",
                city:
                    userData.clubCity ||
                    userData.city ||
                    "",
                description:
                    userData.clubDescription || "",
                website:
                    userData.clubWebsite || "",
                logo_url:
                    userData.clubLogoUrl || "",
                status: "active"
            })
            .select("*")
            .single();

    if (clubError) {
        throw clubError;
    }

    const { error: membershipError } =
        await supabase
            .from("club_memberships")
            .insert({
                club_id: club.id,
                user_id: userId,
                role: "owner"
            });

    if (membershipError) {
        throw membershipError;
    }

    return club;
}

export async function registerWithSupabase(userData) {
    const email =
        normalizeEmail(userData.email);

    const password =
        userData.password || "";

    if (!email || !userData.name?.trim()) {
        throw new Error("Completá nombre y email.");
    }

    if (!validatePassword(password)) {
        throw new Error(
            "La contraseña debe tener al menos 8 caracteres, una letra y un número."
        );
    }

    const { data, error } =
        await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: userData.name?.trim() || ""
                }
            }
        });

    if (error) {
        throw error;
    }

    if (!data.user) {
        throw new Error(
            "No se pudo crear el usuario en Supabase."
        );
    }

    await upsertBaseProfile(
        data.user,
        userData
    );

    const accountType =
        userData.accountType || "user";

    if (
        accountType === "professional" ||
        accountType === "coach"
    ) {
        await createProfessionalProfile(
            data.user.id,
            userData
        );
    }

    if (accountType === "club") {
        await createClubAccount(
            data.user.id,
            userData
        );
    }

    const appUser =
        await fetchSupabaseCurrentUser(
            data.user.id
        );

    setCurrentUser(appUser);

    return appUser;
}

export async function loginWithSupabase(email, password) {
    const { data, error } =
        await supabase.auth.signInWithPassword({
            email: normalizeEmail(email),
            password
        });

    if (error) {
        throw error;
    }

    if (!data.user) {
        throw new Error(
            "No se pudo iniciar sesión."
        );
    }

    const appUser =
        await fetchSupabaseCurrentUser(
            data.user.id
        );

    setCurrentUser(appUser);

    return appUser;
}

export async function syncSupabaseSession() {
    const { data, error } =
        await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (!data.session?.user) {
        return null;
    }

    const appUser =
        await fetchSupabaseCurrentUser(
            data.session.user.id
        );

    setCurrentUser(appUser);

    return appUser;
}

export async function logoutWithSupabase() {
    await supabase.auth.signOut();
    clearLocalSession();
}
