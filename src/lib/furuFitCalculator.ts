// Jamstackビルド時に生成されたJSONを読み込む（存在しない場合のエラー回避策含む）
import itemsDataJson from '@/data/rakutenItems.json' 

const itemsData: Record<string, any> = itemsDataJson || {};

export type Result<T> = { success: true; data: T } | { success: false; error: string };

const AFFILIATE_ID = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || process.env.RAKUTEN_AFFILIATE_ID;

// アフィリエイトリンク自己生成（防衛ライン）
const generateAffiliateLink = (targetUrl: string, affiliateId: string | undefined): string => {
  if (!affiliateId) return targetUrl;
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(targetUrl)}`;
};

// ファクトチェック済みの現実的相場マスタ
const ITEMS: Record<string, any> = {
  rice: { 
    id: 'rice', 
    name: '【★ 王道・在庫安定】秋田県産 あきたこまち 無洗米 15kg', 
    price: 15000, 
    savingsMin: 4500, // 修正済
    savingsMax: 6000, // 修正済
    fallbackKeyword: 'ふるさと納税 無洗米 15kg'
  },
  tp: { 
    id: 'tp', 
    name: '【★ 王道・在庫安定】エリエール ダブル72R', 
    price: 11000, 
    savingsMin: 2500, // 修正済
    savingsMax: 3500, // 修正済
    fallbackKeyword: 'ふるさと納税 トイレットペーパー エリエール'
  }
};

const getDynamicUrl = (itemId: string) => {
  // 1. JSONにビルドされたURLがあれば優先
  if (itemsData[itemId] && itemsData[itemId].dynamicUrl) {
    return itemsData[itemId].dynamicUrl;
  }
  // 2. なければ代替検索URLをアフィリエイト化
  const rawSearchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(ITEMS[itemId].fallbackKeyword)}/`;
  return generateAffiliateLink(rawSearchUrl, AFFILIATE_ID);
};

const estimateBudget = (inc: number) => {
  if (inc >= 8000000) return 120000;
  if (inc >= 6000000) return 77000;
  if (inc >= 5000000) return 60000;
  if (inc >= 4000000) return 40000;
  if (inc >= 3000000) return 28000;
  return 15000; 
};

// リアルな年間消費上限（自炊・2人世帯等）
const REALISTIC_MAX_NEEDS: Record<number, Record<string, number>> = {
  1: { rice: 3, tp: 1 },
  2: { rice: 5, tp: 2 },
  3: { rice: 7, tp: 2 },
  4: { rice: 9, tp: 3 },
};

// メイン計算ロジック（UIが同期呼び出しする場合）
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
      inventory[type][month - 1] = false; // 0-indexed
    }
  };

  distributeEmpties('rice', purchaseCounts.rice);
  distributeEmpties('tp', purchaseCounts.tp);

  // 3. UI連携用のマスタデータ整形
  const itemsMap: Record<string, any> = {
    rice: { ...ITEMS.rice, dynamicUrl: getDynamicUrl('rice') },
    tp: { ...ITEMS.tp, dynamicUrl: getDynamicUrl('tp') }
  };

  // 現実的な相場に基づく最大節約額
  const totalSavingsMin = purchaseCounts.rice * ITEMS.rice.savingsMin + purchaseCounts.tp * ITEMS.tp.savingsMin;
  const totalSavingsMax = purchaseCounts.rice * ITEMS.rice.savingsMax + purchaseCounts.tp * ITEMS.tp.savingsMax;

  return {
    success: true,
    data: {
      totalBudget,
      usedBudget: 0, // 初期はまだ枠を埋めていないので0
      freeFrame: totalBudget, 
      inventory,
      itemsMap,
      totalSavingsMin,
      totalSavingsMax
    }
  };
};

// UIが非同期呼び出ししている場合のフォールバック互換レイヤー
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