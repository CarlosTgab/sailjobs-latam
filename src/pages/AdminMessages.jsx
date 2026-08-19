import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { isSuperadmin } from "../utils/permissions";

import { getCurrentUser } from "../utils/authStorage";

import {
    getContactMessages,
    updateContactMessageStatus
} from "../utils/contactStorage";

function AdminMessages() {

    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const [messages, setMessages] = useState(getContactMessages());
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedType, setSelectedType] = useState("");

    if (!currentUser || !isSuperadmin(currentUser)) {
        return (
            <div className="dashboard-page">

                <h1>Acceso denegado</h1>

                <p>
                    Solo un administrador puede ver los mensajes de contacto.
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

    const sortedMessages = [...messages].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const filteredMessages = sortedMessages.filter((message) => {
        const matchesStatus =
            selectedStatus === "" ||
            message.status === selectedStatus;

        const matchesType =
            selectedType === "" ||
            message.type === selectedType;

        return matchesStatus && matchesType;
    });

    const newMessages = messages.filter(
        message => message.status === "new"
    );

    const readMessages = messages.filter(
        message => message.status === "read"
    );

    const archivedMessages = messages.filter(
        message => message.status === "archived"
    );

    const types = [
        ...new Set(messages.map(message => message.type))
    ].filter(Boolean);

    function refreshMessages() {
        setMessages(getContactMessages());
    }

    function handleStatusChange(messageId, newStatus) {
        updateContactMessageStatus(messageId, newStatus);
        refreshMessages();
    }

    function formatDate(date) {
        if (!date) {
            return "Fecha no disponible";
        }

        return new Date(date).toLocaleDateString(
            "es-AR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }

    function getTypeLabel(type) {
        if (type === "general") return "Consulta general";
        if (type === "club") return "Sumar club / organización";
        if (type === "job") return "Publicar oportunidad";
        if (type === "event") return "Sugerencia de evento";
        if (type === "classified") return "Clasificados";
        if (type === "partnership") return "Alianza / sponsor";

        return type;
    }

    function getStatusLabel(status) {
        if (status === "new") return "Nuevo";
        if (status === "read") return "Leído";
        if (status === "archived") return "Archivado";

        return status;
    }

    function getStatusClass(status) {
        if (status === "new") return "status-pill pending";
        if (status === "read") return "status-pill approved";
        if (status === "archived") return "status-pill rejected";

        return "status-pill pending";
    }

    function clearFilters() {
        setSelectedStatus("");
        setSelectedType("");
    }

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
                    <h1>Mensajes de contacto</h1>

                    <p>
                        Revisá consultas generales, clubes interesados,
                        sugerencias de eventos, oportunidades y alianzas.
                    </p>
                </div>

                <div className="dashboard-actions">

                    <button
                        className="apply-button"
                        onClick={() => navigate("/contact")}
                    >
                        Ver formulario público
                    </button>

                </div>

            </div>

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <h2>{messages.length}</h2>
                    <p>Total mensajes</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{newMessages.length}</h2>
                    <p>Nuevos</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{readMessages.length}</h2>
                    <p>Leídos</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{archivedMessages.length}</h2>
                    <p>Archivados</p>
                </div>

            </div>

            <div className="calendar-filters">

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                >
                    <option value="">
                        Todos los estados
                    </option>

                    <option value="new">
                        Nuevos
                    </option>

                    <option value="read">
                        Leídos
                    </option>

                    <option value="archived">
                        Archivados
                    </option>
                </select>

                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                >
                    <option value="">
                        Todos los tipos
                    </option>

                    {types.map(type => (
                        <option
                            key={type}
                            value={type}
                        >
                            {getTypeLabel(type)}
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

            {filteredMessages.length > 0 ? (

                <div className="event-grid">

                    {filteredMessages.map(message => (

                        <div
                            className="event-card admin-message-card"
                            key={message.id}
                        >

                            <div className="event-card-top">

                                <span className="sidebar-tag">
                                    {getTypeLabel(message.type)}
                                </span>

                                <span className={getStatusClass(message.status)}>
                                    {getStatusLabel(message.status)}
                                </span>

                            </div>

                            <h2>{message.subject}</h2>

                            <p>
                                <strong>Nombre:</strong>{" "}
                                {message.name}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                <a href={`mailto:${message.email}`}>
                                    {message.email}
                                </a>
                            </p>

                            <p>
                                <strong>Fecha:</strong>{" "}
                                {formatDate(message.createdAt)}
                            </p>

                            <p>
                                <strong>Mensaje:</strong>
                            </p>

                            <p className="admin-message-text">
                                {message.message}
                            </p>

                            <div className="status-actions">

                                {message.status !== "read" && (
                                    <button
                                        className="accept-button"
                                        onClick={() =>
                                            handleStatusChange(
                                                message.id,
                                                "read"
                                            )
                                        }
                                    >
                                        Marcar leído
                                    </button>
                                )}

                                {message.status !== "archived" && (
                                    <button
                                        className="reject-button"
                                        onClick={() =>
                                            handleStatusChange(
                                                message.id,
                                                "archived"
                                            )
                                        }
                                    >
                                        Archivar
                                    </button>
                                )}

                            </div>

                        </div>

                    ))}

                </div>

            ) : (

                <div className="detail-card">

                    <h2>No hay mensajes para mostrar</h2>

                    <p>
                        Probá cambiar los filtros o esperá a que lleguen consultas
                        desde el formulario de contacto.
                    </p>

                </div>

            )}

        </div>

    );
}

export default AdminMessages;
