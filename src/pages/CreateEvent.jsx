import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import staticClubs from "../data/clubs";
import {
    getAllClubs,
    getEntityType,
    syncEntitiesFromSupabase
} from "../utils/clubsStorage";
import { getCurrentUser } from "../utils/authStorage";
import { isSuperadmin } from "../utils/permissions";
import { sameId } from "../utils/idUtils";
import { EVENT_STATUS } from "../config/appConfig";
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

    if (!resolvedCity) return "";

    return stateValue
        ? `${resolvedCity}, ${stateValue}`
        : resolvedCity;
}

function getEventSaveErrorMessage(error) {
    const code = String(error?.code || "");
    const detail = String(error?.message || "").trim();
    const normalizedDetail = detail.toLowerCase();

    if (code === "42501" || normalizedDetail.includes("row-level security")) {
        return "La cuenta no tiene permiso online para publicar eventos. Verificá que la migración de calendario administrado esté aplicada.";
    }

    if (code === "22P02" && normalizedDetail.includes("uuid")) {
        return "La base rechazó el identificador del organizador. Volvé a seleccionarlo e intentá nuevamente.";
    }

    if (code === "42703") {
        return "Falta actualizar la estructura de eventos en Supabase.";
    }

    const technicalDetail = [code && `[${code}]`, detail]
        .filter(Boolean)
        .join(" ");

    return technicalDetail
        ? `No se pudo guardar el evento online. Detalle: ${technicalDetail}`
        : "No se pudo guardar el evento online. Revisá la conexión e intentá nuevamente.";
}

function CreateEvent() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [entities, setEntities] = useState(() => getAllClubs(staticClubs));
    const [organizerEntityId, setOrganizerEntityId] = useState("");
    const [title, setTitle] = useState("");
    const [classNames, setClassNames] = useState([]);
    const [country, setCountry] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [state, setState] = useState("");
    const [stateCode, setStateCode] = useState("");
    const [city, setCity] = useState("");
    const [customCity, setCustomCity] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [website, setWebsite] = useState("");
    const [source, setSource] = useState("FAY");
    const [sourceUrl, setSourceUrl] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadEntities() {
            try {
                const syncedEntities = await syncEntitiesFromSupabase(staticClubs);
                if (isMounted) setEntities(syncedEntities);
            } catch {
                if (isMounted) setEntities(getAllClubs(staticClubs));
            }
        }

        loadEntities();

        return () => {
            isMounted = false;
        };
    }, []);

    const organizerOptions = [...entities]
        .filter(entity => entity?.id)
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const organizer = organizerOptions.find(entity =>
        sameId(entity.id, organizerEntityId)
    );

    if (!currentUser || !isSuperadmin(currentUser)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>
                <p>Solo el superadministrador puede cargar eventos en el calendario.</p>
                <button className="back-button" onClick={() => navigate("/calendar")}>
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

        if (
            !organizer ||
            !title.trim() ||
            classNames.length === 0 ||
            !country ||
            !state ||
            !resolvedCity ||
            !startDate ||
            !endDate
        ) {
            setMessage("Completá todos los campos obligatorios, incluido el organizador y la ubicación completa.");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setMessage("La fecha de finalización no puede ser anterior a la fecha de inicio.");
            return;
        }

        const organizerType = getEntityType(organizer);
        const organizerIsOrganization = organizerType === "organization";

        setMessage("");
        setIsSubmitting(true);

        try {
            await createStoredEvent({
                title: title.trim(),
                className: classNames[0],
                classNames,
                organizerEntities: [{
                    entityId: organizer.id,
                    entityName: organizer.name,
                    entityType: organizerType,
                    role: "organizer",
                    status: "accepted"
                }],
                invitedEntities: [],
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
                source: source.trim() || "FAY",
                sourceUrl: sourceUrl.trim(),
                clubId: organizerIsOrganization ? "" : organizer.id,
                organizerType,
                proposedByType: organizerType,
                proposedById: organizer.id,
                proposedByName: organizer.name,
                organizingClubName: organizerIsOrganization ? "" : organizer.name,
                ownerType: organizerType,
                ownerId: organizer.id,
                ownerName: organizer.name,
                organizationId: organizerIsOrganization ? organizer.id : "",
                organizationName: organizerIsOrganization ? organizer.name : "",
                reviewingOrganizationId: organizerIsOrganization ? organizer.id : "",
                reviewingOrganizationName: organizerIsOrganization ? organizer.name : "",
                status: EVENT_STATUS.APPROVED,
                isOfficial: true,
                createdBy: currentUser.id,
                updatedBy: currentUser.id,
                reviewedBy: currentUser.id,
                reviewedAt: new Date().toISOString()
            });

            navigate("/admin/events");
        } catch (error) {
            setMessage(getEventSaveErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="dashboard-page">
            <button className="back-button" onClick={() => navigate("/admin/events")}>
                ← Volver a eventos
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Publicar evento oficial</h1>
                    <p>
                        El calendario de SailJobs es administrado por el superadmin con información autorizada y fuentes oficiales.
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>Club u organización responsable *</label>
                    <select
                        value={organizerEntityId}
                        onChange={inputEvent => setOrganizerEntityId(inputEvent.target.value)}
                    >
                        <option value="">Seleccionar entidad</option>
                        {organizerOptions.map(entity => (
                            <option key={entity.id} value={entity.id}>
                                {entity.name}
                            </option>
                        ))}
                    </select>

                    <label>Nombre del evento *</label>
                    <input
                        type="text"
                        placeholder="Ej: Campeonato Argentino ILCA"
                        value={title}
                        onChange={inputEvent => setTitle(inputEvent.target.value)}
                    />

                    <SailingClassSelect value={classNames} onChange={setClassNames} />

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

                    <label>Fecha de inicio *</label>
                    <input type="date" value={startDate} onChange={inputEvent => setStartDate(inputEvent.target.value)} />

                    <label>Fecha de finalización *</label>
                    <input type="date" value={endDate} onChange={inputEvent => setEndDate(inputEvent.target.value)} />

                    <label>Sitio web del evento</label>
                    <input type="url" placeholder="https://..." value={website} onChange={inputEvent => setWebsite(inputEvent.target.value)} />

                    <label>Fuente oficial</label>
                    <input type="text" placeholder="FAY" value={source} onChange={inputEvent => setSource(inputEvent.target.value)} />

                    <label>Enlace a la fuente oficial</label>
                    <input type="url" placeholder="https://fay.org/..." value={sourceUrl} onChange={inputEvent => setSourceUrl(inputEvent.target.value)} />

                    <label>Descripción</label>
                    <textarea
                        rows="5"
                        placeholder="Información relevante del evento, sede, formato, etc."
                        value={description}
                        onChange={inputEvent => setDescription(inputEvent.target.value)}
                    />

                    {message && <p style={{ color: "#b42318" }}>{message}</p>}

                    <div className="dashboard-actions">
                        <button type="button" className="reject-button" onClick={() => navigate("/admin/events")}>
                            Cancelar
                        </button>
                        <button className="accept-button" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Publicar evento"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEvent;
