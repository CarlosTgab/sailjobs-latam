import { supabase } from "../lib/supabaseClient";
import { sameId } from "./idUtils";

const APPLICATIONS_STORAGE_KEY = "applications";

function readStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function writeStorageArray(key, items) {
    localStorage.setItem(
        key,
        JSON.stringify(items)
    );
}

function safeDispatchApplicationsChanged() {
    try {
        window.dispatchEvent(
            new Event("applicationsChanged")
        );
    } catch {
        // No-op outside browser contexts.
    }
}

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
        String(value || "")
    );
}

function toUuidOrNull(value) {
    return isUuid(value) ? String(value) : null;
}

export function normalizeApplicationStatus(status) {
    const normalized = String(status || "")
        .trim()
        .toLowerCase();

    if (
        normalized === "aceptada" ||
        normalized === "aceptado" ||
        normalized === "accepted"
    ) {
        return "Aceptado";
    }

    if (
        normalized === "rechazada" ||
        normalized === "rechazado" ||
        normalized === "rejected"
    ) {
        return "Rechazado";
    }

    return "Pendiente";
}

function applicationStatusToDatabase(status) {
    const normalized = normalizeApplicationStatus(status);

    if (normalized === "Aceptado") {
        return "accepted";
    }

    if (normalized === "Rechazado") {
        return "rejected";
    }

    return "pending";
}

function getLegacyId(application) {
    if (!application) return "";

    return (
        application.legacyId ||
        application.legacy_id ||
        (!isUuid(application.id) ? application.id : "") ||
        ""
    );
}

function getCityName(application) {
    if (application?.cityName || application?.city_name) {
        return application.cityName || application.city_name;
    }

    if (application?.city && String(application.city).includes(",")) {
        return String(application.city).split(",")[0].trim();
    }

    return application?.city || "";
}

export function normalizeApplication(application) {
    if (!application) {
        return null;
    }

    const id =
        application.id ||
        crypto.randomUUID?.() ||
        String(Date.now());

    return {
        id,
        legacyId: getLegacyId(application),

        userId:
            application.userId ||
            application.user_id ||
            null,

        jobId:
            application.jobId ||
            application.job_id ||
            application.jobLegacyId ||
            application.job_legacy_id ||
            null,

        clubId:
            application.clubId ||
            application.club_id ||
            null,

        organizationId:
            application.organizationId ||
            application.organization_id ||
            null,

        ownerType:
            application.ownerType ||
            application.owner_type ||
            "club",

        name: application.name || "",
        email: application.email || "",
        phone: application.phone || "",

        country: application.country || "",
        state: application.state || "",
        stateCode:
            application.stateCode ||
            application.state_code ||
            "",
        city: application.city || "",
        cityName: getCityName(application),

        cv:
            application.cv ||
            application.cvFileName ||
            application.cv_file_name ||
            "",

        cvUrl:
            application.cvUrl ||
            application.cv_url ||
            "",

        message: application.message || "",

        status:
            normalizeApplicationStatus(
                application.status
            ),

        professionalSnapshot:
            application.professionalSnapshot ||
            application.professional_snapshot ||
            {},

        internalNotes:
            application.internalNotes ||
            application.internal_notes ||
            "",

        reviewedBy:
            application.reviewedBy ||
            application.reviewed_by ||
            null,

        reviewedAt:
            application.reviewedAt ||
            application.reviewed_at ||
            null,

        createdAt:
            application.createdAt ||
            application.created_at ||
            new Date().toISOString(),

        updatedAt:
            application.updatedAt ||
            application.updated_at ||
            null
    };
}

function areSameApplication(firstApplication, secondApplication) {
    if (
        sameId(firstApplication.id, secondApplication.id) ||
        (
            firstApplication.legacyId &&
            secondApplication.legacyId &&
            sameId(
                firstApplication.legacyId,
                secondApplication.legacyId
            )
        )
    ) {
        return true;
    }

    return Boolean(
        firstApplication.userId &&
        secondApplication.userId &&
        firstApplication.jobId &&
        secondApplication.jobId &&
        sameId(
            firstApplication.userId,
            secondApplication.userId
        ) &&
        sameId(
            firstApplication.jobId,
            secondApplication.jobId
        )
    );
}

