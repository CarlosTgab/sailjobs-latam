import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { parseRankingExcel } from "../utils/rankingParser";
import { publishRankingImport } from "../utils/rankingStorage";

function getClassSummary(entries) {
    return entries.reduce((summary, entry) => {
        const className = entry.className || "Sin clase";

        summary[className] = (summary[className] || 0) + 1;

        return summary;
    }, {});
}

function AdminRanking() {
    const navigate = useNavigate();

    const [importTitle, setImportTitle] = useState("Ranking 2026");
    const [sourceFileName, setSourceFileName] = useState("");
    const [entries, setEntries] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const classSummary = useMemo(
        () => getClassSummary(entries),
        [entries]
    );

    const previewEntries = entries.slice(0, 20);

    async function handleFileChange(event) {
        const file = event.target.files?.[0];

        setMessage("");
        setErrorMessage("");
        setWarnings([]);
        setEntries([]);

        if (!file) {
            setSourceFileName("");
            return;
        }

        setSourceFileName(file.name);
        setIsParsing(true);

        try {
            const parsedRanking = await parseRankingExcel(file);

            setEntries(parsedRanking.entries);
            setWarnings(parsedRanking.warnings);
            setMessage(
                `Archivo leído correctamente: ${parsedRanking.entries.length} registros encontrados.`
            );
        } catch (error) {
            setErrorMessage(
                error.message || "No se pudo leer el archivo de ranking."
            );
        } finally {
            setIsParsing(false);
        }
    }

    async function handlePublish() {
        setMessage("");
        setErrorMessage("");

        if (entries.length === 0) {
            setErrorMessage("Primero cargá un Excel válido.");
            return;
        }

        const confirmPublish = window.confirm(
            "¿Publicar este ranking? Reemplazará el ranking activo para todos los usuarios."
        );

        if (!confirmPublish) {
            return;
        }

        setIsPublishing(true);

        try {
            await publishRankingImport({
                title: importTitle,
                sourceFileName,
                entries
            });

            setMessage(
                "Ranking publicado correctamente. Ya se puede ver en la página pública de Ranking."
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "No se pudo publicar el ranking. Revisá que hayas corrido el SQL de ranking en Supabase."
            );
        } finally {
            setIsPublishing(false);
        }
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
                    <h1>Actualizar ranking</h1>

                    <p>
                        Subí el Excel oficial del ranking ILCA. SailJobs lo lee,
                        muestra una vista previa y lo publica para todos los usuarios.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/ranking")}
                    >
                        Ver ranking público
                    </button>
                </div>
            </div>

            <div className="detail-card">
                <h2>Importar Excel</h2>

                <form className="auth-form">
                    <label>
                        Nombre de la importación
                    </label>

                    <input
                        type="text"
                        value={importTitle}
                        onChange={(event) => setImportTitle(event.target.value)}
                        placeholder="Ej: Ranking 2026 - actualización julio"
                    />

                    <label>
                        Archivo Excel
                    </label>

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                    />
                </form>

                {isParsing && (
                    <p>Procesando archivo...</p>
                )}

                {message && (
                    <p className="status-pill approved">
                        {message}
                    </p>
                )}

                {errorMessage && (
                    <p className="status-pill rejected">
                        {errorMessage}
                    </p>
                )}

                {warnings.length > 0 && (
                    <div className="ranking-note">
                        <strong>Advertencias:</strong>

                        <ul>
                            {warnings.map((warning, index) => (
                                <li key={`${warning}-${index}`}>
                                    {warning}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {entries.length > 0 && (
                <>
                    <div className="dashboard-stats">
                        <div className="dashboard-stat-card">
                            <h2>{entries.length}</h2>
                            <p>Registros detectados</p>
                        </div>

                        {Object.entries(classSummary).map(([className, total]) => (
                            <div
                                className="dashboard-stat-card"
                                key={className}
                            >
                                <h2>{total}</h2>
                                <p>{className}</p>
                            </div>
                        ))}
                    </div>

                    <div className="detail-card">
                        <div className="section-header">
                            <div>
                                <h2>Vista previa</h2>

                                <p>
                                    Se muestran los primeros 20 registros antes de publicar.
                                </p>
                            </div>

                            <button
                                className="apply-button"
                                type="button"
                                onClick={handlePublish}
                                disabled={isPublishing}
                            >
                                {isPublishing
                                    ? "Publicando..."
                                    : "Publicar ranking"}
                            </button>
                        </div>

                        <div className="ranking-table-wrapper">
                            <table className="ranking-table">
                                <thead>
                                    <tr>
                                        <th>Pos.</th>
                                        <th>Timonel</th>
                                        <th>Club</th>
                                        <th>Clase</th>
                                        <th>Categoría</th>
                                        <th>Net</th>
                                        <th>Totales</th>
                                        <th>Campeonatos</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {previewEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td>#{entry.position}</td>
                                            <td>
                                                <strong>{entry.name}</strong>
                                            </td>
                                            <td>{entry.club}</td>
                                            <td>{entry.className}</td>
                                            <td>{entry.category}</td>
                                            <td>
                                                <strong>{entry.netPoints}</strong>
                                            </td>
                                            <td>{entry.totalPoints}</td>
                                            <td>{entry.events}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AdminRanking;
