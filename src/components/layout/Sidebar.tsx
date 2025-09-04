"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { SkeletonUserProfile } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItem {
  label: string;
  href: string;
  icon: keyof typeof import("lucide-react");
}

interface SidebarProps {
  className?: string;
}

type UserType = "planner" | "vendor" | "viewer";

// Define navigation for each user type
const plannerSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "Event",
    href: "/dashboard/event",
    icon: "CalendarDays",
  },
  {
    label: "Guests",
    href: "/dashboard/guests",
    icon: "Users",
  },
  {
    label: "Checklist",
    href: "/dashboard/checklist",
    icon: "CheckCircle",
  },
  {
    label: "Budget",
    href: "/dashboard/budget",
    icon: "DollarSign",
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: "Calendar",
  },
  {
    label: "Partner",
    href: "/dashboard/partner",
    icon: "Heart",
  },
  {
    label: "Vendors",
    href: "/dashboard/vendors",
    icon: "Building2",
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: "User",
  },
];

const vendorSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: "Package",
  },
  {
    label: "Gallery",
    href: "/dashboard/gallery",
    icon: "Image",
  },
  {
    label: "Inquiries",
    href: "/dashboard/inquiries",
    icon: "MessageSquare",
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: "Calendar",
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: "User",
  },
];

const viewerSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "Vendors",
    href: "/dashboard/vendors",
    icon: "Building2",
  },
  {
    label: "Favorites",
    href: "/dashboard/vendors/favorites",
    icon: "Heart",
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: "User",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading: authLoading, userType, profile } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // User type is now handled centrally in AuthContext

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get sidebar items based on user type
  const getSidebarItems = (): SidebarItem[] => {
    if (!userType) return [];

    switch (userType) {
      case "planner":
        return plannerSidebarItems;
      case "vendor":
        return vendorSidebarItems;
      case "viewer":
        return viewerSidebarItems;
      default:
        return viewerSidebarItems; // fallback
    }
  };

  const sidebarItems = getSidebarItems();

  const handleSignOut = async () => {
    try {
      console.log("Starting signout process...");
      await signOut();
      console.log("Signout completed, redirecting to homepage...");
      // Small delay to ensure signout completes
      setTimeout(() => {
        router.push("/");
      }, 100);
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Error during signout:", error);
      // Still redirect even if there's an error
      router.push("/");
      setIsProfileOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r border-border shadow-sm",
        className
      )}
    >
      {/* Fixed Logo Section */}
      <div className="sticky top-0 z-10 flex items-center justify-center h-16 px-4 border-b border-border bg-white">
        <h3 className="text-xl font-semibold text-primary-500">MomentMoi</h3>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10">
        {authLoading || !userType ? (
          // Loading skeleton for navigation items
          <>
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
              >
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </>
        ) : (
          sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-600 border border-primary-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  name={item.icon}
                  size="sm"
                  className={cn(
                    isActive ? "text-primary-600" : "text-gray-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })
        )}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-border relative z-20">
        <div className="relative" ref={profileRef}>
          {authLoading ? (
            <SkeletonUserProfile />
          ) : (
            <>
              <Button
                variant="ghost"
                size="md"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Icon name="User" size="sm" className="text-primary-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || "User"}
                  </div>
                </div>
                <Icon
                  name={isProfileOpen ? "ChevronUp" : "ChevronDown"}
                  size="sm"
                  className="text-gray-400"
                />
              </Button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-white border border-border rounded-md shadow-lg z-[100]">
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Icon name="User" size="sm" className="text-gray-400" />
                      <span>Profile</span>
                    </Link>

                    {/* Separator */}
                    <div className="border-t border-border my-1"></div>

                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Icon name="LogOut" size="sm" className="text-red-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
