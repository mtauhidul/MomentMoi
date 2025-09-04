"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@/lib/supabase";
import { PartnerInvitation } from "./components/PartnerInvitation";
import { PartnerStatus } from "./components/PartnerStatus";
import { CollaborationSettings } from "./components/CollaborationSettings";

export default function PartnerPage() {
  const { user } = useAuth();
  const { data: dashboardData, loading } = useClientDashboard();
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-sm text-text-secondary">
              Loading partner information...
            </p>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  const partner = dashboardData?.partner || null;
  const hasPartner = !!partner;

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-display font-light text-text-primary">
            Partner Collaboration
          </h1>
          <p className="text-body text-text-secondary">
            {hasPartner
              ? "Manage your planning partnership and collaboration settings"
              : "Invite your partner to join your event planning journey"}
          </p>
        </div>

        {/* Partner Status Card */}
        <PartnerStatus partner={partner} />

        {/* Partner Invitation Card */}
        {!hasPartner && (
          <PartnerInvitation
            sendingInvitation={sendingInvitation}
            invitationError={invitationError}
            setSendingInvitation={setSendingInvitation}
            setInvitationError={setInvitationError}
          />
        )}

        {/* Collaboration Settings */}
        {hasPartner && <CollaborationSettings partner={partner} />}

        {/* Partner Communication */}
        {hasPartner && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon
                  name="MessageCircle"
                  size="sm"
                  className="text-primary-600"
                />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Icon name="Mail" size="sm" className="mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="justify-start">
                  <Icon name="Share" size="sm" className="mr-2" />
                  Share Event Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card variant="outlined">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
                <Icon
                  name="HelpCircle"
                  size="lg"
                  className="text-primary-600"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-text-primary">Need Help?</h3>
                <p className="text-sm text-text-secondary">
                  {hasPartner
                    ? "Learn more about collaborating with your partner"
                    : "Learn more about inviting your partner to join"}
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Help Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
}
