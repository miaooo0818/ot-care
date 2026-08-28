import { 
  Document, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  TextRun, 
  WidthType, 
  AlignmentType, 
  VerticalAlign, 
  BorderStyle, 
  PageOrientation, 
  convertMillimetersToTwip, 
  Packer 
} from 'docx';
import { saveAs } from 'file-saver';
import { KidCase, LessonRecord, Therapist, HOME_ACTIVITY_STATUS_DETAILS } from '../types';

/**
 * 格式化日期：將 2026-05-10 轉為 民國 115 年 5 月 10 日 或 115/05/10
 */
export function formatTaiwanDate(dateStr: string, format: 'full' | 'short' | 'month' = 'full'): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parseInt(parts[0], 10) - 1911;
  const month = parseInt(parts[1], 10);
  const day = parts.length >= 3 ? parseInt(parts[2], 10) : null;

  if (format === 'month') {
    return `${year}年${month}月`;
  }
  if (format === 'short') {
    return `${year}/${month}${day ? `/${day}` : ''}`;
  }
  return day !== null 
    ? `${year} 年 ${month} 月 ${day} 日` 
    : `${year} 年 ${month} 月`;
}

export function formatTaiwanPeriod(startStr: string, endStr: string): string {
  const p1 = formatTaiwanDate(startStr, 'month');
  const p2 = formatTaiwanDate(endStr, 'month');
  if (!p1 && !p2) return '    年  月 至     年  月';
  return `${p1 || '    年  月'} 至 ${p2 || '    年  月'}`;
}

export function getStatusSymbol(status?: string): string {
  if (!status) return '';
  switch (status) {
    case 'check':
      return '✔';
    case 'cross':
      return '✖';
    case 'delta':
      return 'Δ';
    case 'circle':
      return '○';
    default:
      return status;
  }
}

export interface ExportDocxOptions {
  kidCase: KidCase;
  records: LessonRecord[];
  therapist?: Therapist;
  // 允許強制指定早療或弱療標題，預設依 kidCase.stage 自動決定
  stageOverride?: 'early' | 'weak';
  // 記錄欄位日期模式：'date' (請填寫日期) 或 'month' (請填寫月份)
  dateMode?: 'date' | 'month';
  // 最少顯示欄位數（預設 6 欄或 12 欄）
  minSessionColumns?: number;
}

/**
 * 產生單一個案的 Section 結構（可供單檔或合併多個案文件使用）
 */
