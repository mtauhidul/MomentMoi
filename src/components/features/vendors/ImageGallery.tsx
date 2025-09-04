"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  vendorName: string;
  canEdit?: boolean;
  onEdit?: () => void;
}

export default function ImageGallery({
  images,
  vendorName,
  canEdit = false,
  onEdit,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sort images by display order, then by creation date
  const sortedImages = [...images].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const featuredImages = sortedImages.filter((img) => img.is_featured);
  const regularImages = sortedImages.filter((img) => !img.is_featured);

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;

    const allImages = sortedImages;
    const currentIndex = allImages.findIndex(
      (img) => img.id === selectedImage.id
    );

    let newIndex;
    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
    } else {
      newIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
    }

    setSelectedImage(allImages[newIndex]);
    setCurrentImageIndex(newIndex);
  };

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Icon
              name="Image"
              size="lg"
              className="text-text-secondary mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No images yet
            </h3>
            <p className="text-text-secondary mb-4">
              {canEdit
                ? "Add some photos to showcase your work and attract more clients."
                : `${vendorName} hasn't added any gallery images yet.`}
            </p>
            {canEdit && onEdit && (
              <Button onClick={onEdit} variant="outline">
                <Icon name="Plus" size="sm" className="mr-2" />
                Add Images
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gallery</CardTitle>
            {canEdit && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <Icon name="Edit" size="sm" className="mr-2" />
                Manage Gallery
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Featured Images Section */}
          {featuredImages.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Icon name="Star" size="sm" className="text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-text-primary">
                  Featured
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer overflow-hidden rounded-lg"
                    onClick={() =>
                      openLightbox(image, sortedImages.indexOf(image))
                    }
                  >
                    <img
                      src={image.image_url}
                      alt={image.caption || `${vendorName} gallery image`}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" size="sm">
                        <Icon name="Star" size="xs" className="mr-1" />
                        Featured
                      </Badge>
                    </div>
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {image.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {regularImages.map((image, index) => (
              <div
                key={image.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
                onClick={() => openLightbox(image, sortedImages.indexOf(image))}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || `${vendorName} gallery image`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-5xl max-h-full">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <Icon name="X" size="lg" />
            </Button>

            {/* Navigation Buttons */}
            {sortedImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateImage("prev")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                >
                  <Icon name="ChevronLeft" size="lg" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateImage("next")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                >
                  <Icon name="ChevronRight" size="lg" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption || `${vendorName} gallery image`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  {selectedImage.caption && (
                    <p className="font-medium">{selectedImage.caption}</p>
                  )}
                  <p className="text-sm text-gray-300">
                    {currentImageIndex + 1} of {sortedImages.length}
                  </p>
                </div>
                {selectedImage.is_featured && (
                  <Badge variant="secondary" size="sm">
                    <Icon name="Star" size="xs" className="mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
