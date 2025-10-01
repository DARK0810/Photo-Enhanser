interface ConvertImageOptions {
  format: 'image/webp' | 'image/jpeg' | 'image/png';
  quality?: number;
}

export const convertImage = (file: File, options: ConvertImageOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('FileReader did not return a result.'));
      }
      
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null, the format might not be supported.'));
            }
          },
          options.format,
          options.quality
        );
      };
      img.src = event.target.result as string;
    };
  });
};
