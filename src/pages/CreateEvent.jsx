import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import staticClubs from "../data/clubs";
import { getAllClubs } from "../utils/clubsStorage";

import { getCurrentUser } from "../utils/authStorage";
import { canManageClub } from "../utils/permissions";
import { sameId } from "../utils/idUtils";
import {
    SAILING_CLASSES,
    COUNTRIES
} from "../config/appConfig";

import { createStoredEvent } from "../utils/eventsStorage";

function CreateEvent() {

    const { clubId } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const clubs = getAllClubs(staticClubs);

    const club = clubs.find(
        c => sameId(c.id, clubId)
    );

    const [title, setTitle] = useState("");
    const [className, setClassName] = useState("");
    const [country, setCountry] = useState(club ? club.country : "");
    const [city, setCity] = useState(club ? club.city : "");
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

    function handleSubmit(e) {
        e.preventDefault();

        if (!title || !className || !country || !city || !startDate || !endDate) {
            setMessage("Completá todos los campos obligatorios.");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setMessage("La fecha de finalización no puede ser anterior a la fecha de inicio.");
            return;
        }

        createStoredEvent({
            title,
            clubId: club.id,
            className,
            country,
            city,
            startDate,
            endDate,
            website,
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

            <h1>Proponer evento</h1>

            <p>
                Cargá un evento para {club.name}. El evento quedará pendiente hasta ser aprobado.
            </p>

            <div className="detail-card">

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <input
                        type="text"
                        placeholder="Nombre del evento *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <select
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                    >
                        <option value="">
                            Seleccionar clase *
                        </option>

                        {SAILING_CLASSES.map((classOption) => (
                            <option
                                key={classOption}
                                value={classOption}
                            >
                                {classOption}
                            </option>
                        ))}
                    </select>

                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    >
                        <option value="">
                            Seleccionar país *
                        </option>

                        {COUNTRIES.map((countryOption) => (
                            <option
                                key={countryOption}
                                value={countryOption}
                            >
                                {countryOption}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Ciudad *"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />

                    <label>
                        Fecha de inicio *
                    </label>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />

                    <label>
                        Fecha de finalización *
                    </label>

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />

                    <input
                        type="url"
                        placeholder="Sitio web del evento"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                    />

                    {message && (
                        <p>
                            {message}
                        </p>
                    )}

                    <button
                        className="apply-button"
                        type="submit"
                    >
                        Enviar evento a revisión
                    </button>

                </form>

            </div>

        </div>

    );
}

export default CreateEvent;