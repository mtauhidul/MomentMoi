"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@/lib/supabase";

interface PartnerInvitationProps {
  sendingInvitation: boolean;
  invitationError: string | null;
  setSendingInvitation: (sending: boolean) => void;
  setInvitationError: (error: string | null) => void;
}

export function PartnerInvitation({
  sendingInvitation,
  invitationError,
  setSendingInvitation,
  setInvitationError,
}: PartnerInvitationProps) {
  const { user } = useAuth();
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [invitationSent, setInvitationSent] = useState(false);
  const supabase = createClientComponentClient();

  const handleSendInvitation = async () => {
    if (!partnerName.trim() || !partnerEmail.trim()) {
      setInvitationError("Please fill in both partner name and email");
      return;
    }

    if (!user?.id) {
      setInvitationError("User not authenticated");
      return;
    }

    setSendingInvitation(true);
    setInvitationError(null);

    try {
      // Update the couple profile with partner information
      const { data: coupleProfile, error: fetchError } = await supabase
        .from("couple_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (coupleProfile) {
        // Update existing couple profile
        const { error: updateError } = await supabase
          .from("couple_profiles")
          .update({
            partner_name: partnerName,
            partner_email: partnerEmail,
          })
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new couple profile
        const { error: insertError } = await supabase
          .from("couple_profiles")
          .insert({
            user_id: user.id,
            partner_name: partnerName,
            partner_email: partnerEmail,
          });

        if (insertError) {
          throw insertError;
        }
      }

      // TODO: Send actual email invitation
      // For now, just simulate sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setInvitationSent(true);
      setPartnerName("");
      setPartnerEmail("");
    } catch (error) {
      console.error("Error sending partner invitation:", error);
      setInvitationError("Failed to send invitation. Please try again.");
    } finally {
      setSendingInvitation(false);
    }
  };

  if (invitationSent) {
    return (
      <Card variant="elevated" className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <Icon name="CheckCircle" size="lg" className="text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-green-800">Invitation Sent!</h3>
              <p className="text-sm text-green-700">
                We've sent an invitation to {partnerEmail}. They'll receive an
                email with instructions to join your planning team.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInvitationSent(false)}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Send Another Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="UserPlus" size="sm" className="text-primary-600" />
          Invite Your Partner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">
              Partner's Full Name *
            </label>
            <Input
              type="text"
              placeholder="Enter your partner's full name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary">
              Partner's Email Address *
            </label>
            <Input
              type="email"
              placeholder="partner@example.com"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
            />
            <p className="text-xs text-text-secondary mt-1">
              We'll send them an invitation to create an account and join your
              planning team
            </p>
          </div>

          {invitationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{invitationError}</p>
            </div>
          )}

          <Button
            onClick={handleSendInvitation}
            loading={sendingInvitation}
            disabled={!partnerName.trim() || !partnerEmail.trim()}
            className="w-full"
          >
            {sendingInvitation ? "Sending Invitation..." : "Send Invitation"}
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-3 text-sm text-text-secondary">
            <Icon name="Info" size="sm" className="text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary mb-1">
                What happens next?
              </p>
              <ul className="space-y-1">
                <li>• Your partner will receive an email invitation</li>
                <li>• They'll create an account and join your event</li>
                <li>• You'll both have access to shared planning tools</li>
                <li>• You can collaborate on tasks, guests, and budget</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
