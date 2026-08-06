import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getEntityType,
    isOrganizationEntity,
    syncEntitiesFromSupabase
} from "../utils/clubsStorage";

import { getCurrentUser } from "../utils/authStorage";
import {
    canManageClub,
    canManageOrganization,
    isOrganizationAdmin
} from "../utils/permissions";
import { sameId } from "../utils/idUtils";

import {
    EVENT_STATUS
} from "../config/appConfig";

import LocationSelects, {
    CUSTOM_CITY_VALUE
} from "../components/LocationSelects";
import SailingClassSelect from "../components/SailingClassSelect";

import { createStoredEvent } from "../utils/eventsStorage";

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

function getCurrentUserEntity(currentUser) {
    if (!currentUser?.entityId && !currentUser?.organizationId && !currentUser?.clubId) {
        return null;
    }

    const entityType =
        currentUser.entityType ||
        (currentUser.organizationId ? "organization" : "club");

    return {
        id:
            currentUser.entityId ||
            currentUser.organizationId ||
            currentUser.clubId,
        name:
            currentUser.entityName ||
            currentUser.organizationName ||
            currentUser.clubName ||
            currentUser.name ||
            "Mi entidad",
        entityType,
        organizationType: currentUser.organizationType || "other",
        country: currentUser.country || "",
        city: currentUser.city || ""
    };
}

function uniqueById(entities) {
    const result = [];

    entities.forEach(entity => {
        if (!entity?.id) return;

        if (!result.some(item => sameId(item.id, entity.id))) {
            result.push(entity);
        }
    });

    return result;
}

