import { useEffect, useState } from "react";
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
import { createStoredClassified } from "../utils/classifiedsStorage";

function CreateClassified() {

    const navigate = useNavigate();

    const currentUser = getCurrentUser();
    const currentUserIsSuperadmin = isSuperadmin(currentUser);
    const currentUserIsInstitutional = isInstitutionalExperience(currentUser);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [clubName, setClubName] = useState("");
    const [modelYear, setModelYear] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [description, setDescription] = useState("");
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [sellerPhone, setSellerPhone] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => () => {
        imagePreviews.forEach(image => URL.revokeObjectURL(image));
    }, [imagePreviews]);

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

    if (currentUserIsInstitutional) {
        return (
            <div className="dashboard-page">

                <h1>Clasificados comunitarios</h1>

                <p>
                    Las cuentas de club u organización no publican clasificados personales.
                    Desde tu panel institucional podés publicar oportunidades, proponer
                    eventos y revisar postulaciones.
                </p>

                <button
                    className="apply-button"
                    onClick={() => navigate(getPrimaryDashboardPath(currentUser))}
                >
                    Ir al panel institucional
                </button>

            </div>
        );
    }

    function handleImagesChange(e) {
        const selectedFiles = Array.from(e.target.files);

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
        setMessage(
            selectedFiles.length > 0
                ? "Fotos listas. La primera se usará como portada."
                : ""
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!title || !category || !price || !country || !city || !description) {
            setMessage("Completá todos los campos obligatorios.");
            return;
        }

        setIsSubmitting(true);
        setMessage("Publicando clasificado y subiendo fotos...");

        try {
            const savedClassified = await createStoredClassified({
                title,
                category,
                price,
                clubName,
                modelYear,
                serialNumber,
                country,
                city,
                description,
                sellerName: currentUser.name,
                sellerEmail: currentUser.email,
                sellerPhone,
                userId: currentUser.id
            }, imageFiles);

            navigate(`/classifieds/${savedClassified.id}`);
        } catch (error) {
            setMessage(
                error?.message || "No se pudo publicar el clasificado. Intentá nuevamente."
            );
        } finally {
            setIsSubmitting(false);
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

                    <input
                        type="text"
                        placeholder="Club (opcional)"
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                    />

                    <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        placeholder="Año (opcional)"
                        value={modelYear}
                        onChange={(e) => setModelYear(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Número de serie (opcional)"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
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
                        Fotos del producto (hasta 3)
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                    />

                    {imagePreviews.length > 0 && (
                        <div className="classified-preview-gallery">

                            {imagePreviews.map((image, index) => (

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
                    )}

                    {message && (
                        <p>
                            {message}
                        </p>
                    )}

                    <button
                        className="apply-button"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Publicando..." : "Publicar clasificado"}
                    </button>

                </form>

            </div>

        </div>

    );
}

export default CreateClassified;
