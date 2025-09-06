"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { CameraIcon } from "@/components/ui/HydratedIcon";
import { RoutePreloader, PUBLIC_ROUTES, COMMON_ROUTES, VENDOR_ROUTES, PLANNER_ROUTES } from "@/components/ui/RoutePreloader";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
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
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, memo, useMemo } from "react";

export function Header() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const { navigateInstantly, isNavigating, targetPath } = useInstantNavigation();
  
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Memoize routes to prevent infinite re-renders
  const preloadRoutes = useMemo(() => {
    const routes = [...PUBLIC_ROUTES];
    
    if (user) {
      routes.push(...COMMON_ROUTES);
      
      const userType = user.user_metadata?.user_type;
      if (userType === "vendor") {
        routes.push(...VENDOR_ROUTES);
      } else if (userType === "planner") {
        routes.push(...PLANNER_ROUTES);
      }
    }
    
    return routes;
  }, [user]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsUserMenuOpen(false);
  }, [signOut]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleNavigation = useCallback((path: string) => {
    closeMobileMenu();
    navigateInstantly(path);
  }, [navigateInstantly, closeMobileMenu]);

  const handleLinkClick = useCallback((e: React.MouseEvent, path: string) => {
    e.preventDefault();
    handleNavigation(path);
  }, [handleNavigation]);

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

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    window.addEventListener("mousedown", handleClickOutside); // Use mousedown instead of click
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lastScrollY]);

  return (
    <>
      {/* Route Preloader for better navigation performance */}
      <RoutePreloader routes={preloadRoutes} priority="low" />
      
      {/* Navigation Progress Indicator */}
      <NavigationProgress />
      
      <header
        className={`sticky top-0 z-50 bg-white border-b border-border transition-transform duration-300 ease-in-out ${
          !isHeaderVisible ? "-translate-y-full" : "translate-y-0"
        }`}
      >
      <div className="max-w-8xl mx-auto">
        {/* First Row - Main Header */}
        <div className="h-16 px-4 lg:px-8">
          <div className="flex items-center justify-between h-full">
            {/* Left Side - Event Types (Hidden on mobile) */}
            <nav className="hidden lg:flex items-center space-x-6">
              <button
                onClick={() => handleNavigation("/weddings")}
                className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Weddings</span>
              </button>
              <button
                onClick={() => handleNavigation("/christenings")}
                className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <Baby className="w-4 h-4" />
                <span className="text-sm font-medium">Christenings</span>
              </button>
              <button
                onClick={() => handleNavigation("/parties")}
                className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <PartyPopper className="w-4 h-4" />
                <span className="text-sm font-medium">Parties</span>
              </button>
            </nav>

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
              <button
                onClick={() => handleNavigation("/")}
                className="text-xl lg:text-2xl text-display font-light"
              >
                <span className="text-black">Moment</span>
                <span className="text-primary-500">Moi</span>
              </button>
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
                          <button
                            onClick={() => {
                              handleNavigation("/dashboard");
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                          </button>

                          <button
                            onClick={() => {
                              handleNavigation("/dashboard/profile");
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </button>

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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleNavigation("/dashboard/vendors/favorites")}
                    className="flex items-center space-x-2"
                  >
                    <HeartIcon className="w-4 h-4" />
                    <span>Favorites</span>
                  </Button>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleNavigation("/auth/login")}
                    className="flex items-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log in</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleNavigation("/dashboard/vendors/favorites")}
                    className="flex items-center space-x-2"
                  >
                    <HeartIcon className="w-4 h-4" />
                    <span>Favorites</span>
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
                        <button
                          onClick={() => {
                            handleNavigation("/dashboard");
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation("/dashboard/profile");
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation("/dashboard/vendors/favorites");
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                        >
                          <HeartIcon className="w-4 h-4" />
                          <span>Favorites</span>
                        </button>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleNavigation("/auth/login")}
                  className="flex items-center space-x-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Log in</span>
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
                      <button
                        onClick={() => handleNavigation("/weddings")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">Weddings</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/christenings")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <Baby className="w-4 h-4" />
                        <span className="text-sm font-medium">Christenings</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/parties")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <PartyPopper className="w-4 h-4" />
                        <span className="text-sm font-medium">Parties</span>
                      </button>
                    </div>
                  </div>

                  {/* Vendor Categories */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-text-primary">Vendor Categories</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleNavigation("/vendors/venues")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <VenueIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Venues</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/vendors/photographers")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <CameraIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Photographers</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/vendors/catering")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span className="text-xs font-medium">Catering</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/vendors/florists")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <Flower className="w-4 h-4" />
                        <span className="text-xs font-medium">Florists</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/vendors/music")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <Music className="w-4 h-4" />
                        <span className="text-xs font-medium">Music & DJ</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/vendors/planners")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span className="text-xs font-medium">Planners</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/vendors/other")}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <Star className="w-4 h-4" />
                        <span className="text-xs font-medium">Other</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Auth Actions */}
                  {!loading && !user && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <button
                        onClick={() => {
                          handleNavigation("/dashboard/vendors/favorites");
                          closeMobileMenu();
                        }}
                        className="flex items-center space-x-2 text-text-secondary hover:text-primary-500 transition-colors py-1 w-full text-left"
                      >
                        <HeartIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Favorites</span>
                      </button>
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
            <button
              onClick={() => handleNavigation("/vendors/venues")}
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <VenueIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Venues</span>
            </button>
            <button
              onClick={() => handleNavigation("/vendors/photographers")}
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <CameraIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Photographers</span>
            </button>
            <button
              onClick={() => handleNavigation("/vendors/catering")}
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span className="text-xs font-medium">Catering</span>
            </button>
            <button
              onClick={() => handleNavigation("/vendors/florists")}
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <Flower className="w-4 h-4" />
              <span className="text-xs font-medium">Florists</span>
            </button>
            <button
              onClick={() => handleNavigation("/vendors/music")}
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <Music className="w-4 h-4" />
              <span className="text-xs font-medium">Music & DJ</span>
            </button>
            <button
              onClick={() => handleNavigation("/vendors/planners")}
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="text-xs font-medium">Planners</span>
            </button>
            <button
              onClick={() => handleNavigation("/vendors/other")}
              className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors"
            >
              <Star className="w-4 h-4" />
              <span className="text-xs font-medium">Other</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
    </>
  );
}
