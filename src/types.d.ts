export type BudgetEntry = {
  name: string;
  budget: number;
  expense: number;
};

export type ExpenseEntry = {
  id: number;
  timestamp: number;
  category: string;
  expense: number;
  who: string;
  description: string;
};
