import { supabase } from "../lib/supabaseClient";
import { sameId } from "./idUtils";

const CLASSIFIEDS_STORAGE_KEY = "storedClassifieds";
const CLASSIFIED_IMAGES_BUCKET = "classified-images";
const MAX_CLASSIFIED_IMAGES = 3;
const MAX_IMAGE_INPUT_SIZE = 10 * 1024 * 1024;

function readStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function safeDispatchClassifiedsChanged() {
    try {
        window.dispatchEvent(new Event("classifiedsChanged"));
    } catch {
        // No-op outside browser contexts.
    }
}

function getPublicImageUrl(path) {
    if (!path) return "";

    if (
        String(path).startsWith("http://") ||
        String(path).startsWith("https://") ||
        String(path).startsWith("data:") ||
        String(path).startsWith("blob:")
    ) {
        return path;
    }

    return supabase.storage
        .from(CLASSIFIED_IMAGES_BUCKET)
        .getPublicUrl(path)
        .data.publicUrl;
}

export function normalizeClassified(classified) {
    if (!classified) return null;

    const imagePaths = Array.isArray(classified.imagePaths)
        ? classified.imagePaths
        : Array.isArray(classified.image_paths)
            ? classified.image_paths
            : [];

    const images = imagePaths.length > 0
        ? imagePaths.map(getPublicImageUrl).filter(Boolean)
        : Array.isArray(classified.images)
            ? classified.images
            : [];

    return {
        id: classified.id || crypto.randomUUID?.() || String(Date.now()),
        title: classified.title || "Clasificado sin título",
        category: classified.category === "Barco"
            ? "Casco"
            : classified.category || "",
        price: classified.price || "",
        clubName: classified.clubName || classified.club_name || classified.club || "",
        modelYear:
            classified.modelYear ??
            classified.model_year ??
            classified.year ??
            "",
        serialNumber:
            classified.serialNumber ||
            classified.serial_number ||
            "",
        country: classified.country || "",
        countryCode: classified.countryCode || classified.country_code || "",
        state: classified.state || classified.province || classified.region || "",
        stateCode: classified.stateCode || classified.state_code || "",
        city: classified.city || "",
        cityName: classified.cityName || classified.city_name || classified.city || "",
        description: classified.description || "",
        imagePaths,
        images,
        sellerName: classified.sellerName || classified.seller_name || "",
        sellerEmail: classified.sellerEmail || classified.seller_email || "",
        sellerPhone: classified.sellerPhone || classified.seller_phone || "",
        userId: classified.userId || classified.user_id || null,
        createdAt: classified.createdAt || classified.created_at || new Date().toISOString(),
        updatedAt: classified.updatedAt || classified.updated_at || null,
        status: classified.status || "active",
        moderationReason: classified.moderationReason || classified.moderation_reason || "",
        moderatedAt: classified.moderatedAt || classified.moderated_at || null
    };
}

function uniqueClassifieds(classifieds) {
    const result = [];

    classifieds.forEach(classified => {
        const normalized = normalizeClassified(classified);

        if (
            normalized &&
            !result.some(item => sameId(item.id, normalized.id))
        ) {
            result.push(normalized);
        }
    });

    return result;
}

function isVisibleClassified(classified) {
    return classified.status !== "hidden" && classified.status !== "deleted";
}

function saveClassifiedsToLocalCache(classifieds) {
    const normalized = uniqueClassifieds(classifieds);

    localStorage.setItem(
        CLASSIFIEDS_STORAGE_KEY,
        JSON.stringify(normalized)
    );

    safeDispatchClassifiedsChanged();
    return normalized;
}

