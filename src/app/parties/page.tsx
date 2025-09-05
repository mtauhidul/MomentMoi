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
import { PartyPopper, MapPin, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function PartiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-50 to-pink-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-500 mb-6">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-text-primary mb-4">
            Throw an Unforgettable Party
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Whether it's a birthday, anniversary, or any celebration, find the perfect vendors 
            to make your party extraordinary and memorable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/vendors?event_type=party">
                Browse Party Vendors
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
            Party Vendor Categories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Photography", icon: "📸", category: "photographer" },
              { name: "Party Venues", icon: "🏛️", category: "venue" },
              { name: "Catering", icon: "🍽️", category: "catering" },
              { name: "DJ & Entertainment", icon: "🎵", category: "music" },
              { name: "Party Cakes", icon: "🎂", category: "cake" },
              { name: "Decorations", icon: "🎈", category: "decoration" },
              { name: "Flowers", icon: "🌸", category: "florist" },
              { name: "Kids Entertainment", icon: "🎪", category: "entertainment" },
              { name: "Transportation", icon: "🚗", category: "transportation" },
            ].map((category) => (
              <Card key={category.category} variant="elevated" className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/vendors?event_type=party&category=${category.category}`}>
                      View Vendors
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Party Types Section */}
      <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-light text-text-primary text-center mb-12">
            Types of Parties We Help Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Birthday Parties", icon: "🎂", description: "Celebrate another year of life" },
              { name: "Anniversary Parties", icon: "💕", description: "Commemorate special milestones" },
              { name: "Graduation Parties", icon: "🎓", description: "Honor academic achievements" },
              { name: "Holiday Parties", icon: "🎄", description: "Festive seasonal celebrations" },
              { name: "Retirement Parties", icon: "🎉", description: "Celebrate career achievements" },
              { name: "Engagement Parties", icon: "💍", description: "Announce your upcoming wedding" },
              { name: "Housewarming", icon: "🏠", description: "Welcome friends to your new home" },
              { name: "Kids Parties", icon: "🎈", description: "Fun celebrations for children" },
            ].map((party) => (
              <Card key={party.name} variant="elevated" className="text-center">
                <CardHeader>
                  <div className="text-3xl mb-2">{party.icon}</div>
                  <CardTitle className="text-lg">{party.name}</CardTitle>
                  <CardDescription>{party.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-light text-text-primary text-center mb-12">
            Why Choose MomentMoi for Your Party?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-500 mb-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Diverse Vendors
              </h3>
              <p className="text-text-secondary">
                From intimate gatherings to large celebrations, find vendors for any party size and style.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-500 mb-4">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Local Expertise
              </h3>
              <p className="text-text-secondary">
                Connect with vendors who know the best party venues and suppliers in your area.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-500 mb-4">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Budget Friendly
              </h3>
              <p className="text-text-secondary">
                Find vendors that fit your budget, from affordable options to luxury party planners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-text-primary mb-6">
            Ready to Plan Your Party?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Start planning an amazing celebration that your guests will never forget.
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
