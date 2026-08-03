import { supabase } from "../lib/supabaseClient";

const CV_BUCKET = "resumes";
const MAX_CV_SIZE = 5 * 1024 * 1024;

const CV_MIME_TYPES = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

function getExtension(fileName) {
    return String(fileName || "")
        .split(".")
        .pop()
        .toLowerCase();
}

function sanitizeFileName(fileName) {
    return String(fileName || "cv")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .slice(-120);
}

function isExternalUrl(value) {
    return /^https?:\/\//i.test(String(value || ""));
}

export function validateCvFile(file) {
    if (!file) {
        throw new Error("Seleccioná un CV para subir.");
    }

    const extension = getExtension(file.name);

    if (!CV_MIME_TYPES[extension]) {
        throw new Error("El CV debe ser PDF, DOC o DOCX.");
    }

    if (file.size > MAX_CV_SIZE) {
        throw new Error("El CV no puede superar los 5 MB.");
    }

    return {
        extension,
        contentType: CV_MIME_TYPES[extension]
    };
}

export async function uploadPrivateCv(file, userId) {
    if (!userId) {
        throw new Error("Necesitás iniciar sesión para subir un CV.");
    }

    const { contentType } = validateCvFile(file);
    const objectName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const path = `${userId}/${objectName}`;

    const { error } = await supabase.storage
        .from(CV_BUCKET)
        .upload(path, file, {
            cacheControl: "3600",
            contentType,
            upsert: false
        });

    if (error) {
        throw error;
    }

    return {
        path,
        fileName: file.name
    };
}

export async function removePrivateCv(path) {
    if (!path || isExternalUrl(path)) {
        return;
    }

    const { error } = await supabase.storage
        .from(CV_BUCKET)
        .remove([path]);

    if (error) {
        throw error;
    }
}

export async function getCvAccessUrl(reference, expiresIn = 600) {
    if (!reference) {
        return "";
    }

    if (isExternalUrl(reference)) {
        return reference;
    }

    const { data, error } = await supabase.storage
        .from(CV_BUCKET)
        .createSignedUrl(reference, expiresIn);

    if (error) {
        throw error;
    }

    return data?.signedUrl || "";
}
