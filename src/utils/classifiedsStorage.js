import { sameId } from "./idUtils";

const CLASSIFIEDS_STORAGE_KEY = "storedClassifieds";

function readStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function normalizeClassified(classified) {
    if (!classified) {
        return null;
    }

    return {
        id: classified.id || crypto.randomUUID?.() || Date.now(),
        title: classified.title || "Clasificado sin título",
        category: classified.category || "",
        price: classified.price || "",
        country: classified.country || "",
        city: classified.city || "",
        description: classified.description || "",
        images: Array.isArray(classified.images) ? classified.images : [],
        sellerName: classified.sellerName || "",
        sellerEmail: classified.sellerEmail || "",
        sellerPhone: classified.sellerPhone || "",
        userId: classified.userId || classified.user_id || null,
        createdAt: classified.createdAt || classified.created_at || new Date().toISOString(),
        updatedAt: classified.updatedAt || classified.updated_at || null,
        status: classified.status || "active"
    };
}

function uniqueClassifieds(classifieds) {
    const result = [];

    classifieds.forEach(classified => {
        const normalized = normalizeClassified(classified);

        if (!normalized) {
            return;
        }

        if (!result.some(item => sameId(item.id, normalized.id))) {
            result.push(normalized);
        }
    });

    return result;
}

export function getStoredClassifieds() {
    return uniqueClassifieds(readStorageArray(CLASSIFIEDS_STORAGE_KEY));
}

export function saveStoredClassifieds(classifieds) {
    const normalized = uniqueClassifieds(classifieds);

    localStorage.setItem(
        CLASSIFIEDS_STORAGE_KEY,
        JSON.stringify(normalized)
    );

    window.dispatchEvent(new Event("classifiedsChanged"));

    return normalized;
}

export function createStoredClassified(classifiedData) {
    const classifieds = getStoredClassifieds();

    const newClassified = normalizeClassified({
        ...classifiedData,
        id: classifiedData.id || crypto.randomUUID?.() || Date.now(),
        createdAt: classifiedData.createdAt || new Date().toISOString(),
        updatedAt: null,
        status: classifiedData.status || "active"
    });

    saveStoredClassifieds([
        ...classifieds,
        newClassified
    ]);

    return newClassified;
}

export function updateStoredClassified(classifiedId, updatedData) {
    const classifieds = getStoredClassifieds();

    const updatedClassifieds = classifieds.map(classified => {
        if (sameId(classified.id, classifiedId)) {
            return normalizeClassified({
                ...classified,
                ...updatedData,
                id: classified.id,
                updatedAt: new Date().toISOString()
            });
        }

        return classified;
    });

    saveStoredClassifieds(updatedClassifieds);

    return updatedClassifieds.find(classified =>
        sameId(classified.id, classifiedId)
    );
}

export function deleteStoredClassified(classifiedId) {
    const classifieds = getStoredClassifieds();

    saveStoredClassifieds(
        classifieds.filter(classified =>
            !sameId(classified.id, classifiedId)
        )
    );
}

export function getAllClassifieds(staticClassifieds = []) {
    return uniqueClassifieds([
        ...staticClassifieds,
        ...getStoredClassifieds()
    ]);
}
