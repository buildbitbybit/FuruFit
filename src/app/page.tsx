'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Coins, 
  Users, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ExternalLink, 
  Info, 
  TrendingUp, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  Activity,
  Heart
} from 'lucide-react';
import { generateFuruFitPlan } from '@/lib/furuFitCalculator';

export default function FuruFit() {
  const [step, setStep] = useState<'onboarding' | 'loading' | 'stock_shelf' | 'summary'>('onboarding');
  const [income, setIncome] = useState<number>(5000000);
  const [familySize, setFamilySize] = useState<number>(2);
  const [ricePace, setRicePace] = useState<string>('ふつう');
  const [tpPace, setTpPace] = useState<string>('2週間くらい');
  const [plan, setPlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ type: string; index: number } | null>(null);
  const [loadingText, setLoadingText] = useState('シミュレーションエンジンを起動中...');

  // Simulate loading stages for rich visual experience
  useEffect(() => {
    if (step === 'loading') {
      const texts = [
        '世帯構成から年間インフラ必要量を算出中...',
        '楽天APIデータから最適な生活必需品をマッピング中...',
        '無駄のない「ふるさと納税備蓄スケジュール」を生成中...',
        'パーソナライズされたスマートストック棚を構築中...'
      ];
      let current = 0;
      const interval = setInterval(() => {
        if (current < texts.length) {
          setLoadingText(texts[current]);
          current++;
        } else {
          clearInterval(interval);
          const result = generateFuruFitPlan(income, familySize, ricePace, tpPace);
          if (result.success) {
            // Count initial used budget based on pre-stocked slots
            const initialPlan = result.data;
            let initialUsedBudget = 0;
            ['rice', 'tp'].forEach(type => {
              initialPlan.inventory[type].forEach((filled: boolean) => {
                if (filled) {
                  initialUsedBudget += initialPlan.itemsMap[type].price;
                }
              });
            });
            initialPlan.usedBudget = initialUsedBudget;
            setPlan(initialPlan);
            setStep('stock_shelf');
          }
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [step, income, familySize, ricePace, tpPace]);

  const handleCreateShelf = () => {
    setStep('loading');
  };

  const handleSlotClick = (type: string, index: number) => {
    setSelectedSlot({ type, index });
    setIsModalOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedSlot) return;
    const newPlan = { ...plan };
    newPlan.inventory[selectedSlot.type][selectedSlot.index] = true;
    newPlan.usedBudget += plan.itemsMap[selectedSlot.type].price;
    setPlan(newPlan);
    setIsModalOpen(false);
    
    // Auto check if all slots are filled to progress to summary
    const riceAll = newPlan.inventory.rice.every((v: boolean) => v);
    const tpAll = newPlan.inventory.tp.every((v: boolean) => v);
    if (riceAll && tpAll) {
      setTimeout(() => setStep('summary'), 800);
    }
  };

  const handleReset = () => {
    setStep('onboarding');
    setPlan(null);
    setSelectedSlot(null);
  };

  const estimateLimit = (inc: number) => {
    if (inc >= 8000000) return 120000;
    if (inc >= 6000000) return 77000;
    if (inc >= 5000000) return 60000;
    if (inc >= 4000000) return 40000;
    return 28000; 
  };

  // Calculate stats for display
  const totalTaxSavings = plan ? ['rice', 'tp'].reduce((acc, type) => {
    let count = 0;
    plan.inventory[type].forEach((filled: boolean) => {
      if (filled) count++;
    });
    return acc + (count * plan.itemsMap[type].savings);
  }, 0) : 0;

  const totalCo2Saved = plan ? ['rice', 'tp'].reduce((acc, type) => {
    let count = 0;
    plan.inventory[type].forEach((filled: boolean) => {
      if (filled) count++;
    });
    // Arbitrary fun stat: 1 delivery avoided = 1.2kg CO2 saved (by bundling)
    return acc + (count * 1.2);
  }, 0) : 0;

  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative z-10 overflow-hidden">
          {/* Header decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> FuruFit v1.0 Jamstack Edition
            </span>
            <h1 className="text-3.5xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              生活インフラ・ストック
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-md mx-auto">
              ふるさと納税の限度額を計算し、家庭に必要な「お米」と「トイレットペーパー」の最適な備蓄スケジュールを自動構築します。
            </p>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Step 1: Income Slider */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300 font-bold text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-indigo-400" /> 1. 目安年収（世帯合算可）
                </label>
                <span className="text-indigo-400 font-mono font-bold text-lg">
                  {(income / 10000).toLocaleString()}万円
                </span>
              </div>
              <input
                type="range"
                min="2000000"
                max="15000000"
                step="100000"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                <span>200万</span>
                <span>500万</span>
                <span>800万</span>
                <span>1200万</span>
                <span>1500万</span>
              </div>
              
              <div className="mt-4 flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 text-xs text-indigo-300">
                <Info className="w-4 h-4 shrink-0" />
                <span>ふるさと納税の概算寄付限度額: <strong className="font-bold text-indigo-400 text-sm">約 ¥{estimateLimit(income).toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Step 2: Family Size */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5">
              <label className="text-slate-300 font-bold text-sm flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-400" /> 2. 世帯人数
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFamilySize(size)}
                    className={`py-3 rounded-xl font-bold border transition-all text-sm flex flex-col items-center justify-center gap-1 ${
                      familySize === size 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span>{size}人</span>
                    <span className="text-[9px] font-normal opacity-60">
                      {size === 4 ? '4人以上' : size === 1 ? '単身' : `${size}人世帯`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3 & 4: Consumption Paces */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rice Pace */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5">
                <label className="text-slate-300 font-bold text-sm flex items-center gap-2 mb-3">
                  <span className="text-base">🌾</span> お米の消費ペース
                </label>
                <div className="space-y-2">
                  {['少しずつ', 'ふつう', 'たくさん'].map((pace) => (
                    <button
                      key={pace}
                      onClick={() => setRicePace(pace)}
                      className={`w-full py-2.5 px-4 rounded-xl text-left border transition-all text-xs font-semibold flex justify-between items-center ${
                        ricePace === pace 
                          ? 'bg-amber-500/10 border-amber-500/80 text-amber-400' 
                          : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span>{pace}</span>
                      <span className="text-[10px] font-normal opacity-60">
                        {pace === '少しずつ' ? '外食多め / 週に数回' : pace === 'ふつう' ? '毎日1食はお米' : '自炊中心 / 毎日2食以上'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toilet Paper Pace */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5">
                <label className="text-slate-300 font-bold text-sm flex items-center gap-2 mb-3">
                  <span className="text-base">🧻</span> ロールの消費ペース
                </label>
                <div className="space-y-2">
                  {['1ヶ月以上', '2週間くらい', '1週間くらい'].map((pace) => (
                    <button
                      key={pace}
                      onClick={() => setTpPace(pace)}
                      className={`w-full py-2.5 px-4 rounded-xl text-left border transition-all text-xs font-semibold flex justify-between items-center ${
                        tpPace === pace 
                          ? 'bg-rose-500/10 border-rose-500/80 text-rose-400' 
                          : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span>{pace}</span>
                      <span className="text-[10px] font-normal opacity-60">
                        {pace === '1ヶ月以上' ? '1パックで長持ち' : pace === '2週間くらい' ? '標準的な消費量' : 'ファミリー向け/消費早め'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button 
              onClick={handleCreateShelf} 
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 hover:from-indigo-600 hover:via-purple-600 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group text-sm md:text-base"
            >
              ストック棚を自動生成する <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="relative w-24 h-24 mb-8">
          {/* Animated Spinner with multiple orbits */}
          <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-purple-500 rounded-full animate-spin duration-1000" />
          <div className="absolute inset-3 border-4 border-emerald-500/10 rounded-full" />
          <div className="absolute inset-3 border-4 border-b-emerald-500 border-l-teal-500 rounded-full animate-spin-reverse duration-1500" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-3">
          ストック棚を構築中
        </h2>
        <p className="text-slate-400 text-xs md:text-sm animate-pulse font-medium max-w-xs text-center">
          {loadingText}
        </p>
      </div>
    );
  }

  if (step === 'stock_shelf') {
    const remainingBudget = plan.totalBudget - plan.usedBudget;
    const progress = Math.min(100, (plan.usedBudget / plan.totalBudget) * 100);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 px-4 pt-6 md:pt-10 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl py-4 px-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">FuruFit</h1>
                <p className="text-[10px] text-indigo-400 font-bold">ふるさと納税インフラ棚</p>
              </div>
            </div>
            <button 
              onClick={handleReset} 
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-all font-medium"
            >
              <RotateCcw className="w-3 h-3" /> 条件変更
            </button>
          </div>

          {/* Budget Progress Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1">ふるさと納税目安上限</p>
                <p className="text-xl md:text-2xl font-black text-slate-100">¥{plan.totalBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1">インフラ確保金額</p>
                <p className="text-xl md:text-2xl font-black text-indigo-400">¥{plan.usedBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1">実質負担軽減（節約額）</p>
                <p className="text-xl md:text-2xl font-black text-emerald-400 flex items-center gap-1">
                  ¥{totalTaxSavings.toLocaleString()}
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1">残りの自由枠予算</p>
                <p className={`text-xl md:text-2xl font-black ${remainingBudget < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  ¥{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold">
                <span>インフラ備蓄予算の消化率</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  インフラ確保金額が限度額に近いほど、日常の生活費支出（お米・紙類）をふるさと納税へ最適に置換できています。
                </span>
              </div>
            </div>
          </div>

          {/* Shelves Layout */}
          <div className="space-y-8">
            
            {/* Shelf 1: Rice */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-lg border border-amber-500/20">
                    🌾
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                      お米ストック棚
                    </h3>
                    <p className="text-xs text-slate-400">
                      世帯消費ペースに基づき、定期的な調達（寄付確保）が必要です。
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs flex justify-between items-center gap-4">
                  <span className="text-slate-400">1回分: <strong className="text-slate-200">15kg</strong></span>
                  <span className="w-px h-3 bg-slate-800" />
                  <span className="text-slate-400">寄付額: <strong className="text-amber-400">¥{plan.itemsMap.rice.price.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Wooden-like shelf design wrapper */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 md:p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {plan.inventory.rice.map((filled: boolean, i: number) => (
                    <button
                      key={i}
                      disabled={filled}
                      onClick={() => handleSlotClick('rice', i)}
                      className={`relative aspect-square rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300 group border ${
                        filled 
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 cursor-default' 
                          : 'bg-amber-500/5 border-amber-500/20 border-dashed text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/50 cursor-pointer animate-pulse-subtle'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 font-mono font-medium absolute top-1.5 left-2">
                        {i + 1}枠
                      </span>
                      {filled ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <span className="text-[9px] font-bold text-slate-400 tracking-wider">備蓄完了</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg opacity-40 group-hover:scale-110 transition-transform">🌾</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                            寄付確保
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
                {/* Horizontal wooden shelf indicator */}
                <div className="h-2 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 rounded-full mt-4 shadow-inner" />
              </div>
            </div>

            {/* Shelf 2: Toilet Paper */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-lg border border-rose-500/20">
                    🧻
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                      トイレットペーパー棚
                    </h3>
                    <p className="text-xs text-slate-400">
                      かさばる日用品こそ、ふるさと納税で自宅配送させるのがスマートです。
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs flex justify-between items-center gap-4">
                  <span className="text-slate-400">1回分: <strong className="text-slate-200">72ロール</strong></span>
                  <span className="w-px h-3 bg-slate-800" />
                  <span className="text-slate-400">寄付額: <strong className="text-rose-400">¥{plan.itemsMap.tp.price.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Wooden-like shelf design wrapper */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 md:p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {plan.inventory.tp.map((filled: boolean, i: number) => (
                    <button
                      key={i}
                      disabled={filled}
                      onClick={() => handleSlotClick('tp', i)}
                      className={`relative aspect-square rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300 group border ${
                        filled 
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 cursor-default' 
                          : 'bg-rose-500/5 border-rose-500/20 border-dashed text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 cursor-pointer animate-pulse-subtle'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 font-mono font-medium absolute top-1.5 left-2">
                        {i + 1}枠
                      </span>
                      {filled ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <span className="text-[9px] font-bold text-slate-400 tracking-wider">備蓄完了</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg opacity-40 group-hover:scale-110 transition-transform">🧻</span>
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                            寄付確保
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
                {/* Horizontal wooden shelf indicator */}
                <div className="h-2 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 rounded-full mt-4 shadow-inner" />
              </div>
            </div>

          </div>

          {/* Modal / Bottom Drawer for Slot details */}
          {isModalOpen && selectedSlot && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <div 
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-[2.5rem] rounded-b-xl shadow-2xl overflow-hidden relative transform transition-all duration-300"
                style={{ animation: 'slideUp 0.3s ease-out forwards' }}
              >
                {/* Visual Accent */}
                <div className={`h-1.5 w-full ${selectedSlot.type === 'rice' ? 'bg-amber-500' : 'bg-rose-500'}`} />

                {/* Close Button */}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition-colors border border-slate-700/50"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 md:p-8">
                  <div className="flex gap-4 items-start mb-6">
                    {/* Fallback to simple image container or Rakuten fetched thumbnail */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={plan.itemsMap[selectedSlot.type].image} 
                        alt={plan.itemsMap[selectedSlot.type].name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // simple placeholder
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-3xl absolute">{selectedSlot.type === 'rice' ? '🌾' : '🧻'}</span>
                    </div>
                    <div>
                      <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border mb-2 ${
                        selectedSlot.type === 'rice' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {selectedSlot.type === 'rice' ? 'お米ストック枠' : '日用品ストック枠'}
                      </span>
                      <h2 className="font-extrabold text-base md:text-lg text-slate-100 leading-tight">
                        {plan.itemsMap[selectedSlot.type].name}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        商品コード: {plan.itemsMap[selectedSlot.type].itemCode}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                      <p className="text-slate-500 text-[10px] font-bold">寄付金額</p>
                      <p className="text-lg font-black text-slate-100">¥{plan.itemsMap[selectedSlot.type].price.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                      <p className="text-emerald-500/70 text-[10px] font-bold">推定節約価値（所得税等）</p>
                      <p className="text-lg font-black text-emerald-400">¥{plan.itemsMap[selectedSlot.type].savings.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a 
                      href={plan.itemsMap[selectedSlot.type].dynamicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={handleAddToCart} 
                      className="flex items-center justify-center gap-2 w-full text-white font-extrabold py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.99] transition-all shadow-xl shadow-orange-500/10 border-b-[4px] border-orange-700 hover:border-orange-800"
                    >
                      <ShoppingCart className="w-5 h-5" /> 🛒 楽天で寄付・確保に進む <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                    
                    <p className="text-[10px] text-center text-slate-500">
                      ※ 楽天のページヘ遷移すると同時に、このシミュレータ上で「備蓄枠」が確保状態に更新されます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  if (step === 'summary') {
    const totalSpent = plan.usedBudget;
    const riceCount = plan.inventory.rice.filter((v: boolean) => v).length;
    const tpCount = plan.inventory.tp.filter((v: boolean) => v).length;
    const totalSavings = (riceCount * plan.itemsMap.rice.savings) + (tpCount * plan.itemsMap.tp.savings);
    const leftover = plan.totalBudget - totalSpent;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Confetti Orbit Effect */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative z-10 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-500" />
          
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-3xl mx-auto mb-6">
            🎉
          </div>

          <h1 className="text-2.5xl md:text-3.5xl font-black bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent tracking-tight mb-2">
            生活必需品のインフラ棚が完成！
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            年間の家庭用消耗品（お米・紙類）のベースライン確保計画が完了しました。税制メリットを最大限活かしたスマートな家計管理です。
          </p>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 mb-8 text-left space-y-4">
            <h3 className="font-extrabold text-sm text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-indigo-400" /> ストック確保実績
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 font-bold mb-1">🌾 お米合計確保量</p>
                <p className="text-lg font-black text-slate-100">{riceCount * 15} kg <span className="text-xs text-slate-500 font-normal">({riceCount}回分)</span></p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 font-bold mb-1">🧻 紙類合計確保量</p>
                <p className="text-lg font-black text-slate-100">{tpCount * 72} ロール <span className="text-xs text-slate-500 font-normal">({tpCount}回分)</span></p>
              </div>
            </div>

            <h3 className="font-extrabold text-sm text-slate-300 flex items-center gap-2 border-b border-slate-800 pt-4 pb-2">
              <Activity className="w-4 h-4 text-emerald-400" /> 家計セービング成果
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-[10px] font-bold">インフラ投下額</p>
                <p className="text-lg font-black text-indigo-400">¥{totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold">税控除等による節約額</p>
                <p className="text-lg font-black text-emerald-400">¥{totalSavings.toLocaleString()}</p>
              </div>
            </div>
            
            {leftover > 0 ? (
              <div className="mt-4 flex items-start gap-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-xs text-indigo-300">
                <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-200 mb-0.5">残り自由予算枠: ¥{leftover.toLocaleString()}</span>
                  <span>
                    この残予算は、お肉や魚、海鮮、果物などの「ご褒美返礼品」に贅沢に充てることができます。
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-200 mb-0.5">予算限度額をオーバーしました</span>
                  <span>
                    実質上限予算を超過している可能性があります。実際の寄付を行う際は再度上限金額をご確認ください。
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleReset} 
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> もう一度シミュレート
            </button>
            <a 
              href="https://event.rakuten.co.jp/furusato/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10"
            >
              <span>楽天ふるさと納税公式へ</span> <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
