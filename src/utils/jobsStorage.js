import { sameId } from "./idUtils";

const JOBS_STORAGE_KEY = "storedJobs";

function readStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function normalizeJob(job) {
    if (!job) return null;

    const id =
        job.id ||
        crypto.randomUUID?.() ||
        Date.now();

    const clubName =
        job.clubName ||
        job.club_name ||
        job.organizationName ||
        job.organization_name ||
        "";

    const cityName =
        job.cityName ||
        job.city_name ||
        job.city ||
        "";

    return {
        id,

        title: job.title || "Oportunidad sin título",
        category: job.category || "Coach",

        clubId: job.clubId || job.club_id || "",
        clubName,
        organizationName: clubName,

        createdBy: job.createdBy || job.created_by || null,

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

        eligibleProfiles: Array.isArray(job.eligibleProfiles)
            ? job.eligibleProfiles
            : Array.isArray(job.eligible_profiles)
                ? job.eligible_profiles
                : ["professional"],

        description: job.description || "",

        requirements: Array.isArray(job.requirements)
            ? job.requirements
            : [],

        applyLink: job.applyLink || "#",
        website: job.website || "#",

        status: job.status || "active",

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

function uniqueJobs(jobs) {
    const result = [];

    jobs.forEach(job => {
        const normalizedJob = normalizeJob(job);

        if (!normalizedJob) return;

        const alreadyExists = result.some(existingJob =>
            sameId(existingJob.id, normalizedJob.id)
        );

        if (!alreadyExists) {
            result.push(normalizedJob);
        }
    });

    return result;
}

export function getStoredJobs() {
    return uniqueJobs(
        readStorageArray(JOBS_STORAGE_KEY)
    );
}

export function saveStoredJobs(jobs) {
    const normalizedJobs =
        uniqueJobs(jobs);

    localStorage.setItem(
        JOBS_STORAGE_KEY,
        JSON.stringify(normalizedJobs)
    );

    window.dispatchEvent(
        new Event("jobsChanged")
    );

    return normalizedJobs;
}

export function createStoredJob(jobData) {
    const jobs =
        getStoredJobs();

    const newJob =
        normalizeJob({
            ...jobData,
            id:
                jobData.id ||
                crypto.randomUUID?.() ||
                Date.now(),
            createdAt:
                jobData.createdAt ||
                new Date().toISOString(),
            updatedAt: null,
            status:
                jobData.status ||
                "active"
        });

    const updatedJobs = [
        ...jobs,
        newJob
    ];

    saveStoredJobs(updatedJobs);

    return newJob;
}

export function updateStoredJob(jobId, updatedData) {
    const jobs =
        getStoredJobs();

    const updatedJobs =
        jobs.map(job => {
            if (sameId(job.id, jobId)) {
                return normalizeJob({
                    ...job,
                    ...updatedData,
                    id: job.id,
                    updatedAt: new Date().toISOString()
                });
            }

            return job;
        });

    saveStoredJobs(updatedJobs);

    return updatedJobs.find(job =>
        sameId(job.id, jobId)
    );
}

export function deleteStoredJob(jobId) {
    const jobs =
        getStoredJobs();

    const updatedJobs =
        jobs.filter(job =>
            !sameId(job.id, jobId)
        );

    saveStoredJobs(updatedJobs);
}

export function isStoredJob(jobId) {
    const jobs =
        getStoredJobs();

    return jobs.some(job =>
        sameId(job.id, jobId)
    );
}

export function getAllJobs(staticJobs = []) {
    return uniqueJobs([
        ...staticJobs,
        ...getStoredJobs()
    ]);
}
