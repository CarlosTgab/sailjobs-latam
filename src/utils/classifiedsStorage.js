import { sameId } from "./idUtils";

const CLASSIFIEDS_STORAGE_KEY = "storedClassifieds";
const HIDDEN_CLASSIFIEDS_STORAGE_KEY = "hiddenClassifieds";

function readStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function writeStorageArray(key, items) {
    localStorage.setItem(
        key,
        JSON.stringify(items)
    );
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
        countryCode: classified.countryCode || classified.country_code || "",
        state: classified.state || classified.province || classified.region || "",
        stateCode: classified.stateCode || classified.state_code || "",
        city: classified.city || "",
        cityName: classified.cityName || classified.city_name || classified.city || "",

        description: classified.description || "",
        images: Array.isArray(classified.images) ? classified.images : [],
        sellerName: classified.sellerName || "",
        sellerEmail: classified.sellerEmail || "",
        sellerPhone: classified.sellerPhone || "",
        userId: classified.userId || classified.user_id || null,
        createdAt: classified.createdAt || classified.created_at || new Date().toISOString(),
        updatedAt: classified.updatedAt || classified.updated_at || null,
        status: classified.status || "active",
        moderationReason: classified.moderationReason || "",
        moderatedAt: classified.moderatedAt || classified.moderated_at || null
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

function isVisibleClassified(classified) {
    return (
        classified.status !== "hidden" &&
        classified.status !== "deleted"
    );
}

export function getHiddenClassifiedIds() {
    return readStorageArray(HIDDEN_CLASSIFIEDS_STORAGE_KEY);
}

function saveHiddenClassifiedIds(ids) {
    const uniqueIds = [];

    ids.forEach(id => {
        if (!uniqueIds.some(existingId => sameId(existingId, id))) {
            uniqueIds.push(id);
        }
    });

    writeStorageArray(HIDDEN_CLASSIFIEDS_STORAGE_KEY, uniqueIds);

    window.dispatchEvent(new Event("classifiedsChanged"));

    return uniqueIds;
}

export function isClassifiedHidden(classifiedId) {
    return getHiddenClassifiedIds().some(id =>
        sameId(id, classifiedId)
    );
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

export function hideStoredClassified(classifiedId, reason = "") {
    const storedClassified = getStoredClassifieds().find(classified =>
        sameId(classified.id, classifiedId)
    );

    saveHiddenClassifiedIds([
        ...getHiddenClassifiedIds(),
        classifiedId
    ]);

    if (storedClassified) {
        updateStoredClassified(classifiedId, {
            status: "hidden",
            moderationReason: reason,
            moderatedAt: new Date().toISOString()
        });
    }
}

export function restoreStoredClassified(classifiedId) {
    saveHiddenClassifiedIds(
        getHiddenClassifiedIds().filter(id =>
            !sameId(id, classifiedId)
        )
    );

    const storedClassified = getStoredClassifieds().find(classified =>
        sameId(classified.id, classifiedId)
    );

    if (storedClassified) {
        updateStoredClassified(classifiedId, {
            status: "active",
            moderationReason: "",
            moderatedAt: new Date().toISOString()
        });
    }
}

export function deleteStoredClassified(classifiedId) {
    const classifieds = getStoredClassifieds();

    saveStoredClassifieds(
        classifieds.filter(classified =>
            !sameId(classified.id, classifiedId)
        )
    );
}

export function getAllClassifiedsForAdmin(staticClassifieds = []) {
    const hiddenIds = getHiddenClassifiedIds();

    return uniqueClassifieds([
        ...staticClassifieds,
        ...getStoredClassifieds()
    ]).map(classified => {
        if (hiddenIds.some(id => sameId(id, classified.id))) {
            return {
                ...classified,
                status: "hidden"
            };
        }

        return classified;
    });
}

export function getAllClassifieds(staticClassifieds = []) {
    return getAllClassifiedsForAdmin(staticClassifieds)
        .filter(isVisibleClassified);
}
