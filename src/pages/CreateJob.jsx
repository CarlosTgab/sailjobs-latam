import { useState } from "react";
import {
    useParams,
    useNavigate
} from "react-router-dom";

import {
    getCurrentUser
} from "../utils/authStorage";

import {
    sameId
} from "../utils/idUtils";

import {
    COUNTRIES,
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
    getAllEvents
} from "../utils/eventsStorage";

function CreateJob() {

    const { clubId } = useParams();

    const navigate = useNavigate();

    const clubs = getAllClubs(staticClubs);

    const currentUser =
        getCurrentUser();

    const clubFromLocalData =
        clubs.find(
            item =>
                sameId(item.id, clubId)
        );

    const clubFromCurrentUser =
        currentUser &&
            sameId(currentUser.clubId, clubId)
            ? {
                id: currentUser.clubId,
                name: currentUser.clubName || currentUser.name || "Mi organización",
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
        event =>
            sameId(event.clubId, clubId)
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

    const [eventId, setEventId] =
        useState("");

    const [
        eligibleProfiles,
        setEligibleProfiles
    ] = useState([
        ELIGIBLE_PROFILE_TYPES.PROFESSIONAL
    ]);

    const [country, setCountry] =
        useState(club?.country || "");

    const [city, setCity] =
        useState(club?.city || "");

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

    function handleOpportunityTypeChange(
        newType
    ) {
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

        if (!selectedEventId) {
            return;
        }

        const selectedEvent = allEvents.find(
            event =>
                sameId(event.id, selectedEventId)
        );

        if (!selectedEvent) {
            return;
        }

        if (selectedEvent.country) {
            setCountry(selectedEvent.country);
        }

        if (selectedEvent.city) {
            setCity(selectedEvent.city);
        }
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
        if (
            !title.trim() ||
            !category ||
            !opportunityType ||
            !compensationType ||
            !country ||
            !city ||
            !description.trim()
        ) {
            setFormMessage(
                "Completá todos los campos obligatorios."
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

        if (
            opportunityType ===
            OPPORTUNITY_TYPES.EVENT_ROLE &&
            !eventId
        ) {
            setFormMessage(
                "Para un cargo técnico de campeonato, vinculá la oportunidad a un evento."
            );

            return false;
        }

        if (
            opportunityType ===
            OPPORTUNITY_TYPES.VOLUNTEER &&
            !eventId
        ) {
            setFormMessage(
                "Para una convocatoria de voluntarios, vinculá la oportunidad a un evento."
            );

            return false;
        }

        return true;
    }

    function handleSubmit(event) {
        event.preventDefault();

        setFormMessage("");

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

        const createdJob = createStoredJob({
            clubId: resolvedClubId,
            clubName: resolvedClubName,
            organizationName: resolvedClubName,
            createdBy: currentUser?.id || null,

            title: title.trim(),
            category,
            opportunityType,
            compensationType,
            compensationDetails,
            salary: compensationDetails,
            country,
            city,
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
                                {event.className}
                            </option>

                        ))}

                    </select>

                    <p className="password-help">
                        Para cargos técnicos o
                        voluntariados de campeonato, lo
                        ideal es vincular la oportunidad
                        con un evento del calendario.
                    </p>

                    <hr />

                    <h2>
                        Ubicación y fechas
                    </h2>

                    <label>
                        País *
                    </label>

                    <select
                        value={country}
                        onChange={(event) =>
                            setCountry(
                                event.target.value
                            )
                        }
                    >

                        <option value="">
                            Seleccionar país
                        </option>

                        {COUNTRIES.map(
                            countryOption => (

                                <option
                                    key={countryOption}
                                    value={countryOption}
                                >
                                    {countryOption}
                                </option>

                            )
                        )}

                    </select>

                    <label>
                        Ciudad *
                    </label>

                    <input
                        type="text"
                        placeholder="Ciudad"
                        value={city}
                        onChange={(event) =>
                            setCity(
                                event.target.value
                            )
                        }
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