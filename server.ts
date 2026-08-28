import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: AI Generate Clinical Lesson Observation Record
app.post('/api/gemini/generate-record', async (req, res) => {
  try {
    const {
      kidName,
      kidStage,
      date,
      goals,
      activityNotes,
      caregiverStatus,
      extraKeywords,
    } = req.body;

    const ai = getGenAI();

    const stageDescription =
      kidStage === 'early' ? '早期療育（學齡前 0-6 歲幼兒）' : '弱勢/國小療育（7歲以上學齡兒童）';

    // 格式化評估目標與當堂分數清單
    const formattedGoals = Array.isArray(goals)
      ? goals
          .map((g: any, idx: number) => {
            const scoreNum = Number(g.score);
            let scoreDesc = '維持現況';
            if (scoreNum === 3) scoreDesc = '超越預期表現 (3分)';
            else if (scoreNum === 2) scoreDesc = '達成預期目標 (2分)';
            else if (scoreNum === 1) scoreDesc = '有進步但未達目標 (1分)';
            else if (scoreNum === 0) scoreDesc = '維持期初現況 (0分)';
            else if (scoreNum === -1) scoreDesc = '退步/干擾 ( -1分)';

            return `目標 ${idx + 1}:
  - 期初現況: ${g.baseline || '無'}
  - 預期目標: ${g.target || '無'}
  - 當堂評分: ${scoreNum} 分 (${scoreDesc})`;
          })
          .join('\n')
      : '無特定目標評估資料';

    const prompt = `你是一位資深的兒童職能治療師（Occupational Therapist, OT），負責為個案撰寫專業、合規且具臨床意義的課後療育紀錄與居家活動衛教建議（符合台灣「臺中市早期療育服務記錄表」與國小弱療服務紀錄格式）。

請依據以下當次課堂評估資料，生成一份結構清晰、語氣專業、精簡洗鍊的觀察摘要：

【個案基本資料與當次評估】
- 個案姓名：${kidName || '個案'}
- 療育階段：${stageDescription}
- 療育日期：${date || '當日'}
- 期初目標與當堂評分：
${formattedGoals}
${caregiverStatus ? `- 上週居家活動執行情形：${caregiverStatus}` : ''}
${activityNotes ? `- 治療師補充筆記/媒介：${activityNotes}` : ''}
${extraKeywords ? `- 補充觀察重點/關鍵字：${extraKeywords}` : ''}

【撰寫規範】
1. summary (療育活動內容簡述)：
   - 長度約 80 ~ 150 字。
   - 請具體陳述當次課堂運用的專業介入媒介與活動（如：感覺統合粗大動作本體覺跳躍、動態三點握筆調整、前三指肌力夾取分類、視覺空間部件定位、挫折容忍深呼吸調節等）。
   - 務必對應上述評分較高（有進步/達成）與需加強之目標，描繪出個案在動作協調、專注力或操作品質上的具體表現與引導策略。
   - 語句流暢精準，避免空泛贅詞。

2. homeActivityAdvice (給主要照顧者的居家活動建議)：
   - 長度約 60 ~ 110 字。
   - 針對當次表現及待加強項目，提供 1-2 項家長在日常生活中容易執行的居家遊戲或生活自理練習建議（例如：每天利用曬衣夾夾棉花球、洗澡前練習雙腳併跳、寫作業前先做手指爬行暖身等）。
   - 口吻親切專業、步驟清楚可行。

3. clinicalInsight (臨床專業重點洞察/治療師隨堂備忘)：
   - 簡短 1-2 句話（約 40 ~ 70 字），指出下堂課可延續的加深挑戰或需留意的調節策略。

請一律以繁體中文 (台灣醫事術語) 輸出 JSON 格式。`;

    let text = '';
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: '專業的療育活動內容簡述 (80-150字)',
                },
                homeActivityAdvice: {
                  type: Type.STRING,
                  description: '給主要照顧者的居家活動建議 (60-110字)',
                },
                clinicalInsight: {
                  type: Type.STRING,
                  description: '臨床重點洞察與下堂課調整重點 (40-70字)',
                },
              },
              required: ['summary', 'homeActivityAdvice', 'clinicalInsight'],
            },
          },
        });
        if (response.text) {
          text = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call failed, trying fallback...`, err?.message);
      }
    }

    if (!text) {
      throw lastError || new Error('AI 暫未能產生文字內容，請稍後重試。');
    }

    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error generating AI record:', error);
    const errorMessage = error?.message || '生成失敗，請檢查 Gemini API 設定。';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// 3. Gemini AI 依期初現況智能生成「量化療育目標行為範本」
app.post('/api/gemini/generate-goal-target', async (req, res) => {
  try {
    const {
      baseline,
      kidName,
      kidAge,
      kidStage,
      therapyDuration = '半年 (6個月)',
      customFocus,
    } = req.body;

    if (!baseline || typeof baseline !== 'string' || baseline.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '請提供期初能力行為現況描述，以便 AI 產生對應之量化目標。',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: '系統未設定 GEMINI_API_KEY 環境變數。',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const stageDescription = kidStage === 'early' 
      ? '學齡前兒童 (0-6歲早期療育)' 
      : (kidStage === 'weak' ? '國小學童 (弱療 / 學校適應與身心發展)' : '兒童發展療育');

    const prompt = `你是一位精通早期療育與兒童職能治療（Pediatric OT）的資深臨床督導與治療師。
請根據老師所輸入的「個案期初能力行為現況描述 (起點 Baseline)」，為其量身制定符合 SMART 原則、高量化、精準對應現況的「預期達成之療育目標行為 (Target Behavior)」。

【個案與療程資訊】
- 個案姓名: ${kidName || '個案兒童'}
- 年齡/階段: ${kidAge ? `${kidAge} 歲` : ''} (${stageDescription})
- 預計療程長度: ${therapyDuration}
- 老師輸入之期初能力現況描述 (起點):
"${baseline.trim()}"
${customFocus ? `- 老師指定重點方向: ${customFocus}` : ''}

【目標制定核心指引（極重要）】
1. **高度量化與可測量性 (Quantifiable & Measurable)**：
   - 必須包含明確的測量數據，例如：連續成功次數（如「連續 3 次」）、時間秒數（如「維持單腳站立達 5 秒」）、達成機率（如「在 10 次嘗試中有 8 次」）、尺寸/空間精度（如「在 2 公分正方格內著色不溢出 >80%」）、距離/高度公分、減少口語或身體提示次數（如「僅需 1 次口語提示即可...」）等。
2. **緊密對應現況起點 (Directly Targets Baseline Weakness)**：
   - 針對現況中的不足或困難（如：抓握無力、跳躍不穩、注意力維持短、情緒調節困難、雙側協調不佳），給予階梯式提升之目標。
3. **符合療程時程與年齡適應性**：
   - 設定難度符合該年齡層在 ${therapyDuration} 內合理可達成的目標。

請輸出 JSON 格式，包含：
1. primaryTarget: 最推薦、最標準且兼具臨床可執行性的量化目標描述 (35-70字)。
2. targetOptions: 陣列，提供 3 個不同向度/難度層次的量化目標選項供老師挑選：
   - option 1: 【標準階段目標】聚焦核心功能障礙之量化突破。
   - option 2: 【進階挑戰目標】提高標準、增加連續度、抗干擾或減少輔助。
   - option 3: 【生活與學校應用目標】將動作/認知能力轉移至日常生活自理或教室常規情境。
3. clinicalRationale: 簡短說明為何如此量化與關鍵評估指標 (30-60字)。

一律使用繁體中文（台灣早療臨床術語）。`;

    let text = '';
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                primaryTarget: {
                  type: Type.STRING,
                  description: '最推薦之核心量化療育目標描述',
                },
                targetOptions: {
                  type: Type.ARRAY,
                  description: '3個不同難度/情境之量化目標選項',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: '選項標籤，例如：標準階段目標、進階挑戰目標、生活應用目標' },
                      target: { type: Type.STRING, description: '具體量化的目標行為文字' },
                      metric: { type: Type.STRING, description: '本目標之關鍵量化指標，例如：5秒內完成、連續成功3次、溢出率<10%' },
                    },
                    required: ['title', 'target', 'metric'],
                  },
                },
                clinicalRationale: {
                  type: Type.STRING,
                  description: '臨床設定與量化理由說明',
                },
              },
              required: ['primaryTarget', 'targetOptions', 'clinicalRationale'],
            },
          },
        });
        if (response.text) {
          text = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} goal target call failed, trying fallback...`, err?.message);
      }
    }

    if (!text) {
      throw lastError || new Error('AI 暫未能產生目標內容，請稍後重試。');
    }

    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error generating AI goal target:', error);
    const errorMessage = error?.message || '生成失敗，請檢查 Gemini API 設定。';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OT-Care server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
