export interface BudgetItem {
  id: string;
  event_id: string;
  category: BudgetCategory;
  name: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetStats {
  totalEstimated: number;
  totalActual: number;
  totalSpent: number;
  remainingBudget: number;
  percentageSpent: number;
  categoriesCount: number;
  completedItems: number;
  totalItems: number;
}

export interface BudgetFilters {
  category?: BudgetCategory;
  hasActualCost?: boolean;
  search?: string;
}

export interface BudgetFormData {
  category: BudgetCategory;
  name: string;
  estimated_cost: number | null;
  actual_cost: number | null;
}

export enum BudgetCategory {
  VENUE = "venue",
  CATERING = "catering",
  PHOTOGRAPHY = "photography",
  VIDEOGRAPHY = "videography",
  MUSIC = "music",
  FLORIST = "florist",
  CAKE = "cake",
  ATTIRE = "attire",
  RINGS = "rings",
  DECORATIONS = "decorations",
  INVITATIONS = "invitations",
  TRANSPORTATION = "transportation",
  ACCOMMODATION = "accommodation",
  GIFTS = "gifts",
  BEAUTY = "beauty",
  MISCELLANEOUS = "miscellaneous",
}

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  [BudgetCategory.VENUE]: "Venue & Ceremony",
  [BudgetCategory.CATERING]: "Catering & Food",
  [BudgetCategory.PHOTOGRAPHY]: "Photography",
  [BudgetCategory.VIDEOGRAPHY]: "Videography",
  [BudgetCategory.MUSIC]: "Music & Entertainment",
  [BudgetCategory.FLORIST]: "Florist & Flowers",
  [BudgetCategory.CAKE]: "Cake & Desserts",
  [BudgetCategory.ATTIRE]: "Wedding Attire",
  [BudgetCategory.RINGS]: "Rings & Jewelry",
  [BudgetCategory.DECORATIONS]: "Decorations",
  [BudgetCategory.INVITATIONS]: "Invitations & Stationery",
  [BudgetCategory.TRANSPORTATION]: "Transportation",
  [BudgetCategory.ACCOMMODATION]: "Accommodation",
  [BudgetCategory.GIFTS]: "Gifts & Favors",
  [BudgetCategory.BEAUTY]: "Beauty & Grooming",
  [BudgetCategory.MISCELLANEOUS]: "Miscellaneous",
};

export const BUDGET_CATEGORIES = Object.values(BudgetCategory);
