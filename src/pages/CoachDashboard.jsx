import {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    COUNTRIES,
    APPLICATION_STATUS,
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

import {
    getCurrentUser,
    updateCurrentUserProfile,
    updateProfessionalProfile,
    hasProfessionalProfile
} from "../utils/authStorage";

import {
    getApplications
} from "../utils/applicationsStorage";

import staticJobs from "../data/jobs";

import {
    getAllJobs
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";

import {
    getAllClubs
} from "../utils/clubsStorage";

import {
    getAllClassifieds
} from "../utils/classifiedsStorage";

function CoachDashboard() {

    const navigate =
        useNavigate();

    const [
        currentUser,
        setCurrentUser
    ] = useState(
        getCurrentUser()
    );

    const professionalProfile =
        currentUser?.professionalProfile ||
        {};

    const [
        editMode,
        setEditMode
    ] = useState(false);

    const [
        name,
        setName
    ] = useState(
        currentUser?.name || ""
    );

    const [
        profileImage,
        setProfileImage
    ] = useState(
        currentUser?.profileImage || ""
    );

    const [
        title,
        setTitle
    ] = useState(
        professionalProfile.title || ""
    );

    const [
        summary,
        setSummary
    ] = useState(
        professionalProfile.summary || ""
    );

    const [
        specialtiesText,
        setSpecialtiesText
    ] = useState(
        Array.isArray(
            professionalProfile.specialties
        )
            ? professionalProfile.specialties.join(", ")
            : ""
    );

    const [
        certificationsText,
        setCertificationsText
    ] = useState(
        Array.isArray(
            professionalProfile.certifications
        )
            ? professionalProfile.certifications.join(", ")
            : ""
    );

    const [
        experienceText,
        setExperienceText
    ] = useState(
        Array.isArray(
            professionalProfile.experience
        )
            ? professionalProfile.experience.join("\n")
            : ""
    );

    const [
        languagesText,
        setLanguagesText
    ] = useState(
        Array.isArray(
            professionalProfile.languages
        )
            ? professionalProfile.languages.join(", ")
            : ""
    );

    const [
        availability,
        setAvailability
    ] = useState(
        professionalProfile.availability || ""
    );

    const [
        phone,
        setPhone
    ] = useState(
        professionalProfile.phone || ""
    );

    const [
        city,
        setCity
    ] = useState(
        professionalProfile.city || ""
    );

    const [
        country,
        setCountry
    ] = useState(
        professionalProfile.country || ""
    );

    const [
        cvFileName,
        setCvFileName
    ] = useState(
        professionalProfile.cvFileName || ""
    );

    const [
        cvUrl,
        setCvUrl
    ] = useState(
        professionalProfile.cvUrl || ""
    );

    const [
        formMessage,
        setFormMessage
    ] = useState("");

    const jobs =
        getAllJobs(staticJobs);

    const clubs =
        getAllClubs(staticClubs);

    const applications =
        currentUser
            ? getApplications()
                .filter(
                    application =>
                        Number(application.userId) ===
                        Number(currentUser.id)
                )
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                )
            : [];

    const classifieds =
        currentUser
            ? getAllClassifieds()
                .filter(
                    item =>
                        Number(item.userId) ===
                        Number(currentUser.id)
                )
            : [];

    const latestOpportunities =
        jobs
            .slice()
            .sort(
                (a, b) =>
                    Number(b.id) -
                    Number(a.id)
            )
            .slice(0, 4);

    const pendingApplications =
        applications.filter(
            application =>
                application.status ===
                APPLICATION_STATUS.PENDING
        );

    const acceptedApplications =
        applications.filter(
            application =>
                application.status ===
                APPLICATION_STATUS.ACCEPTED
        );

    function getInitials(userName) {

        if (!userName) {
            return "PN";
        }

        return userName
            .split(" ")
            .map(part => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

    }

    function splitCommaList(text) {

        return text
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);

    }

    function splitLineList(text) {

        return text
            .split("\n")
            .map(item => item.trim())
            .filter(Boolean);

    }

    function getJob(jobId) {

        return jobs.find(
            job =>
                Number(job.id) ===
                Number(jobId)
        );

    }

    function getClub(clubId) {

        return clubs.find(
            club =>
                Number(club.id) ===
                Number(clubId)
        );

    }

    function getStatusClass(status) {

        if (
            status ===
            APPLICATION_STATUS.ACCEPTED
        ) {
            return "status-pill approved";
        }

        if (
            status ===
            APPLICATION_STATUS.REJECTED
        ) {
            return "status-pill rejected";
        }

        return "status-pill pending";

    }

    function getOpportunityTypeLabel(type) {

        return (
            OPPORTUNITY_TYPE_LABELS[type] ||
            "Trabajo profesional"
        );

    }

    function getCompensationLabel(job) {

        if (job.compensationDetails) {
            return job.compensationDetails;
        }

        if (job.compensationType) {
            return (
                COMPENSATION_TYPE_LABELS[
                    job.compensationType
                ] ||
                "A confirmar"
            );
        }

        return job.salary || "A confirmar";

    }

    function formatDate(date) {

        if (!date) {
            return "Fecha no disponible";
        }

        return new Date(date)
            .toLocaleDateString(
                "es-AR",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

    }

    function handleProfileImageChange(event) {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onloadend = () => {
            setProfileImage(
                reader.result
            );
        };

        reader.readAsDataURL(file);

    }

    function handleCvChange(event) {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        setCvFileName(file.name);

    }

    function handleSaveProfile(event) {

        event.preventDefault();

        if (
            !name.trim() ||
            !title.trim() ||
            !summary.trim()
        ) {
            setFormMessage(
                "Completá nombre, título profesional y resumen."
            );

            return;
        }

        updateCurrentUserProfile({
            name: name.trim(),
            profileImage
        });

        updateProfessionalProfile({
            title: title.trim(),
            summary: summary.trim(),
            specialties:
                splitCommaList(
                    specialtiesText
                ),
            certifications:
                splitCommaList(
                    certificationsText
                ),
            experience:
                splitLineList(
                    experienceText
                ),
            languages:
                splitCommaList(
                    languagesText
                ),
            availability:
                availability.trim(),
            phone:
                phone.trim(),
            city:
                city.trim(),
            country,
            cvFileName,
            cvUrl:
                cvUrl.trim()
        });

        const updatedUser =
            getCurrentUser();

        setCurrentUser(
            updatedUser
        );

        setFormMessage(
            "Perfil profesional actualizado correctamente."
        );

        setEditMode(false);

    }

    if (
        !currentUser ||
        !hasProfessionalProfile(
            currentUser
        )
    ) {
        return (

            <div className="dashboard-page">

                <h1>
                    Perfil profesional no activo
                </h1>

                <p>
                    Para acceder a esta sección necesitás
                    activar tu perfil profesional náutico
                    desde tu cuenta personal.
                </p>

                <button
                    className="apply-button"
                    onClick={() =>
                        navigate(
                            "/user-dashboard"
                        )
                    }
                >
                    Ir a mi perfil personal
                </button>

            </div>

        );
    }

    return (

        <div className="dashboard-page">

            <div className="dashboard-hero">

                <div className="dashboard-hero-info">

                    <div className="dashboard-profile-photo-wrapper">

                        {profileImage ? (

                            <img
                                src={profileImage}
                                alt={currentUser.name}
                                className={
                                    "dashboard-profile-photo"
                                }
                            />

                        ) : (

                            <div className="dashboard-avatar">

                                {
                                    getInitials(
                                        currentUser.name
                                    )
                                }

                            </div>

                        )}

                    </div>

                    <div>

                        <h1>
                            Perfil profesional náutico
                        </h1>

                        <p>
                            {
                                professionalProfile.title ||
                                "Profesional náutico"
                            }
                        </p>

                        <p>
                            {
                                currentUser.name
                            }
                        </p>

                    </div>

                </div>

                <div className="dashboard-actions">

                    <button
                        className="apply-button"
                        onClick={() =>
                            setEditMode(
                                !editMode
                            )
                        }
                    >
                        {
                            editMode
                                ? "Cerrar edición"
                                : "Editar perfil profesional"
                        }
                    </button>

                    <button
                        className="apply-button"
                        onClick={() =>
                            navigate(
                                "/user-dashboard"
                            )
                        }
                    >
                        Perfil personal
                    </button>

                    <button
                        className="apply-button"
                        onClick={() =>
                            navigate(
                                "/jobs"
                            )
                        }
                    >
                        Ver oportunidades
                    </button>

                </div>

            </div>

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">

                    <h2>
                        {applications.length}
                    </h2>

                    <p>
                        Postulaciones enviadas
                    </p>

                </div>

                <div className="dashboard-stat-card">

                    <h2>
                        {pendingApplications.length}
                    </h2>

                    <p>
                        Pendientes
                    </p>

                </div>

                <div className="dashboard-stat-card">

                    <h2>
                        {acceptedApplications.length}
                    </h2>

                    <p>
                        Aceptadas
                    </p>

                </div>

                <div className="dashboard-stat-card">

                    <h2>
                        {classifieds.length}
                    </h2>

                    <p>
                        Clasificados publicados
                    </p>

                </div>

            </div>

            {editMode && (

                <div className="detail-card">

                    <div className="section-header">

                        <h2>
                            Editar perfil profesional
                        </h2>

                    </div>

                    <form
                        onSubmit={
                            handleSaveProfile
                        }
                    >

                        <label>
                            Foto de perfil
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={
                                handleProfileImageChange
                            }
                        />

                        <label>
                            Nombre completo *
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                        />

                        <label>
                            Título profesional *
                        </label>

                        <input
                            type="text"
                            placeholder={
                                "Ejemplo: Coach ILCA / Race Officer / Profesional náutico"
                            }
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                        />

                        <label>
                            Resumen profesional *
                        </label>

                        <textarea
                            rows="6"
                            placeholder={
                                "Contá tu experiencia, clases, tipo de trabajo que buscás y fortalezas principales."
                            }
                            value={summary}
                            onChange={(event) =>
                                setSummary(
                                    event.target.value
                                )
                            }
                        />

                        <label>
                            Especialidades
                        </label>

                        <input
                            type="text"
                            placeholder={
                                "Ejemplo: ILCA, Optimist, táctica, entrenamiento juvenil, race management"
                            }
                            value={
                                specialtiesText
                            }
                            onChange={(event) =>
                                setSpecialtiesText(
                                    event.target.value
                                )
                            }
                        />

                        <label>
                            Certificaciones
                        </label>

                        <input
                            type="text"
                            placeholder={
                                "Ejemplo: World Sailing Level 1, RCP, licencia náutica"
                            }
                            value={
                                certificationsText
                            }
                            onChange={(event) =>
                                setCertificationsText(
                                    event.target.value
                                )
                            }
                        />

                        <label>
                            Experiencia
                        </label>

                        <textarea
                            rows="6"
                            placeholder={
                                "Escribí una experiencia por línea."
                            }
                            value={
                                experienceText
                            }
                            onChange={(event) =>
                                setExperienceText(
                                    event.target.value
                                )
                            }
                        />

                        <label>
                            Idiomas
                        </label>

                        <input
                            type="text"
                            placeholder={
                                "Ejemplo: Español, Inglés, Portugués"
                            }
                            value={
                                languagesText
                            }
                            onChange={(event) =>
                                setLanguagesText(
                                    event.target.value
                                )
                            }
                        />

                        <label>
                            Disponibilidad
                        </label>

                        <input
                            type="text"
                            placeholder={
                                "Ejemplo: temporada de verano, fines de semana, disponibilidad internacional"
                            }
                            value={
                                availability
                            }
                            onChange={(event) =>
                                setAvailability(
                                    event.target.value
                                )
                            }
                        />

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

                            {COUNTRIES.map(
                                countryOption => (

                                    <option
                                        key={
                                            countryOption
                                        }
                                        value={
                                            countryOption
                                        }
                                    >
                                        {
                                            countryOption
                                        }
                                    </option>

                                )
                            )}

                        </select>

                        <label>
                            CV / résumé
                        </label>

                        <input
                            type="file"
                            accept={
                                ".pdf,.doc,.docx"
                            }
                            onChange={
                                handleCvChange
                            }
                        />

                        {cvFileName && (

                            <p>
                                Archivo cargado:{" "}
                                <strong>
                                    {cvFileName}
                                </strong>
                            </p>

                        )}

                        <label>
                            Link público al CV
                        </label>

                        <input
                            type="url"
                            placeholder={
                                "Ejemplo: link de Google Drive, Dropbox o portfolio"
                            }
                            value={cvUrl}
                            onChange={(event) =>
                                setCvUrl(
                                    event.target.value
                                )
                            }
                        />

                        <p className="password-help">
                            Por ahora el archivo queda
                            guardado solo como nombre en
                            localStorage. Para que una
                            organización pueda abrirlo
                            desde otra computadora,
                            agregá un link público al CV.
                        </p>

                        {formMessage && (

                            <p
                                style={{
                                    color: "#067647"
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
                                    setEditMode(false)
                                }
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="accept-button"
                            >
                                Guardar perfil
                            </button>

                        </div>

                    </form>

                </div>

            )}

            {!editMode && (

                <div className="detail-card">

                    <div className="section-header">

                        <h2>
                            Información profesional
                        </h2>

                    </div>

                    <p>

                        <strong>
                            Título:
                        </strong>{" "}

                        {
                            professionalProfile.title ||
                            "No informado"
                        }

                    </p>

                    <p>

                        <strong>
                            Resumen:
                        </strong>

                    </p>

                    <p>
                        {
                            professionalProfile.summary ||
                            "No informado"
                        }
                    </p>

                    <p>

                        <strong>
                            Especialidades:
                        </strong>{" "}

                        {
                            professionalProfile.specialties?.join(
                                ", "
                            ) ||
                            "No informadas"
                        }

                    </p>

                    <p>

                        <strong>
                            Certificaciones:
                        </strong>{" "}

                        {
                            professionalProfile.certifications?.join(
                                ", "
                            ) ||
                            "No informadas"
                        }

                    </p>

                    <p>

                        <strong>
                            Idiomas:
                        </strong>{" "}

                        {
                            professionalProfile.languages?.join(
                                ", "
                            ) ||
                            "No informados"
                        }

                    </p>

                    <p>

                        <strong>
                            Disponibilidad:
                        </strong>{" "}

                        {
                            professionalProfile.availability ||
                            "No informada"
                        }

                    </p>

                    <p>

                        <strong>
                            Ubicación:
                        </strong>{" "}

                        {
                            [
                                professionalProfile.city,
                                professionalProfile.country
                            ]
                                .filter(Boolean)
                                .join(", ") ||
                            "No informada"
                        }

                    </p>

                    <p>

                        <strong>
                            CV:
                        </strong>{" "}

                        {
                            professionalProfile.cvFileName ||
                            "No cargado"
                        }

                    </p>

                    {professionalProfile.cvUrl && (

                        <a
                            href={
                                professionalProfile.cvUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="apply-button"
                        >
                            Abrir CV
                        </a>

                    )}

                </div>

            )}

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Experiencia
                    </h2>

                </div>

                {professionalProfile.experience?.length >
                0 ? (

                    <ul>

                        {professionalProfile.experience.map(
                            (
                                experienceItem,
                                index
                            ) => (

                                <li
                                    key={
                                        `${experienceItem}-${index}`
                                    }
                                >
                                    {
                                        experienceItem
                                    }
                                </li>

                            )
                        )}

                    </ul>

                ) : (

                    <p>
                        Todavía no cargaste experiencia.
                    </p>

                )}

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Mis postulaciones
                    </h2>

                    <button
                        className="small-action-button"
                        onClick={() =>
                            navigate("/jobs")
                        }
                    >
                        Buscar oportunidades
                    </button>

                </div>

                {applications.length > 0 ? (

                    <div className="dashboard-grid">

                        {applications.map(
                            application => {

                                const job =
                                    getJob(
                                        application.jobId
                                    );

                                const club =
                                    job
                                        ? getClub(
                                            job.clubId
                                        )
                                        : null;

                                return (

                                    <div
                                        key={
                                            application.id
                                        }
                                        className="dashboard-card"
                                    >

                                        <div className="event-card-top">

                                            <span
                                                className={
                                                    getStatusClass(
                                                        application.status
                                                    )
                                                }
                                            >
                                                {
                                                    application.status ||
                                                    "Pendiente"
                                                }
                                            </span>

                                        </div>

                                        <h3>
                                            {
                                                job
                                                    ? job.title
                                                    : "Oportunidad no encontrada"
                                            }
                                        </h3>

                                        <p>

                                            <strong>
                                                Organización:
                                            </strong>{" "}

                                            {
                                                club
                                                    ? club.name
                                                    : "No encontrada"
                                            }

                                        </p>

                                        <p>

                                            <strong>
                                                Fecha:
                                            </strong>{" "}

                                            {
                                                formatDate(
                                                    application.createdAt
                                                )
                                            }

                                        </p>

                                        <button
                                            className="apply-button"
                                            onClick={() =>
                                                navigate(
                                                    `/applicant/${application.id}`
                                                )
                                            }
                                        >
                                            Ver postulación
                                        </button>

                                    </div>

                                );

                            }
                        )}

                    </div>

                ) : (

                    <p>
                        Todavía no enviaste postulaciones.
                    </p>

                )}

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Oportunidades recientes
                    </h2>

                    <button
                        className="small-action-button"
                        onClick={() =>
                            navigate("/jobs")
                        }
                    >
                        Ver todas
                    </button>

                </div>

                {latestOpportunities.length > 0 ? (

                    <div className="dashboard-grid">

                        {latestOpportunities.map(
                            job => {

                                const club =
                                    getClub(
                                        job.clubId
                                    );

                                return (

                                    <div
                                        key={job.id}
                                        className="dashboard-card"
                                    >

                                        <div className="event-card-top">

                                            <span className="sidebar-tag">

                                                {
                                                    getOpportunityTypeLabel(
                                                        job.opportunityType
                                                    )
                                                }

                                            </span>

                                            <span className="status-pill pending">

                                                {
                                                    job.category
                                                }

                                            </span>

                                        </div>

                                        <h3>
                                            {job.title}
                                        </h3>

                                        <p>

                                            <strong>
                                                Organización:
                                            </strong>{" "}

                                            {
                                                club
                                                    ? club.name
                                                    : "No encontrada"
                                            }

                                        </p>

                                        <p>

                                            <strong>
                                                Ubicación:
                                            </strong>{" "}

                                            {job.city},{" "}
                                            {job.country}

                                        </p>

                                        <p>

                                            <strong>
                                                Compensación:
                                            </strong>{" "}

                                            {
                                                getCompensationLabel(
                                                    job
                                                )
                                            }

                                        </p>

                                        <button
                                            className="apply-button"
                                            onClick={() =>
                                                navigate(
                                                    `/jobs/${job.id}`
                                                )
                                            }
                                        >
                                            Ver oportunidad
                                        </button>

                                    </div>

                                );

                            }
                        )}

                    </div>

                ) : (

                    <p>
                        Todavía no hay oportunidades publicadas.
                    </p>

                )}

            </div>

        </div>

    );
}

export default CoachDashboard;