/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type KidStage = 'early' | 'weak'; // 'early': 早療-學齡前 (Preschool), 'weak': 弱療-國小年紀 (Elementary School)

export interface Goal {
  id: string;
  baseline: string; // 本次期初能力行為
  target: string;   // 療育目標行為
}

export interface KidCase {
  id: string;
  name: string;
  birthday: string;
  stage: KidStage;
  caregiverName: string;
  phone: string;
  therapistName: string; // 療育人員
  specialty: string;     // 專業別 (e.g., 職能治療、物理治療)
  therapyPeriodStart: string; // 療育期間 (起) e.g., 2026-05
  therapyPeriodEnd: string;   // 療育期間 (迄) e.g., 2026-10
  goals: Goal[];
  createdAt: string;
}

export type HomeActivityStatus = 'check' | 'cross' | 'delta' | 'circle' | ''; // ✔, ✖, Δ, ○

export interface ScoreOption {
  value: number;
  label: string;
  description: string;
}

export const SCORE_OPTIONS: ScoreOption[] = [
  { value: 3, label: '3分', description: '超過目標行為' },
  { value: 2, label: '2分', description: '達到目標行為' },
  { value: 1, label: '1分', description: '未達目標但有進步' },
  { value: 0, label: '0分', description: '與期初能力現況一樣' },
  { value: -1, label: '-1分', description: '比期初退步' },
];

export const HOME_ACTIVITY_STATUS_DETAILS = {
  'check': { char: '✔', label: '可順利執行', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'cross': { char: '✖', label: '有困難無法執行', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  'delta': { char: '▲', label: '需要療育人員再給予指導', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'circle': { char: '●', label: '已達成不需繼續執行', color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

export interface LessonRecord {
  id: string;
  caseId: string;
  date: string; // 紀錄日期/月份
  summary: string; // 療育活動內容簡述
  scores: { [goalId: string]: number }; // goalId -> Score (-1 to 3)
  homeActivityAdvice: string; // 居家活動建議
  caregiverFeedback: string; // 家長回饋
  caregiverStatus: HomeActivityStatus; // 家長執行狀況
  signature: string; // 家長簽名 (Base64 string data or text)
  createdAt: string;
}

export interface Therapist {
  username: string;
  name: string;
  specialty: string;
}

export interface GoalTemplate {
  id: string;
  category: string;
  baseline: string; // 本次期初能力行為
  target: string;   // 療育目標行為
}
