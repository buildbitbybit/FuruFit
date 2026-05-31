'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ShoppingCart,
  ChevronRight, Loader2, CheckCircle2, AlertTriangle,
  Zap, Users, Star, ArrowRight, X, RefreshCw,
} from 'lucide-react';
import type { AppState, UserInput, FuruFitPlan, MonthlyStock, RakutenItem } from '@/lib/types';
import { calculateFuruFitPlan } from '@/lib/furuFitCalculator';

// ─── Constants ───────────────────────────────────────────────────────────────
const ITEM_LABELS = { rice: '米', toiletPaper: 'トイレットペーパー', water: '水' } as const;
const MONTHS = ['', '1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatYen(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`;
}

// ─── Phase: Onboarding ─────────────────────────────────────────────────────────
function OnboardingForm({
  onSubmit,
}: {
  onSubmit: (input: UserInput) => void;
}) {
  const [income, setIncome]         = useState('');
  const [familySize, setFamilySize] = useState<1|2|3|4>(2);
  const [rice, setRice]             = useState<'low'|'medium'|'high'>('medium');
  const [tp, setTp]                 = useState<'low'|'medium'|'high'>('medium');
  const [water, setWater]           = useState<'low'|'medium'|'high'>('medium');
  const [error, setError]           = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inc = parseInt(income.replace(/,/g, ''), 10);
    if (!Number.isFinite(inc) || inc < 0) {
      setError('年收入を入力してください（半角数字）');
      return;
    }
    setError('');
    onSubmit({ income: inc, familySize, riceConsumption: rice, toiletPaperUsage: tp, waterUsage: water });
  };

  const Paces = ({ value, onChange }: { value: 'low'|'medium'|'high'; onChange: (v:'low'|'medium'|'high')=>void }) => (
    <div className="flex gap-2 mt-1">
      {(['low','medium','high'] as const).map(p => (
        <button key={p} type="button"
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
            value === p
              ? p === 'low' ? 'border-green-500 bg-green-50 text-green-700'
              : p === 'medium' ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-red-500 bg-red-50 text-red-700'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
          }`}
        >{p === 'low' ? '少なめ' : p === 'medium' ? '普通' : '多め'}</button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-3">
            <Zap size={14} /> FuruFit AI
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            🌾 FuruFit 超市
          </h1>
          <p className="text-slate-500 text-sm">
            控除上限額を自動計算して、12ヶ月分の食料・水を均等配分
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-5">

          {/* Income */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              年収目安（万円）<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="500"
              value={income}
              onChange={e => setIncome(e.target.value.replace(/[^0-9]/g,''))}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            />
          </div>

          {/* Family size */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              世帯人数 <Users size={14} className="inline ml-1" />
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([1,2,3,4] as const).map(n => (
                <button key={n} type="button"
                  onClick={() => setFamilySize(n)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    familySize === n
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >{n}人</button>
              ))}
            </div>
          </div>

          {/* Consumption paces */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">消費ペース（各自申告）</p>
            {([
              { label: '🍚 米',      key: 'rice',          value: rice, onChange: setRice as (v:'low'|'medium'|'high')=>void },
              { label: '🧻 トイレットペーパー', key: 'tp', value: tp,   onChange: setTp as (v:'low'|'medium'|'high')=>void },
              { label: '💧 水',      key: 'water',          value: water, onChange: setWater as (v:'low'|'medium'|'high')=>void },
            ] as const).map(({ label, key, value, onChange }) => (
              <div key={key}>
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <Paces value={value} onChange={onChange} />
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <button type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
            ストック棚を作成する <ChevronRight size={18} />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          データは全てローカルで処理されます • 楽天API経由で検索
        </p>
      </div>
    </div>
  );
}

// ─── Phase: Loading ──────────────────────────────────────────────────────────
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-orange-400 animate-spin" />
        <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-xl animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-white text-lg font-semibold">{message}</p>
        <p className="text-slate-400 text-sm mt-1">計算中… しばらくお待ちください</p>
      </div>
      <div className="flex items-center gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Half-Modal with 3D Cart Button ───────────────────────────────────────────
function HalfModal({
  month,
  stock,
  onClose,
}: {
  month: number;
  stock: MonthlyStock;
  onClose: () => void;
}) {
  const [items, setItems]           = useState<RakutenItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [filledType, setFilledType] = useState<string | null>(null);
  const cartRef                     = useRef<HTMLButtonElement>(null);

  // 3D tilt effect for the cart button
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -12;
    btn.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = '';
  };

  const fetchItems = useCallback(async (type: 'rice' | 'toiletPaper' | 'water') => {
    const keywords: Record<string, string> = {
      rice:         '宮崎県産 米 5kg',
      toiletPaper:  'トイレットペーパー 詰替 12ロール',
      water:        'ミネラルウォーター 12L',
    };
    setLoading(true);
    setError('');
    try {
      // Sequential fetch with 250ms delay — per spec to avoid 429
      await new Promise(r => setTimeout(r, 250));
      const res = await fetch(`/api/rakuten?keyword=${encodeURIComponent(keywords[type])}`);
      const data = await res.json() as { ok: boolean; value?: { items: RakutenItem[] }; error?: string };
      if (!data.ok || !data.value) throw new Error(data.error ?? 'Failed to fetch');
      setItems(data.value.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fillSlot = (type: string) => {
    setFilledType(type);
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-0 animate-slideUp">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400">空き枠を補充</p>
            <h2 className="text-lg font-bold text-slate-800">{MONTHS[month]} の棚が空いています</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Item type picker */}
        {!filledType && (
          <div className="px-5 py-4 grid grid-cols-3 gap-3">
            {(['rice','toiletPaper','water'] as const).map((type, i) => (
              !stock[type] && (
                <button key={type} onClick={() => fetchItems(type)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition">
                  <span className="text-2xl">{['🍚','🧻','💧'][i]}</span>
                  <span className="text-xs font-medium text-slate-600">{ITEM_LABELS[type]}</span>
                  <span className="text-xs text-slate-400">タップして検索</span>
                </button>
              )
            ))}
          </div>
        )}

        {/* Items list */}
        {items.length > 0 && (
          <div className="px-5 pb-4 max-h-64 overflow-y-auto space-y-2">
            <p className="text-xs text-slate-400 font-medium">検索結果</p>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                {item.mediumImageUrls[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.mediumImageUrls[0]} alt={item.itemName}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-200" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.itemName}</p>
                  <p className="text-orange-600 font-bold">{formatYen(item.itemPrice)}</p>
                </div>
                <a href={item.itemUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium shrink-0">
                  詳細 →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="px-5 pb-4 flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> 楽天市場で商品検索中…
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="px-5 pb-4 flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* 3D Cart Button */}
        {!filledType && (
          <div className="px-5 pb-6 pt-2">
            <button
              ref={cartRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                const types: Array<'rice'|'toiletPaper'|'water'> = ['rice','toiletPaper','water'];
                const first = types.find(t => !stock[t]);
                if (first) fillSlot(first);
              }}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg
                bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400
                shadow-[0_8px_0_#c2410c,0_12px_24px_rgba(249,115,22,0.35)]
                active:shadow-[0_2px_0_#c2410c,0_4px_12px_rgba(249,115,22,0.25)]
                active:translate-y-2 transition-all cursor-pointer flex items-center justify-center gap-3
                preserve-3d"
              style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s ease, box-shadow 0.1s ease' }}
            >
              <ShoppingCart size={22} />
              楽天で今すぐ確保
              <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                送料かかる前に！
              </div>
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              ※ クリックで最安値商品一覧へ遷移します
            </p>
          </div>
        )}

        {/* Success state */}
        {filledType && (
          <div className="px-5 pb-6 flex flex-col items-center gap-3 py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <p className="text-lg font-bold text-slate-800">充足完了！ 🎉</p>
            <p className="text-slate-500 text-sm">{ITEM_LABELS[filledType as keyof typeof ITEM_LABELS]}を棚に追加しました</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phase: Stock Shelf ────────────────────────────────────────────────────────
function StockShelfView({
  plan,
  onBack,
}: {
  plan: FuruFitPlan;
  onBack: () => void;
}) {
  const [modalMonth, setModalMonth] = useState<number | null>(null);
  const stocks = plan.monthlyStocks;
  const emptyCount = stocks.filter(s => !s.rice || !s.toiletPaper || !s.water).length;
  const isComplete = emptyCount === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
              <ArrowRight size={18} className="rotate-180 text-slate-500" />
            </button>
            <div>
              <h1 className="font-bold text-slate-800 text-base">📦 FuruFit ストック棚</h1>
              <p className="text-xs text-slate-400">{MONTHS[1]}〜{MONTHS[12]}の配分状況</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-500">{plan.fillRate}%</div>
            <div className="text-xs text-slate-400">充足率</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Budget summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">年間予算（Furusato Nozei上限）</p>
            <p className="text-2xl font-bold text-slate-800">{formatYen(plan.totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">世帯</p>
            <p className="text-base font-semibold text-slate-700">{plan.familySize}人</p>
          </div>
        </div>

        {/* 12-Month Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {stocks.map(s => {
            const emptySlots = [s.rice ? null : 'rice', s.toiletPaper ? null : 'tp', s.water ? null : 'water']
              .filter(Boolean) as string[];

            return (
              <button key={s.month}
                onClick={() => emptySlots.length > 0 && setModalMonth(s.month)}
                className={`relative rounded-xl p-3 border-2 transition-all ${
                  emptySlots.length === 0
                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                    : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <p className="text-xs font-semibold text-slate-500 mb-2">{MONTHS[s.month]}</p>
                <div className="space-y-1">
                  {(['rice','toiletPaper','water'] as const).map((type, i) => {
                    const filled = s[type];
                    return (
                      <div key={type} className="flex items-center gap-1.5">
                        <span className="text-base">{['🍚','🧻','💧'][i]}</span>
                        {filled
                          ? <CheckCircle2 size={14} className="text-green-500" />
                          : <div className="w-3.5 h-3.5 rounded border-2 border-dashed border-slate-300" />
                        }
                      </div>
                    );
                  })}
                </div>
                {emptySlots.length > 0 && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-orange-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {emptySlots.length}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Item counts summary */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {(['rice','toiletPaper','water'] as const).map((type, i) => (
            <div key={type} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-2xl">{['🍚','🧻','💧'][i]}</p>
              <p className="text-xs text-slate-400 mt-1">{ITEM_LABELS[type]}</p>
              <p className="text-lg font-bold text-slate-800">{plan.itemCounts[type === 'toiletPaper' ? 'toiletPaper' : type]}個</p>
            </div>
          ))}
        </div>

        {/* Complete button */}
        {isComplete && (
          <button onClick={() => {}}  // Will transition to summary
            className="w-full mt-5 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
            <Star size={18} /> 完了レポートを見る
          </button>
        )}

        {/* Empty count alert */}
        {!isComplete && (
          <p className="text-center text-sm text-slate-400 mt-4">
            残り <strong className="text-orange-500">{emptyCount}</strong> 枠が空きです → タップして補充
          </p>
        )}
      </div>

      {/* Half-Modal */}
      {modalMonth != null && (
        <HalfModal
          month={modalMonth}
          stock={stocks[modalMonth - 1]}
          onClose={() => setModalMonth(null)}
        />
      )}
    </div>
  );
}

// ─── Phase: Summary ───────────────────────────────────────────────────────────
function SummaryView({ plan, onBack }: { plan: FuruFitPlan; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">🎉 FuruFit 完了!</h2>
          <p className="text-slate-400 mt-2">あなたの12ヶ月分の配分が確定しました</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-left space-y-3">
          {([
            { label: '年収',         value: `${(plan.income/10000).toFixed(0)}万円` },
            { label: '年間予算上限', value: formatYen(plan.totalBudget) },
            { label: '世帯人数',     value: `${plan.familySize}人` },
            { label: '充足率',       value: `${plan.fillRate}%` },
            { label: '米合計',      value: `${plan.itemCounts.rice}回分配分` },
            { label: 'トイレットペーパー合計', value: `${plan.itemCounts.toiletPaper}回分配分` },
            { label: '水合計',      value: `${plan.itemCounts.water}回分配分` },
          ] as const).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-slate-300">{label}</span>
              <span className="text-white font-semibold">{value}</span>
            </div>
          ))}
        </div>
        <button onClick={onBack}
          className="w-full border-2 border-white/30 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition">
          <RefreshCw size={16} className="inline mr-2" />
          もう一度シミュレーション
        </button>
      </div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [state, setState] = useState<AppState>({ phase: 'onboarding' });

  const handleOnboarding = useCallback((input: UserInput) => {
    // Transition to loading
    setState({ phase: 'loading', userInput: input, loadingMessage: '予算を計算中…' });

    // Simulate 1.2s loading per spec
    setTimeout(() => {
      const result = calculateFuruFitPlan(input);
      if (!result.ok) {
        setState({ phase: 'onboarding' });
        return;
      }
      setState({ phase: 'stock_shelf', userInput: input, plan: result.value });
    }, 1200);
  }, []);

  const handleBack = useCallback(() => {
    setState({ phase: 'onboarding' });
  }, []);

  if (state.phase === 'onboarding') {
    return <OnboardingForm onSubmit={handleOnboarding} />;
  }
  if (state.phase === 'loading') {
    return <LoadingScreen message={state.loadingMessage ?? '処理中…'} />;
  }
  if (state.phase === 'stock_shelf' && state.plan) {
    return <StockShelfView plan={state.plan} onBack={handleBack} />;
  }
  if (state.phase === 'summary' && state.plan) {
    return <SummaryView plan={state.plan} onBack={handleBack} />;
  }
  return null;
}