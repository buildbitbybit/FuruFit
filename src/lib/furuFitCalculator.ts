import itemsData from '@/data/rakutenItems.json';

export type Result<T> = { success: true; data: T } | { success: false; error: string };

const estimateBudget = (inc: number) => {
  if (inc >= 8000000) return 120000;
  if (inc >= 6000000) return 77000;
  if (inc >= 5000000) return 60000;
  if (inc >= 4000000) return 40000;
  return 28000; 
};

const MAX_NEEDS: Record<number, Record<string, number>> = {
  1: { rice: 3, tp: 1 }, 2: { rice: 5, tp: 2 }, 3: { rice: 7, tp: 2 }, 4: { rice: 9, tp: 3 },
};

export const generateFuruFitPlan = (income: number, familySize: number, ricePace: string, tpPace: string): Result<any> => {
  const totalBudget = estimateBudget(income);
  const safeFamilySize = Math.max(1, Math.min(4, familySize));
  const needs = MAX_NEEDS[safeFamilySize];
  
  // Define Empty Slots based on pace
  const slots = {
    rice: new Array(12).fill(true),
    tp: new Array(12).fill(true)
  };
  const riceEmpties = ricePace === '少しずつ' ? [5] : ricePace === 'ふつう' ? [3, 7, 11] : [1, 3, 5, 7, 9, 11];
  const tpEmpties = tpPace === '1ヶ月以上' ? [5, 11] : tpPace === '2週間くらい' ? [2, 5, 8, 11] : [1, 3, 5, 7, 9, 11];
  riceEmpties.forEach(m => slots.rice[m] = false);
  tpEmpties.forEach(m => slots.tp[m] = false);

  // Return static plan structure
  return {
    success: true,
    data: {
      totalBudget,
      usedBudget: 0,
      inventory: slots,
      itemsMap: itemsData
    }
  };
};
