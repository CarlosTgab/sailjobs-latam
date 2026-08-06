import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import staticEvents from "../data/events";
import {
    getAllEvents,
    getEventClassNames,
    syncEventsFromSupabase,
    updateStoredEvent
} from "../utils/eventsStorage";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getEntityType,
    syncEntitiesFromSupabase
} from "../utils/clubsStorage";

import { getCurrentUser } from "../utils/authStorage";
import {
    canManageEvent,
    canReviewEvent,
    isSuperadmin
} from "../utils/permissions";
import { sameId } from "../utils/idUtils";

import {
    EVENT_STATUS,
    EVENT_STATUS_LABELS
} from "../config/appConfig";

import LocationSelects, {
    CUSTOM_CITY_VALUE
} from "../components/LocationSelects";
import SailingClassSelect from "../components/SailingClassSelect";

function getEventCityName(event) {
    if (event?.cityName) {
        return event.cityName;
    }

    if (event?.city && String(event.city).includes(",")) {
        return String(event.city).split(",")[0].trim();
    }

    return event?.city || "";
}

function getResolvedCity(cityValue, customCityValue, stateValue) {
    const resolvedCity =
        cityValue === CUSTOM_CITY_VALUE || !cityValue
            ? String(customCityValue || "").trim()
            : String(cityValue || "").trim();

    if (!resolvedCity) {
        return "";
    }

    return stateValue
        ? `${resolvedCity}, ${stateValue}`
        : resolvedCity;
}

