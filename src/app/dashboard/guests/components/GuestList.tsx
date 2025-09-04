"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { GuestForm } from "./GuestForm";
import { GuestCard } from "./GuestCard";
import { useGuests } from "@/hooks/useGuests";

export function GuestList() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { guests, loading, searchGuests } = useGuests();

  const filteredGuests = searchGuests(searchTerm, statusFilter);

  if (loading) return <div>Loading guests...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="maybe">Maybe</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Guest</Button>
      </div>

      {showForm && (
        <GuestForm
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((guest) => (
          <GuestCard key={guest.id} guest={guest} />
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || statusFilter !== "all"
            ? "No guests match your filters"
            : "No guests added yet. Add your first guest to get started!"}
        </div>
      )}
    </div>
  );
}
