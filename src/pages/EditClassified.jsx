import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    CLASSIFIED_CATEGORIES,
    COUNTRIES
} from "../config/appConfig";

import { getCurrentUser } from "../utils/authStorage";
import { sameId } from "../utils/idUtils";

import {
    getAllClassifieds,
    updateStoredClassified
} from "../utils/classifiedsStorage";

function EditClassified() {

    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const classifieds = getAllClassifieds();

    const classified = classifieds.find(
        item => sameId(item.id, id)
    );

    const [title, setTitle] = useState(classified ? classified.title : "");
    const [category, setCategory] = useState(classified ? classified.category : "");
    const [price, setPrice] = useState(classified ? classified.price : "");
    const [country, setCountry] = useState(classified ? classified.country : "");
    const [city, setCity] = useState(classified ? classified.city : "");
    const [description, setDescription] = useState(classified ? classified.description : "");
    const [images, setImages] = useState(classified ? classified.images || [] : []);
    const [message, setMessage] = useState("");

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

    const isOwner =
        currentUser &&
        sameId(currentUser.id, classified.userId);

    if (!isOwner) {
        return (
            <div className="dashboard-page">

                <h1>Acceso denegado</h1>

                <p>
                    Solo el dueño del clasificado puede editar esta publicación.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate(`/classifieds/${classified.id}`)}
                >
                    ← Volver al clasificado
                </button>

            </div>
        );
    }

    function compressImage(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith("image/")) {
                reject("El archivo no es una imagen.");
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                const img = new Image();

                img.onload = () => {
                    const maxWidth = 900;
                    const scale = Math.min(maxWidth / img.width, 1);

                    const canvas = document.createElement("canvas");

                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;

                    const ctx = canvas.getContext("2d");

                    ctx.drawImage(
                        img,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    const compressedImage = canvas.toDataURL(
                        "image/jpeg",
                        0.65
                    );

                    resolve(compressedImage);
                };

                img.onerror = () => {
                    reject("No se pudo procesar la imagen.");
                };

                img.src = reader.result;
            };

            reader.onerror = () => {
                reject("No se pudo leer la imagen.");
            };

            reader.readAsDataURL(file);
        });
    }

    async function handleImagesChange(e) {
        const selectedFiles = Array.from(e.target.files);

        if (selectedFiles.length > 3) {
            setMessage("Podés subir hasta 3 fotos por clasificado.");
            return;
        }

        try {
            setMessage("Procesando imágenes...");

            const compressedImages = await Promise.all(
                selectedFiles.map(file => compressImage(file))
            );

            setImages(compressedImages);

            setMessage("Imágenes actualizadas correctamente.");
        } catch (error) {
            setMessage("Hubo un problema al cargar las imágenes.");
        }
    }

    function handleSubmit(e) {
        e.preventDefault();

        if (!title || !category || !price || !country || !city || !description) {
            setMessage("Completá todos los campos obligatorios.");
            return;
        }

        try {
            updateStoredClassified(classified.id, {
                title,
                category,
                price,
                country,
                city,
                description,
                images
            });

            navigate(`/classifieds/${classified.id}`);
        } catch (error) {
            if (error.name === "QuotaExceededError") {
                setMessage(
                    "Las fotos son demasiado pesadas para esta versión local. Probá con menos fotos o imágenes más chicas."
                );
            } else {
                setMessage("No se pudo guardar el clasificado.");
            }
        }
    }

    function removeImages() {
        setImages([]);
        setMessage("Fotos eliminadas. Guardá los cambios para confirmar.");
    }

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
                Modificá los datos de tu publicación.
            </p>

            <div className="detail-card">

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <input
                        type="text"
                        placeholder="Título del clasificado *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">
                            Seleccionar categoría *
                        </option>

                        {CLASSIFIED_CATEGORIES.map((categoryOption) => (
                            <option
                                key={categoryOption}
                                value={categoryOption}
                            >
                                {categoryOption}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Precio *"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />

                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    >
                        <option value="">
                            Seleccionar país *
                        </option>

                        {COUNTRIES.map((countryOption) => (
                            <option
                                key={countryOption}
                                value={countryOption}
                            >
                                {countryOption}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Ciudad *"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />

                    <textarea
                        placeholder="Descripción *"
                        rows="6"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <label>
                        Reemplazar fotos
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                    />

                    {images.length > 0 && (
                        <>
                            <div className="classified-preview-gallery">

                                {images.map((image, index) => (

                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Vista previa ${index + 1}`}
                                        className="classified-preview"
                                    />

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

                    {message && (
                        <p>
                            {message}
                        </p>
                    )}

                    <button
                        className="apply-button"
                        type="submit"
                    >
                        Guardar cambios
                    </button>

                </form>

            </div>

        </div>

    );
}

export default EditClassified;