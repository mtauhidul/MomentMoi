"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Header } from "@/components/layout/Header";
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
  contact_type: "email" | "phone";
  contact_value: string;
  is_primary: boolean;
}

const businessCategories = [
  { value: "all", label: "All Categories" },
  { value: "photography", label: "Photography" },
  { value: "catering", label: "Catering" },
  { value: "venue", label: "Venue" },
  { value: "music", label: "Music" },
  { value: "decor", label: "Decor" },
  { value: "transportation", label: "Transportation" },
  { value: "beauty", label: "Beauty" },
  { value: "other", label: "Other" },
];

const eventTypes = [
  { value: "all", label: "All Events" },
  { value: "wedding", label: "Wedding" },
  { value: "christening", label: "Christening" },
  { value: "party", label: "Party" },
  { value: "kids_party", label: "Kids Party" },
];

const cyprusLocations = [
  { value: "all", label: "All Locations" },
  { value: "nicosia", label: "Nicosia" },
  { value: "limassol", label: "Limassol" },
  { value: "larnaca", label: "Larnaca" },
  { value: "paphos", label: "Paphos" },
  { value: "platres", label: "Platres" },
  { value: "paralimni_ayia_napa", label: "Paralimni/Ayia Napa" },
  { value: "whole_cyprus", label: "Whole of Cyprus" },
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    eventType: "all",
    location: "all",
  });

  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const { isFavorited, toggleFavorite, getFavoritesCount } =
    useVendorFavorites();

  useEffect(() => {
    fetchVendors();
  }, [filters]);

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

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon
            name="AlertCircle"
            size="lg"
            className="text-red-500 mx-auto mb-4"
          />
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Error Loading Vendors
          </h1>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={fetchVendors} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-text-primary mb-4">
            Find Your Perfect Vendor
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Discover trusted vendors for your special events. From photography
            to catering, we have everything you need to make your event
            unforgettable.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Search
                </label>
                <Input
                  placeholder="Search vendors..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category
                </label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    handleFilterChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businessCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Event Type
                </label>
                <Select
                  value={filters.eventType}
                  onValueChange={(value) =>
                    handleFilterChange("eventType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Location
                </label>
                <Select
                  value={filters.location}
                  onValueChange={(value) =>
                    handleFilterChange("location", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cyprusLocations.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light text-text-primary">
              {loading
                ? "Loading vendors..."
                : `${vendors.length} vendors found`}
            </h2>
            {user && (
              <Link href="/dashboard/vendors/favorites">
                <Button variant="outline" size="sm">
                  <Icon name="Heart" size="sm" className="mr-2" />
                  View Favorites ({getFavoritesCount()})
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : vendors.length === 0 ? (
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
                  Try adjusting your filters or search terms
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      search: "",
                      category: "all",
                      eventType: "all",
                      location: "all",
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

        {/* Call to Action */}
        {!loading && vendors.length > 0 && (
          <Card className="text-center">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Need help finding the right vendor?
              </h3>
              <p className="text-text-secondary mb-4">
                Create an account to save your favorite vendors and get
                personalized recommendations.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface VendorCardProps {
  vendor: VendorProfile;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

function VendorCard({
  vendor,
  isFavorite = false,
  onToggleFavorite,
}: VendorCardProps) {
  const primaryContact = vendor.vendor_contacts.find(
    (contact) => contact.is_primary
  );
  const locationDisplay =
    vendor.vendor_locations.length > 0
      ? vendor.vendor_locations[0].location
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
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
          {onToggleFavorite && (
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
          )}
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
            {vendor.vendor_services.length > 0 ? (
              <>
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
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">
                No services listed yet
              </span>
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
