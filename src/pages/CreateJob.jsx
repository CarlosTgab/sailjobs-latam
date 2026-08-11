import { useState } from "react";
import {
    useParams,
    useNavigate,
    useSearchParams
} from "react-router-dom";

import {
    getCurrentUser
} from "../utils/authStorage";

import {
    sameId
} from "../utils/idUtils";

import LocationSelects, {
    CUSTOM_CITY_VALUE
} from "../components/LocationSelects";

import {
    JOB_CATEGORIES,
    OPPORTUNITY_TYPES,
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPES,
    COMPENSATION_TYPE_LABELS,
    ELIGIBLE_PROFILE_TYPES,
    ELIGIBLE_PROFILE_LABELS
} from "../config/appConfig";

import {
    createStoredJob
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";

import {
    getAllClubs
} from "../utils/clubsStorage";

import staticEvents from "../data/events";

import {
    eventBelongsToEntity,
    getAllEvents,
    getEventClassLabel
} from "../utils/eventsStorage";

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

function getJobSaveErrorMessage(error) {
    const code = String(error?.code || "");
    const detail = String(error?.message || "").trim();
    const normalizedDetail = detail.toLowerCase();

    if (
        code === "42501" ||
        normalizedDetail.includes("row-level security")
    ) {
        return "Tu cuenta no tiene permiso online para publicar esta oportunidad. Ejecutá el hotfix de permisos para clubes y organizaciones.";
    }

    if (code === "23514") {
        return `La base rechazó uno de los valores de la oportunidad. Detalle: ${detail || code}`;
    }

    if (code === "22P02" && normalizedDetail.includes("uuid")) {
        return "La base rechazó el identificador del campeonato o de la organización. Cerrá sesión, volvé a ingresar e intentá nuevamente.";
    }

    if (code === "42703") {
        return "Falta actualizar la estructura de oportunidades en Supabase.";
    }

    const technicalDetail = [code && `[${code}]`, detail]
        .filter(Boolean)
        .join(" ");

    return technicalDetail
        ? `No se pudo publicar la oportunidad. Detalle: ${technicalDetail}`
        : "No se pudo publicar la oportunidad. Revisá la conexión e intentá nuevamente.";
}

function CreateJob() {
    const { clubId } = useParams();

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const clubs = getAllClubs(staticClubs);

    const currentUser =
        getCurrentUser();

    const clubFromLocalData =
        clubs.find(
            item =>
                sameId(item.id, clubId)
        );

    const currentUserEntityId =
        currentUser?.entityId ||
        currentUser?.organizationId ||
        currentUser?.clubId ||
        "";

    const clubFromCurrentUser =
        currentUser &&
            sameId(currentUserEntityId, clubId)
            ? {
                id: currentUserEntityId,
                name:
                    currentUser.entityName ||
                    currentUser.organizationName ||
                    currentUser.clubName ||
                    currentUser.name ||
                    "Mi organización",
                entityType: currentUser.entityType || (currentUser.organizationId ? "organization" : "club"),
                country: currentUser.country || "",
                city: currentUser.city || "",
                description: currentUser.description || "",
                website: "",
                logo: currentUser.profileImage || "",
                logoUrl: currentUser.profileImage || ""
            }
            : null;

    const club =
        clubFromLocalData ||
        clubFromCurrentUser;

    const allEvents = getAllEvents(staticEvents);

    const clubEvents = allEvents.filter(
        event => eventBelongsToEntity(event, clubId)
    );

    const [title, setTitle] = useState("");

    const [category, setCategory] = useState(
        "Coach"
    );

    const [
        opportunityType,
        setOpportunityType
    ] = useState(
        OPPORTUNITY_TYPES.EMPLOYMENT
    );

    const [
        compensationType,
        setCompensationType
    ] = useState(
        COMPENSATION_TYPES.TO_CONFIRM
    );

    const [
        compensationDetails,
        setCompensationDetails
    ] = useState("");

    const [duration, setDuration] =
        useState("");

    const [openings, setOpenings] =
        useState(1);

    const [
        applicationDeadline,
        setApplicationDeadline
    ] = useState("");

    const requestedEventId = searchParams.get("eventId") || "";

    const [eventId, setEventId] = useState(() =>
        clubEvents.some(event => sameId(event.id, requestedEventId))
            ? requestedEventId
            : ""
    );

    const [
        eligibleProfiles,
        setEligibleProfiles
    ] = useState([
        ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
    ]);

    const [country, setCountry] =
        useState("");

    const [countryCode, setCountryCode] =
        useState("");

    const [state, setState] =
        useState("");

    const [stateCode, setStateCode] =
        useState("");

    const [city, setCity] =
        useState("");

    const [customCity, setCustomCity] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [
        requirementsText,
        setRequirementsText
    ] = useState("");

    const [formMessage, setFormMessage] =
        useState("");

    if (!club) {
        return (
            <div className="dashboard-page">
                <h1>
                    Organización no encontrada
                </h1>

                <p>
                    No pudimos encontrar el club u
                    organización para publicar esta
                    oportunidad.
                </p>

                <button
                    className="back-button"
                    onClick={() =>
                        navigate("/clubs")
                    }
                >
                    ← Volver a clubes
                </button>
            </div>
        );
    }

    function handleOpportunityTypeChange(newType) {
        setOpportunityType(newType);

        if (
            newType ===
            OPPORTUNITY_TYPES.VOLUNTEER
        ) {
            setCategory("Voluntario");

            setCompensationType(
                COMPENSATION_TYPES.VOLUNTEER
            );

            setEligibleProfiles([
                ELIGIBLE_PROFILE_TYPES.USER,
                ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
            ]);

            return;
        }

        if (
            newType ===
            OPPORTUNITY_TYPES.EVENT_ROLE
        ) {
            setCompensationType(
                COMPENSATION_TYPES.EXPENSES
            );

            setEligibleProfiles([
                ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
            ]);

            return;
        }

        setCompensationType(
            COMPENSATION_TYPES.TO_CONFIRM
        );

        setEligibleProfiles([
            ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
        ]);
    }

    function handleEventChange(selectedEventId) {
        setEventId(selectedEventId);
    }

    function toggleEligibleProfile(profile) {
        const profileIsSelected =
            eligibleProfiles.includes(profile);

        if (profileIsSelected) {
            const updatedProfiles =
                eligibleProfiles.filter(
                    item => item !== profile
                );

            if (updatedProfiles.length === 0) {
                return;
            }

            setEligibleProfiles(
                updatedProfiles
            );

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
            setFormMessage(
                "Completá todos los campos obligatorios, incluida la ubicación completa."
            );

            return false;
        }

        if (
            Number(openings) <= 0 ||
            Number.isNaN(Number(openings))
        ) {
            setFormMessage(
                "La cantidad de vacantes debe ser mayor a cero."
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

        const resolvedClubId =
            club?.id ||
            clubId ||
            currentUser?.clubId;

        const resolvedClubName =
            club?.name ||
            currentUser?.clubName ||
            currentUser?.name ||
            "Mi organización";

        const requirements = parseRequirements();

        const ownerType =
            club?.entityType ||
            currentUser?.entityType ||
            (currentUser?.role === "organization_admin" ? "organization" : "club");

        try {
            const createdJob = await createStoredJob({
            clubId: resolvedClubId,
            clubName: resolvedClubName,
            organizationId:
                ownerType === "organization"
                    ? resolvedClubId
                    : "",
            organizationName: resolvedClubName,
            ownerType,
            ownerId: resolvedClubId,
            ownerName: resolvedClubName,
            createdBy: currentUser?.id || null,

            title: title.trim(),
            category,
            opportunityType,
            compensationType,
            compensationDetails,
            salary: compensationDetails,
            country,
            countryCode,
            state,
            stateCode,
            city: resolvedCity,
            cityName:
                city === CUSTOM_CITY_VALUE || !city
                    ? customCity.trim()
                    : city.trim(),
            duration,
            openings: Number(openings) || 1,
            applicationDeadline,
            eligibleProfiles,
            description: description.trim(),
            requirements,
            eventId,
            createdAt: new Date().toISOString()
            });

            alert(
                "Oportunidad publicada correctamente."
            );

            navigate(`/jobs/${createdJob.id}`);
        } catch (error) {
            setFormMessage(
                getJobSaveErrorMessage(error)
            );
        }
    }

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() =>
                    navigate(
                        `/club-dashboard/${clubId}`
                    )
                }
            >
                ← Volver al panel
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>
                        Publicar oportunidad
                    </h1>

                    <p>
                        Publicá trabajos profesionales,
                        cargos técnicos de campeonato o
                        convocatorias de voluntarios para{" "}
                        {club.name}.
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <form onSubmit={handleSubmit}>
                    <h2>
                        Información principal
                    </h2>

                    <label>
                        Tipo de oportunidad *
                    </label>

                    <select
                        value={opportunityType}
                        onChange={(event) =>
                            handleOpportunityTypeChange(
                                event.target.value
                            )
                        }
                    >
                        {Object.entries(
                            OPPORTUNITY_TYPE_LABELS
                        ).map(
                            ([
                                value,
                                label
                            ]) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {label}
                                </option>
                            )
                        )}
                    </select>

                    <label>
                        Título *
                    </label>

                    <input
                        type="text"
                        placeholder={
                            opportunityType ===
                                OPPORTUNITY_TYPES.EVENT_ROLE
                                ? "Ejemplo: Jurado para Campeonato Argentino ILCA"
                                : opportunityType ===
                                    OPPORTUNITY_TYPES.VOLUNTEER
                                    ? "Ejemplo: Voluntarios para Nacional de Optimist"
                                    : "Ejemplo: Coach de Optimist para temporada de verano"
                        }
                        value={title}
                        onChange={(event) =>
                            setTitle(
                                event.target.value
                            )
                        }
                    />

                    <label>
                        Puesto / categoría *
                    </label>

                    <select
                        value={category}
                        onChange={(event) =>
                            setCategory(
                                event.target.value
                            )
                        }
                    >
                        {JOB_CATEGORIES.map(
                            item => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            )
                        )}
                    </select>

                    <label>
                        Evento vinculado
                    </label>

                    <select
                        value={eventId}
                        onChange={(event) =>
                            handleEventChange(
                                event.target.value
                            )
                        }
                    >
                        <option value="">
                            Sin evento vinculado
                        </option>

                        {clubEvents.map(event => (
                            <option
                                key={event.id}
                                value={event.id}
                            >
                                {event.title}
                                {" · "}
                                {getEventClassLabel(event)}
                            </option>
                        ))}
                    </select>

                    <p className="password-help">
                        El evento es opcional. Vinculalo si la convocatoria corresponde a un campeonato concreto.
                    </p>

                    <hr />

                    <h2>
                        Ubicación y fechas
                    </h2>

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

                    <label>
                        Duración
                    </label>

                    <input
                        type="text"
                        placeholder={
                            "Ejemplo: 3 días, temporada de verano, 2 meses"
                        }
                        value={duration}
                        onChange={(event) =>
                            setDuration(
                                event.target.value
                            )
                        }
                    />

                    <label>
                        Fecha límite de postulación
                    </label>

                    <input
                        type="date"
                        value={applicationDeadline}
                        onChange={(event) =>
                            setApplicationDeadline(
                                event.target.value
                            )
                        }
                    />

                    <label>
                        Vacantes *
                    </label>

                    <input
                        type="number"
                        min="1"
                        value={openings}
                        onChange={(event) =>
                            setOpenings(
                                event.target.value
                            )
                        }
                    />

                    <hr />

                    <h2>
                        Compensación
                    </h2>

                    <label>
                        Tipo de compensación *
                    </label>

                    <select
                        value={compensationType}
                        onChange={(event) =>
                            setCompensationType(
                                event.target.value
                            )
                        }
                    >
                        {Object.entries(
                            COMPENSATION_TYPE_LABELS
                        ).map(
                            ([
                                value,
                                label
                            ]) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {label}
                                </option>
                            )
                        )}
                    </select>

                    <label>
                        Detalle de compensación
                    </label>

                    <input
                        type="text"
                        placeholder={
                            "Ejemplo: USD 500, alojamiento y comidas, gastos cubiertos, a confirmar"
                        }
                        value={compensationDetails}
                        onChange={(event) =>
                            setCompensationDetails(
                                event.target.value
                            )
                        }
                    />

                    <hr />

                    <h2>
                        Quiénes pueden postularse
                    </h2>

                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={
                                eligibleProfiles.includes(
                                    ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
                                )
                            }
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
                            checked={
                                eligibleProfiles.includes(
                                    ELIGIBLE_PROFILE_TYPES.USER
                                )
                            }
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

                    <p className="password-help">
                        Los cargos técnicos normalmente
                        requieren perfil profesional.
                        Los voluntariados pueden aceptar
                        también usuarios generales.
                    </p>

                    <hr />

                    <h2>
                        Descripción y requisitos
                    </h2>

                    <label>
                        Descripción *
                    </label>

                    <textarea
                        rows="7"
                        placeholder={
                            "Describí la oportunidad, responsabilidades, fechas, condiciones y contexto."
                        }
                        value={description}
                        onChange={(event) =>
                            setDescription(
                                event.target.value
                            )
                        }
                    />

                    <label>
                        Requisitos
                    </label>

                    <textarea
                        rows="6"
                        placeholder={
                            "Escribí un requisito por línea. Ejemplo:\nExperiencia previa en regatas\nDisponibilidad durante todo el campeonato\nCertificación nacional o internacional"
                        }
                        value={requirementsText}
                        onChange={(event) =>
                            setRequirementsText(
                                event.target.value
                            )
                        }
                    />

                    {formMessage && (
                        <p
                            style={{
                                color: "#b42318"
                            }}
                        >
                            {formMessage}
                        </p>
                    )}

                    <div className="dashboard-actions">
                        <button
                            type="button"
                            className="reject-button"
                            onClick={() =>
                                navigate(
                                    `/club-dashboard/${clubId}`
                                )
                            }
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="accept-button"
                        >
                            Publicar oportunidad
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateJob;
