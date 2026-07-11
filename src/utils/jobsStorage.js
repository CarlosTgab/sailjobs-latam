export function getStoredJobs() {
    const data = localStorage.getItem("storedJobs");

    return data ? JSON.parse(data) : [];
}

export function saveStoredJobs(jobs) {
    localStorage.setItem(
        "storedJobs",
        JSON.stringify(jobs)
    );
}

export function createStoredJob(jobData) {
    const jobs = getStoredJobs();

    const newJob = {
        id: Date.now(),
        title: jobData.title,
        category: jobData.category || "Coach",
        clubId: jobData.clubId,
        country: jobData.country,
        city: jobData.city,
        salary: jobData.salary,
        duration: jobData.duration,
        description: jobData.description,
        requirements: jobData.requirements || [],
        applyLink: "#",
        website: "#",
        createdAt: new Date().toISOString(),
        updatedAt: null,
        status: "active"
    };

    const updatedJobs = [
        ...jobs,
        newJob
    ];

    saveStoredJobs(updatedJobs);

    return newJob;
}

export function updateStoredJob(jobId, updatedData) {
    const jobs = getStoredJobs();

    const updatedJobs = jobs.map((job) => {
        if (Number(job.id) === Number(jobId)) {
            return {
                ...job,
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
        }

        return job;
    });

    saveStoredJobs(updatedJobs);
}

export function deleteStoredJob(jobId) {
    const jobs = getStoredJobs();

    const updatedJobs = jobs.filter(
        job => Number(job.id) !== Number(jobId)
    );

    saveStoredJobs(updatedJobs);
}

export function isStoredJob(jobId) {
    const jobs = getStoredJobs();

    return jobs.some(
        job => Number(job.id) === Number(jobId)
    );
}

export function getAllJobs(staticJobs) {
    const storedJobs = getStoredJobs();

    return [
        ...staticJobs,
        ...storedJobs
    ];
}