import { useState } from "react";

import rankings from "../data/rankings";

function Ranking() {

    const [search, setSearch] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedClub, setSelectedClub] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const classes = [
        ...new Set(rankings.map(item => item.className))
    ].sort();

    const clubs = [
        ...new Set(rankings.map(item => item.club).filter(Boolean))
    ].sort();

    const categories = [
        ...new Set(rankings.map(item => item.category).filter(Boolean))
    ].sort();

    const filteredRankings = rankings
        .filter((item) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                item.name.toLowerCase().includes(searchText) ||
                item.club.toLowerCase().includes(searchText) ||
                item.category.toLowerCase().includes(searchText) ||
                item.className.toLowerCase().includes(searchText);

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
                return a.className.localeCompare(b.className);
            }

            return a.position - b.position;
        });

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
                Ranking real cargado desde el archivo oficial. El orden se basa en la posición del ranking y el puntaje neto.
            </p>

            <div className="ranking-note">
                <p>
                    Se toman los 4 mejores campeonatos de las últimas 5 fechas ranking.
                    El resultado del Campeonato Argentino se multiplica por 2.
                </p>
            </div>

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

                                    <h3>{sailor.name}</h3>

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
                                            <strong>
                                                {sailor.name}
                                            </strong>
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

        </div>

    );
}

export default Ranking;
