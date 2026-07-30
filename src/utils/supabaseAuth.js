import { supabase } from "../lib/supabaseClient";
import {
    setCurrentUser,
    logout as clearLocalSession
} from "./authStorage";
import { upsertStoredClub } from "./clubsStorage";

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

function normalizeEntityType(value, fallbackRole) {
    if (value === "organization") {
        return "organization";
    }

    if (fallbackRole === "organization_admin") {
        return "organization";
    }

    return "club";
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

function mapEntityRowToStoredClub(entity, profile) {
    if (!entity) {
        return null;
    }

    const entityType = normalizeEntityType(
        entity.entity_type,
        profile?.role
    );

    return {
        id: entity.id,
        ownerId: entity.owner_id,
        name: entity.name,
        entityType,
        organizationType:
            entity.organization_type ||
            (
                entityType === "club"
                    ? "club"
                    : "other"
            ),
        country: entity.country,
        countryCode: entity.country_code || "",
        state: entity.state || "",
        stateCode: entity.state_code || "",
        city: entity.city,
        cityName: entity.city_name || "",
        description: entity.description,
        website: entity.website,
        logo: entity.logo_url,
        logoUrl: entity.logo_url,
        status: entity.status,
        createdAt: entity.created_at,
        updatedAt: entity.updated_at
    };
}

function mapProfileToAppUser(profile, professionalProfile, entity) {
    const databaseRole = profile.role || "user";
    const entityType = entity
        ? normalizeEntityType(entity.entity_type, databaseRole)
        : null;

    const role =
        databaseRole === "user" && entityType === "organization"
            ? "organization_admin"
            : databaseRole === "user" && entityType === "club"
                ? "club"
                : databaseRole;

    const permissions = [
        ...new Set([
            ...(profile.permissions || []),
            ...(role === "organization_admin" ? ["organization_admin"] : [])
        ])
    ];

    const baseUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        country: profile.country || "",
        description: profile.description || "",
        profileImage: profile.profile_image_url || "",
        role,
        profiles: profile.profile_types || ["user"],
        permissions,
        professionalProfile:
            mapProfessionalProfile(professionalProfile),
        entityId: entity?.id || null,
        entityName: entity?.name || "",
        entityType,
        organizationType:
            entity?.organization_type ||
            (
                entityType === "club"
                    ? "club"
                    : entityType === "organization"
                        ? "other"
                        : ""
            ),
        organizationMemberships: entity
            ? [
                {
                    organizationId: entity.id,
                    clubId: entity.id,
                    role: "owner",
                    entityType
                }
            ]
            : []
    };

    if (entityType === "club") {
        return {
            ...baseUser,
            clubId: entity.id,
            clubName: entity.name,
            organizationId: null,
            organizationName: ""
        };
    }

    if (entityType === "organization") {
        return {
            ...baseUser,
            clubId: null,
            clubName: "",
            organizationId: entity.id,
            organizationName: entity.name
        };
    }

    return {
        ...baseUser,
        clubId: null,
        clubName: "",
        organizationId: profile.organization_id || null,
        organizationName: profile.organization_name || ""
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

    const { data: entity } =
        await supabase
            .from("clubs")
            .select("*")
            .eq("owner_id", userId)
            .maybeSingle();

    const storedEntity =
        mapEntityRowToStoredClub(entity, profile);

    if (storedEntity) {
        upsertStoredClub(storedEntity);
    }

    return mapProfileToAppUser(
        profile,
        professionalProfile,
        entity
    );
}

async function setupAccountInSupabase(userData) {
    const baseParams = {
        account_type_param:
            userData.accountType || "user",
        name_param:
            userData.name?.trim() || "",
        phone_param:
            userData.phone?.trim() || "",
        city_param:
            userData.city?.trim() || "",
        country_param:
            userData.country || "",
        professional_title_param:
            userData.professionalTitle || "",
        professional_summary_param:
            userData.professionalSummary || "",
        club_name_param:
            userData.clubName || "",
        club_city_param:
            userData.clubCity || "",
        club_country_param:
            userData.clubCountry || "",
        club_description_param:
            userData.clubDescription || "",
        club_website_param:
            userData.clubWebsite || ""
    };

    const paramsWithEntityType = {
        ...baseParams,
        organization_type_param:
            userData.organizationType || ""
    };

    const { error } =
        await supabase.rpc(
            "setup_new_account",
            paramsWithEntityType
        );

    if (!error) {
        return;
    }

    const accountType =
        userData.accountType || "user";

    const canFallbackToLegacyRpc =
        accountType !== "organization";

    if (!canFallbackToLegacyRpc) {
        throw new Error(
            "Falta actualizar la función setup_new_account en Supabase para soportar cuentas de organización. Ejecutá el SQL incluido en el fixpack."
        );
    }

    const { error: legacyError } =
        await supabase.rpc(
            "setup_new_account",
            baseParams
        );

    if (legacyError) {
        throw legacyError;
    }
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

    const { data: sessionData } =
        await supabase.auth.getSession();

    if (!sessionData.session) {
        throw new Error(
            "La cuenta fue creada, pero falta confirmar el email o iniciar sesión. Para la beta, desactivá Confirm email en Supabase Authentication → Providers → Email."
        );
    }

    await setupAccountInSupabase(
        userData
    );

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
