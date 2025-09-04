"use client";

import { useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ChecklistList, ChecklistStats, ChecklistForm } from "./components";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { useChecklist } from "@/hooks/useChecklist";
import { ChecklistItem } from "@/types/checklist";

export default function ChecklistPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    items,
    loading,
    error,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    getChecklistStats,
  } = useChecklist();

  const handleSaveItem = async (
    data: Omit<ChecklistItem, "id" | "event_id" | "created_at" | "updated_at">
  ) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateChecklistItem(editingItem.id, data);
        setEditingItem(null);
      } else {
        await addChecklistItem(data);
        setShowForm(false);
      }
    } catch (error) {
      console.error("Failed to save checklist item:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: ChecklistItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteChecklistItem(id);
    } catch (error) {
      console.error("Failed to delete checklist item:", error);
    }
  };

  const handleToggleItem = async (id: string) => {
    try {
      await toggleChecklistItem(id);
    } catch (error) {
      console.error("Failed to toggle checklist item:", error);
    }
  };

  const stats = getChecklistStats();

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">
              Wedding Checklist
            </h1>
            <p className="text-gray-600 mt-1">
              Stay organized with your wedding planning tasks and deadlines
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Add Task
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <Icon
                name="AlertTriangle"
                size="sm"
                className="text-red-500 mr-2"
              />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <ChecklistForm
            item={editingItem || undefined}
            onSave={handleSaveItem}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        )}

        {/* Stats */}
        <Suspense fallback={<Skeleton className="h-32" />}>
          <ChecklistStats stats={stats} />
        </Suspense>

        {/* Checklist List */}
        <Suspense fallback={<Skeleton className="h-96" />}>
          <ChecklistList
            items={items}
            loading={loading}
            onToggle={handleToggleItem}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        </Suspense>

        {/* Quick Tips */}
        {items.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Icon
                name="Lightbulb"
                size="sm"
                className="text-blue-500 mt-0.5"
              />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Getting Started with Your Wedding Checklist
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Add tasks with clear titles and descriptions</li>
                  <li>• Set due dates to stay on track with your timeline</li>
                  <li>• Mark tasks as complete as you finish them</li>
                  <li>
                    • Use the filters to focus on overdue or upcoming tasks
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}
