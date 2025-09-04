"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
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
  Package,
  Calendar,
  Euro,
  Building2,
  Loader2,
} from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
}

interface VendorService {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  pricing_model: "fixed" | "hourly" | "package" | "custom";
  is_active: boolean;
  event_types: string[];
  created_at: string;
  updated_at: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  category_id: string;
  pricing_model: "fixed" | "hourly" | "package" | "custom";
  event_types: string[];
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  category_id?: string;
  pricing_model?: string;
  event_types?: string;
  is_active?: string;
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

export default function EditServicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [service, setService] = useState<VendorService | null>(null);
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    category_id: "",
    pricing_model: "fixed",
    event_types: [],
    is_active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user && serviceId) {
      fetchCategories();
      fetchVendorProfile();
      fetchService();
    }
  }, [user, authLoading, router, serviceId]);

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

  const fetchService = async () => {
    if (!serviceId || !vendorProfileId) return;

    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { data, error } = await supabase
        .from("vendor_services")
        .select("*")
        .eq("id", serviceId)
        .eq("vendor_id", vendorProfileId)
        .single();

      if (error) {
        console.error("Error fetching service:", error);
        if (error.code === "PGRST116") {
          router.push("/dashboard/services?error=not_found");
        }
        return;
      }

      setService(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        category_id: data.category_id,
        pricing_model: data.pricing_model,
        event_types: data.event_types || [],
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error in fetchService:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

    if (!serviceId) {
      console.error("Service ID not found");
      return;
    }

    try {
      setSaving(true);

      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { error } = await supabase
        .from("vendor_services")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category_id: formData.category_id,
          pricing_model: formData.pricing_model,
          event_types: formData.event_types,
          is_active: formData.is_active,
        })
        .eq("id", serviceId);

      if (error) {
        console.error("Error updating service:", error);
        return;
      }

      // Redirect to services page with success message
      router.push("/dashboard/services?updated=true");
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

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto" />
            <p className="text-body text-text-secondary">Loading service...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (!service) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Package className="w-16 h-16 text-text-secondary mx-auto" />
            <h3 className="text-xl font-semibold text-text-primary">
              Service not found
            </h3>
            <p className="text-text-secondary">
              The service you're looking for doesn't exist or you don't have
              permission to edit it.
            </p>
            <Button onClick={() => router.push("/dashboard/services")}>
              Back to Services
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
              onClick={() => router.push("/dashboard/services")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Services
            </Button>
            <div>
              <h1 className="text-display font-light text-text-primary">
                Edit Service
              </h1>
              <p className="text-body text-text-secondary mt-2">
                Update your service information and settings
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
                    Update the essential details about your service
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

              {/* Service Info */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Created:</span>
                    <span className="text-text-primary">
                      {new Date(service.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Last Updated:</span>
                    <span className="text-text-primary">
                      {new Date(service.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Service ID:</span>
                    <span className="text-text-primary font-mono text-xs">
                      {service.id.slice(0, 8)}...
                    </span>
                  </div>
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
                    <Badge variant="default" className="text-xs">
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
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/services")}
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
