import fs from 'fs';
import path from 'path';

const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '';

const ITEMS = [
  { id: 'rice', name: '秋田県産 あきたこまち 無洗米 15kg', itemCode: 'f434477-mifune:10000001', fallbackKeyword: 'ふるさと納税 無洗米 15kg', price: 15000, savings: 13000, image: 'https://thumbnail.image.rakuten.co.jp/@0_mall/f052043-noshiro/cabinet/10129759/10636254/imgrc0119253457.jpg' },
  { id: 'tp', name: 'エリエール トイレットティシュー ダブル 72ロール', itemCode: 'f222101-fuji:10000451', fallbackKeyword: 'ふるさと納税 トイレットペーパー エリエール', price: 11000, savings: 4500, image: 'https://thumbnail.image.rakuten.co.jp/@0_mall/f222101-fuji/cabinet/10000451.jpg' }
];

async function fetchData() {
  const dataMap: Record<string, any> = {};
  for (const item of ITEMS) {
    const fallbackUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(item.fallbackKeyword)}/`;
    let finalUrl = fallbackUrl;

    if (APP_ID && ACCESS_KEY) {
      const url = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";
      const params = new URLSearchParams({
        applicationId: APP_ID,
        accessKey: ACCESS_KEY,
        affiliateId: AFFILIATE_ID,
        itemCode: item.itemCode
      });
      try {
        const res = await fetch(`${url}?${params.toString()}`);
        if (res.ok) {
          const data = await res.json() as any;
          if (data.Items && data.Items.length > 0) finalUrl = data.Items[0].Item.affiliateUrl;
        }
      } catch (e) { console.error(`Failed to fetch ${item.id}`, e); }
    }
    dataMap[item.id] = { ...item, dynamicUrl: finalUrl };
    await new Promise(r => setTimeout(r, 200)); // Rate limit buffer
  }

  const dir = path.join(process.cwd(), 'src/data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'rakutenItems.json'), JSON.stringify(dataMap, null, 2));
  console.log("✅ Rakuten Data fetched and saved statically.");
}
fetchData();