function uniqueApplications(applications) {
    const result = [];

    applications.forEach(application => {
        const normalizedApplication =
            normalizeApplication(application);

        if (!normalizedApplication) {
            return;
        }

        const alreadyExists = result.some(existingApplication =>
            areSameApplication(
                existingApplication,
                normalizedApplication
            )
        );

        if (!alreadyExists) {
            result.push(normalizedApplication);
        }
    });

    return result;
}

function saveApplicationsToLocalCache(applications) {
    const normalizedApplications =
        uniqueApplications(applications);

    writeStorageArray(
        APPLICATIONS_STORAGE_KEY,
        normalizedApplications
    );

    safeDispatchApplicationsChanged();

    return normalizedApplications;
}

function mapSupabaseApplication(row) {
    if (!row) return null;

    return normalizeApplication({
        id: row.id,
        legacyId: row.legacy_id,
        userId: row.user_id,
        jobId:
            row.job_id ||
            row.job_legacy_id,
        clubId: row.club_id,
        organizationId: row.organization_id,
        ownerType: row.owner_type,
        name: row.name,
        email: row.email,
        phone: row.phone,
        country: row.country,
        state: row.state,
        stateCode: row.state_code,
        city: row.city,
        cityName: row.city_name,
        cv: row.cv_file_name,
        cvUrl: row.cv_url,
        message: row.message,
        status: row.status,
        professionalSnapshot: row.professional_snapshot,
        internalNotes: row.internal_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    });
}

function applicationToSupabaseRow(application) {
    const normalized =
        normalizeApplication(application);

    const idIsUuid = isUuid(normalized.id);

    const row = {
        legacy_id:
            normalized.legacyId ||
            (!idIsUuid ? String(normalized.id) : null),
        user_id: toUuidOrNull(normalized.userId),
        job_id: toUuidOrNull(normalized.jobId),
        job_legacy_id:
            isUuid(normalized.jobId)
                ? null
                : String(normalized.jobId || "") || null,
        club_id: toUuidOrNull(normalized.clubId),
        organization_id:
            toUuidOrNull(normalized.organizationId),
        owner_type: normalized.ownerType || "club",
        name: normalized.name || "",
        email: normalized.email || "",
        phone: normalized.phone || "",
        country: normalized.country || "",
        state: normalized.state || null,
        state_code: normalized.stateCode || null,
        city: normalized.city || null,
        city_name: normalized.cityName || null,
        cv_file_name: normalized.cv || "",
        cv_url: normalized.cvUrl || "",
        message: normalized.message || "",
        status:
            applicationStatusToDatabase(
                normalized.status
            ),
        professional_snapshot:
            normalized.professionalSnapshot || {},
        internal_notes:
            normalized.internalNotes || null,
        reviewed_by:
            toUuidOrNull(normalized.reviewedBy),
        reviewed_at: normalized.reviewedAt || null,
        updated_at: new Date().toISOString()
    };

    if (idIsUuid) {
        row.id = normalized.id;
    }

    return row;
}