export function generateCaseSection(options: ExportDocxOptions) {
  const { kidCase, records, therapist, stageOverride, dateMode = 'date', minSessionColumns = 6 } = options;

  const isEarly = (stageOverride || kidCase.stage) === 'early';
  const tableTitle = isEarly ? '臺中市早期療育服務記錄表' : '臺中市早期療育弱勢服務記錄表';
  const therapistName = therapist?.name || kidCase.therapistName || '';
  const specialty = therapist?.specialty || kidCase.specialty || '職能治療';

  // 排序歷次紀錄（依日期遠到近）
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // 計算欄位數（至少 minSessionColumns 欄，例如 6 堂課；若實際記錄超過 6 堂，則彈性擴展）
  const sessionCount = Math.max(minSessionColumns, sortedRecords.length);
  const sessionDates: string[] = [];
  for (let i = 0; i < sessionCount; i++) {
    if (i < sortedRecords.length) {
      const r = sortedRecords[i];
      sessionDates.push(formatTaiwanDate(r.date, dateMode === 'month' ? 'month' : 'short'));
    } else {
      sessionDates.push('');
    }
  }

  // 設定表格框線樣式 (細黑實線)
  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  // 總寬度分配 (Landscape A4 可用寬度約 15000 twips = 100%)
  // 基本資料表 (2 列)
  const basicInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: '兒童姓名: ', font: '標楷體', bold: true, size: 22 }),
                  new TextRun({ text: kidCase.name, font: '標楷體', size: 22 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: '兒童生日：', font: '標楷體', bold: true, size: 22 }),
                  new TextRun({ text: formatTaiwanDate(kidCase.birthday, 'full'), font: '標楷體', size: 22 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 44, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: '療育期間：', font: '標楷體', bold: true, size: 22 }),
                  new TextRun({ text: formatTaiwanPeriod(kidCase.therapyPeriodStart, kidCase.therapyPeriodEnd), font: '標楷體', size: 22 }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: '主要照顧者姓名：', font: '標楷體', bold: true, size: 22 }),
                  new TextRun({ text: kidCase.caregiverName, font: '標楷體', size: 22 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: '聯絡電話：', font: '標楷體', bold: true, size: 22 }),
                  new TextRun({ text: kidCase.phone, font: '標楷體', size: 22 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 44, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: '療育人員：', font: '標楷體', bold: true, size: 22 }),
                  new TextRun({ text: therapistName, font: '標楷體', size: 22 }),
                  new TextRun({ text: '    專業別：', font: '標楷體', bold: true, size: 22 }),
                  new TextRun({ text: specialty, font: '標楷體', size: 22 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 目標與評分表
  const baselineColWidth = 30;
  const targetColWidth = 35;
  const scoreColTotalWidth = 35;
  const singleScoreColWidth = scoreColTotalWidth / sessionCount;

  const goalHeaderRow1 = new TableRow({
    children: [
      new TableCell({
        rowSpan: 2,
        width: { size: baselineColWidth, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '本次期初能力行為', font: '標楷體', bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        rowSpan: 2,
        width: { size: targetColWidth, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '療育目標行為', font: '標楷體', bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        columnSpan: sessionCount,
        width: { size: scoreColTotalWidth, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '療育服務記錄', font: '標楷體', bold: true, size: 20 })],
          }),
        ],
      }),
    ],
  });

  const goalHeaderRow2 = new TableRow({
    children: sessionDates.map((dateStr, idx) => {
      return new TableCell({
        width: { size: singleScoreColWidth, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ 
                text: dateStr || (idx === 0 ? (dateMode === 'month' ? '請填寫月份' : '請填寫日期') : ''), 
                font: '標楷體', 
                size: dateStr ? 18 : 16,
                bold: !!dateStr 
              })
            ],
          }),
        ],
      });
    }),
  });

  const effectiveGoals = kidCase.goals.length > 0 ? kidCase.goals : [
    { id: 'g1', baseline: '', target: '' },
    { id: 'g2', baseline: '', target: '' },
    { id: 'g3', baseline: '', target: '' },
    { id: 'g4', baseline: '', target: '' },
  ];

  const goalDataRows = effectiveGoals.map((g) => {
    const scoreCells = sessionDates.map((_, idx) => {
      let scoreText = '';
      if (idx < sortedRecords.length) {
        const r = sortedRecords[idx];
        const sc = r.scores[g.id];
        if (sc !== undefined && sc !== null) {
          scoreText = String(sc);
        }
      }
      return new TableCell({
        width: { size: singleScoreColWidth, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: scoreText, font: 'Times New Roman', bold: true, size: 24 })],
          }),
        ],
      });
    });

    return new TableRow({
      children: [
        new TableCell({
          width: { size: baselineColWidth, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: g.baseline, font: '標楷體', size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: targetColWidth, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: g.target, font: '標楷體', size: 20 })],
            }),
          ],
        }),
        ...scoreCells,
      ],
    });
  });

  const scoreInstructionRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2 + sessionCount,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: '兒童表現：超過目標行為3分，達到目標行為 2分，未達目標但有進步1分，與期初能力現況一樣0分，比期初退步-1分。',
                font: '標楷體',
                size: 18,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const goalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorder,
    rows: [goalHeaderRow1, goalHeaderRow2, ...goalDataRows, scoreInstructionRow],
  });

  // 活動與居家回饋表格
  const activityHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: dateMode === 'month' ? '月份' : '日期', font: '標楷體', bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 36, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '居家活動建議', font: '標楷體', bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '家長回饋', font: '標楷體', bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '家長居家活動執行狀況', font: '標楷體', bold: true, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '✔✖Δ○', font: '標楷體', bold: true, size: 20 }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '家長簽名', font: '標楷體', bold: true, size: 22 })],
          }),
        ],
      }),
    ],
  });

  const activityRowsCount = Math.max(6, sortedRecords.length);
  const activityDataRows: TableRow[] = [];

  for (let i = 0; i < activityRowsCount; i++) {
    const r = i < sortedRecords.length ? sortedRecords[i] : null;
    const dateText = r ? formatTaiwanDate(r.date, dateMode === 'month' ? 'month' : 'full') : '';
    const adviceText = r ? (r.homeActivityAdvice || r.summary || '') : '';
    const feedbackText = r ? (r.caregiverFeedback || '') : '';
    const statusText = r ? getStatusSymbol(r.caregiverStatus) : '';
    const sigText = r ? (r.signature ? (r.signature.startsWith('data:image') ? '（已電子簽署）' : r.signature) : '') : '';

    activityDataRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: dateText, font: '標楷體', size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: adviceText, font: '標楷體', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 24, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: feedbackText, font: '標楷體', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: statusText, font: '標楷體', bold: true, size: 24 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            borders: cellBorder,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: sigText, font: '標楷體', size: 18 })],
              }),
            ],
          }),
        ],
      })
    );
  }

  const activityFooterRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBorder,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: '家長執行居家活動狀況：✔可順利執行，✖有困難無法執行，Δ需要療育人員再給予指導，○已達成不需繼續執行。',
                font: '標楷體',
                size: 18,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const activityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorder,
    rows: [activityHeaderRow, ...activityDataRows, activityFooterRow],
  });

  return {
    properties: {
      page: {
        size: {
          orientation: PageOrientation.LANDSCAPE,
          width: convertMillimetersToTwip(297),
          height: convertMillimetersToTwip(210),
        },
        margin: {
          top: convertMillimetersToTwip(12),
          bottom: convertMillimetersToTwip(12),
          left: convertMillimetersToTwip(15),
          right: convertMillimetersToTwip(15),
        },
      },
    },
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorder,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: '中國醫藥大學孫世恆副教授編制',
                        font: '標楷體',
                        size: 18,
                        color: '333333',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: 'IACCB 國際兒童潛能發展協會',
                        font: '標楷體',
                        bold: true,
                        size: 18,
                        color: '333333',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 120 },
        children: [
          new TextRun({
            text: tableTitle,
            font: '標楷體',
            bold: true,
            size: 34,
          }),
        ],
      }),
      basicInfoTable,
      new Paragraph({ spacing: { before: 0, after: 0 } }),
      goalTable,
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: '療育活動內容簡述：',
            font: '標楷體',
            bold: true,
            size: 22,
          }),
        ],
      }),
      activityTable,
    ],
  };
}

