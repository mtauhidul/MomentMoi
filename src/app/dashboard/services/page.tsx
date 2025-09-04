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
  Badge,
  Button,
  Icon,
} from "@/components/ui";
import { StatsCard } from "@/components/features/dashboard";
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Calendar,
  Euro,
  MoreHorizontal,
  Filter,
  Search,
  X,
} from "lucide-react";

interface VendorService {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  category_name: string;
  pricing_model: "fixed" | "hourly" | "package" | "custom";
  is_active: boolean;
  event_types: string[];
  created_at: string;
  updated_at: string;
  image_count: number;
  pricing_count: number;
  view_count: number;
  inquiry_count: number;
}

interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  totalViews: number;
  totalInquiries: number;
}

export default function ServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<VendorService[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalViews: 0,
    totalInquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchServices();
    }
  }, [user, authLoading, router]);

  // Check for success messages from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const created = urlParams.get("created");
    const updated = urlParams.get("updated");

    if (created) {
      setSuccessMessage("Service created successfully!");
      // Clear the URL parameter
      window.history.replaceState({}, "", "/dashboard/services");
    } else if (updated) {
      setSuccessMessage("Service updated successfully!");
      // Clear the URL parameter
      window.history.replaceState({}, "", "/dashboard/services");
    }
  }, []);

  const fetchServices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      // First, get the vendor profile ID
      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching vendor profile:", profileError);
        setError("Failed to load vendor profile");
        return;
      }

      if (!vendorProfile) {
        setError("Vendor profile not found");
        return;
      }

      setVendorProfileId(vendorProfile.id);

      // Fetch vendor services with related data
      const { data: servicesData, error: servicesError } = await supabase
        .from("vendor_services")
        .select(
          `
          *,
          category:service_categories(name)
        `
        )
        .eq("vendor_id", vendorProfile.id)
        .order("created_at", { ascending: false });

      if (servicesError) {
        console.error("Error fetching services:", servicesError);
        setError("Failed to load services");
        return;
      }

      // Transform the data to include category name and counts
      const transformedServices =
        servicesData?.map((service) => ({
          ...service,
          category_name: service.category?.name || "Uncategorized",
          image_count: 0, // TODO: Add actual count from service_images
          pricing_count: 0, // TODO: Add actual count from service_pricing
          view_count: 0, // TODO: Add actual count from service_analytics
          inquiry_count: 0, // TODO: Add actual count from service_analytics
        })) || [];

      setServices(transformedServices);

      // Calculate stats
      const activeServices = transformedServices.filter((s) => s.is_active);
      const totalViews = transformedServices.reduce(
        (sum, s) => sum + s.view_count,
        0
      );
      const totalInquiries = transformedServices.reduce(
        (sum, s) => sum + s.inquiry_count,
        0
      );

      setStats({
        total: transformedServices.length,
        active: activeServices.length,
        inactive: transformedServices.length - activeServices.length,
        totalViews,
        totalInquiries,
      });
    } catch (error) {
      console.error("Error in fetchServices:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServiceStatus = async (
    serviceId: string,
    currentStatus: boolean
  ) => {
    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { error } = await supabase
        .from("vendor_services")
        .update({ is_active: !currentStatus })
        .eq("id", serviceId);

      if (error) {
        console.error("Error updating service status:", error);
        return;
      }

      // Update local state
      setServices((prev) =>
        prev.map((service) =>
          service.id === serviceId
            ? { ...service, is_active: !currentStatus }
            : service
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        active: prev.active + (currentStatus ? -1 : 1),
        inactive: prev.inactive + (currentStatus ? 1 : -1),
      }));
    } catch (error) {
      console.error("Error toggling service status:", error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { error } = await supabase
        .from("vendor_services")
        .delete()
        .eq("id", serviceId);

      if (error) {
        console.error("Error deleting service:", error);
        return;
      }

      // Update local state
      const deletedService = services.find((s) => s.id === serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));

      // Update stats
      if (deletedService) {
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          active: prev.active - (deletedService.is_active ? 1 : 0),
          inactive: prev.inactive - (deletedService.is_active ? 0 : 1),
        }));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleDuplicateService = async (serviceId: string) => {
    const serviceToDuplicate = services.find((s) => s.id === serviceId);
    if (!serviceToDuplicate) return;

    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      if (!vendorProfileId) {
        console.error("Vendor profile ID not found");
        return;
      }

      const { data, error } = await supabase
        .from("vendor_services")
        .insert({
          vendor_id: vendorProfileId,
          category_id: serviceToDuplicate.category_id,
          name: `${serviceToDuplicate.name} (Copy)`,
          description: serviceToDuplicate.description,
          pricing_model: serviceToDuplicate.pricing_model,
          is_active: false, // Start as inactive
          event_types: serviceToDuplicate.event_types,
        })
        .select()
        .single();

      if (error) {
        console.error("Error duplicating service:", error);
        return;
      }

      // Add to local state
      const newService: VendorService = {
        ...data,
        category_name: serviceToDuplicate.category_name,
        image_count: 0,
        pricing_count: 0,
        view_count: 0,
        inquiry_count: 0,
      };

      setServices((prev) => [newService, ...prev]);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        inactive: prev.inactive + 1,
      }));
    } catch (error) {
      console.error("Error duplicating service:", error);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && service.is_active) ||
      (filterStatus === "inactive" && !service.is_active);

    const matchesCategory =
      filterCategory === "all" || service.category_id === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getPricingModelLabel = (model: string) => {
    switch (model) {
      case "fixed":
        return "Fixed Price";
      case "hourly":
        return "Hourly Rate";
      case "package":
        return "Package";
      case "custom":
        return "Custom";
      default:
        return model;
    }
  };

  const getEventTypesDisplay = (types: string[]) => {
    if (!types || types.length === 0) return "All Events";
    return (
      types.slice(0, 2).join(", ") +
      (types.length > 2 ? ` +${types.length - 2}` : "")
    );
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display font-light text-text-primary">
              Services
            </h1>
            <p className="text-body text-text-secondary mt-2">
              Manage your service offerings and pricing
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/services/new")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card variant="elevated" className="border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-green-800 font-medium">{successMessage}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuccessMessage(null)}
                  className="ml-auto text-green-600 hover:text-green-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          <StatsCard
            title="Total Services"
            value={stats.total}
            icon={<Package className="w-6 h-6 text-primary-500" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Active Services"
            value={stats.active}
            icon={<Eye className="w-6 h-6 text-green-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Inactive Services"
            value={stats.inactive}
            icon={<EyeOff className="w-6 h-6 text-gray-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Total Views"
            value={stats.totalViews}
            icon={<Eye className="w-6 h-6 text-blue-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Total Inquiries"
            value={stats.totalInquiries}
            icon={<Calendar className="w-6 h-6 text-orange-600" />}
            loading={loading}
            error={error}
          />
        </div>

        {/* Filters and Search */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {/* TODO: Add dynamic categories */}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-body text-text-secondary">
                Loading services...
              </p>
            </div>
          </div>
        ) : error ? (
          <Card variant="elevated">
            <CardContent className="p-6 text-center">
              <p className="text-text-secondary">{error}</p>
              <Button
                onClick={fetchServices}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredServices.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No services found
              </h3>
              <p className="text-text-secondary mb-6">
                {services.length === 0
                  ? "You haven't created any services yet. Start by adding your first service."
                  : "No services match your current filters. Try adjusting your search or filters."}
              </p>
              {services.length === 0 && (
                <Button
                  onClick={() => router.push("/dashboard/services/new")}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Service
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                variant="elevated"
                className="group hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-text-primary truncate">
                        {service.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-text-secondary mt-1">
                        {service.category_name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge
                        variant={service.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {service.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {service.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Service Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Pricing:</span>
                      <span className="font-medium">
                        {getPricingModelLabel(service.pricing_model)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Events:</span>
                      <span className="font-medium">
                        {getEventTypesDisplay(service.event_types)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{service.image_count} images</span>
                    <span>{service.pricing_count} pricing options</span>
                    <span>{service.view_count} views</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/services/${service.id}/edit`)
                        }
                        className="h-8 px-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleServiceStatus(
                            service.id,
                            service.is_active
                          )
                        }
                        className="h-8 px-2"
                      >
                        {service.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateService(service.id)}
                        className="h-8 px-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(service.id)}
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
