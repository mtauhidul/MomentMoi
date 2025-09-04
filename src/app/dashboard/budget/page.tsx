"use client";

import { useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { BudgetList, BudgetStats, BudgetForm } from "./components";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { useBudget } from "@/hooks/useBudget";
import { BudgetItem, BudgetFormData } from "@/types/budget";

export default function BudgetPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    items,
    loading,
    error,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    getBudgetStats,
  } = useBudget();

  const handleSaveItem = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateBudgetItem(editingItem.id, data);
        setEditingItem(null);
      } else {
        await addBudgetItem(data);
        setShowForm(false);
      }
    } catch (error) {
      console.error("Failed to save budget item:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: BudgetItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget item?")) {
      return;
    }

    setDeletingItemId(id);
    try {
      await deleteBudgetItem(id);
    } catch (error) {
      console.error("Failed to delete budget item:", error);
    } finally {
      setDeletingItemId(null);
    }
  };

  const stats = getBudgetStats();

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">
              Budget Management
            </h1>
            <p className="text-gray-600 mt-1">
              Track your wedding expenses and stay within budget
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Add Budget Item
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
          <BudgetForm
            item={editingItem || undefined}
            onSave={handleSaveItem}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        )}

        {/* Stats */}
        <Suspense fallback={<Skeleton className="h-48" />}>
          <BudgetStats stats={stats} />
        </Suspense>

        {/* Budget List */}
        <Suspense fallback={<Skeleton className="h-96" />}>
          <BudgetList
            items={items}
            loading={loading}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            deletingItemId={deletingItemId || undefined}
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
                  Getting Started with Budget Management
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Start by adding all your expected wedding expenses</li>
                  <li>• Set realistic estimated costs for each category</li>
                  <li>
                    • Update actual costs as you pay vendors and receive
                    invoices
                  </li>
                  <li>
                    • Use the filters to track specific categories or payment
                    status
                  </li>
                  <li>• Monitor your overall budget progress regularly</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Budget Tips for Different Stages */}
        {items.length > 0 && stats.totalSpent === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Icon
                name="TrendingUp"
                size="sm"
                className="text-green-500 mt-0.5"
              />
              <div>
                <h3 className="text-sm font-medium text-green-900 mb-2">
                  Budget Planning Tips
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>
                    • Allocate 40-50% of your budget to venue and catering
                  </li>
                  <li>• Set aside 10-15% as a contingency fund</li>
                  <li>• Track small expenses that can add up quickly</li>
                  <li>• Get quotes from multiple vendors before booking</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}
