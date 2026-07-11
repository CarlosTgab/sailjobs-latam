import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";

import {
    getAllClassifieds,
    deleteStoredClassified
} from "../utils/classifiedsStorage";

function ClassifiedDetail() {

    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const classifieds = getAllClassifieds();

    const classified = classifieds.find(
        item => Number(item.id) === Number(id)
    );

    const images = classified
        ? classified.images || []
        : [];

    const [selectedImage, setSelectedImage] = useState(
        images.length > 0 ? images[0] : null
    );

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
        Number(currentUser.id) === Number(classified.userId);

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

    function handleDelete() {
        const confirmDelete = window.confirm(
            "¿Seguro que querés eliminar este clasificado?"
        );

        if (!confirmDelete) {
            return;
        }

        deleteStoredClassified(classified.id);

        navigate("/classifieds");
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

                    {selectedImage ? (

                        <img
                            src={selectedImage}
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