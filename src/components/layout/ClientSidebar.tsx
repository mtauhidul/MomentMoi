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
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { EventCountdown } from "@/components/features/dashboard/EventCountdown";

interface ClientSidebarItem {
  label: string;
  href: string;
  icon: keyof typeof import("lucide-react");
  badge?: string;
}

interface ClientSidebarProps {
  className?: string;
}

const plannerSidebarItems: ClientSidebarItem[] = [
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

const vendorSidebarItems: ClientSidebarItem[] = [
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

const viewerSidebarItems: ClientSidebarItem[] = [
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

export function ClientSidebar({ className }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading: authLoading, userType, profile } = useAuth();
  const { data: dashboardData } = useClientDashboard();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // User type is now handled centrally in AuthContext

  // Determine which sidebar items to show
  const getSidebarItems = (): ClientSidebarItem[] => {
    console.log(
      "🎯 Determining sidebar items for userType:",
      userType,
      "at",
      new Date().toISOString()
    );
    switch (userType) {
      case "planner":
        console.log("📋 Using planner sidebar items");
        return plannerSidebarItems;
      case "vendor":
        console.log("📋 Using vendor sidebar items");
        return vendorSidebarItems;
      case "viewer":
        console.log("📋 Using viewer sidebar items");
        return viewerSidebarItems;
      default:
        console.log(
          "📋 Using default (viewer) sidebar items (userType is:",
          userType,
          ")"
        );
        return viewerSidebarItems; // fallback
    }
  };

  const sidebarItems = getSidebarItems();

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

      {/* Fixed Event Countdown Widget - Only show for planners */}
      {userType === "planner" && (
        <div className="sticky top-16 z-10 px-4 py-4 border-b border-border bg-white">
          <EventCountdown
            eventDate={
              dashboardData?.event?.event_date
                ? new Date(dashboardData.event.event_date)
                : undefined
            }
          />
        </div>
      )}

      {/* Vendor Business Stats Widget - Only show for vendors */}
      {userType === "vendor" && (
        <div className="sticky top-16 z-10 px-4 py-4 border-b border-border bg-white">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              Vendor Dashboard
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Manage Your Business
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 relative",
                isActive
                  ? "bg-primary-50 text-primary-600 border border-primary-500"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                name={item.icon}
                size="sm"
                className={cn(isActive ? "text-primary-600" : "text-gray-400")}
              />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-secondary-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Partner Collaboration Status - Only show for planners */}
      {userType === "planner" && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Icon name="Heart" size="sm" className="text-pink-400" />
              <span>Planning together</span>
            </div>
            <Link
              href="/dashboard/partner"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage
            </Link>
          </div>
        </div>
      )}

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
                <div className="absolute top-0 left-0 right-0 -mt-2 w-full bg-white border border-border rounded-md shadow-lg z-[100] transform -translate-y-full">
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Icon name="User" size="sm" className="text-gray-400" />
                      <span>Profile Settings</span>
                    </Link>
                    {userType === "planner" && (
                      <Link
                        href="/dashboard/partner"
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Icon
                          name="Heart"
                          size="sm"
                          className="text-pink-400"
                        />
                        <span>Partner Settings</span>
                      </Link>
                    )}

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