function classifiedToSupabaseRow(classified) {
    const normalized = normalizeClassified(classified);

    return {
        id: normalized.id,
        title: normalized.title.trim(),
        category: normalized.category.trim(),
        price: normalized.price.trim(),
        club_name: normalized.clubName.trim(),
        model_year: normalized.modelYear === ""
            ? null
            : Number(normalized.modelYear),
        serial_number: normalized.serialNumber.trim(),
        country: normalized.country.trim(),
        country_code: normalized.countryCode.trim(),
        state: normalized.state.trim(),
        state_code: normalized.stateCode.trim(),
        city: normalized.city.trim(),
        city_name: normalized.cityName.trim(),
        description: normalized.description.trim(),
        image_paths: normalized.imagePaths,
        seller_name: normalized.sellerName.trim(),
        seller_email: normalized.sellerEmail.trim(),
        seller_phone: normalized.sellerPhone.trim(),
        user_id: normalized.userId,
        status: normalized.status,
        moderation_reason: normalized.moderationReason,
        moderated_at: normalized.moderatedAt,
        created_at: normalized.createdAt,
        updated_at: normalized.updatedAt
    };
}

function compressClassifiedImage(file) {
    return new Promise((resolve, reject) => {
        if (!file?.type?.startsWith("image/")) {
            reject(new Error("Solo podés subir archivos de imagen."));
            return;
        }

        if (file.size > MAX_IMAGE_INPUT_SIZE) {
            reject(new Error("Cada foto debe pesar menos de 10 MB."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                const maxWidth = 1600;
                const scale = Math.min(maxWidth / image.width, 1);
                const canvas = document.createElement("canvas");

                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));

                const context = canvas.getContext("2d");
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    blob => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("No se pudo comprimir la imagen."));
                        }
                    },
                    "image/jpeg",
                    0.82
                );
            };

            image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
            image.src = reader.result;
        };

        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
        reader.readAsDataURL(file);
    });
}

async function removeImagePaths(paths) {
    const pathsToRemove = (paths || []).filter(Boolean);

    if (pathsToRemove.length === 0) return;

    const { error } = await supabase.storage
        .from(CLASSIFIED_IMAGES_BUCKET)
        .remove(pathsToRemove);

    if (error) throw error;
}

async function uploadClassifiedImages(userId, classifiedId, files) {
    if (!userId) {
        throw new Error("Tenés que iniciar sesión para subir fotos.");
    }

    if (files.length > MAX_CLASSIFIED_IMAGES) {
        throw new Error("Podés subir hasta 3 fotos por clasificado.");
    }

    const uploadedPaths = [];

    try {
        for (const file of files) {
            const compressedImage = await compressClassifiedImage(file);
            const imageId = crypto.randomUUID?.() || `${Date.now()}-${uploadedPaths.length}`;
            const path = `${userId}/${classifiedId}/${imageId}.jpg`;

            const { error } = await supabase.storage
                .from(CLASSIFIED_IMAGES_BUCKET)
                .upload(path, compressedImage, {
                    contentType: "image/jpeg",
                    cacheControl: "31536000",
                    upsert: false
                });

            if (error) throw error;
            uploadedPaths.push(path);
        }

        return uploadedPaths;
    } catch (error) {
        try {
            await removeImagePaths(uploadedPaths);
        } catch {
            // Best effort cleanup after a partial upload.
        }

        throw error;
    }
}

export function getStoredClassifieds() {
    return uniqueClassifieds(readStorageArray(CLASSIFIEDS_STORAGE_KEY));
}

export function saveStoredClassifieds(classifieds) {
    return saveClassifiedsToLocalCache(classifieds);
}

export async function fetchSupabaseClassifieds() {
    const { data, error } = await supabase
        .from("classifieds")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return uniqueClassifieds(data || []);
}

export async function syncClassifiedsFromSupabase() {
    const remoteClassifieds = await fetchSupabaseClassifieds();
    return saveClassifiedsToLocalCache(remoteClassifieds);
}

