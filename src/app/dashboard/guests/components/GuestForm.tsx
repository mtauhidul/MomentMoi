"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useGuests } from "@/hooks/useGuests";

const guestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  rsvpStatus: z.enum(["pending", "confirmed", "declined", "maybe"]).optional(),
  groupCategory: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  plusOneName: z.string().optional(),
  plusOneDietaryRestrictions: z.string().optional(),
  notes: z.string().optional(),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface GuestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function GuestForm({ onClose, onSuccess }: GuestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { addGuest, eventId, groups } = useGuests();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
  });

  const onSubmit = async (data: GuestFormData) => {
    if (!eventId) {
      console.error("No event ID available");
      return;
    }

    setSubmitting(true);
    try {
      await addGuest({
        event_id: eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        group_category: data.groupCategory,
        dietary_restrictions: data.dietaryRestrictions,
        plus_one_name: data.plusOneName,
        plus_one_dietary_restrictions: data.plusOneDietaryRestrictions,
        notes: data.notes,
        rsvp_status: data.rsvpStatus || "pending",
        invitation_sent: false,
      });
      reset();
      onSuccess();
    } catch (error) {
      console.error("Failed to create guest:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Add New Guest</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              {...register("name")}
              placeholder="Guest name"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              {...register("email")}
              type="email"
              placeholder="guest@example.com"
              error={errors.email?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <Input {...register("phone")} placeholder="Phone number" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RSVP Status
            </label>
            <Controller
              name="rsvpStatus"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RSVP status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <Controller
              name="groupCategory"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.length > 0 ? (
                      groups.map((group) => (
                        <SelectItem key={group.id} value={group.name}>
                          {group.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="friends">Friends</SelectItem>
                        <SelectItem value="colleagues">Colleagues</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dietary Restrictions
          </label>
          <Input
            {...register("dietaryRestrictions")}
            placeholder="e.g., Vegetarian, Gluten-free"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plus One Name
            </label>
            <Input {...register("plusOneName")} placeholder="Plus one name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plus One Dietary Restrictions
            </label>
            <Input
              {...register("plusOneDietaryRestrictions")}
              placeholder="Plus one dietary needs"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register("notes")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            placeholder="Additional notes about this guest"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Guest"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
