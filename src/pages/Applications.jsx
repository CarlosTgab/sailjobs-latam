import { useState } from "react";
import {
    useParams,
    useNavigate
} from "react-router-dom";

import {
    sameId,
    hasId
} from "../utils/idUtils";

import {
    APPLICATION_STATUS
} from "../config/appConfig";

import staticJobs from "../data/jobs";

import {
    getAllJobs
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";

import {
    getAllClubs,
    isOrganizationEntity
} from "../utils/clubsStorage";

import {
    updateApplicationStatus
} from "../utils/applicationsStorage";

import useApplications from "../hooks/useApplications";

import {
    getUserById
} from "../utils/authStorage";

function Applications() {

    const { clubId } =
        useParams();

    const navigate =
        useNavigate();

    const {
        applications,
        isLoadingApplications,
        applicationsError,
        refreshApplications
    } = useApplications();

    const [
        selectedStatus,
        setSelectedStatus
    ] = useState("");

    const [
        selectedJobId,
        setSelectedJobId
    ] = useState("");

    const [
        search,
        setSearch
    ] = useState("");

    const jobs =
        getAllJobs(staticJobs);

    const clubs =
        getAllClubs(staticClubs);

    const club =
        clubs.find(
            item =>
                sameId(item.id, clubId)
        );

    const organizationAccount =
        isOrganizationEntity(club);

    const clubJobs =
        jobs.filter(
            job =>
                sameId(job.clubId, clubId)
        );

    const clubJobIds =
        clubJobs.map(
            job => job.id
        );

    const clubApplications =
        applications.filter(
            application => {

                const belongsByClubId =
                    application.clubId &&
                    sameId(
                        application.clubId,
                        clubId
                    )

                const belongsByJobId =
                    hasId(
                        clubJobIds,
                        application.jobId
                    )

                return (
                    belongsByClubId ||
                    belongsByJobId
                );

            }
        );

    const pendingApplications =
        clubApplications.filter(
            application =>
                application.status ===
                APPLICATION_STATUS.PENDING
        );

    const acceptedApplications =
        clubApplications.filter(
            application =>
                application.status ===
                APPLICATION_STATUS.ACCEPTED
        );

    const rejectedApplications =
        clubApplications.filter(
            application =>
                application.status ===
                APPLICATION_STATUS.REJECTED
        );

    const filteredApplications =
        [...clubApplications]
            .filter(application => {

                const matchesStatus =
                    !selectedStatus ||
                    application.status ===
                    selectedStatus;

                const matchesJob =
                    !selectedJobId ||
                    sameId(
                        application.jobId,
                        selectedJobId
                    )

                const applicantUser =
                    getUserById(
                        application.userId
                    );

                const professionalProfile =
                    application.professionalSnapshot ||
                    applicantUser?.professionalProfile ||
                    {};

                const searchableText = [
                    application.name,
                    application.email,
                    application.phone,
                    application.country,
                    application.message,
                    professionalProfile.title,
                    professionalProfile.summary,
                    ...(
                        professionalProfile.specialties ||
                        []
                    ),
                    ...(
                        professionalProfile.certifications ||
                        []
                    )
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !search.trim() ||
                    searchableText.includes(
                        search
                            .trim()
                            .toLowerCase()
                    );

                return (
                    matchesStatus &&
                    matchesJob &&
                    matchesSearch
                );

            })
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );

    function getJob(jobId) {

        return jobs.find(
            job =>
                sameId(job.id, jobId)
        );

    }


function getProfessionalProfile(
    application
) {

    const applicantUser =
        getUserById(
            application.userId
        );

    return (
        application.professionalSnapshot ||
        applicantUser?.professionalProfile ||
        {}
    );

}

async function handleStatusChange(
    applicationId,
    newStatus
) {

    try {
        await updateApplicationStatus(
            applicationId,
            newStatus
        );

        refreshApplications();
    } catch (error) {
        alert(
            error?.message ||
            "No se pudo actualizar la postulación."
        );
    }

}

async function handleAccept(
    applicationId
) {

    const confirmAccept =
        window.confirm(
            "¿Querés aceptar esta postulación?"
        );

    if (!confirmAccept) {
        return;
    }

    await handleStatusChange(
        applicationId,
        APPLICATION_STATUS.ACCEPTED
    );

}

async function handleReject(
    applicationId
) {

    const confirmReject =
        window.confirm(
            "¿Querés rechazar esta postulación?"
        );

    if (!confirmReject) {
        return;
    }

    await handleStatusChange(
        applicationId,
        APPLICATION_STATUS.REJECTED
    );

}

async function handleReturnToPending(
    applicationId
) {

    await handleStatusChange(
        applicationId,
        APPLICATION_STATUS.PENDING
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

function clearFilters() {

    setSelectedStatus("");
    setSelectedJobId("");
    setSearch("");

}

if (!club) {
    return (

        <div className="dashboard-page">

            <h1>
                Organización no encontrada
            </h1>

            <p>
                No pudimos encontrar el club u
                organización asociado a estas
                postulaciones.
            </p>

            <button
                className="back-button"
                onClick={() =>
                    navigate("/clubs")
                }
            >
                ← Volver a clubes
            </button>

        </div>

    );
}

return (

    <div className="dashboard-page">

        <button
            className="back-button"
            onClick={() =>
                navigate(
                    organizationAccount
                        ? "/organization-admin"
                        : `/club-dashboard/${clubId}`
                )
            }
        >
            ← Volver al panel
        </button>

        <div className="dashboard-hero">

            <div>

                <h1>
                    Postulaciones recibidas
                </h1>

                <p>
                    Revisá los perfiles
                    profesionales que se
                    postularon a las oportunidades
                    de {club.name}.
                </p>

            </div>

            <div className="dashboard-actions">

                <button
                    className="apply-button"
                    onClick={() =>
                        navigate("/jobs")
                    }
                >
                    Ver oportunidades
                </button>

                <button
                    className="apply-button"
                    onClick={() =>
                        navigate(
                            `/club-dashboard/${clubId}/new-job`
                        )
                    }
                >
                    Publicar oportunidad
                </button>

            </div>

        </div>

        {applicationsError && (
            <div className="detail-card">
                <p style={{ color: "#b42318" }}>
                    {applicationsError}
                </p>
            </div>
        )}

        {isLoadingApplications && applications.length === 0 && (
            <div className="detail-card">
                <p>Cargando postulaciones...</p>
            </div>
        )}

        <div className="dashboard-stats">

            <div className="dashboard-stat-card">

                <h2>
                    {
                        clubApplications.length
                    }
                </h2>

                <p>
                    Total de postulaciones
                </p>

            </div>

            <div className="dashboard-stat-card">

                <h2>
                    {
                        pendingApplications.length
                    }
                </h2>

                <p>
                    Pendientes
                </p>

            </div>

            <div className="dashboard-stat-card">

                <h2>
                    {
                        acceptedApplications.length
                    }
                </h2>

                <p>
                    Aceptadas
                </p>

            </div>

            <div className="dashboard-stat-card">

                <h2>
                    {
                        rejectedApplications.length
                    }
                </h2>

                <p>
                    Rechazadas
                </p>

            </div>

        </div>

        <div className="calendar-filters">

            <input
                type="text"
                placeholder={
                    "Buscar por nombre, email, especialidad o certificación"
                }
                value={search}
                onChange={(event) =>
                    setSearch(
                        event.target.value
                    )
                }
            />

            <select
                value={selectedStatus}
                onChange={(event) =>
                    setSelectedStatus(
                        event.target.value
                    )
                }
            >

                <option value="">
                    Todos los estados
                </option>

                <option
                    value={
                        APPLICATION_STATUS.PENDING
                    }
                >
                    Pendientes
                </option>

                <option
                    value={
                        APPLICATION_STATUS.ACCEPTED
                    }
                >
                    Aceptadas
                </option>

                <option
                    value={
                        APPLICATION_STATUS.REJECTED
                    }
                >
                    Rechazadas
                </option>

            </select>

            <select
                value={selectedJobId}
                onChange={(event) =>
                    setSelectedJobId(
                        event.target.value
                    )
                }
            >

                <option value="">
                    Todas las oportunidades
                </option>

                {clubJobs.map(job => (

                    <option
                        key={job.id}
                        value={job.id}
                    >
                        {job.title}
                    </option>

                ))}

            </select>

            <button
                className="filter-clear-button"
                onClick={
                    clearFilters
                }
            >
                Limpiar filtros
            </button>

        </div>

        {filteredApplications.length >
            0 ? (

            <div className="dashboard-grid">

                {filteredApplications.map(
                    application => {

                        const job =
                            getJob(
                                application.jobId
                            );

                        const professionalProfile =
                            getProfessionalProfile(
                                application
                            );

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

                        return (

                            <div
                                key={
                                    application.id
                                }
                                className="dashboard-card"
                            >

                                <div className="event-card-top">

                                    <span className="sidebar-tag">

                                        {
                                            job?.category ||
                                            "Profesional náutico"
                                        }

                                    </span>

                                    <span
                                        className={
                                            getStatusClass(
                                                application.status
                                            )
                                        }
                                    >
                                        {
                                            application.status
                                        }
                                    </span>

                                </div>

                                <h2>
                                    {
                                        application.name
                                    }
                                </h2>

                                <p>

                                    <strong>
                                        Oportunidad:
                                    </strong>{" "}

                                    {
                                        job?.title ||
                                        "Oportunidad no encontrada"
                                    }

                                </p>

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
                                        Teléfono:
                                    </strong>{" "}

                                    {
                                        application.phone ||
                                        "No informado"
                                    }

                                </p>

                                <p>

                                    <strong>
                                        País:
                                    </strong>{" "}

                                    {
                                        application.country ||
                                        "No informado"
                                    }

                                </p>

                                <p>

                                    <strong>
                                        Especialidades:
                                    </strong>{" "}

                                    {
                                        specialties
                                            .slice(0, 4)
                                            .join(", ") ||
                                        "No informadas"
                                    }

                                </p>

                                <p>

                                    <strong>
                                        Certificaciones:
                                    </strong>{" "}

                                    {
                                        certifications
                                            .slice(0, 3)
                                            .join(", ") ||
                                        "No informadas"
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

                                {application.message && (

                                    <p>

                                        <strong>
                                            Mensaje:
                                        </strong>{" "}

                                        {
                                            application.message.length >
                                                160
                                                ? `${application.message.slice(
                                                    0,
                                                    160
                                                )}...`
                                                : application.message
                                        }

                                    </p>

                                )}

                                <div className="dashboard-actions">

                                    <button
                                        className="apply-button"
                                        onClick={() =>
                                            navigate(
                                                `/applicant/${application.id}`
                                            )
                                        }
                                    >
                                        Ver perfil completo
                                    </button>

                                    {
                                        application.status !==
                                        APPLICATION_STATUS.ACCEPTED &&
                                        (

                                            <button
                                                className="accept-button"
                                                onClick={() =>
                                                    handleAccept(
                                                        application.id
                                                    )
                                                }
                                            >
                                                Aceptar
                                            </button>

                                        )
                                    }

                                    {
                                        application.status !==
                                        APPLICATION_STATUS.REJECTED &&
                                        (

                                            <button
                                                className="reject-button"
                                                onClick={() =>
                                                    handleReject(
                                                        application.id
                                                    )
                                                }
                                            >
                                                Rechazar
                                            </button>

                                        )
                                    }

                                    {
                                        application.status !==
                                        APPLICATION_STATUS.PENDING &&
                                        (

                                            <button
                                                className="small-action-button"
                                                onClick={() =>
                                                    handleReturnToPending(
                                                        application.id
                                                    )
                                                }
                                            >
                                                Volver a pendiente
                                            </button>

                                        )
                                    }

                                </div>

                            </div>

                        );

                    }
                )}

            </div>

        ) : (

            <div className="detail-card">

                <h2>
                    No hay postulaciones para mostrar
                </h2>

                <p>
                    No se encontraron resultados con
                    los filtros actuales o todavía
                    nadie se postuló a las
                    oportunidades de esta
                    organización.
                </p>

            </div>

        )}

    </div>

);
}

export default Applications;