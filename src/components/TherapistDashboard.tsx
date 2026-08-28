/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KidCase, KidStage, GoalTemplate, Therapist } from '../types';
import { 
  Search, Plus, Shield, Users, Award, BookOpen, Clock, 
  Baby, GraduationCap, ChevronRight, X, Phone, Calendar, ClipboardList 
} from 'lucide-react';

interface TherapistDashboardProps {
  cases: KidCase[];
  recordsCountMap: { [caseId: string]: number };
  goalTemplates: GoalTemplate[];
  therapist: Therapist;
  onSelectCase: (caseId: string) => void;
  onAddCase: (newCase: KidCase) => void;
}

export default function TherapistDashboard({ 
  cases, 
  recordsCountMap, 
  goalTemplates,
  therapist,
  onSelectCase, 
  onAddCase 
}: TherapistDashboardProps) {
  // 搜尋過濾 State
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | KidStage>('all');
  
  // 新增個案 State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [therapyPeriodStart, setTherapyPeriodStart] = useState('2026-05');
  const [therapyPeriodEnd, setTherapyPeriodEnd] = useState('2026-10');
  
  // 隨案直接添加第一條期初目標，以便快速體驗
  const [initBaseline, setInitBaseline] = useState('');
  const [initTarget, setInitTarget] = useState('');

  // 算年齡
  const getAge = (birthdayStr: string) => {
    if (!birthdayStr) return 0;
    const birth = new Date(birthdayStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 提交新增
  const handleSubmitCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthday || !caregiverName || !phone) return;

    // 自動依據生日判定學齡前(早療)還是國小(弱療)
    const ageVal = getAge(birthday);
    const computedStage: KidStage = ageVal < 6 ? 'early' : 'weak';

    // 建立目標
    const initialGoals = [];
    if (initBaseline.trim() && initTarget.trim()) {
      initialGoals.push({
        id: `goal_${Date.now()}_1`,
        baseline: initBaseline.trim(),
        target: initTarget.trim()
      });
    } else {
      // 預設一條基本範例目標，防止空白
      initialGoals.push({
        id: `goal_${Date.now()}_default`,
        baseline: computedStage === 'early' 
          ? '精細抓握力道及手掌核心控制不穩。' 
          : '書寫握筆過度吃力，筆控能力及結構知覺待加強。',
        target: computedStage === 'early' 
          ? '能穩定使用三指拿捏積木堆高5層。' 
          : '能將中文字寫在2x2公分格線中央不偏出。'
      });
    }

    const newCase: KidCase = {
      id: `case_${Date.now()}`,
      name,
      birthday,
      stage: computedStage,
      caregiverName,
      phone,
      therapistName: therapist.name,
      specialty: therapist.specialty,
      therapyPeriodStart,
      therapyPeriodEnd,
      goals: initialGoals,
      createdAt: new Date().toISOString()
    };

    onAddCase(newCase);

    // 重設 form
    setName('');
    setBirthday('');
    setCaregiverName('');
    setPhone('');
    setInitBaseline('');
    setInitTarget('');
    setIsAddOpen(false);
  };

  // 過濾名單
  const filteredCases = cases.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.caregiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.includes(searchQuery);
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // 計算基本統計資料
  const earlyCount = cases.filter(c => c.stage === 'early').length;
  const weakCount = cases.filter(c => c.stage === 'weak').length;
  const totalClasses = Object.values(recordsCountMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      
      {/* 職能治療師看板說明 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white p-6 border border-geometric-border rounded-xl shadow-xs">
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center gap-2 select-none">
            <Shield className="w-5 h-5 text-geometric-accent" />
            <span className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-widest">職能治療師 OT 系統終端</span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-black text-geometric-black tracking-tight leading-tight">
            {therapist.name} 老師，您好！
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            本紀錄系統融合了<span className="text-geometric-accent font-semibold">早療（學齡前 0~6 歲兒童，主攻感覺統合與精細動作）</span>與<span className="text-indigo-600 font-semibold">弱療（國小 6~12 歲，主攻寫字、抄寫空間知覺與情緒調節規則）</span>個案管理，幫助您無縫設定期初目標並快速且高品質地登錄課後表現分數與居家活動，即時匯出與列印「臺中市早期療育服務記錄表」。
          </p>
        </div>

        {/* 核心統計 Bento Cards */}
        <div className="md:col-span-5 grid grid-cols-3 gap-3">
          <div className="bg-slate-50/50 border border-geometric-border p-3 rounded-lg flex flex-col justify-between hover:border-geometric-accent/30 transition">
            <div className="flex justify-between items-center text-slate-700">
              <Baby className="w-4 h-4 text-geometric-accent opacity-90" />
              <span className="text-[10px] font-display font-bold">學齡前早療</span>
            </div>
            <div className="mt-2">
              <span className="text-lg md:text-2xl font-black text-geometric-black font-display">{earlyCount}</span>
              <span className="text-[10px] text-slate-500 ml-1">案</span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-geometric-border p-3 rounded-lg flex flex-col justify-between hover:border-indigo-500/30 transition">
            <div className="flex justify-between items-center text-indigo-700">
              <GraduationCap className="w-4 h-4 text-indigo-500 opacity-90" />
              <span className="text-[10px] font-display font-bold">國小弱療</span>
            </div>
            <div className="mt-2">
              <span className="text-lg md:text-2xl font-black text-geometric-black font-display">{weakCount}</span>
              <span className="text-[10px] text-slate-500 ml-1">案</span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-geometric-border p-3 rounded-lg flex flex-col justify-between hover:border-slate-400/30 transition">
            <div className="flex justify-between items-center text-slate-700">
              <ClipboardList className="w-4 h-4 text-slate-500 opacity-90" />
              <span className="text-[10px] font-display font-bold">服務堂數</span>
            </div>
            <div className="mt-2">
              <span className="text-lg md:text-2xl font-black text-geometric-black font-display">{totalClasses}</span>
              <span className="text-[10px] text-slate-500 ml-1">堂</span>
            </div>
          </div>
        </div>
      </div>

      {/* 系統說明橫幅 */}
      <div className="bg-geometric-black text-white rounded-xl p-5 border border-geometric-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs font-display font-bold text-amber-300">階段專業分流指引：</span>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              <strong>早療學齡前：</strong>評估學齡期前粗細大動作平衡。<strong>弱療國小年紀：</strong>側重寫字手腕曲度、課文行距跳漏字視覺追蹤、桌遊輸贏挫折情緒調適。每次上課均能登錄 ✖✔Δ○ 居家活動狀況並親筆電子認證簽章。
            </p>
          </div>
        </div>
      </div>

      {/* 控制操作列：搜尋、過濾、接案新增 */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-geometric-border rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* 搜尋 */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜尋個案姓名/主要照顧者/電話..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent focus:bg-white text-slate-700 transition"
            />
          </div>

          {/* 篩選標籤 */}
          <div className="flex gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 select-none">
            <button
              onClick={() => setStageFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border cursor-pointer ${
                stageFilter === 'all'
                  ? 'bg-geometric-black text-white border-geometric-black font-display shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-geometric-border font-display'
              }`}
            >
              全部階段
            </button>
            <button
              onClick={() => setStageFilter('early')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border cursor-pointer ${
                stageFilter === 'early'
                  ? 'bg-geometric-accent text-white border-geometric-accent font-display shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-geometric-accent border-geometric-border font-display'
              }`}
            >
              早療 (學齡前)
            </button>
            <button
              onClick={() => setStageFilter('weak')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border cursor-pointer ${
                stageFilter === 'weak'
                  ? 'bg-indigo-600 text-white border-indigo-600 font-display shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-indigo-600 border-geometric-border font-display'
              }`}
            >
              弱療 (國小)
            </button>
          </div>
        </div>

        {/* 接案登錄按鈕 */}
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg text-xs font-bold transition w-full sm:w-auto justify-center cursor-pointer shadow-md shadow-geometric-accent/15 select-none font-display"
        >
          <Plus className="w-4 h-4" />
          接案新登錄個案
        </button>
      </div>

      {/* 個案資料清單 */}
      <div className="bg-white border border-geometric-border rounded-xl overflow-hidden shadow-xs">
        {filteredCases.length === 0 ? (
          <div className="p-16 text-center text-slate-400 select-none space-y-2">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-1" />
            <div className="font-display font-bold text-slate-500">查無任何符合條件的個案資料</div>
            <p className="text-xs">請微調上方搜尋語句，或按「接案新登錄個案」建立。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-geometric-border font-display font-bold text-slate-500 select-none text-[11px] uppercase tracking-wider">
                  <th className="p-4 w-[25%]" id="child-col">兒童姓名 / 年齡 / 生日</th>
                  <th className="p-4 w-[20%]" id="stage-col">早弱療階段分類</th>
                  <th className="p-4 w-[20%]" id="caregiver-col">主要照顧者 / 電訪電話</th>
                  <th className="p-4 w-[15%]" id="goals-col">期初目標設定數</th>
                  <th className="p-4 w-[10%]" id="classes-col">課堂紀錄</th>
                  <th className="p-4 text-right w-[10%]" id="actions-col">操作選項</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCases.map(c => {
                  const rCount = recordsCountMap[c.id] || 0;
                  const age = getAge(c.birthday);
                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50/50 transition cursor-pointer"
                      onClick={() => onSelectCase(c.id)}
                    >
                      {/* 姓名生日 */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-display font-black text-sm text-geometric-black tracking-wide">{c.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                            生日：{c.birthday} ({age} 歲)
                          </span>
                        </div>
                      </td>

                      {/* 階段 */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-display font-bold text-[10px] border ${
                          c.stage === 'early' 
                            ? 'bg-indigo-50 text-geometric-accent border-indigo-100' 
                            : 'bg-slate-50 text-indigo-700 border-slate-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {c.stage === 'early' ? '學齡前 (早療)' : '國小年紀 (弱療)'}
                        </span>
                      </td>

                      {/* 主要照顧者 */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-semibold">{c.caregiverName}</span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-300" />
                            {c.phone}
                          </span>
                        </div>
                      </td>

                      {/* 目標 */}
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-geometric-border rounded font-bold font-mono text-[11px]">
                            {c.goals.length} 項
                          </span>
                        </div>
                      </td>

                      {/* 課次數 */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold font-mono text-[11px] border ${
                          rCount > 0 ? 'bg-indigo-50 text-geometric-accent border-indigo-200' : 'bg-slate-50 text-slate-450 border-slate-100'
                        }`}>
                          {rCount} 堂
                        </span>
                      </td>

                      {/* 按鈕 */}
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectCase(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-geometric-black text-white hover:bg-geometric-dark text-[10px] font-display font-bold transition shadow-xs cursor-pointer"
                        >
                          紀錄詳情 / 登錄
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 接案登錄新個案彈出視窗 */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-geometric-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-geometric-border">
            
            {/* Header */}
            <div className="bg-geometric-black text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-geometric-dark">
              <div>
                <h3 className="font-display font-extrabold text-base flex items-center gap-1.5 select-none text-white">
                  <ClipboardList className="w-5 h-5 text-geometric-accent" />
                  新接案登錄 - 兒童基本資料與期初設定
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">輸入兒童生日，系統將智能分流為早療或弱療分類卡</p>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form 身分 */}
            <form onSubmit={handleSubmitCase} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">兒童姓名 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例如：林大童"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">兒童生日 (自動判定分類) <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={birthday}
                    onChange={e => setBirthday(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs bg-white text-slate-800"
                  />
                  <span className="text-[10px] text-gray-400 font-normal mt-0.5 block">
                    * 生日小於 6 歲判定為「學齡前早療」，6 歲含以上為「國小弱療」。
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">主要照顧者姓名 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例如：陳媽媽"
                    value={caregiverName}
                    onChange={e => setCaregiverName(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">聯絡電話 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="格式：0912-345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">療育期間 (起) <span className="text-rose-500">*</span></label>
                  <input
                    type="month"
                    required
                    value={therapyPeriodStart}
                    onChange={e => setTherapyPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">療育期間 (迄) <span className="text-rose-500">*</span></label>
                  <input
                    type="month"
                    required
                    value={therapyPeriodEnd}
                    onChange={e => setTherapyPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* 期初目標：隨案附帶設定第一條，提高流暢度 */}
              <div className="bg-slate-50 p-4 border border-geometric-border rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-geometric-border pb-1.5 select-none">
                  <span className="font-display font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                    隨案設定首件期初目標 (選填，可於個案詳情新增更多)
                  </span>

                  {/* 範本套用下拉選單 */}
                  <select
                    onChange={(e) => {
                      const tplId = e.target.value;
                      if (!tplId) return;
                      const selectedTpl = goalTemplates.find(t => t.id === tplId);
                      if (selectedTpl) {
                        setInitBaseline(selectedTpl.baseline);
                        setInitTarget(selectedTpl.target);
                      }
                      e.target.value = ''; // 恢復
                    }}
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer font-bold max-w-[180px] truncate"
                  >
                    <option value="">🍀套用臨床目標目標範本...</option>
                    {goalTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.category}] {t.baseline.substring(0, 18)}...
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 mb-0.5">
                      <label className="block text-slate-500 text-[11px]">期初能力行為現況描述</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setInitBaseline(e.target.value);
                          }
                          e.target.value = '';
                        }}
                        className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350 px-1 py-0.5 rounded cursor-pointer max-w-[200px] font-semibold focus:outline-hidden"
                      >
                        <option value="">📋 選擇期初能力範本...</option>
                        {goalTemplates.map(t => (
                          <option key={t.id} value={t.baseline}>
                            [{t.category}] {t.baseline.substring(0, 18)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      rows={1.5}
                      placeholder="例：精細三指抓握力氣不均，常超出書寫格線範圍外"
                      value={initBaseline}
                      onChange={e => setInitBaseline(e.target.value)}
                      className="w-full text-xs p-2 border border-geometric-border rounded-md focus:outline-hidden focus:ring-1 focus:ring-geometric-accent bg-white text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 mb-0.5">
                      <label className="block text-slate-500 text-[11px]">預期達成之療育目標行為</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setInitTarget(e.target.value);
                          }
                          e.target.value = '';
                        }}
                        className="text-[9px] bg-sky-50 hover:bg-sky-100 text-sky-850 border border-sky-150 px-1 py-0.5 rounded cursor-pointer max-w-[200px] font-semibold focus:outline-hidden"
                      >
                        <option value="">🎯 選擇期待目標範本...</option>
                        {goalTemplates.map(t => (
                          <option key={t.id} value={t.target}>
                            [{t.category}] {t.target.substring(0, 18)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      rows={1.5}
                      placeholder="例：能成熟地將中文字在 2 公分正方格中央書寫不溢出"
                      value={initTarget}
                      onChange={e => setInitTarget(e.target.value)}
                      className="w-full text-xs p-2 border border-geometric-border rounded-md focus:outline-hidden focus:ring-1 focus:ring-geometric-accent bg-white text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 select-none font-display">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-geometric-border text-slate-700 rounded-lg hover:bg-slate-50 transition font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg transition font-bold cursor-pointer"
                >
                  同案建立並開卡
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
