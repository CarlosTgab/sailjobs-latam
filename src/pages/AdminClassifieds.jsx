import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    hideStoredClassified,
    restoreStoredClassified
} from "../utils/classifiedsStorage";
import useClassifieds from "../hooks/useClassifieds";

import { getCurrentUser } from "../utils/authStorage";
import { isSuperadmin } from "../utils/permissions";
import { sortByNewest } from "../utils/idUtils";

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function getClassifiedCityName(classified) {
    if (classified.cityName) {
        return classified.cityName;
    }

    if (classified.city && classified.city.includes(",")) {
        return classified.city.split(",")[0].trim();
    }

    return classified.city || "";
}

function getLocationLabel(classified) {
    const parts = [
        getClassifiedCityName(classified),
        classified.state,
        classified.country
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

function AdminClassifieds() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const {
        classifieds,
        isLoadingClassifieds,
        classifiedsError
    } = useClassifieds({ includeHidden: true });

    if (!currentUser || !isSuperadmin(currentUser)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    Solo un superadmin puede moderar clasificados.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/")}
                >
                    ← Volver al inicio
                </button>
            </div>
        );
    }

    function getStatusLabel(status) {
        if (status === "hidden") {
            return "Dado de baja";
        }

        if (status === "deleted") {
            return "Eliminado";
        }

        return "Activo";
    }

    function getStatusClass(status) {
        if (status === "hidden" || status === "deleted") {
            return "status-pill rejected";
        }

        return "status-pill approved";
    }

    async function handleHide(classifiedId) {
        const confirmed = window.confirm(
            "¿Seguro que querés dar de baja este clasificado? No se verá en la página pública."
        );

        if (!confirmed) {
            return;
        }

        try {
            await hideStoredClassified(classifiedId);
        } catch (error) {
            window.alert(error?.message || "No se pudo dar de baja el clasificado.");
        }
    }

    async function handleRestore(classifiedId) {
        const confirmed = window.confirm(
            "¿Querés restaurar este clasificado y volver a mostrarlo públicamente?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await restoreStoredClassified(classifiedId);
        } catch (error) {
            window.alert(error?.message || "No se pudo restaurar el clasificado.");
        }
    }

    const activeClassifieds = classifieds.filter(
        item => item.status !== "hidden" && item.status !== "deleted"
    );

    const hiddenClassifieds = classifieds.filter(
        item => item.status === "hidden" || item.status === "deleted"
    );

    const filteredClassifieds = sortByNewest(
        classifieds.filter(item => {
            const searchText = [
                item.title,
                item.category,
                item.clubName,
                item.modelYear,
                item.serialNumber,
                item.country,
                item.state,
                item.city,
                item.cityName,
                item.description,
                item.sellerName,
                item.sellerEmail
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !search.trim() ||
                searchText.includes(normalizeText(search));

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.status !== "hidden" && item.status !== "deleted") ||
                (statusFilter === "hidden" && (item.status === "hidden" || item.status === "deleted"));

            return matchesSearch && matchesStatus;
        })
    );

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() => navigate("/superadmin")}
            >
                ← Volver al panel admin
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Moderación de clasificados</h1>

                    <p>
                        Revisá y moderá artículos publicados en la sección de clasificados.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/classifieds")}
                    >
                        Ver página pública
                    </button>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{classifieds.length}</h2>
                    <p>Total</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{activeClassifieds.length}</h2>
                    <p>Activos</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{hiddenClassifieds.length}</h2>
                    <p>Dados de baja</p>
                </div>
            </div>

            <div className="calendar-filters">
                <input
                    type="text"
                    placeholder="Buscar por título, vendedor, ciudad o categoría"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="hidden">Dados de baja</option>
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

            {isLoadingClassifieds && filteredClassifieds.length === 0 ? (
                <div className="detail-card">
                    <h2>Cargando clasificados...</h2>
                </div>
            ) : classifiedsError && filteredClassifieds.length === 0 ? (
                <div className="detail-card">
                    <h2>No pudimos cargar los clasificados</h2>
                    <p>{classifiedsError}</p>
                </div>
            ) : filteredClassifieds.length > 0 ? (
                <div className="dashboard-grid">
                    {filteredClassifieds.map(item => {
                        const isHidden = item.status === "hidden" || item.status === "deleted";

                        return (
                            <div
                                key={item.id}
                                className="dashboard-card"
                            >
                                <div className="event-card-top">
                                    <span className="sidebar-tag">
                                        {item.category || "Clasificado"}
                                    </span>

                                    <span className={getStatusClass(item.status)}>
                                        {getStatusLabel(item.status)}
                                    </span>
                                </div>

                                <h3>{item.title}</h3>

                                <p>
                                    <strong>Precio:</strong>{" "}
                                    {item.price || "A consultar"}
                                </p>

                                {item.modelYear && (
                                    <p>
                                        <strong>Año:</strong>{" "}
                                        {item.modelYear}
                                    </p>
                                )}

                                {item.clubName && (
                                    <p>
                                        <strong>Club:</strong>{" "}
                                        {item.clubName}
                                    </p>
                                )}

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {getLocationLabel(item)}
                                </p>

                                <p>
                                    <strong>Vendedor:</strong>{" "}
                                    {item.sellerName || "No informado"}
                                </p>

                                <div className="dashboard-actions">
                                    {!isHidden && (
                                        <button
                                            className="apply-button"
                                            onClick={() => navigate(`/classifieds/${item.id}`)}
                                        >
                                            Ver público
                                        </button>
                                    )}

                                    {!isHidden ? (
                                        <button
                                            className="reject-button"
                                            onClick={() => handleHide(item.id)}
                                        >
                                            Dar de baja
                                        </button>
                                    ) : (
                                        <button
                                            className="accept-button"
                                            onClick={() => handleRestore(item.id)}
                                        >
                                            Restaurar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="detail-card">
                    <h2>No encontramos clasificados</h2>

                    <p>
                        Probá cambiar los filtros de moderación.
                    </p>
                </div>
            )}
        </div>
    );
}

export default AdminClassifieds;
