"use client";

import React, { useState } from "react";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useVendorFavorites } from "@/hooks/useVendorFavorites";
import { VendorNote } from "@/components/features/vendors/VendorNote";
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

export default function VendorFavoritesPage() {
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(
    new Set()
  );
  const [showBulkActions, setShowBulkActions] = useState(false);

  const {
    favoriteVendors,
    loading,
    error,
    removeFromFavorites,
    clearAllFavorites,
    refresh,
  } = useVendorFavorites();

  const removeFavorite = async (vendorId: string) => {
    await removeFromFavorites(vendorId);
  };

  const handleClearAllFavorites = async () => {
    await clearAllFavorites();
  };

  const toggleVendorSelection = (vendorId: string) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllVendors = () => {
    const allVendorIds = favoriteVendors.map((v) => v.id);
    setSelectedVendors(new Set(allVendorIds));
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedVendors(new Set());
    setShowBulkActions(false);
  };

  const removeSelectedVendors = async () => {
    for (const vendorId of selectedVendors) {
      await removeFromFavorites(vendorId);
    }
    setSelectedVendors(new Set());
    setShowBulkActions(false);
  };

  const contactSelectedVendors = () => {
    const selectedVendorList = favoriteVendors.filter((v) =>
      selectedVendors.has(v.id)
    );
    const emails = selectedVendorList
      .map(
        (v) =>
          v.vendor_contacts.find((c) => c.contact_type === "email")
            ?.contact_value
      )
      .filter(Boolean);

    if (emails.length > 0) {
      const subject = encodeURIComponent("Inquiry about your services");
      const body = encodeURIComponent(
        "Hello,\n\nI am interested in your services for my event. Please provide more information about your packages and availability.\n\nThank you!"
      );
      window.open(`mailto:${emails.join(",")}?subject=${subject}&body=${body}`);
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
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
              Error Loading Favorites
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => refresh()}>Try Again</Button>
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
            <h1 className="font-semibold text-gray-900">Favorite Vendors</h1>
            <p className="text-gray-600 mt-1">
              Your saved vendors for easy access
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard/vendors">
              <Button variant="outline">
                <Icon name="Search" size="sm" className="mr-2" />
                Discover More
              </Button>
            </Link>
            {favoriteVendors.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAllFavorites}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Icon name="Trash2" size="sm" className="mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Results and Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">
              {favoriteVendors.length} favorite vendor
              {favoriteVendors.length !== 1 ? "s" : ""}
            </p>
            {favoriteVendors.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllVendors}
                  className="text-xs"
                >
                  Select All
                </Button>
                {selectedVendors.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs"
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            )}
          </div>

          {showBulkActions && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={contactSelectedVendors}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Icon name="Mail" size="sm" className="mr-1" />
                Contact Selected ({selectedVendors.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeSelectedVendors}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Icon name="Trash2" size="sm" className="mr-1" />
                Remove Selected
              </Button>
            </div>
          )}
        </div>

        {/* Vendor Grid */}
        {favoriteVendors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Icon
                name="Heart"
                size="lg"
                className="text-gray-400 mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No favorite vendors yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start exploring vendors and save your favorites for easy access
              </p>
              <Link href="/dashboard/vendors">
                <Button>
                  <Icon name="Search" size="sm" className="mr-2" />
                  Discover Vendors
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteVendors.map((vendor) => (
              <FavoriteVendorCard
                key={vendor.id}
                vendor={vendor}
                onRemoveFavorite={() => removeFavorite(vendor.id)}
                isSelected={selectedVendors.has(vendor.id)}
                onToggleSelection={() => toggleVendorSelection(vendor.id)}
              />
            ))}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}

interface FavoriteVendorCardProps {
  vendor: VendorProfile;
  onRemoveFavorite: () => void;
  isSelected: boolean;
  onToggleSelection: () => void;
}

function FavoriteVendorCard({
  vendor,
  onRemoveFavorite,
  isSelected,
  onToggleSelection,
}: FavoriteVendorCardProps) {
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
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
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
            onClick={onRemoveFavorite}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Remove from favorites"
          >
            <Icon
              name="Heart"
              size="sm"
              className="fill-red-500 text-red-500"
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

        {/* Notes */}
        <VendorNote
          vendorId={vendor.id}
          vendorName={vendor.business_name}
          className="pt-2"
        />

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
