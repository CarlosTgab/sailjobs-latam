export function sameId(firstId, secondId) {
    if (
        firstId === null ||
        firstId === undefined ||
        secondId === null ||
        secondId === undefined
    ) {
        return false;
    }

    return String(firstId) === String(secondId);
}

export function hasId(list, id) {
    if (!Array.isArray(list)) {
        return false;
    }

    return list.some(itemId => sameId(itemId, id));
}

export function sortByNewest(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return [...items].sort((a, b) => {
        const dateA = a.createdAt || a.created_at || "";
        const dateB = b.createdAt || b.created_at || "";

        if (dateA || dateB) {
            return new Date(dateB) - new Date(dateA);
        }

        return String(b.id).localeCompare(String(a.id));
    });
}