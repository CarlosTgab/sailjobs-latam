export const FAY_CALENDAR_URL = "https://fay.org/calendarios/";
export const FAY_AGENDA_URL = "https://fay.org/agenda-oficial-fay/";
export const FAY_SOURCE_NAME = "Federación Argentina de Yachting";

const MONTHS = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    setiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12
};

const LOCATION_RULES = [
    {
        keys: ["rosario", "la florida"],
        cityName: "Rosario",
        state: "Santa Fe",
        stateCode: "AR-S",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["san nicolas", "san nicolás"],
        cityName: "San Nicolás",
        state: "Buenos Aires",
        stateCode: "AR-B",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["mar del plata", "cnmp"],
        cityName: "Mar del Plata",
        state: "Buenos Aires",
        stateCode: "AR-B",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["san isidro", "s.isidro", "cnsi", "csi", "cvsi", "ycsi"],
        cityName: "San Isidro",
        state: "Buenos Aires",
        stateCode: "AR-B",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["olivos", "cno"],
        cityName: "Olivos",
        state: "Buenos Aires",
        stateCode: "AR-B",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["tigre"],
        cityName: "Tigre",
        state: "Buenos Aires",
        stateCode: "AR-B",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["la plata", "crlp"],
        cityName: "La Plata",
        state: "Buenos Aires",
        stateCode: "AR-B",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["junin", "junín"],
        cityName: "Junín",
        state: "Buenos Aires",
        stateCode: "AR-B",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["rada tilly", "cndrt"],
        cityName: "Rada Tilly",
        state: "Chubut",
        stateCode: "AR-U",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["villa langostura", "villa la angostura", "cavla"],
        cityName: "Villa La Angostura",
        state: "Neuquén",
        stateCode: "AR-Q",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["parana", "paraná"],
        cityName: "Paraná",
        state: "Entre Ríos",
        stateCode: "AR-E",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["diamante"],
        cityName: "Diamante",
        state: "Entre Ríos",
        stateCode: "AR-E",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["concepcion del uruguay", "concepción del uruguay", "yce"],
        cityName: "Concepción del Uruguay",
        state: "Entre Ríos",
        stateCode: "AR-E",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["nunez", "nuñez", "richuelo", "cuba", "yca", "bsas", "buenos aires"],
        cityName: "Buenos Aires",
        state: "Ciudad Autónoma de Buenos Aires",
        stateCode: "AR-C",
        country: "Argentina",
        countryCode: "AR"
    },
    {
        keys: ["punta del este", "p.del este", "ycpe", "la barra", "solanas"],
        cityName: "Punta del Este",
        state: "Maldonado",
        stateCode: "UY-MA",
        country: "Uruguay",
        countryCode: "UY"
    },
    {
        keys: ["colonia"],
        cityName: "Colonia del Sacramento",
        state: "Colonia",
        stateCode: "UY-CO",
        country: "Uruguay",
        countryCode: "UY"
    },
    {
        keys: ["buceo", "montevideo"],
        cityName: "Montevideo",
        state: "Montevideo",
        stateCode: "UY-MO",
        country: "Uruguay",
        countryCode: "UY"
    }
];

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function cleanCell(value) {
    return String(value || "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function hashString(value) {
    let hash = 0;
    const text = String(value || "");

    for (let index = 0; index < text.length; index += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash).toString(36);
}

function padNumber(value) {
    return String(value).padStart(2, "0");
}

function toIsoDate(year, monthName, dayValue) {
    const month = MONTHS[normalizeText(monthName)];
    const day = Number(String(dayValue || "").replace(/\D/g, ""));

    if (!month || !day) {
        return "";
    }

    return `${year}-${padNumber(month)}-${padNumber(day)}`;
}

function splitCells(line) {
    const trimmed = String(line || "").trim();

    if (!trimmed) {
        return [];
    }

    if (trimmed.includes("\t")) {
        return trimmed
            .split("\t")
            .map(cleanCell);
    }

    if (trimmed.includes("|")) {
        return trimmed
            .split("|")
            .map(cleanCell)
            .filter(cell => cell && cell !== "---");
    }

    if (trimmed.includes(";")) {
        return trimmed
            .split(";")
            .map(cleanCell);
    }

    return [];
}

function isHeaderOrSeparator(cells) {
    const joined = normalizeText(cells.join(" "));

    if (!joined) return true;

    return (
        joined.includes("mes") &&
        joined.includes("regata")
    ) || joined.replace(/-/g, "").trim() === "";
}

function inferCalendarType(cells, selectedCalendarType) {
    if (selectedCalendarType && selectedCalendarType !== "auto") {
        return selectedCalendarType;
    }

    const joined = normalizeText(cells.join(" "));

    if (joined.includes("recorrido") || joined.includes("formula")) {
        return "formulas";
    }

    return "monotipos";
}

function inferLocationFromText(...values) {
    const text = normalizeText(values.filter(Boolean).join(" "));

    const matchedRule = LOCATION_RULES.find(rule =>
        rule.keys.some(key => text.includes(normalizeText(key)))
    );

    if (matchedRule) {
        return {
            ...matchedRule,
            city: `${matchedRule.cityName}, ${matchedRule.state}`
        };
    }

    const fallbackCity = cleanCell(values.find(Boolean) || "");

    return {
        country: "Argentina",
        countryCode: "AR",
        state: "",
        stateCode: "",
        cityName: fallbackCity,
        city: fallbackCity
    };
}

function buildDescription(row, calendarType) {
    const parts = [
        "Evento importado desde el calendario FAY.",
        calendarType === "formulas"
            ? `Recorrido: ${row.route || "No informado"}.`
            : `Lugar: ${row.locationRaw || "No informado"}.`,
        `Organizador / club indicado por FAY: ${row.organizingClubName || "No informado"}.`
    ];

    return parts.join(" ");
}

function buildGroupedEvent(group, year) {
    const dates = group.rows
        .map(row => row.date)
        .filter(Boolean)
        .sort();

    const firstRow = group.rows[0];
    const startDate = dates[0] || "";
    const endDate = dates[dates.length - 1] || startDate;

    const location = inferLocationFromText(
        firstRow.locationRaw,
        firstRow.route,
        firstRow.organizingClubName,
        firstRow.title
    );

    const externalId = `fay-${year}-${hashString(group.key)}`;

    return {
        id: externalId,
        externalId,
        externalSource: "fay",
        externalCalendarType: firstRow.calendarType,
        importedAt: new Date().toISOString(),

        title: firstRow.title,
        clubId: "",
        organizerType: "organization",
        proposedByType: "organization",
        proposedById: "",
        proposedByName: FAY_SOURCE_NAME,
        ownerType: "organization",
        ownerId: "",
        ownerName: FAY_SOURCE_NAME,
        organizationId: "",
        organizationName: FAY_SOURCE_NAME,
        reviewingOrganizationId: "",
        reviewingOrganizationName: FAY_SOURCE_NAME,
        organizingClubName: firstRow.organizingClubName,

        className: firstRow.className,
        country: location.country,
        countryCode: location.countryCode,
        state: location.state,
        stateCode: location.stateCode,
        city: location.city,
        cityName: location.cityName,

        startDate,
        endDate,
        website: FAY_CALENDAR_URL,
        source: "FAY",
        sourceUrl: FAY_CALENDAR_URL,
        status: "approved",
        isOfficial: true,
        description: buildDescription(firstRow, firstRow.calendarType),
        metadata: {
            year,
            calendarType: firstRow.calendarType,
            sourceName: FAY_SOURCE_NAME,
            originalRows: group.rows.map(row => row.originalLine)
        }
    };
}

export function parseFayCalendarText(rawText, options = {}) {
    const year = Number(options.year) || new Date().getFullYear();
    const selectedCalendarType = options.calendarType || "auto";

    const lines = String(rawText || "")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const parsedRows = [];
    const rejectedRows = [];

    lines.forEach((line) => {
        const cells = splitCells(line);

        if (cells.length === 0) {
            rejectedRows.push({
                line,
                reason: "No se pudo separar en columnas. Copiá la tabla completa desde FAY o pegá filas separadas por tabulaciones, barras verticales o punto y coma."
            });
            return;
        }

        if (isHeaderOrSeparator(cells)) {
            return;
        }

        if (cells.length < 7) {
            rejectedRows.push({
                line,
                reason: "La fila tiene menos de 7 columnas."
            });
            return;
        }

        const calendarType = inferCalendarType(cells, selectedCalendarType);
        const [monthName, dayName, dayNumber] = cells;
        const title = cleanCell(cells[3]);
        const date = toIsoDate(year, monthName, dayNumber);

        if (!date || !title) {
            rejectedRows.push({
                line,
                reason: "No se pudo leer mes, día o nombre de regata."
            });
            return;
        }

        const row = calendarType === "formulas"
            ? {
                calendarType,
                monthName,
                dayName,
                dayNumber,
                date,
                title,
                route: cleanCell(cells[4]),
                organizingClubName: cleanCell(cells[5]),
                className: cleanCell(cells[6]) || "Fórmulas",
                locationRaw: cleanCell(cells[4]),
                originalLine: line
            }
            : {
                calendarType,
                monthName,
                dayName,
                dayNumber,
                date,
                title,
                className: cleanCell(cells[4]) || "Monotipos",
                organizingClubName: cleanCell(cells[5]),
                locationRaw: cleanCell(cells[6]),
                route: "",
                originalLine: line
            };

        parsedRows.push(row);
    });

    const groupedRows = parsedRows.reduce((accumulator, row) => {
        const key = [
            row.calendarType,
            normalizeText(row.title),
            normalizeText(row.className),
            normalizeText(row.organizingClubName),
            normalizeText(row.locationRaw),
            normalizeText(row.route)
        ].join("|");

        if (!accumulator[key]) {
            accumulator[key] = {
                key,
                rows: []
            };
        }

        accumulator[key].rows.push(row);

        return accumulator;
    }, {});

    const events = Object.values(groupedRows)
        .map(group => buildGroupedEvent(group, year))
        .sort((firstEvent, secondEvent) =>
            new Date(firstEvent.startDate) - new Date(secondEvent.startDate)
        );

    return {
        events,
        parsedRows,
        rejectedRows
    };
}
