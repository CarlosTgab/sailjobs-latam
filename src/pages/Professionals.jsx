import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    COUNTRIES,
    NAUTICAL_PROFILE_ROLES
} from "../config/appConfig";
import { fetchPublicProfessionals } from "../utils/professionalsStorage";

function getInitials(name) {
    return String(name || "P")
        .split(" ")
        .filter(Boolean)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function Professionals() {
    const navigate = useNavigate();
    const [professionals, setProfessionals] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadProfessionals() {
            try {
                const data = await fetchPublicProfessionals();
                if (isMounted) setProfessionals(data);
            } catch (loadError) {
                if (isMounted) {
                    setError(
                        loadError?.message ||
                        "No se pudo cargar el directorio profesional."
                    );
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadProfessionals();
        return () => { isMounted = false; };
    }, []);

    const countries = [...new Set([
        ...COUNTRIES,
        ...professionals.map(profile => profile.country)
    ])].filter(Boolean);

    const filteredProfessionals = professionals.filter(profile => {
        const searchableText = [
            profile.name,
            profile.title,
            profile.summary,
            profile.city,
            profile.country,
            ...profile.specialties,
            ...profile.certifications,
            ...profile.languages
        ].filter(Boolean).join(" ").toLowerCase();

        return (
            (!search || searchableText.includes(search.toLowerCase())) &&
            (!selectedRole || profile.specialties.includes(selectedRole)) &&
            (!selectedCountry || profile.country === selectedCountry)
        );
    });

    function clearFilters() {
        setSearch("");
        setSelectedRole("");
        setSelectedCountry("");
    }

    return (
        <div className="page professionals-page">
            <div className="page-header">
                <div>
                    <h1>Profesionales náuticos</h1>
                    <p>
                        Encontrá coaches, instructores, oficiales, jurados, medidores
                        y otros perfiles de la comunidad náutica latinoamericana.
                    </p>
                </div>
            </div>

            <div className="calendar-filters">
                <input
                    type="text"
                    placeholder="Buscar por nombre, especialidad, certificación o ciudad"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                />

                <select value={selectedRole} onChange={event => setSelectedRole(event.target.value)}>
                    <option value="">Todos los roles</option>
                    {NAUTICAL_PROFILE_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>

                <select value={selectedCountry} onChange={event => setSelectedCountry(event.target.value)}>
                    <option value="">Todos los países</option>
                    {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                    ))}
                </select>

                <button className="filter-clear-button" onClick={clearFilters}>
                    Limpiar filtros
                </button>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{filteredProfessionals.length}</h2>
                    <p>Perfiles encontrados</p>
                </div>
            </div>

            {isLoading && <div className="detail-card"><p>Cargando profesionales...</p></div>}
            {error && <div className="detail-card"><p style={{ color: "#b42318" }}>{error}</p></div>}

            {!isLoading && !error && filteredProfessionals.length > 0 && (
                <div className="dashboard-grid professional-grid">
                    {filteredProfessionals.map(profile => (
                        <article className="dashboard-card professional-card" key={profile.id}>
                            <div className="professional-card-header">
                                {profile.profileImage ? (
                                    <img
                                        src={profile.profileImage}
                                        alt={profile.name}
                                        className="professional-avatar"
                                    />
                                ) : (
                                    <div className="professional-avatar professional-initials">
                                        {getInitials(profile.name)}
                                    </div>
                                )}

                                <div>
                                    <h2>{profile.name}</h2>
                                    <p>{profile.title}</p>
                                </div>
                            </div>

                            <p>{profile.summary || "Perfil profesional activo en SailJobs LATAM."}</p>
                            <p><strong>Ubicación:</strong> {[profile.city, profile.country].filter(Boolean).join(", ") || "No informada"}</p>
                            <p><strong>Disponibilidad:</strong> {profile.availability || "A consultar"}</p>

                            <div className="professional-tags">
                                {profile.specialties.slice(0, 4).map(role => (
                                    <span className="sidebar-tag" key={role}>{role}</span>
                                ))}
                            </div>

                            <button
                                className="apply-button"
                                onClick={() => navigate(`/professionals/${profile.id}`)}
                            >
                                Ver perfil
                            </button>
                        </article>
                    ))}
                </div>
            )}

            {!isLoading && !error && filteredProfessionals.length === 0 && (
                <div className="detail-card">
                    <h2>No se encontraron profesionales</h2>
                    <p>Probá cambiar los filtros o el texto de búsqueda.</p>
                    <button className="back-button" onClick={clearFilters}>Limpiar filtros</button>
                </div>
            )}
        </div>
    );
}

export default Professionals;