function getLocationLabel(event) {
    const parts = [
        getEventCityName(event),
        event?.state,
        event?.country
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

function EditEvent() {
    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();
    const currentUserIsSuperadmin = isSuperadmin(currentUser);

    const [events, setEvents] = useState(() => getAllEvents(staticEvents));
    const [isLoadingOnlineEvent, setIsLoadingOnlineEvent] = useState(true);
    const [formInitialized, setFormInitialized] = useState(false);

    const [clubs, setClubs] = useState(() => getAllClubs(staticClubs));

    useEffect(() => {
        let isMounted = true;

        syncEntitiesFromSupabase(staticClubs)
            .then(syncedEntities => {
                if (isMounted) setClubs(syncedEntities);
            })
            .catch(() => {
                if (isMounted) setClubs(getAllClubs(staticClubs));
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const syncedEvents = await syncEventsFromSupabase(staticEvents);

                if (isMounted) {
                    setEvents(syncedEvents);
                }
            } catch {
                if (isMounted) {
                    setEvents(getAllEvents(staticEvents));
                }
            } finally {
                if (isMounted) {
                    setIsLoadingOnlineEvent(false);
                }
            }
        }

        function refreshFromLocalCache() {
            setEvents(getAllEvents(staticEvents));
        }

        loadEvents();
        window.addEventListener("eventsChanged", refreshFromLocalCache);

        return () => {
            isMounted = false;
            window.removeEventListener("eventsChanged", refreshFromLocalCache);
        };
    }, []);

    const event = events.find(item =>
        sameId(item.id, id) ||
        sameId(item.legacyId, id)
    );

    const currentUserCanReviewEvent = canReviewEvent(currentUser, event);
    const currentUserCanEditInstitutionalData =
        currentUserIsSuperadmin || currentUserCanReviewEvent;

    const club = event
        ? clubs.find(item => sameId(item.id, event.clubId))
        : null;

    const [title, setTitle] = useState(event?.title || "");
    const [classNames, setClassNames] = useState(() => getEventClassNames(event));
    const [invitedEntityIds, setInvitedEntityIds] = useState(() =>
        (event?.invitedEntities || []).map(entity => entity.entityId).filter(Boolean)
    );

    const [country, setCountry] = useState(event?.country || "");
    const [countryCode, setCountryCode] = useState(event?.countryCode || "");

    const [state, setState] = useState(event?.state || "");
    const [stateCode, setStateCode] = useState(event?.stateCode || "");

    const [city, setCity] = useState(
        event?.countryCode && event?.stateCode
            ? CUSTOM_CITY_VALUE
            : ""
    );

    const [customCity, setCustomCity] = useState(
        getEventCityName(event)
    );

    const [manualLocationMode, setManualLocationMode] = useState(
        !event?.countryCode || !event?.stateCode
    );

    const [startDate, setStartDate] = useState(event?.startDate || "");
    const [endDate, setEndDate] = useState(event?.endDate || "");
    const [website, setWebsite] = useState(event?.website || "");
    const [description, setDescription] = useState(event?.description || "");

    const [status, setStatus] = useState(event?.status || EVENT_STATUS.PENDING);
    const [isOfficial, setIsOfficial] = useState(Boolean(event?.isOfficial));

    const [source, setSource] = useState(event?.source || "Club");
    const [sourceUrl, setSourceUrl] = useState(event?.sourceUrl || "");
    const [organizationName, setOrganizationName] = useState(event?.organizationName || "");
    const [organizingClubName, setOrganizingClubName] = useState(event?.organizingClubName || "");

    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    /*
     * El registro llega después de sincronizar con Supabase. Esta hidratación
     * se ejecuta una sola vez y no debe reiniciar cambios hechos por el usuario.
     */
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!event || formInitialized) return;

        setTitle(event.title || "");
        setClassNames(getEventClassNames(event));
        setInvitedEntityIds(
            (event.invitedEntities || []).map(entity => entity.entityId).filter(Boolean)
        );
        setCountry(event.country || "");
        setCountryCode(event.countryCode || "");
        setState(event.state || "");
        setStateCode(event.stateCode || "");
        setCity(event.countryCode && event.stateCode ? CUSTOM_CITY_VALUE : "");
        setCustomCity(getEventCityName(event));
        setManualLocationMode(!event.countryCode || !event.stateCode);
        setStartDate(event.startDate || "");
        setEndDate(event.endDate || "");
        setWebsite(event.website || "");
        setDescription(event.description || "");
        setStatus(event.status || EVENT_STATUS.PENDING);
        setIsOfficial(Boolean(event.isOfficial));
        setSource(event.source || "Club");
        setSourceUrl(event.sourceUrl || "");
        setOrganizationName(event.organizationName || "");
        setOrganizingClubName(event.organizingClubName || "");
        setFormInitialized(true);
    }, [event, formInitialized]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!event) {
        return (
            <div className="dashboard-page">
                <h1>{isLoadingOnlineEvent ? "Buscando evento..." : "Evento no encontrado"}</h1>

                <button
                    className="back-button"
                    onClick={() => navigate("/calendar")}
                >
                    ← Volver al calendario
                </button>
            </div>
        );
    }

    if (!canManageEvent(currentUser, event)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    No tenés permiso para modificar este evento.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate(`/calendar/${event.id}`)}
                >
                    ← Volver al evento
                </button>
            </div>
        );
    }

    async function handleSubmit(submitEvent) {
        submitEvent.preventDefault();

        const resolvedCity = manualLocationMode
            ? getResolvedCity(CUSTOM_CITY_VALUE, customCity, state)
            : getResolvedCity(city, customCity, state);

        const resolvedCityName = manualLocationMode
            ? customCity.trim()
            : city === CUSTOM_CITY_VALUE || !city
                ? customCity.trim()
                : city.trim();

        if (
            !title.trim() ||
            classNames.length === 0 ||
            !country.trim() ||
            !state.trim() ||
            !resolvedCity ||
            !startDate ||
            !endDate
        ) {
            setMessage("Completá todos los campos obligatorios, incluida la ubicación completa.");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setMessage("La fecha de finalización no puede ser anterior a la fecha de inicio.");
            return;
        }

        const nextStatus = currentUserCanEditInstitutionalData
            ? status
            : EVENT_STATUS.PENDING;

        const invitationOptions = clubs.filter(entity =>
            !sameId(entity.id, event.proposedById || event.clubId || event.organizationId)
        );

        const invitedEntities = invitationOptions
            .filter(entity => invitedEntityIds.some(entityId => sameId(entity.id, entityId)))
            .map(entity => ({
                entityId: entity.id,
                entityName: entity.name,
                entityType: getEntityType(entity),
                role: "coorganizer",
                status:
                    event.invitedEntities?.find(invitation => sameId(invitation.entityId, entity.id))?.status ||
                    "pending"
            }));

        setMessage("");
        setIsSaving(true);

        try {
            const updatedEvent = await updateStoredEvent(event.id, {
                ...event,
                title: title.trim(),
                className: classNames[0],
                classNames,
                invitedEntities,

            country: country.trim(),
            countryCode,
            state: state.trim(),
            stateCode,
            city: resolvedCity,
            cityName: resolvedCityName,

            startDate,
            endDate,
            website: website.trim(),
            description: description.trim(),

            status: nextStatus,
            isOfficial: currentUserCanEditInstitutionalData ? isOfficial : false,

            source: currentUserCanEditInstitutionalData
                ? source.trim() || event.source || "Organización"
                : event.source || "Propuesta de club",
            sourceUrl: currentUserCanEditInstitutionalData
                ? sourceUrl.trim()
                : event.sourceUrl || "",
            organizationName: currentUserCanEditInstitutionalData
                ? organizationName.trim()
                : event.organizationName || "",
                organizingClubName: currentUserCanEditInstitutionalData
                    ? organizingClubName.trim()
                    : event.organizingClubName || "",
                updatedBy: currentUser?.id || event.updatedBy || event.createdBy || ""
            });

            navigate(`/calendar/${updatedEvent.id}`);
        } catch (error) {
            const errorText = String(error?.message || "").toLowerCase();

            setMessage(
                errorText.includes("row-level security") || error?.code === "42501"
                    ? "Tu cuenta no tiene permiso online para modificar este evento."
                    : "No se pudieron guardar los cambios online. El evento anterior se mantuvo sin modificaciones."
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() => navigate(`/calendar/${event.id}`)}
            >
                ← Volver al evento
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Editar evento</h1>

                    <p>
                        Modificá los datos del evento publicado en el calendario.
                    </p>

                    <p>
                        <strong>Ubicación actual:</strong>{" "}
                        {getLocationLabel(event)}
                    </p>
                </div>
            </div>

            <div className="detail-card">
                {!currentUserCanEditInstitutionalData && (
                    <p className="password-help">
                        Al editar esta propuesta, quedará pendiente de revisión por la organización responsable.
                    </p>
                )}

                {event.externalSource === "fay" && currentUserIsSuperadmin && (
                    <p className="password-help">
                        Este evento fue importado desde FAY. La edición queda guardada como corrección local de SailJobs.
                    </p>
                )}

                {club && (
                    <p>
                        <strong>Club vinculado:</strong>{" "}
                        {club.name}
                    </p>
                )}

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        Nombre del evento *
                    </label>

                    <input
                        type="text"
                        value={title}
                        onChange={(inputEvent) => setTitle(inputEvent.target.value)}
                    />

                    <SailingClassSelect
                        value={classNames}
                        onChange={setClassNames}
                        extraOptions={getEventClassNames(event)}
                    />

                    <label>
                        Entidades colaboradoras invitadas
                    </label>

                    <div className="entity-invitation-list">
                        {clubs
                            .filter(entity =>
                                !sameId(entity.id, event.proposedById || event.clubId || event.organizationId)
                            )
                            .map(entity => (
                                <label
                                    className="checkbox-row"
                                    key={entity.id}
                                >
                                    <input
                                        type="checkbox"
                                        checked={invitedEntityIds.some(entityId => sameId(entityId, entity.id))}
                                        onChange={() => {
                                            setInvitedEntityIds(currentIds =>
                                                currentIds.some(entityId => sameId(entityId, entity.id))
                                                    ? currentIds.filter(entityId => !sameId(entityId, entity.id))
                                                    : [...currentIds, entity.id]
                                            );
                                        }}
                                    />
                                    {entity.name}
                                </label>
                            ))}
                    </div>

                    <div className="section-header">
                        <h3>Ubicación</h3>

                        <button
                            type="button"
                            className="small-action-button"
                            onClick={() => setManualLocationMode(!manualLocationMode)}
                        >
                            {manualLocationMode
                                ? "Usar selector"
                                : "Editar manualmente"}
                        </button>
                    </div>

                    {manualLocationMode ? (
                        <>
                            <label>
                                País *
                            </label>

                            <input
                                type="text"
                                value={country}
                                onChange={(inputEvent) => setCountry(inputEvent.target.value)}
                                placeholder="Argentina"
                            />

                            <label>
                                Código de país
                            </label>

                            <input
                                type="text"
                                value={countryCode}
                                onChange={(inputEvent) => setCountryCode(inputEvent.target.value.toUpperCase())}
                                placeholder="AR"
                            />

                            <label>
                                Provincia / Estado *
                            </label>

                            <input
                                type="text"
                                value={state}
                                onChange={(inputEvent) => setState(inputEvent.target.value)}
                                placeholder="Santa Fe"
                            />

                            <label>
                                Código de provincia / estado
                            </label>

                            <input
                                type="text"
                                value={stateCode}
                                onChange={(inputEvent) => setStateCode(inputEvent.target.value.toUpperCase())}
                                placeholder="AR-S"
                            />

                            <label>
                                Ciudad / Localidad *
                            </label>

                            <input
                                type="text"
                                value={customCity}
                                onChange={(inputEvent) => setCustomCity(inputEvent.target.value)}
                                placeholder="Rosario"
                            />
                        </>
                    ) : (
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
                    )}

                    <label>
                        Fecha de inicio *
                    </label>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(inputEvent) => setStartDate(inputEvent.target.value)}
                    />

                    <label>
                        Fecha de finalización *
                    </label>

                    <input
                        type="date"
                        value={endDate}
                        onChange={(inputEvent) => setEndDate(inputEvent.target.value)}
                    />

                    <label>
                        Sitio web del evento
                    </label>

                    <input
                        type="url"
                        value={website}
                        onChange={(inputEvent) => setWebsite(inputEvent.target.value)}
                        placeholder="https://..."
                    />

                    <label>
                        Descripción
                    </label>

                    <textarea
                        rows="5"
                        value={description}
                        onChange={(inputEvent) => setDescription(inputEvent.target.value)}
                    />

                    {currentUserCanEditInstitutionalData && (
                        <>
                            <div className="section-header">
                                <h3>Moderación</h3>
                            </div>

                            <label>
                                Estado
                            </label>

                            <select
                                value={status}
                                onChange={(inputEvent) => setStatus(inputEvent.target.value)}
                            >
                                {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
                                    <option
                                        key={value}
                                        value={value}
                                    >
                                        {label}
                                    </option>
                                ))}
                            </select>

                            <label className="checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={isOfficial}
                                    onChange={(inputEvent) => setIsOfficial(inputEvent.target.checked)}
                                />
                                Marcar como evento oficial
                            </label>

                            <label>
                                Fuente
                            </label>

                            <input
                                type="text"
                                value={source}
                                onChange={(inputEvent) => setSource(inputEvent.target.value)}
                                placeholder="FAY, Club, Asociación de clase..."
                            />

                            <label>
                                URL de fuente
                            </label>

                            <input
                                type="url"
                                value={sourceUrl}
                                onChange={(inputEvent) => setSourceUrl(inputEvent.target.value)}
                                placeholder="https://..."
                            />

                            <label>
                                Organización responsable
                            </label>

                            <input
                                type="text"
                                value={organizationName}
                                onChange={(inputEvent) => setOrganizationName(inputEvent.target.value)}
                                placeholder="Federación Argentina de Yachting"
                            />

                            <label>
                                Club / sede indicada
                            </label>

                            <input
                                type="text"
                                value={organizingClubName}
                                onChange={(inputEvent) => setOrganizingClubName(inputEvent.target.value)}
                                placeholder="CNO, CVR, CNSI..."
                            />
                        </>
                    )}

                    {message && (
                        <p style={{ color: "#b42318" }}>
                            {message}
                        </p>
                    )}

                    <div className="dashboard-actions">
                        <button
                            type="button"
                            className="reject-button"
                            onClick={() => navigate(`/calendar/${event.id}`)}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="accept-button"
                            disabled={isSaving}
                        >
                            {isSaving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditEvent;
