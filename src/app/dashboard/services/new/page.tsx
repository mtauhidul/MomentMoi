"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Package,
  Calendar,
  Euro,
  Building2,
} from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  category_id: string;
  pricing_model: "fixed" | "hourly" | "package" | "custom";
  event_types: string[];
  is_active: boolean;
}

const EVENT_TYPES = [
  { value: "wedding", label: "Weddings", icon: "💒" },
  { value: "christening", label: "Christenings", icon: "👶" },
  { value: "party", label: "Parties", icon: "🎉" },
  { value: "kids_party", label: "Kids Parties", icon: "🎈" },
];

const PRICING_MODELS = [
  {
    value: "fixed",
    label: "Fixed Price",
    description: "Single price for the service",
  },
  { value: "hourly", label: "Hourly Rate", description: "Price per hour" },
  { value: "package", label: "Package", description: "Multiple pricing tiers" },
  { value: "custom", label: "Custom", description: "Contact for pricing" },
];

export default function NewServicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    category_id: "",
    pricing_model: "fixed",
    event_types: [],
    is_active: true,
  });

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    category_id?: string;
    pricing_model?: string;
    event_types?: string;
    is_active?: string;
  }>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchCategories();
      fetchVendorProfile();
    }
  }, [user, authLoading, router]);

  const fetchCategories = async () => {
    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("Error in fetchCategories:", error);
    }
  };

  const fetchVendorProfile = async () => {
    if (!user) return;

    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching vendor profile:", error);
        return;
      }

      setVendorProfileId(data?.id || null);
    } catch (error) {
      console.error("Error in fetchVendorProfile:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      description?: string;
      category_id?: string;
      pricing_model?: string;
      event_types?: string;
      is_active?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

    if (formData.event_types.length === 0) {
      newErrors.event_types = "Please select at least one event type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!vendorProfileId) {
      console.error("Vendor profile not found");
      return;
    }

    try {
      setSaving(true);

      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { data, error } = await supabase
        .from("vendor_services")
        .insert({
          vendor_id: vendorProfileId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category_id: formData.category_id,
          pricing_model: formData.pricing_model,
          event_types: formData.event_types,
          is_active: formData.is_active,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating service:", error);
        return;
      }

      // Redirect to services page with success message
      router.push("/dashboard/services?created=true");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleEventType = (eventType: string) => {
    setFormData((prev) => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter((type) => type !== eventType)
        : [...prev.event_types, eventType],
    }));
  };

  const getPricingModelDescription = (model: string) => {
    return PRICING_MODELS.find((m) => m.value === model)?.description || "";
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-body text-text-secondary">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has a vendor profile
  if (!vendorProfileId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">
              Vendor Profile Required
            </h2>
            <p className="text-text-secondary">
              You need to complete your vendor profile before creating services.
            </p>
            <Button
              onClick={() => router.push("/onboarding/vendor")}
              className="flex items-center gap-2"
            >
              Complete Vendor Profile
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if categories are loaded
  if (categories.length === 0 && !loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">
              Service Categories Not Available
            </h2>
            <p className="text-text-secondary">
              Unable to load service categories. Please try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-display font-light text-text-primary">
                Add New Service
              </h1>
              <p className="text-body text-text-secondary mt-2">
                Create a new service offering for your business
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Provide the essential details about your service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Service Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Wedding Photography Package"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe your service, what's included, and any special features..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Service Category *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category_id: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.category_id ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.category_id}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Model */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="w-5 h-5" />
                    Pricing Model
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to structure your pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRICING_MODELS.map((model) => (
                      <div
                        key={model.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.pricing_model === model.value
                            ? "border-primary-500 bg-primary-50"
                            : "border-border hover:border-primary-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            pricing_model: model.value as any,
                          }))
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-text-primary">
                            {model.label}
                          </h3>
                          {formData.pricing_model === model.value && (
                            <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">
                          {model.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Event Types */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Types
                  </CardTitle>
                  <CardDescription>
                    Select which types of events this service is available for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EVENT_TYPES.map((eventType) => (
                      <div
                        key={eventType.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.event_types.includes(eventType.value)
                            ? "border-primary-500 bg-primary-50"
                            : "border-border hover:border-primary-300"
                        }`}
                        onClick={() => toggleEventType(eventType.value)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{eventType.icon}</span>
                          <span className="font-medium text-text-primary">
                            {eventType.label}
                          </span>
                          {formData.event_types.includes(eventType.value) && (
                            <div className="ml-auto w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.event_types && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.event_types}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Service Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Active</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_active: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    {formData.is_active
                      ? "This service will be visible to potential clients"
                      : "This service will be hidden from potential clients"}
                  </p>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-medium text-text-primary">
                      {formData.name || "Service Name"}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {categories.find((c) => c.id === formData.category_id)
                        ?.name || "Category"}
                    </p>
                  </div>

                  {formData.description && (
                    <p className="text-sm text-text-secondary line-clamp-3">
                      {formData.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {
                        PRICING_MODELS.find(
                          (m) => m.value === formData.pricing_model
                        )?.label
                      }
                    </Badge>
                    {formData.event_types.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {EVENT_TYPES.find((t) => t.value === type)?.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card variant="elevated">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      loading={saving}
                      disabled={saving}
                      className="w-full flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Creating..." : "Create Service"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.back()}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
