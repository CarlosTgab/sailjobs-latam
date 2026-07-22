import * as XLSX from "xlsx";

function normalizeText(value) {
    return String(value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function slugify(value) {
    return normalizeText(value)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function toNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    const normalizedValue = String(value)
        .replace(",", ".")
        .replace(/[^0-9.-]/g, "");

    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : null;
}

function toInteger(value) {
    const parsedValue = toNumber(value);

    return parsedValue === null
        ? null
        : Math.trunc(parsedValue);
}

function getCell(row, index) {
    if (index < 0) return "";
    return row[index] ?? "";
}

function findColumnIndex(headers, acceptedNames) {
    const normalizedAcceptedNames = acceptedNames.map(normalizeText);

    return headers.findIndex(header => {
        const normalizedHeader = normalizeText(header);

        return normalizedAcceptedNames.some(acceptedName =>
            normalizedHeader === acceptedName ||
            normalizedHeader.includes(acceptedName)
        );
    });
}

function findHeaderRow(rows) {
    return rows.findIndex(row => {
        const normalizedCells = row.map(normalizeText);

        const hasPosition = normalizedCells.some(cell =>
            cell === "pos" ||
            cell === "pos." ||
            cell.includes("posicion")
        );

        const hasLastName = normalizedCells.some(cell =>
            cell.includes("apellido")
        );

        const hasFirstName = normalizedCells.some(cell =>
            cell.includes("nombre")
        );

        const hasClub = normalizedCells.some(cell =>
            cell === "club"
        );

        const hasNet = normalizedCells.some(cell =>
            cell === "net" ||
            cell.includes("neto")
        );

        return hasPosition && hasLastName && hasFirstName && hasClub && hasNet;
    });
}

function parseSheet(sheetName, worksheet) {
    const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
    });

    const headerRowIndex = findHeaderRow(rows);

    if (headerRowIndex === -1) {
        return {
            entries: [],
            warning: `No encontré encabezados válidos en la hoja ${sheetName}.`
        };
    }

    const headers = rows[headerRowIndex];

    const positionIndex = findColumnIndex(headers, [
        "pos",
        "posicion",
        "posición"
    ]);

    const lastNameIndex = findColumnIndex(headers, [
        "apellido"
    ]);

    const firstNameIndex = findColumnIndex(headers, [
        "nombre"
    ]);

    const clubIndex = findColumnIndex(headers, [
        "club"
    ]);

    const categoryIndex = findColumnIndex(headers, [
        "categoria",
        "categoría"
    ]);

    const netPointsIndex = findColumnIndex(headers, [
        "net",
        "neto",
        "netos"
    ]);

    const totalPointsIndex = findColumnIndex(headers, [
        "totales",
        "total"
    ]);

    const requiredIndexes = [
        positionIndex,
        lastNameIndex,
        firstNameIndex,
        clubIndex,
        categoryIndex,
        netPointsIndex,
        totalPointsIndex
    ];

    if (requiredIndexes.some(index => index === -1)) {
        return {
            entries: [],
            warning: `La hoja ${sheetName} tiene encabezados, pero falta alguna columna esperada.`
        };
    }

    const eventColumnIndexes = headers
        .map((header, index) => ({ header, index }))
        .filter(item =>
            item.index > totalPointsIndex &&
            String(item.header || "").trim()
        );

    const entries = [];

    rows.slice(headerRowIndex + 1).forEach((row, rowIndex) => {
        const position = toInteger(getCell(row, positionIndex));
        const lastName = String(getCell(row, lastNameIndex)).trim();
        const firstName = String(getCell(row, firstNameIndex)).trim();
        const club = String(getCell(row, clubIndex)).trim();
        const category = String(getCell(row, categoryIndex)).trim();
        const netPoints = toNumber(getCell(row, netPointsIndex));
        const totalPoints = toNumber(getCell(row, totalPointsIndex));

        if (!position && !lastName && !firstName) {
            return;
        }

        if (!position || !lastName || !firstName) {
            return;
        }

        const eventsBreakdown = {};

        eventColumnIndexes.forEach(({ header, index }) => {
            const value = getCell(row, index);

            if (value !== "" && value !== null && value !== undefined) {
                eventsBreakdown[String(header).trim()] = value;
            }
        });

        const events = Object.keys(eventsBreakdown).length;
        const className = String(sheetName || "").trim();
        const name = `${firstName} ${lastName}`.trim();

        entries.push({
            id: `${slugify(className)}-${position}-${slugify(lastName)}-${slugify(firstName)}-${rowIndex + 1}`,
            className,
            position,
            lastName,
            firstName,
            name,
            club,
            category,
            netPoints,
            totalPoints,
            events,
            eventsBreakdown
        });
    });

    return {
        entries,
        warning: ""
    };
}

