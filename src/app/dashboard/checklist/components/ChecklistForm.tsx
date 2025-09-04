"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  ChecklistItem as ChecklistItemType,
  ChecklistCategory,
} from "@/types/checklist";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

interface ChecklistFormProps {
  item?: ChecklistItemType;
  onSave: (
    data: Omit<
      ChecklistItemType,
      "id" | "event_id" | "created_at" | "updated_at"
    >
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ChecklistForm({
  item,
  onSave,
  onCancel,
  isLoading = false,
}: ChecklistFormProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [category, setCategory] = useState<ChecklistCategory | "">(
    item?.category || ""
  );
  const [dueDate, setDueDate] = useState(
    item?.due_date ? format(new Date(item.due_date), "yyyy-MM-dd") : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!item;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      newErrors.dueDate = "Due date cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        due_date: dueDate || undefined,
        completed: item?.completed || false,
      });
    } catch (error) {
      console.error("Failed to save checklist item:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  useEffect(() => {
    // Focus the title input when component mounts
    const titleInput = document.getElementById("checklist-title");
    if (titleInput) {
      titleInput.focus();
    }
  }, []);

  return (
    <Card className="p-4 border-primary-200 bg-primary-50">
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="checklist-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title *
          </label>
          <Input
            id="checklist-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            className={errors.title ? "border-red-300" : ""}
          />
          {errors.title && (
            <p className="text-red-600 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="checklist-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="checklist-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this task..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="checklist-category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as ChecklistCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="ceremony">Ceremony</SelectItem>
              <SelectItem value="reception">Reception</SelectItem>
              <SelectItem value="attire">Attire</SelectItem>
              <SelectItem value="vendors">Vendors</SelectItem>
              <SelectItem value="stationery">Stationery</SelectItem>
              <SelectItem value="photography">Photography</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="accommodations">Accommodations</SelectItem>
              <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="checklist-due-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Due Date
          </label>
          <Input
            id="checklist-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            className={errors.dueDate ? "border-red-300" : ""}
          />
          {errors.dueDate && (
            <p className="text-red-600 text-xs mt-1">{errors.dueDate}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="min-w-[80px]"
          >
            {isLoading ? (
              <Icon name="Loader2" size="sm" className="animate-spin" />
            ) : isEditing ? (
              "Update"
            ) : (
              "Add Task"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
