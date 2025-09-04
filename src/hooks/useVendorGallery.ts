import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Database } from "@/types/database";

type GalleryImage = Database["public"]["Tables"]["vendor_gallery"]["Row"];

interface UseVendorGalleryProps {
  vendorId: string;
}

interface UseVendorGalleryReturn {
  images: GalleryImage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateImage: (imageId: string, updates: Partial<GalleryImage>) => Promise<boolean>;
  deleteImage: (imageId: string) => Promise<boolean>;
  reorderImages: (imageIds: string[]) => Promise<boolean>;
}

export function useVendorGallery({ vendorId }: UseVendorGalleryProps): UseVendorGalleryReturn {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!vendorId || vendorId === "") {
        console.log("⚠️ useVendorGallery: No vendorId provided, skipping fetch");
        setImages([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("vendor_gallery")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("❌ useVendorGallery: Fetch error:", fetchError);
        throw fetchError;
      }

      setImages(data || []);
    } catch (err) {
      console.error("💥 useVendorGallery: Error fetching gallery images:", err);
      setError(err instanceof Error ? err.message : "Failed to load gallery images");
    } finally {
      setLoading(false);
    }
  }, [vendorId, supabase]);

  const updateImage = useCallback(async (
    imageId: string,
    updates: Partial<GalleryImage>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("vendor_gallery")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", imageId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, ...updates } : img
        )
      );

      return true;
    } catch (err) {
      console.error("Error updating gallery image:", err);
      setError(err instanceof Error ? err.message : "Failed to update image");
      return false;
    }
  }, [supabase]);

  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("vendor_gallery")
        .delete()
        .eq("id", imageId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setImages((prev) => prev.filter((img) => img.id !== imageId));

      return true;
    } catch (err) {
      console.error("Error deleting gallery image:", err);
      setError(err instanceof Error ? err.message : "Failed to delete image");
      return false;
    }
  }, [supabase]);

  const reorderImages = useCallback(async (imageIds: string[]): Promise<boolean> => {
    try {
      // Update display_order for each image
      const updates = imageIds.map((id, index) =>
        supabase
          .from("vendor_gallery")
          .update({
            display_order: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
      );

      const results = await Promise.all(updates);

      // Check if any update failed
      const hasError = results.some((result) => result.error);
      if (hasError) {
        throw new Error("Failed to reorder some images");
      }

      // Update local state with new order
      setImages((prev) => {
        const reordered = [...prev];
        imageIds.forEach((id, index) => {
          const imageIndex = reordered.findIndex((img) => img.id === id);
          if (imageIndex !== -1) {
            reordered[imageIndex] = { ...reordered[imageIndex], display_order: index };
          }
        });
        return reordered.sort((a, b) => a.display_order - b.display_order);
      });

      return true;
    } catch (err) {
      console.error("Error reordering gallery images:", err);
      setError(err instanceof Error ? err.message : "Failed to reorder images");
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    // Only fetch if we have a valid vendorId
    if (vendorId && vendorId !== "") {
      fetchImages();
    } else {
      setLoading(false);
    }
  }, [fetchImages, vendorId]);

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
    updateImage,
    deleteImage,
    reorderImages,
  };
}