/**
 * 建立單一個案的 Word 檔案
 */
export function generateCaseDocxDocument(options: ExportDocxOptions): Document {
  const section = generateCaseSection(options);
  return new Document({
    sections: [section],
  });
}

/**
 * 建立多個個案合併為單一 Word 檔案（每位個案獨立一頁 Landscape Section）
 */
export function generateCombinedCasesDocxDocument(
  casesList: KidCase[],
  allRecords: LessonRecord[],
  options?: Partial<ExportDocxOptions>
): Document {
  const sections = casesList.map(kidCase => {
    const kidRecords = allRecords.filter(r => r.caseId === kidCase.id);
    return generateCaseSection({
      kidCase,
      records: kidRecords,
      therapist: options?.therapist,
      stageOverride: options?.stageOverride,
      dateMode: options?.dateMode,
      minSessionColumns: options?.minSessionColumns,
    });
  });

  return new Document({
    sections,
  });
}

/**
 * 匯出單一個案為 DOCX 檔案並觸發瀏覽器下載
 */
export async function exportCaseToDocx(options: ExportDocxOptions): Promise<void> {
  const doc = generateCaseDocxDocument(options);
  const blob = await Packer.toBlob(doc);
  
  const stageName = (options.stageOverride || options.kidCase.stage) === 'early' ? '早療' : '弱療';
  const fileName = `${options.kidCase.name}_臺中市${stageName}服務記錄表_${new Date().toISOString().split('T')[0]}.docx`;
  
  saveAs(blob, fileName);
}

/**
 * 批次匯出多個個案為多個個別 DOCX 檔案
 */
export async function exportMultipleCasesToDocx(
  casesList: KidCase[], 
  allRecords: LessonRecord[], 
  therapist?: Therapist,
  options?: Partial<ExportDocxOptions>
): Promise<void> {
  for (const c of casesList) {
    const kidRecords = allRecords.filter(r => r.caseId === c.id);
    await exportCaseToDocx({
      kidCase: c,
      records: kidRecords,
      therapist,
      ...options,
    });
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

/**
 * 匯出合併全案為單一完整 DOCX 彙整檔案
 */
export async function exportCombinedCasesToDocx(
  casesList: KidCase[],
  allRecords: LessonRecord[],
  groupName: string = '全部個案',
  options?: Partial<ExportDocxOptions>
): Promise<void> {
  if (casesList.length === 0) return;
  const doc = generateCombinedCasesDocxDocument(casesList, allRecords, options);
  const blob = await Packer.toBlob(doc);
  const fileName = `臺中市早期療育服務記錄表_${groupName}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
}

