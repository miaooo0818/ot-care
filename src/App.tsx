/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KidCase, LessonRecord, GoalTemplate } from './types';
import { INITIAL_CASES, INITIAL_RECORDS, DEFAULT_THERAPIST } from './initialData';
import { DEFAULT_GOAL_TEMPLATES } from './goalTemplates';
import TherapistDashboard from './components/TherapistDashboard';
import CaseDetail from './components/CaseDetail';
import RecordForm from './components/RecordForm';
import PrintRecordTable from './components/PrintRecordTable';
import AdminPanel from './components/AdminPanel';
import { Heart, Clipboard, LogOut, Shield, Award, Calendar, RefreshCw } from 'lucide-react';

export default function App() {
  // 資料 State
  const [cases, setCases] = useState<KidCase[]>([]);
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [goalTemplates, setGoalTemplates] = useState<GoalTemplate[]>([]);

  // 路由/頁面切換 State
  const [view, setView] = useState<'dashboard' | 'detail' | 'admin'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // 彈跳視窗控制 State
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<LessonRecord | undefined>(undefined);
  const [printRecord, setPrintRecord] = useState<LessonRecord | null>(null);

  // 系統初始化： localStorage read/write
  useEffect(() => {
    const storedCases = localStorage.getItem('ot_cases');
    const storedRecords = localStorage.getItem('ot_records');
    const storedTemplates = localStorage.getItem('ot_goal_templates');

    if (storedCases && storedRecords) {
      setCases(JSON.parse(storedCases));
      setRecords(JSON.parse(storedRecords));
    } else {
      // 首次加載，寫入預先建立之高品質模擬個案與紀錄
      localStorage.setItem('ot_cases', JSON.stringify(INITIAL_CASES));
      localStorage.setItem('ot_records', JSON.stringify(INITIAL_RECORDS));
      setCases(INITIAL_CASES);
      setRecords(INITIAL_RECORDS);
    }

    if (storedTemplates) {
      setGoalTemplates(JSON.parse(storedTemplates));
    } else {
      localStorage.setItem('ot_goal_templates', JSON.stringify(DEFAULT_GOAL_TEMPLATES));
      setGoalTemplates(DEFAULT_GOAL_TEMPLATES);
    }
  }, []);

  // 當資料有變時自動調用 localStorage 同步
  const syncCases = (updatedCases: KidCase[]) => {
    setCases(updatedCases);
    localStorage.setItem('ot_cases', JSON.stringify(updatedCases));
  };

  const syncRecords = (updatedRecords: LessonRecord[]) => {
    setRecords(updatedRecords);
    localStorage.setItem('ot_records', JSON.stringify(updatedRecords));
  };

  const syncTemplates = (updatedTemplates: GoalTemplate[]) => {
    setGoalTemplates(updatedTemplates);
    localStorage.setItem('ot_goal_templates', JSON.stringify(updatedTemplates));
  };

  // CRUD: 個案基本資料管理 (新增、編輯)
  const handleAddCase = (newCase: KidCase) => {
    const updated = [newCase, ...cases];
    syncCases(updated);
  };

  const handleEditCase = (updatedCase: KidCase) => {
    const updated = cases.map(c => c.id === updatedCase.id ? updatedCase : c);
    syncCases(updated);
  };

  // CRUD: 課堂紀錄 (新增及編輯儲存)
  const handleSaveRecord = (recordData: Omit<LessonRecord, 'id' | 'createdAt'>) => {
    const currentSelectedCase = cases.find(c => c.id === selectedCaseId);
    if (!currentSelectedCase) return;

    if (recordToEdit) {
      // 編輯/更新現有紀錄
      const updated = records.map(r => r.id === recordToEdit.id ? {
        ...r,
        date: recordData.date,
        summary: recordData.summary,
        scores: recordData.scores,
        homeActivityAdvice: recordData.homeActivityAdvice,
        caregiverFeedback: recordData.caregiverFeedback,
        caregiverStatus: recordData.caregiverStatus,
        signature: recordData.signature
      } : r);
      syncRecords(updated);
    } else {
      // 新增紀錄
      const newRecord: LessonRecord = {
        ...recordData,
        id: `record_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      const updated = [newRecord, ...records];
      syncRecords(updated);
    }

    setIsRecordFormOpen(false);
    setRecordToEdit(undefined);
  };

  const handleDeleteRecord = (recordId: string) => {
    const updated = records.filter(r => r.id !== recordId);
    syncRecords(updated);
  };

  // 計算每個個案擁有的紀錄堂數 Map，傳遞給 Dashboard
  const getRecordsCountMap = () => {
    const map: { [caseId: string]: number } = {};
    cases.forEach(c => {
      map[c.id] = records.filter(r => r.caseId === c.id).length;
    });
    return map;
  };

  // 當次被選取之個案
  const activeCase = cases.find(c => c.id === selectedCaseId);
  // 當次個案之課堂歷史紀錄
  const activeCaseRecords = records.filter(r => r.caseId === selectedCaseId);

  // 清空本機暫存，重新初始化預設數據
  const resetToDefault = () => {
    if (confirm('確定要清空您自訂的資料並恢復至精緻預設模擬個案嗎？（此動作會覆蓋當前資料）')) {
      localStorage.setItem('ot_cases', JSON.stringify(INITIAL_CASES));
      localStorage.setItem('ot_records', JSON.stringify(INITIAL_RECORDS));
      setCases(INITIAL_CASES);
      setRecords(INITIAL_RECORDS);
      setView('dashboard');
      setSelectedCaseId(null);
    }
  };

  return (
    <div className="min-h-screen bg-geometric-bg flex flex-col font-sans antialiased text-slate-800">
      
      {/* 系統一體頂部美麗導航 Navbar */}
      <header className="bg-geometric-black text-white shadow-md border-b border-geometric-dark/30 *:select-none shrink-0 print:hidden justify-between">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div 
            onClick={() => { setView('dashboard'); setSelectedCaseId(null); }}
            className="flex items-center gap-3 cursor-pointer hover:opacity-95 active:scale-[0.98] transition group"
          >
            <div className="bg-geometric-accent text-white p-2.5 rounded-lg flex items-center justify-center shadow-lg shadow-geometric-accent/30 group-hover:rotate-6 transition duration-300">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-sm tracking-wider bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent uppercase block">
                OT-Care
              </span>
              <span className="font-semibold text-[11px] text-slate-300">職能治療師療育紀錄系統</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {/* 治療師當前身分 */}
            <div className="hidden sm:flex items-center gap-3 bg-geometric-dark/80 border border-slate-700/80 px-3.5 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-geometric-accent block animate-pulse"></span>
              <span className="text-slate-300 font-mono">負責師：{DEFAULT_THERAPIST.name} ({DEFAULT_THERAPIST.specialty})</span>
            </div>

            {/* 系統後台管理按鈕 */}
            <button
              onClick={() => { setView('admin'); setSelectedCaseId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition select-none font-display font-bold ${
                view === 'admin' 
                  ? 'bg-geometric-accent border-geometric-accent text-white shadow-md shadow-geometric-accent/20' 
                  : 'text-indigo-300 hover:text-white bg-indigo-500/10 border-indigo-500/30'
              }`}
              title="進入後台管理安全端"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>系統後台</span>
            </button>

            {/* 快速恢復預設按鈕 */}
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
              title="重設資料"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">還原預設資料</span>
            </button>
          </div>
        </div>
      </header>

      {/* 核心主頁面切換內容 */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        {view === 'admin' ? (
          <AdminPanel
            cases={cases}
            records={records}
            goalTemplates={goalTemplates}
            onUpdateTemplates={syncTemplates}
            onBack={() => setView('dashboard')}
            onUpdateCases={(updatedCases) => syncCases(updatedCases)}
            onUpdateRecords={(updatedRecords) => syncRecords(updatedRecords)}
            onPrintRecord={(rec, kid) => setPrintRecord(rec)}
          />
        ) : view === 'dashboard' ? (
          <TherapistDashboard
            cases={cases}
            recordsCountMap={getRecordsCountMap()}
            goalTemplates={goalTemplates}
            onSelectCase={(caseId) => {
              setSelectedCaseId(caseId);
              setView('detail');
            }}
            onAddCase={handleAddCase}
          />
        ) : (
          activeCase && (
            <CaseDetail
              kidCase={activeCase}
              records={activeCaseRecords}
              goalTemplates={goalTemplates}
              onBack={() => {
                setView('dashboard');
                setSelectedCaseId(null);
              }}
              onEditCase={handleEditCase}
              onAddRecord={() => {
                setRecordToEdit(undefined);
                setIsRecordFormOpen(true);
              }}
              onEditRecord={(rec) => {
                setRecordToEdit(rec);
                setIsRecordFormOpen(true);
              }}
              onDeleteRecord={handleDeleteRecord}
              onPrintRecord={(rec) => setPrintRecord(rec)}
            />
          )
        )}
      </main>

      {/* 底部 Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center select-none print:hidden justify-center shrink-0">
        <div className="max-w-7xl mx-auto px-4 text-xs text-slate-400 font-medium space-y-1">
          <p>© 2026 OT-Care 兒童職能治療智能療育紀錄系統</p>
          <p className="font-mono text-[10px] text-slate-300">
            臺中市發展遲緩兒童早期療育與國小弱療紀錄系統電子模板整合與輸出
          </p>
        </div>
      </footer>

      {/* 紀錄填寫與編輯之彈出裝對話窗 */}
      {isRecordFormOpen && activeCase && (
        <RecordForm
          kidCase={activeCase}
          recordToEdit={recordToEdit}
          onSave={handleSaveRecord}
          onClose={() => {
            setIsRecordFormOpen(false);
            setRecordToEdit(undefined);
          }}
        />
      )}

      {/* 臺中市早期療育服務記錄表 A4 藍晒特寫與 PDF 下載列印預覽器 */}
      {printRecord && activeCase && (
        <PrintRecordTable
          kidCase={activeCase}
          record={printRecord}
          onClose={() => setPrintRecord(null)}
        />
      )}

    </div>
  );
}
