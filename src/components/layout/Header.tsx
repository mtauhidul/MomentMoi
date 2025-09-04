"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { CameraIcon } from "@/components/ui/HydratedIcon";
import {
  Baby,
  ChevronDown,
  ClipboardList,
  Flower,
  Heart,
  Heart as HeartIcon,
  LayoutDashboard,
  LogIn,
  LogOut,
  Music,
  PartyPopper,
  Star,
  User,
  UtensilsCrossed,
  Building2 as VenueIcon,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export function Header() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
      
      // Handle user menu clicks
      if (!target.closest(".user-menu")) {
        setIsUserMenuOpen(false);
      }
      
      // Handle mobile menu clicks using refs
      if (mobileMenuRef.current && mobileMenuButtonRef.current) {
        const isClickInsideMenu = mobileMenuRef.current.contains(target as Node);
        const isClickOnButton = mobileMenuButtonRef.current.contains(target as Node);
        
        // Only close if clicking outside both menu and button
        if (!isClickInsideMenu && !isClickOnButton) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousedown", handleClickOutside); // Use mousedown instead of click
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lastScrollY]);

  return (
    <header
      key="responsive-header-v2" // Force re-render with cache busting
      className={`sticky top-0 z-50 bg-white border-b border-border transition-transform duration-300 ease-in-out ${
        !isHeaderVisible ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="max-w-8xl mx-auto">
        {/* First Row - Main Header */}
        <div className="h-16 px-4 lg:px-8">
          <div className="flex items-center justify-between h-full">
            {/* Left Side - Event Types (Hidden on mobile) */}
            <div className="hidden lg:flex items-center space-x-6">
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

            {/* Mobile Menu Button */}
            <button
              ref={mobileMenuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className={`lg:hidden mobile-menu-button p-2 rounded-md transition-all duration-200 ${
                isMobileMenuOpen 
                  ? 'bg-primary-100 text-primary-600 shadow-sm' 
                  : 'text-text-secondary hover:text-primary-500 hover:bg-gray-50'
              }`}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Center - Logo */}
            <div className="flex-1 flex justify-center lg:flex-none">
              <Link href="/" className="text-xl lg:text-2xl text-display font-light">
                <span className="text-black">Moment</span>
                <span className="text-primary-500">Moi</span>
              </Link>
            </div>

            {/* Right Side - Auth/User Buttons (Hidden on mobile except essentials) */}
            <div className="hidden lg:flex items-center space-x-3">
              {!loading && user ? (
                <>
                  {/* User Menu */}
                  <div className="relative user-menu">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md border border-border hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium text-text-secondary max-w-[120px] truncate">
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

            {/* Mobile Auth Buttons */}
            <div className="lg:hidden flex items-center space-x-2">
              {!loading && user ? (
                <div className="relative user-menu">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-2 rounded-md border border-border hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-text-secondary border-b">
                          {user.email}
                        </div>
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
                        <Link
                          href="/favorites"
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <HeartIcon className="w-4 h-4" />
                          <span>Favorites</span>
                        </Link>
                        <div className="border-t border-border my-1"></div>
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
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/auth/login" className="flex items-center space-x-1">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Log in</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop - only covers content area, not header */}
            <div 
              className="lg:hidden fixed inset-x-0 bg-black bg-opacity-25"
              style={{ 
                top: '4rem', // Start right below the header
                bottom: 0,
                zIndex: 40 
              }}
              onClick={(e) => {
                e.stopPropagation();
                closeMobileMenu();
              }}
            />
            
            {/* Menu Content */}
            <div ref={mobileMenuRef} className="lg:hidden mobile-menu-content">
              <div className="absolute top-full left-0 right-0 bg-white border-b border-border shadow-2xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="px-4 py-4 space-y-4">
                  {/* Event Types */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-text-primary">Event Types</h3>
                    <div className="space-y-2">
                      <Link
                        href="/weddings"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">Weddings</span>
                      </Link>
                      <Link
                        href="/christenings"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <Baby className="w-4 h-4" />
                        <span className="text-sm font-medium">Christenings</span>
                      </Link>
                      <Link
                        href="/parties"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <PartyPopper className="w-4 h-4" />
                        <span className="text-sm font-medium">Parties</span>
                      </Link>
                    </div>
                  </div>

                  {/* Vendor Categories */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-text-primary">Vendor Categories</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/vendors/venues"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <VenueIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Venues</span>
                      </Link>
                      <Link
                        href="/vendors/photographers"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <CameraIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Photographers</span>
                      </Link>
                      <Link
                        href="/vendors/catering"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span className="text-xs font-medium">Catering</span>
                      </Link>
                      <Link
                        href="/vendors/florists"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <Flower className="w-4 h-4" />
                        <span className="text-xs font-medium">Florists</span>
                      </Link>
                      <Link
                        href="/vendors/music"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <Music className="w-4 h-4" />
                        <span className="text-xs font-medium">Music & DJ</span>
                      </Link>
                      <Link
                        href="/vendors/planners"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span className="text-xs font-medium">Planners</span>
                      </Link>
                      <Link
                        href="/vendors/other"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <Star className="w-4 h-4" />
                        <span className="text-xs font-medium">Other</span>
                      </Link>
                    </div>
                  </div>

                  {/* Mobile Auth Actions */}
                  {!loading && !user && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <Link
                        href="/favorites"
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1"
                        onClick={closeMobileMenu}
                      >
                        <HeartIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Favorites</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Second Row - Vendor Categories (Desktop only) */}
        <div className="hidden lg:block h-10 bg-primary-900 px-8">
          <nav className="flex items-center justify-start space-x-8 h-full">
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
              <CameraIcon className="w-4 h-4" />
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
