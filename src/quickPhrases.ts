/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuickPhrase {
  id: string;
  category: 'sensory_gross' | 'fine_motor' | 'handwriting_visual' | 'attention_emotion' | 'home_advice' | 'parent_feedback';
  targetField: 'summary' | 'homeActivityAdvice' | 'caregiverFeedback';
  stage?: 'all' | 'early' | 'weak';
  title: string;
  text: string;
  tags?: string[];
}

export const QUICK_PHRASE_CATEGORIES = [
  { id: 'all', label: '全部詞彙', icon: 'Sparkles' },
  { id: 'sensory_gross', label: '感覺統合與粗大動作', icon: 'Activity', targetField: 'summary' },
  { id: 'fine_motor', label: '精細動作與掌內操作', icon: 'Hand', targetField: 'summary' },
  { id: 'handwriting_visual', label: '書寫運筆與視覺知覺', icon: 'PenTool', targetField: 'summary' },
  { id: 'attention_emotion', label: '專注衝動與情緒調節', icon: 'Brain', targetField: 'summary' },
  { id: 'home_advice', label: '居家活動建議衛教', icon: 'Home', targetField: 'homeActivityAdvice' },
  { id: 'parent_feedback', label: '家長回饋與生活自理', icon: 'MessageSquare', targetField: 'caregiverFeedback' },
] as const;

