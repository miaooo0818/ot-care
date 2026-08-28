/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KidCase, Goal } from '../types';
import { Sparkles, Bot, Check, ArrowRight, Loader2, AlertCircle, RefreshCw, X, Lightbulb, Wand2 } from 'lucide-react';

interface AIRecordGeneratorModalProps {
  kidCase: KidCase;
  date: string;
  scores: { [goalId: string]: number };
  currentSummary: string;
  currentHomeAdvice: string;
  caregiverStatus?: string;
  onApplyAll: (summary: string, homeAdvice: string) => void;
  onApplySummary: (summary: string) => void;
  onApplyHomeAdvice: (homeAdvice: string) => void;
  onClose: () => void;
}

export default function AIRecordGeneratorModal({
  kidCase,
  date,
  scores,
  currentSummary,
  currentHomeAdvice,
  caregiverStatus,
  onApplyAll,
  onApplySummary,
  onApplyHomeAdvice,
  onClose,
}: AIRecordGeneratorModalProps) {
  const [extraKeywords, setExtraKeywords] = useState('');
  const [activityNotes, setActivityNotes] = useState(currentSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成結果
  const [generatedResult, setGeneratedResult] = useState<{
    summary: string;
    homeActivityAdvice: string;
    clinicalInsight?: string;
  } | null>(null);

  // 整理目標與分數
  const goalsWithScores = kidCase.goals.map(g => ({
    baseline: g.baseline,
    target: g.target,
    score: scores[g.id] ?? 2,
  }));

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/generate-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          kidName: kidCase.name,
          kidStage: kidCase.stage,
          date,
          goals: goalsWithScores,
          activityNotes,
          caregiverStatus,
          extraKeywords,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        console.warn('Non-JSON response from server:', rawText);
        throw new Error('伺服器通訊異常，請確認後端服務已啟動。');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `生成失敗 (${response.status})，請稍後重試。`);
      }

      setGeneratedResult(data.data);
    } catch (err: any) {
      console.error('AI generate error:', err);
      setError(err.message || '生成過程發生錯誤，請重試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                  Gemini AI 智能生成臨床紀錄
                </h3>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                根據『{kidCase.name}』當堂目標得分與臨床表現，自動生成合規精準的職能治療紀錄
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* 當前評分與目標快速檢視 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                AI 參考之當堂評估目標與得分 ({goalsWithScores.length} 項)
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {kidCase.stage === 'early' ? '學齡前早療' : '國小學齡弱療'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {kidCase.goals.map((g, idx) => {
                const score = scores[g.id] ?? 2;
                return (
                  <div key={g.id} className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-xs flex justify-between items-center">
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-700 mr-1.5">#{idx + 1}</span>
                      <span className="text-slate-600 truncate">{g.target}</span>
                    </div>
                    <span className={`shrink-0 font-bold px-2 py-0.5 rounded text-[11px] font-mono ${
                      score === 3 ? 'bg-purple-100 text-purple-800' :
                      score === 2 ? 'bg-emerald-100 text-emerald-800' :
                      score === 1 ? 'bg-amber-100 text-amber-800' :
                      score === 0 ? 'bg-slate-200 text-slate-700' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {score > 0 ? `+${score}` : score} 分
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 補充提示輸入區 (選填) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                當堂使用媒介 / 活動關鍵字 (選填)
              </label>
              <input
                type="text"
                value={activityNotes}
                onChange={e => setActivityNotes(e.target.value)}
                placeholder="例如：彈跳床、花生球、前三指小夾子、三角粗鉛筆..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                兒童當日狀況 / 需強調重點 (選填)
              </label>
              <input
                type="text"
                value={extraKeywords}
                onChange={e => setExtraKeywords(e.target.value)}
                placeholder="例如：初段易分心但換遊戲後高度專注、握筆死力已改善..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* 錯誤提示 */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold">生成失敗：</span> {error}
              </div>
            </div>
          )}

          {/* 生成控制按鈕 */}
          {!generatedResult && (
            <div className="pt-2 flex flex-col items-center justify-center text-center">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-60 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Gemini 正在分析目標並生成臨床紀錄...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>一鍵生成專業臨床紀錄與居家衛教</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                由 Google Gemini 3.7 Flash 提供臨床摘要推理，生成後可隨時微調或一鍵套入表單
              </p>
            </div>
          )}

          {/* 生成結果展示區 */}
          {generatedResult && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-950">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>AI 生成建議結果 (點擊可直接修改文字)</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  重新生成
                </button>
              </div>

              {/* 療育活動簡述 */}
              <div className="bg-indigo-50/40 border border-indigo-200/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <span>療育活動內容簡述</span>
                    <span className="text-[10px] text-indigo-500 font-mono">
                      ({generatedResult.summary.length} 字)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onApplySummary(generatedResult.summary);
                      onClose();
                    }}
                    className="text-[11px] bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-300 hover:border-indigo-600 px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    僅套用此項
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={generatedResult.summary}
                  onChange={e => setGeneratedResult({ ...generatedResult, summary: e.target.value })}
                  className="w-full text-xs font-medium p-2.5 bg-white border border-indigo-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
                />
              </div>

              {/* 居家活動建議 */}
              <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                    <span>給主要照顧者的居家活動建議</span>
                    <span className="text-[10px] text-emerald-600 font-mono">
                      ({generatedResult.homeActivityAdvice.length} 字)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyHomeAdvice(generatedResult.homeActivityAdvice);
                      onClose();
                    }}
                    className="text-[11px] bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    僅套用此項
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={generatedResult.homeActivityAdvice}
                  onChange={e => setGeneratedResult({ ...generatedResult, homeActivityAdvice: e.target.value })}
                  className="w-full text-xs font-medium p-2.5 bg-white border border-emerald-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed"
                />
              </div>

              {/* 臨床重點備忘 Insight */}
              {generatedResult.clinicalInsight && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">臨床洞察備忘：</span>
                    <span className="font-medium ml-1">{generatedResult.clinicalInsight}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 flex justify-between items-center border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            關閉
          </button>

          {generatedResult && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onApplyAll(generatedResult.summary, generatedResult.homeActivityAdvice);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                全部套用至表單
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
