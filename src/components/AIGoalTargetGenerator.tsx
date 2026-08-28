/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Wand2, Check, ChevronDown, ChevronUp, Award, Info, AlertCircle, RefreshCw } from 'lucide-react';

export interface TargetOption {
  title: string;
  target: string;
  metric: string;
}

export interface AIGoalTargetResult {
  primaryTarget: string;
  targetOptions: TargetOption[];
  clinicalRationale: string;
}

interface AIGoalTargetGeneratorProps {
  baseline: string;
  kidName?: string;
  kidAge?: number;
  kidStage?: 'early' | 'weak';
  therapyDuration?: string;
  customFocus?: string;
  currentTarget?: string;
  onApplyTarget: (targetText: string) => void;
  className?: string;
  compact?: boolean;
}

export default function AIGoalTargetGenerator({
  baseline,
  kidName,
  kidAge,
  kidStage = 'early',
  therapyDuration = '半年 (6個月)',
  customFocus,
  currentTarget,
  onApplyTarget,
  className = '',
  compact = false,
}: AIGoalTargetGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIGoalTargetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!baseline || baseline.trim().length < 3) {
      setError('請先於上方輸入「期初能力現況描述 (起點)」（至少 3 個字），AI 才能精準對應並量化生成目標。');
      setIsExpanded(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/generate-goal-target', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          baseline: baseline.trim(),
          kidName: kidName || '個案兒童',
          kidAge,
          kidStage,
          therapyDuration,
          customFocus,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('伺服器通訊異常，請確認後端服務已啟動。');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'AI 目標生成失敗，請稍後重試。');
      }

      const generatedData: AIGoalTargetResult = data.data;
      setResult(generatedData);
      setSelectedIdx(0);
      setIsExpanded(true);

      // 自動將主要推薦目標帶入輸入框
      if (generatedData.primaryTarget) {
        onApplyTarget(generatedData.primaryTarget);
      }
    } catch (err: any) {
      console.error('AI generate goal target error:', err);
      setError(err?.message || '生成失敗，請確認網路連線與 Gemini API 設定。');
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (targetText: string, idx: number) => {
    setSelectedIdx(idx);
    onApplyTarget(targetText);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      
      {/* 觸發生成按鈕列 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGenerate}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-bold transition cursor-pointer shadow-xs ${
            isLoading
              ? 'bg-amber-100 text-amber-600 border border-amber-300 animate-pulse cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 border border-amber-500'
          }`}
          title="根據上方期初現況，自動透過 Gemini AI 生成量化、可測量的療育目標"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>AI 臨床量化目標推論中...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5 text-slate-950" />
              <span>✨ AI 智能生成量化目標</span>
            </>
          )}
        </button>

        {result && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
          >
            <span>{isExpanded ? '收合 AI 目標選項' : `展開 AI 建議選項 (${result.targetOptions?.length || 3}種)`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 錯誤提示 */}
      {error && isExpanded && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">提示：</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 生成結果展示與切換面版 */}
      {result && isExpanded && (
        <div className="p-3.5 bg-gradient-to-b from-amber-50/90 to-amber-100/40 border border-amber-200 rounded-xl space-y-3 animate-fade-in shadow-xs">
          
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="font-display font-black text-xs text-amber-950">
                Gemini AI 量化目標建議庫 (點擊直接套用)
              </span>
            </div>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
              SMART 臨床標準
            </span>
          </div>

          {/* 臨床理由 / 量化洞察 */}
          {result.clinicalRationale && (
            <div className="flex items-start gap-1.5 text-[11px] text-amber-900 bg-white/70 p-2 rounded-lg border border-amber-200/60 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-950">量化指標指引：</strong>
                {result.clinicalRationale}
              </div>
            </div>
          )}

          {/* 各項量化目標選項 */}
          <div className="space-y-2">
            {result.targetOptions && result.targetOptions.map((opt, idx) => {
              const isSelected = selectedIdx === idx || currentTarget === opt.target;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectOption(opt.target, idx)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer text-xs flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-white border-amber-500 ring-2 ring-amber-400/50 shadow-xs'
                      : 'bg-white/80 border-amber-200/70 hover:bg-white hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-[11px] text-amber-900 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {opt.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                      量化指標：{opt.metric}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium leading-relaxed pl-5 text-[11px]">
                    {opt.target}
                  </p>

                  <div className="flex justify-end pt-1">
                    <span className={`text-[10px] font-display font-bold flex items-center gap-1 ${
                      isSelected ? 'text-amber-700 font-black' : 'text-slate-400'
                    }`}>
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 text-amber-600" />
                          已套用至目標欄
                        </>
                      ) : (
                        '點擊採用此目標 ➔'
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-amber-800/80 text-right flex justify-between items-center pt-1">
            <span>* 採用後仍可依臨床現場需求直接手動微調文字</span>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              重新換一批建議
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
