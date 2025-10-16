/**
 * Maximum dimension (width or height) for images sent to Gemini API.
 * This helps stay within free tier limits by reducing token consumption.
 * Images are resized proportionally to fit within this constraint.
 */
const MAX_IMAGE_DIMENSION = 2048;

/**
 * JPEG quality for compressed images (0-1 scale).
 * 0.85 provides a good balance between quality and file size.
 */
const JPEG_QUALITY = 0.85;

/**
 * Resizes and compresses an image to reduce payload size for API requests.
 * This helps avoid quota exhaustion and size-related errors on the free tier.
 */
const resizeAndCompressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_IMAGE_DIMENSION;
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = (width / height) * MAX_IMAGE_DIMENSION;
          height = MAX_IMAGE_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = objectUrl;
  });
};

/**
 * Converts a File to base64 string with automatic resizing and compression.
 * Images larger than MAX_IMAGE_DIMENSION are resized to stay within free tier limits.
 * 
 * @param file - The image file to convert
 * @returns Promise with base64-encoded image data and MIME type
 */
export const fileToBase64 = async (file: File): Promise<{ base64: string, mimeType: string }> => {
  // Check if resizing is needed for image files
  const isImage = file.type.startsWith('image/');
  let fileToProcess = file;
  let mimeType = file.type;

  if (isImage) {
    try {
      const compressed = await resizeAndCompressImage(file);
      fileToProcess = new File([compressed], file.name, { type: 'image/jpeg' });
      mimeType = 'image/jpeg';
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      // Continue with original file if compression fails
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileToProcess);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};
