/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KidCase, LessonRecord, Therapist } from './types';

export const DEFAULT_THERAPIST: Therapist = {
  username: 'ot_hsu',
  name: '許美華',
  specialty: '兒童職能治療 (OT)',
  licenseNumber: '職字第 003829 號'
};

export const INITIAL_CASES: KidCase[] = [
  {
    id: 'case_001',
    name: '林小晴',
    birthday: '2022-04-12', // 4歲，早療兒童 (學齡前)
    stage: 'early',
    caregiverName: '陳雅婷 (媽媽)',
    phone: '0912-345678',
    therapistName: '許美華',
    specialty: '職能治療',
    therapyPeriodStart: '2026-03',
    therapyPeriodEnd: '2026-08',
    goals: [
      {
        id: 'goal_1_1',
        baseline: '雙腳離地跳躍無法維持平衡，落地下蹲過度。',
        target: '能雙腳離地連續向前跳躍3次，且不落地跌倒。'
      },
      {
        id: 'goal_1_2',
        baseline: '三指抓握畫筆時力道不均，常過輕且握筆姿勢不正確。',
        target: '能使用三指成熟抓握蠟筆，在畫紙範圍內塗滿3個圓圈。'
      },
      {
        id: 'goal_1_3',
        baseline: '靜態操作（如拼圖）時注意力僅能持續3分鐘，易受環境干擾。',
        target: '在無干擾下，能持續專注完成6片拼圖，時間達8分鐘。'
      }
    ],
    createdAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 'case_002',
    name: '張阿睿',
    birthday: '2018-09-25', // 8歲，弱療兒童 (國小二年級)
    stage: 'weak',
    caregiverName: '張國樑 (爺爺)',
    phone: '0933-888999',
    therapistName: '許美華',
    specialty: '職能治療',
    therapyPeriodStart: '2026-04',
    therapyPeriodEnd: '2026-09',
    goals: [
      {
        id: 'goal_2_1',
        baseline: '寫字時手腕過度屈曲，常超出作業本格子，筆畫粗細混亂。',
        target: '能將中文字寫在2x2公分的格子內，且不超出格線比例達80%。'
      },
      {
        id: 'goal_2_2',
        baseline: '視覺追蹤與空間知覺較弱，閱讀課文常有漏字、跳行傾向。',
        target: '看著黑板抄寫4個字詞到聯絡簿上時，無漏字或筆畫缺漏。'
      },
      {
        id: 'goal_2_3',
        baseline: '與同儕進行規則性遊戲時，遇挫折易暴怒哭鬧，無法輪流。',
        target: '能遵守雙人桌遊規則，在輸棋時能保持平靜並說出「手下留情」或下次加油。'
      }
    ],
    createdAt: '2026-04-05T09:00:00Z'
  }
];

