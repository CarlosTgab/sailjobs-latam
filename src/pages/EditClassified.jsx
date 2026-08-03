import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    CLASSIFIED_CATEGORIES,
    COUNTRIES
} from "../config/appConfig";

import { getCurrentUser } from "../utils/authStorage";
import { sameId } from "../utils/idUtils";
import useClassifieds from "../hooks/useClassifieds";
import { updateStoredClassified } from "../utils/classifiedsStorage";

function EditClassifiedForm({ classified, navigate }) {
    const [title, setTitle] = useState(classified.title);
    const [category, setCategory] = useState(classified.category);
    const [price, setPrice] = useState(classified.price);
    const [country, setCountry] = useState(classified.country);
    const [city, setCity] = useState(classified.city);
    const [description, setDescription] = useState(classified.description);
    const [currentImages, setCurrentImages] = useState(classified.images || []);
    const [imageFiles, setImageFiles] = useState(null);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => () => {
        imagePreviews.forEach(image => URL.revokeObjectURL(image));
    }, [imagePreviews]);

    function handleImagesChange(event) {
        const selectedFiles = Array.from(event.target.files);

        if (selectedFiles.length > 3) {
            setMessage("Podés subir hasta 3 fotos por clasificado.");
            return;
        }

        if (selectedFiles.some(file => !file.type.startsWith("image/"))) {
            setMessage("Solo podés subir archivos de imagen.");
            return;
        }

        setImageFiles(selectedFiles);
        setImagePreviews(selectedFiles.map(file => URL.createObjectURL(file)));
        setCurrentImages([]);
        setMessage(
            selectedFiles.length > 0
                ? "Fotos listas. La primera se usará como portada."
                : ""
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!title || !category || !price || !country || !city || !description) {
            setMessage("Completá todos los campos obligatorios.");
            return;
        }

        setIsSubmitting(true);
        setMessage("Guardando cambios...");

        try {
            await updateStoredClassified(
                classified.id,
                {
                    title,
                    category,
                    price,
                    country,
                    city,
                    description
                },
                imageFiles
            );

            navigate(`/classifieds/${classified.id}`);
        } catch (error) {
            setMessage(
                error?.message || "No se pudo guardar el clasificado. Intentá nuevamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function removeImages() {
        setCurrentImages([]);
        setImageFiles([]);
        setImagePreviews([]);
        setMessage("Fotos eliminadas. Guardá los cambios para confirmar.");
    }

    const visibleImages = imageFiles === null ? currentImages : imagePreviews;

    return (
        <div className="dashboard-page">
            <button
                className="back-button"
                onClick={() => navigate(`/classifieds/${classified.id}`)}
            >
                ← Volver al clasificado
            </button>

            <h1>Editar clasificado</h1>

            <p>
                Modificá los datos o reemplazá la galería. La primera foto será la portada.
            </p>

            <div className="detail-card">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Título del clasificado *"
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                    />

                    <select
                        value={category}
                        onChange={event => setCategory(event.target.value)}
                    >
                        <option value="">Seleccionar categoría *</option>

                        {CLASSIFIED_CATEGORIES.map(categoryOption => (
                            <option key={categoryOption} value={categoryOption}>
                                {categoryOption}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Precio *"
                        value={price}
                        onChange={event => setPrice(event.target.value)}
                    />

                    <select
                        value={country}
                        onChange={event => setCountry(event.target.value)}
                    >
                        <option value="">Seleccionar país *</option>

                        {COUNTRIES.map(countryOption => (
                            <option key={countryOption} value={countryOption}>
                                {countryOption}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Ciudad *"
                        value={city}
                        onChange={event => setCity(event.target.value)}
                    />

                    <textarea
                        placeholder="Descripción *"
                        rows="6"
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                    />

                    <label>Reemplazar fotos (hasta 3)</label>

                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                    />

                    {visibleImages.length > 0 && (
                        <>
                            <div className="classified-preview-gallery">
                                {visibleImages.map((image, index) => (
                                    <div
                                        key={image}
                                        className="classified-preview-item"
                                    >
                                        <img
                                            src={image}
                                            alt={`Vista previa ${index + 1}`}
                                            className="classified-preview"
                                        />

                                        {index === 0 && <small>Portada</small>}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="reject-button"
                                onClick={removeImages}
                            >
                                Quitar fotos
                            </button>
                        </>
                    )}

                    {message && <p>{message}</p>}

                    <button
                        className="apply-button"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Guardando..." : "Guardar cambios"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function EditClassified() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const {
        classifieds,
        isLoadingClassifieds
    } = useClassifieds();

    const classified = classifieds.find(item => sameId(item.id, id));

    if (isLoadingClassifieds && !classified) {
        return (
            <div className="dashboard-page">
                <h1>Cargando clasificado...</h1>
            </div>
        );
    }

    if (!classified) {
        return (
            <div className="dashboard-page">
                <h1>Clasificado no encontrado</h1>

                <button
                    className="back-button"
                    onClick={() => navigate("/classifieds")}
                >
                    ← Volver a clasificados
                </button>
            </div>
        );
    }

    const isOwner = currentUser && sameId(currentUser.id, classified.userId);

    if (!isOwner) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>Solo el dueño del clasificado puede editar esta publicación.</p>

                <button
                    className="back-button"
                    onClick={() => navigate(`/classifieds/${classified.id}`)}
                >
                    ← Volver al clasificado
                </button>
            </div>
        );
    }

    return (
        <EditClassifiedForm
            key={classified.id}
            classified={classified}
            navigate={navigate}
        />
    );
}

export default EditClassified;
