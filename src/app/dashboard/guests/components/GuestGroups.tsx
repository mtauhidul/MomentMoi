"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useGuests } from "@/hooks/useGuests";
import { Plus, Edit2, Trash2, X, Check, Palette } from "lucide-react";

const PREDEFINED_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export function GuestGroups() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: PREDEFINED_COLORS[0],
    sortOrder: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    groups,
    guests,
    getGuestStats,
    createGroup,
    updateGroup,
    deleteGroup,
    groupsError,
  } = useGuests();

  const stats = getGuestStats();

  const getGuestCountByGroup = (groupName: string) => {
    return guests.filter((guest) => guest.group_category === groupName).length;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      color: PREDEFINED_COLORS[0],
      sortOrder: 0,
    });
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await createGroup({
        name: formData.name.trim(),
        color: formData.color,
        sort_order: Math.max(...groups.map((g) => g.sort_order), 0) + 1,
      });
      resetForm();
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateGroup(groupId, {
        name: formData.name.trim(),
        color: formData.color,
      });
      setEditingGroup(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setIsSubmitting(true);
    try {
      await deleteGroup(groupId);
      setDeletingGroup(null);
    } catch (error) {
      console.error("Failed to delete group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (group: any) => {
    setEditingGroup(group.id);
    setFormData({
      name: group.name,
      color: group.color,
      sortOrder: group.sort_order,
    });
  };

  const cancelEditing = () => {
    setEditingGroup(null);
    resetForm();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Guest Groups</h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Group
        </Button>
      </div>

      {/* Error Display */}
      {groupsError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{groupsError}</p>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateForm && (
        <Card className="mb-4 p-4 border-dashed border-2 border-gray-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Create New Group</h4>
              <Button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                size="sm"
                variant="ghost"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Group Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Family, Friends, Work"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                    style={{ backgroundColor: formData.color }}
                    onClick={() => setShowColorPicker("create")}
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => setShowColorPicker("create")}
                    size="sm"
                    variant="outline"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Color Picker */}
            {showColorPicker === "create" && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, color }));
                      setShowColorPicker(null);
                    }}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!formData.name.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Groups List */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedGroup === null ? "primary" : "outline"}
          onClick={() => setSelectedGroup(null)}
          size="sm"
        >
          All ({stats.total})
        </Button>

        {groups.map((group) => (
          <div key={group.id} className="relative group">
            {editingGroup === group.id ? (
              // Edit Form
              <Card className="absolute top-0 left-0 z-10 p-3 min-w-[200px] shadow-lg">
                <div className="space-y-3">
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Group name"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border cursor-pointer"
                      style={{ backgroundColor: formData.color }}
                      onClick={() => setShowColorPicker(group.id)}
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      placeholder="#3B82F6"
                      className="text-xs flex-1"
                    />
                  </div>

                  {showColorPicker === group.id && (
                    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded">
                      {PREDEFINED_COLORS.map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, color }));
                            setShowColorPicker(null);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-1">
                    <Button
                      onClick={cancelEditing}
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleUpdateGroup(group.id)}
                      disabled={!formData.name.trim() || isSubmitting}
                      size="sm"
                      className="h-7 px-2"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              // Group Button with Actions
              <>
                <Button
                  variant={selectedGroup === group.name ? "primary" : "outline"}
                  onClick={() => setSelectedGroup(group.name)}
                  size="sm"
                  style={{
                    borderColor: group.color,
                    color: selectedGroup === group.name ? "white" : group.color,
                    backgroundColor:
                      selectedGroup === group.name
                        ? group.color
                        : "transparent",
                  }}
                  className="relative pr-8"
                >
                  {group.name} ({getGuestCountByGroup(group.name)})
                  {/* Action buttons - visible on hover */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(group);
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 hover:bg-white/20"
                      style={{
                        color:
                          selectedGroup === group.name ? "white" : group.color,
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingGroup(group.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 hover:bg-white/20"
                      style={{
                        color:
                          selectedGroup === group.name ? "white" : group.color,
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {deletingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm mx-4">
            <h4 className="font-medium mb-2">Delete Group</h4>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this group? This action cannot be
              undone. Guests in this group will remain but won't be assigned to
              any group.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setDeletingGroup(null)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteGroup(deletingGroup)}
                disabled={isSubmitting}
                size="sm"
                variant="destructive"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
