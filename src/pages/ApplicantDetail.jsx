import {
    useParams,
    useNavigate
} from "react-router-dom";

import {
    getApplications
} from "../utils/applicationsStorage";

import {
    getCurrentUser,
    getUserById
} from "../utils/authStorage";

import staticJobs from "../data/jobs";

import {
    getAllJobs
} from "../utils/jobsStorage";

import {
    canManageClub,
    isSuperadmin
} from "../utils/permissions";

function ApplicantDetail() {

    const { id } =
        useParams();

    const navigate =
        useNavigate();

    const currentUser =
        getCurrentUser();

    const applications =
        getApplications();

    const jobs =
        getAllJobs(staticJobs);

    const application =
        applications.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!application) {
        return (

            <div className="dashboard-page">

                <h1>
                    Postulación no encontrada
                </h1>

                <p>
                    La postulación solicitada no existe
                    o fue eliminada.
                </p>

                <button
                    className="back-button"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    ← Volver al inicio
                </button>

            </div>

        );
    }

    const job =
        jobs.find(
            item =>
                Number(item.id) ===
                Number(
                    application.jobId
                )
        );

    const applicantUser =
        getUserById(
            application.userId
        );

    const isOwnApplication =
        currentUser &&
        Number(currentUser.id) ===
            Number(application.userId);

    const canManageApplication =
        currentUser &&
        job &&
        canManageClub(
            currentUser,
            job.clubId
        );

    const canViewApplication =
        currentUser &&
        (
            isSuperadmin(
                currentUser
            ) ||
            canManageApplication ||
            isOwnApplication
        );

    if (!canViewApplication) {
        return (

            <div className="dashboard-page">

                <h1>
                    Acceso denegado
                </h1>

                <p>
                    Solo el postulante, la organización
                    responsable o el superadministrador
                    pueden ver esta postulación.
                </p>

                <button
                    className="back-button"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    ← Volver al inicio
                </button>

            </div>

        );
    }

    /*
     * Preferimos la copia guardada al momento
     * de la postulación.
     *
     * Si la postulación es vieja y no tiene
     * professionalSnapshot, usamos el perfil
     * profesional actual del usuario.
     */
    const professionalProfile =
        application.professionalSnapshot ||
        applicantUser?.professionalProfile ||
        {};

    const profileImage =
        professionalProfile.profileImage ||
        applicantUser?.profileImage ||
        "";

    const cvFileName =
        application.cv ||
        professionalProfile.cvFileName ||
        "";

    const cvUrl =
        application.cvUrl ||
        professionalProfile.cvUrl ||
        "";

    const specialties =
        Array.isArray(
            professionalProfile.specialties
        )
            ? professionalProfile.specialties
            : [];

    const certifications =
        Array.isArray(
            professionalProfile.certifications
        )
            ? professionalProfile.certifications
            : [];

    const experience =
        Array.isArray(
            professionalProfile.experience
        )
            ? professionalProfile.experience
            : [];

    const languages =
        Array.isArray(
            professionalProfile.languages
        )
            ? professionalProfile.languages
            : [];

    function getInitials(name) {

        if (!name) {
            return "P";
        }

        return name
            .split(" ")
            .map(part => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

    }

    function getStatusClass(status) {

        if (status === "Aceptado") {
            return "status-pill approved";
        }

        if (status === "Rechazado") {
            return "status-pill rejected";
        }

        return "status-pill pending";

    }

    function formatDate(date) {

        if (!date) {
            return "Fecha no disponible";
        }

        return new Date(
            date
        ).toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }

    function handleGoBack() {

        if (isOwnApplication) {

            navigate(
                "/coach-dashboard"
            );

            return;

        }

        if (
            job &&
            canManageApplication
        ) {

            navigate(
                `/applications/${job.clubId}`
            );

            return;

        }

        if (
            currentUser &&
            isSuperadmin(currentUser)
        ) {

            navigate(
                "/superadmin"
            );

            return;

        }

        navigate("/");

    }

    return (

        <div className="event-detail">

            <button
                className="back-button"
                onClick={
                    handleGoBack
                }
            >
                ← Volver
            </button>

            <div className="detail-card">

                <div className="dashboard-hero-info">

                    <div className="dashboard-profile-photo-wrapper">

                        {profileImage ? (

                            <img
                                src={
                                    profileImage
                                }
                                alt={
                                    application.name
                                }
                                className={
                                    "dashboard-profile-photo"
                                }
                            />

                        ) : (

                            <div className="dashboard-avatar">

                                {
                                    getInitials(
                                        application.name
                                    )
                                }

                            </div>

                        )}

                    </div>

                    <div>

                        <h1>
                            {application.name}
                        </h1>

                        <p>
                            {
                                professionalProfile.title ||
                                "Perfil profesional náutico"
                            }
                        </p>

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

                </div>

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Información de la postulación
                    </h2>

                </div>

                <p>

                    <strong>
                        Oportunidad:
                    </strong>{" "}

                    {
                        job
                            ? job.title
                            : "Oportunidad no encontrada"
                    }

                </p>

                {job?.category && (

                    <p>

                        <strong>
                            Puesto / categoría:
                        </strong>{" "}

                        {
                            job.category
                        }

                    </p>

                )}

                <p>

                    <strong>
                        Fecha de postulación:
                    </strong>{" "}

                    {
                        formatDate(
                            application.createdAt
                        )
                    }

                </p>

                <p>

                    <strong>
                        Estado:
                    </strong>{" "}

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

                </p>

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Datos de contacto
                    </h2>

                </div>

                <p>

                    <strong>
                        Email:
                    </strong>{" "}

                    <a
                        href={
                            `mailto:${application.email}`
                        }
                    >
                        {
                            application.email
                        }
                    </a>

                </p>

                <p>

                    <strong>
                        Teléfono / WhatsApp:
                    </strong>{" "}

                    {
                        application.phone ||
                        professionalProfile.phone ||
                        "No informado"
                    }

                </p>

                <p>

                    <strong>
                        País:
                    </strong>{" "}

                    {
                        application.country ||
                        professionalProfile.country ||
                        "No informado"
                    }

                </p>

                {professionalProfile.city && (

                    <p>

                        <strong>
                            Ciudad:
                        </strong>{" "}

                        {
                            professionalProfile.city
                        }

                    </p>

                )}

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Perfil profesional
                    </h2>

                </div>

                <p>

                    <strong>
                        Título profesional:
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
                        specialties.join(", ") ||
                        "No informadas"
                    }

                </p>

                <p>

                    <strong>
                        Certificaciones:
                    </strong>{" "}

                    {
                        certifications.join(", ") ||
                        "No informadas"
                    }

                </p>

                <p>

                    <strong>
                        Idiomas:
                    </strong>{" "}

                    {
                        languages.join(", ") ||
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

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Experiencia
                    </h2>

                </div>

                {experience.length > 0 ? (

                    <ul>

                        {experience.map(
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
                        No se informó experiencia
                        profesional.
                    </p>

                )}

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        CV o résumé
                    </h2>

                </div>

                <p>

                    <strong>
                        Archivo:
                    </strong>{" "}

                    {
                        cvFileName ||
                        "No cargado"
                    }

                </p>

                {cvUrl ? (

                    <a
                        href={cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="apply-button"
                    >
                        Abrir CV
                    </a>

                ) : (

                    <p className="password-help">
                        Esta postulación no tiene un
                        enlace público al CV. Mientras
                        la aplicación use localStorage,
                        el nombre del archivo no permite
                        descargar el documento desde
                        otra computadora.
                    </p>

                )}

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>
                        Mensaje de postulación
                    </h2>

                </div>

                <p>
                    {
                        application.message ||
                        "El postulante no agregó un mensaje."
                    }
                </p>

            </div>

        </div>

    );
}

export default ApplicantDetail;