"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientDashboardLayout } from "@/components/layout";
import { ErrorBoundary, ErrorFallback } from "@/components/ui/ErrorBoundary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { createClientComponentClient } from "@/lib/supabase";
import { useVendorGallery } from "@/hooks/useVendorGallery";
import ImageGallery from "@/components/features/vendors/ImageGallery";
import ImageUpload from "@/components/features/vendors/ImageUpload";

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loadingVendorId, setLoadingVendorId] = useState(true);

  const supabase = createClientComponentClient();

  // Get vendor ID from vendor profile
  useEffect(() => {
    const getVendorId = async () => {
      if (!user?.id) {
        setLoadingVendorId(false);
        return;
      }

      try {
        const { data: vendorProfile, error } = await supabase
          .from("vendor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error getting vendor profile:", error);
          setVendorId(null);
        } else if (vendorProfile) {
          setVendorId(vendorProfile.id);
        } else {
          setVendorId(null);
        }
      } catch (err) {
        console.error("Error getting vendor profile:", err);
        setVendorId(null);
      } finally {
        setLoadingVendorId(false);
      }
    };

    getVendorId();
  }, [user?.id, supabase]);

  const {
    images,
    loading: galleryLoading,
    error: galleryError,
    refetch,
    updateImage,
    deleteImage,
    reorderImages,
  } = useVendorGallery({
    vendorId: vendorId || "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || loadingVendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-body text-text-secondary">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!vendorId) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Setup Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Icon
                  name="AlertCircle"
                  size="lg"
                  className="text-text-secondary mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Vendor Profile Not Found
                </h3>
                <p className="text-text-secondary mb-6">
                  You need to complete your vendor profile before you can manage
                  your gallery.
                </p>
                <Button onClick={() => router.push("/dashboard/profile")}>
                  Complete Your Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <ClientDashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-light text-2xl text-gray-900">
                Gallery Management
              </h1>
              <p className="text-gray-600 mt-1">
                Showcase your work with high-quality images
              </p>
            </div>
            <Button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2"
            >
              <Icon name="Plus" size="sm" />
              Add Images
            </Button>
          </div>

          {/* Gallery Content */}
          {galleryError ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Icon
                    name="AlertTriangle"
                    size="lg"
                    className="text-red-500 mx-auto mb-4"
                  />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Error Loading Gallery
                  </h3>
                  <p className="text-red-600 mb-4">{galleryError}</p>
                  <Button onClick={refetch} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ImageGallery
              images={images}
              vendorName="Your Business"
              canEdit={true}
              onEdit={() => setShowUpload(true)}
            />
          )}

          {/* Upload Modal */}
          {showUpload && (
            <ImageUpload
              vendorId={vendorId}
              existingImages={images}
              onImagesUpdate={(updatedImages) => {
                // Refetch to get the latest images from the database
                refetch();
              }}
              onClose={() => setShowUpload(false)}
            />
          )}
        </div>
      </ClientDashboardLayout>
    </ErrorBoundary>
  );
}
