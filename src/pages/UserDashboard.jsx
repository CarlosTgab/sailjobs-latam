import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    COUNTRIES
} from "../config/appConfig";

import {
    getCurrentUser,
    updateCurrentUserProfile,
    activateProfessionalProfile,
    hasProfessionalProfile,
    hasProfile
} from "../utils/authStorage";

import {
    getAllClassifieds
} from "../utils/classifiedsStorage";

import {
    getApplications
} from "../utils/applicationsStorage";

function UserDashboard() {
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(getCurrentUser());

    const [editMode, setEditMode] = useState(false);

    const [name, setName] = useState(currentUser?.name || "");
    const [phone, setPhone] = useState(currentUser?.phone || "");
    const [city, setCity] = useState(currentUser?.city || "");
    const [country, setCountry] = useState(currentUser?.country || "");
    const [description, setDescription] = useState(currentUser?.description || "");
    const [profileImage, setProfileImage] = useState(currentUser?.profileImage || "");
    const [formMessage, setFormMessage] = useState("");

    if (!currentUser || !hasProfile(currentUser, "user")) {
        return (
            <div className="dashboard-page">
                <h1>Perfil personal no disponible</h1>

                <p>
                    Para acceder a esta sección necesitás iniciar sesión con una
                    cuenta personal.
                </p>

                <button
                    className="apply-button"
                    onClick={() => navigate("/login")}
                >
                    Iniciar sesión
                </button>
            </div>
        );
    }

    const professionalIsActive = hasProfessionalProfile(currentUser);

    const classifieds = getAllClassifieds()
        .filter(item => sameId(item.userId, currentUser.id));

    const applications = getApplications()
        .filter(application => sameId(application.userId, currentUser.id));

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

    function handleSaveProfile(event) {
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
        setEditMode(false);
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

        navigate("/coach-dashboard");
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
                        <h1>Perfil personal</h1>

                        <p>{currentUser.name}</p>

                        <p>
                            Desde acá administrás tu cuenta personal,
                            clasificados, participación en voluntariados y tu
                            perfil profesional náutico.
                        </p>
                    </div>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => setEditMode(!editMode)}
                    >
                        {editMode ? "Cerrar edición" : "Editar perfil"}
                    </button>

                    {professionalIsActive ? (
                        <button
                            className="apply-button"
                            onClick={() => navigate("/coach-dashboard")}
                        >
                            Perfil profesional
                        </button>
                    ) : (
                        <button
                            className="apply-button"
                            onClick={handleActivateProfessionalProfile}
                        >
                            Activar perfil profesional
                        </button>
                    )}

                    <button
                        className="apply-button"
                        onClick={() => navigate("/classifieds/new")}
                    >
                        Publicar clasificado
                    </button>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{professionalIsActive ? "Sí" : "No"}</h2>
                    <p>Perfil profesional activo</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{classifieds.length}</h2>
                    <p>Clasificados publicados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{applications.length}</h2>
                    <p>Postulaciones enviadas</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{currentUser.profiles?.length || 1}</h2>
                    <p>Perfiles en tu cuenta</p>
                </div>
            </div>

            {editMode && (
                <div className="detail-card">
                    <div className="section-header">
                        <h2>Editar perfil personal</h2>
                    </div>

                    <form onSubmit={handleSaveProfile}>
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
                                onClick={() => setEditMode(false)}
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
                        <h2>Información personal</h2>
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
                </div>
            )}

            <div className="detail-card">
                <div className="section-header">
                    <h2>Perfil profesional náutico</h2>
                </div>

                {professionalIsActive ? (
                    <>
                        <p>
                            Tu perfil profesional está activo. Podés usarlo para
                            postularte a trabajos profesionales, cargos técnicos
                            de campeonato y otras oportunidades que requieran
                            experiencia náutica.
                        </p>

                        <button
                            className="apply-button"
                            onClick={() => navigate("/coach-dashboard")}
                        >
                            Ir a mi perfil profesional
                        </button>
                    </>
                ) : (
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
                )}
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>Mis clasificados</h2>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/classifieds/new")}
                    >
                        Nuevo clasificado
                    </button>
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
                                    onClick={() => navigate(`/classifieds/${item.id}`)}
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
        </div>
    );
}

export default UserDashboard;