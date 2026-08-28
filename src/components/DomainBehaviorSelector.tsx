/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GoalTemplate } from '../types';
import { STANDARD_DOMAINS } from '../goalTemplates';
import { 
  Layers, Search, Check, BookmarkPlus, Sparkles, 
  ChevronDown, ChevronUp, Tag, Plus, CheckCircle2, BookmarkCheck
} from 'lucide-react';

interface DomainBehaviorSelectorProps {
  goalTemplates: GoalTemplate[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSelectTemplate: (template: GoalTemplate) => void;
  onSaveNewTemplate?: (template: { category: string; baseline: string; target: string }) => void;
  currentBaseline?: string;
  currentTarget?: string;
  className?: string;
}

export default function DomainBehaviorSelector({
  goalTemplates,
  selectedCategory,
  onSelectCategory,
  onSelectTemplate,
  onSaveNewTemplate,
  currentBaseline = '',
  currentTarget = '',
  className = '',
}: DomainBehaviorSelectorProps) {
  const [internalCategory, setInternalCategory] = useState<string>('精細動作');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customSaveCategory, setCustomSaveCategory] = useState('精細動作');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  const activeCategory = selectedCategory !== undefined ? selectedCategory : internalCategory;

  // 整理所有存在的領域（合併預設領域與使用者自訂領域）
  const allCategories = useMemo(() => {
    const categoriesSet = new Set<string>(STANDARD_DOMAINS);
    goalTemplates.forEach(t => {
      if (t.category && t.category.trim()) {
        categoriesSet.add(t.category.trim());
      }
    });
    return Array.from(categoriesSet);
  }, [goalTemplates]);

  // 依當前領域與搜尋字串過濾範本
  const filteredTemplates = useMemo(() => {
    return goalTemplates.filter(t => {
      const matchCategory = activeCategory === '全部' || !activeCategory || t.category === activeCategory;
      const matchSearch = !searchQuery.trim() || 
        t.baseline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [goalTemplates, activeCategory, searchQuery]);

  const handleCategoryChange = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBaseline.trim()) return;

    if (onSaveNewTemplate) {
      onSaveNewTemplate({
        category: customSaveCategory.trim() || activeCategory || '精細動作',
        baseline: currentBaseline.trim(),
        target: currentTarget.trim() || '依臨床量化目標達成',
      });
      setSavedSuccessMsg(true);
      setTimeout(() => {
        setSavedSuccessMsg(false);
        setIsSaveModalOpen(false);
      }, 1500);
    }
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-2.5 transition ${className}`}>
      
      {/* 頂部標題與折疊切換 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-display font-bold text-slate-800 text-xs">
          <Layers className="w-4 h-4 text-geometric-accent" />
          <span>領域行為表現範本庫</span>
          <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold">
            {goalTemplates.length} 項
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 若目前手動有輸入內容，提供一鍵存為範本 */}
          {currentBaseline.trim().length > 3 && (
            <button
              type="button"
              onClick={() => {
                setCustomSaveCategory(activeCategory !== '全部' ? activeCategory : '精細動作');
                setIsSaveModalOpen(!isSaveModalOpen);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition cursor-pointer shadow-2xs"
              title="將目前輸入的期初現況與目標行為建檔儲存為自訂範本，供之後重覆使用"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>將手動輸入建檔為新範本</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.8 rounded-md cursor-pointer transition shadow-2xs"
          >
            <span>{isExpanded ? '收合選單' : '展開領域選單'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 手動輸入存為新範本的即時快捷確認小窗 */}
      {isSaveModalOpen && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 animate-fade-in text-[11px]">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span className="flex items-center gap-1">
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
              確認將目前內容建檔為專用範本：
            </span>
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <div className="sm:col-span-1">
              <label className="block text-emerald-900 font-bold mb-0.5 text-[10px]">歸屬領域分類：</label>
              <select
                value={customSaveCategory}
                onChange={e => setCustomSaveCategory(e.target.value)}
                className="w-full text-xs p-1 bg-white border border-emerald-300 rounded font-semibold text-emerald-900 focus:outline-hidden"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <div className="flex-1 truncate text-slate-600 bg-white p-1 rounded border border-emerald-200">
                <span className="font-bold text-slate-800 mr-1">現況：</span>
                {currentBaseline}
              </div>
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shrink-0 transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                {savedSuccessMsg ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已建檔存入！
                  </>
                ) : (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    確認建檔儲存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 領域選擇器（第一層：領域標籤與下拉） */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-geometric-accent text-white text-[10px] flex items-center justify-center font-bold">1</span>
            選擇領域 (Domain)：
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            點選領域標籤立即切換下方對應行為
          </span>
        </div>

        {/* 橫向滑動/包覆領域 Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleCategoryChange('全部')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
              activeCategory === '全部'
                ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            全部領域 ({goalTemplates.length})
          </button>

          {allCategories.map(cat => {
            const count = goalTemplates.filter(t => t.category === cat).length;
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                  isSelected
                    ? 'bg-geometric-accent text-white border-geometric-accent shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-geometric-accent/40 hover:bg-indigo-50/50'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[9px] px-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 行為表現選擇器（第二層：選單與清單） */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 flex-wrap gap-1">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
            選擇對應的行為表現 (Behavior / Baseline)：
          </span>

          {/* 快速關鍵字過濾 */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="搜尋行為關鍵字..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
            />
          </div>
        </div>

        {/* 快速下拉選單 (精簡模式) */}
        <select
          onChange={(e) => {
            const tplId = e.target.value;
            if (!tplId) return;
            const found = goalTemplates.find(t => t.id === tplId);
            if (found) {
              onSelectTemplate(found);
            }
            e.target.value = '';
          }}
          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer hover:border-geometric-accent transition focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
        >
          <option value="">
            📋 點此下拉挑選【{activeCategory}】領域之具體行為表現範本 ({filteredTemplates.length} 項)...
          </option>
          {filteredTemplates.map(t => (
            <option key={t.id} value={t.id}>
              [{t.category}] {t.baseline}
            </option>
          ))}
        </select>

        {/* 若點擊「展開選單」時，提供直觀的卡片瀏覽列表 */}
        {isExpanded && (
          <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 shadow-inner">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-[11px]">
                無符合條件的範本，您可以直接手動輸入，輸入後點擊上方「建檔為新範本」加入！
              </div>
            ) : (
              filteredTemplates.map(t => {
                const isCurrentActive = currentBaseline === t.baseline;
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTemplate(t)}
                    className={`p-2 rounded-md transition cursor-pointer flex flex-col gap-0.5 ${
                      isCurrentActive
                        ? 'bg-indigo-50/80 border border-indigo-300'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-[11px] text-indigo-900 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        {t.category}
                      </span>
                      {isCurrentActive && (
                        <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> 目前套用中
                        </span>
                      )}
                    </div>
                    <div className="text-slate-800 font-medium text-xs leading-relaxed">
                      <span className="font-bold text-slate-900 mr-1">起點現況：</span>
                      {t.baseline}
                    </div>
                    {t.target && (
                      <div className="text-slate-500 text-[10px] truncate">
                        <span className="font-bold text-slate-600 mr-1">預設目標：</span>
                        {t.target}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

    </div>
  );
}
