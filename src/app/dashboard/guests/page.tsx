"use client";

import { useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  GuestList,
  GuestStats,
  GuestGroups,
  GuestForm,
  InvitationManager,
} from "./components";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { Button } from "@/components/ui/Button";

export default function GuestsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">
              Guest Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your guest list, track RSVPs, and organize your event
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>Add Guest</Button>
        </div>

        {showForm && (
          <GuestForm
            onClose={() => setShowForm(false)}
            onSuccess={() => setShowForm(false)}
          />
        )}

        <Suspense fallback={<Skeleton className="h-32" />}>
          <GuestStats />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-24" />}>
          <GuestGroups />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-48" />}>
          <InvitationManager />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-96" />}>
          <GuestList />
        </Suspense>
      </div>
    </ClientDashboardLayout>
  );
}
