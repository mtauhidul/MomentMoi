// Image optimization and utility functions

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Calculate optimal resize dimensions maintaining aspect ratio
 */
export function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // If image is larger than max dimensions, scale it down
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    if (originalWidth / maxWidth > originalHeight / maxHeight) {
      // Width is the limiting factor
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    } else {
      // Height is the limiting factor
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

/**
 * Compress and resize an image using Canvas API
 */
export function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = "jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      try {
        // Calculate new dimensions
        const newDimensions = calculateResizeDimensions(
          img.naturalWidth,
          img.naturalHeight,
          maxWidth,
          maxHeight
        );

        // Set canvas size
        canvas.width = newDimensions.width;
        canvas.height = newDimensions.height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Create new file with optimized image
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${format}`),
              {
                type: `image/${format}`,
                lastModified: Date.now(),
              }
            );

            resolve(optimizedFile);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for optimization"));
    };

    img.src = url;
  });
}

/**
 * Generate multiple sizes of an image for responsive loading
 */
export async function generateResponsiveImages(
  file: File,
  sizes: number[] = [320, 640, 1024, 1920]
): Promise<{ size: number; file: File }[]> {
  const dimensions = await getImageDimensions(file);
  const results: { size: number; file: File }[] = [];

  for (const size of sizes) {
    // Only generate smaller sizes if the original is larger
    if (dimensions.width > size) {
      try {
        const optimizedFile = await optimizeImage(file, {
          maxWidth: size,
          maxHeight: size,
          quality: 0.8,
          format: "webp",
        });

        results.push({
          size,
          file: optimizedFile,
        });
      } catch (error) {
        console.warn(`Failed to generate ${size}px version:`, error);
      }
    }
  }

  // Always include the original optimized version
  const originalOptimized = await optimizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: "webp",
  });

  results.push({
    size: Math.max(dimensions.width, dimensions.height),
    file: originalOptimized,
  });

  return results.sort((a, b) => a.size - b.size);
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please select a valid image file (JPEG, PNG, or WebP)",
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Image file size must be less than 10MB",
    };
  }

  return { isValid: true };
}

/**
 * Generate a unique filename for uploaded images
 */
export function generateUniqueFilename(originalName: string, vendorId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop() || "jpg";

  return `${vendorId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Convert file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get image aspect ratio
 */
export function getAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Check if image is portrait, landscape, or square
 */
export function getImageOrientation(width: number, height: number): "portrait" | "landscape" | "square" {
  if (width > height) return "landscape";
  if (height > width) return "portrait";
  return "square";
}
