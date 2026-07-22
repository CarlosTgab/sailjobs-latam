import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CLASSIFIED_CATEGORIES,
    COUNTRIES
} from "../config/appConfig";

import { getCurrentUser } from "../utils/authStorage";
import { isSuperadmin } from "../utils/permissions";
import { createStoredClassified } from "../utils/classifiedsStorage";

function CreateClassified() {

    const navigate = useNavigate();

    const currentUser = getCurrentUser();
    const currentUserIsSuperadmin = isSuperadmin(currentUser);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState([]);
    const [sellerPhone, setSellerPhone] = useState("");
    const [message, setMessage] = useState("");

    if (!currentUser) {
        return (
            <div className="dashboard-page">

                <h1>Acceso denegado</h1>

                <p>
                    Tenés que iniciar sesión para publicar un clasificado.
                </p>

                <button
                    className="back-button"
                    onClick={() => navigate("/login")}
                >
                    Iniciar sesión
                </button>

            </div>
        );
    }

    if (currentUserIsSuperadmin) {
        return (
            <div className="dashboard-page">

                <h1>Cuenta de administración</h1>

                <p>
                    Las cuentas superadmin no publican clasificados. Usá el panel
                    de moderación para revisar o dar de baja publicaciones.
                </p>

                <button
                    className="apply-button"
                    onClick={() => navigate("/admin/classifieds")}
                >
                    Ir a moderación de clasificados
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

            setMessage("Imágenes cargadas correctamente.");
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
            createStoredClassified({
                title,
                category,
                price,
                country,
                city,
                description,
                images,
                sellerName: currentUser.name,
                sellerEmail: currentUser.email,
                sellerPhone,
                userId: currentUser.id
            });

            navigate("/classifieds");
        } catch (error) {
            if (error.name === "QuotaExceededError") {
                setMessage(
                    "Las fotos siguen siendo demasiado pesadas para guardarlas en esta versión local. Probá con menos fotos o imágenes más chicas."
                );
            } else {
                setMessage("No se pudo publicar el clasificado.");
            }
        }
    }

    return (

        <div className="dashboard-page">

            <button
                className="back-button"
                onClick={() => navigate("/classifieds")}
            >
                ← Volver a clasificados
            </button>

            <h1>Publicar clasificado</h1>

            <p>
                Publicá barcos, velas, mástiles, botavaras, trailers o equipamiento náutico.
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

                    <input
                        type="text"
                        placeholder="WhatsApp o teléfono de contacto"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                    />

                    <label>
                        Fotos del producto
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                    />

                    {images.length > 0 && (
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
                        Publicar clasificado
                    </button>

                </form>

            </div>

        </div>

    );
}

export default CreateClassified;