export const INITIAL_RECORDS: LessonRecord[] = [
  // 小晴的第一堂課 (2026-05-10)
  {
    id: 'record_1_1',
    caseId: 'case_001',
    date: '2026-05-10',
    summary: '利用感覺統合彈跳床建立雙腳跳躍的核心穩定。引導使用圓形握筆器輔助蠟筆著色。採用故事引導方式操作立體拼圖。',
    scores: {
      'goal_1_1': 1, // 進步1分
      'goal_1_2': 1, // 進步1分
      'goal_1_3': 0  // 0分，與現況一樣
    },
    homeActivityAdvice: '建議每天在家踩沙發邊緣的緩衝地墊雙腳連續跳躍5次。利用黏土捏球練習手指力道。',
    caregiverFeedback: '回家有練習黏土，小晴很喜歡。跳躍部分還是有點怕，落地下蹲比較多。',
    caregiverStatus: 'check', // ✔ 可順利執行
    signature: '陳雅婷',
    createdAt: '2026-05-10T11:00:00Z'
  },
  // 小晴的第二堂課 (2026-05-17)
  {
    id: 'record_1_2',
    caseId: 'case_001',
    date: '2026-05-17',
    summary: '跳跳馬輔助連續跳躍練習。進行手指捏珠穿繩活動以提升精細握力。在安靜的小診間內執行配對卡牌遊戲。',
    scores: {
      'goal_1_1': 2, // 2分 達到目標
      'goal_1_2': 1, // 1分
      'goal_1_3': 1  // 1分
    },
    homeActivityAdvice: '利用彩色筆蓋練習開合與對準。玩跳格子遊戲，練習連續前跳2次。',
    caregiverFeedback: '開彩筆蓋有時還是會生氣需要媽媽幫忙，跳格子玩得很開心。',
    caregiverStatus: 'delta', // Δ 需要再指導
    signature: '陳雅婷',
    createdAt: '2026-05-17T11:00:00Z'
  },
  // 小晴的第三堂課 (2026-05-24)
  {
    id: 'record_1_3',
    caseId: 'case_001',
    date: '2026-05-24',
    summary: '加強下肢落地穩健度訓練，能獨自跳格子3格不翻倒。蠟筆塗鴉小圓，握筆姿勢有顯著進步。使用森林拼圖，藉由計時器激勵專注。',
    scores: {
      'goal_1_1': 3, // 3分 超過目標
      'goal_1_2': 2, // 2分 達到目標
      'goal_1_3': 2  // 2分 達到目標
    },
    homeActivityAdvice: '維持蠟筆著色，家長可陪伴拼圖(8片)，拼完給予實體星星貼紙鼓勵。',
    caregiverFeedback: '小晴現在可以很有耐心地拼完8片拼圖，動作也比以前快很多，有時能拿到3顆星貼紙！',
    caregiverStatus: 'circle', // ○ 已達成
    signature: '陳雅婷',
    createdAt: '2026-05-24T11:00:00Z'
  },

  // 阿睿的第一堂課 (2026-05-12)
  {
    id: 'record_2_1',
    caseId: 'case_002',
    date: '2026-05-12',
    summary: '寫字手部握力阻力訓練（使用粗鉛筆與握筆導引套）。視覺空間拼圖與迷宮追蹤活動（練習不跳行漏字）。桌遊「拔毛運動會」介入，引導排隊與輪流。',
    scores: {
      'goal_2_1': 1, // 1分 進步
      'goal_2_2': 0, // 0分 與現況一樣
      'goal_2_3': -1 // -1分 退步 (中途因為被吃牌大哭離座)
    },
    homeActivityAdvice: '在家寫功課時加粗鉛筆筆身。家長每日陪讀課文一段，用手指或尺輔助字詞追蹤。',
    caregiverFeedback: '寫功課還是有一點抗拒，但有搭配尺輔助，漏字有稍微改善。玩桌遊哭鬧這點真的希望能再加強。',
    caregiverStatus: 'delta', // Δ 需要再指導
    signature: '張國樑',
    createdAt: '2026-05-12T17:00:00Z'
  },
  // 阿睿的第二堂課 (2026-05-19)
  {
    id: 'record_2_2',
    caseId: 'case_002',
    date: '2026-05-19',
    summary: '格子紙拼音抄寫練習，視覺字詞尋寶遊戲。桌遊「快手疊杯」搭配情緒卡，輸時由治療師教導深呼吸，並練習講出指定台詞「沒關係，下一局看我的」。',
    scores: {
      'goal_2_1': 1, // 1分 進步
      'goal_2_2': 1, // 1分 進步
      'goal_2_3': 1  // 1分 進步 (今天輸的時候抓著桌腳深呼吸，雖然紅了眼眶但沒有哭鬧離場)
    },
    homeActivityAdvice: '每天在格子本上抄寫聯絡簿內容2行，寫在格子中間。玩剪刀石頭布，輸的人要幫忙倒水（練習接受輸贏與後續任務）。',
    caregiverFeedback: '這次阿睿回家情緒好很多，玩猜拳輸了也願意去幫忙倒水，雖然嘴巴嘟嘟的但有做到，很棒！',
    caregiverStatus: 'check', // ✔ 可順利執行
    signature: '張國樑',
    createdAt: '2026-05-19T17:00:00Z'
  },
  // 阿睿的第三堂課 (2026-05-26)
  {
    id: 'record_2_3',
    caseId: 'case_002',
    date: '2026-05-26',
    summary: '加強指尖微細動作與中文字型拼湊。引導抄寫黑板的短句子，手眼協調性良好。與其他個案進行雙人疊杯對決，今天情緒表現非常平穩，可自我調節。',
    scores: {
      'goal_2_1': 2, // 2分 達到目標
      'goal_2_2': 2, // 2分 達到目標
      'goal_2_3': 2  // 2分 達到目標
    },
    homeActivityAdvice: '國語課本課後生字抄寫，寫完稱讚他的字體工整。雙人桌遊多鼓勵他的運動家風度。',
    caregiverFeedback: '學校導師也有主動打電話給我們，說阿睿最近在學校寫作業變乾淨了，跟同學跳繩輸的時候也沒有翻臉，真得太感謝許老師的指導了！',
    caregiverStatus: 'check', // ✔ 可順利執行
    signature: '張國樑',
    createdAt: '2026-05-26T17:00:00Z'
  }
];
