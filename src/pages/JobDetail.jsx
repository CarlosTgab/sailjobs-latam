import { useState } from "react";
import { sameId } from "../utils/idUtils";
import {
    useParams,
    useNavigate
} from "react-router-dom";

import LocationSelects, {
    CUSTOM_CITY_VALUE
} from "../components/LocationSelects";

import staticJobs from "../data/jobs";

import {
    getAllJobs,
    deleteStoredJob,
    isStoredJob
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";

import {
    getAllClubs
} from "../utils/clubsStorage";

import {
    getCurrentUser,
    hasProfessionalProfile
} from "../utils/authStorage";

import {
    canManageClub
} from "../utils/permissions";

import {
    getApplications,
    saveApplication
} from "../utils/applicationsStorage";


function getJobCityName(job) {
    if (job?.cityName) {
        return job.cityName;
    }

    if (job?.city && job.city.includes(",")) {
        return job.city.split(",")[0].trim();
    }

    return job?.city || "";
}

function getLocationLabel(job) {
    const parts = [
        getJobCityName(job),
        job?.state,
        job?.country
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(", ");
    }

    return "Ubicación no informada";
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

function JobDetail() {

    const { id } =
        useParams();

    const navigate =
        useNavigate();

    const currentUser =
        getCurrentUser();

    const professionalProfile =
        currentUser?.professionalProfile || {};

    const jobs =
        getAllJobs(staticJobs);

    const clubs =
        getAllClubs(staticClubs);

    const job = jobs.find(
        item =>
            sameId(item.id, id)
    );

    const club = job
        ? (
            clubs.find(
                item =>
                    sameId(item.id, job.clubId)
            ) ||
            (job.clubId || job.clubName || job.organizationName
                ? {
                    id: job.clubId,
                    name: job.clubName || job.organizationName || "Organización no informada",
                    country: job.country || "",
                    city: job.city || "",
                    logo: "/logos/default-club.svg",
                    logoUrl: "/logos/default-club.svg"
                }
                : null)
        )
        : null;

    const [
        showApplyModal,
        setShowApplyModal
    ] = useState(false);

    const [
        name,
        setName
    ] = useState(
        currentUser?.name || ""
    );

    const [
        email,
        setEmail
    ] = useState(
        currentUser?.email || ""
    );

    const [
        phone,
        setPhone
    ] = useState(
        professionalProfile.phone || ""
    );

    const [
        country,
        setCountry
    ] = useState(
        professionalProfile.country || ""
    );


    const [
        applicantCountryCode,
        setApplicantCountryCode
    ] = useState("");

    const [
        applicantStateCode,
        setApplicantStateCode
    ] = useState("");

    const [
        applicantState,
        setApplicantState
    ] = useState("");

    const [
        applicantCity,
        setApplicantCity
    ] = useState("");

    const [
        applicantCustomCity,
        setApplicantCustomCity
    ] = useState("");

    const [
        cv,
        setCv
    ] = useState(null);

    const [
        message,
        setMessage
    ] = useState("");

    const [
        formMessage,
        setFormMessage
    ] = useState("");

    if (!job) {
        return (

            <div className="dashboard-page">

                <h1>
                    Oportunidad no encontrada
                </h1>

                <button
                    className="back-button"
                    onClick={() =>
                        navigate("/jobs")
                    }
                >
                    ← Volver a oportunidades
                </button>

            </div>

        );
    }

    const canManageThisJob =
        currentUser &&
        canManageClub(
            currentUser,
            job.clubId
        );

    const jobWasCreatedInApp =
        isStoredJob(job.id);

    const canEditOrDelete =
        canManageThisJob &&
        jobWasCreatedInApp;

    const applications =
        getApplications();

    const alreadyApplied =
        currentUser &&
        applications.some(
            application =>
                sameId(
                    application.userId,
                    currentUser.id
                ) &&
                sameId(
                    application.jobId,
                    job.id
                )
        );

    const canApply =
        hasProfessionalProfile(
            currentUser
        );

    const jobCategory =
        job.category ||
        "Oportunidad náutica";

    function handleOpenApply() {

        if (!currentUser) {

            alert(
                "Tenés que iniciar sesión para postularte."
            );

            navigate("/login");

            return;

        }

        if (!canApply) {

            const activateProfile =
                window.confirm(
                    "Necesitás un perfil profesional activo para postularte. ¿Querés ir a activarlo?"
                );

            if (activateProfile) {

                navigate(
                    "/profile"
                );

            }

            return;

        }

        if (alreadyApplied) {

            alert(
                "Ya te postulaste a esta oportunidad."
            );

            return;

        }

        setFormMessage("");

        setShowApplyModal(true);
    }

    function handleSubmitApplication(
        event
    ) {

        event.preventDefault();

        const resolvedApplicantCity =
            getResolvedCity(
                applicantCity,
                applicantCustomCity,
                applicantState
            );

        if (
            !currentUser ||
            !hasProfessionalProfile(
                currentUser
            )
        ) {

            setFormMessage(
                "Necesitás un perfil profesional activo para postularte."
            );

            return;

        }

        if (
            !name.trim() ||
            !email.trim() ||
            !phone.trim() ||
            !country ||
            !resolvedApplicantCity ||
            !message.trim()
        ) {

            setFormMessage(
                "Completá todos los campos obligatorios."
            );

            return;

        }

        if (alreadyApplied) {

            setFormMessage(
                "Ya te postulaste a esta oportunidad."
            );

            return;

        }

        const currentProfile =
            currentUser.professionalProfile ||
            {};

        const applicationCvName =
            cv
                ? cv.name
                : currentProfile.cvFileName ||
                "";

        saveApplication({

            id: Date.now(),

            userId:
                currentUser.id,

            jobId:
                job.id,

            clubId:
                job.clubId,

            name:
                name.trim(),

            email:
                email.trim(),

            phone:
                phone.trim(),

            country,

            state:
                applicantState,

            stateCode:
                applicantStateCode,

            city:
                resolvedApplicantCity,

            cityName:
                applicantCity === CUSTOM_CITY_VALUE || !applicantCity
                    ? applicantCustomCity.trim()
                    : applicantCity.trim(),

            cv:
                applicationCvName,

            cvUrl:
                currentProfile.cvUrl ||
                "",

            message:
                message.trim(),

            status:
                "Pendiente",

            professionalSnapshot: {

                title:
                    currentProfile.title ||
                    "",

                summary:
                    currentProfile.summary ||
                    "",

                specialties:
                    currentProfile.specialties ||
                    [],

                certifications:
                    currentProfile.certifications ||
                    [],

                experience:
                    currentProfile.experience ||
                    [],

                languages:
                    currentProfile.languages ||
                    [],

                availability:
                    currentProfile.availability ||
                    "",

                phone:
                    phone.trim(),

                city:
                    resolvedApplicantCity ||
                    currentProfile.city ||
                    "",

                state:
                    applicantState,

                stateCode:
                    applicantStateCode,

                country:
                    country ||
                    currentProfile.country ||
                    "",

                profileImage:
                    currentUser.profileImage ||
                    "",

                cvFileName:
                    applicationCvName,

                cvUrl:
                    currentProfile.cvUrl ||
                    ""

            },

            createdAt:
                new Date().toISOString()

        });

        setShowApplyModal(false);

        setFormMessage("");

        setMessage("");

        setCv(null);

        alert(
            "Postulación enviada correctamente."
        );
    }

    function handleDeleteJob() {

        const confirmDelete =
            window.confirm(
                "¿Seguro que querés eliminar esta oportunidad?"
            );

        if (!confirmDelete) {
            return;
        }

        deleteStoredJob(
            job.id
        );

        if (club) {

            navigate(
                `/club-dashboard/${club.id}`
            );

        } else {

            navigate("/jobs");

        }
    }

    function handleCloseModal() {

        setShowApplyModal(false);

        setFormMessage("");

    }

    return (

        <div className="event-detail">

            <button
                className="back-button"
                onClick={() =>
                    navigate("/jobs")
                }
            >
                ← Volver a oportunidades
            </button>

            <h1>
                {job.title}
            </h1>

            <div className="detail-card">

                {club ? (

                    <>

                        <img
                            src={
                                club.logo ||
                                "/logos/default-club.svg"
                            }
                            alt={club.name}
                            className={
                                "club-mini-logo"
                            }
                        />

                        <p>

                            <strong>
                                Club / organización:
                            </strong>{" "}

                            <span
                                className={
                                    "detail-link"
                                }
                                onClick={() =>
                                    navigate(
                                        `/clubs/${club.id}`
                                    )
                                }
                            >
                                {club.name}
                            </span>

                        </p>

                    </>

                ) : (

                    <p>

                        <strong>
                            Club / organización:
                        </strong>{" "}

                        Club no encontrado

                    </p>

                )}

                <p>

                    <strong>
                        Ubicación:
                    </strong>{" "}

                    {getLocationLabel(job)}

                </p>

                {job.state && (

                    <p>

                        <strong>
                            Provincia / Estado:
                        </strong>{" "}

                        {job.state}

                    </p>

                )}

                <p>

                    🧭{" "}

                    <strong>
                        Puesto / categoría:
                    </strong>{" "}

                    {jobCategory}

                </p>

                <p>

                    <strong>
                        Salario / compensación:
                    </strong>{" "}

                    {
                        job.salary ||
                        "A confirmar"
                    }

                </p>

                <p>

                    <strong>
                        Duración:
                    </strong>{" "}

                    {
                        job.duration ||
                        "A confirmar"
                    }

                </p>

                <p>
                    <strong>
                        Descripción:
                    </strong>
                </p>

                <p>
                    {job.description}
                </p>

                {job.requirements &&
                    job.requirements.length >
                    0 && (

                        <>

                            <p>
                                <strong>
                                    Requisitos:
                                </strong>
                            </p>

                            <ul>

                                {
                                    job.requirements.map(
                                        (
                                            requirement,
                                            index
                                        ) => (

                                            <li
                                                key={
                                                    `${requirement}-${index}`
                                                }
                                            >
                                                {
                                                    requirement
                                                }
                                            </li>

                                        )
                                    )
                                }

                            </ul>

                        </>

                    )}

                {job.updatedAt && (

                    <p>

                        <strong>
                            Última actualización:
                        </strong>{" "}

                        {
                            new Date(
                                job.updatedAt
                            ).toLocaleDateString(
                                "es-AR"
                            )
                        }

                    </p>

                )}

                <br />

                <div className="dashboard-actions">

                    {!currentUser && (

                        <button
                            className="apply-button"
                            onClick={
                                handleOpenApply
                            }
                        >
                            Iniciar sesión para postularme
                        </button>

                    )}

                    {currentUser &&
                        canApply && (

                            <button
                                className="apply-button"
                                onClick={
                                    handleOpenApply
                                }
                                disabled={
                                    alreadyApplied
                                }
                            >
                                {
                                    alreadyApplied
                                        ? "Ya te postulaste"
                                        : "Postularme"
                                }
                            </button>

                        )}

                    {currentUser &&
                        !canApply &&
                        !canManageThisJob && (

                            <button
                                className="apply-button"
                                onClick={
                                    handleOpenApply
                                }
                            >
                                Activar perfil profesional
                            </button>

                        )}

                    {canEditOrDelete && (

                        <>

                            <button
                                className="apply-button"
                                onClick={() =>
                                    navigate(
                                        `/jobs/${job.id}/edit`
                                    )
                                }
                            >
                                Editar
                            </button>

                            <button
                                className="reject-button"
                                onClick={
                                    handleDeleteJob
                                }
                            >
                                Eliminar
                            </button>

                        </>

                    )}

                </div>

                {currentUser &&
                    !canApply &&
                    !canManageThisJob && (

                        <p
                            style={{
                                marginTop: "15px",
                                color: "#666"
                            }}
                        >
                            Podés activar un perfil
                            profesional desde esta misma
                            cuenta sin perder tus datos,
                            publicaciones ni historial.
                        </p>

                    )}

                {canManageThisJob &&
                    !jobWasCreatedInApp && (

                        <p
                            style={{
                                marginTop: "15px",
                                color: "#666"
                            }}
                        >
                            Esta oportunidad pertenece a
                            los datos base del sitio. Solo
                            las oportunidades creadas desde
                            el panel se pueden editar o
                            eliminar.
                        </p>

                    )}

            </div>

            {showApplyModal && (

                <div className="modal-overlay">

                    <div className="modal">

                        <h2>
                            Postularme a{" "}
                            {job.title}
                        </h2>

                        <form
                            onSubmit={
                                handleSubmitApplication
                            }
                        >

                            <label>
                                Nombre completo
                            </label>

                            <input
                                type="text"
                                placeholder={
                                    "Nombre completo *"
                                }
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                            />

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder={
                                    "Email *"
                                }
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                            />

                            <label>
                                Teléfono / WhatsApp
                            </label>

                            <input
                                type="text"
                                placeholder={
                                    "Teléfono / WhatsApp *"
                                }
                                value={phone}
                                onChange={(event) =>
                                    setPhone(
                                        event.target.value
                                    )
                                }
                            />

                            <LocationSelects
                                countryCode={applicantCountryCode}
                                setCountryCode={setApplicantCountryCode}
                                setCountry={setCountry}
                                stateCode={applicantStateCode}
                                setStateCode={setApplicantStateCode}
                                setState={setApplicantState}
                                city={applicantCity}
                                setCity={setApplicantCity}
                                customCity={applicantCustomCity}
                                setCustomCity={setApplicantCustomCity}
                            />

                            <label>
                                CV para esta postulación
                            </label>

                            <input
                                type="file"
                                accept={
                                    ".pdf,.doc,.docx"
                                }
                                onChange={(event) =>
                                    setCv(
                                        event.target.files[0] ||
                                        null
                                    )
                                }
                            />

                            {cv && (

                                <p>
                                    Archivo seleccionado:{" "}
                                    <strong>
                                        {cv.name}
                                    </strong>
                                </p>

                            )}

                            {!cv &&
                                professionalProfile.cvFileName && (

                                    <p>
                                        Se usará el CV de tu
                                        perfil:{" "}

                                        <strong>
                                            {
                                                professionalProfile.cvFileName
                                            }
                                        </strong>
                                    </p>

                                )}

                            {!cv &&
                                !professionalProfile.cvFileName && (

                                    <p className="password-help">
                                        No tenés un archivo de CV
                                        cargado en tu perfil. Podés
                                        enviar la postulación igual,
                                        pero es recomendable agregarlo.
                                    </p>

                                )}

                            {professionalProfile.cvUrl && (

                                <p>

                                    <a
                                        href={
                                            professionalProfile.cvUrl
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Ver enlace de CV guardado
                                    </a>

                                </p>

                            )}

                            <label>
                                Mensaje para la organización
                            </label>

                            <textarea
                                placeholder={
                                    "Contá por qué te interesa la oportunidad y qué experiencia tenés. *"
                                }
                                rows="6"
                                value={message}
                                onChange={(event) =>
                                    setMessage(
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

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="reject-button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        handleCloseModal();
                                    }}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="accept-button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        handleSubmitApplication(event);
                                    }}
                                >
                                    Enviar postulación
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );
}

export default JobDetail;