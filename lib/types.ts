/**
 * lib/types.ts — Shared types across FuruFit
 * Antigravity Rule: All failures are Result<T>, zero throws.
 */

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type FamilySize = 1 | 2 | 3 | 4;

export interface UserInput {
  income: number;        // 年収 (e.g. 5000000)
  familySize: FamilySize;
  riceConsumption: 'low' | 'medium' | 'high';
  toiletPaperUsage: 'low' | 'medium' | 'high';
  waterUsage: 'low' | 'medium' | 'high';
}

export interface MonthlyStock {
  month: number;          // 1–12
  rice: boolean;          // true = 充足, false = 空き
  toiletPaper: boolean;
  water: boolean;
}

export interface RakutenItem {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl: string;
  itemCode: string;
  mediumImageUrls: string[];
}

export interface FuruFitPlan {
  income: number;
  totalBudget: number;     // derived from income
  familySize: FamilySize;
  monthlyStocks: MonthlyStock[];
  itemCounts: { rice: number; toiletPaper: number; water: number };
  fillRate: number;       // 0–100 %
}

export interface AppState {
  phase: 'onboarding' | 'loading' | 'stock_shelf' | 'summary';
  userInput?: UserInput;
  plan?: FuruFitPlan;
  modalMonth?: number;    // which month the half-modal is showing
  loadingMessage?: string;
}