function parseWorkbook(workbook) {
    const entries = [];
    const warnings = [];

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const parsedSheet = parseSheet(sheetName, worksheet);

        entries.push(...parsedSheet.entries);

        if (parsedSheet.warning) {
            warnings.push(parsedSheet.warning);
        }
    });

    if (entries.length === 0) {
        throw new Error(
            "No pude leer resultados del ranking. Revisá que la fuente tenga columnas Pos, Apellido, Nombre, CLUB, Categoría, Net y Totales."
        );
    }

    return {
        entries,
        warnings,
        sheetNames: workbook.SheetNames
    };
}

function isLikelyCsvUrl(url) {
    const normalizedUrl = normalizeText(url);

    return (
        normalizedUrl.includes("output=csv") ||
        normalizedUrl.includes("format=csv") ||
        normalizedUrl.endsWith(".csv") ||
        normalizedUrl.includes("tqx=out:csv")
    );
}

function getGoogleSpreadsheetId(url) {
    const match = String(url || "").match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1] || "";
}

function getGoogleDriveFileId(url) {
    const byPath = String(url || "").match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (byPath?.[1]) return byPath[1];

    const byQuery = String(url || "").match(/[?&]id=([a-zA-Z0-9-_]+)/);
    return byQuery?.[1] || "";
}

export function normalizeRankingSourceUrl(sourceUrl) {
    const trimmedUrl = String(sourceUrl || "").trim();

    if (!trimmedUrl) {
        return "";
    }

    const spreadsheetId = getGoogleSpreadsheetId(trimmedUrl);

    if (spreadsheetId) {
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
    }

    const driveFileId = getGoogleDriveFileId(trimmedUrl);

    if (driveFileId) {
        return `https://drive.google.com/uc?export=download&id=${driveFileId}`;
    }

    return trimmedUrl;
}

export async function parseRankingArrayBuffer(arrayBuffer) {
    if (!arrayBuffer) {
        throw new Error("No hay contenido para leer.");
    }

    const workbook = XLSX.read(arrayBuffer, {
        type: "array"
    });

    return parseWorkbook(workbook);
}

export async function parseRankingExcel(file) {
    if (!file) {
        throw new Error("Seleccioná un archivo Excel.");
    }

    const arrayBuffer = await file.arrayBuffer();

    return parseRankingArrayBuffer(arrayBuffer);
}

export async function parseRankingFromUrl(sourceUrl) {
    const normalizedUrl = normalizeRankingSourceUrl(sourceUrl);

    if (!normalizedUrl) {
        throw new Error("Pegá una URL pública del ranking.");
    }

    let response;

    try {
        response = await fetch(normalizedUrl);
    } catch {
        throw new Error(
            "No pude descargar la fuente externa. Verificá que la URL sea pública y permita acceso desde el navegador."
        );
    }

    if (!response.ok) {
        throw new Error(
            `No pude descargar la fuente externa. Estado HTTP: ${response.status}.`
        );
    }

    if (isLikelyCsvUrl(normalizedUrl)) {
        const csvText = await response.text();
        const workbook = XLSX.read(csvText, {
            type: "string"
        });

        return parseWorkbook(workbook);
    }

    const arrayBuffer = await response.arrayBuffer();

    try {
        return parseRankingArrayBuffer(arrayBuffer);
    } catch (error) {
        throw new Error(
            `${error.message} Si la fuente es Google Sheets, probá publicarla como CSV o usar el enlace de exportación.`
        );
    }
}
