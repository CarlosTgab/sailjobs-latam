import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    normalizeRankingSourceUrl,
    parseRankingExcel,
    parseRankingFromUrl
} from "../utils/rankingParser";

import {
    getActiveRankingSource,
    publishRankingImport,
    saveRankingSource
} from "../utils/rankingStorage";

function getClassSummary(entries) {
    return entries.reduce((summary, entry) => {
        const className = entry.className || "Sin clase";

        summary[className] = (summary[className] || 0) + 1;

        return summary;
    }, {});
}

function getSuggestedTitle() {
    const today = new Date();

    return `Ranking 2026 - ${today.toLocaleDateString("es-AR")}`;
}

function AdminRanking() {
    const navigate = useNavigate();

    const [importTitle, setImportTitle] = useState(getSuggestedTitle());
    const [sourceFileName, setSourceFileName] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [sourceName, setSourceName] = useState("Ranking ILCA / AAL");
    const [sourceType, setSourceType] = useState("file");
    const [entries, setEntries] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoadingSource, setIsLoadingSource] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const normalizedSourceUrl = normalizeRankingSourceUrl(sourceUrl);

    const classSummary = useMemo(
        () => getClassSummary(entries),
        [entries]
    );

    const previewEntries = entries.slice(0, 20);

    useEffect(() => {
        let isMounted = true;

        async function loadRankingSource() {
            setIsLoadingSource(true);

            try {
                const activeSource = await getActiveRankingSource();

                if (!isMounted || !activeSource) {
                    return;
                }

                setSourceName(activeSource.name || "Ranking ILCA / AAL");
                setSourceUrl(activeSource.sourceUrl || "");
            } catch {
                if (isMounted) {
                    setMessage(
                        "No hay fuente externa guardada todavía. Podés pegar una URL pública abajo."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingSource(false);
                }
            }
        }

        loadRankingSource();

        return () => {
            isMounted = false;
        };
    }, []);

    function resetPreview() {
        setWarnings([]);
        setEntries([]);
    }

    async function handleFileChange(event) {
        const file = event.target.files?.[0];

        setMessage("");
        setErrorMessage("");
        resetPreview();

        if (!file) {
            setSourceFileName("");
            return;
        }

        setSourceType("file");
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

    async function handleReadFromUrl() {
        setMessage("");
        setErrorMessage("");
        resetPreview();

        if (!sourceUrl.trim()) {
            setErrorMessage("Pegá una URL pública del ranking.");
            return;
        }

        setSourceType("url");
        setSourceFileName(sourceUrl.trim());
        setIsParsing(true);

        try {
            const parsedRanking = await parseRankingFromUrl(sourceUrl);

            setEntries(parsedRanking.entries);
            setWarnings(parsedRanking.warnings);
            setMessage(
                `Fuente externa leída correctamente: ${parsedRanking.entries.length} registros encontrados.`
            );
        } catch (error) {
            setErrorMessage(
                error.message || "No se pudo leer la fuente externa del ranking."
            );
        } finally {
            setIsParsing(false);
        }
    }

    async function handleSaveSource() {
        setMessage("");
        setErrorMessage("");

        try {
            await saveRankingSource({
                name: sourceName,
                sourceUrl,
                sourceType: "url"
            });

            setMessage("Fuente externa guardada correctamente.");
        } catch (error) {
            setErrorMessage(
                error.message || "No se pudo guardar la fuente externa."
            );
        }
    }

    async function handlePublish() {
        setMessage("");
        setErrorMessage("");

        if (entries.length === 0) {
            setErrorMessage("Primero cargá un Excel válido o leé una fuente externa válida.");
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
            if (sourceType === "url" && sourceUrl.trim()) {
                await saveRankingSource({
                    name: sourceName,
                    sourceUrl,
                    sourceType: "url"
                });
            }

            await publishRankingImport({
                title: importTitle,
                sourceFileName,
                sourceUrl: sourceType === "url" ? sourceUrl.trim() : "",
                sourceType,
                entries
            });

            setMessage(
                "Ranking publicado correctamente. Ya se puede ver en la página pública de Ranking."
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "No se pudo publicar el ranking. Revisá que hayas corrido el SQL actualizado de ranking en Supabase."
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
                        Subí el Excel oficial o conectá una URL pública. SailJobs lee la fuente,
                        muestra una vista previa y publica el ranking para todos los usuarios.
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        className="apply-button"
                        onClick={() => navigate("/admin/ranking-profiles")}
                    >
                        Vincular perfiles
                    </button>

                    <button
                        className="small-action-button"
                        onClick={() => navigate("/ranking")}
                    >
                        Ver ranking público
                    </button>
                </div>
            </div>

            <div className="detail-card">
                <h2>Fuente externa</h2>

                <p>
                    Usá esta opción cuando el ranking esté publicado como Google Sheets, CSV o Excel público.
                    Así no hace falta descargar y subir el archivo cada vez.
                </p>

                <form className="auth-form">
                    <label>
                        Nombre de la fuente
                    </label>

                    <input
                        type="text"
                        value={sourceName}
                        onChange={(event) => setSourceName(event.target.value)}
                        placeholder="Ej: Ranking oficial AAL"
                    />

                    <label>
                        URL pública del ranking
                    </label>

                    <input
                        type="url"
                        value={sourceUrl}
                        onChange={(event) => setSourceUrl(event.target.value)}
                        placeholder="Pegá el enlace público al Excel, CSV o Google Sheet"
                    />

                    {normalizedSourceUrl && normalizedSourceUrl !== sourceUrl.trim() && (
                        <p className="password-help">
                            SailJobs intentará leer esta URL convertida: {normalizedSourceUrl}
                        </p>
                    )}

                    <div className="dashboard-actions">
                        <button
                            className="apply-button"
                            type="button"
                            onClick={handleReadFromUrl}
                            disabled={isParsing || isLoadingSource}
                        >
                            {isParsing && sourceType === "url"
                                ? "Leyendo fuente..."
                                : "Leer ranking desde URL"}
                        </button>

                        <button
                            className="small-action-button"
                            type="button"
                            onClick={handleSaveSource}
                            disabled={!sourceUrl.trim()}
                        >
                            Guardar fuente
                        </button>
                    </div>
                </form>
            </div>

            <div className="detail-card">
                <h2>Importar archivo manual</h2>

                <p>
                    Dejá esta opción como respaldo si la fuente externa no permite lectura automática.
                </p>

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

                {isLoadingSource && (
                    <p>Cargando fuente guardada...</p>
                )}

                {isParsing && (
                    <p>Procesando ranking...</p>
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
