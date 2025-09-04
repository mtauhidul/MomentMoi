"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  Euro,
} from "lucide-react";

interface BookingDetailsModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (bookingId: string, status: string) => void;
}

export default function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onStatusUpdate,
}: BookingDetailsModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !booking) return null;

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    await onStatusUpdate(booking.id, status);
    setUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Booking Details</span>
            <Button variant="ghost" onClick={onClose} size="sm">
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{booking.client_name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              {booking.client_email}
            </div>
            {booking.client_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                {booking.client_phone}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Event Type:</span>
              <span className="font-medium capitalize">
                {booking.event_type}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(booking.event_date).toLocaleDateString()}
              </span>
            </div>

            {booking.guest_count && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Guests:</span>
                <span className="font-medium">{booking.guest_count}</span>
              </div>
            )}

            {booking.budget_amount && (
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Budget:</span>
                <span className="font-medium">€{booking.budget_amount}</span>
              </div>
            )}
          </div>

          {booking.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Location:</span>
              <span className="font-medium">{booking.location}</span>
            </div>
          )}

          {booking.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Status Management */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
            </div>

            <div className="flex gap-2">
              {booking.status === "confirmed" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={updating}
                  >
                    Mark Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updating}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
