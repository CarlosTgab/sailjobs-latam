import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../utils/authStorage";
import { isSuperadmin } from "../utils/permissions";
import { upsertStoredEvents, getImportedEventsBySource } from "../utils/eventsStorage";
import {
    FAY_CALENDAR_URL,
    FAY_AGENDA_URL,
    parseFayCalendarText
} from "../utils/fayCalendarImport";

function formatDate(date) {
    if (!date) {
        return "Fecha a confirmar";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString(
        "es-AR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function getLocationLabel(event) {
    const parts = [
        event.cityName,
        event.state,
        event.country
    ].filter(Boolean);

    return parts.length > 0
        ? parts.join(", ")
        : "Ubicación no informada";
}

function AdminFayImport() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [year, setYear] = useState("2026");
    const [calendarType, setCalendarType] = useState("monotipos");
    const [rawCalendarText, setRawCalendarText] = useState("");
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [message, setMessage] = useState("");
    const [importedEvents, setImportedEvents] = useState(
        getImportedEventsBySource("fay")
    );

    const parsedResult = useMemo(
        () => parseFayCalendarText(rawCalendarText, {
            year,
            calendarType
        }),
        [rawCalendarText, year, calendarType]
    );

    const parsedEvents = parsedResult.events;

    if (!currentUser || !isSuperadmin(currentUser)) {
        return (
            <div className="dashboard-page">
                <h1>Acceso denegado</h1>

                <p>
                    Solo el superadmin puede importar calendarios oficiales externos.
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

    function handleToggleEvent(eventId) {
        setSelectedEventIds(previousIds =>
            previousIds.includes(eventId)
                ? previousIds.filter(id => id !== eventId)
                : [...previousIds, eventId]
        );
    }

    function handleSelectAll() {
        setSelectedEventIds(parsedEvents.map(event => event.id));
    }

    function handleClearSelection() {
        setSelectedEventIds([]);
    }

    function handleImportSelected() {
        const eventsToImport = parsedEvents.filter(event =>
            selectedEventIds.includes(event.id)
        );

        if (eventsToImport.length === 0) {
            setMessage("Seleccioná al menos un evento para importar.");
            return;
        }

        const imported = upsertStoredEvents(eventsToImport);
        setImportedEvents(getImportedEventsBySource("fay"));
        setMessage(`Se importaron / actualizaron ${imported.length} eventos FAY.`);
    }

    function handleOpenFayCalendar() {
        window.open(FAY_CALENDAR_URL, "_blank", "noopener,noreferrer");
    }

    function handleOpenFayAgenda() {
        window.open(FAY_AGENDA_URL, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="dashboard-page admin-fay-page">
            <button
                className="back-button"
                onClick={() => navigate("/superadmin")}
            >
                ← Volver al panel admin
            </button>

            <div className="dashboard-hero">
                <div>
                    <h1>Importar calendario FAY</h1>

                    <p>
                        Importá eventos oficiales de la Federación Argentina de Yachting
                        como fuente externa de SailJobs LATAM.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        type="button"
                        className="apply-button"
                        onClick={handleOpenFayCalendar}
                    >
                        Abrir Calendarios FAY
                    </button>

                    <button
                        type="button"
                        className="small-action-button"
                        onClick={handleOpenFayAgenda}
                    >
                        Abrir Agenda FAY
                    </button>
                </div>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <h2>{parsedEvents.length}</h2>
                    <p>Detectados en el texto</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{selectedEventIds.length}</h2>
                    <p>Seleccionados</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{importedEvents.length}</h2>
                    <p>Ya importados desde FAY</p>
                </div>

                <div className="dashboard-stat-card">
                    <h2>{parsedResult.rejectedRows.length}</h2>
                    <p>Filas no leídas</p>
                </div>
            </div>

            <div className="detail-card">
                <h2>1. Copiar datos desde FAY</h2>

                <p>
                    Abrí la página de Calendarios FAY, seleccioná las filas de la tabla
                    de Monotipos o Fórmulas, copialas y pegalas acá. El importador agrupa
                    filas repetidas del mismo campeonato para armar eventos de varios días.
                </p>

                <div className="calendar-filters">
                    <input
                        type="number"
                        min="2020"
                        max="2100"
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                        placeholder="Año"
                    />

                    <select
                        value={calendarType}
                        onChange={(event) => {
                            setCalendarType(event.target.value);
                            setSelectedEventIds([]);
                        }}
                    >
                        <option value="monotipos">
                            Monotipos FAY
                        </option>

                        <option value="formulas">
                            Fórmulas FAY
                        </option>

                        <option value="auto">
                            Detectar automáticamente
                        </option>
                    </select>
                </div>

                <textarea
                    className="admin-import-textarea"
                    rows="12"
                    value={rawCalendarText}
                    onChange={(event) => {
                        setRawCalendarText(event.target.value);
                        setSelectedEventIds([]);
                        setMessage("");
                    }}
                    placeholder={
                        "Pegá acá las filas copiadas desde la tabla FAY. Ejemplo:\nenero\tsábado\t17\tCampeonato Apertura\tSTAR\tCNO\tOlivos"
                    }
                />
            </div>

            <div className="detail-card">
                <div className="section-header">
                    <h2>2. Previsualizar e importar</h2>

                    <div className="dashboard-actions">
                        <button
                            type="button"
                            className="small-action-button"
                            onClick={handleSelectAll}
                            disabled={parsedEvents.length === 0}
                        >
                            Seleccionar todos
                        </button>

                        <button
                            type="button"
                            className="small-action-button"
                            onClick={handleClearSelection}
                            disabled={selectedEventIds.length === 0}
                        >
                            Limpiar selección
                        </button>

                        <button
                            type="button"
                            className="apply-button"
                            onClick={handleImportSelected}
                            disabled={selectedEventIds.length === 0}
                        >
                            Importar seleccionados
                        </button>
                    </div>
                </div>

                {message && (
                    <p>
                        <strong>{message}</strong>
                    </p>
                )}

                {parsedEvents.length > 0 ? (
                    <div className="dashboard-grid">
                        {parsedEvents.map(event => (
                            <div
                                key={event.id}
                                className="dashboard-card"
                            >
                                <div className="event-card-top">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={selectedEventIds.includes(event.id)}
                                            onChange={() => handleToggleEvent(event.id)}
                                        />
                                        {" "}
                                        Importar
                                    </label>

                                    <span className="status-pill approved">
                                        FAY oficial
                                    </span>
                                </div>

                                <h3>{event.title}</h3>

                                <p>
                                    <strong>Clase / fórmula:</strong>{" "}
                                    {event.className || "No informada"}
                                </p>

                                <p>
                                    <strong>Organizador indicado:</strong>{" "}
                                    {event.organizingClubName || "No informado"}
                                </p>

                                <p>
                                    <strong>Ubicación:</strong>{" "}
                                    {getLocationLabel(event)}
                                </p>

                                <p>
                                    <strong>Fecha:</strong>{" "}
                                    {formatDate(event.startDate)}
                                    {" "}
                                    -
                                    {" "}
                                    {formatDate(event.endDate)}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        Pegá filas de la tabla FAY para ver la previsualización.
                    </p>
                )}
            </div>

            {parsedResult.rejectedRows.length > 0 && (
                <div className="detail-card">
                    <h2>Filas no leídas</h2>

                    <p>
                        Estas filas no se importan. Revisá si copiaste encabezados,
                        separadores o texto fuera de la tabla.
                    </p>

                    <div className="dashboard-list">
                        {parsedResult.rejectedRows.slice(0, 10).map((row, index) => (
                            <div
                                key={`${row.line}-${index}`}
                                className="dashboard-list-item"
                            >
                                <div>
                                    <h4>{row.reason}</h4>
                                    <p>{row.line}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminFayImport;
