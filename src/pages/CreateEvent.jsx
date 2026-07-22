import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import { getCurrentUser } from "../utils/authStorage";
import { canManageClub } from "../utils/permissions";
import { sameId } from "../utils/idUtils";

import {
    SAILING_CLASSES
} from "../config/appConfig";

import LocationSelects, {
    CUSTOM_CITY_VALUE
} from "../components/LocationSelects";

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

function CreateEvent() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const clubs = getAllClubs(staticClubs);

    const clubFromLocalData = clubs.find(
        club => sameId(club.id, clubId)
    );

    const clubFromCurrentUser =
        currentUser && sameId(currentUser.clubId, clubId)
            ? {
                id: currentUser.clubId,
                name: currentUser.clubName || currentUser.name || "Mi organización",
                country: currentUser.country || "",
                city: currentUser.city || ""
            }
            : null;

    const club =
        clubFromLocalData ||
        clubFromCurrentUser;

    const [title, setTitle] = useState("");
    const [className, setClassName] = useState("");

    const [country, setCountry] = useState("");
    const [countryCode, setCountryCode] = useState("");

    const [state, setState] = useState("");
    const [stateCode, setStateCode] = useState("");

    const [city, setCity] = useState("");
    const [customCity, setCustomCity] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [website, setWebsite] = useState("");
    const [message, setMessage] = useState("");

    if (!canManageClub(currentUser, clubId)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    No tenés permiso para proponer eventos para este club.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/clubs")}
                >
                    ← Volver a clubes
                </button>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="dashboard-page">
                <h1>Club no encontrado</h1>

                <button
                    className="back-button"
                    onClick={() => navigate("/clubs")}
                >
                    ← Volver a clubes
                </button>
            </div>
        );
    }

    function handleSubmit(event) {
        event.preventDefault();

        const resolvedCity =
            getResolvedCity(
                city,
                customCity,
                state
            );

        if (
            !title.trim() ||
            !className ||
            !country ||
            !state ||
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

        createStoredEvent({
            title: title.trim(),
            clubId: club.id,
            className,

            country,
            countryCode,
            state,
            stateCode,
            city: resolvedCity,
            cityName:
                city === CUSTOM_CITY_VALUE || !city
                    ? customCity.trim()
                    : city.trim(),

            startDate,
            endDate,
            website: website.trim(),
            source: "Club",
            sourceUrl: "",
            status: "pending",
            isOfficial: false
        });

        navigate(`/club-dashboard/${club.id}`);
    }

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() => navigate(`/club-dashboard/${club.id}`)}
            >
                ← Volver al panel
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Proponer evento</h1>

                    <p>
                        Cargá un evento para {club.name}. El evento quedará pendiente hasta ser aprobado.
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
                        onChange={(event) => setTitle(event.target.value)}
                    />

                    <label>
                        Clase *
                    </label>

                    <select
                        value={className}
                        onChange={(event) => setClassName(event.target.value)}
                    >
                        <option value="">
                            Seleccionar clase *
                        </option>

                        {SAILING_CLASSES.map(classOption => (
                            <option
                                key={classOption}
                                value={classOption}
                            >
                                {classOption}
                            </option>
                        ))}
                    </select>

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
                        onChange={(event) => setStartDate(event.target.value)}
                    />

                    <label>
                        Fecha de finalización *
                    </label>

                    <input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />

                    <label>
                        Sitio web del evento
                    </label>

                    <input
                        type="url"
                        placeholder="https://..."
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
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
                            onClick={() => navigate(`/club-dashboard/${club.id}`)}
                        >
                            Cancelar
                        </button>

                        <button
                            className="accept-button"
                            type="submit"
                        >
                            Enviar evento a revisión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEvent;
