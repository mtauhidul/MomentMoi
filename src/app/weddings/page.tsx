"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "@/components/ui";
import { Heart, MapPin, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function WeddingsPage() {
  // Complete navigation when page mounts
  useEffect(() => {
    // Dispatch completion event instead of using the hook function
    const event = new CustomEvent('navigation:complete');
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-50 to-purple-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-pink-500 mb-6">
            <Heart className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-text-primary mb-4">
            Your Dream Wedding Awaits
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Discover the perfect vendors to make your special day unforgettable. 
            From photographers to venues, find everything you need in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/vendors?event_type=wedding">
                Browse Wedding Vendors
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/register">
                Start Planning
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-light text-text-primary text-center mb-12">
            Wedding Vendor Categories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Photography", icon: "📸", category: "photographer" },
              { name: "Venues", icon: "🏛️", category: "venue" },
              { name: "Catering", icon: "🍽️", category: "catering" },
              { name: "Flowers", icon: "🌸", category: "florist" },
              { name: "Music & Entertainment", icon: "🎵", category: "music" },
              { name: "Wedding Cakes", icon: "🎂", category: "cake" },
              { name: "Wedding Dress", icon: "👗", category: "dress" },
              { name: "Jewellery", icon: "💍", category: "jeweller" },
              { name: "Transportation", icon: "🚗", category: "transportation" },
            ].map((category) => (
              <Card key={category.category} variant="elevated" className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/vendors?event_type=wedding&category=${category.category}`}>
                      View Vendors
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-text-primary mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join thousands of couples who have found their perfect wedding vendors through MomentMoi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register?user_type=planner">
                Create Planner Account
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/vendors">
                Browse All Vendors
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
