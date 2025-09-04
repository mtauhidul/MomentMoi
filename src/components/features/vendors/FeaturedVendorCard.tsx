"use client";

import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

interface FeaturedVendor {
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
}

interface FeaturedVendorCardProps {
  vendor: FeaturedVendor;
}

export function FeaturedVendorCard({ vendor }: FeaturedVendorCardProps) {
  // Use logo_url as featured image, fallback to a placeholder if not available
  const featuredImage = vendor.logo_url || "/api/placeholder/400/300";

  return (
    <Link href={`/vendors/${vendor.slug || vendor.id}`}>
      <div className="group relative overflow-hidden rounded-xl aspect-square bg-gray-200 cursor-pointer transition-all duration-300 hover:shadow-lg">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          // style={{ backgroundImage: `url(${featuredImage})` }}
          style={{
            backgroundImage: `url(${"https://picsum.photos/seed/picsum/300/300"})`,
          }}
        />

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {/* Category Pill */}
          <div className="mb-2">
            <Badge className="bg-primary-500 border-primary-600 text-white text-xs font-medium">
              {vendor.business_category
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>

          {/* Business Name */}
          <h3
            className="text-lg font-semibold mb-2 line-clamp-1"
            style={{ color: "white" }}
          >
            {vendor.business_name}
          </h3>

          {/* Description */}
          {vendor.description && (
            <p className="text-sm line-clamp-2" style={{ color: "white" }}>
              {vendor.description}
            </p>
          )}

          {/* Verified Indicator */}
          {vendor.verified && (
            <div className="flex items-center mt-2">
              <Icon name="CheckCircle" size="xs" className="text-white mr-1" />
              <span className="text-xs text-white font-medium">Verified</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
