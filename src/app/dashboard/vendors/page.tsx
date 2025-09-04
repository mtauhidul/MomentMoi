"use client";

import React, { useState, useEffect } from "react";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useVendorFavorites } from "@/hooks/useVendorFavorites";
import Link from "next/link";

interface VendorProfile {
  id: string;
  slug: string | null;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  business_category: string;
  event_types: string[];
  profile_views: number;
  created_at: string;
  vendor_services: VendorService[];
  vendor_locations: VendorLocation[];
  vendor_contacts: VendorContact[];
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
  contact_type: string;
  contact_value: string;
  is_primary: boolean;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  category: string;
  event_types: string[];
}

interface VendorDiscoveryFilters {
  search: string;
  category: string;
  location: string;
  eventType: string;
}

const locations = [
  { value: "all", label: "All Locations" },
  { value: "nicosia", label: "Nicosia" },
  { value: "limassol", label: "Limassol" },
  { value: "larnaca", label: "Larnaca" },
  { value: "paphos", label: "Paphos" },
  { value: "platres", label: "Platres" },
  { value: "paralimni_ayia_napa", label: "Paralimni/Ayia Napa" },
  { value: "whole_cyprus", label: "Whole Cyprus" },
];

const eventTypes = [
  { value: "all", label: "All Event Types" },
  { value: "wedding", label: "Wedding" },
  { value: "christening", label: "Christening" },
  { value: "party", label: "Party" },
  { value: "kids_party", label: "Kids Party" },
];

export default function VendorDiscoveryPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VendorDiscoveryFilters>({
    search: "",
    category: "all",
    location: "all",
    eventType: "all",
  });

  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const { isFavorited, toggleFavorite, getFavoritesCount } =
    useVendorFavorites();

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchVendors();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build base query
      let query = supabase.from("vendor_profiles").select(`
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
          )
        `);

      // Apply filters
      if (filters.category && filters.category !== "all") {
        query = query.eq("business_category", filters.category);
      }

      if (filters.eventType && filters.eventType !== "all") {
        query = query.overlaps("event_types", [filters.eventType]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Post-query filtering
      let filteredVendors = data || [];

      // Filter by location (post-query since it's a nested relation)
      if (filters.location && filters.location !== "all") {
        filteredVendors = filteredVendors.filter((vendor) =>
          vendor.vendor_locations.some(
            (location: any) => location.location === filters.location
          )
        );
      }

      // Only filter by active services if the user is specifically looking for services
      // This allows vendors without services to still show up
      if (filters.search && filters.search.trim() !== "") {
        // If searching, only show vendors with matching services or business info
        filteredVendors = filteredVendors.filter((vendor) => {
          const searchLower = filters.search.toLowerCase();
          const hasMatchingBusiness =
            vendor.business_name.toLowerCase().includes(searchLower) ||
            vendor.description?.toLowerCase().includes(searchLower);

          const hasMatchingServices = vendor.vendor_services.some(
            (service: any) =>
              service.name.toLowerCase().includes(searchLower) &&
              service.is_active
          );

          return hasMatchingBusiness || hasMatchingServices;
        });
      }

      setVendors(filteredVendors);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof VendorDiscoveryFilters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchVendors();
  }, [filters]);

  const getPrimaryContact = (vendor: VendorProfile) => {
    const primaryContact = vendor.vendor_contacts.find(
      (contact) => contact.is_primary
    );
    return primaryContact || vendor.vendor_contacts[0];
  };

  const getLocationDisplay = (vendor: VendorProfile) => {
    if (vendor.vendor_locations.length === 0) return "Location not specified";
    if (vendor.vendor_locations.length === 1)
      return vendor.vendor_locations[0].location;
    return `${vendor.vendor_locations[0].location} +${
      vendor.vendor_locations.length - 1
    } more`;
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon
              name="AlertCircle"
              size="lg"
              className="text-red-500 mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Vendors
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchVendors()}>Try Again</Button>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">Discover Vendors</h1>
            <p className="text-gray-600 mt-1">
              Find the perfect vendors for your special day
            </p>
          </div>
          <Link href="/dashboard/vendors/favorites">
            <Button variant="outline">
              <Icon name="Heart" size="sm" className="mr-2" />
              Favorites ({getFavoritesCount()})
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search vendors, services..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.category}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location Filter */}
              <Select
                value={filters.location}
                onValueChange={(value) => handleFilterChange("location", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {filters.location === "all"
                      ? "All Locations"
                      : locations.find((loc) => loc.value === filters.location)
                          ?.label || "All Locations"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Event Type Filter */}
              <Select
                value={filters.eventType}
                onValueChange={(value) =>
                  handleFilterChange("eventType", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {filters.eventType === "all"
                      ? "All Event Types"
                      : eventTypes.find(
                          (type) => type.value === filters.eventType
                        )?.label || "All Event Types"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((eventType) => (
                    <SelectItem key={eventType.value} value={eventType.value}>
                      {eventType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Vendor Grid */}
        {vendors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Icon
                name="Search"
                size="lg"
                className="text-gray-400 mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No vendors found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    search: "",
                    category: "all",
                    location: "all",
                    eventType: "all",
                  })
                }
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                isFavorite={isFavorited(vendor.id)}
                onToggleFavorite={() => toggleFavorite(vendor.id)}
              />
            ))}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}

interface VendorCardProps {
  vendor: VendorProfile;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function VendorCard({ vendor, isFavorite, onToggleFavorite }: VendorCardProps) {
  const primaryContact = vendor.vendor_contacts.find(
    (contact) => contact.is_primary
  );
  const locationDisplay =
    vendor.vendor_locations.length > 0
      ? vendor.vendor_locations[0].location
      : "Location not specified";

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={vendor.business_name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Icon name="Building2" size="sm" className="text-primary-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {vendor.business_name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {vendor.verified && (
                  <Badge variant="success" size="sm">
                    <Icon name="CheckCircle" size="xs" className="mr-1" />
                    Verified
                  </Badge>
                )}
                <span className="text-sm text-gray-500 capitalize">
                  {vendor.business_category}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onToggleFavorite}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Icon
              name={isFavorite ? "Heart" : "HeartOff"}
              size="sm"
              className={isFavorite ? "fill-red-500 text-red-500" : ""}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {vendor.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {vendor.description}
          </p>
        )}

        {/* Services */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Services</h4>
          <div className="flex flex-wrap gap-1">
            {vendor.vendor_services.slice(0, 3).map((service) => (
              <Badge key={service.id} variant="outline" size="sm">
                {service.name}
              </Badge>
            ))}
            {vendor.vendor_services.length > 3 && (
              <Badge variant="outline" size="sm">
                +{vendor.vendor_services.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-500">
          <Icon name="MapPin" size="sm" className="mr-1" />
          <span className="capitalize">{locationDisplay}</span>
        </div>

        {/* Contact */}
        {primaryContact && (
          <div className="flex items-center text-sm text-gray-500">
            <Icon
              name={primaryContact.contact_type === "email" ? "Mail" : "Phone"}
              size="sm"
              className="mr-1"
            />
            <span>{primaryContact.contact_value}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Link
            href={`/vendors/${vendor.slug || vendor.id}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </Link>
          {primaryContact && (
            <Button size="sm" className="flex-shrink-0">
              <Icon name="Mail" size="sm" className="mr-1" />
              Contact
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
