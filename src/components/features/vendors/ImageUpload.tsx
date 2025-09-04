"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "sonner";

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
}

interface ImageUploadProps {
  vendorId: string;
  existingImages: GalleryImage[];
  onImagesUpdate: (images: GalleryImage[]) => void;
  onClose: () => void;
}

interface UploadedImage {
  file: File;
  preview: string;
  caption: string;
  is_featured: boolean;
  display_order: number;
  uploadProgress: number;
  uploadStatus: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export default function ImageUpload({
  vendorId,
  existingImages,
  onImagesUpdate,
  onClose,
}: ImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImages, isUploading, error, clearError } = useImageUpload({
    vendorId,
  });

  // Combine existing and new images for management
  const allImages = [
    ...existingImages,
    ...uploadedImages.map((img, index) => ({
      id: `new-${index}`,
      image_url: img.preview,
      caption: img.caption,
      display_order: existingImages.length + index,
      is_featured: img.is_featured,
      created_at: new Date().toISOString(),
    })),
  ];

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = e.target?.result as string;
            setUploadedImages((prev) => [
              ...prev,
              {
                file,
                preview,
                caption: "",
                is_featured: false,
                display_order: prev.length,
                uploadProgress: 0,
                uploadStatus: "pending",
              },
            ]);
          };
          reader.readAsDataURL(file);
        }
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFeatured = (imageId: string) => {
    if (imageId.startsWith("new-")) {
      const index = parseInt(imageId.split("-")[1]);
      setUploadedImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, is_featured: !img.is_featured } : img
        )
      );
    } else {
      // Handle existing image - this would need to be implemented with API call
      console.log("Toggle featured for existing image:", imageId);
    }
  };

  const startEditingCaption = (image: GalleryImage) => {
    setEditingImage(image);
    setEditCaption(image.caption || "");
  };

  const saveCaption = () => {
    if (!editingImage) return;

    if (editingImage.id.startsWith("new-")) {
      const index = parseInt(editingImage.id.split("-")[1]);
      setUploadedImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, caption: editCaption } : img
        )
      );
    } else {
      // Handle existing image caption update - this would need API call
      console.log(
        "Update caption for existing image:",
        editingImage.id,
        editCaption
      );
    }

    setEditingImage(null);
    setEditCaption("");
  };

  const reorderImages = (dragIndex: number, hoverIndex: number) => {
    // This would need to be implemented with proper drag and drop
    console.log("Reorder images:", dragIndex, hoverIndex);
  };

  const handleSaveAll = async () => {
    if (uploadedImages.length === 0) {
      onClose();
      return;
    }

    // Clear any previous errors
    clearError();

    try {
      // Extract files and metadata for upload
      const files = uploadedImages.map((img) => img.file);
      const captions = uploadedImages.map((img) => img.caption);
      const isFeatured = uploadedImages.map((img) => img.is_featured);

      // Upload images using the hook
      const uploadedGalleryImages = await uploadImages(files, {
        captions,
        isFeatured,
        onProgress: (progress) => {
          // Update local state with upload progress
          setUploadedImages((prev) =>
            prev.map((img, index) => {
              const progressInfo = progress[index];
              if (progressInfo) {
                return {
                  ...img,
                  uploadProgress: progressInfo.progress,
                  uploadStatus: progressInfo.status,
                  error: progressInfo.error,
                };
              }
              return img;
            })
          );
        },
      });

      if (uploadedGalleryImages.length > 0) {
        toast.success(
          `Successfully uploaded ${uploadedGalleryImages.length} image(s)`
        );
        // Update the parent component with new images
        onImagesUpdate([...existingImages, ...uploadedGalleryImages]);
        // Reset state
        setUploadedImages([]);
        onClose();
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <Card className="border-0 shadow-none flex-1 flex flex-col min-h-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
            <CardTitle>Manage Gallery Images</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="X" size="lg" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 overflow-y-auto">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Icon
                name="Upload"
                size="lg"
                className="text-text-secondary mx-auto mb-4"
              />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Upload Images
              </h3>
              <p className="text-text-secondary mb-4">
                Drag and drop images here, or click to browse
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isUploading}
              >
                <Icon name="Plus" size="sm" className="mr-2" />
                Choose Files
              </Button>
            </div>

            {/* Images Grid */}
            {allImages.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Gallery Images ({allImages.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allImages.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg bg-surface">
                        <img
                          src={image.image_url}
                          alt={image.caption || "Gallery image"}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 rounded-lg">
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFeatured(image.id)}
                            className="bg-white/20 hover:bg-white/30 text-white"
                          >
                            <Icon
                              name="Star"
                              size="sm"
                              className={
                                image.is_featured
                                  ? "fill-yellow-400 text-yellow-400"
                                  : ""
                              }
                            />
                          </Button>
                          {image.id.startsWith("new-") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeUploadedImage(
                                  parseInt(image.id.split("-")[1])
                                )
                              }
                              className="bg-white/20 hover:bg-white/30 text-white"
                            >
                              <Icon name="Trash2" size="sm" />
                            </Button>
                          )}
                        </div>

                        {/* Status Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {/* Upload Status */}
                          {image.id.startsWith("new-") && (
                            <>
                              {uploadedImages[parseInt(image.id.split("-")[1])]
                                ?.uploadStatus === "uploading" && (
                                <Badge
                                  variant="secondary"
                                  size="sm"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  <Icon
                                    name="Loader"
                                    size="xs"
                                    className="mr-1 animate-spin"
                                  />
                                  {uploadedImages[
                                    parseInt(image.id.split("-")[1])
                                  ]?.uploadProgress || 0}
                                  %
                                </Badge>
                              )}
                              {uploadedImages[parseInt(image.id.split("-")[1])]
                                ?.uploadStatus === "error" && (
                                <Badge
                                  variant="secondary"
                                  size="sm"
                                  className="bg-red-100 text-red-800"
                                >
                                  <Icon
                                    name="AlertCircle"
                                    size="xs"
                                    className="mr-1"
                                  />
                                  Failed
                                </Badge>
                              )}
                              {uploadedImages[parseInt(image.id.split("-")[1])]
                                ?.uploadStatus === "completed" && (
                                <Badge
                                  variant="secondary"
                                  size="sm"
                                  className="bg-green-100 text-green-800"
                                >
                                  <Icon
                                    name="Check"
                                    size="xs"
                                    className="mr-1"
                                  />
                                  Done
                                </Badge>
                              )}
                            </>
                          )}

                          {/* Featured Badge */}
                          {image.is_featured && (
                            <Badge variant="secondary" size="sm">
                              <Icon name="Star" size="xs" className="mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Caption Section */}
                      <div className="mt-2">
                        {editingImage?.id === image.id ? (
                          <div className="flex space-x-2">
                            <Input
                              value={editCaption}
                              onChange={(e) => setEditCaption(e.target.value)}
                              placeholder="Add caption..."
                              className="text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveCaption();
                                if (e.key === "Escape") setEditingImage(null);
                              }}
                            />
                            <Button size="sm" onClick={saveCaption}>
                              <Icon name="Check" size="sm" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="text-sm text-text-secondary cursor-pointer hover:text-text-primary"
                            onClick={() => startEditingCaption(image)}
                          >
                            {image.caption || "Add caption..."}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Icon
                    name="AlertCircle"
                    size="sm"
                    className="text-red-500 mr-2"
                  />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAll}
                loading={isUploading}
                disabled={uploadedImages.length === 0 || isUploading}
              >
                {isUploading
                  ? "Uploading..."
                  : `Save ${uploadedImages.length} Images`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
