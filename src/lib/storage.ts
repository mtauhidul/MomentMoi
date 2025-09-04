import { createClientComponentClient } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Supabase storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket (e.g., 'user-id/filename.jpg')
 * @returns Promise<UploadResult>
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<UploadResult> {
  try {
    const supabase = createClientComponentClient();
    
    // Validate file size (5MB limit for vendor logos)
    const maxSize = bucket === 'vendor-logos' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'File must be an image (JPEG, PNG, WebP, or GIF)'
      };
    }

    console.log("📤 Uploading file to bucket:", bucket);
    console.log("📁 File path:", path);
    console.log("📏 File size:", file.size);
    console.log("📄 File type:", file.type);
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.log("❌ Upload error:", error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log("✅ File uploaded successfully");
    console.log("📊 Upload data:", data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log("🔗 Generated public URL:", urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during upload'
    };
  }
}

/**
 * Delete a file from Supabase storage
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket
 * @returns Promise<UploadResult>
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<UploadResult> {
  try {
    const supabase = createClientComponentClient();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };

  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during deletion'
    };
  }
}

/**
 * Generate a unique filename for uploads
 * @param originalName - The original filename
 * @param userId - The user ID to include in the path
 * @returns string - The unique filename
 */
export function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${userId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Extract the file path from a Supabase storage URL
 * @param url - The Supabase storage URL
 * @returns string | null - The file path or null if invalid
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const storageIndex = pathParts.findIndex(part => part === 'storage');
    if (storageIndex !== -1 && pathParts[storageIndex + 2]) {
      return pathParts.slice(storageIndex + 2).join('/');
    }
    return null;
  } catch {
    return null;
  }
}
