export function compressImage(file, maxWidth = 500, quality = 0.75) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject("El archivo no es una imagen.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const img = new Image();

            img.onload = () => {
                const scale = Math.min(maxWidth / img.width, 1);

                const canvas = document.createElement("canvas");

                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(
                    img,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const compressedImage = canvas.toDataURL(
                    "image/jpeg",
                    quality
                );

                resolve(compressedImage);
            };

            img.onerror = () => {
                reject("No se pudo procesar la imagen.");
            };

            img.src = reader.result;
        };

        reader.onerror = () => {
            reject("No se pudo leer la imagen.");
        };

        reader.readAsDataURL(file);
    });
}