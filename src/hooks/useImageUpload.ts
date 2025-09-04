import { useState, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Database } from "@/types/database";

type GalleryImage = Database["public"]["Tables"]["vendor_gallery"]["Row"];
type GalleryImageInsert = Database["public"]["Tables"]["vendor_gallery"]["Insert"];

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface UseImageUploadProps {
  vendorId: string;
  maxFileSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // default: ['image/jpeg', 'image/png', 'image/webp']
}

interface UseImageUploadReturn {
  uploadImages: (files: File[], options?: UploadOptions) => Promise<GalleryImage[]>;
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

interface UploadOptions {
  captions?: string[];
  isFeatured?: boolean[];
  onProgress?: (progress: UploadProgress[]) => void;
}

export function useImageUpload({
  vendorId,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
}: UseImageUploadProps): UseImageUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
      }

      if (!allowedTypes.includes(file.type)) {
        return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`;
      }

      return null;
    },
    [maxFileSize, allowedTypes]
  );

  const uploadToStorage = useCallback(
    async (file: File, fileName: string): Promise<string> => {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("vendor-gallery") // Create this bucket in Supabase Dashboard as public
        .upload(`${vendorId}/${uniqueName}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("vendor-gallery")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    },
    [vendorId, supabase]
  );

  const saveToDatabase = useCallback(
    async (
      imageUrl: string,
      caption?: string,
      isFeatured = false,
      displayOrder = 0
    ): Promise<GalleryImage> => {
      const galleryData: GalleryImageInsert = {
        vendor_id: vendorId,
        image_url: imageUrl,
        caption: caption || undefined,
        display_order: displayOrder,
        is_featured: isFeatured,
      };

      const { data, error: insertError } = await supabase
        .from("vendor_gallery")
        .insert(galleryData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save image to database: ${insertError.message}`);
      }

      return data;
    },
    [vendorId, supabase]
  );

  const uploadImages = useCallback(
    async (
      files: File[],
      options: UploadOptions = {}
    ): Promise<GalleryImage[]> => {
      if (files.length === 0) {
        return [];
      }

      setIsUploading(true);
      setError(null);

      // Initialize progress tracking
      const progress: UploadProgress[] = files.map((file) => ({
        file,
        progress: 0,
        status: "uploading",
      }));
      setUploadProgress(progress);

      const uploadedImages: GalleryImage[] = [];
      const errors: string[] = [];

      try {
        // Get the next display order
        const { data: existingImages } = await supabase
          .from("vendor_gallery")
          .select("display_order")
          .eq("vendor_id", vendorId)
          .order("display_order", { ascending: false })
          .limit(1);

        let nextDisplayOrder = 0;
        if (existingImages && existingImages.length > 0) {
          nextDisplayOrder = existingImages[0].display_order + 1;
        }

        // Process each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileIndex = i;

          try {
            // Validate file
            const validationError = validateFile(file);
            if (validationError) {
              progress[fileIndex].status = "error";
              progress[fileIndex].error = validationError;
              setUploadProgress([...progress]);
              errors.push(validationError);
              continue;
            }

            // Update progress to show upload starting
            progress[fileIndex].progress = 10;
            setUploadProgress([...progress]);

            // Upload to storage
            const imageUrl = await uploadToStorage(file, file.name);
            progress[fileIndex].progress = 70;
            setUploadProgress([...progress]);

            // Save to database
            const caption = options.captions?.[i] || "";
            const isFeatured = options.isFeatured?.[i] || false;
            const displayOrder = nextDisplayOrder + i;

            const savedImage = await saveToDatabase(
              imageUrl,
              caption,
              isFeatured,
              displayOrder
            );

            // Update progress to completed
            progress[fileIndex].progress = 100;
            progress[fileIndex].status = "completed";
            setUploadProgress([...progress]);

            uploadedImages.push(savedImage);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Upload failed";
            progress[fileIndex].status = "error";
            progress[fileIndex].error = errorMessage;
            setUploadProgress([...progress]);
            errors.push(errorMessage);
          }
        }

        // Call progress callback if provided
        if (options.onProgress) {
          options.onProgress(progress);
        }

        // If there were errors, set the main error
        if (errors.length > 0) {
          setError(`Some images failed to upload: ${errors.join(", ")}`);
        }

        return uploadedImages;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        return uploadedImages;
      } finally {
        setIsUploading(false);
      }
    },
    [vendorId, supabase, validateFile, uploadToStorage, saveToDatabase]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadImages,
    uploadProgress,
    isUploading,
    error,
    clearError,
  };
}
