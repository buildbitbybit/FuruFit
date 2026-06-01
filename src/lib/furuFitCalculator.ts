export type Result<T> = { success: true; data: T } | { success: false; error: string };

// 💡 確実・安全な固定マスタデータ（外部JSONへの依存を完全排除）
const ITEMS: Record<string, any> = {
  rice: { 
    id: 'rice', 
    name: '【★ 王道・在庫安定】秋田県産 あきたこまち 無洗米 15kg', 
    price: 15000, 
    savingsMin: 4500,
    savingsMax: 6000,
    // 100%確実に開く楽天の検索結果URL
    dynamicUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E7%84%A1%E6%B4%97%E7%B1%B3+15kg/',
    image: 'https://thumbnail.image.rakuten.co.jp/@0_mall/f052043-noshiro/cabinet/10129759/10636254/imgrc0119253457.jpg'
  },
  tp: { 
    id: 'tp', 
    name: '【★ 王道・在庫安定】エリエール ダブル72R', 
    price: 11000, 
    savingsMin: 2500,
    savingsMax: 3500,
    // 100%確実に開く楽天の検索結果URL
    dynamicUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E3%83%88%E3%82%A4%E3%83%AC%E3%83%83%E3%83%88%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC+%E3%82%A8%E3%83%AA%E3%82%A8%E3%83%BC%E3%83%AB/',
    image: 'https://thumbnail.image.rakuten.co.jp/@0_mall/f222101-fuji/cabinet/10000451.jpg'
  }
};

const estimateBudget = (inc: number) => {
  if (inc >= 8000000) return 120000;
  if (inc >= 6000000) return 77000;
  if (inc >= 5000000) return 60000;
  if (inc >= 4000000) return 40000;
  if (inc >= 3000000) return 28000;
  return 15000; 
};

// リアルな年間消費上限
const REALISTIC_MAX_NEEDS: Record<number, Record<string, number>> = {
  1: { rice: 3, tp: 1 },
  2: { rice: 5, tp: 2 },
  3: { rice: 7, tp: 2 },
  4: { rice: 9, tp: 3 },
};

// メイン計算ロジック
export const generateFuruFitPlan = (income: number, familySize: number, ricePace?: string, tpPace?: string): Result<any> => {
  const totalBudget = estimateBudget(income);
  const safeFamilySize = Math.max(1, Math.min(4, familySize));
  const maxNeeds = REALISTIC_MAX_NEEDS[safeFamilySize];

  // 1. 予算内で限界まで回数を確保
  const purchaseCounts = { rice: 0, tp: 0 };
  let currentBudget = totalBudget;
  let hasAdded = true;

  while (hasAdded) {
    hasAdded = false;
    if (purchaseCounts.rice < maxNeeds.rice && currentBudget >= ITEMS.rice.price) {
      purchaseCounts.rice++; currentBudget -= ITEMS.rice.price; hasAdded = true;
    }
    if (purchaseCounts.tp < maxNeeds.tp && currentBudget >= ITEMS.tp.price) {
      purchaseCounts.tp++; currentBudget -= ITEMS.tp.price; hasAdded = true;
    }
  }

  if (purchaseCounts.rice === 0 && purchaseCounts.tp === 0) {
    return { success: false, error: '寄付上限額の目安が低すぎるため、プランを生成できませんでした。' };
  }

  // 2. 確保した回数を「隙間 (false)」として12ヶ月に均等配置
  const inventory = {
    rice: new Array(12).fill(true),
    tp: new Array(12).fill(true)
  };

  const distributeEmpties = (type: 'rice' | 'tp', count: number) => {
    if (count === 0) return;
    const interval = 12 / count;
    for (let i = 0; i < count; i++) {
      let month = Math.round((interval / 2) + (i * interval));
      if (month < 1) month = 1; if (month > 12) month = 12;
      inventory[type][month - 1] = false; 
    }
  };

  distributeEmpties('rice', purchaseCounts.rice);
  distributeEmpties('tp', purchaseCounts.tp);

  // 現実的な相場に基づく最大節約額
  const totalSavingsMin = purchaseCounts.rice * ITEMS.rice.savingsMin + purchaseCounts.tp * ITEMS.tp.savingsMin;
  const totalSavingsMax = purchaseCounts.rice * ITEMS.rice.savingsMax + purchaseCounts.tp * ITEMS.tp.savingsMax;

  return {
    success: true,
    data: {
      totalBudget,
      usedBudget: 0, 
      freeFrame: totalBudget, 
      inventory,
      itemsMap: ITEMS, // 固定マスタをそのままUIへ渡す
      totalSavingsMin,
      totalSavingsMax
    }
  };
};

export const generateFuruFitPlanAsync = async (args: { income: number; familySize: number } | number, familySizeArg?: number): Promise<Result<any>> => {
  let income = 5000000;
  let familySize = 2;
  if (typeof args === 'number') {
    income = args;
    familySize = familySizeArg || 2;
  } else {
    income = args.income;
    familySize = args.familySize;
  }
  return generateFuruFitPlan(income, familySize);
};