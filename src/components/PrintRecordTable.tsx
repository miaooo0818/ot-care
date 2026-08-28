/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KidCase, LessonRecord, Therapist, HOME_ACTIVITY_STATUS_DETAILS } from '../types';
import { Printer, X, FileText, Download, CheckCircle } from 'lucide-react';
import { exportCaseToDocx } from '../utils/docxExport';

interface PrintRecordTableProps {
  kidCase: KidCase;
  record: LessonRecord;
  therapist?: Therapist;
  onClose: () => void;
}

export default function PrintRecordTable({ kidCase, record, therapist, onClose }: PrintRecordTableProps) {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [docxSuccess, setDocxSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      await exportCaseToDocx({
        kidCase,
        records: [record],
        therapist,
      });
      setDocxSuccess(true);
      setTimeout(() => setDocxSuccess(false), 3000);
    } catch (err) {
      console.error('Export DOCX error:', err);
      alert('匯出 Word 檔案時發生錯誤');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const therapistName = therapist?.name || kidCase.therapistName || '主責治療師';
  const specialty = therapist?.specialty || kidCase.specialty || '職能治療';
  const licenseNumber = therapist?.licenseNumber || '';
  const isEarly = kidCase.stage === 'early';
  const formTitle = isEarly ? '臺中市早期療育服務記錄表' : '臺中市早期療育弱勢服務記錄表';

  // 格式化日期 e.g. 2026-05-10 為 民國 115 年 5 月 10 日
  const formatTaiwanDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10) - 1911;
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `中華民國 ${year} 年 ${month} 月 ${day} 日`;
  };

  const getTaiwanPeriod = (startStr: string, endStr: string) => {
    const parsePeriod = (str: string) => {
      if (!str) return '  年  月';
      const parts = str.split('-');
      const year = parseInt(parts[0], 10) - 1911;
      const month = parseInt(parts[1], 10);
      return `${year} 年 ${month} 月`;
    };
    return `${parsePeriod(startStr)} 至 ${parsePeriod(endStr)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto backdrop-blur-xs flex items-center justify-center p-4">
      {/* 整合控制列：在螢幕上會顯示，列印時要隱藏 */}
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-geometric-black text-white px-6 py-4 flex items-center justify-between print:hidden shrink-0 border-b border-geometric-dark bg-none">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-geometric-accent" />
            <span className="font-display font-black tracking-wide text-base sm:text-lg text-white">
              {formTitle} - 列印與 Word 匯出
            </span>
          </div>
          <div className="flex items-center gap-2.5 font-display">
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer text-white"
            >
              <Download className="w-4 h-4" />
              {isExportingDocx ? '生成 Word 中...' : '匯出 Word (.docx)'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-geometric-accent hover:bg-geometric-active rounded text-xs sm:text-sm font-extrabold shadow-md shadow-geometric-accent/15 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              列印此表 (PDF)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-geometric-dark rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {docxSuccess && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-6 py-2 border-b border-emerald-200 flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Word (.docx) 檔案已成功下載！
          </div>
        )}

        {/* 預覽與列印主體 */}
        <div id="print-area" className="flex-1 overflow-y-auto p-8 bg-slate-100 print:bg-white print:p-0 flex justify-center">
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 text-black font-sans leading-relaxed text-sm antialiased">
            
            {/* 中國醫藥大學孫世恆副教授編制 & LOGO 模擬 */}
            <div className="flex justify-between items-center text-[11px] text-gray-500 border-b border-gray-200 pb-1 mb-4 select-none">
              <div>中國醫藥大學 孫世恆副教授編制</div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                <span>IACCB 國際兒童潛能發展協會</span>
              </div>
            </div>

            {/* 標題 */}
            <h1 className="text-center font-bold text-xl tracking-widest text-gray-900 my-4">
              {formTitle}
            </h1>

            {/* 基本資料表格 */}
            <div className="border-t border-r border-l border-black grid grid-cols-12 mb-0">
              <div className="col-span-4 border-b border-l border-black p-2 flex items-center">
                <span className="font-semibold shrink-0">兒童姓名：</span>
                <span className="ml-2 font-medium">{kidCase.name}</span>
                <span className="ml-auto text-xs bg-slate-100 text-slate-700 font-normal px-1.5 py-0.5 rounded mr-1 print:hidden">
                  {kidCase.stage === 'early' ? '學齡前-早療' : '國小-弱療'}
                </span>
              </div>
              <div className="col-span-4 border-b border-l border-black p-2 flex items-center">
                <span className="font-semibold shrink-0">兒童生日：</span>
                <span className="ml-2">{kidCase.birthday}</span>
              </div>
              <div className="col-span-4 border-b border-l border-black p-2 flex items-center">
                <span className="font-semibold shrink-0">療育期間：</span>
                <span className="ml-2 text-xs">{getTaiwanPeriod(kidCase.therapyPeriodStart, kidCase.therapyPeriodEnd)}</span>
              </div>

              <div className="col-span-4 border-b border-l border-black p-2 flex items-center">
                <span className="font-semibold shrink-0">主要照顧者：</span>
                <span className="ml-2">{kidCase.caregiverName}</span>
              </div>
              <div className="col-span-4 border-b border-l border-black p-2 flex items-center">
                <span className="font-semibold shrink-0">聯絡電話：</span>
                <span className="ml-2">{kidCase.phone}</span>
              </div>
              <div className="col-span-4 border-b border-l border-black p-2 grid grid-cols-2">
                <div className="flex items-center">
                  <span className="font-semibold shrink-0">療育人員：</span>
                  <span className="ml-1 font-medium">{therapistName}</span>
                </div>
                <div className="border-l border-gray-300 pl-2 flex items-center">
                  <span className="font-semibold shrink-0">專業別：</span>
                  <span className="ml-1 text-xs">{specialty}</span>
                </div>
              </div>
            </div>

            {/* 療育目標表格 */}
            <table className="w-full border-collapse border border-black text-center mt-[-1px]">
              <thead>
                <tr className="bg-slate-50 print:bg-transparent">
                  <th className="border border-black p-2 w-[40%] font-bold text-gray-800">本次期初能力行為</th>
                  <th className="border border-black p-2 w-[40%] font-bold text-gray-800">療育目標行為</th>
                  <th className="border border-black p-2 w-[20%] font-bold text-gray-800">
                    <div>療育服務紀錄</div>
                    <div className="text-[10px] font-normal text-gray-500 mt-1">服務日期：{record.date}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {kidCase.goals.map((g, index) => {
                  const scoreVal = record.scores[g.id];
                  return (
                    <tr key={g.id}>
                      <td className="border border-black p-2 text-left align-top min-h-[60px]">
                        <div className="flex gap-1.5">
                          <span className="text-gray-400 shrink-0 font-mono text-xs mt-0.5">({index + 1})</span>
                          <span className="whitespace-pre-wrap">{g.baseline}</span>
                        </div>
                      </td>
                      <td className="border border-black p-2 text-left align-top">
                        <div className="flex gap-1.5">
                          <span className="text-gray-400 shrink-0 font-mono text-xs mt-0.5">({index + 1})</span>
                          <span className="whitespace-pre-wrap">{g.target}</span>
                        </div>
                      </td>
                      <td className="border border-black p-2 align-middle font-bold text-lg select-none">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`${scoreVal !== undefined ? 'text-slate-900 border-2 border-slate-900 px-3 py-1 rounded-sm' : 'text-gray-300'}`}>
                            {scoreVal !== undefined ? `${scoreVal} 分` : '-'}
                          </span>
                          {scoreVal !== undefined && (
                            <span className="text-[10px] text-gray-500 font-normal mt-1">
                              {scoreVal === 3 && '超過目標行為'}
                              {scoreVal === 2 && '達到目標行為'}
                              {scoreVal === 1 && '未達目標有進步'}
                              {scoreVal === 0 && '與期初能力一樣'}
                              {scoreVal === -1 && '比期初退步'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 評分說明 */}
            <div className="border-r border-l border-b border-black p-2 text-xs text-gray-600 bg-slate-50/50 print:bg-transparent">
              <span className="font-semibold text-black">兒童表現評分：</span>
              超過目標行為3分，達到目標行為2分，未達目標但有進步1分，與期初能力現況一樣0分，比期初退步-1分。
            </div>

            {/* 療育活動內容簡述 */}
            <div className="border-r border-l border-b border-black p-3 align-top min-h-[90px]">
              <div className="font-bold text-gray-800 mb-1">療育活動內容簡述：</div>
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed pl-1">
                {record.summary || '（無輸入活動簡述）'}
              </div>
            </div>

            {/* 居家活動與家長反饋 */}
            <table className="w-full border-collapse border border-black text-center mt-[-1px]">
              <thead>
                <tr className="bg-slate-50 print:bg-transparent text-xs font-bold">
                  <th className="border border-black p-2 w-[18%]">日期 / 月份</th>
                  <th className="border border-black p-2 w-[32%]">居家活動建議</th>
                  <th className="border border-black p-2 w-[22%]">家長回饋</th>
                  <th className="border border-black p-2 w-[16%]">家長居家活動執行狀況</th>
                  <th className="border border-black p-2 w-[12%]">家長簽名</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 align-middle font-mono">
                    {formatTaiwanDate(record.date)}
                  </td>
                  <td className="border border-black p-2 text-left align-top text-xs whitespace-pre-wrap">
                    {record.homeActivityAdvice || '（無提供居家活動建議）'}
                  </td>
                  <td className="border border-black p-2 text-left align-top text-xs whitespace-pre-wrap">
                    {record.caregiverFeedback || '（無家長回饋）'}
                  </td>
                  <td className="border border-black p-2 align-middle text-xs relative">
                    {/* 指引狀態 */}
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <div className="flex justify-center gap-1.5 py-1">
                        {['check', 'cross', 'delta', 'circle'].map((st) => {
                          const conf = HOME_ACTIVITY_STATUS_DETAILS[st as 'check'|'cross'|'delta'|'circle'];
                          const isSelected = record.caregiverStatus === st;
                          return (
                            <span 
                              key={st} 
                              className={`w-5 h-5 flex items-center justify-center rounded-xs font-bold border ${
                                isSelected 
                                  ? 'bg-black text-white border-black ring-1 ring-black' 
                                  : 'border-gray-300 text-gray-400 text-[10px]'
                              }`}
                            >
                              {conf.char}
                            </span>
                          );
                        })}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">
                        {record.caregiverStatus === 'check' && '✔ 可順利執行'}
                        {record.caregiverStatus === 'cross' && '✖ 有困難無法執行'}
                        {record.caregiverStatus === 'delta' && '▲ 需要再指導'}
                        {record.caregiverStatus === 'circle' && '● 已達成不需執行'}
                        {!record.caregiverStatus && '（未登錄居家狀態）'}
                      </div>
                    </div>
                  </td>
                  <td className="border border-black p-2 align-middle text-center font-cursive text-sm text-slate-800">
                    <div className="flex flex-col items-center justify-center">
                      {record.signature ? (
                        record.signature.startsWith('data:image') ? (
                          <img src={record.signature} alt="家長簽名" className="max-h-12 max-w-[90px] object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-semibold tracking-widest border border-dashed border-slate-300 px-1 py-0.5 text-xs text-slate-700 bg-slate-50 rounded-xs select-none">
                            {record.signature}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-300 text-xs">（未簽名）</span>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 說明字樣 */}
            <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-gray-500 leading-normal select-none print:hidden">
              <span className="font-semibold text-slate-800">家長執行居家活動狀態說明：</span>
              ✔ 可順利執行，✖ 有困難無法執行，▲ 需要療育人員再給予指導，● 已達成不需繼續執行。
            </div>

            {/* 列印提示與簽署 */}
            <div className="mt-8 flex flex-wrap justify-between items-end gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-800">
                <span className="font-semibold">療育人員簽章：</span>
                <span className="font-bold underline decoration-slate-400 underline-offset-4 text-sm font-serif">
                  {therapistName}
                </span>
                {licenseNumber && (
                  <span className="text-gray-600 font-mono text-xs ml-1">
                    （證號：{licenseNumber}）
                  </span>
                )}
              </div>
              <div className="text-right text-xs text-slate-400 print:text-black font-mono">
                OT-Care 電子化認證簽章：TS-{record.id.toUpperCase()}
                {licenseNumber && <span className="ml-2">| 執照字號：{licenseNumber}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
