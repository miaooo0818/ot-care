/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KidCase, LessonRecord, Therapist } from '../types';
import { 
  FileText, Download, X, CheckCircle, Settings, Layers, Calendar, 
  UserCheck, ShieldCheck, Sparkles, Filter 
} from 'lucide-react';
import { 
  exportCaseToDocx, 
  exportMultipleCasesToDocx, 
  exportCombinedCasesToDocx 
} from '../utils/docxExport';

interface ExportDocxModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 單案模式時傳入
  kidCase?: KidCase;
  records?: LessonRecord[];
  // 批次模式時傳入
  allCases?: KidCase[];
  allRecords?: LessonRecord[];
  therapist?: Therapist;
}

export default function ExportDocxModal({
  isOpen,
  onClose,
  kidCase,
  records = [],
  allCases = [],
  allRecords = [],
  therapist
}: ExportDocxModalProps) {
  if (!isOpen) return null;

  // 判定是否為批次模式
  const isBatchMode = !kidCase && allCases.length > 0;

  // 批次目標選擇
  const [batchScope, setBatchScope] = useState<'all' | 'early' | 'weak'>('all');
  const [batchOutputType, setBatchOutputType] = useState<'combined' | 'individual'>('combined');

  // 單案/共同設定
  const [stageOverride, setStageOverride] = useState<'auto' | 'early' | 'weak'>('auto');
  const [dateMode, setDateMode] = useState<'date' | 'month'>('date');
  const [minColumns, setMinColumns] = useState<number>(6);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 取得篩選後之個案列表（批次用）
  const targetCases = isBatchMode
    ? allCases.filter(c => {
        if (batchScope === 'early') return c.stage === 'early';
        if (batchScope === 'weak') return c.stage === 'weak';
        return true;
      })
    : (kidCase ? [kidCase] : []);

  const earlyCount = allCases.filter(c => c.stage === 'early').length;
  const weakCount = allCases.filter(c => c.stage === 'weak').length;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      const effectiveStage = stageOverride === 'auto' ? undefined : stageOverride;

      if (!isBatchMode && kidCase) {
        // 單案匯出
        await exportCaseToDocx({
          kidCase,
          records,
          therapist,
          stageOverride: effectiveStage,
          dateMode,
          minSessionColumns: minColumns
        });
      } else {
        // 批次匯出
        if (batchOutputType === 'combined') {
          const groupName = batchScope === 'early' 
            ? '早療個案彙編' 
            : batchScope === 'weak' 
              ? '弱療個案彙編' 
              : '全體個案彙編';

          await exportCombinedCasesToDocx(targetCases, allRecords, groupName, {
            therapist,
            stageOverride: effectiveStage,
            dateMode,
            minSessionColumns: minColumns
          });
        } else {
          await exportMultipleCasesToDocx(targetCases, allRecords, therapist, {
            stageOverride: effectiveStage,
            dateMode,
            minSessionColumns: minColumns
          });
        }
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('Export DOCX error:', err);
      alert('匯出 Word 檔案時發生錯誤，請稍後再試！');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-geometric-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-geometric-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-geometric-black text-white px-6 py-4 flex items-center justify-between border-b border-geometric-dark shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-geometric-accent/20 rounded-lg text-geometric-accent">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-display font-black text-base tracking-wide text-white">
                匯出臺中市標準服務記錄表 (Word / DOCX)
              </h3>
              <p className="text-[11px] text-slate-400">
                符合中國醫藥大學孫世恆副教授編制格式・分為早療 / 弱療
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-semibold text-slate-700">
          
          {/* 個案標籤或批次範疇 */}
          {isBatchMode ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <label className="block text-slate-800 font-bold font-display text-xs flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-geometric-accent" />
                選擇欲匯出之個案範疇（分為早療 / 弱療）
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBatchScope('all')}
                  className={`p-2.5 rounded-lg border text-center font-display font-bold transition cursor-pointer ${
                    batchScope === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs">全體個案</div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-normal">共 {allCases.length} 位</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchScope('early')}
                  className={`p-2.5 rounded-lg border text-center font-display font-bold transition cursor-pointer ${
                    batchScope === 'early'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="text-xs">學齡前（早療）</div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-normal">共 {earlyCount} 位</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchScope('weak')}
                  className={`p-2.5 rounded-lg border text-center font-display font-bold transition cursor-pointer ${
                    batchScope === 'weak'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="text-xs">國小（弱療）</div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-normal">共 {weakCount} 位</div>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">批次輸出方式：</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchOutputType('combined')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      batchOutputType === 'combined'
                        ? 'bg-geometric-accent text-white shadow-2xs'
                        : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    合併為單一 Word 檔 (各案獨立頁)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchOutputType('individual')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      batchOutputType === 'individual'
                        ? 'bg-geometric-accent text-white shadow-2xs'
                        : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    各個案個別 Word 檔
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm font-display flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-geometric-accent" />
                  {kidCase?.name} 的療育服務紀錄表
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  生日：{kidCase?.birthday} ｜ 期間：{kidCase?.therapyPeriodStart} ~ {kidCase?.therapyPeriodEnd} ｜ 已登錄 {records.length} 堂課
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                kidCase?.stage === 'early' 
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {kidCase?.stage === 'early' ? '學齡前 (早療)' : '國小 (弱療)'}
              </span>
            </div>
          )}

          {/* 表格格式細部設定 */}
          <div className="space-y-4">
            <h4 className="text-xs font-display font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              報表格式與細部條件設定
            </h4>

            {/* 表頭標題形式 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 text-[11px] font-bold mb-1">
                  表頭服務記錄表類別
                </label>
                <select
                  value={stageOverride}
                  onChange={e => setStageOverride(e.target.value as 'auto' | 'early' | 'weak')}
                  className="w-full text-xs p-2 bg-slate-50 border border-geometric-border rounded-lg font-semibold focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                >
                  <option value="auto">自動依個案階段 (早療/弱療)</option>
                  <option value="early">強制早療：臺中市早期療育服務記錄表</option>
                  <option value="weak">強制弱療：臺中市早期療育弱勢服務記錄表</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-[11px] font-bold mb-1">
                  服務紀錄時間欄位標示
                </label>
                <select
                  value={dateMode}
                  onChange={e => setDateMode(e.target.value as 'date' | 'month')}
                  className="w-full text-xs p-2 bg-slate-50 border border-geometric-border rounded-lg font-semibold focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                >
                  <option value="date">請填寫日期 (例如：115/5/10)</option>
                  <option value="month">請填寫月份 (例如：115年5月)</option>
                </select>
              </div>
            </div>

            {/* 欄位數量 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 text-[11px] font-bold mb-1">
                  最少課堂欄位數 (不足將自動留白供手寫/留檔)
                </label>
                <select
                  value={minColumns}
                  onChange={e => setMinColumns(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-slate-50 border border-geometric-border rounded-lg font-semibold focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                >
                  <option value={6}>標準 6 堂課欄位</option>
                  <option value={8}>8 堂課欄位</option>
                  <option value={10}>10 堂課欄位</option>
                  <option value={12}>12 堂課欄位</option>
                </select>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">版面格式規範</span>
                <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  A4 橫向 (Landscape)・標楷體・標準格線
                </span>
              </div>
            </div>
          </div>

          {/* 格式特色提醒 */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-950">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Word (DOCX) 編輯特色：
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-850 font-normal">
              <li>匯出後可使用 <strong>Microsoft Word</strong>、<strong>Google 文件</strong> 或 <strong>WPS</strong> 自由編輯文字與調整字級。</li>
              <li>自動帶入本次期初能力現況、期待目標行為、歷次課堂評分 (-1~3分)、居家活動建議與家長回饋執行狀態。</li>
            </ul>
          </div>

          {/* 成功提示 */}
          {exportSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              Word 檔案已成功生成並開始下載！
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0 font-display">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            取消關閉
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || (isBatchMode && targetCases.length === 0)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-black text-xs transition shadow-md cursor-pointer ${
              isExporting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-geometric-accent hover:bg-geometric-active shadow-indigo-500/20 active:scale-98'
            }`}
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? '正在生成 Word 檔案...' : `立即匯出 DOCX 檔案 (${targetCases.length} 個案)`}
          </button>
        </div>
      </div>
    </div>
  );
}
