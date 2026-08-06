import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    JOB_CATEGORIES,
    OPPORTUNITY_TYPES,
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPES,
    COMPENSATION_TYPE_LABELS,
    ELIGIBLE_PROFILE_TYPES,
    ELIGIBLE_PROFILE_LABELS
} from "../config/appConfig";

import LocationSelects, {
    CUSTOM_CITY_VALUE
} from "../components/LocationSelects";

import staticJobs from "../data/jobs";

import {
    getAllJobs,
    updateStoredJob,
    isStoredJob,
    syncJobsFromSupabase
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";

import {
    getAllClubs
} from "../utils/clubsStorage";

import staticEvents from "../data/events";

import {
    getAllEvents
} from "../utils/eventsStorage";

import {
    getCurrentUser
} from "../utils/authStorage";

import {
    canManageClub
} from "../utils/permissions";

import {
    sameId
} from "../utils/idUtils";

function getResolvedCity(cityValue, customCityValue, stateValue) {
    const resolvedCity =
        cityValue === CUSTOM_CITY_VALUE || !cityValue
            ? customCityValue.trim()
            : cityValue.trim();

    if (!resolvedCity) {
        return "";
    }

    return stateValue
        ? `${resolvedCity}, ${stateValue}`
        : resolvedCity;
}

function getInitialCityName(job) {
    if (job?.cityName) {
        return job.cityName;
    }

    if (job?.city && job.city.includes(",")) {
        return job.city.split(",")[0].trim();
    }

    return job?.city || "";
}

function EditJob() {
    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const [jobs, setJobs] = useState(() => getAllJobs(staticJobs));
    const [isLoadingJob, setIsLoadingJob] = useState(true);

    const clubs = getAllClubs(staticClubs);
    const allEvents = getAllEvents(staticEvents);

    useEffect(() => {
        let isMounted = true;

        async function loadJobs() {
            try {
                const syncedJobs = await syncJobsFromSupabase(staticJobs);

                if (isMounted) {
                    setJobs(syncedJobs);
                    setIsLoadingJob(false);
                }
            } catch {
                if (isMounted) {
                    setJobs(getAllJobs(staticJobs));
                    setIsLoadingJob(false);
                }
            }
        }

        function refreshFromLocalCache() {
            setJobs(getAllJobs(staticJobs));
        }

        loadJobs();
        window.addEventListener("jobsChanged", refreshFromLocalCache);

        return () => {
            isMounted = false;
            window.removeEventListener("jobsChanged", refreshFromLocalCache);
        };
    }, []);

    const job = jobs.find(
        item =>
            sameId(item.id, id) ||
            sameId(item.legacyId, id)
    );

    const club = job
        ? clubs.find(item => sameId(item.id, job.clubId))
        : null;

    const canManageThisJob =
        currentUser &&
        job &&
        canManageClub(currentUser, job.clubId);

    const jobWasCreatedInApp =
        job &&
        isStoredJob(job.id);

    const clubEvents = job
        ? allEvents.filter(
            event => sameId(event.clubId, job.clubId)
        )
        : [];

    const [title, setTitle] = useState(job?.title || "");
    const [category, setCategory] = useState(job?.category || "Coach");

    const [opportunityType, setOpportunityType] = useState(
        job?.opportunityType || OPPORTUNITY_TYPES.EMPLOYMENT
    );

    const [compensationType, setCompensationType] = useState(
        job?.compensationType || COMPENSATION_TYPES.TO_CONFIRM
    );

    const [compensationDetails, setCompensationDetails] = useState(
        job?.compensationDetails || job?.salary || ""
    );

    const [duration, setDuration] = useState(job?.duration || "");
    const [openings, setOpenings] = useState(job?.openings || 1);

    const [applicationDeadline, setApplicationDeadline] = useState(
        job?.applicationDeadline || ""
    );

    const [eventId, setEventId] = useState(job?.eventId || "");

    const [eligibleProfiles, setEligibleProfiles] = useState(
        Array.isArray(job?.eligibleProfiles)
            ? job.eligibleProfiles
            : [ELIGIBLE_PROFILE_TYPES.PROFESSIONAL]
    );

    const [country, setCountry] = useState(job?.country || club?.country || "");
    const [countryCode, setCountryCode] = useState(job?.countryCode || "");

    const [state, setState] = useState(job?.state || "");
    const [stateCode, setStateCode] = useState(job?.stateCode || "");

    const [city, setCity] = useState(getInitialCityName(job));
    const [customCity, setCustomCity] = useState("");

    const [description, setDescription] = useState(job?.description || "");

    const [requirementsText, setRequirementsText] = useState(
        Array.isArray(job?.requirements)
            ? job.requirements.join("\n")
            : ""
    );

    const [formMessage, setFormMessage] = useState("");
    const [formInitialized, setFormInitialized] = useState(false);

    /*
     * La oportunidad llega después de sincronizar con Supabase. Esta
     * hidratación se ejecuta una sola vez para no borrar cambios del usuario.
     */
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!job || formInitialized) return;

        setTitle(job.title || "");
        setCategory(job.category || "Coach");
        setOpportunityType(job.opportunityType || OPPORTUNITY_TYPES.EMPLOYMENT);
        setCompensationType(job.compensationType || COMPENSATION_TYPES.TO_CONFIRM);
        setCompensationDetails(job.compensationDetails || job.salary || "");
        setDuration(job.duration || "");
        setOpenings(job.openings || 1);
        setApplicationDeadline(job.applicationDeadline || "");
        setEventId(job.eventId || "");
        setEligibleProfiles(
            Array.isArray(job.eligibleProfiles)
                ? job.eligibleProfiles
                : [ELIGIBLE_PROFILE_TYPES.PROFESSIONAL]
        );
        setCountry(job.country || club?.country || "");
        setCountryCode(job.countryCode || "");
        setState(job.state || "");
        setStateCode(job.stateCode || "");
        setCity(getInitialCityName(job));
        setCustomCity("");
        setDescription(job.description || "");
        setRequirementsText(
            Array.isArray(job.requirements)
                ? job.requirements.join("\n")
                : ""
        );
        setFormInitialized(true);
    }, [club?.country, formInitialized, job]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!job && isLoadingJob) {
        return (
            <div className="dashboard-page">
                <h1>Cargando oportunidad...</h1>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="dashboard-page">
                <h1>Oportunidad no encontrada</h1>

                <button
                    className="back-button"
                    onClick={() => navigate("/jobs")}
                >
                    ← Volver a oportunidades
                </button>
            </div>
        );
    }

    if (!canManageThisJob) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    Solo la organización responsable puede editar esta oportunidad.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/jobs")}
                >
                    ← Volver a oportunidades
                </button>
            </div>
        );
    }

    if (!jobWasCreatedInApp) {
        return (
            <div className="dashboard-page">
                <h1>Esta oportunidad no se puede editar</h1>

                <p>
                    Esta oportunidad pertenece a los datos base del sitio.
                    Solo se pueden editar las oportunidades creadas desde el panel.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                >
                    ← Volver a la oportunidad
                </button>
            </div>
        );
    }

    function handleOpportunityTypeChange(newType) {
        setOpportunityType(newType);

        if (newType === OPPORTUNITY_TYPES.VOLUNTEER) {
            setCategory("Voluntario");
            setCompensationType(COMPENSATION_TYPES.VOLUNTEER);
            setEligibleProfiles([
                ELIGIBLE_PROFILE_TYPES.USER,
                ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
            ]);
            return;
        }

        if (newType === OPPORTUNITY_TYPES.EVENT_ROLE) {
            setCompensationType(COMPENSATION_TYPES.EXPENSES);
            setEligibleProfiles([
                ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
            ]);
            return;
        }

        setEligibleProfiles([
            ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
        ]);
    }

    function handleEventChange(selectedEventId) {
        setEventId(selectedEventId);
    }

    function toggleEligibleProfile(profile) {
        const isSelected = eligibleProfiles.includes(profile);

        if (isSelected) {
            const updatedProfiles = eligibleProfiles.filter(
                item => item !== profile
            );

            if (updatedProfiles.length === 0) {
                return;
            }

            setEligibleProfiles(updatedProfiles);
            return;
        }

        setEligibleProfiles([
            ...eligibleProfiles,
            profile
        ]);
    }

    function parseRequirements() {
        return requirementsText
            .split("\n")
            .map(item => item.trim())
            .filter(Boolean);
    }

    function validateForm() {
        const resolvedCity =
            getResolvedCity(
                city,
                customCity,
                state
            );

        if (
            !title.trim() ||
            !category ||
            !opportunityType ||
            !compensationType ||
            !country ||
            !state ||
            !resolvedCity ||
            !description.trim()
        ) {
            setFormMessage("Completá todos los campos obligatorios, incluida la ubicación completa.");
            return false;
        }

        if (Number(openings) <= 0 || Number.isNaN(Number(openings))) {
            setFormMessage("La cantidad de vacantes debe ser mayor a cero.");
            return false;
        }

        if (
            (
                opportunityType === OPPORTUNITY_TYPES.EVENT_ROLE ||
                opportunityType === OPPORTUNITY_TYPES.VOLUNTEER
            ) &&
            !eventId
        ) {
            setFormMessage(
                "Para cargos técnicos o voluntariados, vinculá la oportunidad a un evento."
            );

            return false;
        }

        return true;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setFormMessage("");

        const resolvedCity =
            getResolvedCity(
                city,
                customCity,
                state
            );

        if (!validateForm()) {
            return;
        }

        try {
            const updatedJob = await updateStoredJob(job.id, {
            clubId: job.clubId,
            clubName: job.clubName || club?.name || currentUser?.clubName || "Mi organización",
            organizationId: job.organizationId || (job.ownerType === "organization" ? job.clubId : ""),
            organizationName: job.organizationName || job.clubName || club?.name || currentUser?.clubName || "Mi organización",
            ownerType: job.ownerType || club?.entityType || currentUser?.entityType || (currentUser?.role === "organization_admin" ? "organization" : "club"),
            ownerId: job.ownerId || job.clubId,
            ownerName: job.ownerName || job.organizationName || job.clubName || club?.name || currentUser?.clubName || "Mi organización",
            createdBy: job.createdBy || currentUser?.id || null,
            updatedBy: currentUser?.id || null,

            title: title.trim(),
            category,
            opportunityType,
            compensationType,
            compensationDetails: compensationDetails.trim(),
            salary:
                compensationDetails.trim() ||
                COMPENSATION_TYPE_LABELS[compensationType] ||
                "A confirmar",
            duration: duration.trim() || "A confirmar",
            openings: Number(openings),
            applicationDeadline,
            eventId,
            eligibleProfiles,

            country,
            countryCode,
            state,
            stateCode,
            city: resolvedCity,
            cityName:
                city === CUSTOM_CITY_VALUE || !city
                    ? customCity.trim()
                    : city.trim(),

            description: description.trim(),
            requirements: parseRequirements()
            });

            alert("Oportunidad actualizada correctamente.");

            navigate(`/jobs/${updatedJob.id}`);
        } catch {
            setFormMessage("No se pudo actualizar la oportunidad. Revisá la conexión e intentá nuevamente.");
        }
    }

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() => navigate(`/jobs/${job.id}`)}
            >
                ← Volver a la oportunidad
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Editar oportunidad</h1>

                    <p>
                        Actualizá los datos de la oportunidad publicada por{" "}
                        {club ? club.name : "tu organización"}.
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <form onSubmit={handleSubmit}>
                    <h2>Información principal</h2>

                    <label>Tipo de oportunidad *</label>

                    <select
                        value={opportunityType}
                        onChange={(event) =>
                            handleOpportunityTypeChange(event.target.value)
                        }
                    >
                        {Object.entries(OPPORTUNITY_TYPE_LABELS).map(
                            ([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            )
                        )}
                    </select>

                    <label>Título *</label>

                    <input
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                    />

                    <label>Puesto / categoría *</label>

                    <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                    >
                        {JOB_CATEGORIES.map(item => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <label>Evento vinculado</label>

                    <select
                        value={eventId}
                        onChange={(event) => handleEventChange(event.target.value)}
                    >
                        <option value="">
                            Sin evento vinculado
                        </option>

                        {clubEvents.map(event => (
                            <option key={event.id} value={event.id}>
                                {event.title} · {event.className}
                            </option>
                        ))}
                    </select>

                    <hr />

                    <h2>Ubicación y fechas</h2>

                    <LocationSelects
                        countryCode={countryCode}
                        setCountryCode={setCountryCode}
                        setCountry={setCountry}
                        stateCode={stateCode}
                        setStateCode={setStateCode}
                        setState={setState}
                        city={city}
                        setCity={setCity}
                        customCity={customCity}
                        setCustomCity={setCustomCity}
                    />

                    <label>Duración</label>

                    <input
                        type="text"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                    />

                    <label>Fecha límite de postulación</label>

                    <input
                        type="date"
                        value={applicationDeadline}
                        onChange={(event) => setApplicationDeadline(event.target.value)}
                    />

                    <label>Vacantes *</label>

                    <input
                        type="number"
                        min="1"
                        value={openings}
                        onChange={(event) => setOpenings(event.target.value)}
                    />

                    <hr />

                    <h2>Compensación</h2>

                    <label>Tipo de compensación *</label>

                    <select
                        value={compensationType}
                        onChange={(event) => setCompensationType(event.target.value)}
                    >
                        {Object.entries(COMPENSATION_TYPE_LABELS).map(
                            ([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            )
                        )}
                    </select>

                    <label>Detalle de compensación</label>

                    <input
                        type="text"
                        value={compensationDetails}
                        onChange={(event) => setCompensationDetails(event.target.value)}
                    />

                    <hr />

                    <h2>Quiénes pueden postularse</h2>

                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={eligibleProfiles.includes(
                                ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
                            )}
                            onChange={() =>
                                toggleEligibleProfile(
                                    ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
                                )
                            }
                        />

                        {
                            ELIGIBLE_PROFILE_LABELS[
                                ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
                            ]
                        }
                    </label>

                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={eligibleProfiles.includes(
                                ELIGIBLE_PROFILE_TYPES.USER
                            )}
                            onChange={() =>
                                toggleEligibleProfile(
                                    ELIGIBLE_PROFILE_TYPES.USER
                                )
                            }
                        />

                        {
                            ELIGIBLE_PROFILE_LABELS[
                                ELIGIBLE_PROFILE_TYPES.USER
                            ]
                        }
                    </label>

                    <hr />

                    <h2>Descripción y requisitos</h2>

                    <label>Descripción *</label>

                    <textarea
                        rows="7"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />

                    <label>Requisitos</label>

                    <textarea
                        rows="6"
                        value={requirementsText}
                        onChange={(event) => setRequirementsText(event.target.value)}
                    />

                    {formMessage && (
                        <p style={{ color: "#b42318" }}>
                            {formMessage}
                        </p>
                    )}

                    <div className="dashboard-actions">
                        <button
                            type="button"
                            className="reject-button"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="accept-button"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditJob;
