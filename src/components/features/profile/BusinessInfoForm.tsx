"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Input, Select, Button } from "@/components/ui";
import { Upload, X } from "lucide-react";
import {
  uploadFile,
  deleteFile,
  generateUniqueFilename,
  extractPathFromUrl,
} from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessInfoFormProps {
  isPreviewMode: boolean;
  profile?: {
    id: string;
    business_name: string;
    description: string | null;
    logo_url: string | null;
    business_category: string;
    event_types: string[];
  } | null;
  onDataChange?: (data: {
    business_name: string;
    description: string;
    business_category: string;
    event_types: string[];
    logo_url?: string | null;
  }) => void;
}

const businessCategories = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "florist", label: "Florist" },
  { value: "venue", label: "Venue" },
  { value: "music", label: "Music" },
  { value: "cake", label: "Cake" },
  { value: "dress", label: "Dress" },
  { value: "jeweller", label: "Jeweller" },
  { value: "transportation", label: "Transportation" },
];

const eventTypes = [
  { value: "wedding", label: "Wedding" },
  { value: "christening", label: "Christening" },
  { value: "party", label: "Party" },
  { value: "kids_party", label: "Kids Party" },
];

export function BusinessInfoForm({
  isPreviewMode,
  profile,
  onDataChange,
}: BusinessInfoFormProps) {
  const { user } = useAuth();
  const hasMounted = useRef(false);

  const [businessName, setBusinessName] = useState(
    profile?.business_name || ""
  );
  const [businessDescription, setBusinessDescription] = useState(
    profile?.description || ""
  );
  const [businessCategory, setBusinessCategory] = useState(
    profile?.business_category || ""
  );
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    profile?.event_types || []
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(profile?.logo_url || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Update form fields when profile data changes
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || "");
      setBusinessDescription(profile.description || "");
      setBusinessCategory(profile.business_category || "");
      setSelectedEventTypes(profile.event_types || []);
      setLogoPreview(profile.logo_url || "");
      console.log(
        "🖼️ Profile loaded, logo_url from profile:",
        profile.logo_url
      );
      console.log("🖼️ Setting logoPreview to:", profile.logo_url || "");
    }
  }, [profile]);

  // Mark component as mounted after first render
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  // Notify parent when form is initially loaded with data
  useEffect(() => {
    if (profile && onDataChange && hasMounted.current) {
      notifyParent();
    }
  }, [profile]); // Only depend on profile, not onDataChange to avoid infinite loop

  // Notify parent when data changes - only when user interacts
  const notifyParent = () => {
    if (onDataChange && hasMounted.current) {
      const data = {
        business_name: businessName,
        description: businessDescription,
        business_category: businessCategory,
        event_types: selectedEventTypes,
        logo_url: logoPreview || null,
      };
      console.log("📤 Notifying parent with data:", data);
      console.log("🖼️ Current logoPreview value:", logoPreview);
      console.log("🖼️ Logo URL in data:", data.logo_url);
      onDataChange(data);
    }
  };

  // Notify parent when logoPreview changes
  useEffect(() => {
    if (logoPreview && hasMounted.current) {
      console.log("🖼️ logoPreview changed to:", logoPreview);
      notifyParent();
    }
  }, [logoPreview]);

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLogoError(null);
    setLogoUploading(true);

    try {
      // Generate unique filename
      const filename = generateUniqueFilename(file.name, user.id);

      // Upload to Supabase storage
      const result = await uploadFile(file, "vendor-logos", filename);

      if (result.success && result.url) {
        setLogoFile(file);
        setLogoPreview(result.url);
        console.log("🖼️ Logo uploaded successfully, URL:", result.url);
        console.log("🖼️ Setting logoPreview to:", result.url);

        // Notify parent component about the new logo URL
        // Use the URL directly instead of relying on state
        setTimeout(() => {
          console.log("🖼️ About to notify parent with logo URL:", result.url);
          if (onDataChange) {
            const data = {
              business_name: businessName,
              description: businessDescription,
              business_category: businessCategory,
              event_types: selectedEventTypes,
              logo_url: result.url, // Use the URL directly
            };
            console.log("📤 Notifying parent with data:", data);
            console.log("🖼️ Logo URL in data:", data.logo_url);
            onDataChange(data);
          }
        }, 0);
      } else {
        setLogoError(result.error || "Upload failed");
      }
    } catch (error) {
      setLogoError("An unexpected error occurred");
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!user) return;

    try {
      // If there's an existing logo URL, delete it from storage
      if (logoPreview && logoPreview.includes("supabase.co")) {
        const path = extractPathFromUrl(logoPreview);
        if (path) {
          await deleteFile("vendor-logos", path);
        }
      }
    } catch (error) {
      // Error deleting logo from storage
    }

    setLogoFile(null);
    setLogoPreview("");
    setLogoError(null);

    // Notify parent component that logo was removed
    setTimeout(() => {
      if (onDataChange) {
        const data = {
          business_name: businessName,
          description: businessDescription,
          business_category: businessCategory,
          event_types: selectedEventTypes,
          logo_url: null, // Explicitly set to null
        };
        onDataChange(data);
      }
    }, 0);
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((type) => type !== eventType)
        : [...prev, eventType]
    );
    // Notify parent after state update
    setTimeout(notifyParent, 0);
  };

  if (isPreviewMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Business logo"
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {businessName || "Your Business Name"}
              </h3>
              <p className="text-sm text-gray-500">
                {businessCategory
                  ? businessCategories.find((c) => c.value === businessCategory)
                      ?.label
                  : "Business Category"}
              </p>
            </div>
          </div>
          {businessDescription && (
            <p className="text-gray-700">{businessDescription}</p>
          )}
          {selectedEventTypes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Event Types:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEventTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
                  >
                    {eventTypes.find((et) => et.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Business Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <Input
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              setTimeout(notifyParent, 0);
            }}
            placeholder="Enter your business name"
            required
          />
        </div>

        {/* Business Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Category *
          </label>
          <select
            value={businessCategory}
            onChange={(e) => {
              setBusinessCategory(e.target.value);
              setTimeout(notifyParent, 0);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Select your business category</option>
            {businessCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Logo
          </label>
          {logoError && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {logoError}
            </div>
          )}
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-20 h-20 rounded-lg object-cover border"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={removeLogo}
                disabled={logoUploading}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Remove Logo
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {logoUploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload your business logo
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Max 5MB • JPEG, PNG, WebP, GIF
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={logoUploading}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Choose File
                  </label>
                </>
              )}
            </div>
          )}
        </div>

        {/* Business Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description
          </label>
          <textarea
            value={businessDescription}
            onChange={(e) => {
              setBusinessDescription(e.target.value);
              setTimeout(notifyParent, 0);
            }}
            placeholder="Tell customers about your business, experience, and what makes you unique..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Event Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Event Types You Serve
          </label>
          <div className="grid grid-cols-2 gap-3">
            {eventTypes.map((eventType) => (
              <label
                key={eventType.value}
                className="flex items-center space-x-2 cursor-pointer p-3 border border-border rounded-lg transition-[background-color] duration-150 ease-out hover:bg-gray-50 hover:transition-none"
              >
                <input
                  type="checkbox"
                  checked={selectedEventTypes.includes(eventType.value)}
                  onChange={() => toggleEventType(eventType.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{eventType.label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
