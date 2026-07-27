import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import LocationSelects, {
    CUSTOM_CITY_VALUE
} from "../components/LocationSelects";

import {
    registerWithSupabase
} from "../utils/supabaseAuth";

import {
    isSuperadmin,
    normalizeUserRole
} from "../utils/permissions";

import {
    ORGANIZATION_TYPE_LABELS
} from "../config/appConfig";

function getRedirectPath(user) {
    const role =
        normalizeUserRole(user);

    if (isSuperadmin(user)) {
        return "/superadmin";
    }

    if (role === "club" && user.clubId) {
        return `/club-dashboard/${user.clubId}`;
    }

    if (role === "organization_admin") {
        return "/organization-admin";
    }

    return "/profile";
}

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
        customCity,
        setCustomCity
    ] = useState("");

    const [
        country,
        setCountry
    ] = useState("");

    const [
        countryCode,
        setCountryCode
    ] = useState("");

    const [
        state,
        setState
    ] = useState("");

    const [
        stateCode,
        setStateCode
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
        organizationType,
        setOrganizationType
    ] = useState("class_association");

    const [
        clubCity,
        setClubCity
    ] = useState("");

    const [
        clubCustomCity,
        setClubCustomCity
    ] = useState("");

    const [
        clubCountry,
        setClubCountry
    ] = useState("");

    const [
        clubCountryCode,
        setClubCountryCode
    ] = useState("");

    const [
        clubState,
        setClubState
    ] = useState("");

    const [
        clubStateCode,
        setClubStateCode
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

    const isOrganization =
        accountType === "organization";

    const isManagedEntity =
        isClub || isOrganization;

    const managedEntityLabel =
        isClub
            ? "club"
            : "organización";

    async function handleSubmit(event) {
        event.preventDefault();

        setFormMessage("");
        setLoading(true);

        try {
            const resolvedCity =
                getResolvedCity(
                    city,
                    customCity,
                    state
                );

            const resolvedClubCity =
                getResolvedCity(
                    clubCity,
                    clubCustomCity,
                    clubState
                );

            const user =
                await registerWithSupabase({
                    accountType,
                    name,
                    email,
                    password,
                    phone,
                    city: resolvedCity,
                    country,
                    professionalTitle,
                    professionalSummary,
                    clubName,
                    clubCity: resolvedClubCity,
                    clubCountry,
                    clubDescription,
                    clubWebsite,
                    organizationType:
                        isOrganization
                            ? organizationType
                            : "club"
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
                            Club náutico
                        </strong>

                        <span>
                            Para clubes, yacht clubs, escuelas
                            de vela de club y sedes deportivas.
                        </span>
                    </button>

                    <button
                        type="button"
                        className={
                            accountType === "organization"
                                ? "account-type-card selected"
                                : "account-type-card"
                        }
                        onClick={() =>
                            setAccountType("organization")
                        }
                    >
                        <strong>
                            Organización náutica
                        </strong>

                        <span>
                            Para federaciones, asociaciones de clase,
                            organizadores de eventos o entidades no club.
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
                            setName(event.target.value)
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
                            setEmail(event.target.value)
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
                            setPassword(event.target.value)
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
                            setPhone(event.target.value)
                        }
                        placeholder="Opcional"
                    />

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

                    {isProfessional && (
                        <>
                            <label>
                                Título profesional
                            </label>

                            <input
                                type="text"
                                value={professionalTitle}
                                onChange={(event) =>
                                    setProfessionalTitle(event.target.value)
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
                                    setProfessionalSummary(event.target.value)
                                }
                                placeholder="Contá brevemente tu experiencia náutica."
                            />
                        </>
                    )}

                    {isManagedEntity && (
                        <>
                            <hr />

                            <h2>
                                Datos del {managedEntityLabel}
                            </h2>

                            <label>
                                Nombre del {managedEntityLabel}
                            </label>

                            <input
                                type="text"
                                value={clubName}
                                onChange={(event) =>
                                    setClubName(event.target.value)
                                }
                                placeholder={
                                    isClub
                                        ? "Ej: Club de Velas Rosario"
                                        : "Ej: Asociación Argentina de ILCA"
                                }
                            />

                            {isOrganization && (
                                <>
                                    <label>
                                        Tipo de organización
                                    </label>

                                    <select
                                        value={organizationType}
                                        onChange={(event) =>
                                            setOrganizationType(event.target.value)
                                        }
                                    >
                                        {Object.entries(ORGANIZATION_TYPE_LABELS).map(
                                            ([value, label]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </>
                            )}

                            <LocationSelects
                                countryCode={clubCountryCode}
                                setCountryCode={setClubCountryCode}
                                setCountry={setClubCountry}
                                stateCode={clubStateCode}
                                setStateCode={setClubStateCode}
                                setState={setClubState}
                                city={clubCity}
                                setCity={setClubCity}
                                customCity={clubCustomCity}
                                setCustomCity={setClubCustomCity}
                                labels={{
                                    country:
                                        isClub
                                            ? "País del club"
                                            : "País de la organización",
                                    state:
                                        isClub
                                            ? "Provincia / Estado del club"
                                            : "Provincia / Estado de la organización",
                                    city:
                                        isClub
                                            ? "Ciudad / Localidad del club"
                                            : "Ciudad / Localidad de la organización"
                                }}
                            />

                            <label>
                                Sitio web
                            </label>

                            <input
                                type="url"
                                value={clubWebsite}
                                onChange={(event) =>
                                    setClubWebsite(event.target.value)
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
                                    setClubDescription(event.target.value)
                                }
                                placeholder={
                                    isClub
                                        ? "Contá brevemente la actividad del club."
                                        : "Contá brevemente qué tipo de organización es y qué administra."
                                }
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
