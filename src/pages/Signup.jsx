import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    COUNTRIES
} from "../config/appConfig";

import {
    signup,
    hasProfessionalProfile
} from "../utils/authStorage";

function Signup() {
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState("professional");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [clubName, setClubName] = useState("");
    const [clubCountry, setClubCountry] = useState("");
    const [clubCity, setClubCity] = useState("");
    const [clubDescription, setClubDescription] = useState("");
    const [clubWebsite, setClubWebsite] = useState("");
    const [clubLogo, setClubLogo] = useState("");

    const [formMessage, setFormMessage] = useState("");

    function handleClubLogoChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setClubLogo(reader.result);
        };

        reader.readAsDataURL(file);
    }

    function validateForm() {
        if (!name.trim() || !email.trim() || !password.trim()) {
            setFormMessage("Completá nombre, email y contraseña.");
            return false;
        }

        if (accountType === "club") {
            if (!clubName.trim() || !clubCountry || !clubCity.trim()) {
                setFormMessage(
                    "Para una cuenta de organización, completá nombre, país y ciudad."
                );

                return false;
            }
        }

        return true;
    }

    function handleSubmit(event) {
        event.preventDefault();

        setFormMessage("");

        if (!validateForm()) {
            return;
        }

        try {
            const createdUser = signup({
                name: name.trim(),
                email: email.trim(),
                password,
                accountType,

                clubName: clubName.trim(),
                clubCountry,
                clubCity: clubCity.trim(),
                clubDescription: clubDescription.trim(),
                clubWebsite: clubWebsite.trim(),
                clubLogo
            });

            if (createdUser.role === "club") {
                navigate(`/club-dashboard/${createdUser.clubId}`);
                return;
            }

            if (hasProfessionalProfile(createdUser)) {
                navigate("/coach-dashboard");
                return;
            }

            navigate("/user-dashboard");
        } catch (error) {
            setFormMessage(
                error.message || "No se pudo crear la cuenta."
            );
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Crear cuenta</h1>

                <p>
                    Elegí cómo querés participar en SailJobs LATAM.
                    Una misma cuenta personal puede tener perfil general y
                    perfil profesional náutico.
                </p>

                <form onSubmit={handleSubmit}>
                    <label>Tipo de cuenta</label>

                    <div className="account-type-grid">
                        <button
                            type="button"
                            className={
                                accountType === "professional"
                                    ? "account-type-card selected"
                                    : "account-type-card"
                            }
                            onClick={() => setAccountType("professional")}
                        >
                            <strong>Perfil profesional náutico</strong>

                            <span>
                                Para postularte a trabajos, cargos técnicos,
                                coaching, race management, jurados, medidores
                                u otras oportunidades profesionales.
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                accountType === "user"
                                    ? "account-type-card selected"
                                    : "account-type-card"
                            }
                            onClick={() => setAccountType("user")}
                        >
                            <strong>Cuenta personal</strong>

                            <span>
                                Para publicar clasificados, participar en
                                voluntariados, seguir eventos y activar más
                                adelante tu perfil profesional.
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                accountType === "club"
                                    ? "account-type-card selected"
                                    : "account-type-card"
                            }
                            onClick={() => setAccountType("club")}
                        >
                            <strong>Club / organización</strong>

                            <span>
                                Para publicar oportunidades, convocatorias,
                                eventos y revisar postulaciones.
                            </span>
                        </button>
                    </div>

                    <label>Nombre</label>

                    <input
                        type="text"
                        placeholder={
                            accountType === "club"
                                ? "Nombre de la persona responsable"
                                : "Tu nombre completo"
                        }
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <label>Contraseña</label>

                    <input
                        type="password"
                        placeholder="Mínimo 8 caracteres, con letras y números"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />

                    <p className="password-help">
                        La contraseña debe tener al menos 8 caracteres, una
                        letra y un número.
                    </p>

                    {accountType === "club" && (
                        <>
                            <hr />

                            <h2>Datos de la organización</h2>

                            <label>Nombre del club / organización</label>

                            <input
                                type="text"
                                placeholder="Ejemplo: Club de Velas Rosario"
                                value={clubName}
                                onChange={(event) => setClubName(event.target.value)}
                            />

                            <label>País</label>

                            <select
                                value={clubCountry}
                                onChange={(event) => setClubCountry(event.target.value)}
                            >
                                <option value="">
                                    Seleccionar país
                                </option>

                                {COUNTRIES.map(countryOption => (
                                    <option
                                        key={countryOption}
                                        value={countryOption}
                                    >
                                        {countryOption}
                                    </option>
                                ))}
                            </select>

                            <label>Ciudad</label>

                            <input
                                type="text"
                                placeholder="Ciudad"
                                value={clubCity}
                                onChange={(event) => setClubCity(event.target.value)}
                            />

                            <label>Descripción</label>

                            <textarea
                                rows="4"
                                placeholder="Contá brevemente qué tipo de organización es."
                                value={clubDescription}
                                onChange={(event) => setClubDescription(event.target.value)}
                            />

                            <label>Sitio web</label>

                            <input
                                type="url"
                                placeholder="https://..."
                                value={clubWebsite}
                                onChange={(event) => setClubWebsite(event.target.value)}
                            />

                            <label>Logo</label>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleClubLogoChange}
                            />

                            {clubLogo && (
                                <img
                                    src={clubLogo}
                                    alt="Logo de la organización"
                                    className="club-mini-logo"
                                />
                            )}
                        </>
                    )}

                    {formMessage && (
                        <p style={{ color: "#b42318" }}>
                            {formMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="accept-button"
                    >
                        Crear cuenta
                    </button>
                </form>

                <p>
                    ¿Ya tenés cuenta?{" "}

                    <span
                        className="detail-link"
                        onClick={() => navigate("/login")}
                    >
                        Iniciar sesión
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Signup;