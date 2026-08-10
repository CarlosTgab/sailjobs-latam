import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchPublicProfessionals } from "../utils/professionalsStorage";
import {
    getLatestPublishedRanking,
    getRankingProfileLinks,
    removeRankingProfileLink,
    saveRankingProfileLink
} from "../utils/rankingStorage";

function normalizeIdentity(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function getIdentityKey(name, club) {
    return `${normalizeIdentity(name)}::${normalizeIdentity(club)}`;
}

function getInitials(name) {
    return String(name || "P")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "P";
}

function getUniqueRankingIdentities(entries) {
    const identities = new Map();

    entries.forEach(entry => {
        const key = getIdentityKey(entry.name, entry.club);
        const current = identities.get(key);

        if (current) {
            current.classes.add(entry.className);
            return;
        }

        identities.set(key, {
            key,
            name: entry.name,
            club: entry.club,
            classes: new Set([entry.className].filter(Boolean))
        });
    });

    return [...identities.values()]
        .map(identity => ({
            ...identity,
            classes: [...identity.classes].sort()
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function AdminRankingProfiles() {
    const navigate = useNavigate();

    const [identities, setIdentities] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [links, setLinks] = useState([]);
    const [draftProfileIds, setDraftProfileIds] = useState({});
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [latestRanking, publicProfessionals, profileLinks] =
                    await Promise.all([
                        getLatestPublishedRanking(),
                        fetchPublicProfessionals(),
                        getRankingProfileLinks()
                    ]);

                if (!isMounted) return;

                const rankingIdentities = getUniqueRankingIdentities(
                    latestRanking?.entries || []
                );
                const initialDrafts = {};

                profileLinks.forEach(link => {
                    initialDrafts[
                        getIdentityKey(link.rankingName, link.rankingClub)
                    ] = link.profileId;
                });

                setIdentities(rankingIdentities);
                setProfessionals(
                    [...publicProfessionals].sort((a, b) =>
                        a.name.localeCompare(b.name, "es")
                    )
                );
                setLinks(profileLinks);
                setDraftProfileIds(initialDrafts);
            } catch (error) {
                if (!isMounted) return;

                setErrorMessage(
                    error.message ||
                    "No se pudieron cargar los vínculos. Ejecutá primero el SQL de fase 3 en Supabase."
                );
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    const linksByKey = useMemo(() => {
        const result = new Map();

        links.forEach(link => {
            result.set(
                getIdentityKey(link.rankingName, link.rankingClub),
                link
            );
        });

        return result;
    }, [links]);

    const filteredIdentities = useMemo(() => {
        const normalizedSearch = normalizeIdentity(search);

        return identities.filter(identity => {
            const link = linksByKey.get(identity.key);
            const searchableText = normalizeIdentity(
                `${identity.name} ${identity.club} ${identity.classes.join(" ")}`
            );

            const matchesSearch =
                !normalizedSearch || searchableText.includes(normalizedSearch);
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "linked" && Boolean(link)) ||
                (statusFilter === "pending" && !link);

            return matchesSearch && matchesStatus;
        });
    }, [identities, linksByKey, search, statusFilter]);

    const linkedCount = useMemo(
        () => identities.filter(identity => linksByKey.has(identity.key)).length,
        [identities, linksByKey]
    );

    async function handleSave(identity) {
        const selectedProfileId = draftProfileIds[identity.key];

        setMessage("");
        setErrorMessage("");

        if (!selectedProfileId) {
            setErrorMessage("Seleccioná un perfil profesional antes de guardar.");
            return;
        }

        setBusyKey(identity.key);

        try {
            await saveRankingProfileLink({
                rankingName: identity.name,
                rankingClub: identity.club,
                profileId: selectedProfileId
            });

            const updatedLinks = await getRankingProfileLinks();
            setLinks(updatedLinks);
            setMessage(
                `Vínculo guardado: ${identity.name} ya apunta al perfil seleccionado.`
            );
        } catch (error) {
            setErrorMessage(
                error.message || "No se pudo guardar el vínculo."
            );
        } finally {
            setBusyKey("");
        }
    }

    async function handleRemove(identity) {
        const currentLink = linksByKey.get(identity.key);

        if (!currentLink) return;

        const confirmed = window.confirm(
            `¿Quitar el vínculo profesional de ${identity.name}?`
        );

        if (!confirmed) return;

        setMessage("");
        setErrorMessage("");
        setBusyKey(identity.key);

        try {
            await removeRankingProfileLink(currentLink.id);

            setLinks(currentLinks =>
                currentLinks.filter(link => link.id !== currentLink.id)
            );
            setDraftProfileIds(currentDrafts => ({
                ...currentDrafts,
                [identity.key]: ""
            }));
            setMessage(`Se quitó el vínculo de ${identity.name}.`);
        } catch (error) {
            setErrorMessage(
                error.message || "No se pudo quitar el vínculo."
            );
        } finally {
            setBusyKey("");
        }
    }

    return (
        <div className="dashboard-page ranking-links-page">
            <button
                className="back-button"
                onClick={() => navigate("/superadmin")}
            >
                ← Volver al panel admin
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Perfiles en el ranking</h1>

                    <p>
                        Asociá cada identidad del ranking con su perfil profesional.
                        El vínculo se conserva en próximas importaciones mientras
                        coincidan el nombre y el club.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/admin/ranking")}
                    >
                        Actualizar ranking
                    </button>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/ranking")}
                    >
                        Ver ranking público
                    </button>
                </div>
            </div>

            <div className="ranking-note">
                <p>
                    <strong>Importante:</strong> vinculá sólo coincidencias seguras.
                    SailJobs no relaciona automáticamente nombres parecidos para
                    evitar mostrar la foto o el perfil de otra persona.
                </p>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{identities.length}</h2>
                    <p>Identidades en el ranking</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{linkedCount}</h2>
                    <p>Perfiles vinculados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{Math.max(identities.length - linkedCount, 0)}</h2>
                    <p>Pendientes</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{professionals.length}</h2>
                    <p>Profesionales disponibles</p>
                </div>
            </div>

            <div className="calendar-filters ranking-links-filters">
                <input
                    type="search"
                    placeholder="Buscar timonel, club o clase..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value)}
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Sin vincular</option>
                    <option value="linked">Vinculados</option>
                </select>

                <button
                    className="filter-clear-button"
                    onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                    }}
                >
                    Limpiar filtros
                </button>
            </div>

            {message && (
                <p className="status-pill approved ranking-links-message">
                    {message}
                </p>
            )}

            {errorMessage && (
                <p className="status-pill rejected ranking-links-message">
                    {errorMessage}
                </p>
            )}

            <div className="detail-card">
                <div className="ranking-table-header">
                    <h2>Vinculación manual</h2>

                    <p>{filteredIdentities.length} resultados</p>
                </div>

                {isLoading ? (
                    <p>Cargando ranking y perfiles profesionales...</p>
                ) : filteredIdentities.length > 0 ? (
                    <div className="ranking-table-wrapper">
                        <table className="ranking-table ranking-links-table">
                            <thead>
                                <tr>
                                    <th>Timonel del ranking</th>
                                    <th>Club</th>
                                    <th>Clase</th>
                                    <th>Perfil profesional</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredIdentities.map(identity => {
                                    const currentLink = linksByKey.get(identity.key);
                                    const selectedProfileId =
                                        draftProfileIds[identity.key] || "";
                                    const selectedProfessional = professionals.find(
                                        professional =>
                                            professional.id === selectedProfileId
                                    );
                                    const isBusy = busyKey === identity.key;

                                    return (
                                        <tr key={identity.key}>
                                            <td>
                                                <strong>{identity.name}</strong>

                                                <span className={
                                                    currentLink
                                                        ? "ranking-link-status linked"
                                                        : "ranking-link-status pending"
                                                }>
                                                    {currentLink
                                                        ? "Vinculado"
                                                        : "Sin vincular"}
                                                </span>
                                            </td>

                                            <td>{identity.club || "Sin club"}</td>

                                            <td>
                                                {identity.classes.join(", ") || "—"}
                                            </td>

                                            <td>
                                                <div className="ranking-link-profile-picker">
                                                    {selectedProfessional?.profileImage ? (
                                                        <img
                                                            className="ranking-profile-avatar compact"
                                                            src={selectedProfessional.profileImage}
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <span className="ranking-profile-avatar compact ranking-profile-initials">
                                                            {getInitials(
                                                                selectedProfessional?.name
                                                            )}
                                                        </span>
                                                    )}

                                                    <select
                                                        aria-label={`Perfil profesional para ${identity.name}`}
                                                        value={selectedProfileId}
                                                        onChange={event =>
                                                            setDraftProfileIds(current => ({
                                                                ...current,
                                                                [identity.key]: event.target.value
                                                            }))
                                                        }
                                                    >
                                                        <option value="">
                                                            Seleccionar profesional...
                                                        </option>

                                                        {professionals.map(professional => (
                                                            <option
                                                                key={professional.id}
                                                                value={professional.id}
                                                            >
                                                                {professional.name}
                                                                {professional.title
                                                                    ? ` — ${professional.title}`
                                                                    : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {currentLink && !currentLink.profileActive && (
                                                    <small className="ranking-link-warning">
                                                        El perfil vinculado ya no está activo.
                                                    </small>
                                                )}
                                            </td>

                                            <td>
                                                <div className="status-actions ranking-link-actions">
                                                    <button
                                                        className="accept-button"
                                                        type="button"
                                                        disabled={isBusy || !selectedProfileId}
                                                        onClick={() => handleSave(identity)}
                                                    >
                                                        {isBusy ? "Guardando..." : "Guardar"}
                                                    </button>

                                                    {currentLink && (
                                                        <button
                                                            className="reject-button"
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => handleRemove(identity)}
                                                        >
                                                            Quitar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : identities.length === 0 && !errorMessage ? (
                    <p>
                        Todavía no hay un ranking publicado. Publicalo primero desde
                        “Actualizar ranking”.
                    </p>
                ) : (
                    <p>No hay identidades que coincidan con los filtros.</p>
                )}
            </div>
        </div>
    );
}

export default AdminRankingProfiles;
