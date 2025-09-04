"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Baby,
  PartyPopper,
  LogIn,
  Heart as HeartIcon,
  Building2 as VenueIcon,
  Camera,
  Music,
  UtensilsCrossed,
  Flower,
  ClipboardList,
  Star,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

export function Header() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 300) {
        // Scrolling down and past 300px - hide header
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".user-menu")) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [lastScrollY]);

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b border-border transition-transform duration-300 ease-in-out ${
        !isHeaderVisible ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="max-w-8xl mx-auto">
        {/* First Row - Main Header (4rem) */}
        <div className="h-16 px-8">
          <div className="flex items-center justify-between h-full">
            {/* Left Side - Event Types */}
            <div className="flex items-center space-x-6">
              <Link
                href="/weddings"
                className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Weddings</span>
              </Link>
              <Link
                href="/christenings"
                className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <Baby className="w-4 h-4" />
                <span className="text-sm font-medium">Christenings</span>
              </Link>
              <Link
                href="/parties"
                className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <PartyPopper className="w-4 h-4" />
                <span className="text-sm font-medium">Parties</span>
              </Link>
            </div>

            {/* Center - Logo */}
            <div className="flex-1 flex justify-center">
              <Link href="/" className="text-2xl text-display font-light">
                <span className="text-black">Moment</span>
                <span className="text-primary-500">Moi</span>
              </Link>
            </div>

            {/* Right Side - Auth/User Buttons */}
            <div className="flex items-center space-x-3">
              {!loading && user ? (
                <>
                  {/* User Menu */}
                  <div className="relative user-menu">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md border border-border hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium text-text-secondary">
                        {user.email}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-md shadow-lg z-50">
                        <div className="py-1">
                          {/* Navigation Links */}
                          <Link
                            href="/dashboard"
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                          </Link>

                          <Link
                            href="/dashboard/profile"
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>

                          {/* Separator */}
                          <div className="border-t border-border my-1"></div>

                          {/* Logout */}
                          <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 text-red-400" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href="/favorites"
                      className="flex items-center space-x-2"
                    >
                      <HeartIcon className="w-4 h-4" />
                      <span>Favorites</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href="/auth/login"
                      className="flex items-center space-x-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Log in</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href="/favorites"
                      className="flex items-center space-x-2"
                    >
                      <HeartIcon className="w-4 h-4" />
                      <span>Favorites</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Second Row - Vendor Categories (2.5rem, dark background) */}
        <div className="h-10 bg-primary-900 px-8 flex items-center">
          <nav className="flex items-center justify-start space-x-8">
            <Link
              href="/vendors/venues"
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <VenueIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Venues</span>
            </Link>
            <Link
              href="/vendors/photographers"
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="text-xs font-medium">Photographers</span>
            </Link>
            <Link
              href="/vendors/catering"
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span className="text-xs font-medium">Catering</span>
            </Link>
            <Link
              href="/vendors/florists"
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <Flower className="w-4 h-4" />
              <span className="text-xs font-medium">Florists</span>
            </Link>
            <Link
              href="/vendors/music"
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <Music className="w-4 h-4" />
              <span className="text-xs font-medium">Music & DJ</span>
            </Link>
            <Link
              href="/vendors/planners"
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="text-xs font-medium">Planners</span>
            </Link>
            <Link
              href="/vendors/other"
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <Star className="w-4 h-4" />
              <span className="text-xs font-medium">Other</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
