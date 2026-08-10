import { supabase } from "../lib/supabaseClient";

const PROFILE_MEDIA_BUCKET = "profile-media";
const MAX_IMAGE_INPUT_SIZE = 8 * 1024 * 1024;

function compressProfileImage(file) {
    return new Promise((resolve, reject) => {
        if (!file?.type?.startsWith("image/")) {
            reject(new Error("Seleccioná un archivo de imagen."));
            return;
        }

        if (file.size > MAX_IMAGE_INPUT_SIZE) {
            reject(new Error("La imagen no puede superar los 8 MB."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                const maxSize = 900;
                const scale = Math.min(maxSize / Math.max(image.width, image.height), 1);
                const canvas = document.createElement("canvas");

                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));

                const context = canvas.getContext("2d");

                if (!context) {
                    reject(new Error("No se pudo preparar la imagen."));
                    return;
                }

                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(
                    blob => blob
                        ? resolve(blob)
                        : reject(new Error("No se pudo comprimir la imagen.")),
                    "image/jpeg",
                    0.84
                );
            };

            image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
            image.src = reader.result;
        };

        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
        reader.readAsDataURL(file);
    });
}

function getPathFromPublicUrl(url) {
    const marker = `/storage/v1/object/public/${PROFILE_MEDIA_BUCKET}/`;
    const value = String(url || "");
    const markerIndex = value.indexOf(marker);

    if (markerIndex === -1) return "";

    return decodeURIComponent(
        value.slice(markerIndex + marker.length).split("?")[0]
    );
}

export async function uploadProfileMedia(file, userId, kind = "avatar") {
    if (!userId) {
        throw new Error("Necesitás iniciar sesión para subir una imagen.");
    }

    const compressedImage = await compressProfileImage(file);
    const imageId = crypto.randomUUID?.() || String(Date.now());
    const path = `${userId}/${kind}-${imageId}.jpg`;

    const { error } = await supabase.storage
        .from(PROFILE_MEDIA_BUCKET)
        .upload(path, compressedImage, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
            upsert: false
        });

    if (error) throw error;

    const publicUrl = supabase.storage
        .from(PROFILE_MEDIA_BUCKET)
        .getPublicUrl(path)
        .data.publicUrl;

    return { path, publicUrl };
}

export async function removeProfileMedia(reference) {
    const path = getPathFromPublicUrl(reference) || String(reference || "");

    if (!path || /^https?:\/\//i.test(path)) return;

    const { error } = await supabase.storage
        .from(PROFILE_MEDIA_BUCKET)
        .remove([path]);

    if (error) throw error;
}
