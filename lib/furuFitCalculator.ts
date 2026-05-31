/**
 * lib/furuFitCalculator.ts — Core business logic
 * Antigravity Rule: NO throw. All failures return Result<T>.
 * Spec: FURUFIT-2026-001
 */
import type { Result, UserInput, MonthlyStock, FuruFitPlan, FamilySize } from './types';

const CONSUMPTION_LABEL = {
  low:    { rice: 1,   tp: 1,   water: 1 },
  medium: { rice: 2,   tp: 2,   water: 2 },
  high:   { rice: 3,   tp: 3,   water: 3 },
} as const;

// Cost per item unit (JPY) — used to cap how many units fit in budget
const ITEM_COST = { rice: 2500, toiletPaper: 1500, water: 800 } as const;

// Max needs per family size (annual purchase frequency)
const MAX_NEEDS: Record<FamilySize, { rice: number; toiletPaper: number; water: number }> = {
  1: { rice: 3,  toiletPaper: 2,  water: 4  },
  2: { rice: 5,  toiletPaper: 3,  water: 6  },
  3: { rice: 7,  toiletPaper: 5,  water: 8  },
  4: { rice: 10, toiletPaper: 7,  water: 10 },
};

/**
 * Step A: Derive total annual Furusato Nozei budget from income.
 * Rules:
 *   < 200万  → ¥20,000
 *   200–400万 → ¥40,000
 *   400–600万 → ¥60,000
 *   600–800万 → ¥80,000
 *   800万以上  → ¥96,000 (Furusato Nozei upper bound)
 */
function deriveBudget(income: number): number {
  if (income < 2_000_000) return 20_000;
  if (income < 4_000_000) return 40_000;
  if (income < 6_000_000) return 60_000;
  if (income < 8_000_000) return 80_000;
  return 96_000;
}

/**
 * Step B: Max needs per family size.
 */
function deriveMaxNeeds(familySize: FamilySize): { rice: number; toiletPaper: number; water: number } {
  return MAX_NEEDS[familySize];
}

/**
 * Step C: Generate 12-month stock status from consumption pace declarations.
 * "high" = more filled months, "low" = fewer.
 * We treat the pace as a frequency multiplier over the 12-month window.
 */
function buildMonthlyStocks(
  input: UserInput
): MonthlyStock[] {
  const riceRate   = CONSUMPTION_LABEL[input.riceConsumption].rice;
  const tpRate    = CONSUMPTION_LABEL[input.toiletPaperUsage].tp;
  const waterRate = CONSUMPTION_LABEL[input.waterUsage].water;

  // Map rate to a boolean fill probability per month.
  // rate=1 → rarely fill, rate=3 → mostly fill
  // We build a 12-slot array, cycling through the rate pattern.
  const slots: MonthlyStock[] = [];
  for (let m = 1; m <= 12; m++) {
    // Pattern repeats every 3 months
    const phase = ((m - 1) % 3);
    slots.push({
      month: m,
      rice:         phase < riceRate,
      toiletPaper:  phase < tpRate,
      water:        phase < waterRate,
    });
  }
  return slots;
}

/**
 * Step D: Evenly distribute item purchases across empty slots,
 * constrained by totalBudget and maxNeeds.
 */
function distributeItems(
  stocks: MonthlyStock[],
  budget: number,
  maxNeeds: { rice: number; toiletPaper: number; water: number }
): { rice: number; toiletPaper: number; water: number } {
  let remaining = budget;

  const distribute = (label: string, cost: number, max: number): number => {
    const affordable = Math.floor(remaining / cost);
    const count = Math.min(affordable, max);
    remaining -= count * cost;
    return count;
  };

  const rice         = distribute('rice',         ITEM_COST.rice,        maxNeeds.rice);
  const toiletPaper = distribute('toiletPaper',  ITEM_COST.toiletPaper, maxNeeds.toiletPaper);
  const water      = distribute('water',        ITEM_COST.water,       maxNeeds.water);

  // Budget safety check — never go negative
  if (remaining < 0) remaining = 0;

  return { rice, toiletPaper, water };
}

/**
 * Main entry point. Validates input, runs steps A–D.
 * Returns Result<never> on failure.
 */
export function calculateFuruFitPlan(input: UserInput): Result<FuruFitPlan> {
  // ── Validation ───────────────────────────────────────────────────────────
  if (!Number.isFinite(input.income) || input.income < 0) {
    return { ok: false, error: 'income must be a non-negative number.' };
  }
  if (![1, 2, 3, 4].includes(input.familySize)) {
    return { ok: false, error: `familySize must be 1–4, got ${input.familySize}.` };
  }
  const paces = new Set(['low', 'medium', 'high']);
  if (!paces.has(input.riceConsumption) || !paces.has(input.toiletPaperUsage) || !paces.has(input.waterUsage)) {
    return { ok: false, error: 'Consumption paces must be low/medium/high.' };
  }

  // ── Step A: Derive budget ─────────────────────────────────────────────────
  const totalBudget = deriveBudget(input.income);

  // ── Step B: Max needs ─────────────────────────────────────────────────────
  const maxNeeds = deriveMaxNeeds(input.familySize as FamilySize);

  // ── Step C: Build monthly stock grid ───────────────────────────────────────
  const monthlyStocks = buildMonthlyStocks(input);

  // ── Step D: Distribute items into budget ───────────────────────────────────
  const itemCounts = distributeItems(monthlyStocks, totalBudget, maxNeeds);

  // ── Compute fill rate ──────────────────────────────────────────────────────
  const totalSlots = 12 * 3; // 12 months × 3 item types
  const filledSlots = monthlyStocks.reduce((acc, s) => {
    return acc + (s.rice ? 1 : 0) + (s.toiletPaper ? 1 : 0) + (s.water ? 1 : 0);
  }, 0) + itemCounts.rice + itemCounts.toiletPaper + itemCounts.water;
  const fillRate = Math.min(100, Math.round((filledSlots / totalSlots) * 100));

  return {
    ok: true,
    value: {
      income: input.income,
      totalBudget,
      familySize: input.familySize,
      monthlyStocks,
      itemCounts,
      fillRate,
    },
  };
}