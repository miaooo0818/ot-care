/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KidCase, LessonRecord, Goal, KidStage, HomeActivityStatus, SCORE_OPTIONS, HOME_ACTIVITY_STATUS_DETAILS, GoalTemplate, Therapist } from '../types';
import { STANDARD_DOMAINS } from '../goalTemplates';
import { 
  Shield, Lock, Unlock, Key, Settings, Trash2, Edit, FileSpreadsheet, 
  FileText, Download, Printer, Search, ArrowLeft, LogOut, Info, 
  Calendar, Users, Award, X, Check, Plus, AlertTriangle, ChevronRight, BarChart3, Star, Filter, FolderPlus
} from 'lucide-react';
import AIGoalTargetGenerator from './AIGoalTargetGenerator';

interface AdminPanelProps {
  cases: KidCase[];
  records: LessonRecord[];
  goalTemplates: GoalTemplate[];
  therapist: Therapist;
  onUpdateTemplates: (updated: GoalTemplate[]) => void;
  onUpdateTherapist: (updated: Therapist) => void;
  onBack: () => void;
  onUpdateCases: (updatedCases: KidCase[]) => void;
  onUpdateRecords: (updatedRecords: LessonRecord[]) => void;
  onPrintRecord: (record: LessonRecord, kidCase: KidCase) => void;
}

