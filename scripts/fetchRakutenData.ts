import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// ローカルテスト用
dotenv.config();

const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID;

if (!AFFILIATE_ID) {
  console.warn("⚠️ Warning: RAKUTEN_AFFILIATE_ID is not set in environment variables. Links will NOT generate revenue.");
}

const ITEMS = [
  { id: 'rice', name: '秋田県産 あきたこまち 無洗米 15kg', itemCode: 'f434477-mifune:10000001', fallbackKeyword: 'ふるさと納税 無洗米 15kg', price: 15000, savings: 13000, image: 'https://thumbnail.image.rakuten.co.jp/@0_mall/f052043-noshiro/cabinet/10129759/10636254/imgrc0119253457.jpg' },
  { id: 'tp', name: 'エリエール トイレットティシュー ダブル 72ロール', itemCode: 'f222101-fuji:10000451', fallbackKeyword: 'ふるさと納税 トイレットペーパー エリエール', price: 11000, savings: 4500, image: 'https://thumbnail.image.rakuten.co.jp/@0_mall/f222101-fuji/cabinet/10000451.jpg' }
];

// アフィリエイトリンク生成ラップ関数（通信失敗時の防衛ライン）
const generateAffiliateLink = (targetUrl: string, affiliateId: string | undefined): string => {
  if (!affiliateId) return targetUrl;
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(targetUrl)}`;
};

async function fetchData() {
  const dataMap: Record<string, any> = {};

  for (const item of ITEMS) {
    const rawSearchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(item.fallbackKeyword)}/`;
    // 💡 デフォルトを「アフィリエイト化された検索結果URL」に設定（収益ロス防止）
    let finalUrl = generateAffiliateLink(rawSearchUrl, AFFILIATE_ID);

    if (APP_ID && ACCESS_KEY) {
      const url = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";
      const params = new URLSearchParams({
        applicationId: APP_ID,
        accessKey: ACCESS_KEY,
        affiliateId: AFFILIATE_ID || '',
        itemCode: item.itemCode
      });
      
      try {
        // 💡 追加されたOrigin/Refererヘッダー（API制限回避）
        const res = await fetch(`${url}?${params.toString()}`, {
          headers: {
            'Origin': 'https://buildbitbybit.github.io',
            'Referer': 'https://buildbitbybit.github.io/FuruFit/'
          }
        });
        
        if (res.ok) {
          const data = await res.json() as any;
          if (data.Items && data.Items.length > 0) finalUrl = data.Items[0].Item.affiliateUrl;
        } else {
          console.warn(`[API Warn] ${item.id} returned status ${res.status}`);
        }
      } catch (e) { 
        console.error(`[API Error] Failed to fetch ${item.id}`, e); 
      }
    }
    dataMap[item.id] = { ...item, dynamicUrl: finalUrl };
    await new Promise(r => setTimeout(r, 200)); // Rate limit buffer
  }

  const dir = path.join(process.cwd(), 'src/data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'rakutenItems.json'), JSON.stringify(dataMap, null, 2));
  console.log("✅ Rakuten Data fetched and saved statically with Affiliate Links.");
}

fetchData();