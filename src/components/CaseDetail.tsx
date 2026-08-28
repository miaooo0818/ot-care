/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KidCase, LessonRecord, Goal, SCORE_OPTIONS, HOME_ACTIVITY_STATUS_DETAILS, GoalTemplate } from '../types';
import { 
  ArrowLeft, Calendar, Phone, Shield, Plus, Edit, Trash2, Printer, 
  ChevronRight, Sparkles, AlertCircle, Award, PenTool, CheckSquare, X, RefreshCw, Check, Clock
} from 'lucide-react';
import { calculateTherapyPeriodEnd, checkTherapyPeriodStatus } from '../utils/periodUtils';
import RenewPeriodModal from './RenewPeriodModal';
import AIGoalTargetGenerator from './AIGoalTargetGenerator';
import DomainBehaviorSelector from './DomainBehaviorSelector';

interface CaseDetailProps {
  kidCase: KidCase;
  records: LessonRecord[];
  goalTemplates: GoalTemplate[];
  onBack: () => void;
  onEditCase: (updatedCase: KidCase) => void;
  onAddRecord: () => void;
  onEditRecord: (record: LessonRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onPrintRecord: (record: LessonRecord) => void;
  onSaveGoalTemplate?: (template: { category?: string; baseline: string; target: string }) => void;
}

export default function CaseDetail({
  kidCase,
  records,
  goalTemplates,
  onBack,
  onEditCase,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onPrintRecord,
  onSaveGoalTemplate
}: CaseDetailProps) {
  // 控制 State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const [name, setName] = useState(kidCase.name);
  const [birthday, setBirthday] = useState(kidCase.birthday);
  const [caregiverName, setCaregiverName] = useState(kidCase.caregiverName);
  const [phone, setPhone] = useState(kidCase.phone);
  const [therapyPeriodStart, setTherapyPeriodStart] = useState(kidCase.therapyPeriodStart);
  const [selectedDuration, setSelectedDuration] = useState<3 | 6>(6);
  const [therapyPeriodEnd, setTherapyPeriodEnd] = useState(kidCase.therapyPeriodEnd);
  const [therapistName, setTherapistName] = useState(kidCase.therapistName);
  const [specialty, setSpecialty] = useState(kidCase.specialty);

  // Synchronize state when kidCase prop changes
  React.useEffect(() => {
    setName(kidCase.name);
    setBirthday(kidCase.birthday);
    setCaregiverName(kidCase.caregiverName);
    setPhone(kidCase.phone);
    setTherapyPeriodStart(kidCase.therapyPeriodStart);
    setTherapyPeriodEnd(kidCase.therapyPeriodEnd);
    setTherapistName(kidCase.therapistName);
    setSpecialty(kidCase.specialty);
  }, [kidCase]);

  // When therapyPeriodStart or selectedDuration changes in edit profile
  const handleStartMonthChange = (startVal: string) => {
    setTherapyPeriodStart(startVal);
    if (startVal) {
      setTherapyPeriodEnd(calculateTherapyPeriodEnd(startVal, selectedDuration));
    }
  };

  const handleDurationChange = (dur: 3 | 6) => {
    setSelectedDuration(dur);
    if (therapyPeriodStart) {
      setTherapyPeriodEnd(calculateTherapyPeriodEnd(therapyPeriodStart, dur));
    }
  };

  // Check period status for renewal banner/alert
  const periodStatus = checkTherapyPeriodStatus(kidCase.therapyPeriodEnd);

  // 目標管理 State
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newBaseline, setNewBaseline] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('精細動作');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // 計算兒童實際年齡
  const getAge = (birthdayStr: string) => {
    if (!birthdayStr) return 0;
    const birth = new Date(birthdayStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  const getAgeString = (birthdayStr: string) => {
    if (!birthdayStr) return '';
    const age = getAge(birthdayStr);
    return age > 0 ? `${age} 歲` : '嬰幼兒';
  };

  // 儲存個案基本資料
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // 依生日自動判辨階段（早療 vs 弱療）
    const birth = new Date(birthday);
    const today = new Date();
    let computedAge = today.getFullYear() - birth.getFullYear();
    const stageVal = computedAge < 6 ? 'early' : 'weak'; // 小於 6 歲為學齡前早療，否則為國小弱療

    onEditCase({
      ...kidCase,
      name,
      birthday,
      stage: stageVal,
      caregiverName,
      phone,
      therapyPeriodStart,
      therapyPeriodEnd,
      therapistName,
      specialty
    });
    setIsEditingProfile(false);
  };

  // 目標編輯與新增
  const handleAddOrEditGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaseline.trim() || !newTarget.trim()) return;