function CreateEvent() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();
    const currentUserIsOrganization = isOrganizationAdmin(currentUser);

    const [entities, setEntities] = useState(() => getAllClubs(staticClubs));
    const currentUserEntity = getCurrentUserEntity(currentUser);

    useEffect(() => {
        let isMounted = true;

        async function loadEntities() {
            try {
                const syncedEntities = await syncEntitiesFromSupabase(staticClubs);

                if (isMounted) {
                    setEntities(syncedEntities);
                }
            } catch {
                if (isMounted) {
                    setEntities(getAllClubs(staticClubs));
                }
            }
        }

        loadEntities();

        return () => {
            isMounted = false;
        };
    }, []);

    const entitiesWithCurrentUser = uniqueById([
        ...entities,
        currentUserEntity
    ].filter(Boolean));

    const routeEntity = clubId
        ? entitiesWithCurrentUser.find(entity => sameId(entity.id, clubId))
        : null;

    const targetEntity = routeEntity || (
        currentUserIsOrganization
            ? currentUserEntity
            : null
    );

    const targetEntityType = getEntityType(targetEntity);
    const targetIsOrganization = targetEntityType === "organization";
    const targetIsClub = targetEntityType === "club";

    const organizationOptions = entitiesWithCurrentUser
        .filter(entity => isOrganizationEntity(entity))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const defaultReviewingOrganizationId =
        organizationOptions.find(entity =>
            entity.name.toLowerCase().includes("federación argentina") ||
            entity.name.toLowerCase().includes("fay")
        )?.id ||
        organizationOptions[0]?.id ||
        "";

    const [title, setTitle] = useState("");
    const [classNames, setClassNames] = useState([]);
    const [invitedEntityIds, setInvitedEntityIds] = useState([]);

    const [country, setCountry] = useState("");
    const [countryCode, setCountryCode] = useState("");

    const [state, setState] = useState("");
    const [stateCode, setStateCode] = useState("");

    const [city, setCity] = useState("");
    const [customCity, setCustomCity] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [website, setWebsite] = useState("");
    const [description, setDescription] = useState("");
    const [reviewingOrganizationId, setReviewingOrganizationId] = useState(defaultReviewingOrganizationId);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invitationOptions = entitiesWithCurrentUser
        .filter(entity => !sameId(entity.id, targetEntity?.id))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

    function toggleInvitedEntity(entityId) {
        setInvitedEntityIds(currentIds =>
            currentIds.some(id => sameId(id, entityId))
                ? currentIds.filter(id => !sameId(id, entityId))
                : [...currentIds, entityId]
        );
    }

    const userCanAccess =
        targetEntity &&
        (
            targetIsOrganization
                ? canManageOrganization(currentUser, targetEntity.id)
                : canManageClub(currentUser, targetEntity.id)
        );

    if (!targetEntity || !userCanAccess) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    No tenés permiso para crear eventos desde esta cuenta.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/calendar")}
                >
                    ← Volver al calendario
                </button>
            </div>
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const resolvedCity = getResolvedCity(city, customCity, state);

        const resolvedCityName =
            city === CUSTOM_CITY_VALUE || !city
                ? customCity.trim()
                : city.trim();

        const reviewingOrganization = organizationOptions.find(entity =>
            sameId(entity.id, reviewingOrganizationId)
        );

        if (
            !title.trim() ||
            classNames.length === 0 ||
            !country ||
            !state ||
            !resolvedCity ||
            !startDate ||
            !endDate
        ) {
            setMessage("Completá todos los campos obligatorios, incluida la ubicación completa.");
            return;
        }

        if (targetIsClub && !reviewingOrganization) {
            setMessage("Seleccioná la organización que debe revisar la propuesta.");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setMessage("La fecha de finalización no puede ser anterior a la fecha de inicio.");
            return;
        }

        const invitedEntities = invitationOptions
            .filter(entity => invitedEntityIds.some(id => sameId(id, entity.id)))
            .map(entity => ({
                entityId: entity.id,
                entityName: entity.name,
                entityType: getEntityType(entity),
                role: "coorganizer",
                status: "pending"
            }));

        const baseEventData = {
            title: title.trim(),
            className: classNames[0],
            classNames,
            organizerEntities: [{
                entityId: targetEntity.id,
                entityName: targetEntity.name,
                entityType: targetEntityType,
                role: "organizer",
                status: "accepted"
            }],
            invitedEntities,

            country,
            countryCode,
            state,
            stateCode,
            city: resolvedCity,
            cityName: resolvedCityName,

            startDate,
            endDate,
            website: website.trim(),
            description: description.trim(),
            sourceUrl: "",
            createdBy: currentUser?.id || "",
            updatedBy: currentUser?.id || ""
        };

        setMessage("");
        setIsSubmitting(true);

        try {
            if (targetIsOrganization) {
                await createStoredEvent({
                ...baseEventData,
                clubId: "",
                organizerType: "organization",
                proposedByType: "organization",
                proposedById: targetEntity.id,
                proposedByName: targetEntity.name,
                ownerType: "organization",
                ownerId: targetEntity.id,
                ownerName: targetEntity.name,
                organizationId: targetEntity.id,
                organizationName: targetEntity.name,
                reviewingOrganizationId: targetEntity.id,
                reviewingOrganizationName: targetEntity.name,
                organizingClubName: "",
                source: targetEntity.name,
                status: EVENT_STATUS.APPROVED,
                isOfficial: true,
                reviewedBy: currentUser?.name || currentUser?.email || "Organización",
                reviewedAt: new Date().toISOString()
                });

                navigate("/organization-admin");
                return;
            }

            await createStoredEvent({
                ...baseEventData,
                clubId: targetEntity.id,
                organizerType: "club",
                proposedByType: "club",
                proposedById: targetEntity.id,
                proposedByName: targetEntity.name,
                organizingClubName: targetEntity.name,
                reviewingOrganizationId: reviewingOrganization.id,
                reviewingOrganizationName: reviewingOrganization.name,
                ownerType: "organization",
                ownerId: reviewingOrganization.id,
                ownerName: reviewingOrganization.name,
                organizationId: reviewingOrganization.id,
                organizationName: reviewingOrganization.name,
                source: "Propuesta de club",
                status: EVENT_STATUS.PENDING,
                isOfficial: false
            });

            navigate(`/club-dashboard/${targetEntity.id}`);
        } catch (error) {
            const errorText = String(error?.message || "").toLowerCase();

            setMessage(
                errorText.includes("row-level security") || error?.code === "42501"
                    ? "Tu cuenta no tiene permiso online para publicar este evento. Revisá que la migración de eventos y permisos esté aplicada."
                    : "No se pudo guardar el evento online. No se publicó ningún dato; revisá la conexión e intentá nuevamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() => navigate(targetIsOrganization ? "/organization-admin" : `/club-dashboard/${targetEntity.id}`)}
            >
                ← Volver al panel
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>
                        {targetIsOrganization
                            ? "Publicar evento"
                            : "Proponer evento"}
                    </h1>

                    <p>
                        {targetIsOrganization
                            ? `Cargá un evento desde ${targetEntity.name}. Al ser publicado por una organización, aparecerá directamente en el calendario.`
                            : `Cargá una propuesta para ${targetEntity.name}. La organización revisora deberá aprobarla antes de que aparezca en el calendario.`}
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        Nombre del evento *
                    </label>

                    <input
                        type="text"
                        placeholder="Ej: Campeonato Argentino ILCA"
                        value={title}
                        onChange={(inputEvent) => setTitle(inputEvent.target.value)}
                    />

                    <SailingClassSelect
                        value={classNames}
                        onChange={setClassNames}
                    />

                    {targetIsClub && (
                        <>
                            <label>
                                Organización revisora *
                            </label>

                            <select
                                value={reviewingOrganizationId}
                                onChange={(inputEvent) => setReviewingOrganizationId(inputEvent.target.value)}
                            >
                                <option value="">
                                    Seleccionar organización
                                </option>

                                {organizationOptions.map(organization => (
                                    <option
                                        key={organization.id}
                                        value={organization.id}
                                    >
                                        {organization.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <label>
                        Invitar entidades colaboradoras
                    </label>

                    <div className="entity-invitation-list">
                        {invitationOptions.length === 0 && (
                            <p className="password-help">
                                No hay otras entidades disponibles para invitar.
                            </p>
                        )}

                        {invitationOptions.map(entity => (
                            <label
                                className="checkbox-row"
                                key={entity.id}
                            >
                                <input
                                    type="checkbox"
                                    checked={invitedEntityIds.some(id => sameId(id, entity.id))}
                                    onChange={() => toggleInvitedEntity(entity.id)}
                                />
                                {entity.name}
                            </label>
                        ))}
                    </div>

                    <p className="password-help">
                        Las entidades seleccionadas quedarán registradas como invitadas a colaborar en la organización.
                    </p>

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
                        placeholder="https://..."
                        value={website}
                        onChange={(inputEvent) => setWebsite(inputEvent.target.value)}
                    />

                    <label>
                        Descripción
                    </label>

                    <textarea
                        rows="5"
                        placeholder="Información relevante del evento, sede, formato, inscripción, etc."
                        value={description}
                        onChange={(inputEvent) => setDescription(inputEvent.target.value)}
                    />

                    {message && (
                        <p style={{ color: "#b42318" }}>
                            {message}
                        </p>
                    )}

                    <div className="dashboard-actions">
                        <button
                            type="button"
                            className="reject-button"
                            onClick={() => navigate(targetIsOrganization ? "/organization-admin" : `/club-dashboard/${targetEntity.id}`)}
                        >
                            Cancelar
                        </button>

                        <button
                            className="accept-button"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Guardando..."
                                : targetIsOrganization
                                ? "Publicar evento"
                                : "Enviar evento a revisión"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEvent;
