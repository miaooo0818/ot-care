/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KidCase, Goal, GoalTemplate } from '../types';
import { calculateTherapyPeriodEnd } from '../utils/periodUtils';
import { RefreshCw, Calendar, Award, ArrowRight, X, AlertCircle, Copy, Check, Plus, Trash2 } from 'lucide-react';
import AIGoalTargetGenerator from './AIGoalTargetGenerator';

interface RenewPeriodModalProps {
  kidCase: KidCase;
  goalTemplates: GoalTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmRenewal: (renewedCase: KidCase) => void;
  onSaveGoalTemplate?: (template: { category?: string; baseline: string; target: string }) => void;
}

export default function RenewPeriodModal({
  kidCase,
  goalTemplates,
  isOpen,
  onClose,
  onConfirmRenewal,
  onSaveGoalTemplate
}: RenewPeriodModalProps) {
  if (!isOpen) return null;

  // Calculate default next start month (e.g. 1 month after previous end month)
  const calculateDefaultNextStart = () => {
    if (!kidCase.therapyPeriodEnd) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const parts = kidCase.therapyPeriodEnd.split('-');
    if (parts.length < 2) return kidCase.therapyPeriodEnd;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const nextTotalMonth = month; // next month = (month - 1) + 1
    const nextYear = year + Math.floor(nextTotalMonth / 12);
    const nextMonth = (nextTotalMonth % 12) + 1;
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  };

  const [newPeriodStart, setNewPeriodStart] = useState<string>(calculateDefaultNextStart);
  const [selectedDuration, setSelectedDuration] = useState<3 | 6>(6);
  const [newPeriodEnd, setNewPeriodEnd] = useState<string>(() => 
    calculateTherapyPeriodEnd(calculateDefaultNextStart(), 6)
  );

  // New period goals with previous period reference
  interface NewGoalItem {
    id: string;
    refOldGoalId?: string;
    oldBaseline?: string;
    oldTarget?: string;
    baseline: string;
    target: string;
  }

  // Pre-populate with old goals as reference & editable baseline/target
  const [goals, setGoals] = useState<NewGoalItem[]>(() => {
    if (kidCase.goals.length === 0) {
      return [{
        id: `goal_${Date.now()}_1`,
        baseline: '',
        target: ''
      }];
    }
    return kidCase.goals.map((g, idx) => ({
      id: `goal_${Date.now()}_${idx + 1}`,
      refOldGoalId: g.id,
      oldBaseline: g.baseline,
      oldTarget: g.target,
      // Default: the old target becomes the baseline or starting point for the new period
      baseline: `已達到前期目標：${g.target}。現況...`,
      target: ''
    }));
  });

  const handleStartChange = (val: string) => {
    setNewPeriodStart(val);
    if (val) {
      setNewPeriodEnd(calculateTherapyPeriodEnd(val, selectedDuration));
    }
  };

  const handleDurationChange = (duration: 3 | 6) => {
    setSelectedDuration(duration);
    if (newPeriodStart) {
      setNewPeriodEnd(calculateTherapyPeriodEnd(newPeriodStart, duration));
    }
  };

  const handleAddGoal = () => {
    setGoals([
      ...goals,
      {
        id: `goal_${Date.now()}_${goals.length + 1}`,
        baseline: '',
        target: ''
      }
    ]);
  };

  const handleRemoveGoal = (index: number) => {
    if (goals.length <= 1) {
      alert('每期至少需要保留一項目標設定');
      return;
    }
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleGoalChange = (index: number, field: 'baseline' | 'target', value: string) => {
    const updated = [...goals];
    updated[index][field] = value;
    setGoals(updated);
  };

  const handleCopyOldTargetToBaseline = (index: number) => {
    const g = goals[index];
    if (g.oldTarget) {
      const updated = [...goals];
      updated[index].baseline = `延續前期成效（${g.oldTarget}），目前現況：`;
      setGoals(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodStart || !newPeriodEnd) {
      alert('請確認療育起始與訖期設定完整');
      return;
    }

    const finalGoals: Goal[] = goals.map(g => ({
      id: g.id,
      baseline: g.baseline.trim() || (g.oldTarget ? `延續前期目標：${g.oldTarget}` : '期初現況評估'),
      target: g.target.trim() || '新一期預期達成療育行為'
    }));

    // Update case with new therapy period & new goals
    const renewedCase: KidCase = {
      ...kidCase,
      therapyPeriodStart: newPeriodStart,
      therapyPeriodEnd: newPeriodEnd,
      goals: finalGoals
    };

    // 若有自訂輸入的新目標，自動建檔儲存至目標範本庫
    if (onSaveGoalTemplate) {
      finalGoals.forEach(g => {
        if (g.baseline.trim() && g.target.trim()) {
          onSaveGoalTemplate({
            category: '精細動作',
            baseline: g.baseline,
            target: g.target
          });
        }
      });
    }

    onConfirmRenewal(renewedCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-geometric-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-geometric-border animate-fade-in">
        
        {/* Header */}
        <div className="bg-geometric-black text-white px-6 py-4 flex items-center justify-between border-b border-geometric-dark shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <RefreshCw className="w-5 h-5 text-geometric-accent" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                建立新一期療育檔案 / 續期設定
              </h3>
              <p className="text-[11px] text-slate-300">
                個案：<span className="text-white font-bold">{kidCase.name}</span> (前期：{kidCase.therapyPeriodStart} ~ {kidCase.therapyPeriodEnd})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Notice Banner */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-geometric-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-display font-bold text-slate-900 text-xs block">
                已自動帶入舊有個案基本資料與前期目標參照
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                系統已為您保留 {kidCase.name} 的基本個人身分、負責治療師及前期療育目標。請設定新一期的起始月份與期程，並參照舊目標建立本期之新目標。
              </p>
            </div>
          </div>

          {/* Period Setting */}
          <div className="bg-slate-50 border border-geometric-border rounded-xl p-4 space-y-3">
            <h4 className="font-display font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-geometric-accent" />
              新一期療育期間設定
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start month */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  新一期起始月份 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="month"
                  required
                  value={newPeriodStart}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-geometric-border rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                />
              </div>

              {/* End month & quick duration selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  新一期療育期間(訖) <span className="text-rose-500">*</span>
                </label>
                
                {/* 3 or 6 months radio/pill selection */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleDurationChange(6)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-display font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedDuration === 6
                        ? 'bg-geometric-accent text-white border-geometric-accent shadow-xs'
                        : 'bg-white text-slate-700 border-geometric-border hover:bg-slate-100'
                    }`}
                  >
                    {selectedDuration === 6 && <Check className="w-3.5 h-3.5" />}
                    半年 (6個月)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationChange(3)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-display font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedDuration === 3
                        ? 'bg-geometric-accent text-white border-geometric-accent shadow-xs'
                        : 'bg-white text-slate-700 border-geometric-border hover:bg-slate-100'
                    }`}
                  >
                    {selectedDuration === 3 && <Check className="w-3.5 h-3.5" />}
                    三個月
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white border border-geometric-border px-3 py-2 rounded-lg text-slate-700 font-mono font-bold text-xs">
                  <span className="text-slate-400 font-sans text-[11px]">自動計算訖期：</span>
                  <span className="text-geometric-black font-extrabold">{newPeriodEnd || '請選擇起始日期'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Setup with Old Goals Reference */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                新一期療育目標設定 (參照前期成果)
              </h4>
              <button
                type="button"
                onClick={handleAddGoal}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-geometric-accent rounded-lg text-xs font-bold font-display transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                增加新目標
              </button>
            </div>

            <div className="space-y-4">
              {goals.map((g, idx) => (
                <div key={g.id} className="bg-slate-50 border border-geometric-border rounded-xl p-4 space-y-3">
                  
                  {/* Goal header */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-geometric-black text-white rounded font-display font-bold text-[10px]">
                      新目標 {idx + 1}
                    </span>
                    {goals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 transition cursor-pointer"
                        title="移除此項"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Old Goal Reference Card (if present) */}
                  {(g.oldBaseline || g.oldTarget) && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <span className="flex items-center gap-1">
                          <Copy className="w-3 h-3 text-amber-600" />
                          舊有前期目標對照 (目標 {idx + 1})：
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOldTargetToBaseline(idx)}
                          className="text-[10px] text-amber-700 hover:text-amber-900 underline cursor-pointer"
                        >
                          帶入前期目標至新起點
                        </button>
                      </div>
                      <p className="text-slate-600">
                        <strong className="text-slate-700">前期起點：</strong>{g.oldBaseline}
                      </p>
                      <p className="text-slate-600">
                        <strong className="text-slate-700">前期目標：</strong>{g.oldTarget}
                      </p>
                    </div>
                  )}

                  {/* Template selector for this goal */}
                  <div className="flex justify-end">
                    <select
                      onChange={(e) => {
                        const tplId = e.target.value;
                        if (!tplId) return;
                        const selectedTpl = goalTemplates.find(t => t.id === tplId);
                        if (selectedTpl) {
                          handleGoalChange(idx, 'baseline', selectedTpl.baseline);
                          handleGoalChange(idx, 'target', selectedTpl.target);
                        }
                        e.target.value = '';
                      }}
                      className="text-[10px] bg-white border border-emerald-300 text-emerald-800 px-2 py-1 rounded-md font-semibold cursor-pointer max-w-xs"
                    >
                      <option value="">🍀套用臨床目標範本...</option>
                      {goalTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.category}] {t.baseline.substring(0, 18)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* New Baseline Input */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      新一期能力行為現況描述 (起點) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="請描述兒童目前最新的能力現況或延續前期成果後的起點..."
                      value={g.baseline}
                      onChange={(e) => handleGoalChange(idx, 'baseline', e.target.value)}
                      className="w-full p-2.5 bg-white border border-geometric-border rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-medium text-slate-800"
                    />
                  </div>

                  {/* AI 智能量化目標生成工具 */}
                  <div className="pt-0.5">
                    <AIGoalTargetGenerator
                      baseline={g.baseline}
                      kidName={kidCase.name}
                      kidStage={kidCase.stage}
                      therapyDuration={selectedDuration === 6 ? '半年 (6個月)' : '三個月'}
                      currentTarget={g.target}
                      onApplyTarget={(targetText) => handleGoalChange(idx, 'target', targetText)}
                    />
                  </div>

                  {/* New Target Input */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      新一期預期達成之療育目標行為 (可點擊上方 AI 生成直接套用) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="請描述新一期（未來3或6個月）預期達成的具體可測量目標行為..."
                      value={g.target}
                      onChange={(e) => handleGoalChange(idx, 'target', e.target.value)}
                      className="w-full p-2.5 bg-white border border-geometric-border rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-medium text-slate-800"
                    />
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-geometric-border select-none font-display">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-geometric-border text-slate-700 rounded-lg hover:bg-slate-50 transition font-bold cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg transition font-bold cursor-pointer shadow-md shadow-geometric-accent/20"
            >
              <Check className="w-4 h-4" />
              確認建立新一期檔案
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
