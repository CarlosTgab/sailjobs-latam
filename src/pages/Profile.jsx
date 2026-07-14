import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sameId } from "../utils/idUtils";

import {
    COUNTRIES,
    APPLICATION_STATUS,
    OPPORTUNITY_TYPE_LABELS,
    COMPENSATION_TYPE_LABELS
} from "../config/appConfig";

import {
    getCurrentUser,
    updateCurrentUserProfile,
    activateProfessionalProfile,
    updateProfessionalProfile,
    hasProfessionalProfile
} from "../utils/authStorage";

import {
    normalizeUserRole
} from "../utils/permissions";

import {
    getApplications
} from "../utils/applicationsStorage";

import {
    getAllClassifieds
} from "../utils/classifiedsStorage";

import staticJobs from "../data/jobs";

import {
    getAllJobs
} from "../utils/jobsStorage";

import staticClubs from "../data/clubs";

import {
    getAllClubs
} from "../utils/clubsStorage";

function Profile() {
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(getCurrentUser());

    const [editPersonalMode, setEditPersonalMode] = useState(false);
    const [editProfessionalMode, setEditProfessionalMode] = useState(false);

    const professionalProfile = currentUser?.professionalProfile || {};

    const normalizedRole = normalizeUserRole(currentUser);

    const isSuperadmin = normalizedRole === "superadmin";
    const isOrganizationAdmin = normalizedRole === "organization_admin";
    const isClub = normalizedRole === "club";

    const professionalIsActive = hasProfessionalProfile(currentUser);

    const [name, setName] = useState(currentUser?.name || "");
    const [phone, setPhone] = useState(currentUser?.phone || "");
    const [city, setCity] = useState(currentUser?.city || "");
    const [country, setCountry] = useState(currentUser?.country || "");
    const [description, setDescription] = useState(currentUser?.description || "");
    const [profileImage, setProfileImage] = useState(currentUser?.profileImage || "");

    const [professionalTitle, setProfessionalTitle] = useState(
        professionalProfile.title || ""
    );

    const [summary, setSummary] = useState(
        professionalProfile.summary || ""
    );

    const [specialtiesText, setSpecialtiesText] = useState(
        Array.isArray(professionalProfile.specialties)
            ? professionalProfile.specialties.join(", ")
            : ""
    );

    const [certificationsText, setCertificationsText] = useState(
        Array.isArray(professionalProfile.certifications)
            ? professionalProfile.certifications.join(", ")
            : ""
    );

    const [experienceText, setExperienceText] = useState(
        Array.isArray(professionalProfile.experience)
            ? professionalProfile.experience.join("\n")
            : ""
    );

    const [languagesText, setLanguagesText] = useState(
        Array.isArray(professionalProfile.languages)
            ? professionalProfile.languages.join(", ")
            : ""
    );

    const [availability, setAvailability] = useState(
        professionalProfile.availability || ""
    );

    const [professionalPhone, setProfessionalPhone] = useState(
        professionalProfile.phone || ""
    );

    const [professionalCity, setProfessionalCity] = useState(
        professionalProfile.city || ""
    );

    const [professionalCountry, setProfessionalCountry] = useState(
        professionalProfile.country || ""
    );

    const [cvFileName, setCvFileName] = useState(
        professionalProfile.cvFileName || ""
    );

    const [cvUrl, setCvUrl] = useState(
        professionalProfile.cvUrl || ""
    );

    const [formMessage, setFormMessage] = useState("");

    const jobs = getAllJobs(staticJobs);
    const clubs = getAllClubs(staticClubs);

    const applications = currentUser
        ? getApplications()
            .filter(application =>
                sameId(application.userId, currentUser.id))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];

    const classifieds = currentUser
        ? getAllClassifieds()
            .filter(item =>
                sameId(item.userId, currentUser.id))
        : [];

    const pendingApplications = applications.filter(
        application => application.status === APPLICATION_STATUS.PENDING
    );

    const acceptedApplications = applications.filter(
        application => application.status === APPLICATION_STATUS.ACCEPTED
    );

    if (!currentUser) {
        return (
            <div className="dashboard-page">
                <div className="detail-card">
                    <h1>Iniciá sesión</h1>

                    <p>
                        Para ver tu perfil necesitás iniciar sesión.
                    </p>

                    <button
                        className="apply-button"
                        onClick={() => navigate("/login")}
                    >
                        Iniciar sesión
                    </button>
                </div>
            </div>
        );
    }

    function getInitials(userName) {
        if (!userName) {
            return "U";
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
            job => sameId(job.id, jobId)
        );
    }

    function getClub(clubId) {
        return clubs.find(
            club => sameId(club.id, clubId)
        );
    }

    function getStatusClass(status) {
        if (status === APPLICATION_STATUS.ACCEPTED) {
            return "status-pill approved";
        }

        if (status === APPLICATION_STATUS.REJECTED) {
            return "status-pill rejected";
        }

        return "status-pill pending";
    }

    function getOpportunityTypeLabel(type) {
        return OPPORTUNITY_TYPE_LABELS[type] || "Trabajo profesional";
    }

    function getCompensationLabel(job) {
        if (job.compensationDetails) {
            return job.compensationDetails;
        }

        if (job.compensationType) {
            return COMPENSATION_TYPE_LABELS[job.compensationType] || "A confirmar";
        }

        return job.salary || "A confirmar";
    }

    function formatDate(date) {
        if (!date) {
            return "Fecha no disponible";
        }

        return new Date(date).toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    function handleProfileImageChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setProfileImage(reader.result);
        };

        reader.readAsDataURL(file);
    }

    function handleCvChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        setCvFileName(file.name);
    }

    function handleSavePersonalProfile(event) {
        event.preventDefault();

        if (!name.trim()) {
            setFormMessage("El nombre es obligatorio.");
            return;
        }

        updateCurrentUserProfile({
            name: name.trim(),
            phone: phone.trim(),
            city: city.trim(),
            country,
            description: description.trim(),
            profileImage
        });

        const updatedUser = getCurrentUser();

        setCurrentUser(updatedUser);
        setFormMessage("Perfil personal actualizado correctamente.");
        setEditPersonalMode(false);
    }

    function handleActivateProfessionalProfile() {
        const confirmActivation = window.confirm(
            "Vas a activar tu perfil profesional náutico dentro de esta misma cuenta. No perdés tu perfil personal, clasificados ni historial. ¿Continuar?"
        );

        if (!confirmActivation) {
            return;
        }

        activateProfessionalProfile();

        const updatedUser = getCurrentUser();

        setCurrentUser(updatedUser);
        setEditProfessionalMode(true);
    }

    function handleSaveProfessionalProfile(event) {
        event.preventDefault();

        if (!professionalTitle.trim() || !summary.trim()) {
            setFormMessage(
                "Completá título profesional y resumen."
            );
            return;
        }

        updateProfessionalProfile({
            title: professionalTitle.trim(),
            summary: summary.trim(),
            specialties: splitCommaList(specialtiesText),
            certifications: splitCommaList(certificationsText),
            experience: splitLineList(experienceText),
            languages: splitCommaList(languagesText),
            availability: availability.trim(),
            phone: professionalPhone.trim(),
            city: professionalCity.trim(),
            country: professionalCountry,
            cvFileName,
            cvUrl: cvUrl.trim()
        });

        const updatedUser = getCurrentUser();

        setCurrentUser(updatedUser);
        setFormMessage("Perfil profesional actualizado correctamente.");
        setEditProfessionalMode(false);
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
                                className="dashboard-profile-photo"
                            />
                        ) : (
                            <div className="dashboard-avatar">
                                {getInitials(currentUser.name)}
                            </div>
                        )}

                    </div>

                    <div>
                        <h1>Mi perfil</h1>

                        <p>
                            {currentUser.name}
                        </p>

                        <p>
                            Administrá tu cuenta personal, tu perfil profesional,
                            tus postulaciones y tus clasificados.
                        </p>
                    </div>

                </div>

                <div className="dashboard-actions">

                    <button
                        className="apply-button"
                        onClick={() => setEditPersonalMode(!editPersonalMode)}
                    >
                        {editPersonalMode ? "Cerrar edición" : "Editar perfil"}
                    </button>

                    {!professionalIsActive && !isClub && (
                        <button
                            className="apply-button"
                            onClick={handleActivateProfessionalProfile}
                        >
                            Activar perfil profesional
                        </button>
                    )}

                    {professionalIsActive && !isClub && (
                        <button
                            className="apply-button"
                            onClick={() => setEditProfessionalMode(!editProfessionalMode)}
                        >
                            {editProfessionalMode ? "Cerrar profesional" : "Editar profesional"}
                        </button>
                    )}

                    {isSuperadmin && (
                        <button
                            className="apply-button"
                            onClick={() => navigate("/superadmin")}
                        >
                            Panel superadmin
                        </button>
                    )}

                    {isOrganizationAdmin && (
                        <button
                            className="apply-button"
                            onClick={() => navigate("/organization-admin")}
                        >
                            Mi organización
                        </button>
                    )}

                    {isClub && currentUser.clubId && (
                        <button
                            className="apply-button"
                            onClick={() =>
                                navigate(`/club-dashboard/${currentUser.clubId}`)
                            }
                        >
                            Mi organización
                        </button>
                    )}

                    {!isClub && (
                        <button
                            className="apply-button"
                            onClick={() => navigate("/classifieds/new")}
                        >
                            Publicar clasificado
                        </button>
                    )}

                </div>

            </div>

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <h2>{professionalIsActive ? "Sí" : "No"}</h2>
                    <p>Perfil profesional activo</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{applications.length}</h2>
                    <p>Postulaciones enviadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{classifieds.length}</h2>
                    <p>Clasificados publicados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{currentUser.profiles?.length || 1}</h2>
                    <p>Perfiles en tu cuenta</p>
                </div>

            </div>

            {editPersonalMode && (
                <div className="detail-card">

                    <div className="section-header">
                        <h2>Editar perfil personal</h2>
                    </div>

                    <form onSubmit={handleSavePersonalProfile}>

                        <label>Foto de perfil</label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                        />

                        <label>Nombre completo *</label>

                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />

                        <label>Teléfono / WhatsApp</label>

                        <input
                            type="text"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                        />

                        <label>Ciudad</label>

                        <input
                            type="text"
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                        />

                        <label>País</label>

                        <select
                            value={country}
                            onChange={(event) => setCountry(event.target.value)}
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

                        <label>Descripción personal</label>

                        <textarea
                            rows="5"
                            placeholder="Contá brevemente quién sos, tu relación con la náutica o qué tipo de participación te interesa."
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />

                        {formMessage && (
                            <p style={{ color: "#067647" }}>
                                {formMessage}
                            </p>
                        )}

                        <div className="dashboard-actions">

                            <button
                                type="button"
                                className="reject-button"
                                onClick={() => setEditPersonalMode(false)}
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

            <div className="detail-card">

                <div className="section-header">
                    <h2>Perfil personal</h2>
                </div>

                <p>
                    <strong>Nombre:</strong>{" "}
                    {currentUser.name}
                </p>

                <p>
                    <strong>Email:</strong>{" "}
                    {currentUser.email}
                </p>

                <p>
                    <strong>Teléfono:</strong>{" "}
                    {currentUser.phone || "No informado"}
                </p>

                <p>
                    <strong>Ubicación:</strong>{" "}
                    {
                        [currentUser.city, currentUser.country]
                            .filter(Boolean)
                            .join(", ") ||
                        "No informada"
                    }
                </p>

                <p>
                    <strong>Descripción:</strong>
                </p>

                <p>
                    {currentUser.description || "No informada"}
                </p>

                {(isSuperadmin || isOrganizationAdmin) && (
                    <p>
                        <strong>Permisos:</strong>{" "}
                        {currentUser.permissions?.join(", ") || "Sin permisos especiales"}
                    </p>
                )}

            </div>

            {!isClub && (
                <div className="detail-card">

                    <div className="section-header">
                        <h2>Perfil profesional náutico</h2>
                    </div>

                    {!professionalIsActive ? (
                        <>
                            <p>
                                Podés activar un perfil profesional dentro de esta
                                misma cuenta. Vas a seguir teniendo tu perfil
                                personal, clasificados e historial.
                            </p>

                            <button
                                className="apply-button"
                                onClick={handleActivateProfessionalProfile}
                            >
                                Activar perfil profesional
                            </button>
                        </>
                    ) : (
                        <>
                            {editProfessionalMode && (
                                <form onSubmit={handleSaveProfessionalProfile}>

                                    <label>Título profesional *</label>

                                    <input
                                        type="text"
                                        placeholder="Ejemplo: Coach ILCA / Race Officer / Profesional náutico"
                                        value={professionalTitle}
                                        onChange={(event) =>
                                            setProfessionalTitle(event.target.value)
                                        }
                                    />

                                    <label>Resumen profesional *</label>

                                    <textarea
                                        rows="6"
                                        placeholder="Contá tu experiencia, clases, tipo de trabajo que buscás y fortalezas principales."
                                        value={summary}
                                        onChange={(event) =>
                                            setSummary(event.target.value)
                                        }
                                    />

                                    <label>Especialidades</label>

                                    <input
                                        type="text"
                                        placeholder="Ejemplo: ILCA, Optimist, táctica, entrenamiento juvenil, race management"
                                        value={specialtiesText}
                                        onChange={(event) =>
                                            setSpecialtiesText(event.target.value)
                                        }
                                    />

                                    <label>Certificaciones</label>

                                    <input
                                        type="text"
                                        placeholder="Ejemplo: World Sailing Level 1, RCP, licencia náutica"
                                        value={certificationsText}
                                        onChange={(event) =>
                                            setCertificationsText(event.target.value)
                                        }
                                    />

                                    <label>Experiencia</label>

                                    <textarea
                                        rows="6"
                                        placeholder="Escribí una experiencia por línea."
                                        value={experienceText}
                                        onChange={(event) =>
                                            setExperienceText(event.target.value)
                                        }
                                    />

                                    <label>Idiomas</label>

                                    <input
                                        type="text"
                                        placeholder="Ejemplo: Español, Inglés, Portugués"
                                        value={languagesText}
                                        onChange={(event) =>
                                            setLanguagesText(event.target.value)
                                        }
                                    />

                                    <label>Disponibilidad</label>

                                    <input
                                        type="text"
                                        placeholder="Ejemplo: temporada de verano, fines de semana, disponibilidad internacional"
                                        value={availability}
                                        onChange={(event) =>
                                            setAvailability(event.target.value)
                                        }
                                    />

                                    <label>Teléfono profesional</label>

                                    <input
                                        type="text"
                                        value={professionalPhone}
                                        onChange={(event) =>
                                            setProfessionalPhone(event.target.value)
                                        }
                                    />

                                    <label>Ciudad</label>

                                    <input
                                        type="text"
                                        value={professionalCity}
                                        onChange={(event) =>
                                            setProfessionalCity(event.target.value)
                                        }
                                    />

                                    <label>País</label>

                                    <select
                                        value={professionalCountry}
                                        onChange={(event) =>
                                            setProfessionalCountry(event.target.value)
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

                                    <label>CV / résumé</label>

                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleCvChange}
                                    />

                                    {cvFileName && (
                                        <p>
                                            Archivo cargado:{" "}
                                            <strong>{cvFileName}</strong>
                                        </p>
                                    )}

                                    <label>Link público al CV</label>

                                    <input
                                        type="url"
                                        placeholder="Ejemplo: link de Google Drive, Dropbox o portfolio"
                                        value={cvUrl}
                                        onChange={(event) =>
                                            setCvUrl(event.target.value)
                                        }
                                    />

                                    <p className="password-help">
                                        Mientras usemos localStorage, el archivo queda
                                        guardado solo como nombre. Para que una
                                        organización pueda abrirlo, agregá un link
                                        público.
                                    </p>

                                    {formMessage && (
                                        <p style={{ color: "#067647" }}>
                                            {formMessage}
                                        </p>
                                    )}

                                    <div className="dashboard-actions">

                                        <button
                                            type="button"
                                            className="reject-button"
                                            onClick={() => setEditProfessionalMode(false)}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="accept-button"
                                        >
                                            Guardar perfil profesional
                                        </button>

                                    </div>

                                </form>
                            )}

                            {!editProfessionalMode && (
                                <>
                                    <p>
                                        <strong>Título:</strong>{" "}
                                        {currentUser.professionalProfile?.title || "No informado"}
                                    </p>

                                    <p>
                                        <strong>Resumen:</strong>
                                    </p>

                                    <p>
                                        {currentUser.professionalProfile?.summary || "No informado"}
                                    </p>

                                    <p>
                                        <strong>Especialidades:</strong>{" "}
                                        {
                                            currentUser.professionalProfile?.specialties?.join(", ") ||
                                            "No informadas"
                                        }
                                    </p>

                                    <p>
                                        <strong>Certificaciones:</strong>{" "}
                                        {
                                            currentUser.professionalProfile?.certifications?.join(", ") ||
                                            "No informadas"
                                        }
                                    </p>

                                    <p>
                                        <strong>Idiomas:</strong>{" "}
                                        {
                                            currentUser.professionalProfile?.languages?.join(", ") ||
                                            "No informados"
                                        }
                                    </p>

                                    <p>
                                        <strong>Disponibilidad:</strong>{" "}
                                        {
                                            currentUser.professionalProfile?.availability ||
                                            "No informada"
                                        }
                                    </p>

                                    <p>
                                        <strong>CV:</strong>{" "}
                                        {
                                            currentUser.professionalProfile?.cvFileName ||
                                            "No cargado"
                                        }
                                    </p>

                                    {currentUser.professionalProfile?.cvUrl && (
                                        <a
                                            href={currentUser.professionalProfile.cvUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="apply-button"
                                        >
                                            Abrir CV
                                        </a>
                                    )}
                                </>
                            )}
                        </>
                    )}

                </div>
            )}

            <div className="detail-card">

                <div className="section-header">

                    <h2>Mis postulaciones</h2>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/jobs")}
                    >
                        Buscar oportunidades
                    </button>

                </div>

                {applications.length > 0 ? (
                    <div className="dashboard-grid">

                        {applications.map(application => {
                            const job = getJob(application.jobId);
                            const club = job ? getClub(job.clubId) : null;

                            return (
                                <div
                                    key={application.id}
                                    className="dashboard-card"
                                >
                                    <div className="event-card-top">
                                        <span className={getStatusClass(application.status)}>
                                            {application.status || "Pendiente"}
                                        </span>
                                    </div>

                                    <h3>
                                        {job ? job.title : "Oportunidad no encontrada"}
                                    </h3>

                                    <p>
                                        <strong>Organización:</strong>{" "}
                                        {club ? club.name : "No encontrada"}
                                    </p>

                                    <p>
                                        <strong>Fecha:</strong>{" "}
                                        {formatDate(application.createdAt)}
                                    </p>

                                    <button
                                        className="apply-button"
                                        onClick={() =>
                                            navigate(`/applicant/${application.id}`)
                                        }
                                    >
                                        Ver postulación
                                    </button>
                                </div>
                            );
                        })}

                    </div>
                ) : (
                    <p>
                        Todavía no enviaste postulaciones.
                    </p>
                )}

            </div>

            <div className="detail-card">

                <div className="section-header">

                    <h2>Mis clasificados</h2>

                    {!isClub && (
                        <button
                            className="small-action-button"
                            onClick={() => navigate("/classifieds/new")}
                        >
                            Nuevo clasificado
                        </button>
                    )}

                </div>

                {classifieds.length > 0 ? (
                    <div className="dashboard-grid">

                        {classifieds.map(item => (
                            <div
                                key={item.id}
                                className="dashboard-card"
                            >
                                <h3>{item.title}</h3>

                                <p>
                                    <strong>Precio:</strong>{" "}
                                    {item.price || "A consultar"}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {item.city}, {item.country}
                                </p>

                                <button
                                    className="apply-button"
                                    onClick={() =>
                                        navigate(`/classifieds/${item.id}`)
                                    }
                                >
                                    Ver clasificado
                                </button>
                            </div>
                        ))}

                    </div>
                ) : (
                    <p>
                        Todavía no publicaste clasificados.
                    </p>
                )}

            </div>

            <div className="detail-card">

                <div className="section-header">
                    <h2>Oportunidades recomendadas</h2>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/jobs")}
                    >
                        Ver todas
                    </button>
                </div>

                <div className="dashboard-grid">

                    {jobs.slice(0, 3).map(job => {
                        const club = getClub(job.clubId);

                        return (
                            <div
                                key={job.id}
                                className="dashboard-card"
                            >
                                <div className="event-card-top">
                                    <span className="sidebar-tag">
                                        {getOpportunityTypeLabel(job.opportunityType)}
                                    </span>

                                    <span className="status-pill pending">
                                        {job.category}
                                    </span>
                                </div>

                                <h3>{job.title}</h3>

                                <p>
                                    <strong>Organización:</strong>{" "}
                                    {club ? club.name : "No encontrada"}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {job.city}, {job.country}
                                </p>

                                <p>
                                    <strong>Compensación:</strong>{" "}
                                    {getCompensationLabel(job)}
                                </p>

                                <button
                                    className="apply-button"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    Ver oportunidad
                                </button>
                            </div>
                        );
                    })}

                </div>

            </div>

        </div>
    );
}

export default Profile;