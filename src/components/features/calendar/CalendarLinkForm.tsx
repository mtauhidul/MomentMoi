"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Clock,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  validateCalendarUrl,
  formatCalendarUrl,
  getCalendarHelpText,
} from "@/lib/calendar-service";

interface CalendarLinkFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => Promise<void>;
  currentUrl?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export function CalendarLinkForm({
  isOpen,
  onClose,
  onSave,
  currentUrl,
}: CalendarLinkFormProps) {
  const [url, setUrl] = useState(currentUrl || "");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<string>("");
  const [showHelp, setShowHelp] = useState(false);

  const validateUrl = (url: string): ValidationError[] => {
    const errors: ValidationError[] = [];

    const validation = validateCalendarUrl(url);
    if (!validation.isValid) {
      errors.push({
        field: "url",
        message: validation.error || "Invalid calendar URL",
      });
    }

    return errors;
  };

  const testConnection = async () => {
    const validationErrors = validateUrl(url);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrors([]);

    try {
      const response = await fetch("/api/vendor/test-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult(result);
      } else {
        setTestResult({
          success: false,
          message:
            result.error ||
            "Failed to test calendar connection. Please try again.",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test calendar connection. Please try again.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const validationErrors = validateUrl(url);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      await onSave(url);
      onClose();
    } catch (error) {
      setErrors([
        {
          field: "url",
          message: "Failed to save calendar URL. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when opened with new URL
  useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl || "");
      setErrors([]);
      setTestResult(null);
      setShowHelp(false);
    }
  }, [isOpen, currentUrl]);

  // Detect provider when URL changes
  useEffect(() => {
    if (url.trim()) {
      const provider = formatCalendarUrl(url);
      setDetectedProvider(provider);
    } else {
      setDetectedProvider("");
    }
  }, [url]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setErrors(errors.filter((error) => error.field !== "url"));
    setTestResult(null);
  };

  if (!isOpen) return null;

  const urlError = errors.find((error) => error.field === "url")?.message;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Connect External Calendar
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <Input
              label="Calendar URL"
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              error={urlError}
              helperText="Enter the public URL of your external calendar"
            />

            {/* Provider Detection */}
            {detectedProvider && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Detected: {detectedProvider}
                  </span>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Calendar Setup Help
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs"
                >
                  {showHelp ? "Hide" : "Show"} Help
                </Button>
              </div>

              {showHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Supported Calendars:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Google Calendar (public URL)</li>
                          <li>• Outlook/Office 365 (public URL)</li>
                          <li>• Yahoo Calendar (public URL)</li>
                          <li>• iCloud Calendar (public URL)</li>
                          <li>• Any iCal (.ics) file URL</li>
                        </ul>
                      </div>
                    </div>

                    {detectedProvider && (
                      <div className="border-t border-blue-200 pt-3">
                        <div className="flex items-start gap-2">
                          <Settings className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">
                              How to get your {detectedProvider} URL:
                            </p>
                            <p className="text-xs leading-relaxed">
                              {getCalendarHelpText(detectedProvider)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border ${
                  testResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        testResult.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {testResult.success
                        ? "Connection Successful!"
                        : "Connection Failed"}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        testResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {testResult.message}
                    </p>
                    {testResult.success && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                        <Clock className="w-3 h-3" />
                        <span>
                          Your external events will appear on your calendar
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={testConnection}
                loading={testing}
                disabled={!url.trim() || loading}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                onClick={handleSave}
                loading={loading}
                disabled={
                  !url.trim() ||
                  testing ||
                  (testResult !== null && !testResult.success)
                }
                className="flex-1"
              >
                {loading ? "Saving..." : "Save Calendar"}
              </Button>
            </div>

            {/* Cancel */}
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading || testing}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
