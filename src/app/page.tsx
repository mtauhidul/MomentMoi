"use client";

import { FeaturedVendorCard } from "@/components/features/vendors/FeaturedVendorCard";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFeaturedVendors } from "@/hooks/useFeaturedVendors";
import {
  Camera,
  ChevronRight,
  MapPin,
  Music,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [currentEventType, setCurrentEventType] = useState(0);

  const { vendors: featuredVendors, loading: featuredVendorsLoading } =
    useFeaturedVendors(9);

  const eventTypes = ["Weddings", "Christenings", "Parties"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEventType((prev) => (prev + 1) % eventTypes.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [eventTypes.length]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-8 bg-background min-h-[calc(100svh-104px)]">
        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-display text-4xl md:text-5xl font-light text-white leading-tight">
                  Find your Perfect
                  <span className="block text-primary-500">
                    vendor for {eventTypes[currentEventType]}
                  </span>
                </h1>
                <p className="text-body text-lg text-white leading-tight max-w-[40ch]">
                  Search through the biggest wedding, christening and party
                  vendor collection in Cyprus.
                </p>
              </div>

              {/* Vendor Categories Card */}
              <Card variant="default" className="bg-white p-8">
                <CardContent className="p-0 space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/vendors/venues"
                      className="flex items-center space-x-3 p-4 rounded-lg hover:bg-primary-50 transition-colors group"
                    >
                      <MapPin className="w-6 h-6 text-primary-500" />
                      <span className="text-body font-medium text-text-primary">
                        Venues
                      </span>
                    </Link>

                    <Link
                      href="/vendors/photographers"
                      className="flex items-center space-x-3 p-4 rounded-lg hover:bg-primary-50 transition-colors group"
                    >
                      <Camera className="w-6 h-6 text-primary-500" />
                      <span className="text-body font-medium text-text-primary">
                        Photographers
                      </span>
                    </Link>

                    <Link
                      href="/vendors/music"
                      className="flex items-center space-x-3 p-4 rounded-lg hover:bg-primary-50 transition-colors group"
                    >
                      <Music className="w-6 h-6 text-primary-500" />
                      <span className="text-body font-medium text-text-primary">
                        Music
                      </span>
                    </Link>

                    <Link
                      href="/vendors/catering"
                      className="flex items-center space-x-3 p-4 rounded-lg hover:bg-primary-50 transition-colors group"
                    >
                      <UtensilsCrossed className="w-6 h-6 text-primary-500" />
                      <span className="text-body font-medium text-text-primary">
                        Catering
                      </span>
                    </Link>
                  </div>

                  <div className="flex justify-start">
                    <Button asChild>
                      <Link
                        href="/vendors"
                        className="flex items-center space-x-2"
                      >
                        <span>All Vendors</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Hero Image */}
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-md h-full relative overflow-hidden rounded-xl">
                {/* <img
                  src="https://momentmoi.com/wp-content/uploads/2025/05/All-Cyprus-wedding-vendors.webp"
                  alt="All Cyprus wedding vendors collection"
                  className="w-full h-full object-cover rounded-xl"
                /> */}
                <img
                  src="https://picsum.photos/seed/picsum/300/300"
                  alt="All Cyprus wedding vendors collection"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vendors Section */}
      <section className="py-16 px-8 bg-background">
        <div className="max-w-8xl mx-auto">
          <div className="text-left mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-text-primary mb-4">
              Featured Vendors
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl">
              Discover our most trusted and popular vendors, ready to make your
              special event unforgettable.
            </p>
          </div>

          {featuredVendorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-64 rounded-xl overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          ) : featuredVendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {featuredVendors.map((vendor) => (
                <FeaturedVendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg">
                No featured vendors available at the moment.
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/vendors">
              <Button variant="outline" size="lg">
                View All Vendors
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
