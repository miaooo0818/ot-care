/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { KidCase, LessonRecord, HomeActivityStatus, SCORE_OPTIONS, HOME_ACTIVITY_STATUS_DETAILS } from '../types';
import { Calendar, PenTool, CheckCircle, HelpCircle, Save, X, RotateCcw, User, Sparkles, BookOpen, Plus, Trash2, Clock, Wand2, Bot } from 'lucide-react';
import QuickPhraseSelector from './QuickPhraseSelector';
import AIRecordGeneratorModal from './AIRecordGeneratorModal';
import { DEFAULT_QUICK_PHRASES } from '../quickPhrases';

interface RecordFormProps {
  kidCase: KidCase;
  recordToEdit?: LessonRecord;
  onSave: (recordData: Omit<LessonRecord, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function RecordForm({ kidCase, recordToEdit, onSave, onClose }: RecordFormProps) {
  const draftStorageKey = `ot_record_draft_${kidCase.id}_${recordToEdit ? recordToEdit.id : 'new'}`;

  // 嘗試讀取本地草稿
  const savedDraft = React.useMemo(() => {
    try {
      const item = localStorage.getItem(draftStorageKey);
      if (item) return JSON.parse(item);
    } catch (e) {
      console.error('Failed to parse draft from localStorage:', e);
    }
    return null;
  }, [draftStorageKey]);

  // 欄位 State (若有暫存草稿則優先復原，若無則依序採用 recordToEdit 或預設值)
  const [date, setDate] = useState<string>(
    savedDraft?.date || recordToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [summary, setSummary] = useState<string>(
    savedDraft?.summary !== undefined ? savedDraft.summary : (recordToEdit?.summary || '')
  );
  const [scores, setScores] = useState<{ [goalId: string]: number }>(
    savedDraft?.scores || recordToEdit?.scores || 
    kidCase.goals.reduce((acc, g) => ({ ...acc, [g.id]: 2 }), {}) // 預設達到目標 2分
  );
  const [homeActivityAdvice, setHomeActivityAdvice] = useState<string>(
    savedDraft?.homeActivityAdvice !== undefined ? savedDraft.homeActivityAdvice : (recordToEdit?.homeActivityAdvice || '')
  );
  const [caregiverFeedback, setCaregiverFeedback] = useState<string>(
    savedDraft?.caregiverFeedback !== undefined ? savedDraft.caregiverFeedback : (recordToEdit?.caregiverFeedback || '')
  );
  const [caregiverStatus, setCaregiverStatus] = useState<HomeActivityStatus>(
    savedDraft?.caregiverStatus !== undefined ? savedDraft.caregiverStatus : (recordToEdit?.caregiverStatus || '')
  );
  const [signatureType, setSignatureType] = useState<'text' | 'canvas'>(
    savedDraft?.signatureType || (recordToEdit?.signature?.startsWith('data:image') ? 'canvas' : 'text')
  );
  const [signatureText, setSignatureText] = useState<string>(
    savedDraft?.signatureText !== undefined 
      ? savedDraft.signatureText 
      : (recordToEdit?.signature && !recordToEdit.signature.startsWith('data:image') ? recordToEdit.signature : '')
  );
  const [signatureImage, setSignatureImage] = useState<string>(
    savedDraft?.signatureImage !== undefined 
      ? savedDraft.signatureImage 
      : (recordToEdit?.signature && recordToEdit.signature.startsWith('data:image') ? recordToEdit.signature : '')
  );

  // 草稿狀態提示
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(!!savedDraft);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(
    savedDraft?.savedAt ? new Date(savedDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null
  );

  // useEffect 監聽輸入欄位變動，自動防呆暫存至 localStorage
  useEffect(() => {
    const hasMeaningfulContent = 
      summary.trim().length > 0 || 
      homeActivityAdvice.trim().length > 0 || 
      caregiverFeedback.trim().length > 0 || 
      signatureText.trim().length > 0 || 
      signatureImage.length > 0;

    if (hasMeaningfulContent) {
      const now = new Date();
      const draftData = {
        date,
        summary,
        scores,
        homeActivityAdvice,
        caregiverFeedback,
        caregiverStatus,
        signatureType,
        signatureText,
        signatureImage,
        savedAt: now.toISOString()
      };

      try {
        localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLastAutoSavedTime(timeStr);
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
    }
  }, [date, summary, scores, homeActivityAdvice, caregiverFeedback, caregiverStatus, signatureType, signatureText, signatureImage, draftStorageKey]);

  // 捨棄草稿重新填寫
  const handleDiscardDraft = () => {
    if (window.confirm('確定要捨棄當前已自動暫存的草稿並重設所有欄位嗎？')) {
      localStorage.removeItem(draftStorageKey);
      setDate(recordToEdit?.date || new Date().toISOString().split('T')[0]);
      setSummary(recordToEdit?.summary || '');
      setScores(recordToEdit?.scores || kidCase.goals.reduce((acc, g) => ({ ...acc, [g.id]: 2 }), {}));
      setHomeActivityAdvice(recordToEdit?.homeActivityAdvice || '');
      setCaregiverFeedback(recordToEdit?.caregiverFeedback || '');
      setCaregiverStatus(recordToEdit?.caregiverStatus || '');
      setSignatureType(recordToEdit?.signature?.startsWith('data:image') ? 'canvas' : 'text');
      setSignatureText(recordToEdit?.signature && !recordToEdit.signature.startsWith('data:image') ? recordToEdit.signature : '');
      setSignatureImage(recordToEdit?.signature && recordToEdit.signature.startsWith('data:image') ? recordToEdit.signature : '');
      clearCanvas();
      setHasRestoredDraft(false);
      setLastAutoSavedTime(null);
    }
  };

  // 常用詞彙彈窗 State
  const [isQuickPhraseOpen, setIsQuickPhraseOpen] = useState(false);
  const [quickPhraseTarget, setQuickPhraseTarget] = useState<'summary' | 'homeActivityAdvice' | 'caregiverFeedback'>('summary');

  // AI 生成紀錄彈窗 State
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  const handleOpenQuickPhrase = (target: 'summary' | 'homeActivityAdvice' | 'caregiverFeedback') => {
    setQuickPhraseTarget(target);
    setIsQuickPhraseOpen(true);
  };

  const handleInsertPhrase = (text: string, target: 'summary' | 'homeActivityAdvice' | 'caregiverFeedback') => {
    if (target === 'summary') {
      setSummary(prev => prev.trim() ? `${prev.trim()}\n${text}` : text);
    } else if (target === 'homeActivityAdvice') {
      setHomeActivityAdvice(prev => prev.trim() ? `${prev.trim()}\n${text}` : text);
    } else if (target === 'caregiverFeedback') {
      setCaregiverFeedback(prev => prev.trim() ? `${prev.trim()}\n${text}` : text);
    }
  };

  // 篩選與當前個案階段推薦的快速快捷標籤
  const popularSummaryPhrases = DEFAULT_QUICK_PHRASES.filter(
    p => p.targetField === 'summary' && (!p.stage || p.stage === 'all' || p.stage === kidCase.stage)
  ).slice(0, 5);

  const popularHomePhrases = DEFAULT_QUICK_PHRASES.filter(
    p => p.targetField === 'homeActivityAdvice'
  ).slice(0, 4);

  const popularFeedbackPhrases = DEFAULT_QUICK_PHRASES.filter(
    p => p.targetField === 'caregiverFeedback'
  ).slice(0, 4);

  // Canvas 手寫參考
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 初始化或清空 Canvas
  useEffect(() => {
    if (signatureType === 'canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a'; // 深色筆觸
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 如果有舊的圖片，則把它繪製上 Canvas
        if (signatureImage) {
          const img = new Image();
          img.src = signatureImage;
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        } else {
          // 清空
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [signatureType]);

  // 手寫簽名操作
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasImage();
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureImage('');
  };

  const saveCanvasImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setSignatureImage(dataUrl);
  };

  const handleScoreChange = (goalId: string, scoreVal: number) => {
    setScores(prev => ({ ...prev, [goalId]: scoreVal }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 獲取簽名
    const signature = signatureType === 'text' ? signatureText : signatureImage;

    // 清除該筆暫存草稿
    try {
      localStorage.removeItem(draftStorageKey);
    } catch (err) {
      console.warn('Failed to clear draft on submit:', err);
    }

    onSave({
      caseId: kidCase.id,
      date,
      summary,
      scores,
      homeActivityAdvice,
      caregiverFeedback,
      caregiverStatus,
      signature
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-geometric-black/70 overflow-y-auto backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl border border-geometric-border overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-geometric-black text-white px-6 py-4 flex justify-between items-center tracking-wide shrink-0 border-b border-geometric-dark">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display font-black text-base sm:text-lg flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-geometric-accent" />
                {recordToEdit ? `編輯『${kidCase.name}』療育紀錄` : `登錄『${kidCase.name}』課後服務紀錄`}
              </h2>
              {lastAutoSavedTime && (
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400 bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 rounded font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  自動暫存 {lastAutoSavedTime}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              階段：{kidCase.stage === 'early' ? '早療-學齡前' : '弱療-國小七歲以上個案'} | 主要照顧者：{kidCase.caregiverName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-geometric-dark rounded-md text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 若有載入未完成草稿，顯示貼心提示列 */}
        {hasRestoredDraft && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>已自動載入您上次編輯未儲存的暫存草稿內容。</span>
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-amber-900 hover:text-rose-700 font-bold underline flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              捨棄草稿重填
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* AI 智能生成紀錄快捷橫幅 */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-indigo-950/20 border border-indigo-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 p-0.5 shrink-0 flex items-center justify-center shadow-md shadow-amber-400/10">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
                    Gemini AI 智能臨床紀錄生成
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded">
                    AI OT Assistant
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  自動彙整本堂各評估目標得分，一鍵摘要出符合早期療育規範的專業觀察與居家建議
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAIGeneratorOpen(true)}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>AI 生成紀錄</span>
            </button>
          </div>

          {/* 紀錄日期 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                療育/服務日期 (或月份) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800 text-sm font-medium"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 期初目標之當堂評估 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              各項療育目標表現評分 <span className="text-rose-500 font-normal text-xs">(請依兒童當堂表現評定分數)</span>
            </h3>
            
            <div className="space-y-4">
              {kidCase.goals.map((g, idx) => {
                const currentScore = scores[g.id] ?? 2;
                return (
                  <div key={g.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                    <div className="text-xs font-semibold text-slate-500 flex justify-between items-center">
                      <span>目標項目 {idx + 1}</span>
                      <span className="text-[11px] text-slate-400">
                        {kidCase.stage === 'early' ? '早療能力現況與目標' : '國小弱療能力現況與目標'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="font-semibold text-slate-700 block mb-0.5">期初能力現況：</span>
                        <span className="text-slate-600 font-medium">{g.baseline}</span>
                      </div>
                      <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                        <span className="font-semibold text-emerald-800 block mb-0.5">預期療育目標：</span>
                        <span className="text-emerald-700 font-medium">{g.target}</span>
                      </div>
                    </div>

                    {/* 分數選擇按鈕群組 */}
                    <div>
                      <span className="block text-xs font-display font-bold text-slate-700 mb-1.5">當次評分：</span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {SCORE_OPTIONS.map((opt) => {
                          const isSelected = currentScore === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleScoreChange(g.id, opt.value)}
                              className={`py-1.5 px-1 rounded-md border text-center transition cursor-pointer flex flex-col items-center justify-between min-h-[50px] font-display font-bold ${
                                isSelected
                                  ? 'border-geometric-accent bg-geometric-accent text-white shadow-xs shadow-geometric-accent/15'
                                  : 'border-geometric-border bg-white text-slate-705 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-xs font-bold">{opt.label}</span>
                              <span className={`text-[9px] mt-0.5 font-normal leading-tight hidden sm:block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {opt.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <HelpCircle className="w-3 h-3 text-geometric-accent" />
                        <span>評分效果：</span>
                        <span className="font-semibold text-slate-600">
                          {currentScore === 3 && '孩子在課堂上展現出超出該目標的靈活潛力（3分）'}
                          {currentScore === 2 && '孩子成功穩定達成該設定目標（2分）'}
                          {currentScore === 1 && '孩子尚未穩定達成目標，但已有顯著進步軌跡（1分）'}
                          {currentScore === 0 && '孩子表現維持本次期初的基本能力現況（0分）'}
                          {currentScore === -1 && '孩子在當次課堂表現受到情緒或身體疲累等干擾比期初退步（-1分）'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 療育活動簡述 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center flex-wrap gap-1.5">
              <label className="block text-sm font-bold text-slate-800">
                療育活動內容簡述 <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAIGeneratorOpen(true)}
                  className="flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                  AI 生成
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickPhrase('summary')}
                  className="flex items-center gap-1 text-xs font-bold text-geometric-accent hover:text-geometric-active bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-md transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  常用詞彙庫
                </button>
              </div>
            </div>
            
            <textarea
              required
              rows={3}
              placeholder="請簡要描述本次上課利用哪些媒介、活動、觸覺阻力引導或情緒介入（例如：利用感覺統合彈跳床建立雙腳跳躍，或引導粗筆握指...）"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-850"
            />

            {/* 快速常用快捷標籤 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 shrink-0">常選推薦：</span>
              {popularSummaryPhrases.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleInsertPhrase(p.text, 'summary')}
                  title={p.text}
                  className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-600 rounded-md transition cursor-pointer flex items-center gap-1 truncate max-w-[200px]"
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 居家活動與家長回饋區 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-emerald-500" />
              居家活動建議與家長回饋 (OT 與家長互動欄)
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center flex-wrap gap-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    給主要照顧者的居家活動建議 (建議填寫)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAIGeneratorOpen(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3 text-amber-700" />
                      AI 智能建議
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickPhrase('homeActivityAdvice')}
                      className="flex items-center gap-1 text-[11px] font-bold text-geometric-accent hover:text-geometric-active bg-indigo-50 hover:bg-indigo-100/80 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      常用衛教詞彙
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  placeholder="例如：建議孩子每天在家堆疊大積木10個、利用黏土捏製湯圓等練習手部精細力道..."
                  value={homeActivityAdvice}
                  onChange={e => setHomeActivityAdvice(e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:outline-hidden"
                />
                {/* 居家快捷詞彙標籤 */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">常選建議：</span>
                  {popularHomePhrases.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleInsertPhrase(p.text, 'homeActivityAdvice')}
                      title={p.text}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 rounded-md transition cursor-pointer flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <Plus className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    家長居家活動執行狀況
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['check', 'cross', 'delta', 'circle'].map((st) => {
                      const conf = HOME_ACTIVITY_STATUS_DETAILS[st as 'check'|'cross'|'delta'|'circle'];
                      const isSelected = caregiverStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCaregiverStatus(st as HomeActivityStatus)}
                          className={`p-2 border rounded-md text-center transition cursor-pointer flex flex-col items-center justify-between min-h-[54px] font-display font-bold ${
                            isSelected
                              ? 'border-geometric-accent bg-geometric-accent text-white shadow-xs'
                              : 'border-geometric-border bg-white hover:bg-slate-50 text-slate-705'
                          }`}
                        >
                          <span className="text-base font-extrabold">{conf.char}</span>
                          <span className={`text-[8px] mt-0.5 leading-none ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {conf.label.substring(0, 4)}...
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1.5">
                    {caregiverStatus === 'check' && '✔ 可順利執行，家長表示配合得很好。'}
                    {caregiverStatus === 'cross' && '✖ 有困難無法執行，需安排下堂親自協調。'}
                    {caregiverStatus === 'delta' && '▲ 需要療育人員在下堂課再給予家長操作指導。'}
                    {caregiverStatus === 'circle' && '● 目標已完全達成，目前不需再特別額外執行。'}
                    {!caregiverStatus && '（選填，在期初或未拿到家長回填前可先不填）'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700">
                      家長回饋內容 (可直接寫入或電訪紀錄)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickPhrase('caregiverFeedback')}
                      className="flex items-center gap-1 text-[11px] font-bold text-geometric-accent hover:text-geometric-active bg-indigo-50 hover:bg-indigo-100/80 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      常用回饋
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="小晴回家抓筆比較順，但要大人在旁邊要求才要認真寫..."
                    value={caregiverFeedback}
                    onChange={e => setCaregiverFeedback(e.target.value)}
                    className="w-full text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                  {/* 回饋快捷標籤 */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {popularFeedbackPhrases.slice(0, 2).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleInsertPhrase(p.text, 'caregiverFeedback')}
                        title={p.text}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-slate-200 text-slate-600 rounded transition cursor-pointer flex items-center gap-0.5 truncate max-w-[150px]"
                      >
                        <Plus className="w-2.5 h-2.5 text-slate-400" />
                        <span className="truncate">{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 家長簽名模擬 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-sm font-display font-bold text-slate-800 flex items-center gap-1">
                <User className="w-4 h-4 text-slate-505" />
                家長親筆簽署欄位 (支持平板/滑鼠手寫簽名)
              </span>
              <div className="flex gap-2 text-xs font-display">
                <button
                  type="button"
                  onClick={() => setSignatureType('text')}
                  className={`px-3 py-1 rounded border font-bold cursor-pointer transition ${signatureType === 'text' ? 'bg-geometric-black border-geometric-black text-white' : 'bg-white hover:bg-slate-100 border-geometric-border text-slate-700'}`}
                >
                  打字簽名
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureType('canvas')}
                  className={`px-3 py-1 rounded border font-bold cursor-pointer transition ${signatureType === 'canvas' ? 'bg-geometric-black border-geometric-black text-white' : 'bg-white hover:bg-slate-100 border-geometric-border text-slate-700'}`}
                >
                  面板手寫
                </button>
              </div>
            </div>

            {signatureType === 'text' ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">主要照顧家長姓名 (由家長代簽/親自打字簽章)</label>
                <input
                  type="text"
                  placeholder="請輸入家長姓名（例如：林美惠）"
                  value={signatureText}
                  onChange={e => setSignatureText(e.target.value)}
                  className="w-full px-4 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>請使用指腹或滑鼠在下方虛線處書寫：</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex items-center gap-1 hover:text-rose-600 font-bold transition cursor-pointer font-display"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    清除重簽
                  </button>
                </div>
                <div className="border border-dashed border-geometric-dark/30 rounded-lg bg-white overflow-hidden flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full max-w-[500px] h-[150px] bg-white touch-none cursor-crosshair"
                  />
                </div>
                <div className="text-[10px] text-gray-400">
                  * 繪製完畢簽署將即時嵌入至早期療育紙本服務記錄表。
                </div>
              </div>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex flex-wrap gap-2 justify-between items-center border-t border-geometric-border shrink-0 select-none font-display">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-geometric-border text-slate-700 text-sm rounded hover:bg-slate-100 transition font-bold cursor-pointer"
            >
              取消
            </button>
            {lastAutoSavedTime && (
              <span className="sm:hidden text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-mono">
                已自動暫存 {lastAutoSavedTime}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-6 py-2 bg-geometric-accent hover:bg-geometric-active text-white text-sm rounded shadow-md shadow-geometric-accent/15 transition font-extrabold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              儲存紀錄
            </button>
          </div>
        </div>

      </div>

      {/* 職能治療常用詞彙庫彈窗 */}
      {isQuickPhraseOpen && (
        <QuickPhraseSelector
          stage={kidCase.stage}
          activeTargetField={quickPhraseTarget}
          onSelectPhrase={(phraseText, target) => {
            handleInsertPhrase(phraseText, target);
          }}
          onClose={() => setIsQuickPhraseOpen(false)}
        />
      )}

      {/* Gemini AI 智能臨床紀錄生成彈窗 */}
      {isAIGeneratorOpen && (
        <AIRecordGeneratorModal
          kidCase={kidCase}
          date={date}
          scores={scores}
          currentSummary={summary}
          currentHomeAdvice={homeActivityAdvice}
          caregiverStatus={caregiverStatus}
          onApplyAll={(aiSummary, aiHomeAdvice) => {
            setSummary(aiSummary);
            setHomeActivityAdvice(aiHomeAdvice);
          }}
          onApplySummary={(aiSummary) => {
            setSummary(aiSummary);
          }}
          onApplyHomeAdvice={(aiHomeAdvice) => {
            setHomeActivityAdvice(aiHomeAdvice);
          }}
          onClose={() => setIsAIGeneratorOpen(false)}
        />
      )}
    </div>
  );
}
