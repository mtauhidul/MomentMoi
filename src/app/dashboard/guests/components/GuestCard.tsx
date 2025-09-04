"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RSVPStatusBadge } from "./RSVPStatusBadge";
import { Guest, RSVPStatus } from "@/types/guests";
import { useGuests } from "@/hooks/useGuests";

interface GuestCardProps {
  guest: Guest;
}

export function GuestCard({ guest }: GuestCardProps) {
  const [updating, setUpdating] = useState(false);
  const { updateRSVPStatus } = useGuests();

  const handleRSVPUpdate = async (status: RSVPStatus) => {
    setUpdating(true);
    try {
      await updateRSVPStatus(guest.id, status);
    } catch (error) {
      console.error("Failed to update RSVP:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{guest.name}</h3>
          <p className="text-sm text-gray-600">{guest.email}</p>
          {guest.phone && (
            <p className="text-sm text-gray-600">{guest.phone}</p>
          )}
        </div>
        <RSVPStatusBadge status={guest.rsvp_status} />
      </div>

      {guest.plus_one_name && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Plus One:</span> {guest.plus_one_name}
        </div>
      )}

      {guest.dietary_restrictions && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Dietary:</span>{" "}
          {guest.dietary_restrictions}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRSVPUpdate("confirmed")}
          disabled={updating || guest.rsvp_status === "confirmed"}
        >
          Confirm
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRSVPUpdate("maybe")}
          disabled={updating || guest.rsvp_status === "maybe"}
        >
          Maybe
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRSVPUpdate("declined")}
          disabled={updating || guest.rsvp_status === "declined"}
        >
          Decline
        </Button>
      </div>
    </Card>
  );
}
