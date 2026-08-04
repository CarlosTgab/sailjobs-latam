import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    CLASSIFIED_CATEGORIES,
    COUNTRIES
} from "../config/appConfig";

import { getCurrentUser } from "../utils/authStorage";
import { isSuperadmin } from "../utils/permissions";
import {
    getPrimaryDashboardPath,
    isInstitutionalExperience
} from "../config/roleExperience";
import useClassifieds from "../hooks/useClassifieds";

function Classifieds() {

    const navigate = useNavigate();

    const currentUser = getCurrentUser();
    const currentUserIsSuperadmin = isSuperadmin(currentUser);
    const currentUserIsInstitutional = isInstitutionalExperience(currentUser);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");

    const {
        classifieds: syncedClassifieds,
        isLoadingClassifieds,
        classifiedsError
    } = useClassifieds();

    const classifieds = syncedClassifieds
        .filter(item => item.status !== "deleted")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const countries = [
        ...new Set([
            ...COUNTRIES,
            ...classifieds.map(item => item.country)
        ])
    ].filter(Boolean);

    const filteredClassifieds = classifieds.filter((item) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            item.title.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText) ||
            item.clubName.toLowerCase().includes(searchText) ||
            String(item.modelYear || "").toLowerCase().includes(searchText) ||
            item.serialNumber.toLowerCase().includes(searchText) ||
            item.city.toLowerCase().includes(searchText) ||
            item.country.toLowerCase().includes(searchText) ||
            item.description.toLowerCase().includes(searchText) ||
            item.sellerName.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "" ||
            item.category === selectedCategory;

        const matchesCountry =
            selectedCountry === "" ||
            item.country === selectedCountry;

        return matchesSearch && matchesCategory && matchesCountry;
    });

    function handleCreateClassified() {
        if (currentUserIsSuperadmin) {
            navigate("/admin/classifieds");
            return;
        }

        if (!currentUser) {
            alert("Tenés que iniciar sesión para publicar un clasificado.");
            navigate("/login");
            return;
        }

        if (currentUserIsInstitutional) {
            alert("Los clasificados son una sección comunitaria para usuarios y profesionales. Las cuentas institucionales gestionan oportunidades, eventos y postulaciones desde su panel.");
            navigate(getPrimaryDashboardPath(currentUser));
            return;
        }

        navigate("/classifieds/new");
    }

    function getMainImage(classified) {
        if (classified.images && classified.images.length > 0) {
            return classified.images[0];
        }

        if (classified.image) {
            return classified.image;
        }

        return null;
    }

    function clearFilters() {
        setSearch("");
        setSelectedCategory("");
        setSelectedCountry("");
    }

    return (

        <div className="page classifieds-page">

            <div className="page-header">

                <div>
                    <h1>Clasificados</h1>

                    <p>
                        Compra y venta de barcos, velas, trailers, equipamiento
                        e indumentaria náutica.
                    </p>
                </div>

                <button
                    className="apply-button"
                    onClick={handleCreateClassified}
                >
                    {currentUserIsSuperadmin
                        ? "Panel de moderación"
                        : currentUserIsInstitutional
                            ? "Ir al panel institucional"
                            : "Publicar clasificado"}
                </button>

            </div>

            <div className="calendar-filters">

                <input
                    type="text"
                    placeholder="Buscar barco, vela, trailer, ciudad o vendedor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">
                        Todas las categorías
                    </option>

                    {CLASSIFIED_CATEGORIES.map((category) => (

                        <option
                            key={category}
                            value={category}
                        >
                            {category}
                        </option>

                    ))}
                </select>

                <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                >
                    <option value="">
                        Todos los países
                    </option>

                    {countries.map((country) => (

                        <option
                            key={country}
                            value={country}
                        >
                            {country}
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

            <div className="event-grid classifieds-grid">

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

                    filteredClassifieds.map((item) => {

                        const mainImage = getMainImage(item);

                        return (

                            <div
                                className="event-card"
                                key={item.id}
                                onClick={() => navigate(`/classifieds/${item.id}`)}
                            >

                                {mainImage ? (

                                    <img
                                        src={mainImage}
                                        alt={item.title}
                                        className="classified-image"
                                    />

                                ) : (

                                    <div className="classified-placeholder">
                                        Sin imagen
                                    </div>

                                )}

                                <span className="sidebar-tag">
                                    {item.category}
                                </span>

                                <h2>{item.title}</h2>

                                <p>
                                    💰 {item.price}
                                </p>

                                <p>
                                    📍 {item.city}, {item.country}
                                </p>

                                {item.modelYear && (
                                    <p>📅 Año {item.modelYear}</p>
                                )}

                                {item.clubName && (
                                    <p>⛵ {item.clubName}</p>
                                )}

                                <p>
                                    {item.description.length > 120
                                        ? `${item.description.slice(0, 120)}...`
                                        : item.description}
                                </p>

                                <hr />

                                <p>
                                    👤 {item.sellerName}
                                </p>

                                {item.sellerPhone && (
                                    <p>
                                        📱 WhatsApp disponible
                                    </p>
                                )}

                            </div>

                        );

                    })

                ) : (

                    <div className="detail-card">

                        <h2>No se encontraron clasificados</h2>

                        <p>
                            Probá cambiar el texto buscado, la categoría o el país.
                        </p>

                        <button
                            className="back-button"
                            onClick={clearFilters}
                        >
                            Limpiar filtros
                        </button>

                    </div>

                )}

            </div>

        </div>

    );
}

export default Classifieds;
