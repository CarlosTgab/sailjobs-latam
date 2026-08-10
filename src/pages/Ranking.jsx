import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import staticRankings from "../data/rankings";
import { getLatestPublishedRanking } from "../utils/rankingStorage";

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function formatDate(date) {
    if (!date) {
        return "";
    }

    return new Date(date).toLocaleDateString(
        "es-AR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function getInitials(name) {
    return String(name || "N")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "N";
}

function RankingAvatar({ sailor, compact = false }) {
    const className = compact
        ? "ranking-profile-avatar compact"
        : "ranking-profile-avatar";

    const avatar = sailor.profileImage ? (
        <img
            className={className}
            src={sailor.profileImage}
            alt={`Foto de ${sailor.profileName || sailor.name}`}
        />
    ) : (
        <span className={`${className} ranking-profile-initials`}>
            {getInitials(sailor.name)}
        </span>
    );

    if (!sailor.profileId) {
        return avatar;
    }

    return (
        <Link
            className="ranking-profile-avatar-link"
            to={`/professionals/${sailor.profileId}`}
            title={`Ver perfil profesional de ${sailor.profileName || sailor.name}`}
        >
            {avatar}
        </Link>
    );
}

function RankingName({ sailor }) {
    if (!sailor.profileId) {
        return <strong>{sailor.name}</strong>;
    }

    return (
        <Link
            className="ranking-profile-name"
            to={`/professionals/${sailor.profileId}`}
        >
            {sailor.name}
            <span>Ver perfil</span>
        </Link>
    );
}

function Ranking() {
    const [search, setSearch] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedClub, setSelectedClub] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [remoteRanking, setRemoteRanking] = useState(null);
    const [isLoadingRanking, setIsLoadingRanking] = useState(true);
    const [rankingError, setRankingError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadRanking() {
            setIsLoadingRanking(true);
            setRankingError("");

            try {
                const latestRanking = await getLatestPublishedRanking();

                if (!isMounted) return;

                if (latestRanking?.entries?.length > 0) {
                    setRemoteRanking(latestRanking);
                }
            } catch {
                if (!isMounted) return;

                setRankingError(
                    "No se pudo cargar el ranking dinámico. Se muestra la versión base."
                );
            } finally {
                if (isMounted) {
                    setIsLoadingRanking(false);
                }
            }
        }

        loadRanking();

        return () => {
            isMounted = false;
        };
    }, []);

    const hasRemoteRanking =
        remoteRanking?.entries?.length > 0;

    const isWaitingForRemoteRanking =
        isLoadingRanking && !hasRemoteRanking;

    const rankings = useMemo(
        () => hasRemoteRanking
            ? remoteRanking.entries
            : isWaitingForRemoteRanking
                ? []
                : staticRankings,
        [
            hasRemoteRanking,
            isWaitingForRemoteRanking,
            remoteRanking
        ]
    );

    const sourceLabel = remoteRanking?.metadata
        ? `Última actualización publicada: ${formatDate(remoteRanking.metadata.createdAt)}${remoteRanking.metadata.sourceType === "url" ? " · Fuente externa" : ""}${remoteRanking.metadata.sourceFileName ? ` · ${remoteRanking.metadata.sourceFileName}` : ""}`
        : "Mostrando ranking base incluido en la beta.";

    const classes = useMemo(
        () => [
            ...new Set(rankings.map(item => item.className).filter(Boolean))
        ].sort(),
        [rankings]
    );

    const clubs = useMemo(
        () => [
            ...new Set(rankings.map(item => item.club).filter(Boolean))
        ].sort(),
        [rankings]
    );

    const categories = useMemo(
        () => [
            ...new Set(rankings.map(item => item.category).filter(Boolean))
        ].sort(),
        [rankings]
    );

    const filteredRankings = useMemo(
        () => rankings
            .filter((item) => {
                const searchText = normalizeText(search);

                const matchesSearch =
                    !searchText ||
                    normalizeText(item.name).includes(searchText) ||
                    normalizeText(item.club).includes(searchText) ||
                    normalizeText(item.category).includes(searchText) ||
                    normalizeText(item.className).includes(searchText);

                const matchesClass =
                    selectedClass === "" ||
                    item.className === selectedClass;

                const matchesClub =
                    selectedClub === "" ||
                    item.club === selectedClub;

                const matchesCategory =
                    selectedCategory === "" ||
                    item.category === selectedCategory;

                return matchesSearch && matchesClass && matchesClub && matchesCategory;
            })
            .sort((a, b) => {
                if (a.className !== b.className && selectedClass === "") {
                    return String(a.className).localeCompare(String(b.className));
                }

                return Number(a.position) - Number(b.position);
            }),
        [
            rankings,
            search,
            selectedClass,
            selectedClub,
            selectedCategory
        ]
    );

    const podium = selectedClass
        ? filteredRankings.slice(0, 3)
        : [];

    function clearFilters() {
        setSearch("");
        setSelectedClass("");
        setSelectedClub("");
        setSelectedCategory("");
    }

    return (
        <div className="page ranking-page">
            <h1>Ranking 2026</h1>

            <p>
                Ranking ILCA cargado desde la última importación publicada por el superadmin.
                Si todavía no hay importación publicada, SailJobs muestra el ranking base de la beta.
            </p>

            <div className="ranking-note">
                <p>
                    Se toman los 4 mejores campeonatos de las últimas 5 fechas ranking.
                    El resultado del Campeonato Argentino se multiplica por 2.
                </p>

                <p>
                    <strong>Fuente:</strong>{" "}
                    {isLoadingRanking
                        ? "Cargando ranking publicado..."
                        : sourceLabel}
                </p>

                {rankingError && (
                    <p>
                        {rankingError}
                    </p>
                )}
            </div>

            {isWaitingForRemoteRanking ? (
                <div className="detail-card">
                    <h2>Cargando ranking publicado...</h2>

                    <p>
                        Estamos consultando la última versión publicada en Supabase.
                    </p>
                </div>
            ) : (
                <>
                    <div className="calendar-filters">
                        <input
                            type="text"
                            placeholder="Buscar timonel, club, clase o categoría..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">
                                Todas las clases
                            </option>

                            {classes.map((className) => (
                                <option
                                    key={className}
                                    value={className}
                                >
                                    {className}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedClub}
                            onChange={(e) => setSelectedClub(e.target.value)}
                        >
                            <option value="">
                                Todos los clubes
                            </option>

                            {clubs.map((club) => (
                                <option
                                    key={club}
                                    value={club}
                                >
                                    {club}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">
                                Todas las categorías
                            </option>

                            {categories.map((category) => (
                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>
                            ))}
                        </select>

                        <button
                            className="filter-clear-button"
                            onClick={clearFilters}
                        >
                            Limpiar filtros
                        </button>
                    </div>

                    {selectedClass && (
                        <div className="detail-card">
                            <h2>Top 3 {selectedClass}</h2>

                            {podium.length > 0 ? (
                                <div className="ranking-podium">
                                    {podium.map((sailor, index) => (
                                        <div
                                            className={`ranking-podium-card podium-${index + 1}`}
                                            key={sailor.id}
                                        >
                                            <div className="ranking-medal">
                                                #{sailor.position}
                                            </div>

                                            <RankingAvatar sailor={sailor} />

                                            <h3>
                                                <RankingName sailor={sailor} />
                                            </h3>

                                            <p>
                                                {sailor.club}
                                            </p>

                                            <p>
                                                {sailor.category}
                                            </p>

                                            <strong>
                                                {sailor.netPoints} netos
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No hay navegantes para esos filtros.</p>
                            )}
                        </div>
                    )}

                    <div className="detail-card">
                        <div className="ranking-table-header">
                            <h2>Tabla general</h2>

                            <p>
                                {filteredRankings.length} resultados
                            </p>
                        </div>

                        {filteredRankings.length > 0 ? (
                            <div className="ranking-table-wrapper">
                                <table className="ranking-table">
                                    <thead>
                                        <tr>
                                            <th>Pos.</th>
                                            <th>Timonel</th>
                                            <th>Club</th>
                                            <th>Clase</th>
                                            <th>Categoría</th>
                                            <th>Net</th>
                                            <th>Totales</th>
                                            <th>Campeonatos</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredRankings.map((sailor) => (
                                            <tr key={sailor.id}>
                                                <td>
                                                    #{sailor.position}
                                                </td>

                                                <td>
                                                    <div className="ranking-sailor-cell">
                                                        <RankingAvatar
                                                            sailor={sailor}
                                                            compact
                                                        />

                                                        <RankingName sailor={sailor} />
                                                    </div>
                                                </td>

                                                <td>
                                                    {sailor.club}
                                                </td>

                                                <td>
                                                    {sailor.className}
                                                </td>

                                                <td>
                                                    {sailor.category}
                                                </td>

                                                <td>
                                                    <strong>
                                                        {sailor.netPoints}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {sailor.totalPoints}
                                                </td>

                                                <td>
                                                    {sailor.events}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>
                                No se encontraron resultados para los filtros seleccionados.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default Ranking;
