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

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
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

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'AI 暫未能產生文字內容，請稍後重試。' });
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
