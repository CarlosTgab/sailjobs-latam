import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import { isSuperadmin } from "../utils/permissions";
import { sameId } from "../utils/idUtils";
import useClassifieds from "../hooks/useClassifieds";

import {
    deleteStoredClassified,
    hideStoredClassified
} from "../utils/classifiedsStorage";

function ClassifiedDetail() {

    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const {
        classifieds,
        isLoadingClassifieds
    } = useClassifieds({
        includeHidden: isSuperadmin(currentUser)
    });

    const classified = classifieds.find(
        item => sameId(item.id, id)
    );

    const images = classified
        ? classified.images || []
        : [];

    const [selectedImage, setSelectedImage] = useState(null);
    const displayedImage = images.includes(selectedImage)
        ? selectedImage
        : images[0] || null;

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

    const currentUserIsSuperadmin =
        isSuperadmin(currentUser);

    const isOwner =
        currentUser &&
        !currentUserIsSuperadmin &&
        sameId(currentUser.id, classified.userId);

    function getWhatsappLink(phone) {
        if (!phone) {
            return null;
        }

        const cleanPhone = phone.replace(/\D/g, "");

        if (!cleanPhone) {
            return null;
        }

        return `https://wa.me/${cleanPhone}`;
    }

    const whatsappLink = getWhatsappLink(classified.sellerPhone);
    const emailSubject = encodeURIComponent(
        `Consulta por ${classified.title}`
    );

    async function handleDelete() {
        const confirmDelete = window.confirm(
            "¿Seguro que querés eliminar este clasificado?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await deleteStoredClassified(classified.id);
            navigate("/classifieds");
        } catch (error) {
            window.alert(
                error?.message || "No se pudo eliminar el clasificado."
            );
        }
    }

    async function handleModerateClassified() {
        const confirmModeration = window.confirm(
            "¿Seguro que querés dar de baja este clasificado? No se verá en la página pública."
        );

        if (!confirmModeration) {
            return;
        }

        try {
            await hideStoredClassified(classified.id);
            navigate("/admin/classifieds");
        } catch (error) {
            window.alert(
                error?.message || "No se pudo dar de baja el clasificado."
            );
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

            <div className="classified-detail-layout">

                <div>

                    {displayedImage ? (

                        <img
                            src={displayedImage}
                            alt={classified.title}
                            className="classified-main-image"
                        />

                    ) : (

                        <div className="classified-placeholder large">
                            Sin imagen
                        </div>

                    )}

                    {images.length > 1 && (

                        <div className="classified-thumbnails">

                            {images.map((image, index) => (

                                <img
                                    key={index}
                                    src={image}
                                    alt={`Imagen ${index + 1}`}
                                    className="classified-thumbnail"
                                    onClick={() => setSelectedImage(image)}
                                    style={{ cursor: "pointer" }}
                                />

                            ))}

                        </div>

                    )}

                </div>

                <div className="detail-card">

                    <h1>{classified.title}</h1>

                    <p>
                        <strong>Categoría:</strong>{" "}
                        {classified.category}
                    </p>

                    <p>
                        <strong>Precio:</strong>{" "}
                        {classified.price}
                    </p>

                    {classified.modelYear && (
                        <p>
                            <strong>Año:</strong>{" "}
                            {classified.modelYear}
                        </p>
                    )}

                    {classified.serialNumber && (
                        <p>
                            <strong>Número de serie:</strong>{" "}
                            {classified.serialNumber}
                        </p>
                    )}

                    {classified.clubName && (
                        <p>
                            <strong>Club:</strong>{" "}
                            {classified.clubName}
                        </p>
                    )}

                    <p>
                        <strong>Ubicación:</strong>{" "}
                        {classified.city}, {classified.country}
                    </p>

                    <p>
                        <strong>Descripción:</strong>
                    </p>

                    <p>
                        {classified.description}
                    </p>

                    <hr />

                    <div className="seller-contact-box">

                        <h2>Contacto con el vendedor</h2>

                        <p>
                            <strong>Vendedor:</strong>{" "}
                            {classified.sellerName}
                        </p>

                        <p>
                            <strong>Email:</strong>{" "}
                            <a href={`mailto:${classified.sellerEmail}`}>
                                {classified.sellerEmail}
                            </a>
                        </p>

                        <p>
                            <strong>WhatsApp / Teléfono:</strong>{" "}
                            {classified.sellerPhone ? classified.sellerPhone : "No informado"}
                        </p>

                        <div className="dashboard-actions">

                            <a
                                className="apply-button"
                                href={`mailto:${classified.sellerEmail}?subject=${emailSubject}`}
                            >
                                Enviar email
                            </a>

                            {whatsappLink && (
                                <a
                                    className="whatsapp-button"
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Contactar por WhatsApp
                                </a>
                            )}

                        </div>

                    </div>

                    {classified.updatedAt && (
                        <p>
                            <strong>Última actualización:</strong>{" "}
                            {new Date(classified.updatedAt).toLocaleDateString("es-AR")}
                        </p>
                    )}

                    {currentUserIsSuperadmin && (

                        <div className="dashboard-actions">

                            <button
                                className="reject-button"
                                onClick={handleModerateClassified}
                            >
                                Dar de baja clasificado
                            </button>

                            <button
                                className="apply-button"
                                onClick={() => navigate("/admin/classifieds")}
                            >
                                Panel de moderación
                            </button>

                        </div>

                    )}

                    {isOwner && (

                        <div className="dashboard-actions">

                            <button
                                className="apply-button"
                                onClick={() => navigate(`/classifieds/${classified.id}/edit`)}
                            >
                                Editar
                            </button>

                            <button
                                className="reject-button"
                                onClick={handleDelete}
                            >
                                Eliminar
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );
}

export default ClassifiedDetail;
