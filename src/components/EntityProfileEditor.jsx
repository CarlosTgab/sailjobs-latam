import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { COUNTRIES } from "../config/appConfig";
import { saveEntityProfileWithSupabase } from "../utils/supabaseAuth";
import {
    removeProfileMedia,
    uploadProfileMedia
} from "../utils/profileMediaStorage";

function EntityProfileEditor({ currentUser, onUpdated }) {
    const navigate = useNavigate();
    const entityId =
        currentUser.entityId ||
        currentUser.organizationId ||
        currentUser.clubId ||
        "";
    const entityProfile = currentUser.entityProfile || {};
    const isOrganization = currentUser.entityType === "organization";

    const [name, setName] = useState(
        entityProfile.name ||
        currentUser.entityName ||
        currentUser.organizationName ||
        currentUser.clubName ||
        ""
    );
    const [description, setDescription] = useState(entityProfile.description || "");
    const [website, setWebsite] = useState(entityProfile.website || "");
    const [city, setCity] = useState(entityProfile.city || currentUser.city || "");
    const [country, setCountry] = useState(entityProfile.country || currentUser.country || "");
    const [logoUrl, setLogoUrl] = useState(entityProfile.logoUrl || "");
    const [logoFile, setLogoFile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [hasError, setHasError] = useState(false);

    const dashboardPath = isOrganization
        ? "/organization-admin"
        : `/club-dashboard/${entityId}`;

    function handleLogoChange(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = () => setLogoUrl(String(reader.result || ""));
        reader.readAsDataURL(file);
    }

    async function handleSave(event) {
        event.preventDefault();

        if (!name.trim()) {
            setHasError(true);
            setMessage("El nombre institucional es obligatorio.");
            return;
        }

        const previousLogoUrl = entityProfile.logoUrl || "";
        let nextLogoUrl = logoUrl;
        let uploadedLogoUrl = "";

        setIsSaving(true);
        setMessage("");
        setHasError(false);

        try {
            if (logoFile) {
                const uploadedLogo = await uploadProfileMedia(
                    logoFile,
                    currentUser.id,
                    "logo"
                );
                nextLogoUrl = uploadedLogo.publicUrl;
                uploadedLogoUrl = uploadedLogo.publicUrl;
            }

            const updatedUser = await saveEntityProfileWithSupabase({
                id: entityId,
                name,
                description,
                website,
                city,
                country,
                logoUrl: nextLogoUrl
            });

            if (previousLogoUrl && previousLogoUrl !== nextLogoUrl) {
                try {
                    await removeProfileMedia(previousLogoUrl);
                } catch {
                    // La actualización principal ya fue guardada.
                }
            }

            setLogoUrl(updatedUser.entityProfile?.logoUrl || nextLogoUrl);
            setLogoFile(null);
            setMessage("Perfil institucional actualizado correctamente.");
            setIsEditing(false);
            onUpdated?.(updatedUser);
        } catch (error) {
            if (uploadedLogoUrl) {
                try {
                    await removeProfileMedia(uploadedLogoUrl);
                } catch {
                    // Limpieza de mejor esfuerzo.
                }
            }

            setHasError(true);
            setMessage(
                error?.message ||
                "No se pudo guardar el perfil institucional."
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-hero">
                <div className="dashboard-hero-info">
                    <img
                        src={logoUrl || "/logos/default-club.svg"}
                        alt={name}
                        className="dashboard-club-logo"
                    />

                    <div>
                        <h1>{name || "Mi organización"}</h1>
                        <p>{isOrganization ? "Organización náutica" : "Club náutico"}</p>
                        <p>{[city, country].filter(Boolean).join(", ") || "Ubicación no informada"}</p>
                    </div>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => setIsEditing(value => !value)}
                    >
                        {isEditing ? "Cerrar edición" : "Editar perfil institucional"}
                    </button>
                    <button
                        className="small-action-button"
                        onClick={() => navigate(dashboardPath)}
                    >
                        Ir al panel
                    </button>
                    {entityId && (
                        <button
                            className="small-action-button"
                            onClick={() => navigate(`/clubs/${entityId}`)}
                        >
                            Ver perfil público
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <div className="detail-card">
                    <p style={{ color: hasError ? "#b42318" : "#067647" }}>
                        {message}
                    </p>
                </div>
            )}

            {isEditing && (
                <div className="detail-card">
                    <div className="section-header">
                        <h2>Datos institucionales</h2>
                    </div>

                    <form onSubmit={handleSave}>
                        <label>Logo</label>
                        <input type="file" accept="image/*" onChange={handleLogoChange} />

                        <label>Nombre *</label>
                        <input value={name} onChange={event => setName(event.target.value)} />

                        <label>Descripción</label>
                        <textarea
                            rows="5"
                            value={description}
                            onChange={event => setDescription(event.target.value)}
                        />

                        <label>Sitio web</label>
                        <input
                            type="url"
                            placeholder="https://..."
                            value={website}
                            onChange={event => setWebsite(event.target.value)}
                        />

                        <label>Ciudad</label>
                        <input value={city} onChange={event => setCity(event.target.value)} />

                        <label>País</label>
                        <select value={country} onChange={event => setCountry(event.target.value)}>
                            <option value="">Seleccionar país</option>
                            {COUNTRIES.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>

                        <div className="dashboard-actions">
                            <button
                                type="button"
                                className="reject-button"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="accept-button"
                                disabled={isSaving}
                            >
                                {isSaving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="detail-card">
                <div className="section-header"><h2>Perfil público</h2></div>
                <p><strong>Descripción:</strong> {description || "No informada"}</p>
                <p><strong>Web:</strong> {website || "No informada"}</p>
                <p><strong>Administrador:</strong> {currentUser.email}</p>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate(`/club-dashboard/${entityId}/new-job`)}
                    >
                        Publicar oportunidad
                    </button>
                    <button className="apply-button" onClick={() => navigate("/professionals")}>
                        Buscar profesionales
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EntityProfileEditor;
