"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { StatsCard } from "@/components/features/dashboard";

interface Partner {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: string;
}

interface PartnerStatusProps {
  partner: Partner | null;
}

export function PartnerStatus({ partner }: PartnerStatusProps) {
  if (!partner) {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
              <Icon name="UserPlus" size="lg" className="text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-text-primary">
                No Partner Connected
              </h3>
              <p className="text-sm text-text-secondary">
                Invite your partner to join your event planning team
              </p>
            </div>
            <Badge variant="secondary">Solo Planning</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Heart" size="sm" className="text-pink-400" />
          Partner Connected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            {partner.avatar_url ? (
              <img
                src={partner.avatar_url}
                alt={partner.full_name || "Partner"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Icon name="User" size="lg" className="text-primary-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">
              {partner.full_name || "Partner"}
            </h3>
            <p className="text-sm text-text-secondary">{partner.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="success">Connected</Badge>
              <span className="text-xs text-text-muted">
                Partner since {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <StatsCard
            title="Shared Tasks"
            value={12}
            layout="centered"
            size="sm"
          />
          <StatsCard title="Messages" value={8} layout="centered" size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}
