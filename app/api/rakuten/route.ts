/**
 * app/api/rakuten/route.ts
 * Netlify serverless proxy — Rakuten Ichiba Item Search API v2026-04-01
 * Spec: FURUFIT-2026-001 §2.1 Step F
 * Antigravity Rule: NO throw. All failures return JSON { ok: false, error }.
 * Security: API keys are ONLY accessible via process.env (server-side only).
 */
import { NextRequest, NextResponse } from 'next/server';

const RAKUTEN_BASE    = 'https://openapi.rakuten.co.jp/';
const API_VERSION     = '2026-04-01';   // REQUIRED per FURUFIT-2026-001
const ENDPOINT        = `${RAKUTEN_BASE}services/api/IchibaItem/Search/${API_VERSION}`;

interface RakutenItemResult {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl: string;
  itemCode: string;
  mediumImageUrls: string[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const keyword      = searchParams.get('keyword')  ?? '';
  const genreId      = searchParams.get('genreId')  ?? '';
  const page         = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  // ── Input validation ──────────────────────────────────────────────────────
  if (!keyword.trim()) {
    return NextResponse.json({ ok: false, error: 'keyword is required.' }, { status: 400 });
  }

  // ── Credential check (server-side only) ───────────────────────────────────
  const appId       = process.env.RAKUTEN_APP_ID;
  const accessKey   = process.env.RAKUTEN_ACCESS_KEY;
  const affiliateId  = process.env.RAKUTEN_AFFILIATE_ID ?? '';

  if (!appId || !accessKey) {
    console.error('[rakuten] Missing env vars: RAKUTEN_APP_ID or RAKUTEN_ACCESS_KEY');
    return NextResponse.json(
      { ok: false, error: 'Server misconfiguration: Rakuten credentials not set.' },
      { status: 500 }
    );
  }

  // ── Build request params per API v2026-04-01 spec ────────────────────────
  const params = new URLSearchParams({
    applicationId: appId,
    accessKey:     accessKey,
    keyword,
    page:          String(page),
    hits:          '10',
    imageFlag:     '1',
    sort:          'standard',
  });
  if (genreId)  params.set('genreId', genreId);
  if (affiliateId) params.set('affiliateId', affiliateId);

  const apiUrl = `${ENDPOINT}?${params.toString()}`;

  // ── Fetch with timeout ─────────────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  controller.signal.addEventListener('abort', () => console.warn('[rakuten] Request aborted (timeout)'));

  try {
    const upstream = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      signal: controller.signal,
      next: { revalidate: 300 }, // cache 5 min
    });
    clearTimeout(timeoutId);

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error(`[rakuten] upstream ${upstream.status}:`, body.slice(0, 200));
      return NextResponse.json(
        { ok: false, error: `Rakuten API error: HTTP ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json() as Record<string, unknown>;

    // ── Transform to safe shape — strip raw keys, keep only needed fields ──
    const rawItems: unknown[] = (data?.Items as unknown[]) ?? [];

    const items: RakutenItemResult[] = rawItems
      .filter((raw): raw is Record<string, unknown> => raw != null && typeof raw === 'object')
      .map((raw) => {
        const item = raw.Item as Record<string, unknown>;
        return {
          itemName:       String(item?.itemName       ?? ''),
          itemPrice:      Number(item?.itemPrice      ?? 0),
          itemUrl:        String(item?.itemUrl        ?? ''),
          affiliateUrl:   String(item?.affiliateUrl   ?? item?.itemUrl ?? ''),
          itemCode:       String(item?.itemCode       ?? ''),
          mediumImageUrls: Array.isArray(item?.mediumImageUrls)
            ? (item.mediumImageUrls as string[]).slice(0, 2)
            : [],
        };
      });

    return NextResponse.json({ ok: true, value: { items, count: items.length } });
  } catch (e) {
    clearTimeout(timeoutId);
    const message = e instanceof Error ? e.message : String(e);
    console.error('[rakuten] fetch error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}