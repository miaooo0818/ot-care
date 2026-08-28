/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoalTemplate } from './types';

export const STANDARD_DOMAINS = [
  '精細動作',
  '粗大動作',
  '注意力',
  '衝動控制',
  '感覺統合',
  '生活自理',
  '認知概念',
  '社交互動',
  '視知覺',
] as const;

export type StandardDomain = typeof STANDARD_DOMAINS[number] | string;

export const DEFAULT_GOAL_TEMPLATES: GoalTemplate[] = [
  // 1. 精細動作 (Fine Motor)
  {
    id: 'tpl_writing_stability',
    category: '精細動作',
    baseline: '手部穩定度不佳，書寫線條容易有彎曲、多餘筆劃，常超出格線。',
    target: '可成熟在2公分正方格內寫出標準數字或形狀，累計20種且出界率<10%。'
  },
  {
    id: 'tpl_writing_strength',
    category: '精細動作',
    baseline: '手部肌力不佳，三指握筆無力，運筆力道過輕且手掌容易疲勞。',
    target: '能以動態三指抓握運筆劃線連續3分鐘，線條清晰完整，5次中成功4次。'
  },
  {
    id: 'tpl_bimanual_scissors',
    category: '精細動作',
    baseline: '雙手雙側整合不良，操作剪刀剪紙時無法流暢旋轉紙張，切口邊緣粗糙。',
    target: '能流暢操作安全剪刀，沿著直線成功剪下達15公分，偏離黑線不超過0.5公分。'
  },
  {
    id: 'tpl_pinch_coins',
    category: '精細動作',
    baseline: '三指捏夾力道不集中，無法流暢拾起貼平於桌面之薄型物件（如硬幣、貼紙）。',
    target: '能以穩定的拇食中指指腹，在30秒內流暢拾起桌面10枚硬幣投入撲滿內。'
  },
  {
    id: 'tpl_pegboard_beads',
    category: '精細動作',
    baseline: '指尖小肌肉協調不足，串珠或插小孔插棒時常手抖滑落，對位困難。',
    target: '能在2分鐘內連續將10顆小積木/串珠（直徑1cm）精準穿過線繩不滑落。'
  },

  // 2. 粗大動作 (Gross Motor)
  {
    id: 'tpl_balance_gross_motor',
    category: '粗大動作',
    baseline: '單腳站立之平衡與軀幹中軸控制穩定度欠佳，雙臂張開仍有顯著搖晃且3秒內墜足。',
    target: '能主動以左右單腳著地站立，身體平穩不搖晃持續達10秒以上（3次嘗試中達成2次）。'
  },
  {
    id: 'tpl_jumping_both_feet',
    category: '粗大動作',
    baseline: '雙腳力量與協調不足，無法雙腳同時起跳離地，跳躍時常單腳拖地或落地不穩。',
    target: '能在無扶持下雙腳同時離地連續原地跳躍5次，落地平衡穩定不跌倒。'
  },
  {
    id: 'tpl_ball_catching',
    category: '粗大動作',
    baseline: '手眼協調與兩手開展時機欠佳，丟接大球時常用胸部死擋且無法精準抓住球。',
    target: '在距離2公尺的情況下，能伸出雙手流暢接住拋擲而來的小皮球，接球成功率5投4中。'
  },
  {
    id: 'tpl_balance_beam',
    category: '粗大動作',
    baseline: '動態平衡與足底本體感覺弱，走15公分寬平衡木時需大人牽手，且易踩空跌落。',
    target: '能獨立走完3公尺長、15公分寬之平衡木，中途無踏出且身體平衡維持良好。'
  },

  // 3. 注意力 (Attention)
  {
    id: 'tpl_attention_negative_emotion',
    category: '注意力',
    baseline: '持續注意力不佳，靜態操作容易分心或產生負面情緒，持續不到3分鐘即想離座。',
    target: '在無口語提示下，每項靜態結構化活動能獨立持續專注15分鐘以上。'
  },
  {
    id: 'tpl_attention_static_involvement',
    category: '注意力',
    baseline: '注意力分散易受環境雜音干擾，無法聽完2步驟以上之口語指令並執行。',
    target: '能在團體活動中專注聆聽指令，並正確連續執行2~3步驟指令，達成率達80%。'
  },
  {
    id: 'tpl_selective_visual_search',
    category: '注意力',
    baseline: '視覺選擇性注意力不足，在雜亂桌面或圖畫中尋找指定目標耗時且容易遺漏。',
    target: '能在1分鐘內於10x10密集符號陣列中，快速圈選出5個指定圖形且無遺漏。'
  },

  // 4. 衝動控制 (Impulse Control & Emotion)
  {
    id: 'tpl_impulse_turn_taking',
    category: '衝動控制',
    baseline: '衝動控制力弱，桌遊或體能遊戲中無法耐心等待輪流，常搶先奪取教具或插隊。',
    target: '在3人以上輪流遊戲中，能安坐等待輪到自己順位（等待至少1分鐘），且無搶奪行為。'
  },
  {
    id: 'tpl_emotion_frustration',
    category: '衝動控制',
    baseline: '挫折容忍度偏低，積木倒塌或遇到操作困難時易大聲哭鬧、摔丟教具或放棄。',
    target: '遇到挫折情境時，能在深呼吸或1次提示下主動舉手說「請幫忙」，無破壞性發脾氣行為。'
  },
  {
    id: 'tpl_impulse_seat_stay',
    category: '衝動控制',
    baseline: '身體抑制控制不佳，上課時常不自覺離開座位、四處游移或觸摸周遭他人。',
    target: '在20分鐘的課堂單元中，能維持安坐於椅子上，離座次數由每堂5次降低至0~1次。'
  },

  // 5. 感覺統合 (Sensory Integration)
  {
    id: 'tpl_sensory_vestibular_seeking',
    category: '感覺統合',
    baseline: '前庭本體覺尋求強烈，喜歡劇烈旋轉、搖晃身體，易過度興奮且動作計畫笨拙。',
    target: '在重力跳床或前庭擺盪活動後，能於2分鐘內平穩調節警醒度並進入靜態桌上活動。'
  },
  {
    id: 'tpl_sensory_tactile_defensiveness',
    category: '感覺統合',
    baseline: '觸覺過度敏感防禦，排斥接觸黏土、水彩、刮鬍泡等異材質，接觸即退縮抗拒。',
    target: '能主動雙手觸摸並操作黏土/指甲彩繪泡泡等觸覺介質持續5分鐘以上，無哭鬧抗拒。'
  },
  {
    id: 'tpl_motor_planning_praxis',
    category: '感覺統合',
    baseline: '動作計畫（Praxis）能力弱，模仿新動作或穿越立體障礙道時肢體協調卡頓。',
    target: '能正確模仿治療師示範之3個連續肢體動作組合（如拍頭-摸膝-雙手叉腰），一次到位。'
  },

  // 6. 生活自理 (ADL)
  {
    id: 'tpl_adl_buttoning',
    category: '生活自理',
    baseline: '指尖協調與空間對位不足，扣襯衫或解開鈕扣時手部顫抖，需仰賴大人大幅輔助。',
    target: '能獨立目視並雙手配合，在2分鐘內完整解開與重扣4顆中型（直徑1.5cm）衣服扣子。'
  },
  {
    id: 'tpl_adl_shoes_socks',
    category: '生活自理',
    baseline: '穿脫鞋襪時雙手拉力不足、方向辨識差，常將襪後跟穿在腳背或鞋子左右穿反。',
    target: '能在無大人提示下，正確辨識鞋子左右腳並獨立穿妥魔鬼氈運動鞋與襪子。'
  },
  {
    id: 'tpl_adl_utensil_spoon',
    category: '生活自理',
    baseline: '進食用湯匙時手腕前臂旋前旋後角度不足，容易飯菜溢出碗外，進食掉落率高。',
    target: '能手握湯匙順暢舀起飯菜送入口中，整餐飯粒掉落至桌面次數少於3次。'
  },

  // 7. 認知概念 (Cognitive)
  {
    id: 'tpl_number_recognition',
    category: '認知概念',
    baseline: '無法穩定認讀與理解1~10之數字量詞對應概念，常混淆數字外形。',
    target: '能穩定認讀數字1-10，並正確點數取出對應數量之積木物件，達成率90%以上。'
  },
  {
    id: 'tpl_mirroring_digits',
    category: '認知概念',
    baseline: '無法穩定書寫數字，且書寫時容易出現左右相反或上下顛倒之鏡像字。',
    target: '能由左至右正確書寫數字1~9與常用注音符號，無鏡像顛倒現象（錯誤率<5%）。'
  },
  {
    id: 'tpl_spatial_concepts',
    category: '認知概念',
    baseline: '空間方位概念（上下、裡外、前後、左右）混淆，無法按空間指令擺放教具。',
    target: '能正確依口語指令將物件放置於「上/下/前/後/裡/外」等指定空間位置，5次中全對。'
  },

  // 8. 社交互動 (Social Interaction)
  {
    id: 'tpl_social_eye_contact',
    category: '社交互動',
    baseline: '與人互動時眼神注視短暫（<1秒），對他人呼喚名字常常無反應或迴避對視。',
    target: '在療育人員或同儕對話時，能主動維持良好眼神接觸達3秒以上，並做出回應。'
  },
  {
    id: 'tpl_social_cooperative_play',
    category: '社交互動',
    baseline: '缺乏同儕合作遊戲技巧，多處於獨自遊玩狀態，遇到同儕靠近易退縮或排擠。',
    target: '能在引導下與1名同儕共同合作完成拼圖或積木城堡建構達10分鐘，過程中互有互動。'
  },

  // 9. 視知覺 (Visual Perception)
  {
    id: 'tpl_visual_figure_ground',
    category: '視知覺',
    baseline: '主題背景區辨（Figure-Ground）弱，在複雜重疊線條圖案中無法辨認隱藏圖形。',
    target: '能在重疊線條圖形中正確找出並描繪出3個指定物體輪廓，正確率達85%以上。'
  },
  {
    id: 'tpl_visual_spatial_relations',
    category: '視知覺',
    baseline: '視覺空間關係知覺不佳，仿繪九宮格點線圖或積木立體模型時常有方向與位置錯置。',
    target: '能正確照樣複製4x4點陣連線圖形與3D積木立體造型，位置方向完全正確無誤。'
  }
];

