import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    fetchProfessionalSportHistory,
    fetchPublicProfessionals
} from "../utils/professionalsStorage";

function getInitials(name) {
    return String(name || "P")
        .split(" ")
        .filter(Boolean)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function ProfessionalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [sportHistory, setSportHistory] = useState([]);
    const [historyError, setHistoryError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadProfile() {
            try {
                const professionals = await fetchPublicProfessionals();
                const selectedProfile = professionals.find(item => String(item.id) === String(id));

                if (isMounted) setProfile(selectedProfile || null);

                if (selectedProfile) {
                    try {
                        const history = await fetchProfessionalSportHistory(selectedProfile.id);
                        if (isMounted) setSportHistory(history);
                    } catch {
                        if (isMounted) {
                            setHistoryError("El historial deportivo no está disponible temporalmente.");
                        }
                    }
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError?.message || "No se pudo cargar el perfil.");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadProfile();
        return () => { isMounted = false; };
    }, [id]);

    if (isLoading) {
        return <div className="event-detail"><div className="detail-card"><p>Cargando perfil...</p></div></div>;
    }

    if (!profile || error) {
        return (
            <div className="event-detail">
                <div className="detail-card">
                    <h1>Perfil no encontrado</h1>
                    <p>{error || "Este perfil profesional no está disponible públicamente."}</p>
                    <button className="back-button" onClick={() => navigate("/professionals")}>
                        ← Volver a profesionales
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="event-detail">
            <button className="back-button" onClick={() => navigate("/professionals")}>
                ← Volver a profesionales
            </button>

            <div className="detail-card professional-detail-hero">
                {profile.profileImage ? (
                    <img src={profile.profileImage} alt={profile.name} className="professional-detail-avatar" />
                ) : (
                    <div className="professional-detail-avatar professional-initials">
                        {getInitials(profile.name)}
                    </div>
                )}

                <div>
                    <span className="sidebar-tag">Profesional náutico</span>
                    <h1>{profile.name}</h1>
                    <h2>{profile.title}</h2>
                    <p>{[profile.city, profile.country].filter(Boolean).join(", ") || "Ubicación no informada"}</p>
                    <p><strong>Disponibilidad:</strong> {profile.availability || "A consultar"}</p>
                </div>
            </div>

            <div className="detail-card">
                <div className="section-header"><h2>Presentación</h2></div>
                <p>{profile.summary || "Sin presentación cargada."}</p>
            </div>

            <div className="detail-card">
                <div className="section-header"><h2>Roles y especialidades</h2></div>
                <div className="professional-tags">
                    {profile.specialties.length > 0
                        ? profile.specialties.map(item => <span className="sidebar-tag" key={item}>{item}</span>)
                        : <p>No informados.</p>}
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="detail-card">
                    <h2>Certificaciones</h2>
                    {profile.certifications.length > 0
                        ? <ul>{profile.certifications.map(item => <li key={item}>{item}</li>)}</ul>
                        : <p>No informadas.</p>}
                </div>

                <div className="detail-card">
                    <h2>Idiomas</h2>
                    {profile.languages.length > 0
                        ? <ul>{profile.languages.map(item => <li key={item}>{item}</li>)}</ul>
                        : <p>No informados.</p>}
                </div>
            </div>

            <div className="detail-card">
                <div className="section-header"><h2>Experiencia</h2></div>
                {profile.experience.length > 0
                    ? <ul>{profile.experience.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                    : <p>No informada.</p>}
            </div>

            <div className="detail-card professional-sport-history">
                <div className="section-header">
                    <div>
                        <h2>Resultados y ranking</h2>
                        <p>Antecedentes vinculados con rankings publicados en SailJobs.</p>
                    </div>
                </div>

                {historyError && <p>{historyError}</p>}

                {!historyError && sportHistory.length === 0 && (
                    <p>Todavía no hay resultados vinculados con este perfil.</p>
                )}

                {sportHistory.length > 0 && (
                    <div className="ranking-table-wrapper">
                        <table className="ranking-table">
                            <thead>
                                <tr>
                                    <th>Ranking</th>
                                    <th>Clase</th>
                                    <th>Posición</th>
                                    <th>Club</th>
                                    <th>Puntos netos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sportHistory.map(result => (
                                    <tr key={`${result.id}-${result.rankingDate}`}>
                                        <td>
                                            <strong>{result.rankingTitle}</strong>
                                            {result.rankingDate && (
                                                <small className="sport-history-date">
                                                    {new Date(result.rankingDate).toLocaleDateString("es-AR")}
                                                </small>
                                            )}
                                        </td>
                                        <td>{result.className || "—"}</td>
                                        <td><strong>#{result.position}</strong></td>
                                        <td>{result.club || "—"}</td>
                                        <td>{result.netPoints ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="detail-card">
                <p>
                    Por privacidad, el teléfono y el CV no se muestran públicamente.
                    Las organizaciones acceden a esos datos únicamente cuando reciben una postulación.
                </p>
            </div>
        </div>
    );
}

export default ProfessionalDetail;