export async function createStoredClassified(classifiedData, imageFiles = []) {
    const createdAt = new Date().toISOString();

    const newClassified = normalizeClassified({
        ...classifiedData,
        id: classifiedData.id || crypto.randomUUID?.() || String(Date.now()),
        createdAt,
        updatedAt: createdAt,
        status: "active",
        imagePaths: [],
        images: []
    });

    let uploadedPaths = [];

    try {
        uploadedPaths = await uploadClassifiedImages(
            newClassified.userId,
            newClassified.id,
            imageFiles
        );

        const { data, error } = await supabase
            .from("classifieds")
            .insert(classifiedToSupabaseRow({
                ...newClassified,
                imagePaths: uploadedPaths
            }))
            .select("*")
            .single();

        if (error) throw error;

        const savedClassified = normalizeClassified(data);

        saveClassifiedsToLocalCache([
            savedClassified,
            ...getStoredClassifieds()
        ]);

        return savedClassified;
    } catch (error) {
        try {
            await removeImagePaths(uploadedPaths);
        } catch {
            // Best effort cleanup if the database insert fails.
        }

        throw error;
    }
}

export async function updateStoredClassified(classifiedId, updatedData, imageFiles = null) {
    const currentClassifieds = getStoredClassifieds();
    const previousClassified = currentClassifieds.find(item => sameId(item.id, classifiedId));

    if (!previousClassified) {
        throw new Error("No encontramos el clasificado que querés editar.");
    }

    let nextImagePaths = previousClassified.imagePaths || [];
    let uploadedPaths = [];

    try {
        if (Array.isArray(imageFiles)) {
            uploadedPaths = await uploadClassifiedImages(
                previousClassified.userId,
                previousClassified.id,
                imageFiles
            );
            nextImagePaths = uploadedPaths;
        }

        const updatedClassified = normalizeClassified({
            ...previousClassified,
            ...updatedData,
            id: previousClassified.id,
            userId: previousClassified.userId,
            imagePaths: nextImagePaths,
            images: [],
            updatedAt: new Date().toISOString()
        });

        const { data, error } = await supabase
            .from("classifieds")
            .update(classifiedToSupabaseRow(updatedClassified))
            .eq("id", previousClassified.id)
            .select("*")
            .single();

        if (error) throw error;

        const savedClassified = normalizeClassified(data);
        saveClassifiedsToLocalCache([
            savedClassified,
            ...currentClassifieds.filter(item => !sameId(item.id, classifiedId))
        ]);

        if (Array.isArray(imageFiles)) {
            try {
                await removeImagePaths(previousClassified.imagePaths || []);
            } catch (cleanupError) {
                console.error(
                    "No se pudieron limpiar las fotos anteriores del clasificado.",
                    cleanupError
                );
            }
        }

        return savedClassified;
    } catch (error) {
        try {
            await removeImagePaths(uploadedPaths);
        } catch {
            // Best effort cleanup after a failed update.
        }

        throw error;
    }
}

async function updateClassifiedStatus(classifiedId, status, reason = "") {
    const { data, error } = await supabase
        .from("classifieds")
        .update({
            status,
            moderation_reason: reason,
            moderated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("id", classifiedId)
        .select("*")
        .single();

    if (error) throw error;

    const savedClassified = normalizeClassified(data);
    saveClassifiedsToLocalCache([
        savedClassified,
        ...getStoredClassifieds().filter(item => !sameId(item.id, classifiedId))
    ]);

    return savedClassified;
}

export function hideStoredClassified(classifiedId, reason = "") {
    return updateClassifiedStatus(classifiedId, "hidden", reason);
}

export function restoreStoredClassified(classifiedId) {
    return updateClassifiedStatus(classifiedId, "active", "");
}

export async function deleteStoredClassified(classifiedId) {
    const classifieds = getStoredClassifieds();
    const classified = classifieds.find(item => sameId(item.id, classifiedId));

    const { error } = await supabase
        .from("classifieds")
        .delete()
        .eq("id", classifiedId);

    if (error) throw error;

    saveClassifiedsToLocalCache(
        classifieds.filter(item => !sameId(item.id, classifiedId))
    );

    try {
        await removeImagePaths(classified?.imagePaths || []);
    } catch (cleanupError) {
        console.error("No se pudieron eliminar las fotos del clasificado.", cleanupError);
    }
}

export function getAllClassifiedsForAdmin() {
    return getStoredClassifieds();
}

export function getAllClassifieds() {
    return getStoredClassifieds().filter(isVisibleClassified);
}
