"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import {
  BudgetItem,
  BudgetFormData,
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
} from "@/types/budget";

const budgetFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Item name is required"),
  estimated_cost: z
    .number()
    .min(0, "Estimated cost must be positive")
    .nullable(),
  actual_cost: z.number().min(0, "Actual cost must be positive").nullable(),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  item?: BudgetItem;
  onSave: (data: BudgetFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BudgetForm({
  item,
  onSave,
  onCancel,
  isLoading = false,
}: BudgetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: item?.category || "",
      name: item?.name || "",
      estimated_cost: item?.estimated_cost || null,
      actual_cost: item?.actual_cost || null,
    },
  });

  const selectedCategory = watch("category");

  React.useEffect(() => {
    if (item) {
      reset({
        category: item.category,
        name: item.name,
        estimated_cost: item.estimated_cost,
        actual_cost: item.actual_cost,
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: BudgetFormValues) => {
    try {
      await onSave({
        category: data.category as any,
        name: data.name,
        estimated_cost: data.estimated_cost,
        actual_cost: data.actual_cost,
      });

      if (!item) {
        reset({
          category: "",
          name: "",
          estimated_cost: null,
          actual_cost: null,
        });
      }
    } catch (error) {
      console.error("Failed to save budget item:", error);
    }
  };

  const categoryOptions = BUDGET_CATEGORIES.map((category) => ({
    value: category,
    label: BUDGET_CATEGORY_LABELS[category],
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon
          name={item ? "Edit" : "Plus"}
          size="sm"
          className="text-primary-600"
        />
        <h3 className="text-lg font-semibold text-gray-900">
          {item ? "Edit Budget Item" : "Add Budget Item"}
        </h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <Select
              {...register("category")}
              options={categoryOptions}
              placeholder="Select a category"
              error={errors.category?.message}
              value={selectedCategory}
              onValueChange={(value) => setValue("category", value)}
            />
          </div>

          {/* Item Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <Input
              {...register("name")}
              placeholder="e.g., Wedding Venue, Photographer, Cake"
              error={errors.name?.message}
            />
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                {...register("estimated_cost", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-8"
                error={errors.estimated_cost?.message}
              />
            </div>
          </div>

          {/* Actual Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                {...register("actual_cost", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-8"
                error={errors.actual_cost?.message}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icon name="Loader2" size="sm" className="mr-2 animate-spin" />
                {item ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <Icon
                  name={item ? "Save" : "Plus"}
                  size="sm"
                  className="mr-2"
                />
                {item ? "Update Item" : "Add Item"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
