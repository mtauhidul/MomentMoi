"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { StatsCard } from "@/components/features/dashboard";
import { BookingService } from "@/lib/booking-service";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Search,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  Euro,
} from "lucide-react";

interface Inquiry {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type: string;
  event_date?: string;
  guest_count?: number;
  location?: string;
  budget_range?: string;
  message: string;
  status: "new" | "responded" | "booked" | "declined" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  source: "website" | "phone" | "email" | "social_media" | "referral";
  created_at: string;
  responded_at?: string;
  service_id?: string;
  service_name?: string;
}

interface InquiryStats {
  total: number;
  new: number;
  responded: number;
  booked: number;
  declined: number;
  archived: number;
}

export default function InquiriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({
    total: 0,
    new: 0,
    responded: 0,
    booked: 0,
    declined: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchInquiries();
    }
  }, [user, authLoading, router]);

  const fetchInquiries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      // Get vendor profile ID
      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching vendor profile:", profileError);
        setError("Failed to load vendor profile");
        return;
      }

      // Fetch inquiries with service information
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from("vendor_inquiries")
        .select(
          `
          *,
          service:vendor_services(name)
        `
        )
        .eq("vendor_id", vendorProfile.id)
        .order("created_at", { ascending: false });

      if (inquiriesError) {
        console.error("Error fetching inquiries:", inquiriesError);
        setError("Failed to load inquiries");
        return;
      }

      const transformedInquiries =
        inquiriesData?.map((inquiry) => ({
          ...inquiry,
          service_name: inquiry.service?.name,
        })) || [];

      setInquiries(transformedInquiries);

      // Calculate stats
      const stats = {
        total: transformedInquiries.length,
        new: transformedInquiries.filter((i) => i.status === "new").length,
        responded: transformedInquiries.filter((i) => i.status === "responded")
          .length,
        booked: transformedInquiries.filter((i) => i.status === "booked")
          .length,
        declined: transformedInquiries.filter((i) => i.status === "declined")
          .length,
        archived: transformedInquiries.filter((i) => i.status === "archived")
          .length,
      };

      setStats(stats);
    } catch (error) {
      console.error("Error in fetchInquiries:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (inquiryId: string, newStatus: string) => {
    try {
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const updateData: any = { status: newStatus };
      if (newStatus === "responded") {
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("vendor_inquiries")
        .update(updateData)
        .eq("id", inquiryId);

      if (error) {
        console.error("Error updating inquiry status:", error);
        return;
      }

      // If status is being changed to "booked", create a booking record
      if (newStatus === "booked") {
        const inquiry = inquiries.find((i) => i.id === inquiryId);
        if (inquiry) {
          const bookingCreated = await createBookingRecord(inquiry);
          if (!bookingCreated) {
            console.error(
              "Failed to create booking record for inquiry:",
              inquiryId
            );
            return;
          }
        }
      }

      // Update local state
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId
            ? {
                ...inquiry,
                status: newStatus as any,
                responded_at: updateData.responded_at,
              }
            : inquiry
        )
      );

      // Refresh stats
      fetchInquiries();
    } catch (error) {
      console.error("Error updating inquiry status:", error);
    }
  };

  const createBookingRecord = async (inquiry: Inquiry) => {
    try {
      // Get vendor profile ID to convert inquiry to booking service format
      const { createClientComponentClient } = await import("@/lib/supabase");
      const supabase = createClientComponentClient();

      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profileError) {
        console.error("Error fetching vendor profile:", profileError);
        return false;
      }

      // Convert inquiry to booking service format
      const bookingServiceInquiry = {
        id: inquiry.id,
        vendor_id: vendorProfile.id,
        service_id: inquiry.service_id,
        client_name: inquiry.client_name,
        client_email: inquiry.client_email,
        client_phone: inquiry.client_phone,
        event_type: inquiry.event_type,
        event_date: inquiry.event_date,
        guest_count: inquiry.guest_count,
        location: inquiry.location,
        budget_range: inquiry.budget_range,
        message: inquiry.message,
        status: inquiry.status,
        created_at: inquiry.created_at,
        updated_at: inquiry.created_at, // Use created_at as fallback
      };

      const bookingService = new BookingService();
      const booking = await bookingService.createBookingFromInquiry(
        bookingServiceInquiry
      );

      return !!booking;
    } catch (error) {
      console.error("Error creating booking record:", error);
      return false;
    }
  };

  const handleCreateBooking = async (inquiry: Inquiry) => {
    try {
      setBookingLoading(inquiry.id);

      const success = await createBookingRecord(inquiry);

      if (success) {
        // Update inquiry status to booked
        await handleStatusUpdate(inquiry.id, "booked");
        alert("Booking created successfully!");
      } else {
        alert("Failed to create booking. Please try again.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("An error occurred while creating the booking.");
    } finally {
      setBookingLoading(null);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.service_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || inquiry.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || inquiry.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "responded":
        return "bg-yellow-100 text-yellow-800";
      case "booked":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-body text-text-secondary">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display font-light text-text-primary">
              Inquiries
            </h1>
            <p className="text-body text-text-secondary mt-2">
              Manage incoming client inquiries and requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          <StatsCard
            title="Total Inquiries"
            value={stats.total}
            icon={<MessageSquare className="w-6 h-6 text-primary-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="New Inquiries"
            value={stats.new}
            icon={<Clock className="w-6 h-6 text-blue-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Responded"
            value={stats.responded}
            icon={<MessageSquare className="w-6 h-6 text-yellow-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Booked"
            value={stats.booked}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Declined"
            value={stats.declined}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Archived"
            value={stats.archived}
            icon={<Archive className="w-6 h-6 text-gray-600" />}
            loading={loading}
            error={error}
          />
        </div>

        {/* Filters and Search */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="responded">Responded</option>
                <option value="booked">Booked</option>
                <option value="declined">Declined</option>
                <option value="archived">Archived</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Inquiries List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-body text-text-secondary">
                Loading inquiries...
              </p>
            </div>
          </div>
        ) : error ? (
          <Card variant="elevated">
            <CardContent className="p-6 text-center">
              <p className="text-text-secondary">{error}</p>
              <Button
                onClick={fetchInquiries}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredInquiries.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No inquiries found
              </h3>
              <p className="text-text-secondary">
                {inquiries.length === 0
                  ? "You haven't received any inquiries yet. They will appear here when clients contact you."
                  : "No inquiries match your current filters. Try adjusting your search or filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                variant="elevated"
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {inquiry.client_name}
                        </h3>
                        <Badge className={getStatusColor(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                        <Badge className={getPriorityColor(inquiry.priority)}>
                          {inquiry.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {inquiry.client_email}
                        </div>
                        {inquiry.client_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {inquiry.client_phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(inquiry.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-secondary">Event:</span>
                      <span className="font-medium capitalize">
                        {inquiry.event_type}
                      </span>
                    </div>
                    {inquiry.event_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">Date:</span>
                        <span className="font-medium">
                          {formatDate(inquiry.event_date)}
                        </span>
                      </div>
                    )}
                    {inquiry.guest_count && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">Guests:</span>
                        <span className="font-medium">
                          {inquiry.guest_count}
                        </span>
                      </div>
                    )}
                    {inquiry.budget_range && (
                      <div className="flex items-center gap-2 text-sm">
                        <Euro className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">Budget:</span>
                        <span className="font-medium">
                          {inquiry.budget_range}
                        </span>
                      </div>
                    )}
                  </div>

                  {inquiry.location && (
                    <div className="flex items-center gap-2 text-sm mb-4">
                      <MapPin className="w-4 h-4 text-text-secondary" />
                      <span className="text-text-secondary">Location:</span>
                      <span className="font-medium">{inquiry.location}</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm text-text-secondary mb-2">Message:</p>
                    <p className="text-sm text-text-primary bg-gray-50 p-3 rounded-lg">
                      {inquiry.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      {inquiry.status === "new" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(inquiry.id, "responded")
                            }
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Mark as Responded
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateBooking(inquiry)}
                            disabled={bookingLoading === inquiry.id}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            {bookingLoading === inquiry.id
                              ? "Creating..."
                              : "Create Booking"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(inquiry.id, "booked")
                            }
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Mark as Booked
                          </Button>
                        </>
                      )}
                      {inquiry.status === "responded" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateBooking(inquiry)}
                            disabled={bookingLoading === inquiry.id}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            {bookingLoading === inquiry.id
                              ? "Creating..."
                              : "Create Booking"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(inquiry.id, "booked")
                            }
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Mark as Booked
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(inquiry.id, "declined")
                            }
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {inquiry.status !== "archived" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(inquiry.id, "archived")
                          }
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {inquiry.responded_at && (
                        <span>
                          Responded: {formatDate(inquiry.responded_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
