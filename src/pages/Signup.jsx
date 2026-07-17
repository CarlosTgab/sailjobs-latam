import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    COUNTRIES
} from "../config/appConfig";

import {
    registerWithSupabase
} from "../utils/supabaseAuth";

import {
    normalizeUserRole
} from "../utils/permissions";

function getRedirectPath(user) {
    const role =
        normalizeUserRole(user);

    if (role === "club" && user.clubId) {
        return `/club-dashboard/${user.clubId}`;
    }

    if (role === "organization_admin") {
        return "/organization-admin";
    }

    return "/profile";
}

function Signup() {
    const navigate =
        useNavigate();

    const [
        accountType,
        setAccountType
    ] = useState("professional");

    const [
        name,
        setName
    ] = useState("");

    const [
        email,
        setEmail
    ] = useState("");

    const [
        password,
        setPassword
    ] = useState("");

    const [
        phone,
        setPhone
    ] = useState("");

    const [
        city,
        setCity
    ] = useState("");

    const [
        country,
        setCountry
    ] = useState("");

    const [
        professionalTitle,
        setProfessionalTitle
    ] = useState("");

    const [
        professionalSummary,
        setProfessionalSummary
    ] = useState("");

    const [
        clubName,
        setClubName
    ] = useState("");

    const [
        clubCity,
        setClubCity
    ] = useState("");

    const [
        clubCountry,
        setClubCountry
    ] = useState("");

    const [
        clubDescription,
        setClubDescription
    ] = useState("");

    const [
        clubWebsite,
        setClubWebsite
    ] = useState("");

    const [
        formMessage,
        setFormMessage
    ] = useState("");

    const [
        loading,
        setLoading
    ] = useState(false);

    const isProfessional =
        accountType === "professional";

    const isClub =
        accountType === "club";

    async function handleSubmit(event) {
        event.preventDefault();

        setFormMessage("");
        setLoading(true);

        try {
            const user =
                await registerWithSupabase({
                    accountType,
                    name,
                    email,
                    password,
                    phone,
                    city,
                    country,
                    professionalTitle,
                    professionalSummary,
                    clubName,
                    clubCity,
                    clubCountry,
                    clubDescription,
                    clubWebsite
                });

            navigate(
                getRedirectPath(user)
            );
        } catch (error) {
            setFormMessage(
                error.message ||
                "No se pudo crear la cuenta."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-card">

                <h1>Crear cuenta</h1>

                <p>
                    Elegí cómo querés usar SailJobs LATAM.
                </p>

                <div className="account-type-grid">

                    <button
                        type="button"
                        className={
                            accountType === "professional"
                                ? "account-type-card selected"
                                : "account-type-card"
                        }
                        onClick={() =>
                            setAccountType("professional")
                        }
                    >
                        <strong>
                            Perfil profesional náutico
                        </strong>

                        <span>
                            Para entrenadores, oficiales,
                            jurados, medidores, instructores
                            y otros perfiles técnicos.
                        </span>
                    </button>

                    <button
                        type="button"
                        className={
                            accountType === "user"
                                ? "account-type-card selected"
                                : "account-type-card"
                        }
                        onClick={() =>
                            setAccountType("user")
                        }
                    >
                        <strong>
                            Cuenta personal
                        </strong>

                        <span>
                            Para navegar oportunidades,
                            clasificados, eventos y activar
                            un perfil profesional más adelante.
                        </span>
                    </button>

                    <button
                        type="button"
                        className={
                            accountType === "club"
                                ? "account-type-card selected"
                                : "account-type-card"
                        }
                        onClick={() =>
                            setAccountType("club")
                        }
                    >
                        <strong>
                            Club / organización
                        </strong>

                        <span>
                            Para publicar oportunidades,
                            campeonatos y administrar
                            postulaciones.
                        </span>
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    <label>
                        Nombre completo
                    </label>

                    <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                            setName(
                                event.target.value
                            )
                        }
                        placeholder="Tu nombre"
                    />

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value
                            )
                        }
                        placeholder="tu@email.com"
                    />

                    <label>
                        Contraseña
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        placeholder="Mínimo 8 caracteres, una letra y un número"
                    />

                    <p className="password-help">
                        La contraseña debe tener al menos 8 caracteres,
                        una letra y un número.
                    </p>

                    <label>
                        Teléfono / WhatsApp
                    </label>

                    <input
                        type="text"
                        value={phone}
                        onChange={(event) =>
                            setPhone(
                                event.target.value
                            )
                        }
                        placeholder="Opcional"
                    />

                    <label>
                        Ciudad
                    </label>

                    <input
                        type="text"
                        value={city}
                        onChange={(event) =>
                            setCity(
                                event.target.value
                            )
                        }
                        placeholder="Rosario, Buenos Aires, Montevideo..."
                    />

                    <label>
                        País
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

                        {COUNTRIES.map(countryOption => (
                            <option
                                key={countryOption}
                                value={countryOption}
                            >
                                {countryOption}
                            </option>
                        ))}
                    </select>

                    {isProfessional && (
                        <>
                            <label>
                                Título profesional
                            </label>

                            <input
                                type="text"
                                value={professionalTitle}
                                onChange={(event) =>
                                    setProfessionalTitle(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej: Coach ILCA / Race Officer / Instructor"
                            />

                            <label>
                                Resumen profesional
                            </label>

                            <textarea
                                rows="5"
                                value={professionalSummary}
                                onChange={(event) =>
                                    setProfessionalSummary(
                                        event.target.value
                                    )
                                }
                                placeholder="Contá brevemente tu experiencia náutica."
                            />
                        </>
                    )}

                    {isClub && (
                        <>
                            <hr />

                            <h2>
                                Datos del club / organización
                            </h2>

                            <label>
                                Nombre del club / organización
                            </label>

                            <input
                                type="text"
                                value={clubName}
                                onChange={(event) =>
                                    setClubName(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej: Club de Velas Rosario"
                            />

                            <label>
                                Ciudad del club
                            </label>

                            <input
                                type="text"
                                value={clubCity}
                                onChange={(event) =>
                                    setClubCity(
                                        event.target.value
                                    )
                                }
                                placeholder="Ciudad"
                            />

                            <label>
                                País del club
                            </label>

                            <select
                                value={clubCountry}
                                onChange={(event) =>
                                    setClubCountry(
                                        event.target.value
                                    )
                                }
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

                            <label>
                                Sitio web
                            </label>

                            <input
                                type="url"
                                value={clubWebsite}
                                onChange={(event) =>
                                    setClubWebsite(
                                        event.target.value
                                    )
                                }
                                placeholder="https://..."
                            />

                            <label>
                                Descripción
                            </label>

                            <textarea
                                rows="5"
                                value={clubDescription}
                                onChange={(event) =>
                                    setClubDescription(
                                        event.target.value
                                    )
                                }
                                placeholder="Contá brevemente qué tipo de organización es."
                            />
                        </>
                    )}

                    {formMessage && (
                        <p
                            style={{
                                color: "#b42318"
                            }}
                        >
                            {formMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creando cuenta..."
                            : "Crear cuenta"}
                    </button>

                </form>

                <p className="auth-switch">
                    ¿Ya tenés cuenta?{" "}
                    <Link to="/login">
                        Ingresar
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Signup;