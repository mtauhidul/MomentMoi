export type ChecklistCategory =
  | "planning"
  | "ceremony"
  | "reception"
  | "attire"
  | "vendors"
  | "stationery"
  | "photography"
  | "transportation"
  | "accommodations"
  | "miscellaneous";

export interface ChecklistItem {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  category?: ChecklistCategory;
  due_date?: string; // Date string from database
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  items: Omit<ChecklistItem, 'id' | 'event_id' | 'created_at' | 'updated_at'>[];
}

export interface ChecklistStats {
  total: number;
  completed: number;
  overdue: number;
  upcoming: number;
  completionRate: number;
}

export interface ChecklistFilters {
  status: 'all' | 'completed' | 'pending' | 'overdue';
  search: string;
  sortBy: 'due_date' | 'title' | 'created_at';
  sortOrder: 'asc' | 'desc';
}