export const DEFAULT_QUICK_PHRASES: QuickPhrase[] = [
  // 1. 感覺統合與粗大動作 (活動簡述 summary)
  {
    id: 'sg-1',
    category: 'sensory_gross',
    targetField: 'summary',
    stage: 'early',
    title: '彈跳床本體覺雙腳跳躍',
    text: '利用彈跳床與前庭搖擺吊床，配合節奏拍手引導雙腳連續離地跳躍，提升本體覺調節與下肢肌耐力。',
    tags: ['早療', '本體覺', '彈跳床', '平衡']
  },
  {
    id: 'sg-2',
    category: 'sensory_gross',
    targetField: 'summary',
    stage: 'all',
    title: '平衡木與跨越障礙物',
    text: '於窄版平衡木進行雙手平舉走動並跨越軟積木障礙，訓練動態平衡控制與軀幹核心穩定度。',
    tags: ['平衡木', '核心穩定', '動態平衡']
  },
  {
    id: 'sg-3',
    category: 'sensory_gross',
    targetField: 'summary',
    stage: 'all',
    title: '觸壓覺大球滾壓與放鬆',
    text: '運用治療大花生球進行深層觸壓滾動，提供本體覺與觸壓覺刺激，撫平課前躁動並提升身體警醒度。',
    tags: ['觸壓覺', '大球', '情緒緩和', '感覺統合']
  },
  {
    id: 'sg-4',
    category: 'sensory_gross',
    targetField: 'summary',
    stage: 'early',
    title: '斜坡滑板俯臥滑行',
    text: '採俯臥趴姿於滑板車自斜坡滑下並以雙手抓取目標物，強化伸肌肌力、頸部抬頭與前庭耐受度。',
    tags: ['滑板車', '前庭覺', '俯臥趴姿']
  },
  {
    id: 'sg-5',
    category: 'sensory_gross',
    targetField: 'summary',
    stage: 'weak',
    title: '雙側協調開合跳與繩梯',
    text: '進行敏捷繩梯跨步與連續開合跳節奏挑戰，提升四肢雙側協調與大動作動作計畫能力。',
    tags: ['雙側協調', '開合跳', '弱療']
  },

  // 2. 精細動作與掌內操作 (活動簡述 summary)
  {
    id: 'fm-1',
    category: 'fine_motor',
    targetField: 'summary',
    stage: 'early',
    title: '三指捏握小夾子分類',
    text: '使用前三指操作兒童彈簧小夾子進行彩球夾取與顏色分類，強化橈側三指靈活度與指尖微調肌力。',
    tags: ['前三指', '小夾子', '精細動作']
  },
  {
    id: 'fm-2',
    category: 'fine_motor',
    targetField: 'summary',
    stage: 'early',
    title: '黏土搓圓/捏壓/塑形',
    text: '引導雙手掌心對搓黏土球、食拇指捏捏尖角及塑膠切刀分段，增進掌內肌力與雙手操作分工。',
    tags: ['黏土', '掌內肌', '手指肌力']
  },
  {
    id: 'fm-3',
    category: 'fine_motor',
    targetField: 'summary',
    stage: 'all',
    title: '安全剪刀直線與曲線剪裁',
    text: '練習單手持安全剪刀沿著加粗黑線剪裁紙條，非慣用手穩定旋轉紙張，建立優良雙手分工協同操作。',
    tags: ['剪刀', '雙手協同', '精細動作']
  },
  {
    id: 'fm-4',
    category: 'fine_motor',
    targetField: 'summary',
    stage: 'early',
    title: '穿串珠與手眼協調',
    text: '運用棉繩與大孔木珠進行規律穿引，訓練慣用手穿引與輔助手精準固定之手眼協調專注力。',
    tags: ['穿珠', '手眼協調', '自理前置']
  },
  {
    id: 'fm-5',
    category: 'fine_motor',
    targetField: 'summary',
    stage: 'weak',
    title: '掌內平移轉動零錢操作',
    text: '練習單手掌心存放3枚硬幣，並依序以手指旋轉平移至指尖投入存錢筒，訓練掌內操作旋轉技巧。',
    tags: ['掌內平移', '硬幣操作', '弱療']
  },

  // 3. 書寫運筆與視覺知覺 (活動簡述 summary)
  {
    id: 'hw-1',
    category: 'handwriting_visual',
    targetField: 'summary',
    stage: 'weak',
    title: '動態三點握筆姿勢矯正',
    text: '使用三角粗鉛筆搭配握筆輔助器，調整虎口打開與指節微彎姿勢，改善握筆過緊死力與手腕屈曲代償。',
    tags: ['握筆姿勢', '三點抓握', '寫字']
  },
  {
    id: 'hw-2',
    category: 'handwriting_visual',
    targetField: 'summary',
    stage: 'weak',
    title: '九宮格空間部件仿畫與定位',
    text: '透過九宮格十字格定位紙進行筆畫空間定位練習，引導觀察上下左右比例，減少字體出格與部件散開現象。',
    tags: ['空間定位', '九宮格', '生字抄寫']
  },
  {
    id: 'hw-3',
    category: 'handwriting_visual',
    targetField: 'summary',
    stage: 'all',
    title: '迷宮連線與運筆力道控制',
    text: '進行高難度彎曲迷宮筆劃連線，要求筆尖不碰觸兩側邊界，訓練視覺追視、手眼協調與適度下筆力道。',
    tags: ['迷宮', '運筆力道', '手眼協調']
  },
  {
    id: 'hw-4',
    category: 'handwriting_visual',
    targetField: 'summary',
    stage: 'weak',
    title: '黑板抄寫與視覺搜尋比對',
    text: '模擬遠距黑板看一行抄寫一行，進行視覺搜尋符號標記，練習遠近對焦轉換與字距行距空間判別。',
    tags: ['黑板抄寫', '視覺搜尋', '學業適應']
  },

  // 4. 專注衝動與情緒調節 (活動簡述 summary)
  {
    id: 'ae-1',
    category: 'attention_emotion',
    targetField: 'summary',
    stage: 'all',
    title: '結構化視覺流程圖與計時器',
    text: '配合課堂視覺流程圖與沙漏計時器，引導孩子按照步驟逐項完成任務並自主打勾，顯著減少分心與離座頻率。',
    tags: ['視覺作息', '計時器', '專注力']
  },
  {
    id: 'ae-2',
    category: 'attention_emotion',
    targetField: 'summary',
    stage: 'all',
    title: '挫折容忍與自我冷靜深呼吸',
    text: '當遇到挑戰卡關出現焦慮抗拒時，及時提供深呼吸數數三下與冷靜坐墊引導，成功調解挫折情緒並重啟任務。',
    tags: ['情緒調節', '挫折容忍', '深呼吸']
  },
  {
    id: 'ae-3',
    category: 'attention_emotion',
    targetField: 'summary',
    stage: 'all',
    title: '聽覺指令反應與衝動抑制',
    text: '進行「紅綠燈快慢走」與「聽到指定指令才出手」遊戲，加強聽覺注意警醒度與動作衝動抑制能力。',
    tags: ['衝動抑制', '聽覺指令', '規則遵守']
  },

  // 5. 居家活動建議衛教 (居家活動 advice)
  {
    id: 'ha-1',
    category: 'home_advice',
    targetField: 'homeActivityAdvice',
    stage: 'early',
    title: '居家黏土揉捏與撕貼畫',
    text: '建議家長每日在家陪伴孩子進行10~15分鐘黏土搓圓捏壓、或是色紙撕碎拼貼畫，鍛鍊前三指肌力。',
    tags: ['居家練習', '黏土', '手部肌力']
  },
  {
    id: 'ha-2',
    category: 'home_advice',
    targetField: 'homeActivityAdvice',
    stage: 'all',
    title: '曬衣夾配對與生活自理操作',
    text: '可利用彩色曬衣夾夾在紙盤邊緣或衣物邊角，練習手部按壓開合，並引導日常自行扣大鈕扣與拉拉鍊。',
    tags: ['曬衣夾', '生活自理', '手指靈活']
  },
  {
    id: 'ha-3',
    category: 'home_advice',
    targetField: 'homeActivityAdvice',
    stage: 'weak',
    title: '寫字前手部暖身操與握筆提醒',
    text: '寫作業前先做手指蜘蛛爬行、雙手用力互推等關節伸展暖身；提醒孩子背貼椅背、非慣用手壓住紙張。',
    tags: ['寫字前暖身', '坐姿習慣', '握筆']
  },
  {
    id: 'ha-4',
    category: 'home_advice',
    targetField: 'homeActivityAdvice',
    stage: 'all',
    title: '戶外公園攀爬跳躍活動',
    text: '週末多帶孩子至戶外公園進行攀爬架、溜滑梯、單腳跳格子或丟接皮球，提供充足本體覺與大動作刺激。',
    tags: ['戶外活動', '前庭本體覺', '大動作']
  },
  {
    id: 'ha-5',
    category: 'home_advice',
    targetField: 'homeActivityAdvice',
    stage: 'all',
    title: '家庭作息視覺清單建立',
    text: '建議在家中書桌前張貼放學後的圖卡作息表（喝水、洗手、寫作業、休息），由孩子完成後自行貼上貼紙。',
    tags: ['家庭常規', '視覺圖卡', '自主管理']
  },

  // 6. 家長回饋常用片語 (家長回饋 feedback)
  {
    id: 'pf-1',
    category: 'parent_feedback',
    targetField: 'caregiverFeedback',
    stage: 'all',
    title: '在家配合度佳且握筆有進步',
    text: '家長表示孩子回家後願意配合練習黏土與運筆，手指握力有明顯進步，主動性良好。',
    tags: ['配合佳', '進步明顯']
  },
  {
    id: 'pf-2',
    category: 'parent_feedback',
    targetField: 'caregiverFeedback',
    stage: 'early',
    title: '自理穿脫鞋襪速度加快',
    text: '家長反映孩子近兩週在幼兒園與家裡穿脫鞋襪、收拾玩具的速度變快，手眼協調明顯提升。',
    tags: ['自理能力', '幼兒園表現']
  },
  {
    id: 'pf-3',
    category: 'parent_feedback',
    targetField: 'caregiverFeedback',
    stage: 'weak',
    title: '寫作業仍較易分心需口語叮嚀',
    text: '家長反映寫生字作業時專注時間約10分鐘，容易被周遭聲音干擾，需家長在旁分段給予提醒。',
    tags: ['分心提醒', '作業適應']
  },
  {
    id: 'pf-4',
    category: 'parent_feedback',
    targetField: 'caregiverFeedback',
    stage: 'all',
    title: '情緒卡關時能嘗試深呼吸',
    text: '家長回報孩子在遇到挫折時有嘗試運用老師教的深呼吸冷靜，尖叫哭鬧時間已有明顯縮短。',
    tags: ['情緒調節', '深呼吸應用']
  }
];
