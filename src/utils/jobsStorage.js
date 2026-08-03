import { supabase } from "../lib/supabaseClient";
import { sameId } from "./idUtils";

const JOBS_STORAGE_KEY = "storedJobs";
const HIDDEN_JOBS_STORAGE_KEY = "hiddenJobs";

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

function safeDispatchJobsChanged() {
    try {
        window.dispatchEvent(
            new Event("jobsChanged")
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

function getCityName(job) {
    if (job?.cityName || job?.city_name) {
        return job.cityName || job.city_name;
    }

    if (job?.city && String(job.city).includes(",")) {
        return String(job.city).split(",")[0].trim();
    }

    return job?.city || "";
}

function getLegacyId(job) {
    if (!job) return "";

    return (
        job.legacyId ||
        job.legacy_id ||
        (!isUuid(job.id) ? job.id : "") ||
        ""
    );
}

function normalizeRequirements(job) {
    if (Array.isArray(job?.requirements)) {
        return job.requirements;
    }

    if (typeof job?.requirements === "string") {
        return job.requirements
            .split("\n")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}

function normalizeEligibleProfiles(job) {
    if (Array.isArray(job?.eligibleProfiles)) {
        return job.eligibleProfiles;
    }

    if (Array.isArray(job?.eligible_profiles)) {
        return job.eligible_profiles;
    }

    return ["professional"];
}

function normalizeJobStatus(status) {
    if (status === "published") {
        return "active";
    }

    if (
        status === "archived" ||
        status === "closed"
    ) {
        return "hidden";
    }

    return status || "active";
}

function jobStatusToDatabase(status) {
    if (
        status === "hidden" ||
        status === "inactive"
    ) {
        return "archived";
    }

    if (
        status === "draft" ||
        status === "closed" ||
        status === "archived" ||
        status === "published"
    ) {
        return status;
    }

    return "published";
}

export function normalizeJob(job) {
    if (!job) return null;

    const id =
        job.id ||
        crypto.randomUUID?.() ||
        String(Date.now());

    const legacyId = getLegacyId(job);

    const clubName =
        job.clubName ||
        job.club_name ||
        job.organizationName ||
        job.organization_name ||
        job.ownerName ||
        job.owner_name ||
        "";

    const cityName = getCityName(job);

    const ownerType =
        job.ownerType ||
        job.owner_type ||
        job.entityType ||
        job.entity_type ||
        "club";

    const ownerId =
        job.ownerId ||
        job.owner_id ||
        job.organizationId ||
        job.organization_id ||
        job.clubId ||
        job.club_id ||
        "";

    const ownerName =
        job.ownerName ||
        job.owner_name ||
        clubName ||
        "";

    const organizationId =
        job.organizationId ||
        job.organization_id ||
        (ownerType === "organization" ? ownerId : "");

    const organizationName =
        job.organizationName ||
        job.organization_name ||
        (ownerType === "organization" ? ownerName : clubName) ||
        "";

    return {
        id,
        legacyId,

        title: job.title || "Oportunidad sin título",
        category: job.category || "Coach",

        clubId: job.clubId || job.club_id || ownerId || "",
        clubName,
        organizationId,
        organizationName,
        ownerType,
        ownerId,
        ownerName,

        createdBy: job.createdBy || job.created_by || null,
        updatedBy: job.updatedBy || job.updated_by || null,

        opportunityType:
            job.opportunityType ||
            job.opportunity_type ||
            "employment",

        compensationType:
            job.compensationType ||
            job.compensation_type ||
            "to_confirm",

        compensationDetails:
            job.compensationDetails ||
            job.compensation_details ||
            job.salary ||
            "",

        salary:
            job.salary ||
            job.compensationDetails ||
            job.compensation_details ||
            "",

        country: job.country || "",
        countryCode: job.countryCode || job.country_code || "",

        state: job.state || job.province || job.region || "",
        stateCode: job.stateCode || job.state_code || "",

        city: job.city || "",
        cityName,

        duration: job.duration || "",
        openings: Number(job.openings) || 1,

        applicationDeadline:
            job.applicationDeadline ||
            job.application_deadline ||
            "",

        eventId:
            job.eventId ||
            job.event_id ||
            "",

        eligibleProfiles: normalizeEligibleProfiles(job),
        description: job.description || "",
        requirements: normalizeRequirements(job),

        applyLink: job.applyLink || job.apply_link || "#",
        website: job.website || "#",

        status: normalizeJobStatus(job.status),
        moderationReason:
            job.moderationReason ||
            job.moderation_reason ||
            "",
        moderatedAt:
            job.moderatedAt ||
            job.moderated_at ||
            null,

        metadata: job.metadata || {},

        createdAt:
            job.createdAt ||
            job.created_at ||
            new Date().toISOString(),

        updatedAt:
            job.updatedAt ||
            job.updated_at ||
            null
    };
}

function areSameLegacyJob(firstJob, secondJob) {
    return Boolean(
        (firstJob.legacyId && secondJob.legacyId && sameId(firstJob.legacyId, secondJob.legacyId)) ||
        (firstJob.legacyId && secondJob.id && sameId(firstJob.legacyId, secondJob.id)) ||
        (firstJob.id && secondJob.legacyId && sameId(firstJob.id, secondJob.legacyId))
    );
}

function uniqueJobs(jobs) {
    const result = [];

    jobs.forEach(job => {
        const normalizedJob = normalizeJob(job);

        if (!normalizedJob) return;

        const alreadyExists = result.some(existingJob =>
            sameId(existingJob.id, normalizedJob.id) ||
            areSameLegacyJob(existingJob, normalizedJob)
        );

        if (!alreadyExists) {
            result.push(normalizedJob);
        }
    });

    return result;
}

function isVisibleJob(job) {
    return job.status !== "hidden";
}

function saveJobsToLocalCache(jobs) {
    const normalizedJobs = uniqueJobs(jobs);

    writeStorageArray(
        JOBS_STORAGE_KEY,
        normalizedJobs
    );

    safeDispatchJobsChanged();

    return normalizedJobs;
}

function mapSupabaseJob(row) {
    if (!row) return null;

    return normalizeJob({
        id: row.id,
        legacyId: row.legacy_id,
        title: row.title,
        category: row.category,
        clubId: row.club_id,
        clubName: row.club_name,
        organizationId: row.organization_id,
        organizationName: row.organization_name,
        ownerType: row.owner_type,
        ownerId: row.owner_id,
        ownerName: row.owner_name,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        opportunityType: row.opportunity_type,
        compensationType: row.compensation_type,
        compensationDetails: row.compensation_details,
        salary: row.salary,
        country: row.country,
        countryCode: row.country_code,
        state: row.state,
        stateCode: row.state_code,
        city: row.city,
        cityName: row.city_name,
        duration: row.duration,
        openings: row.openings,
        applicationDeadline: row.application_deadline,
        eventId: row.event_id,
        eligibleProfiles: row.eligible_profiles,
        description: row.description,
        requirements: row.requirements,
        applyLink: row.apply_link,
        website: row.website,
        status: row.status,
        moderationReason: row.moderation_reason,
        moderatedAt: row.moderated_at,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    });
}

function jobToSupabaseRow(job) {
    const normalized = normalizeJob(job);
    const idIsUuid = isUuid(normalized.id);

    const row = {
        legacy_id: normalized.legacyId || (!idIsUuid ? String(normalized.id) : null),
        title: normalized.title,
        category: normalized.category,
        club_id: toUuidOrNull(normalized.clubId),
        club_name: normalized.clubName || null,
        organization_id: toUuidOrNull(normalized.organizationId),
        organization_name: normalized.organizationName || null,
        owner_type: normalized.ownerType || null,
        owner_id: toUuidOrNull(normalized.ownerId),
        owner_name: normalized.ownerName || null,
        created_by: toUuidOrNull(normalized.createdBy),
        updated_by: toUuidOrNull(normalized.updatedBy),
        opportunity_type: normalized.opportunityType || null,
        compensation_type: normalized.compensationType || null,
        compensation_details: normalized.compensationDetails || null,
        salary: normalized.salary || null,
        country: normalized.country || null,
        country_code: normalized.countryCode || null,
        state: normalized.state || null,
        state_code: normalized.stateCode || null,
        city: normalized.city || null,
        city_name: normalized.cityName || null,
        duration: normalized.duration || null,
        openings: normalized.openings || 1,
        application_deadline: normalized.applicationDeadline || null,
        event_id: toUuidOrNull(normalized.eventId),
        eligible_profiles: normalized.eligibleProfiles || ["professional"],
        description: normalized.description || null,
        requirements: normalized.requirements || [],
        apply_link: normalized.applyLink || null,
        website: normalized.website || null,
        status: jobStatusToDatabase(normalized.status),
        moderation_reason: normalized.moderationReason || null,
        moderated_at: normalized.moderatedAt || null,
        metadata: normalized.metadata || {},
        updated_at: new Date().toISOString()
    };

    if (idIsUuid) {
        row.id = normalized.id;
    }

    return row;
}

async function findSupabaseJob(job) {
    const normalized = normalizeJob(job);

    if (isUuid(normalized.id)) {
        const { data, error } = await supabase
            .from("opportunities")
            .select("*")
            .eq("id", normalized.id)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    const legacyId = normalized.legacyId || (!isUuid(normalized.id) ? String(normalized.id) : "");

    if (legacyId) {
        const { data, error } = await supabase
            .from("opportunities")
            .select("*")
            .eq("legacy_id", legacyId)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;
    }

    return null;
}

async function upsertSupabaseJob(job) {
    const row = jobToSupabaseRow(job);
    const existingRow = await findSupabaseJob(job);

    if (existingRow?.id) {
        const { data, error } = await supabase
            .from("opportunities")
            .update({
                ...row,
                id: existingRow.id
            })
            .eq("id", existingRow.id)
            .select("*")
            .single();

        if (error) throw error;
        return mapSupabaseJob(data);
    }

    const { data, error } = await supabase
        .from("opportunities")
        .insert(row)
        .select("*")
        .single();

    if (error) throw error;
    return mapSupabaseJob(data);
}

export function getHiddenJobIds() {
    return readStorageArray(HIDDEN_JOBS_STORAGE_KEY);
}

function saveHiddenJobIds(ids) {
    const uniqueIds = [];

    ids.forEach(id => {
        if (!uniqueIds.some(existingId => sameId(existingId, id))) {
            uniqueIds.push(id);
        }
    });

    writeStorageArray(HIDDEN_JOBS_STORAGE_KEY, uniqueIds);
    safeDispatchJobsChanged();

    return uniqueIds;
}

export function isJobHidden(jobId) {
    return getHiddenJobIds().some(id =>
        sameId(id, jobId)
    );
}

export function getStoredJobs() {
    return uniqueJobs(
        readStorageArray(JOBS_STORAGE_KEY)
    );
}

export function saveStoredJobs(jobs) {
    return saveJobsToLocalCache(jobs);
}

export async function fetchSupabaseJobs() {
    const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false, nullsFirst: false });

    if (error) throw error;

    return uniqueJobs((data || []).map(mapSupabaseJob));
}

export async function syncJobsFromSupabase(staticJobs = []) {
    const remoteJobs = await fetchSupabaseJobs();

    // Supabase es la fuente de verdad. La caché local solo conserva la última
    // lectura exitosa para poder mostrarla si una consulta posterior falla.
    // El argumento se mantiene temporalmente para no romper los consumidores
    // existentes mientras se retiran los imports de datos estáticos.
    void staticJobs;

    return saveJobsToLocalCache(remoteJobs);
}

export async function createStoredJob(jobData) {
    const newJob = normalizeJob({
        ...jobData,
        id: jobData.id || crypto.randomUUID?.() || String(Date.now()),
        createdAt: jobData.createdAt || new Date().toISOString(),
        updatedAt: null,
        status: jobData.status || "active"
    });

    const savedJob = await upsertSupabaseJob(newJob);

    saveJobsToLocalCache([
        savedJob,
        ...getStoredJobs()
    ]);

    return savedJob;
}

export async function updateStoredJob(jobId, updatedData) {
    const currentJobs = getStoredJobs();

    const previousStoredJob =
        currentJobs.find(job =>
            sameId(job.id, jobId) ||
            sameId(job.legacyId, jobId)
        ) ||
        normalizeJob({ ...updatedData, id: jobId });

    const updatedJob = normalizeJob({
        ...previousStoredJob,
        ...updatedData,
        id: previousStoredJob?.id || jobId,
        legacyId:
            previousStoredJob?.legacyId ||
            updatedData.legacyId ||
            (!isUuid(jobId) ? String(jobId) : ""),
        createdAt:
            previousStoredJob?.createdAt ||
            updatedData.createdAt ||
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const keptJobs = currentJobs.filter(job =>
        !sameId(job.id, jobId) &&
        !sameId(job.legacyId, jobId)
    );

    const savedJob = await upsertSupabaseJob(updatedJob);

    saveJobsToLocalCache([
        savedJob,
        ...keptJobs
    ]);

    return savedJob;
}

export async function hideStoredJob(jobId, reason = "", jobData = null) {
    const storedJob = getStoredJobs().find(job =>
        sameId(job.id, jobId) ||
        sameId(job.legacyId, jobId)
    );

    const hiddenJob = normalizeJob({
        ...(jobData || {}),
        ...(storedJob || {}),
        id: storedJob?.id || jobData?.id || jobId,
        legacyId:
            storedJob?.legacyId ||
            jobData?.legacyId ||
            (!isUuid(jobId) ? String(jobId) : ""),
        status: "hidden",
        moderationReason: reason,
        moderatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const savedJob = await upsertSupabaseJob(hiddenJob);

    saveHiddenJobIds([
        ...getHiddenJobIds(),
        jobId
    ]);
    saveJobsToLocalCache([
        savedJob,
        ...getStoredJobs()
    ]);

    return savedJob;
}

export async function restoreStoredJob(jobId, jobData = null) {
    const storedJob = getStoredJobs().find(job =>
        sameId(job.id, jobId) ||
        sameId(job.legacyId, jobId)
    );

    if (!storedJob && !jobData) {
        return null;
    }

    const restoredJob = normalizeJob({
        ...(jobData || {}),
        ...(storedJob || {}),
        id: storedJob?.id || jobData?.id || jobId,
        legacyId:
            storedJob?.legacyId ||
            jobData?.legacyId ||
            (!isUuid(jobId) ? String(jobId) : ""),
        status: "active",
        moderationReason: "",
        moderatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const savedJob = await upsertSupabaseJob(restoredJob);

    saveHiddenJobIds(
        getHiddenJobIds().filter(id =>
            !sameId(id, jobId)
        )
    );
    saveJobsToLocalCache([
        savedJob,
        ...getStoredJobs()
    ]);

    return savedJob;
}

export async function deleteStoredJob(jobId) {
    const jobs = getStoredJobs();

    const jobToDelete = jobs.find(job =>
        sameId(job.id, jobId) ||
        sameId(job.legacyId, jobId)
    );

    const updatedJobs = jobs.filter(job =>
        !sameId(job.id, jobId) &&
        !sameId(job.legacyId, jobId)
    );

    if (jobToDelete) {
        const existingRow = await findSupabaseJob(jobToDelete);

        if (existingRow?.id) {
            const { error } = await supabase
                .from("opportunities")
                .delete()
                .eq("id", existingRow.id);

            if (error) throw error;
        }
    }

    saveJobsToLocalCache(updatedJobs);
}

export function isStoredJob(jobId) {
    const jobs = getStoredJobs();

    return jobs.some(job =>
        sameId(job.id, jobId) ||
        sameId(job.legacyId, jobId)
    );
}

export function getAllJobsForAdmin(staticJobs = []) {
    const hiddenIds = getHiddenJobIds();

    void staticJobs;

    return getStoredJobs().map(job => {
        if (
            hiddenIds.some(id =>
                sameId(id, job.id) ||
                sameId(id, job.legacyId)
            )
        ) {
            return {
                ...job,
                status: "hidden"
            };
        }

        return job;
    });
}

export function getAllJobs(staticJobs = []) {
    return getAllJobsForAdmin(staticJobs)
        .filter(isVisibleJob);
}
