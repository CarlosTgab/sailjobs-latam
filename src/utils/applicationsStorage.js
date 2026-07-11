const APPLICATIONS_STORAGE_KEY = "applications";

function normalizeApplicationStatus(status) {
    if (
        status === "Aceptada" ||
        status === "accepted"
    ) {
        return "Aceptado";
    }

    if (
        status === "Rechazada" ||
        status === "rejected"
    ) {
        return "Rechazado";
    }

    if (
        status === "pending" ||
        !status
    ) {
        return "Pendiente";
    }

    return status;
}

function normalizeApplication(application) {
    if (!application) {
        return null;
    }

    return {
        ...application,

        id:
            application.id ||
            Date.now(),

        status:
            normalizeApplicationStatus(
                application.status
            ),

        createdAt:
            application.createdAt ||
            new Date().toISOString()
    };
}

export function getApplications() {
    try {
        const data =
            localStorage.getItem(
                APPLICATIONS_STORAGE_KEY
            );

        const storedApplications =
            data
                ? JSON.parse(data)
                : [];

        if (
            !Array.isArray(
                storedApplications
            )
        ) {
            return [];
        }

        const normalizedApplications =
            storedApplications
                .map(normalizeApplication)
                .filter(Boolean);

        if (
            JSON.stringify(
                storedApplications
            ) !==
            JSON.stringify(
                normalizedApplications
            )
        ) {
            saveApplications(
                normalizedApplications
            );
        }

        return normalizedApplications;
    } catch (error) {
        console.error(
            "No se pudieron leer las postulaciones.",
            error
        );

        return [];
    }
}

export function saveApplications(
    applications
) {
    const safeApplications =
        Array.isArray(applications)
            ? applications
                .map(normalizeApplication)
                .filter(Boolean)
            : [];

    localStorage.setItem(
        APPLICATIONS_STORAGE_KEY,
        JSON.stringify(
            safeApplications
        )
    );

    window.dispatchEvent(
        new Event(
            "applicationsChanged"
        )
    );
}

export function saveApplication(
    applicationData
) {
    const applications =
        getApplications();

    const newApplication =
        normalizeApplication({
            ...applicationData,

            id:
                applicationData.id ||
                Date.now(),

            status:
                applicationData.status ||
                "Pendiente",

            createdAt:
                applicationData.createdAt ||
                new Date().toISOString()
        });

    saveApplications([
        ...applications,
        newApplication
    ]);

    return newApplication;
}

export function getApplicationById(
    applicationId
) {
    return (
        getApplications().find(
            application =>
                Number(
                    application.id
                ) ===
                Number(
                    applicationId
                )
        ) || null
    );
}

export function updateApplicationStatus(
    applicationId,
    newStatus
) {
    const applications =
        getApplications();

    const updatedApplications =
        applications.map(
            application => {

                if (
                    Number(
                        application.id
                    ) !==
                    Number(
                        applicationId
                    )
                ) {
                    return application;
                }

                return {
                    ...application,

                    status:
                        normalizeApplicationStatus(
                            newStatus
                        ),

                    updatedAt:
                        new Date().toISOString()
                };

            }
        );

    saveApplications(
        updatedApplications
    );

    return (
        updatedApplications.find(
            application =>
                Number(
                    application.id
                ) ===
                Number(
                    applicationId
                )
        ) || null
    );
}

export function deleteApplication(
    applicationId
) {
    const applications =
        getApplications();

    const updatedApplications =
        applications.filter(
            application =>
                Number(
                    application.id
                ) !==
                Number(
                    applicationId
                )
        );

    saveApplications(
        updatedApplications
    );
}