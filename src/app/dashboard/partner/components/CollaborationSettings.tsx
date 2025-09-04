"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";

interface Partner {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: string;
}

interface CollaborationSettingsProps {
  partner: Partner;
}

export function CollaborationSettings({ partner }: CollaborationSettingsProps) {
  const [settings, setSettings] = useState({
    sharedAccess: true,
    taskNotifications: true,
    budgetNotifications: true,
    guestNotifications: false,
    vendorNotifications: true,
    eventUpdates: true,
  });

  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    // TODO: Implement saving settings to database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Settings" size="sm" className="text-primary-600" />
          Collaboration Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Access Controls */}
        <div className="space-y-4">
          <h4 className="font-medium text-text-primary">Access Controls</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Shared Event Access
                </div>
                <div className="text-xs text-text-secondary">
                  Allow your partner to view and edit event details
                </div>
              </div>
              <Switch
                checked={settings.sharedAccess}
                onCheckedChange={(checked) =>
                  updateSetting("sharedAccess", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Guest List Access
                </div>
                <div className="text-xs text-text-secondary">
                  Allow your partner to manage guest information
                </div>
              </div>
              <Switch checked={true} onCheckedChange={() => {}} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Budget Access
                </div>
                <div className="text-xs text-text-secondary">
                  Allow your partner to view and edit budget items
                </div>
              </div>
              <Switch checked={true} onCheckedChange={() => {}} />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-text-primary">
            Notification Preferences
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Task Updates
                </div>
                <div className="text-xs text-text-secondary">
                  Notify when tasks are completed or assigned
                </div>
              </div>
              <Switch
                checked={settings.taskNotifications}
                onCheckedChange={(checked) =>
                  updateSetting("taskNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Budget Changes
                </div>
                <div className="text-xs text-text-secondary">
                  Notify when budget items are added or modified
                </div>
              </div>
              <Switch
                checked={settings.budgetNotifications}
                onCheckedChange={(checked) =>
                  updateSetting("budgetNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Guest RSVPs
                </div>
                <div className="text-xs text-text-secondary">
                  Notify when guests respond to invitations
                </div>
              </div>
              <Switch
                checked={settings.guestNotifications}
                onCheckedChange={(checked) =>
                  updateSetting("guestNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Vendor Updates
                </div>
                <div className="text-xs text-text-secondary">
                  Notify when vendors are contacted or booked
                </div>
              </div>
              <Switch
                checked={settings.vendorNotifications}
                onCheckedChange={(checked) =>
                  updateSetting("vendorNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-text-primary">
                  Event Updates
                </div>
                <div className="text-xs text-text-secondary">
                  Notify when event details are changed
                </div>
              </div>
              <Switch
                checked={settings.eventUpdates}
                onCheckedChange={(checked) =>
                  updateSetting("eventUpdates", checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Partner Permissions */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-text-primary">Partner Permissions</h4>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-text-primary">
                Partner Role
              </label>
              <Select defaultValue="co-planner">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="co-planner">
                    Co-Planner (Full Access)
                  </SelectItem>
                  <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                  <SelectItem value="limited">
                    Limited (Selected Access)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleSaveSettings}
            loading={saving}
            className="w-full"
          >
            {saving ? "Saving Settings..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
