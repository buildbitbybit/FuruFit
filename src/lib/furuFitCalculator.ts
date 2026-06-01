import itemsData from '@/data/rakutenItems.json';

export type Result<T> = { success: true; data: T } | { success: false; error: string };

// 💡 1. 安全なアフィリエイトID取得
const AFFILIATE_ID = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || process.env.RAKUTEN_AFFILIATE_ID;

// 💡 2. 安全なリンク生成（未設定やダミー値なら直リンクを返し、エラーを完全防御）
const generateAffiliateLink = (targetUrl: string, affiliateId: string | undefined): string => {
  if (!affiliateId || affiliateId === "12345678.9abcdef0" || affiliateId.includes("あなたのアフィリエイトID")) {
    return targetUrl; 
  }
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(targetUrl)}`;
};

const estimateBudget = (inc: number) => {
  if (inc >= 8000000) return 120000;
  if (inc >= 6000000) return 77000;
  if (inc >= 5000000) return 60000;
  if (inc >= 4000000) return 40000;
  if (inc >= 3000000) return 28000;
  return 15000; 
};

// 現実的な年間消費上限（自炊・2人世帯等）
const MAX_NEEDS: Record<number, Record<string, number>> = {
  1: { rice: 3, tp: 1 }, 2: { rice: 5, tp: 2 }, 3: { rice: 7, tp: 2 }, 4: { rice: 9, tp: 3 },
};

// 計算用の単価マスタ
const ITEM_PRICES = { rice: 15000, tp: 11000 };

export const generateFuruFitPlan = (income: number, familySize: number, ricePace: string, tpPace: string): Result<any> => {
  const totalBudget = estimateBudget(income);
  const safeFamilySize = Math.max(1, Math.min(4, familySize));
  const maxNeeds = MAX_NEEDS[safeFamilySize];
  
  // 💡 3. 現実的な予算消費ループ
  const purchaseCounts = { rice: 0, tp: 0 };
  let currentBudget = totalBudget;
  let hasAdded = true;

  while (hasAdded) {
    hasAdded = false;
    if (purchaseCounts.rice < maxNeeds.rice && currentBudget >= ITEM_PRICES.rice) {
      purchaseCounts.rice++; currentBudget -= ITEM_PRICES.rice; hasAdded = true;
    }
    if (purchaseCounts.tp < maxNeeds.tp && currentBudget >= ITEM_PRICES.tp) {
      purchaseCounts.tp++; currentBudget -= ITEM_PRICES.tp; hasAdded = true;
    }
  }

  // 💡 4. 空き枠(隙間)の均等分配
  const slots = {
    rice: new Array(12).fill(true),
    tp: new Array(12).fill(true)
  };

  const distributeEmpties = (type: 'rice' | 'tp', count: number) => {
    if (count === 0) return;
    const interval = 12 / count;
    for (let i = 0; i < count; i++) {
      let month = Math.round((interval / 2) + (i * interval));
      if (month < 1) month = 1; if (month > 12) month = 12;
      slots[type][month - 1] = false; 
    }
  };

  distributeEmpties('rice', purchaseCounts.rice);
  distributeEmpties('tp', purchaseCounts.tp);

  // 💡 5. JSONマスタのURLを安全にアフィリエイト化
  const safeItemsMap = { ...(itemsData as any) };
  for (const key in safeItemsMap) {
    if (safeItemsMap[key].dynamicUrl) {
       const url = safeItemsMap[key].dynamicUrl;
       if (!url.includes('hb.afl.rakuten.co.jp')) {
          safeItemsMap[key].dynamicUrl = generateAffiliateLink(url, AFFILIATE_ID);
       }
    }
  }

  return {
    success: true,
    data: {
      totalBudget,
      usedBudget: 0,
      inventory: slots,
      itemsMap: safeItemsMap
    }
  };
};