async function findSupabaseApplication(application) {
    const normalized =
        normalizeApplication(application);

    if (isUuid(normalized.id)) {
        const { data, error } = await supabase
            .from("applications")
            .select("*")
            .eq("id", normalized.id)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    const legacyId =
        normalized.legacyId ||
        (!isUuid(normalized.id)
            ? String(normalized.id)
            : "");

    if (legacyId) {
        const { data, error } = await supabase
            .from("applications")
            .select("*")
            .eq("legacy_id", legacyId)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    if (normalized.userId && normalized.jobId) {
        let query = supabase
            .from("applications")
            .select("*")
            .eq("user_id", normalized.userId);

        query = isUuid(normalized.jobId)
            ? query.eq("job_id", normalized.jobId)
            : query.eq(
                "job_legacy_id",
                String(normalized.jobId)
            );

        const { data, error } =
            await query.maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    return null;
}

async function upsertSupabaseApplication(application) {
    const row =
        applicationToSupabaseRow(application);

    if (
        !row.user_id ||
        (!row.job_id && !row.job_legacy_id)
    ) {
        throw new Error(
            "La postulación necesita un usuario y una oportunidad válidos."
        );
    }

    const existingRow =
        await findSupabaseApplication(application);

    if (existingRow?.id) {
        const { data, error } = await supabase
            .from("applications")
            .update({
                ...row,
                id: existingRow.id
            })
            .eq("id", existingRow.id)
            .select("*")
            .single();

        if (error) throw error;

        return mapSupabaseApplication(data);
    }

    const { data, error } = await supabase
        .from("applications")
        .insert(row)
        .select("*")
        .single();

    if (error) throw error;

    return mapSupabaseApplication(data);
}

export function getApplications() {
    return uniqueApplications(
        readStorageArray(
            APPLICATIONS_STORAGE_KEY
        )
    );
}

export function saveApplications(applications) {
    return saveApplicationsToLocalCache(
        Array.isArray(applications)
            ? applications
            : []
    );
}

export async function fetchSupabaseApplications() {
    const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", {
            ascending: false,
            nullsFirst: false
        });

    if (error) throw error;

    return uniqueApplications(
        (data || []).map(
            mapSupabaseApplication
        )
    );
}

export async function syncApplicationsFromSupabase() {
    const remoteApplications =
        await fetchSupabaseApplications();

    // No se mezclan registros locales con los remotos: una fila eliminada o
    // no visible por RLS no debe reaparecer desde el navegador.
    return saveApplicationsToLocalCache(
        remoteApplications
    );
}

export async function saveApplication(applicationData) {
    const newApplication =
        normalizeApplication({
            ...applicationData,
            id:
                applicationData.id ||
                crypto.randomUUID?.() ||
                String(Date.now()),
            status:
                applicationData.status ||
                "Pendiente",
            createdAt:
                applicationData.createdAt ||
                new Date().toISOString()
        });

    const duplicatedApplication =
        getApplications().find(application =>
            application.userId &&
            application.jobId &&
            sameId(
                application.userId,
                newApplication.userId
            ) &&
            sameId(
                application.jobId,
                newApplication.jobId
            )
        );

    if (duplicatedApplication) {
        throw new Error(
            "Ya existe una postulación para esta oportunidad."
        );
    }

    const existingRemoteApplication =
        await findSupabaseApplication(
            newApplication
        );

    if (existingRemoteApplication) {
        throw new Error(
            "Ya existe una postulación para esta oportunidad."
        );
    }

    const { data, error } = await supabase
        .from("applications")
        .insert(
            applicationToSupabaseRow(
                newApplication
            )
        )
        .select("*")
        .single();

    if (error) throw error;

    const savedApplication =
        mapSupabaseApplication(data);

    saveApplicationsToLocalCache([
        savedApplication,
        ...getApplications()
    ]);

    return savedApplication;
}

export function getApplicationById(applicationId) {
    return (
        getApplications().find(application =>
            sameId(application.id, applicationId) ||
            sameId(
                application.legacyId,
                applicationId
            )
        ) || null
    );
}

export async function updateApplicationStatus(
    applicationId,
    newStatus
) {
    const applications =
        getApplications();

    const currentApplication =
        applications.find(application =>
            sameId(application.id, applicationId) ||
            sameId(
                application.legacyId,
                applicationId
            )
        );

    if (!currentApplication) {
        throw new Error(
            "No se encontró la postulación."
        );
    }

    const updatedApplication =
        normalizeApplication({
            ...currentApplication,
            status:
                normalizeApplicationStatus(
                    newStatus
                ),
            reviewedAt:
                new Date().toISOString(),
            updatedAt:
                new Date().toISOString()
        });

    const savedApplication =
        await upsertSupabaseApplication(
            updatedApplication
        );

    saveApplicationsToLocalCache([
        savedApplication,
        ...applications.filter(application =>
            !areSameApplication(
                application,
                savedApplication
            )
        )
    ]);

    return savedApplication;
}

export async function deleteApplication(applicationId) {
    const applications =
        getApplications();

    const applicationToDelete =
        applications.find(application =>
            sameId(application.id, applicationId) ||
            sameId(
                application.legacyId,
                applicationId
            )
        );

    if (!applicationToDelete) {
        return;
    }

    const existingRow =
        await findSupabaseApplication(
            applicationToDelete
        );

    if (existingRow?.id) {
        const { error } = await supabase
            .from("applications")
            .delete()
            .eq("id", existingRow.id);

        if (error) throw error;
    }

    saveApplicationsToLocalCache(
        applications.filter(application =>
            !areSameApplication(
                application,
                applicationToDelete
            )
        )
    );
}
