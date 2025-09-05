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
import { Baby, MapPin, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function ChristeningsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-500 mb-6">
            <Baby className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-text-primary mb-4">
            Celebrate Your Little One's Christening
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Make this sacred milestone memorable with the perfect vendors. 
            From photographers to catering, find everything you need for a beautiful christening ceremony.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/vendors?event_type=christening">
                Browse Christening Vendors
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
            Christening Vendor Categories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Photography", icon: "📸", category: "photographer" },
              { name: "Venues", icon: "⛪", category: "venue" },
              { name: "Catering", icon: "🍽️", category: "catering" },
              { name: "Flowers", icon: "🌸", category: "florist" },
              { name: "Christening Cakes", icon: "🎂", category: "cake" },
              { name: "Christening Gowns", icon: "👶", category: "dress" },
              { name: "Decoration", icon: "🎀", category: "decoration" },
              { name: "Music", icon: "🎵", category: "music" },
              { name: "Transportation", icon: "🚗", category: "transportation" },
            ].map((category) => (
              <Card key={category.category} variant="elevated" className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/vendors?event_type=christening&category=${category.category}`}>
                      View Vendors
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-light text-text-primary text-center mb-12">
            Why Choose MomentMoi for Your Christening?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-500 mb-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Curated Vendors
              </h3>
              <p className="text-text-secondary">
                Hand-picked vendors specializing in christening ceremonies and celebrations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-500 mb-4">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Local Focus
              </h3>
              <p className="text-text-secondary">
                Find vendors in your area who understand local traditions and venues.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-500 mb-4">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Easy Planning
              </h3>
              <p className="text-text-secondary">
                Simple tools to organize your christening and manage vendor communications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-text-primary mb-6">
            Ready to Plan Your Christening?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Create beautiful memories for this special day with our trusted vendors.
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
