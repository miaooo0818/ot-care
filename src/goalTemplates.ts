/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoalTemplate } from './types';

export const DEFAULT_GOAL_TEMPLATES: GoalTemplate[] = [
  // 1. Fine Motor - Writing stability (from reference image)
  {
    id: 'tpl_writing_stability',
    category: '精細動作與書寫',
    baseline: '手部穩定度不佳，書寫線條容易有彎曲、多餘筆劃。',
    target: '可寫出標準數字或形狀、符號，累計 20 種。'
  },
  // 2. Fine Motor - Writing muscle tone (from reference image)
  {
    id: 'tpl_writing_strength',
    category: '精細動作與書寫',
    baseline: '手部肌力不佳，書寫力道過輕。',
    target: '可寫出清楚數字或形狀、符號，5 次中成功 4 次。'
  },
  // 3. Attention & Emotion - Negative feelings (from reference image)
  {
    id: 'tpl_attention_negative_emotion',
    category: '注意力與情緒調節',
    baseline: '持續注意力不佳，靜態操作容易分心或產生負面情緒。',
    target: '每項靜態活動持續 15 分鐘以上，且不產生負面情緒。'
  },
  // 4. Cognitive - Digital recognition (from reference image)
  {
    id: 'tpl_number_recognition',
    category: '認知與概念學習',
    baseline: '無法穩定認讀數字。',
    target: '可穩定認讀數字 1-9。'
  },
  // 5. Cognitive & Writing - Mirroring numbers (from reference image)
  {
    id: 'tpl_mirroring_digits',
    category: '認知與概念學習',
    baseline: '無法穩定書寫數字，且書寫會鏡像顛倒。',
    target: '可正確書寫數字 1-9。'
  },
  // 6. Attention & Emotion - Static involvement (from reference image)
  {
    id: 'tpl_attention_static_involvement',
    category: '注意力與情緒調節',
    baseline: '持續注意力不佳，會產生不配合行為或負面情緒。',
    target: '可持續參與靜態活動 10 分鐘以上。'
  },
  // 7. Hand Dexterity & Scissors
  {
    id: 'tpl_bimanual_scissors',
    category: '精細動作與雙手協調',
    baseline: '雙手雙側整合不良，操作剪刀剪紙時無法流暢旋轉紙張，切口邊緣粗糙。',
    target: '能流暢操作安全剪刀，沿著直線成功剪下達 15 公分，偏離黑線不超過 0.5 公分。'
  },
  // 8. Fine Motor Pinch and Coins
  {
    id: 'tpl_pinch_coins',
    category: '精細動作與雙手協調',
    baseline: '三指捏夾力道不集中，無法流暢拾起貼平於桌面之薄型物件（如硬幣、貼紙）。',
    target: '能以穩定的拇食中指指腹，在 30 秒內流暢拾起桌面 10 枚硬幣投入撲滿內。'
  },
  // 9. Sensory Integration & Gross Motor
  {
    id: 'tpl_balance_gross_motor',
    category: '粗大動作與感覺統合',
    baseline: '單腳站立之平衡與軀幹中軸控制穩定度欠佳，雙臂張開仍有顯著搖晃且 3 秒內墜足。',
    target: '能主動以單腳著地站立（兩隻腳皆可），身體平穩不搖落持續達 10 秒以上。'
  },
  // 10. Activities of Daily Living (ADLs) - Buttoning
  {
    id: 'tpl_adl_buttoning',
    category: '生活自理(ADL)',
    baseline: '指尖協調與空間對位不足，扣襯衫或解開鈕扣時手部顫抖，需仰賴大人大幅輔助。',
    target: '能獨立目視並雙手配合，在 2 分鐘內完整解開與重扣 4 顆中型（直徑1.5cm）衣服扣子。'
  },
  // 11. Upper Limb Coordination - Catching a ball
  {
    id: 'tpl_ball_catching',
    category: '粗大動作與感覺統合',
    baseline: '手眼協調與兩手開展時機欠佳，丟接大球時常用胸部死擋且無法精準抓住球。',
    target: '在距離 2 公尺的情況下，能伸出雙手流暢接住拋擲而來的小皮球，接球成功率 5 投 4 中。'
  }
];
