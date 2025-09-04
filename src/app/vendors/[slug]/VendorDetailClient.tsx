"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useVendorGallery, useImageUpload } from "@/hooks";
import ImageGallery from "@/components/features/vendors/ImageGallery";
import ImageUpload from "@/components/features/vendors/ImageUpload";
import Link from "next/link";
import { notFound } from "next/navigation";

interface VendorProfile {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  featured_image_url?: string | null;
  verified: boolean;
  business_category: string;
  event_types: string[];
  profile_views: number;
  created_at: string;
  vendor_services: VendorService[];
  vendor_locations: VendorLocation[];
  vendor_contacts: VendorContact[];
  vendor_gallery: VendorGalleryImage[];
}

interface VendorGalleryImage {
  id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
}

interface VendorService {
  id: string;
  name: string;
  description: string | null;
  pricing_model: string;
  event_types: string[];
  is_active: boolean;
  category: {
    name: string;
    icon: string | null;
  };
}

interface VendorLocation {
  id: string;
  location: string;
}

interface VendorContact {
  id: string;
  contact_type: "email" | "phone";
  contact_value: string;
  is_primary: boolean;
}

interface VendorDetailClientProps {
  vendorSlug: string;
}

export default function VendorDetailClient({
  vendorSlug,
}: VendorDetailClientProps) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    guestCount: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showGalleryUpload, setShowGalleryUpload] = useState(false);

  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // Gallery hooks
  const { images: galleryImages, refetch: refetchGallery } = useVendorGallery({
    vendorId: vendor?.id || "",
  });
  const { uploadImages } = useImageUpload({
    vendorId: vendor?.id || "",
  });

  // Check if current user can edit this vendor's gallery
  const canEditGallery = !!(user && vendor && user.id === vendor.id);

  useEffect(() => {
    fetchVendorDetails();
    checkFavoriteStatus();
  }, [vendorSlug, user]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch by slug first, if that fails, try by ID for backward compatibility
      let query = supabase.from("vendor_profiles").select(
        `
          *,
          vendor_services (
            id,
            name,
            description,
            pricing_model,
            event_types,
            is_active,
            category:service_categories (
              name,
              icon
            )
          ),
          vendor_locations (
            id,
            location
          ),
          vendor_contacts (
            id,
            contact_type,
            contact_value,
            is_primary
          ),
          vendor_gallery (
            id,
            image_url,
            caption,
            display_order,
            is_featured,
            created_at
          )
        `
      );

      // If the slug looks like a UUID, try ID first, otherwise try slug
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(vendorSlug)) {
        query = query.eq("id", vendorSlug);
      } else {
        query = query.eq("slug", vendorSlug);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === "PGRST116") {
          notFound();
        }
        throw error;
      }

      // Filter to only show active services
      const filteredVendor = {
        ...data,
        vendor_services: data.vendor_services.filter(
          (service: VendorService) => service.is_active
        ),
      };

      setVendor(filteredVendor);

      // Increment profile views
      await supabase
        .from("vendor_profiles")
        .update({ profile_views: (data.profile_views || 0) + 1 })
        .eq("id", data.id);
    } catch (err) {
      console.error("Error fetching vendor details:", err);
      setError("Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = () => {
    if (!user || !vendor) return;

    const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
    if (storedFavorites) {
      const favoriteIds = JSON.parse(storedFavorites);
      setIsFavorite(favoriteIds.includes(vendor.id));
    }
  };

  const toggleFavorite = () => {
    if (!user || !vendor) {
      // Redirect to login if not authenticated
      window.location.href = "/auth/login";
      return;
    }

    const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
    let favoriteIds = storedFavorites ? JSON.parse(storedFavorites) : [];

    if (isFavorite) {
      favoriteIds = favoriteIds.filter((id: string) => id !== vendor.id);
    } else {
      favoriteIds.push(vendor.id);
    }

    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favoriteIds));
    setIsFavorite(!isFavorite);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from("vendor_inquiries").insert({
        vendor_id: vendor.id,
        client_name: contactForm.name,
        client_email: contactForm.email,
        client_phone: contactForm.phone || null,
        event_type: contactForm.eventType as any,
        event_date: contactForm.eventDate || null,
        guest_count: contactForm.guestCount
          ? parseInt(contactForm.guestCount)
          : null,
        location: null,
        budget_range: null,
        message: contactForm.message,
        status: "new",
        priority: "medium",
        source: "website",
      });

      if (error) throw error;

      // Reset form
      setContactForm({
        name: "",
        email: "",
        phone: "",
        eventType: "",
        eventDate: "",
        guestCount: "",
        message: "",
      });

      alert("Your inquiry has been sent successfully!");
    } catch (err) {
      console.error("Error sending inquiry:", err);
      alert("Failed to send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Image Skeleton */}
        <div className="relative w-full h-[40svh] bg-primary-100">
          <Skeleton className="w-full h-full" />
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Header Skeleton */}
              <div className="flex items-start space-x-6">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Services Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              </div>

              {/* Gallery Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Icon
              name="AlertCircle"
              size="lg"
              className="text-red-500 mx-auto mb-4"
            />
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Vendor Not Found
            </h1>
            <p className="text-text-secondary mb-4">
              The vendor you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/dashboard/vendors">
              <Button variant="outline">Browse Vendors</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryContact = vendor.vendor_contacts.find(
    (contact) => contact.is_primary
  );

  const locationDisplay =
    vendor.vendor_locations.length > 0
      ? vendor.vendor_locations[0].location
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Location not specified";

  // Determine which image to use for the hero section
  const heroImageUrl = vendor?.featured_image_url || vendor?.logo_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Image Section */}
      {heroImageUrl && (
        <div className="relative w-full h-[40svh] overflow-hidden">
          <img
            src={heroImageUrl}
            alt={vendor.business_name}
            className="w-full h-full object-cover"
          />
          {/* Optional overlay for better text readability if needed in future */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-8xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-text-secondary">
              <li>
                <Link href="/" className="hover:text-primary-500">
                  Home
                </Link>
              </li>
              <li>
                <Icon name="ChevronRight" size="sm" />
              </li>
              <li>
                <Link href="/vendors" className="hover:text-primary-500">
                  Vendors
                </Link>
              </li>
              <li>
                <Icon name="ChevronRight" size="sm" />
              </li>
              <li className="text-text-primary">{vendor.business_name}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-8">
            {/* Main Content */}
            <div className="space-y-8">
              {/* Vendor Header */}
              <div className="space-y-4">
                {/* Verified Badge and Location */}
                <div className="flex items-center space-x-3">
                  {vendor.verified && (
                    <Badge variant="success" size="sm">
                      <Icon name="CheckCircle" size="xs" className="mr-1" />
                      Verified
                    </Badge>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-text-secondary">
                    <Icon name="MapPin" size="sm" />
                    <span>{locationDisplay}</span>
                  </div>
                </div>

                {/* Vendor Name and Favorites Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-text-primary">
                      {vendor.business_name}
                    </h1>
                  </div>
                  <Button
                    variant={isFavorite ? "primary" : "outline"}
                    size="sm"
                    onClick={toggleFavorite}
                  >
                    <Icon
                      name={isFavorite ? "Heart" : "Heart"}
                      size="sm"
                      className={`mr-1 ${isFavorite ? "fill-current" : ""}`}
                    />
                    {isFavorite ? "Saved" : "Save"}
                  </Button>
                </div>

                {/* Event Type Pills */}
                {vendor.event_types.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {vendor.event_types.map((eventType) => (
                      <Badge key={eventType} variant="primary" size="sm">
                        {eventType
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Vendor Description */}
                {vendor.description && (
                  <p className="!text-text-primary leading-relaxed text-lg">
                    {vendor.description}
                  </p>
                )}

                {/* Small Card with Review Stars, Category, and Views */}
                <Card className="bg-surface border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="flex items-center space-x-4">
                        {/* Review Stars */}
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Icon
                              key={star}
                              name="Star"
                              size="sm"
                              className="text-yellow-400 fill-current"
                            />
                          ))}
                          <span className="text-sm text-text-secondary ml-1">
                            (4.8)
                          </span>
                        </div>

                        {/* Category with Icon */}
                        <div className="flex items-center space-x-2">
                          <Icon
                            name="Tag"
                            size="sm"
                            className="text-primary-500"
                          />
                          <span className="text-sm text-text-primary capitalize">
                            {vendor.business_category}
                          </span>
                        </div>

                        {/* Views with Icon */}
                        <div className="flex items-center space-x-2">
                          <Icon
                            name="Eye"
                            size="sm"
                            className="text-text-secondary"
                          />
                          <span className="text-sm text-text-secondary">
                            {vendor.profile_views} views
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gallery Preview - First 5 Images */}
              {galleryImages.length > 0 && (
                <div className="space-y-4">
                  {galleryImages.length > 5 && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          document
                            .getElementById("full-gallery")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }}
                        className="text-sm text-primary-500 hover:underline"
                      >
                        View all {galleryImages.length} photos
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {galleryImages.slice(0, 5).map((image, index) => (
                      <div
                        key={image.id}
                        className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 shadow-sm cursor-pointer group"
                      >
                        <img
                          src={image.image_url}
                          alt={image.caption || `Gallery image ${index + 1}`}
                          className="w-full h-full object-cover transition-opacity duration-200"
                          onClick={() => {
                            // Optional: Add lightbox functionality here later
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent>
                  {vendor.vendor_services.length > 0 ? (
                    <div className="space-y-4">
                      {vendor.vendor_services.map((service) => (
                        <div
                          key={service.id}
                          className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-text-primary">
                              {service.name}
                            </h4>
                            <Badge variant="outline" size="sm">
                              {service.pricing_model}
                            </Badge>
                          </div>
                          {service.description && (
                            <p className="text-sm text-text-secondary mb-3">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" size="sm">
                              {service.category.name}
                            </Badge>
                            {service.event_types.map((eventType) => (
                              <Badge
                                key={eventType}
                                variant="outline"
                                size="sm"
                              >
                                {eventType.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-secondary text-center py-8">
                      No services available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Gallery */}
              <div id="full-gallery">
                <ImageGallery
                  images={galleryImages}
                  vendorName={vendor.business_name}
                  canEdit={canEditGallery}
                  onEdit={() => setShowGalleryUpload(true)}
                />
              </div>

              {/* Gallery Upload Modal */}
              {showGalleryUpload && vendor && (
                <ImageUpload
                  vendorId={vendor.id}
                  existingImages={galleryImages}
                  onImagesUpdate={(newImages) => {
                    // Update vendor state with new gallery images
                    setVendor((prev) =>
                      prev
                        ? {
                            ...prev,
                            vendor_gallery: [
                              ...prev.vendor_gallery,
                              ...newImages,
                            ],
                          }
                        : null
                    );
                    refetchGallery();
                  }}
                  onClose={() => setShowGalleryUpload(false)}
                />
              )}

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vendor.vendor_contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center space-x-3"
                      >
                        <Icon
                          name={
                            contact.contact_type === "email" ? "Mail" : "Phone"
                          }
                          size="sm"
                          className="text-primary-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">
                            {contact.contact_type === "email"
                              ? "Email"
                              : "Phone"}
                          </p>
                          <a
                            href={
                              contact.contact_type === "email"
                                ? `mailto:${contact.contact_value}`
                                : `tel:${contact.contact_value}`
                            }
                            className="text-sm text-primary-500 hover:underline"
                          >
                            {contact.contact_value}
                          </a>
                        </div>
                        {contact.is_primary && (
                          <Badge variant="success" size="sm">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Inquiry</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Event Type
                      </label>
                      <select
                        value={contactForm.eventType}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            eventType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select event type</option>
                        <option value="wedding">Wedding</option>
                        <option value="christening">Christening</option>
                        <option value="party">Party</option>
                        <option value="kids_party">Kids Party</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={contactForm.eventDate}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            eventDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Guest Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={contactForm.guestCount}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            guestCount: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            message: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tell us about your event and requirements..."
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      loading={submitting}
                      disabled={submitting}
                    >
                      Send Inquiry
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