    let updatedGoals = [...kidCase.goals];
    if (editingGoalId) {
      // 編輯現有目標
      updatedGoals = updatedGoals.map(g => 
        g.id === editingGoalId ? { ...g, baseline: newBaseline, target: newTarget } : g
      );
    } else {
      // 新增目標
      const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        baseline: newBaseline,
        target: newTarget
      };
      updatedGoals.push(newGoal);
    }

    onEditCase({
      ...kidCase,
      goals: updatedGoals
    });

    // 自動將手動輸入/修改的目標建檔儲存至範本庫
    if (newBaseline.trim() && onSaveGoalTemplate) {
      onSaveGoalTemplate({
        category: selectedCategory || '精細動作',
        baseline: newBaseline.trim(),
        target: newTarget.trim(),
      });
    }

    setNewBaseline('');
    setNewTarget('');
    setSelectedCategory('精細動作');
    setEditingGoalId(null);
    setIsAddingGoal(false);
  };

  const handleStartEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewBaseline(goal.baseline);
    setNewTarget(goal.target);
    setIsAddingGoal(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('確定要刪除此項期初目標設定嗎？刪除目標將會移除未來或已登錄之對應評分！')) {
      const updatedGoals = kidCase.goals.filter(g => g.id !== goalId);
      onEditCase({
        ...kidCase,
        goals: updatedGoals
      });
    }
  };

  // 排序歷次紀錄（依日期從遠到近，繪圖使用；列表展示則從近到遠）
  const chronRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const descRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  // 動態自製 100% 穩定之大氣折線圖 SVG 產生器
  const renderInteractiveSVGProgressChart = () => {
    if (chronRecords.length === 0 || kidCase.goals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-slate-50 border border-slate-100 rounded-xl max-w-full text-slate-400">
          <AlertCircle className="w-8 h-8 opacity-40 mb-2" />
          <span className="text-xs">目前尚無課堂紀錄以生成進步趨勢</span>
        </div>
      );
    }

    // 寬高
    const width = 520;
    const height = 230;
    const paddingLeft = 40;
    const paddingRight = 40;
    const paddingTop = 25;
    const paddingBottom = 40;

    // 自適應橫軸 x 算法
    const pointsCount = chronRecords.length;
    const getX = (index: number) => {
      if (pointsCount <= 1) return paddingLeft + (width - paddingLeft - paddingRight) / 2;
      return paddingLeft + (index / (pointsCount - 1)) * (width - paddingLeft - paddingRight);
    };

    // 縱軸 y (-1 分到 3 分 共五個階梯)
    // 3分位於頂部，-1分位於底部
    const getY = (score: number) => {
      // clip score just in case
      const val = Math.max(-1, Math.min(3, score));
      // 0~4對應 -1, 0, 1, 2, 3
      const ratio = (val - (-1)) / 4; // 0 到 1 
      return height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
    };

    // 目標專用配色 (與 Geometric Balance 幾何平衡色系相符)
    const goalColors = [
      { stroke: '#4F46E5', bg: '#EEF2F6', text: 'text-indigo-600' }, // indigo
      { stroke: '#0891B2', bg: '#ECFEFF', text: 'text-cyan-700' }, // cyan
      { stroke: '#F59E0B', bg: '#FEF3C7', text: 'text-amber-700' }, // amber
      { stroke: '#8B5CF6', bg: '#F5F3FF', text: 'text-purple-700' }, // violet/purple
    ];

    return (
      <div className="bg-white p-4 border border-geometric-border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-display font-bold text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-geometric-accent" />
            各目標學期能力表現折線圖 (-1分 ~ 3分)
          </h4>
          <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
            {kidCase.goals.map((g, idx) => {
              const color = goalColors[idx % goalColors.length];
              return (
                <div key={g.id} className="flex items-center gap-1 font-display font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color.stroke }}></span>
                  <span className="text-slate-600 truncate max-w-[80px]">目標 {idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[480px] h-auto overflow-visible select-none">
            {/* 橫向格線 grid Y */}
            {[-1, 0, 1, 2, 3].map((scoreVal) => {
              const py = getY(scoreVal);
              return (
                <g key={scoreVal}>
                  <line 
                    x1={paddingLeft} 
                    y1={py} 
                    x2={width - paddingRight} 
                    y2={py} 
                    stroke="#F1F5F9" 
                    strokeWidth={1} 
                    strokeDasharray="2 2" 
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={py + 4} 
                    className="text-[9px] font-mono fill-slate-400 text-right" 
                    textAnchor="end"
                  >
                    {scoreVal}F
                  </text>
                </g>
              );
            })}

            {/* 繪製每一筆目標的折線與數據點 */}
            {kidCase.goals.map((g, gIdx) => {
              const color = goalColors[gIdx % goalColors.length];
              const pathPoints = chronRecords.map((rec, rIdx) => {
                const s = rec.scores[g.id] ?? 2; // 若未填寫預設2
                return `${getX(rIdx)},${getY(s)}`;
              });
              const dStr = pathPoints.length > 0 ? `M ${pathPoints.join(' L ')}` : '';

              return (
                <g key={g.id}>
                  {/* 折線 */}
                  {dStr && (
                    <path
                      d={dStr}
                      fill="none"
                      stroke={color.stroke}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* 數據小實心圓與分數標註 */}
                  {chronRecords.map((rec, rIdx) => {
                    const s = rec.scores[g.id] ?? 2;
                    const cx = getX(rIdx);
                    const cy = getY(s);
                    return (
                      <g key={rec.id} className="group cursor-help">
                        {/* 互動大圓 */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill={color.stroke}
                          opacity={0}
                          className="hover:opacity-25 transition-opacity duration-150"
                        />
                        {/* 實心圓 */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#ffffff"
                          stroke={color.stroke}
                          strokeWidth={2.5}
                        />
                        {/* 分數文字卡 */}
                        <text
                          x={cx}
                          y={cy - 8}
                          className={`text-[9px] font-bold ${color.text} text-center`}
                          textAnchor="middle"
                        >
                          {s}分
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* X 軸日期標示 */}
            {chronRecords.map((rec, rIdx) => {
              const px = getX(rIdx);
              // 簡短日期月/日
              const dateObj = new Date(rec.date);
              const dateLabel = isNaN(dateObj.getTime()) ? rec.date : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              return (
                <text
                  key={rec.id}
                  x={px}
                  y={height - paddingBottom + 16}
                  className="text-[9px] font-semibold fill-slate-500"
                  textAnchor="middle"
                >
                  {dateLabel}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 頂部操作與返回 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-geometric-accent font-display font-semibold text-sm cursor-pointer transition"
        >
          <ArrowLeft className="w-4 h-4" />
          返回治療師工作台
        </button>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto font-display">
          <button
            onClick={() => setIsRenewModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-geometric-accent border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition w-full sm:w-auto justify-center shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            建立新一期檔案 / 續期
          </button>
          <button
            onClick={() => setIsEditingProfile(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-geometric-border hover:bg-slate-50 text-slate-705 rounded-lg text-xs font-bold cursor-pointer transition w-full sm:w-auto justify-center"
          >
            <Edit className="w-3.5 h-3.5 text-slate-400" />
            編輯個案基本資料
          </button>
          <button
            onClick={onAddRecord}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg text-xs font-bold cursor-pointer transition w-full sm:w-auto justify-center shadow-md shadow-geometric-accent/15"
          >
            <Plus className="w-4 h-4" />
            登錄新一堂課療育紀錄
          </button>
        </div>
      </div>

      {/* 療育期程到期 / 即將屆滿通知橫幅 */}
      {(periodStatus.isExpired || periodStatus.isExpiringSoon) && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in ${
          periodStatus.isExpired 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-950' 
            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              periodStatus.isExpired ? 'bg-amber-500/20 text-amber-700' : 'bg-indigo-500/20 text-indigo-700'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-sm flex items-center gap-2">
                <span>療育期限通知：{periodStatus.isExpired ? '原療育期程已到期' : '原療育期程即將於本月屆滿'}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  periodStatus.isExpired ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {kidCase.therapyPeriodStart} ~ {kidCase.therapyPeriodEnd}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                原療育期限已屆滿，請老師建立新一期檔案。系統將自動帶入舊有個案資料與前期目標作為參照，協助您快速訂定新學期目標。
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRenewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-geometric-black hover:bg-geometric-dark text-white rounded-lg text-xs font-display font-bold transition shrink-0 cursor-pointer shadow-sm select-none"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            立即建立新一期檔案
          </button>
        </div>
      )}

      {/* 個案精緻名片區 */}
      <div className="bg-geometric-black text-white rounded-xl overflow-hidden p-6 relative border border-geometric-dark/30 shadow-md">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none select-none">
          <Shield className="w-64 h-64" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-display font-black tracking-wide">{kidCase.name}</h2>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded text-slate-300 border border-white/5 font-mono">
                {getAgeString(kidCase.birthday)}
              </span>
              <span className={`text-[10px] px-2.5 py-1.5 rounded font-display font-bold uppercase tracking-wider ${
                kidCase.stage === 'early' 
                  ? 'bg-indigo-500/20 text-indigo-350 border border-indigo-500/30' 
                  : 'bg-emerald-500/20 text-emerald-350 border border-emerald-500/30'
              }`}>
                {kidCase.stage === 'early' ? '早療：學齡前' : '弱療：國小年紀'}
              </span>
            </div>
            
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              服務期間：{kidCase.therapyPeriodStart} ~ {kidCase.therapyPeriodEnd}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-4 text-xs sm:text-sm text-slate-300">
            <div>
              <span className="block text-slate-500 font-display font-bold mb-0.5 text-[11px] uppercase tracking-wider">兒童生日</span>
              <span className="font-semibold text-white font-mono">{kidCase.birthday}</span>
            </div>
            <div>
              <span className="block text-slate-500 font-display font-bold mb-0.5 text-[11px] uppercase tracking-wider">主要照顧者</span>
              <span className="font-semibold text-white">{kidCase.caregiverName}</span>
            </div>
            <div className="flex items-center gap-1">
              <div>
                <span className="block text-slate-500 font-display font-bold mb-0.5 text-[11px] uppercase tracking-wider">聯絡電話</span>
                <span className="font-semibold text-white font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {kidCase.phone}
                </span>
              </div>
            </div>
            <div>
              <span className="block text-slate-500 font-display font-bold mb-0.5 text-[11px] uppercase tracking-wider">負責人 / 專業別</span>
              <span className="font-semibold text-geometric-active">{kidCase.therapistName} ({kidCase.specialty})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 目標設定與進度圖表 (Bento Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左側：期初目標 */}
        <div className="lg:col-span-6 bg-white border border-geometric-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 select-none">
              <CheckSquare className="w-4 h-4 text-geometric-accent" />
              本學段期初療育目標設定
            </h3>
            
            <button
              onClick={() => {
                setEditingGoalId(null);
                setNewBaseline('');
                setNewTarget('');
                setIsAddingGoal(true);
              }}
              className="flex items-center gap-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-geometric-accent px-2 py-1 rounded font-display font-bold transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              新增目標項
            </button>
          </div>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
            {kidCase.goals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded select-none font-medium">
                目前尚未設定目標項目。請點擊「新增目標項」建立
              </div>
            ) : (
              kidCase.goals.map((g, idx) => (
                <div key={g.id} className="relative group border border-slate-100 rounded-lg p-3.5 bg-slate-50/50 hover:bg-slate-50 hover:border-geometric-border transition space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="px-2 py-0.5 bg-indigo-50 text-geometric-accent font-display font-bold rounded-sm text-[10px] font-mono border border-indigo-100">
                      項目 {idx + 1}
                    </span>
                    <div className="flex items-center gap-2 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEditGoal(g)}
                        className="text-slate-500 hover:text-slate-900 transition p-1 hover:bg-white rounded border border-transparent hover:border-slate-100 cursor-pointer"
                        title="編輯此項目標"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-rose-500 hover:text-rose-750 transition p-1 hover:bg-white rounded border border-transparent hover:border-slate-100 cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-400">本次期初表現現況描述：</span>
                      <p className="text-slate-700 font-semibold pl-1">{g.baseline}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-geometric-accent">預期達成之療育目標行為：</span>
                      <p className="text-geometric-black font-semibold pl-1 p-1 bg-white border border-slate-100 rounded">{g.target}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右側：折線圖進度追蹤 */}
        <div className="lg:col-span-6">
          {renderInteractiveSVGProgressChart()}
        </div>
      </div>

      {/* 歷次療育服務紀錄歷程 */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 select-none">
          <Award className="w-4 h-4 text-geometric-accent" />
          歷次療育課後分數表現與紀錄歷程 ({records.length} 堂)
        </h3>

        {descRecords.length === 0 ? (
          <div className="bg-white p-12 text-center border border-dashed border-geometric-border rounded-xl space-y-3">
            <PenTool className="w-10 h-10 text-slate-350 mx-auto" />
            <div className="text-slate-500 text-sm font-display font-bold">本個案尚未登錄療育課後紀錄</div>
            <p className="text-xs text-slate-400">點選上方的「登錄新一堂課療育紀錄」開始登錄課後評分與居家活動回饋！</p>
            <button
              onClick={onAddRecord}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-geometric-accent text-white hover:bg-geometric-active text-xs rounded-lg font-bold transition cursor-pointer shadow-xs font-display"
            >
              <Plus className="w-3.5 h-3.5" />
              登錄第一堂課
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {descRecords.map((rec) => {
              return (
                <div key={rec.id} className="bg-white border border-geometric-border rounded-lg overflow-hidden shadow-xs hover:shadow-md transition flex flex-col md:flex-row">
                  
                  {/* 左側日期大板塊 */}
                  <div className="w-full md:w-48 bg-slate-50 p-4 border-b md:border-b-0 md:border-r border-geometric-border flex flex-row md:flex-col justify-between items-center shrink-0">
                    <div className="flex md:flex-col gap-1.5 md:gap-0 font-medium md:text-center items-center">
                      <span className="text-[11px] text-slate-400 font-display font-bold block uppercase">療育課程日期</span>
                      <span className="text-sm font-black text-geometric-black md:text-lg tracking-wide md:mt-1 font-mono">{rec.date}</span>
                    </div>

                    <div className="flex gap-2 mt-2 md:mt-4 select-none">
                      <button
                        onClick={() => onEditRecord(rec)}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-geometric-border text-slate-600 hover:text-slate-900 rounded cursor-pointer transition"
                        title="編輯這堂課紀錄"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onPrintRecord(rec)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-geometric-accent border border-indigo-2 w-full roun cursor-pointer transition flex items-center justify-center gap-1 text-[11px] font-bold"
                        title="預覽與列印臺中市服務記錄表"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        列印
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('確定要永久刪除此筆服務紀錄嗎？（此動作不可還原）')) {
                            onDeleteRecord(rec.id);
                          }
                        }}
                        className="p-1.5 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 border border-geometric-border rounded cursor-pointer transition"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 右側詳細內容 */}
                  <div className="flex-1 p-5 space-y-4">
                    {/* 第一排：各個目標的分數 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2 border border-slate-100 rounded-lg">
                      {kidCase.goals.map((g, gi) => {
                        const val = rec.scores[g.id] ?? 2;
                        return (
                          <div key={g.id} className="flex justify-between items-center text-xs p-1.5 bg-white rounded border border-slate-100">
                            <span className="font-display font-bold text-slate-500">目標 {gi + 1} 表現</span>
                            <span className={`font-mono font-bold px-1.5 py-0.5 rounded-sm text-[11px] ${
                              val === 3 ? 'text-[#065F46] bg-[#D1FAE5]' :
                              val === 2 ? 'text-[#1E40AF] bg-[#DBEAFE]' :
                              val === 1 ? 'text-[#92400E] bg-[#FEF3C7]' :
                              val === 0 ? 'text-slate-600 bg-slate-100' :
                              'text-red-750 bg-red-100'
                            }`}>
                              {val} 分
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 當堂活動簡述 */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-display font-bold text-slate-400 block tracking-wider uppercase">療育課程實錄</span>
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {rec.summary}
                      </p>
                    </div>

                    {/* 居家活動與反饋 */}
                    {(rec.homeActivityAdvice || rec.caregiverFeedback || rec.caregiverStatus) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs">
                        
                        {/* 居家建議 */}
                        <div className="space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                          <span className="font-display font-bold text-slate-500 block">★ 職能治療師居家活動指導</span>
                          <p className="text-[11px] sm:text-xs text-slate-755 leading-normal">
                            {rec.homeActivityAdvice || '（本次上課暫無居家指定活動）'}
                          </p>
                        </div>

                        {/* 家長反饋 */}
                        <div className="space-y-2 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                          <div className="flex justify-between items-center">
                            <span className="font-display font-bold text-slate-500 block">★ 家長居家執行回饋欄</span>
                            {rec.caregiverStatus && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                HOME_ACTIVITY_STATUS_DETAILS[rec.caregiverStatus as 'check'|'cross'|'delta'|'circle']?.color || ''
                              }`}>
                                {HOME_ACTIVITY_STATUS_DETAILS[rec.caregiverStatus as 'check'|'cross'|'delta'|'circle']?.char}{' '}
                                {HOME_ACTIVITY_STATUS_DETAILS[rec.caregiverStatus as 'check'|'cross'|'delta'|'circle']?.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-755 leading-normal">
                            {rec.caregiverFeedback || '（尚未收到家長本堂居家回饋）'}
                          </p>
                          {rec.signature && (
                            <div className="flex items-center justify-end gap-1.5 border-t border-dashed border-slate-200 pt-1.5 select-none text-[10px]">
                              <span className="text-slate-400">家長親體認證：</span>
                              {rec.signature.startsWith('data:image') ? (
                                <img src={rec.signature} alt="簽章" className="max-h-6 object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="font-semibold text-slate-700 underline underline-offset-2">{rec.signature}</span>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 編輯個案資料彈出視窗 */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-geometric-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden border border-geometric-border">
            <div className="bg-geometric-black text-white px-6 py-4 flex justify-between items-center border-b border-geometric-dark">
              <h3 className="font-display font-extrabold text-base flex items-center gap-1.5 text-white">
                <Edit className="w-5 h-5 text-geometric-accent" />
                修改『{kidCase.name}』的基本資料
              </h3>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">兒童姓名</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">兒童生日</label>
                  <input
                    type="date"
                    required
                    value={birthday}
                    onChange={e => setBirthday(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">主要照顧者姓名</label>
                  <input
                    type="text"
                    required
                    value={caregiverName}
                    onChange={e => setCaregiverName(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">聯絡電話</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 border border-geometric-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold text-xs">
                    療育期間設定
                  </label>
                  <div className="flex gap-1.5 select-none">
                    <button
                      type="button"
                      onClick={() => handleDurationChange(6)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                        selectedDuration === 6
                          ? 'bg-geometric-accent text-white border-geometric-accent shadow-xs'
                          : 'bg-white text-slate-600 border-geometric-border hover:bg-slate-100'
                      }`}
                    >
                      {selectedDuration === 6 && <Check className="w-3 h-3" />}
                      半年 (6個月)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDurationChange(3)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                        selectedDuration === 3
                          ? 'bg-geometric-accent text-white border-geometric-accent shadow-xs'
                          : 'bg-white text-slate-600 border-geometric-border hover:bg-slate-100'
                      }`}
                    >
                      {selectedDuration === 3 && <Check className="w-3 h-3" />}
                      三個月
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1 font-semibold">
                      起始月份 (自選) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="month"
                      required
                      value={therapyPeriodStart}
                      onChange={e => handleStartMonthChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1 font-semibold">
                      療育期間 (訖) (自動計算) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="month"
                      required
                      value={therapyPeriodEnd}
                      onChange={e => setTherapyPeriodEnd(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1">負責人員/老師姓名</label>
                  <input
                    type="text"
                    required
                    value={therapistName}
                    onChange={e => setTherapistName(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">物理、職能專業分群別</label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-2 border border-geometric-border rounded text-[10px] text-gray-400 font-normal leading-normal">
                提示：系統會依「兒童生日」自動判定個案階段。小於 6 歲自動歸類為「學齡前（早療）」，6 歲（含）以上歸為「國小年紀（弱療）」。
              </div>

              <div className="flex justify-end gap-3 pt-3 select-none font-display">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-geometric-border text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg transition cursor-pointer"
                >
                  儲存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增或修改期初目標彈窗 */}
      {isAddingGoal && (
        <div className="fixed inset-0 z-50 bg-geometric-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden text-xs border border-geometric-border">
            <div className="bg-geometric-black text-white px-5 py-3.5 flex justify-between items-center border-b border-geometric-dark">
              <h3 className="font-display font-bold text-sm text-white">
                {editingGoalId ? '修改期初目標設定' : '新增期初目標項目'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingGoal(false);
                  setEditingGoalId(null);
                  setNewBaseline('');
                  setNewTarget('');
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrEditGoalSubmit} className="p-5 space-y-4 font-semibold">
              {/* 領域 ➔ 行為表現 兩階段範本選單 */}
              <DomainBehaviorSelector
                goalTemplates={goalTemplates}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                onSelectTemplate={(tpl) => {
                  setNewBaseline(tpl.baseline);
                  setNewTarget(tpl.target);
                  setSelectedCategory(tpl.category);
                }}
                onSaveNewTemplate={(tplData) => {
                  if (onSaveGoalTemplate) {
                    onSaveGoalTemplate(tplData);
                  }
                }}
                currentBaseline={newBaseline}
                currentTarget={newTarget}
              />

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    期初能力行為現況描述 (Baseline) <span className="text-slate-400 font-normal">（可由上方選單挑選或手動編輯）</span>
                  </label>
                  <textarea
                    required
                    rows={2.5}
                    placeholder="例如：三指抓握畫筆時力道不勻，握筆過緊；或無法穩定雙腳離地向前連續跳躍..."
                    value={newBaseline}
                    onChange={e => setNewBaseline(e.target.value)}
                    className="w-full text-xs p-2.5 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent bg-white text-slate-800 font-medium"
                  />
                </div>

                {/* AI 智能量化目標生成工具 */}
                <div className="pt-0.5">
                  <AIGoalTargetGenerator
                    baseline={newBaseline}
                    kidName={kidCase.name}
                    kidAge={getAge(kidCase.birthday)}
                    kidStage={kidCase.stage}
                    therapyDuration={`${kidCase.therapyPeriodStart} ~ ${kidCase.therapyPeriodEnd}`}
                    customFocus={selectedCategory}
                    currentTarget={newTarget}
                    onApplyTarget={(targetText) => setNewTarget(targetText)}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    預期達成之療育目標行為 (Target) <span className="text-slate-400 font-normal">（可點擊上方 AI 智能生成直接套用）</span>
                  </label>
                  <textarea
                    required
                    rows={2.5}
                    placeholder="例如：能穩定採用動態三指握姿在 2 公分正方形格內著色不超出邊界，達成率 80%..."
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    className="w-full text-xs p-2.5 border border-geometric-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-geometric-accent bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 select-none font-bold font-display">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGoal(false);
                    setEditingGoalId(null);
                    setNewBaseline('');
                    setNewTarget('');
                  }}
                  className="px-3 py-1.5 border border-geometric-border text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-geometric-accent hover:bg-geometric-active text-white rounded-lg cursor-pointer"
                >
                  確認
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 建立新一期檔案 / 續期彈窗 */}
      <RenewPeriodModal
        kidCase={kidCase}
        goalTemplates={goalTemplates}
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        onConfirmRenewal={(renewedCase) => {
          onEditCase(renewedCase);
        }}
        onSaveGoalTemplate={onSaveGoalTemplate}
      />

    </div>
  );
}
