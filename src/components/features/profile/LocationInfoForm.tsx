"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Input, Button } from "@/components/ui";
import { MapPin, Globe } from "lucide-react";

interface LocationInfoFormProps {
  isPreviewMode: boolean;
  locations?: {
    id: string;
    location: string;
  }[];
  onDataChange?: (data: { locations: string[] }) => void;
}

const cyprusLocations = [
  { value: "nicosia", label: "Nicosia" },
  { value: "limassol", label: "Limassol" },
  { value: "larnaca", label: "Larnaca" },
  { value: "paphos", label: "Paphos" },
  { value: "platres", label: "Platres" },
  { value: "paralimni_ayia_napa", label: "Paralimni/Ayia Napa" },
  { value: "whole_cyprus", label: "Whole Cyprus" },
];

export function LocationInfoForm({
  isPreviewMode,
  locations,
  onDataChange,
}: LocationInfoFormProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    locations?.map((l) => l.location) || []
  );
  const [travelRadius, setTravelRadius] = useState("");
  const [travelFees, setTravelFees] = useState("");
  const hasMounted = useRef(false);

  // Update form state when locations prop changes
  useEffect(() => {
    if (locations) {
      setSelectedLocations(locations.map((l) => l.location));
    }
  }, [locations]);

  // Mark component as mounted after first render
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) => {
      const newLocations = prev.includes(location)
        ? prev.filter((loc) => loc !== location)
        : [...prev, location];

      // Only notify parent if component has mounted (not during initial render)
      if (onDataChange && hasMounted.current) {
        onDataChange({
          locations: newLocations,
        });
      }

      return newLocations;
    });
  };

  if (isPreviewMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedLocations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedLocations.map((location) => (
                <span
                  key={location}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                >
                  <MapPin className="w-3 h-3" />
                  {cyprusLocations.find((loc) => loc.value === location)?.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No locations selected</p>
          )}

          {travelRadius && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span>Travel radius: {travelRadius}km</span>
            </div>
          )}

          {travelFees && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Travel fees:</span> {travelFees}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Service Locations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Locations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Where do you provide services? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {cyprusLocations.map((location) => (
              <label
                key={location.value}
                className="flex items-center space-x-2 cursor-pointer p-3 border border-border rounded-lg transition-[background-color] duration-150 ease-out hover:bg-gray-50 hover:transition-none"
              >
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location.value)}
                  onChange={() => toggleLocation(location.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{location.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Travel Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Radius (optional)
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={travelRadius}
              onChange={(e) => setTravelRadius(e.target.value)}
              placeholder="50"
              className="w-24"
            />
            <span className="text-sm text-gray-500">kilometers</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Specify how far you're willing to travel for events
          </p>
        </div>

        {/* Travel Fees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Fees (optional)
          </label>
          <Input
            value={travelFees}
            onChange={(e) => setTravelFees(e.target.value)}
            placeholder="e.g., €50 for events outside Limassol"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe any additional fees for travel outside your main service
            area
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
