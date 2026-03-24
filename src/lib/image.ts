/**
 * Compress and resize an image file for sending to Claude's vision API.
 * Returns base64-encoded JPEG data (without the data: prefix).
 */
export async function compressImage(
  file: File
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1024;

        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG at 70% quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        // Strip the data:image/jpeg;base64, prefix
        const base64 = dataUrl.split(",")[1];

        resolve({ base64, mediaType: "image/jpeg" });
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
