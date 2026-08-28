/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QuickPhrase, DEFAULT_QUICK_PHRASES, QUICK_PHRASE_CATEGORIES } from '../quickPhrases';
import { 
  Sparkles, Search, Plus, Check, BookOpen, Activity, 
  Hand, PenTool, Brain, Home, MessageSquare, X, Filter, Tag
} from 'lucide-react';
import { KidStage } from '../types';

interface QuickPhraseSelectorProps {
  stage: KidStage;
  activeTargetField?: 'summary' | 'homeActivityAdvice' | 'caregiverFeedback';
  onSelectPhrase: (text: string, targetField: 'summary' | 'homeActivityAdvice' | 'caregiverFeedback') => void;
  onClose: () => void;
}

export default function QuickPhraseSelector({
  stage,
  activeTargetField = 'summary',
  onSelectPhrase,
  onClose
}: QuickPhraseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    activeTargetField === 'homeActivityAdvice' 
      ? 'home_advice' 
      : activeTargetField === 'caregiverFeedback'
        ? 'parent_feedback'
        : 'all'
  );
  const [targetField, setTargetField] = useState<'summary' | 'homeActivityAdvice' | 'caregiverFeedback'>(activeTargetField);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 自訂片語 (若 localStorage 有儲存則讀取，也可新增)
  const [phrases, setPhrases] = useState<QuickPhrase[]>(() => {
    const saved = localStorage.getItem('ot_custom_quick_phrases');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_QUICK_PHRASES, ...parsed];
      } catch (e) {
        return DEFAULT_QUICK_PHRASES;
      }
    }
    return DEFAULT_QUICK_PHRASES;
  });

  const [newPhraseTitle, setNewPhraseTitle] = useState('');
  const [newPhraseText, setNewPhraseText] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // 篩選詞彙
  const filteredPhrases = phrases.filter(p => {
    // 類別篩選
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }
    // 階段篩選
    if (p.stage && p.stage !== 'all' && p.stage !== stage) {
      // 若非全部且不是當前階段，仍然在搜尋時允許，否則篩除
      if (!searchQuery.trim()) {
        // 沒有在主動搜尋關鍵字時，優先顯示相符階段
        // 但若選定特定非 all 類別則放寬
      }
    }
    // 關鍵字搜尋
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchText = p.text.toLowerCase().includes(q);
      const matchTags = p.tags?.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchText || matchTags;
    }
    return true;
  });

  const handleInsert = (phrase: QuickPhrase) => {
    const finalTarget = phrase.targetField || targetField;
    onSelectPhrase(phrase.text, finalTarget);
    setCopiedId(phrase.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const handleSaveCustomPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhraseTitle.trim() || !newPhraseText.trim()) return;

    const newPhrase: QuickPhrase = {
      id: `custom-${Date.now()}`,
      category: (selectedCategory === 'all' ? 'sensory_gross' : selectedCategory) as any,
      targetField: targetField,
      stage: stage,
      title: newPhraseTitle.trim(),
      text: newPhraseText.trim(),
      tags: ['自訂詞彙']
    };

    const customSaved = localStorage.getItem('ot_custom_quick_phrases');
    const existingCustom = customSaved ? JSON.parse(customSaved) : [];
    const updatedCustom = [newPhrase, ...existingCustom];
    localStorage.setItem('ot_custom_quick_phrases', JSON.stringify(updatedCustom));

    setPhrases([newPhrase, ...phrases]);
    setNewPhraseTitle('');
    setNewPhraseText('');
    setIsAddingCustom(false);
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'sensory_gross': return <Activity className="w-3.5 h-3.5" />;
      case 'fine_motor': return <Hand className="w-3.5 h-3.5" />;
      case 'handwriting_visual': return <PenTool className="w-3.5 h-3.5" />;
      case 'attention_emotion': return <Brain className="w-3.5 h-3.5" />;
      case 'home_advice': return <Home className="w-3.5 h-3.5" />;
      case 'parent_feedback': return <MessageSquare className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-geometric-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl border border-geometric-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-geometric-black text-white px-5 py-3.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-geometric-accent/20 border border-geometric-accent/40 flex items-center justify-center text-geometric-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm sm:text-base text-white flex items-center gap-2">
                職能治療專業常用詞彙庫
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {stage === 'early' ? '學齡前早療推薦' : '國小弱療推薦'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                點擊任一片語即可即時插入至對應表單欄位，大幅縮短課後紀錄書寫時間
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜尋與目標欄位切換 */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* 關鍵字搜尋 */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋詞彙（例如：彈跳床、黏土、握筆、情緒、剪刀、生字...）"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-800"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 欲填入目標欄位選取 */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg shrink-0 text-xs">
              <span className="text-[11px] font-bold text-slate-500 pl-1.5">填入目標：</span>
              <button
                type="button"
                onClick={() => setTargetField('summary')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${targetField === 'summary' ? 'bg-geometric-accent text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                活動簡述
              </button>
              <button
                type="button"
                onClick={() => setTargetField('homeActivityAdvice')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${targetField === 'homeActivityAdvice' ? 'bg-geometric-accent text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                居家建議
              </button>
              <button
                type="button"
                onClick={() => setTargetField('caregiverFeedback')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${targetField === 'caregiverFeedback' ? 'bg-geometric-accent text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                家長回饋
              </button>
            </div>
          </div>

          {/* 類別分類標籤頁 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {QUICK_PHRASE_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 詞彙列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-100/50">
          {filteredPhrases.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs">找不到符合「{searchQuery}」的療育詞彙</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="text-xs text-geometric-accent font-bold underline cursor-pointer"
              >
                清除搜尋條件
              </button>
            </div>
          ) : (
            filteredPhrases.map((phrase) => {
              const isCopied = copiedId === phrase.id;
              return (
                <div
                  key={phrase.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-3.5 hover:border-geometric-accent/40 hover:shadow-xs transition group space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-xs text-slate-800">
                        {phrase.title}
                      </span>
                      {phrase.stage && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          phrase.stage === 'early' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                            : phrase.stage === 'weak'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {phrase.stage === 'early' ? '早療' : phrase.stage === 'weak' ? '弱療' : '通用'}
                        </span>
                      )}
                      {phrase.targetField && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded">
                          預設：{phrase.targetField === 'summary' ? '活動簡述' : phrase.targetField === 'homeActivityAdvice' ? '居家建議' : '家長回饋'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInsert(phrase)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-display flex items-center gap-1 transition cursor-pointer shrink-0 ${
                        isCopied
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-900 text-white hover:bg-geometric-accent'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          已加入！
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          加入欄位
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 select-all">
                    {phrase.text}
                  </p>

                  {phrase.tags && phrase.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {phrase.tags.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSearchQuery(t)}
                          className="text-[10px] px-1.5 py-0.2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition cursor-pointer"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 新增自訂常用詞彙表單 (收折) */}
        {isAddingCustom ? (
          <form onSubmit={handleSaveCustomPhrase} className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0 text-xs animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-geometric-accent" />
                新增自訂專屬常用詞彙
              </span>
              <button 
                type="button" 
                onClick={() => setIsAddingCustom(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="詞彙簡稱/主題（例如：大球俯臥推推樂）"
                value={newPhraseTitle}
                onChange={e => setNewPhraseTitle(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
              />
              <select
                value={targetField}
                onChange={e => setTargetField(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700"
              >
                <option value="summary">預設填入：活動內容簡述</option>
                <option value="homeActivityAdvice">預設填入：居家活動建議</option>
                <option value="caregiverFeedback">預設填入：家長回饋內容</option>
              </select>
            </div>
            <textarea
              required
              rows={2}
              placeholder="請輸入詞彙完整描述內容..."
              value={newPhraseText}
              onChange={e => setNewPhraseText(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded font-medium cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-geometric-accent text-white rounded font-bold cursor-pointer hover:bg-geometric-active"
              >
                儲存至個人詞彙庫
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 px-5 py-3 flex justify-between items-center border-t border-slate-200 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setIsAddingCustom(true)}
              className="text-geometric-accent hover:text-geometric-active font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              自訂新增我的常用詞彙
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-display font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              完成返回表單
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