export default function AdminPanel({
  cases,
  records,
  goalTemplates,
  therapist,
  onUpdateTemplates,
  onUpdateTherapist,
  onBack,
  onUpdateCases,
  onUpdateRecords,
  onPrintRecord
}: AdminPanelProps) {
  // Password State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('ot_admin_authenticated') === 'true';
  });
  const [hasPasswordSet, setHasPasswordSet] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [authError, setAuthError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'cases' | 'records' | 'export' | 'templates' | 'settings'>('cases');

  // Directory Search states
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [selectedKidFilter, setSelectedKidFilter] = useState<string>('all');

  // Modals editing state
  const [editingCase, setEditingCase] = useState<KidCase | null>(null);
  const [editingRecord, setEditingRecord] = useState<LessonRecord | null>(null);

  // 負責治療師相關編輯 State
  const [therapistNameInput, setTherapistNameInput] = useState(therapist.name);
  const [therapistSpecialtyInput, setTherapistSpecialtyInput] = useState(therapist.specialty);
  const [therapistLicenseInput, setTherapistLicenseInput] = useState(therapist.licenseNumber || '');

  useEffect(() => {
    setTherapistNameInput(therapist.name);
    setTherapistSpecialtyInput(therapist.specialty);
    setTherapistLicenseInput(therapist.licenseNumber || '');
  }, [therapist]);

  // 新增 / 編輯模板之 State
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplCategory, setTplCategory] = useState('精細動作與書寫');
  const [tplBaseline, setTplBaseline] = useState('');
  const [tplTarget, setTplTarget] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  const handleAddOrEditTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplBaseline.trim() || !tplTarget.trim()) return;

    let updated: GoalTemplate[] = [];
    if (editingTemplateId) {
      updated = goalTemplates.map(t => 
        t.id === editingTemplateId 
          ? { ...t, category: tplCategory, baseline: tplBaseline.trim(), target: tplTarget.trim() }
          : t
      );
    } else {
      const newTpl: GoalTemplate = {
        id: `tpl_${Date.now()}`,
        category: tplCategory,
        baseline: tplBaseline.trim(),
        target: tplTarget.trim()
      };
      updated = [newTpl, ...goalTemplates];
    }

    onUpdateTemplates(updated);
    // Reset form
    setTplCategory('精細動作與書寫');
    setTplBaseline('');
    setTplTarget('');
    setEditingTemplateId(null);
    setIsAddingTemplate(false);
  };

  const handleStartEditTemplate = (t: GoalTemplate) => {
    setEditingTemplateId(t.id);
    setTplCategory(t.category);
    setTplBaseline(t.baseline);
    setTplTarget(t.target);
    setIsAddingTemplate(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('確定要刪除此項預設目標編號與內容範本嗎？（此動作不影響已套用至個案的資料）')) {
      const updated = goalTemplates.filter(t => t.id !== id);
      onUpdateTemplates(updated);
    }
  };

  // Selected Kid for Semester Summary Report Card
  const [selectedReportKidId, setSelectedReportKidId] = useState<string>('');

  // Password setup/auth verification
  useEffect(() => {
    const storedPassword = localStorage.getItem('ot_admin_password');
    setHasPasswordSet(!!storedPassword);
  }, []);

  const handleSetupPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (setupPassword.length < 4) {
      setAuthError('密碼長度至少需要 4 位數');
      return;
    }
    if (setupPassword !== setupPasswordConfirm) {
      setAuthError('確認密碼與設定密碼不符');
      return;
    }

    localStorage.setItem('ot_admin_password', setupPassword);
    sessionStorage.setItem('ot_admin_authenticated', 'true');
    setHasPasswordSet(true);
    setIsAuthenticated(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const storedPassword = localStorage.getItem('ot_admin_password');
    if (passwordInput === storedPassword) {
      sessionStorage.setItem('ot_admin_authenticated', 'true');
      setIsAuthenticated(true);
    } else {
      setAuthError('密碼輸入錯誤，請重試！');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ot_admin_authenticated');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // --- CASE ACTIONS ---
  const handleStartEditCase = (c: KidCase) => {
    setEditingCase({ ...c, goals: [...c.goals] });
  };

  const handleSaveCaseEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;

    const birth = new Date(editingCase.birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    const computedStage: KidStage = age < 6 ? 'early' : 'weak';

    const updatedCase: KidCase = {
      ...editingCase,
      stage: computedStage
    };

    const newCasesList = cases.map(c => c.id === updatedCase.id ? updatedCase : c);
    onUpdateCases(newCasesList);
    setEditingCase(null);
  };

  const handleDeleteCase = (caseId: string, caseName: string) => {
    const relatedRecordsCount = records.filter(r => r.caseId === caseId).length;
    const confirmMsg = `【危險警告】您確定要刪除個案『${caseName}』嗎？\n\n這將會：\n1. 刪除該名孩童的所有基本資料與期初目標。\n2. 自動刪除該案在系統中的 ${relatedRecordsCount} 堂課堂療育紀錄！\n\n此動作刪除後將無法還原，確定要執行嗎？`;
    
    if (confirm(confirmMsg)) {
      const updatedCases = cases.filter(c => c.id !== caseId);
      const updatedRecords = records.filter(r => r.caseId !== caseId);
      
      onUpdateCases(updatedCases);
      onUpdateRecords(updatedRecords);

      // Reset selected report if deleted
      if (selectedReportKidId === caseId) {
        setSelectedReportKidId('');
      }
    }
  };

  const handleGoalChange = (idx: number, field: 'baseline' | 'target', val: string) => {
    if (!editingCase) return;
    const updatedGoals = [...editingCase.goals];
    updatedGoals[idx] = {
      ...updatedGoals[idx],
      [field]: val
    };
    setEditingCase({
      ...editingCase,
      goals: updatedGoals
    });
  };

  const handleAddGoalToEditingCase = () => {
    if (!editingCase) return;
    const newGoal: Goal = {
      id: `goal_${Date.now()}_${editingCase.goals.length + 1}`,
      baseline: '',
      target: ''
    };
    setEditingCase({
      ...editingCase,
      goals: [...editingCase.goals, newGoal]
    });
  };

  const handleDeleteGoalFromEditingCase = (goalId: string) => {
    if (!editingCase) return;
    if (editingCase.goals.length <= 1) {
      alert('個案必須至少擁有一項期初目標！');
      return;
    }
    const filtered = editingCase.goals.filter(g => g.id !== goalId);
    setEditingCase({
      ...editingCase,
      goals: filtered
    });
  };

  // --- RECORD ACTIONS ---
  const handleStartEditRecord = (r: LessonRecord) => {
    setEditingRecord({ ...r, scores: { ...r.scores } });
  };

  const handleSaveRecordEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const newRecordsList = records.map(r => r.id === editingRecord.id ? editingRecord : r);
    onUpdateRecords(newRecordsList);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (recordId: string, recordDate: string) => {
    if (confirm(`確定要刪除這筆在『${recordDate}』的療育服務紀錄嗎？（此動作無法還原）`)) {
      const updated = records.filter(r => r.id !== recordId);
      onUpdateRecords(updated);
    }
  };

  // --- UTF-8 + BOM CSV EXPORTS ---
  const exportCasesCSV = () => {
    let csvContent = '\uFEFF'; // Excel UTF-8 BOM
    csvContent += '個案ID,姓名,生日,療育階段,主要照顧者,聯絡電話,負責治療師,專業別,期間(起),期間(迄),期初目標數,新增時間\r\n';

    cases.forEach(c => {
      const stageName = c.stage === 'early' ? '學齡前(早療)' : '國小(弱療)';
      csvContent += `"${c.id}","${c.name}","${c.birthday}","${stageName}","${c.caregiverName}","${c.phone}","${c.therapistName}","${c.specialty}","${c.therapyPeriodStart}","${c.therapyPeriodEnd}",${c.goals.length},"${c.createdAt}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ot_caregiver_cases_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportRecordsCSV = () => {
    let csvContent = '\uFEFF'; // Excel UTF-8 BOM
    csvContent += '紀錄ID,個案姓名,療育日期,療育活動概要,居家指導建議,家長回饋,家長執行狀態,家長簽署\r\n';

    records.forEach(r => {
      const kid = cases.find(c => c.id === r.caseId);
      const kidName = kid ? kid.name : '未知';
      const statusText = r.caregiverStatus ? (HOME_ACTIVITY_STATUS_DETAILS[r.caregiverStatus]?.label || '') : '未填寫';
      const cleanSummary = (r.summary || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      const cleanAdvice = (r.homeActivityAdvice || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      const cleanFeedback = (r.caregiverFeedback || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      const signatureVal = r.signature && r.signature.startsWith('data:image') ? '[手寫圖像電子簽章]' : r.signature;

      csvContent += `"${r.id}","${kidName}","${r.date}","${cleanSummary}","${cleanAdvice}","${cleanFeedback}","${statusText}","${signatureVal}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ot_session_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Filter cases for table
  const filteredCases = cases.filter(c => {
    return c.name.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
           c.phone.includes(caseSearchQuery) ||
           c.caregiverName.toLowerCase().includes(caseSearchQuery.toLowerCase());
  });

  // Filter records for table
  const filteredRecords = records.filter(r => {
    const kid = cases.find(c => c.id === r.caseId);
    const kidName = kid ? kid.name : '';
    const matchesSearch = r.summary.toLowerCase().includes(recordSearchQuery.toLowerCase()) || 
                          r.date.includes(recordSearchQuery) || 
                          kidName.toLowerCase().includes(recordSearchQuery.toLowerCase());
    const matchesKidSelect = selectedKidFilter === 'all' || r.caseId === selectedKidFilter;
    return matchesSearch && matchesKidSelect;
  });

  // Calculate stats for Dashboard
  const earlyCount = cases.filter(c => c.stage === 'early').length;
  const weakCount = cases.filter(c => c.stage === 'weak').length;
  const scoreStats = {
    three: 0,
    two: 0,
    one: 0,
    zero: 0,
    minusOne: 0,
    total: 0
  };

  records.forEach(r => {
    Object.values(r.scores).forEach(score => {
      scoreStats.total++;
      if (score === 3) scoreStats.three++;
      else if (score === 2) scoreStats.two++;
      else if (score === 1) scoreStats.one++;
      else if (score === 0) scoreStats.zero++;
      else if (score === -1) scoreStats.minusOne++;
    });
  });

  const averageCooperationRate = () => {
    if (records.length === 0) return '0%';
    const compliant = records.filter(r => r.caregiverStatus === 'check' || r.caregiverStatus === 'circle').length;
    return `${Math.round((compliant / records.length) * 100)}%`;
  };

  // Consolidated kid report rendering helper
  const selectedReportKid = cases.find(c => c.id === selectedReportKidId);
  const selectedReportRecords = records
    .filter(r => r.caseId === selectedReportKidId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculates stats for single kid report card
  const getKidReportStats = () => {
    if (!selectedReportKid) return { attendanceCount: 0, compliantCount: 0, complianceRate: '0%', avgScores: {} as { [goalId: string]: string } };
    const attendanceCount = selectedReportRecords.length;
    const compliantCount = selectedReportRecords.filter(r => r.caregiverStatus === 'check' || r.caregiverStatus === 'circle').length;
    const complianceRate = attendanceCount > 0 ? `${Math.round((compliantCount / attendanceCount) * 100)}%` : '0%';

    const scoreTotals: { [goalId: string]: number } = {};
    const scoreCounts: { [goalId: string]: number } = {};
    selectedReportKid.goals.forEach(g => {
      scoreTotals[g.id] = 0;
      scoreCounts[g.id] = 0;
    });

    selectedReportRecords.forEach(r => {
      Object.entries(r.scores).forEach(([goalId, score]) => {
        if (scoreTotals[goalId] !== undefined) {
          scoreTotals[goalId] += score;
          scoreCounts[goalId]++;
        }
      });
    });

    const avgScores: { [goalId: string]: string } = {};
    selectedReportKid.goals.forEach(g => {
      const count = scoreCounts[g.id] || 0;
      avgScores[g.id] = count > 0 ? (scoreTotals[g.id] / count).toFixed(1) : '尚無評分';
    });

    return {
      attendanceCount,
      compliantCount,
      complianceRate,
      avgScores
    };
  };

  const { attendanceCount, complianceRate, avgScores } = getKidReportStats();

  // If not authenticated, render Login / Setup UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 border border-slate-205">
          <div className="flex flex-col items-center select-none text-center space-y-2 mb-6">
            <div className="p-3.5 bg-indigo-50 text-geometric-accent rounded-full shadow-md shadow-geometric-accent/10">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-display font-black tracking-tight text-geometric-black">
              OT-Care 系統後台管理終端
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-xs leading-normal">
              此處為職能治療師之機密管理端，提供個案資料編輯、歷史紀錄刪除與全系統檔案匯出。
            </p>
          </div>

          {authError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-start gap-2 text-xs mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {!hasPasswordSet ? (
            <form onSubmit={handleSetupPassword} className="space-y-4">
              <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 text-xs rounded-lg space-y-1">
                <span className="font-semibold block flex items-center gap-1.5 font-display text-[13px]">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  首次進入：請快速設定管理密碼
                </span>
                <p className="text-slate-600 leading-normal text-[11px]">
                  此密碼將儲存於您的瀏覽器本機儲存空間 (LocalStorage)，用以控管日後刪除與匯出之敏感權限。
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 text-xs font-bold font-display">新密碼 (至少 4 位數)</label>
                <input
                  type="password"
                  required
                  placeholder="請輸入後台新密碼"
                  value={setupPassword}
                  onChange={e => setSetupPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent bg-slate-50 font-mono tracking-widest text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 text-xs font-bold font-display">再次確認密碼</label>
                <input
                  type="password"
                  required
                  placeholder="請重複輸入密碼確認"
                  value={setupPasswordConfirm}
                  onChange={e => setSetupPasswordConfirm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent bg-slate-50 font-mono tracking-widest text-center"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 border border-geometric-border text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer font-bold text-xs py-2.5 font-display text-center"
                >
                  返回治療桌
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg transition font-bold text-xs py-2.5 font-display text-center shadow-md shadow-geometric-accent/20"
                >
                  確認建立密碼並鎖定
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-600 text-xs font-bold font-display">安全登入金鑰：請輸入後台密碼</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent bg-slate-50 font-mono tracking-widest text-center text-geometric-black font-extrabold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 border border-geometric-border text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer font-bold text-xs py-2.5 font-display text-center"
                >
                  返回治療桌
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg transition font-bold text-xs py-2.5 font-display text-center shadow-md shadow-geometric-accent/20"
                >
                  驗證金鑰解鎖後台
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- RECONSTRUCT PATH: AUTHENTICATED PANEL ---
  return (
    <div className="space-y-6 animate-fade-in print:hidden">

      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-geometric-border rounded-xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 select-none">
            <Shield className="w-5 h-5 text-geometric-accent" />
            <span className="text-[11px] font-display font-bold text-geometric-accent uppercase tracking-widest">OT-Care 系統機密管制端</span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-black text-geometric-black tracking-tight leading-tight flex items-center gap-2">
            安全後台數據管理中心
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            您可在權限保護下編輯與刪除個案、清退課堂紀錄、一鍵整合全系統 CSV 數據以配合存檔，或彙編個案整合學習歷程卡。
          </p>
        </div>

        <div className="flex gap-2.5 w-full md:w-auto font-display self-stretch md:self-auto select-none">
          <button
            onClick={onBack}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-geometric-border text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            返回前端控制台
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            登出後台安全端
          </button>
        </div>
      </div>

      {/* Admin Core Tabs Nav */}
      <div className="flex border-b border-geometric-border gap-2 select-none font-display">
        <button
          onClick={() => { setActiveTab('cases'); }}
          className={`px-5 py-3 text-xs font-black tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'cases'
              ? 'border-geometric-accent text-geometric-accent bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          個案基本資料 (改/刪)
        </button>
        <button
          onClick={() => { setActiveTab('records'); }}
          className={`px-5 py-3 text-xs font-black tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'records'
              ? 'border-geometric-accent text-geometric-accent bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          歷次療育課紀錄 (改/刪)
        </button>
        <button
          onClick={() => { setActiveTab('export'); }}
          className={`px-5 py-3 text-xs font-black tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'export'
              ? 'border-geometric-accent text-geometric-accent bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          檔案整合與匯出中心
        </button>
        <button
          onClick={() => { setActiveTab('templates'); }}
          className={`px-5 py-3 text-xs font-black tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-geometric-accent text-geometric-accent bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-500" />
          全系統預設目標範本庫
        </button>
        <button
          onClick={() => { setActiveTab('settings'); }}
          className={`px-5 py-3 text-xs font-black tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-geometric-accent text-geometric-accent bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4 text-blue-500" />
          負責治療師師資設定
        </button>
      </div>

      {/* TAB 1: CASES DIRECTORY */}
      {activeTab === 'cases' && (
        <div className="bg-white border border-geometric-border rounded-xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-sm font-display font-extrabold text-geometric-black flex items-center gap-1.5">
              個案庫全量審核與編輯表格 
              <span className="px-2 py-0.5 font-mono text-[10px] bg-slate-100 text-slate-600 rounded font-normal">
                共 {cases.length} 案
              </span>
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="搜尋姓名、監護人、或聯絡電話..."
                value={caseSearchQuery}
                onChange={e => setCaseSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent focus:bg-white text-slate-700 font-medium transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-geometric-border text-slate-500 font-display font-bold select-none text-[10px] uppercase tracking-wider">
                  <th className="p-3 w-[20%]">兒童姓名/年分</th>
                  <th className="p-3 w-[15%]">健康早弱療分流</th>
                  <th className="p-3 w-[15%]">主要照顧家長</th>
                  <th className="p-3 w-[15%]">電訪連絡電話</th>
                  <th className="p-3 w-[10%]">期初目標項目</th>
                  <th className="p-3 text-right w-[25%]">安全權限選項</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCases.map(c => {
                  const goalCount = c.goals.length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-display font-black text-sm text-geometric-black">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            生日：{c.birthday}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-display font-bold text-[9px] border ${
                          c.stage === 'early' 
                            ? 'bg-indigo-50 text-geometric-accent border-indigo-100' 
                            : 'bg-slate-50 text-indigo-700 border-slate-200'
                        }`}>
                          {c.stage === 'early' ? '學齡前(早)' : '國小(弱療)'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{c.caregiverName}</td>
                      <td className="p-3 font-mono text-slate-500">{c.phone}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded font-bold font-mono text-[10px]">
                          {goalCount} 項目標
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5 select-none font-display">
                          <button
                            onClick={() => handleStartEditCase(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-geometric-border hover:bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer transition shadow-xs"
                          >
                            <Edit className="w-3 h-3 text-slate-400" />
                            修改資料與目標
                          </button>
                          <button
                            onClick={() => handleDeleteCase(c.id, c.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded text-[10px] font-bold cursor-pointer transition shadow-xs"
                          >
                            <Trash2 className="w-3 h-3 text-rose-450" />
                            永久刪除案卡
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 select-none">
                      查無匹配個案基本資料。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECORDS HISTORY */}
      {activeTab === 'records' && (
        <div className="bg-white border border-geometric-border rounded-xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <h2 className="text-sm font-display font-extrabold text-geometric-black flex items-center gap-1.5">
              課後療育紀錄數據精確校正表格
              <span className="px-2 py-0.5 font-mono text-[10px] bg-slate-100 text-slate-600 rounded font-normal">
                共 {records.length} 堂課
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedKidFilter}
                onChange={e => setSelectedKidFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-geometric-border rounded-lg bg-slate-50 focus:outline-hidden font-display cursor-pointer"
              >
                <option value="all">篩選個案：全部</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜尋日期、課堂紀錄實錄..."
                  value={recordSearchQuery}
                  onChange={e => setRecordSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent focus:bg-white text-slate-700 font-medium transition"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-geometric-border text-slate-500 font-display font-bold select-none text-[10px] uppercase tracking-wider">
                  <th className="p-3 w-[12%]">療育日期</th>
                  <th className="p-3 w-[15%]">個案姓名</th>
                  <th className="p-3 w-[35%]">當堂療育核心紀錄實錄</th>
                  <th className="p-3 w-[13%]">家長執行/簽署</th>
                  <th className="p-3 text-right w-[25%]">安全權限選項</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredRecords.map(r => {
                  const kid = cases.find(c => c.id === r.caseId);
                  const kidName = kid ? kid.name : '（已刪除案件）';
                  const statusDetails = r.caregiverStatus ? HOME_ACTIVITY_STATUS_DETAILS[r.caregiverStatus] : null;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition align-top">
                      <td className="p-3 font-mono font-bold text-geometric-black text-xs leading-normal">{r.date}</td>
                      <td className="p-3 font-semibold text-slate-700">{kidName}</td>
                      <td className="p-3">
                        <p className="line-clamp-2 text-xs leading-relaxed font-normal text-slate-600" title={r.summary}>
                          {r.summary}
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          {statusDetails ? (
                            <span className="text-[10px] font-bold text-slate-500">
                              {statusDetails.char} {statusDetails.label.substring(0, 4)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">無回饋狀態</span>
                          )}
                          <span className="text-[9px] text-slate-400 truncate max-w-[80px]">
                            {r.signature ? (r.signature.startsWith('data:image') ? '🎨 已手寫簽名' : `✍️ ${r.signature}`) : '❌ 未簽字'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1 select-none font-display">
                          {kid && (
                            <button
                              onClick={() => onPrintRecord(r, kid)}
                              className="p-1 px-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-geometric-accent rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                              title="預覽列印臺中市早期療育紀錄表"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              列印
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEditRecord(r)}
                            className="p-1 px-2 border border-geometric-border hover:bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer transition"
                            title="修改紀錄"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r.id, r.date)}
                            className="p-1 px-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded text-[10px] font-bold cursor-pointer transition"
                            title="刪除紀錄"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 select-none">
                      尚無登錄與匹配的課後療育紀錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FILE EXPORT & COMPREHENSIVE PROGRESS REPORT */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: CSV Data Center */}
          <div className="lg:col-span-4 bg-white border border-geometric-border rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="font-display font-extrabold text-sm text-geometric-black flex items-center gap-1.5 select-none">
              <FileSpreadsheet className="w-4 h-4 text-geometric-accent" />
              全系統資料導出 (Excel 支援)
            </h3>
            <p className="text-xs text-slate-500 leading-normal font-medium">
              支援一鍵匯出符合 UTF-8 帶 BOM 標識之 CSV 檔，雙擊即可直接以 Windows Excel 或 Mac 數位試算表進行精準分析、匯入或存檔。
            </p>

            <div className="space-y-3 select-none font-display">
              <button
                onClick={exportCasesCSV}
                className="w-full flex items-center justify-between p-3 border border-geometric-border bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-705 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-100 rounded-md text-geometric-accent">
                    <Users className="w-4 h-4" />
                  </span>
                  <div className="text-left">
                    <span className="block font-black">個案基本設定檔 (CSV)</span>
                    <span className="block font-normal text-[10px] text-slate-450 mt-0.5">匯出共 {cases.length} 位個案生理年齡與期初指標</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={exportRecordsCSV}
                className="w-full flex items-center justify-between p-3 border border-geometric-border bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-705 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-100 rounded-md text-geometric-accent">
                    <ClipboardText className="w-4 h-4" />
                  </span>
                  <div className="text-left">
                    <span className="block font-black">課堂療育紀錄檔 (CSV)</span>
                    <span className="block font-normal text-[10px] text-slate-450 mt-0.5">匯出共 {records.length} 堂課實錄、得分與居家回饋</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Quick Stats Block inside the export sidebar */}
            <hr className="border-slate-100" />
            <div className="space-y-2">
              <span className="font-display font-bold text-xs text-slate-800 flex items-center gap-1.5 select-none">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                療宿概況統計數字
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg">
                  <span className="block text-[10px] text-slate-400 font-bold font-display">學齡前早療案</span>
                  <span className="block text-md font-black text-geometric-black font-mono mt-0.5">{earlyCount}</span>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg">
                  <span className="block text-[10px] text-slate-400 font-bold font-display">國小弱療案</span>
                  <span className="block text-md font-black text-geometric-black font-mono mt-0.5">{weakCount}</span>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg">
                  <span className="block text-[10px] text-slate-400 font-bold font-display">總上課堂數</span>
                  <span className="block text-md font-black text-geometric-black font-mono mt-0.5">{records.length}</span>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg">
                  <span className="block text-[10px] text-slate-400 font-bold font-display">居家回饋配合率</span>
                  <span className="block text-md font-black text-geometric-active font-mono mt-0.5">{averageCooperationRate()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Kid Semester Profile / Report Card Organizer */}
          <div className="lg:col-span-8 bg-white border border-geometric-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h3 className="font-display font-extrabold text-sm text-geometric-black flex items-center gap-1.5 select-none">
                <FileText className="w-4 h-4 text-indigo-500" />
                個案學段生涯動態發展整合報告卡
              </h3>
              <select
                value={selectedReportKidId}
                onChange={e => setSelectedReportKidId(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 border border-geometric-border rounded-lg bg-slate-50 focus:outline-hidden font-display cursor-pointer"
              >
                <option value="">-- 請選擇一個個案彙編報告 --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.stage === 'early' ? '學齡前' : '國小'})</option>
                ))}
              </select>
            </div>

            {selectedReportKid ? (
              <div id="printable-report-card" className="border border-slate-205 rounded-xl p-6 space-y-5 bg-stone-50/30 relative">
                
                {/* Printable header watermark background logo */}
                <div className="absolute right-6 top-6 opacity-5 select-none pointer-events-none">
                  <Shield className="w-40 h-40" />
                </div>

                {/* Report Card Title Block */}
                <div className="text-center border-b border-indigo-100 pb-4 space-y-1 select-none">
                  <span className="text-[10px] font-display font-semibold text-geometric-accent tracking-widest uppercase block">
                    OT-Care Clinical Developmental Portfolio
                  </span>
                  <h2 className="text-lg font-display font-black text-geometric-black tracking-wide">
                    兒童個別化職能治療動態歷程與生涯發展成果報告
                  </h2>
                  <div className="flex justify-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>報告日期：{new Date().toISOString().split('T')[0]}</span>
                    <span>•</span>
                    <span>狀態：期末生涯成效綜合評定</span>
                  </div>
                </div>

                {/* Profile Meta Info Table Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-3.5 border border-slate-100 rounded-lg text-xs leading-5">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold font-display uppercase tracking-wider">兒童姓名 / 生日</span>
                    <strong className="text-geometric-black text-[13px]">{selectedReportKid.name}</strong>
                    <span className="block text-slate-550 font-mono font-medium text-[10px]">({selectedReportKid.birthday})</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold font-display uppercase tracking-wider">專業別 / 負責師</span>
                    <strong className="text-geometric-black">{selectedReportKid.therapistName}</strong>
                    <span className="block text-slate-550 font-medium text-[10px]">({selectedReportKid.specialty})</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold font-display uppercase tracking-wider">療育對應階段</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-display border ${
                      selectedReportKid.stage === 'early' 
                        ? 'bg-indigo-50 text-geometric-accent border-indigo-105' 
                        : 'bg-stone-50 text-indigo-700 border-stone-200'
                    }`}>
                      {selectedReportKid.stage === 'early' ? '學齡前 (早期療育)' : '國小學齡 (功能弱療)'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold font-display uppercase tracking-wider">電訪主要聯絡人</span>
                    <strong className="text-slate-700">{selectedReportKid.caregiverName}</strong>
                    <span className="block text-slate-550 font-mono text-[10px]">{selectedReportKid.phone}</span>
                  </div>
                </div>

                {/* Period Baseline vs Targeted goals mapping */}
                <div className="space-y-2">
                  <h4 className="text-xs font-display font-extrabold text-geometric-black flex items-center gap-1.5 select-none">
                    <Award className="w-4 h-4 text-geometric-accent" />
                    本學段設定期初能力起點與預期養成之療育目標核心
                  </h4>
                  <div className="space-y-2.5">
                    {selectedReportKid.goals.map((goal, index) => {
                      const avg = avgScores[goal.id];
                      return (
                        <div key={goal.id} className="bg-white border border-slate-100 rounded-lg p-3 text-xs leading-relaxed flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-geometric-accent font-display font-bold rounded text-[10px] font-mono border border-indigo-100">
                              目標項目 {index + 1}
                            </span>
                            <p className="text-slate-500 text-[11px] font-medium pl-1">
                              <strong>期初現況起點：</strong>{goal.baseline || '無描述'}
                            </p>
                            <p className="text-geometric-black font-semibold pl-1 p-1 bg-slate-50 border border-slate-100 rounded text-[11px]">
                              <strong>養成目標行為：</strong>{goal.target || '無描述'}
                            </p>
                          </div>
                          
                          {/* Score progression summary right box */}
                          <div className="md:w-32 flex flex-col items-center justify-center shrink-0 border-l border-slate-100 md:pl-4 text-center">
                            <span className="text-[10px] font-display font-bold text-slate-400 block tracking-wider uppercase mb-1">
                              學段平均指數
                            </span>
                            {avg === '尚無評分' ? (
                              <span className="text-slate-400 text-xs font-bold font-mono">（課堂無打分）</span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="text-lg font-black font-mono text-geometric-accent">{avg}</span>
                                <span className="text-[9px] text-slate-500 font-mono block">/ 3.0 分</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Attendance summary and printing trigger */}
                <div className="bg-white border border-slate-150 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-xs text-slate-655 space-y-1 font-medium">
                    <div className="flex flex-wrap gap-x-4">
                      <span>已執行療育課程總堂數：<strong className="text-geometric-black font-mono">{attendanceCount} 堂</strong></span>
                      <span>家長聯絡簿回饋配合率：<strong className="text-geometric-active font-mono">{complianceRate}</strong></span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      註：報告所列學年度平均得分以 2 分為穩定標準。若平均分大於 2 分，顯示常在課堂上表現出能流暢應用與超綱的成熟度；低於 2 分需要再針對活動難度下調，提供更多支持。
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      // Call page printing specifically for reports
                      window.print();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-geometric-accent hover:bg-geometric-active text-white font-display text-xs font-black shadow-md shadow-geometric-accent/15 rounded-lg select-none shrink-0 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    列印此份生涯總結報告
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-20 text-center border border-dashed border-geometric-border rounded-xl text-slate-400 select-none space-y-2">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="font-display font-bold text-slate-500">個別生涯綜合發展報告卡機</div>
                <p className="text-xs max-w-sm mx-auto">
                  請點擊右上角下拉選單，選擇一位個案，系統即時彙整其專屬期初目標、歷次上課出席統計、家長回饋比率與各學項目平均掌握得分趨勢，並可直接輸出為 A4 單頁彙整大卡。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GOAL TEMPLATES LIBRARY */}
      {activeTab === 'templates' && (
        <div className="bg-white border border-geometric-border rounded-xl shadow-xs p-5 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-display font-extrabold text-geometric-black flex items-center gap-1.5">
                職能治療 (OT) 期初評估能力與療育行為範本管理
                <span className="px-2 py-0.5 font-mono text-[10px] bg-indigo-50 text-geometric-accent border border-indigo-100 rounded font-normal">
                  共 {goalTemplates.length} 組範本
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                建立、修改、刪除職能治療常用之「期初現況起點 (Baseline)」與對應「養成目標行為 (Target)」範本，設定後可在個案建案、詳細頁面直接快速帶入！
              </p>
            </div>
            
            <button
              onClick={() => {
                setEditingTemplateId(null);
                setTplCategory('精細動作');
                setTplBaseline('');
                setTplTarget('');
                setIsAddingTemplate(true);
              }}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg text-xs font-bold transition shadow-md shadow-geometric-accent/15 cursor-pointer font-display select-none"
            >
              <Plus className="w-3.5 h-3.5" />
              新增臨床常用範本
            </button>
          </div>

          {/* Filtering Controls */}
          <div className="space-y-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 hover:text-indigo-500" />
              <input
                type="text"
                placeholder="搜尋範本內容 (例如：精細動作、衝動控制、跳躍、注意力、自理...)"
                value={templateSearchQuery}
                onChange={e => setTemplateSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent focus:bg-white text-slate-700 font-semibold transition"
              />
            </div>

            {/* 領域快速篩選標籤 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-400 font-bold shrink-0">領域：</span>
              <button
                type="button"
                onClick={() => setTemplateSearchQuery('')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition shrink-0 cursor-pointer ${
                  templateSearchQuery === ''
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部 ({goalTemplates.length})
              </button>
              {STANDARD_DOMAINS.map(d => {
                const count = goalTemplates.filter(t => t.category === d).length;
                const isActive = templateSearchQuery === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTemplateSearchQuery(isActive ? '' : d)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-geometric-accent text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {d} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Editor Drawer / Forms inline */}
          {isAddingTemplate && (
            <form onSubmit={handleAddOrEditTemplateSubmit} className="bg-slate-50 border border-geometric-border p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-geometric-border pb-2 select-none font-display">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-geometric-accent" />
                  {editingTemplateId ? '編輯已有目標範本內容' : '登錄全新 OT 臨床常用優化範本'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                  title="收起表單"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-1">
                  <label className="block text-slate-600 text-[11px] font-bold">範本適用領域類別</label>
                  <select
                    value={tplCategory}
                    onChange={e => setTplCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-geometric-border bg-white text-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold cursor-pointer"
                  >
                    {STANDARD_DOMAINS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1 space-y-1">
                  <label className="block text-slate-600 text-[11px] font-bold">期初表現能力現況描述 (Baseline) <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={2.5}
                    placeholder="請描述兒童的功能限制、不佳或過輕過重行為現況 (與量化內容)..."
                    value={tplBaseline}
                    onChange={e => setTplBaseline(e.target.value)}
                    className="w-full text-xs p-2 border border-geometric-border rounded-lg bg-white text-slate-700 font-semibold"
                  />
                  
                  {/* AI 智能生成目標 */}
                  <div className="pt-1">
                    <AIGoalTargetGenerator
                      baseline={tplBaseline}
                      customFocus={tplCategory}
                      currentTarget={tplTarget}
                      onApplyTarget={(targetText) => setTplTarget(targetText)}
                    />
                  </div>
                </div>

                <div className="md:col-span-1 space-y-1">
                  <label className="block text-slate-600 text-[11px] font-bold">對應預期養成行為與療育目標 (Target) <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={2.5}
                    placeholder="請寫出具體可觀察、可量化的進步療育學習成效與分數量化標準..."
                    value={tplTarget}
                    onChange={e => setTplTarget(e.target.value)}
                    className="w-full text-xs p-2 border border-geometric-border rounded-lg bg-white text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 select-none font-display">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTemplate(false);
                    setEditingTemplateId(null);
                  }}
                  className="px-4 py-2 border border-geometric-border text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  放棄
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-geometric-accent hover:bg-geometric-active text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-md shadow-geometric-accent/15"
                >
                  確認並登載此範本
                </button>
              </div>
            </form>
          )}

          {/* List of templates in beautifully stacked rows */}
          <div className="grid grid-cols-1 gap-4">
            {goalTemplates
              .filter(t => 
                t.baseline.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                t.target.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                t.category.toLowerCase().includes(templateSearchQuery.toLowerCase())
              )
              .map((t) => (
                <div key={t.id} className="relative border border-slate-150 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/20 hover:bg-white hover:shadow-md transition">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 select-none">
                      <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 text-geometric-accent font-display text-[11px] font-black rounded-lg">
                        {t.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-display font-medium block uppercase tracking-wider">▲ 本次期初能力行為 (Baseline)</span>
                        <p className="text-slate-700 leading-relaxed font-sans font-bold pr-2 select-all">
                          {t.baseline}
                        </p>
                      </div>

                      <div className="space-y-1 md:border-l md:border-slate-100 md:pl-4">
                        <span className="text-[10px] text-indigo-400 font-display font-medium block uppercase tracking-wider">▼ 預期達成療育目標 (Target)</span>
                        <p className="text-indigo-950 leading-relaxed font-sans font-black select-all bg-indigo-50/40 p-2.5 border border-indigo-50 rounded-md">
                          {t.target}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-4">
                    <button
                      onClick={() => handleStartEditTemplate(t)}
                      className="p-1.5 px-3 border border-slate-200 hover:border-geometric-accent hover:bg-slate-50 text-slate-600 hover:text-geometric-accent rounded text-[10px] font-display font-bold transition flex items-center gap-1 cursor-pointer select-none"
                      title="編輯此範本"
                    >
                      <Edit className="w-3 h-3" />
                      編輯
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-1.5 px-3 border border-slate-200 hover:border-rose-500 hover:bg-rose-50 text-slate-600 hover:text-rose-500 rounded text-[10px] font-display font-bold transition flex items-center gap-1 cursor-pointer select-none"
                      title="刪除此範本"
                    >
                      <Trash2 className="w-3 h-3" />
                      刪除
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM AND THERAPIST SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-geometric-border rounded-xl shadow-xs p-6 space-y-6 animate-fadeIn">
          <div className="border-b border-slate-100 pb-4 select-none">
            <h2 className="text-base font-display font-black text-geometric-black flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              負責師資姓名與學術專長設定
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              在此修改當前主責職能治療師的真實姓名與專業科別，此變更將會即時套用至 Header、新建立個案卡以及所有的課堂簽核紀錄中。
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!therapistNameInput.trim() || !therapistSpecialtyInput.trim()) {
                alert('負責人員姓名與科別不得為空！');
                return;
              }
              onUpdateTherapist({
                username: therapist.username || 'ot_user',
                name: therapistNameInput.trim(),
                specialty: therapistSpecialtyInput.trim(),
                licenseNumber: therapistLicenseInput.trim()
              });
              alert('🎉 負責師資姓名、專業科別與執照字號已成功儲存並同步更新至全系統！');
            }}
            className="space-y-4 max-w-xl text-xs font-semibold"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 font-display">
                  負責師（老師）真實姓名
                </label>
                <input
                  type="text"
                  required
                  value={therapistNameInput}
                  onChange={(e) => setTherapistNameInput(e.target.value)}
                  placeholder="例如：許美華"
                  className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 font-display">
                  專業類別 / 臨床特長
                </label>
                <input
                  type="text"
                  required
                  value={therapistSpecialtyInput}
                  onChange={(e) => setTherapistSpecialtyInput(e.target.value)}
                  placeholder="例如：兒童職能治療 (OT)"
                  className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 font-display">
                  治療師執照字號 / 證書證號
                </label>
                <input
                  type="text"
                  value={therapistLicenseInput}
                  onChange={(e) => setTherapistLicenseInput(e.target.value)}
                  placeholder="例如：職字第 003829 號"
                  className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  此證號將自動帶入「臺中市早期療育服務記錄表」列印與簽章頁面。
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-geometric-accent hover:bg-geometric-accent/90 text-white font-display font-bold rounded-lg transition shadow-md shadow-geometric-accent/20 cursor-pointer text-xs flex items-center gap-1.5 select-none"
              >
                <Check className="w-4 h-4" />
                儲存並同步全系統與 Header 設定
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* MODAL 1: EDITING CASE CASE_CARD */}
      {editingCase && (
        <div className="fixed inset-0 z-50 bg-geometric-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-geometric-border">
            
            {/* Header */}
            <div className="bg-geometric-black text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-geometric-dark select-none">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-geometric-accent" />
                <h3 className="font-display font-black text-base sm:text-lg text-white">
                  【管制端管理】修改『{editingCase.name}』個案卡與期望目標
                </h3>
              </div>
              <button 
                onClick={() => setEditingCase(null)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCaseEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-650 text-xs font-bold mb-1 font-display">兒童姓名</label>
                  <input
                    type="text"
                    required
                    value={editingCase.name}
                    onChange={e => setEditingCase({ ...editingCase, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">兒童生日 (可動態重新計算分流)</label>
                  <input
                    type="date"
                    required
                    value={editingCase.birthday}
                    onChange={e => setEditingCase({ ...editingCase, birthday: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">主要聯絡監護人</label>
                  <input
                    type="text"
                    required
                    value={editingCase.caregiverName}
                    onChange={e => setEditingCase({ ...editingCase, caregiverName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">電訪連絡電話</label>
                  <input
                    type="text"
                    required
                    value={editingCase.phone}
                    onChange={e => setEditingCase({ ...editingCase, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">療育對應期間 (起)</label>
                  <input
                    type="month"
                    required
                    value={editingCase.therapyPeriodStart}
                    onChange={e => setEditingCase({ ...editingCase, therapyPeriodStart: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">療育對應期間 (迄)</label>
                  <input
                    type="month"
                    required
                    value={editingCase.therapyPeriodEnd}
                    onChange={e => setEditingCase({ ...editingCase, therapyPeriodEnd: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">負責人員姓名</label>
                  <input
                    type="text"
                    required
                    value={editingCase.therapistName}
                    onChange={e => setEditingCase({ ...editingCase, therapistName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">物理、職能專業別定義</label>
                  <input
                    type="text"
                    required
                    value={editingCase.specialty}
                    onChange={e => setEditingCase({ ...editingCase, specialty: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850"
                  />
                </div>
              </div>

              {/* Advanced Goals Sub-Section inside Case Edit Modal */}
              <div className="bg-slate-50 p-4 border border-geometric-border rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b border-geometric-border pb-2 select-none font-display">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                     期初評估能力概況起點 與 學期核心目標清單配設
                  </span>
                  <button
                    type="button"
                    onClick={handleAddGoalToEditingCase}
                    className="flex items-center gap-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-geometric-accent px-2 py-1 rounded font-bold cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    多新增一項
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {editingCase.goals.map((goal, index) => (
                    <div key={goal.id} className="relative bg-white border border-slate-100 rounded-lg p-3 space-y-2 group">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          目標設定 {index + 1}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {/* 範本套用下拉選單 */}
                          <select
                            onChange={(e) => {
                              const tplId = e.target.value;
                              if (!tplId) return;
                              const selectedTpl = goalTemplates.find(t => t.id === tplId);
                              if (selectedTpl) {
                                handleGoalChange(index, 'baseline', selectedTpl.baseline);
                                handleGoalChange(index, 'target', selectedTpl.target);
                              }
                              e.target.value = ''; // 恢復預設
                            }}
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded cursor-pointer font-semibold max-w-[150px] sm:max-w-[220px] truncate"
                          >
                            <option value="">🍀套用臨床目標目標範本...</option>
                            {goalTemplates.map(t => (
                              <option key={t.id} value={t.id}>
                                [{t.category}] {t.baseline.substring(0, 18)}...
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteGoalFromEditingCase(goal.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-slate-50 transition cursor-pointer opacity-80 group-hover:opacity-100"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[10px] text-slate-400">本次期初表現能力現況描述 (Baseline)</label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleGoalChange(index, 'baseline', e.target.value);
                                }
                                e.target.value = '';
                              }}
                              className="text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-1 py-0.5 rounded cursor-pointer max-w-[124px] font-semibold focus:outline-hidden"
                            >
                              <option value="">📋 選擇期初能力範本</option>
                              {goalTemplates.map(t => (
                                <option key={t.id} value={t.baseline}>
                                  [{t.category}] {t.baseline.substring(0, 16)}...
                                </option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            required
                            rows={1.5}
                            value={goal.baseline}
                            onChange={(e) => handleGoalChange(index, 'baseline', e.target.value)}
                            placeholder="例：精細三指抓力過小，不自覺發起扭臀小動作配合..."
                            className="w-full text-xs p-1.5 border border-geometric-border rounded-md bg-white text-slate-700 font-medium"
                          />
                          
                          <div className="pt-0.5">
                            <AIGoalTargetGenerator
                              baseline={goal.baseline}
                              kidName={editingCase.name}
                              kidStage={editingCase.stage}
                              currentTarget={goal.target}
                              onApplyTarget={(targetText) => handleGoalChange(index, 'target', targetText)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[10px] text-slate-400">對應期望養成行為 (Target)</label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleGoalChange(index, 'target', e.target.value);
                                }
                                e.target.value = '';
                              }}
                              className="text-[9px] bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-100 px-1 py-0.5 rounded cursor-pointer max-w-[124px] font-semibold focus:outline-hidden"
                            >
                              <option value="">🎯 選擇期望目標範本</option>
                              {goalTemplates.map(t => (
                                <option key={t.id} value={t.target}>
                                  [{t.category}] {t.target.substring(0, 16)}...
                                </option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            required
                            rows={1.5}
                            value={goal.target}
                            onChange={(e) => handleGoalChange(index, 'target', e.target.value)}
                            placeholder="例：能精確熟練地手指指腹捏住2.5公分硬幣投入..."
                            className="w-full text-xs p-1.5 border border-geometric-border rounded-md bg-white text-slate-700 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer inside Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 select-none font-display">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="px-4 py-2 border border-geometric-border text-slate-750 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  放棄修改
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-geometric-accent hover:bg-geometric-active text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-md shadow-geometric-accent/15"
                >
                  儲存修改案卡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITING RECORD CARD */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-geometric-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-geometric-border">
            
            {/* Header */}
            <div className="bg-geometric-black text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-geometric-dark select-none">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-geometric-accent" />
                <h3 className="font-display font-black text-base sm:text-lg text-white">
                  【管制端管理】修改當堂療育分數評定與實錄
                </h3>
              </div>
              <button 
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRecordEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">療育課程日期</label>
                  <input
                    type="date"
                    required
                    value={editingRecord.date}
                    onChange={e => setEditingRecord({ ...editingRecord, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent font-semibold text-slate-850 font-mono"
                  />
                </div>
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg flex items-center">
                  <span className="text-[11px] text-slate-500">
                    對應個案姓名：<strong>{cases.find(c => c.id === editingRecord.caseId)?.name || '未知個案'}</strong>
                  </span>
                </div>
              </div>

              {/* Edit scores for goals list */}
              <div className="bg-slate-50 p-4 border border-geometric-border rounded-md space-y-3">
                <span className="font-display font-bold text-xs text-slate-800 block border-b border-geometric-border pb-1.5 select-none">
                  修改當次各個預設目標的表現指標評分 (-1 分 ~ 3 分)
                </span>

                <div className="space-y-3">
                  {(cases.find(c => c.id === editingRecord.caseId)?.goals || []).map((goal, index) => {
                    const currentScore = editingRecord.scores[goal.id] ?? 2;
                    return (
                      <div key={goal.id} className="bg-white border border-slate-100 rounded p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <span className="font-bold text-slate-500 block mb-1">目標 {index + 1} 養成目標重點</span>
                          <p className="text-slate-650 leading-normal font-sans font-medium text-[11px]">{goal.target}</p>
                        </div>
                        
                        <select
                          value={currentScore}
                          onChange={(e) => {
                            const newScores = { ...editingRecord.scores, [goal.id]: parseInt(e.target.value) };
                            setEditingRecord({ ...editingRecord, scores: newScores });
                          }}
                          className="px-2 py-1 border border-geometric-border rounded font-semibold font-display bg-slate-50 text-xs cursor-pointer focus:outline-hidden"
                        >
                          {SCORE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label} ({opt.description})</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-655 text-xs font-bold mb-1 font-display">當堂課堂核心療育活動實錄 (不超過 120 字)</label>
                <textarea
                  required
                  rows={3}
                  value={editingRecord.summary}
                  onChange={e => setEditingRecord({ ...editingRecord, summary: e.target.value })}
                  placeholder="請在此處精確登錄本次在課堂上的各項教導活動、口語配合和孩童發揮..."
                  className="w-full text-xs p-3 border border-geometric-border rounded-lg bg-white text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-655 text-xs font-bold mb-1 font-display">給予家長居家活動執行建議 (選填)</label>
                <textarea
                  rows={2}
                  value={editingRecord.homeActivityAdvice}
                  onChange={e => setEditingRecord({ ...editingRecord, homeActivityAdvice: e.target.value })}
                  placeholder="例：請媽媽本週在家洗完澡時，引導其自己用手扣衣扣3次..."
                  className="w-full text-xs p-2.5 border border-geometric-border rounded-lg bg-white text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1 font-display">家長返家後居家聯絡簿回饋</label>
                  <textarea
                    rows={2}
                    value={editingRecord.caregiverFeedback}
                    onChange={e => setEditingRecord({ ...editingRecord, caregiverFeedback: e.target.value })}
                    placeholder="例如：孩子回家練習時肯配合，但在手腕傾斜度上常需要爸爸托住輔助。"
                    className="w-full text-xs p-2.5 border border-geometric-border rounded-lg bg-white text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-655 text-xs font-bold mb-1.5 font-display">家長居家 homework 配合狀態</label>
                  <div className="grid grid-cols-2 gap-2 select-none font-display">
                    {Object.entries(HOME_ACTIVITY_STATUS_DETAILS).map(([st, conf]) => {
                      const isSelected = editingRecord.caregiverStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setEditingRecord({ ...editingRecord, caregiverStatus: st as HomeActivityStatus })}
                          className={`p-1.5 border rounded text-center transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                            isSelected
                              ? 'border-geometric-accent bg-geometric-accent text-white shadow-xs'
                              : 'border-geometric-border bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="text-sm font-extrabold">{conf.char}</span>
                          <span className="text-[10px]">{conf.label.substring(0, 4)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 font-normal leading-normal">
                    * 手寫電子簽名已被綁定存檔於記錄表背景，將無差別渲染。如若要修改家長聯絡人打字簽署，可在上課控制台進行。
                  </div>
                </div>
              </div>

              {/* Actions Footer inside Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-105 select-none font-display">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-geometric-border text-slate-750 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  放棄修改
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-geometric-accent hover:bg-geometric-active text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-md shadow-geometric-accent/15"
                >
                  儲存紀錄修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Compact helper mock to satisfy lucide icon if named CSV item mismatch
function ClipboardText(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 2h6v4H9z" />
      <path d="M8 11h8" />
      <path d="M8 15h8" />
    </svg>
  );
}
