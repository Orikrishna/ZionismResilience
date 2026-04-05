import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '../public')

function toDataUri(filePath) {
  const buf = readFileSync(filePath)
  const ext = filePath.endsWith('.png') ? 'png' : filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'jpeg' : 'png'
  return `data:image/${ext};base64,${buf.toString('base64')}`
}

const logos = {
  shaveh: toDataUri(`${PUBLIC}/logo-shaveh.png`),
  zionism2000: toDataUri(`${PUBLIC}/logo-2000.png`),
  joint: toDataUri(`${PUBLIC}/logo-joint.png`),
  qbt: toDataUri(`${PUBLIC}/qbt-logo.png`),
  astrazeneca: toDataUri(`${PUBLIC}/logos/astrazeneca.png`),
  big: toDataUri(`${PUBLIC}/logos/big_shopping_centers.png`),
}

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Noto Sans Hebrew', sans-serif;
    direction: rtl;
    color: #454342;
    background: #fff;
    padding: 0;
    font-size: 13px;
    line-height: 1.7;
  }
  .page {
    padding: 40px 50px;
    min-height: 100vh;
    position: relative;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 3px solid #e9ab56;
    margin-bottom: 30px;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header img { height: 40px; object-fit: contain; }
  .header .org-logo { height: 50px; }
  .doc-title {
    font-size: 22px;
    font-weight: 700;
    color: #4263aa;
    margin-bottom: 4px;
  }
  .doc-subtitle {
    font-size: 14px;
    color: #706e6d;
  }
  .section {
    margin-bottom: 24px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #4263aa;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #d6dff2;
  }
  .field-row {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px solid #f2f2f2;
  }
  .field-label {
    font-weight: 600;
    color: #706e6d;
    width: 160px;
    flex-shrink: 0;
  }
  .field-value {
    color: #454342;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  th {
    background: #4263aa;
    color: white;
    padding: 10px 12px;
    text-align: right;
    font-weight: 600;
    font-size: 12px;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 12px;
  }
  tr:nth-child(even) td { background: #f9f7f5; }
  .score-bar {
    display: inline-block;
    height: 10px;
    border-radius: 5px;
    background: #70bdb3;
  }
  .score-bar-bg {
    display: inline-block;
    width: 100px;
    height: 10px;
    border-radius: 5px;
    background: #e8e8e8;
    position: relative;
  }
  .highlight-box {
    background: #fae9d1;
    border-right: 4px solid #e9ab56;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
  }
  .green-box {
    background: #caece9;
    border-right: 4px solid #70bdb3;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
  }
  .blue-box {
    background: #d6dff2;
    border-right: 4px solid #4263aa;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
  }
  .footer {
    position: absolute;
    bottom: 30px;
    left: 50px;
    right: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #e8e8e8;
    font-size: 10px;
    color: #948c89;
  }
  .footer img { height: 24px; object-fit: contain; }
  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-green { background: #caece9; color: #3a8a7e; }
  .badge-yellow { background: #fae9d1; color: #b8842e; }
  .badge-blue { background: #d6dff2; color: #4263aa; }
  ul { padding-right: 20px; margin: 8px 0; }
  li { margin-bottom: 6px; }
`

const footer = `
  <div class="footer">
    <div>מסמך זה הופק במסגרת מיזם שווה פיתוח | ציונות 2000 × Q-BT</div>
    <div style="display:flex;gap:10px;align-items:center;">
      <img src="${logos.qbt}" />
      <img src="${logos.zionism2000}" />
      <img src="${logos.joint}" style="height:18px" />
    </div>
  </div>
`

// ═══════════════════════════════════════════
// PDF 1: Agreement
// ═══════════════════════════════════════════
const agreementHtml = `<!DOCTYPE html><html lang="he"><head><meta charset="utf-8"><style>${sharedStyles}</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-right">
      <img src="${logos.shaveh}" class="org-logo" />
      <div>
        <div class="doc-title">הסכם השתתפות בתוכנית "שווה פיתוח"</div>
        <div class="doc-subtitle">מסלול א' - ליווי מלא | ינואר 2026</div>
      </div>
    </div>
    <div class="header-left">
      <img src="${logos.zionism2000}" />
      <img src="${logos.joint}" style="height:30px" />
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. הצדדים להסכם</div>
    <div class="field-row">
      <div class="field-label">הגוף המפעיל:</div>
      <div class="field-value">עמותת ציונות 2000 לאחריות חברתית, ע.ר. 58-012345-6, בשיתוף Q-BT - חשיבה קוגניטיבית התנהגותית</div>
    </div>
    <div class="field-row">
      <div class="field-label">הארגון המשתתף:</div>
      <div class="field-value">אסטרזניקה ישראל בע"מ, ח.פ. 51-234567-8</div>
    </div>
    <div class="field-row">
      <div class="field-label">איש קשר בארגון:</div>
      <div class="field-value">מיכל לוי, VP Human Resources | 054-2223344 | michal.l@astrazeneca.com</div>
    </div>
    <div class="field-row">
      <div class="field-label">מסלול השתתפות:</div>
      <div class="field-value"><span class="badge badge-blue">מסלול א' - ליווי ייעוצי מלא</span></div>
    </div>
    <div class="field-row">
      <div class="field-label">תקופת ההתקשרות:</div>
      <div class="field-value">16 חודשים מיום חתימת ההסכם</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. תיאור התוכנית</div>
    <p>תוכנית "שווה פיתוח" מספקת מסגרת לפיתוח תשתית העסקה בארגונים, המותאמת לעידן של תוחלת חיים מתארכת ולמציאות ארגונית רב-גילית. התוכנית כוללת:</p>
    <ul>
      <li><strong>אבחון ארגוני מקיף</strong> - שאלון לעובדים, מנהלים ומחלקת HR + ניתוח מומחה</li>
      <li><strong>תוכנית עבודה מותאמת</strong> - בניית תוכנית יישום עם לוחות זמנים ויעדים מדידים</li>
      <li><strong>ליווי ייעוצי</strong> - עד 8 מפגשי ייעוץ עם יועץ ארגוני מוסמך</li>
      <li><strong>סדנאות והכשרות</strong> - למנהלים, צוותי HR ועובדים</li>
      <li><strong>מדידה והפקת לקחים</strong> - דשבורד מעקב בזמן אמת ודוחות התקדמות</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">3. התחייבויות הארגון</div>
    <div class="highlight-box">
      <strong>הארגון מתחייב:</strong>
      <ul>
        <li>למנות נציג/ת פרויקט פנימי/ת שיהווה איש קשר מרכזי</li>
        <li>לאפשר ביצוע אבחון ארגוני (הפצת שאלונים, גישה לנתונים)</li>
        <li>להשתתף בסדנאות ובמפגשי ייעוץ כמוגדר בתוכנית העבודה</li>
        <li>לספק משוב שוטף על תהליך ההטמעה</li>
        <li>להקצות משאבים פנימיים ליישום ההמלצות</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. לוח זמנים מרכזי</div>
    <table>
      <tr><th>שלב</th><th>תיאור</th><th>משך</th><th>תפוקה</th></tr>
      <tr><td>התנעה</td><td>פגישת היכרות, מיפוי בעלי עניין, תיאום ציפיות</td><td>שבועיים</td><td>מסמך תיאום ציפיות חתום</td></tr>
      <tr><td>אבחון</td><td>הפצת שאלונים, ראיונות, ניתוח ממצאים</td><td>6 שבועות</td><td>דוח אבחון ארגוני</td></tr>
      <tr><td>תכנון</td><td>גיבוש תוכנית עבודה והצגה להנהלה</td><td>3 שבועות</td><td>תוכנית עבודה מאושרת</td></tr>
      <tr><td>הטמעה</td><td>ליווי ייעוצי, סדנאות, יישום פרקטיקות</td><td>8 חודשים</td><td>דוחות התקדמות רבעוניים</td></tr>
      <tr><td>מדידה וסיום</td><td>הערכת השפעה, דוח סיכום, המלצות המשך</td><td>חודשיים</td><td>דוח סיכום + המלצות</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">5. חתימות</div>
    <div style="display:flex;gap:60px;margin-top:20px;">
      <div style="flex:1">
        <div class="field-label">מטעם הגוף המפעיל:</div>
        <div style="margin-top:40px;border-top:1px solid #ccc;padding-top:8px;">
          תהל | מנהלת תוכנית<br/>ציונות 2000 לאחריות חברתית
        </div>
      </div>
      <div style="flex:1">
        <div class="field-label">מטעם הארגון:</div>
        <div style="margin-top:40px;border-top:1px solid #ccc;padding-top:8px;">
          מיכל לוי | VP HR<br/>אסטרזניקה ישראל בע"מ
        </div>
      </div>
    </div>
  </div>

  ${footer}
</div>
</body></html>`

// ═══════════════════════════════════════════
// PDF 2: Assessment Report
// ═══════════════════════════════════════════
const assessmentHtml = `<!DOCTYPE html><html lang="he"><head><meta charset="utf-8"><style>${sharedStyles}
  .dim-card {
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .dim-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .dim-name { font-weight: 700; font-size: 14px; }
  .dim-score { font-size: 18px; font-weight: 700; }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-right">
      <img src="${logos.shaveh}" class="org-logo" />
      <div>
        <div class="doc-title">דוח אבחון ארגוני</div>
        <div class="doc-subtitle">אסטרזניקה ישראל | פברואר 2026</div>
      </div>
    </div>
    <div class="header-left">
      <img src="${logos.astrazeneca}" style="height:45px" />
    </div>
  </div>

  <div class="section">
    <div class="section-title">סיכום מנהלים</div>
    <div class="green-box">
      <strong>ציון כולל: 3.8 מתוך 5.0</strong> <span class="badge badge-green">מעל הממוצע</span>
      <p style="margin-top:8px">אסטרזניקה ישראל מציגה רמת מוכנות גבוהה יחסית להעסקת עובדים מעל גיל 50. הארגון כבר מפעיל מספר יוזמות בתחום גיוון גילי, אך ישנם פערים בתחומי ניהול הידע וההכשרות המותאמות.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">פירוט ממצאים לפי ממד</div>

    <div class="dim-card">
      <div class="dim-header">
        <div class="dim-name">1. גיוס והשמה</div>
        <div class="dim-score" style="color:#70bdb3">4.2</div>
      </div>
      <div class="score-bar-bg"><div class="score-bar" style="width:84%"></div></div>
      <p style="margin-top:6px">תהליכי הגיוס כוללים מדיניות שוויון הזדמנויות מוצהרת. מודעות דרושים ניטרליות מבחינת גיל. קיימת עבודה עם חברות השמה המתמחות בגילאי 50+.</p>
    </div>

    <div class="dim-card">
      <div class="dim-header">
        <div class="dim-name">2. פיתוח מקצועי והכשרות</div>
        <div class="dim-score" style="color:#e9ab56">3.1</div>
      </div>
      <div class="score-bar-bg"><div class="score-bar" style="width:62%;background:#e9ab56"></div></div>
      <p style="margin-top:6px">תוכניות הכשרה קיימות אך לא מותאמות לקבוצות גיל שונות. אין מסלולי למידה גמישים לעובדים ותיקים. דרוש פיתוח תוכניות reskilling.</p>
    </div>

    <div class="dim-card">
      <div class="dim-header">
        <div class="dim-name">3. ניהול ידע והעברה בין-דורית</div>
        <div class="dim-score" style="color:#e8969f">2.8</div>
      </div>
      <div class="score-bar-bg"><div class="score-bar" style="width:56%;background:#e8969f"></div></div>
      <p style="margin-top:6px">הפער המרכזי: אין תהליך מובנה להעברת ידע מעובדים ותיקים. ידע מקצועי קריטי לא מתועד. המלצה דחופה: הקמת תוכנית מנטורינג בין-דורית.</p>
    </div>

    <div class="dim-card">
      <div class="dim-header">
        <div class="dim-name">4. תנאי עבודה וגמישות</div>
        <div class="dim-score" style="color:#70bdb3">4.5</div>
      </div>
      <div class="score-bar-bg"><div class="score-bar" style="width:90%"></div></div>
      <p style="margin-top:6px">ביצועים מצוינים: מדיניות עבודה גמישה (היברידית), אפשרות למשרות חלקיות, התאמות ארגונומיות. מודל לחיקוי בתעשייה.</p>
    </div>

    <div class="dim-card">
      <div class="dim-header">
        <div class="dim-name">5. תרבות ארגונית ושייכות</div>
        <div class="dim-score" style="color:#70bdb3">4.0</div>
      </div>
      <div class="score-bar-bg"><div class="score-bar" style="width:80%"></div></div>
      <p style="margin-top:6px">אקלים ארגוני חיובי כלפי עובדים ותיקים. קיימים אירועים חוצי-דורות. יש מקום לשיפור בייצוג גילאי 50+ בהנהלה הבכירה.</p>
    </div>

    <div class="dim-card">
      <div class="dim-header">
        <div class="dim-name">6. הכנה לפרישה ומעבר</div>
        <div class="dim-score" style="color:#e9ab56">3.2</div>
      </div>
      <div class="score-bar-bg"><div class="score-bar" style="width:64%;background:#e9ab56"></div></div>
      <p style="margin-top:6px">קיימת תוכנית פרישה בסיסית, אך היא מתמקדת בהיבטים פיננסיים בלבד. חסר: ליווי רגשי, תכנון קריירה שנייה, אפשרויות העסקה גמישה אחרי פרישה.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">מתודולוגיה</div>
    <div class="field-row"><div class="field-label">עובדים שענו:</div><div class="field-value">81 מתוך 120 (67%)</div></div>
    <div class="field-row"><div class="field-label">מנהלים שענו:</div><div class="field-value">12 מתוך 15 (80%)</div></div>
    <div class="field-row"><div class="field-label">ראיונות עומק:</div><div class="field-value">6 (3 מנהלים, 2 עובדים ותיקים, 1 HR)</div></div>
    <div class="field-row"><div class="field-label">תקופת איסוף:</div><div class="field-value">15.1.2026 - 10.2.2026</div></div>
  </div>

  ${footer}
</div>
</body></html>`

// ═══════════════════════════════════════════
// PDF 3: Recommendations
// ═══════════════════════════════════════════
const recommendationsHtml = `<!DOCTYPE html><html lang="he"><head><meta charset="utf-8"><style>${sharedStyles}
  .rec-card {
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    border-right: 4px solid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .rec-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-weight: 700;
    font-size: 14px;
    color: white;
    margin-left: 10px;
  }
  .metric-row {
    display: flex;
    gap: 20px;
    margin-top: 10px;
  }
  .metric {
    background: #f9f7f5;
    border-radius: 8px;
    padding: 8px 14px;
    text-align: center;
  }
  .metric-value { font-size: 18px; font-weight: 700; }
  .metric-label { font-size: 10px; color: #706e6d; }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-right">
      <img src="${logos.shaveh}" class="org-logo" />
      <div>
        <div class="doc-title">דוח המלצות אסטרטגיות</div>
        <div class="doc-subtitle">ביג מרכזי קניות | מרץ 2026</div>
      </div>
    </div>
    <div class="header-left">
      <img src="${logos.big}" style="height:45px" />
    </div>
  </div>

  <div class="section">
    <div class="section-title">רקע</div>
    <p>בהמשך לאבחון הארגוני שבוצע בחודשים ינואר-פברואר 2026, ולאחר ניתוח הממצאים מ-250 עובדים ו-18 מנהלים ב-3 קניונים, להלן המלצות אסטרטגיות לשלב ההטמעה. ההמלצות מדורגות לפי עדיפות ומתמקדות באוכלוסיית עובדי הקניונים בגילאי 55+.</p>
  </div>

  <div class="section">
    <div class="section-title">המלצות ליישום</div>

    <div class="rec-card" style="border-right-color:#e8969f">
      <div style="display:flex;align-items:center;margin-bottom:10px">
        <span class="rec-number" style="background:#e8969f">1</span>
        <div>
          <strong style="font-size:15px">תוכנית הסדרי עבודה גמישים לעובדים 55+</strong>
          <div><span class="badge badge-yellow">עדיפות גבוהה</span> <span class="badge badge-blue">ROI צפוי: גבוה</span></div>
        </div>
      </div>
      <p>הקמת מסלול "עבודה חכמה" המאפשר לעובדים ותיקים לעבור למשרה חלקית (60-80%) תוך שמירה על תנאים סוציאליים מלאים. כולל אפשרות לעבודה מרחוק חלקית לתפקידים מנהליים.</p>
      <div class="metric-row">
        <div class="metric"><div class="metric-value" style="color:#e8969f">23%</div><div class="metric-label">ירידה צפויה בנטישה</div></div>
        <div class="metric"><div class="metric-value" style="color:#4263aa">₪180K</div><div class="metric-label">חיסכון שנתי בגיוס</div></div>
        <div class="metric"><div class="metric-value" style="color:#70bdb3">3 חודשים</div><div class="metric-label">זמן הטמעה</div></div>
      </div>
    </div>

    <div class="rec-card" style="border-right-color:#4263aa">
      <div style="display:flex;align-items:center;margin-bottom:10px">
        <span class="rec-number" style="background:#4263aa">2</span>
        <div>
          <strong style="font-size:15px">תוכנית מנטורינג בין-דורית</strong>
          <div><span class="badge badge-yellow">עדיפות גבוהה</span> <span class="badge badge-green">יישום מהיר</span></div>
        </div>
      </div>
      <p>שיוך עובדים ותיקים (10+ שנות ניסיון) כמנטורים לעובדים חדשים. מפגש שבועי של 60 דקות, תוכנית מובנית ל-6 חודשים. מבטיח העברת ידע שיטתית ומחזק תחושת ערך אצל העובדים הוותיקים.</p>
      <div class="metric-row">
        <div class="metric"><div class="metric-value" style="color:#e8969f">40%</div><div class="metric-label">שיפור שימור ידע</div></div>
        <div class="metric"><div class="metric-value" style="color:#4263aa">85%</div><div class="metric-label">שביעות רצון מנטורים</div></div>
        <div class="metric"><div class="metric-value" style="color:#70bdb3">6 שבועות</div><div class="metric-label">זמן הטמעה</div></div>
      </div>
    </div>

    <div class="rec-card" style="border-right-color:#70bdb3">
      <div style="display:flex;align-items:center;margin-bottom:10px">
        <span class="rec-number" style="background:#70bdb3">3</span>
        <div>
          <strong style="font-size:15px">התאמת תהליכי גיוס לגיוון גילי</strong>
          <div><span class="badge badge-green">עדיפות בינונית</span></div>
        </div>
      </div>
      <p>עדכון מודעות דרושים להסרת שפה מפלה על בסיס גיל ("צעיר ודינמי", "שירות צבאי מלא"). הכשרת מנהלי גיוס לראיונות ללא הטיה. הוספת ערוצי גיוס המותאמים לגילאי 50+ (מרכזי תעסוקה, קהילות).</p>
      <div class="metric-row">
        <div class="metric"><div class="metric-value" style="color:#e8969f">+15%</div><div class="metric-label">עלייה במועמדים 50+</div></div>
        <div class="metric"><div class="metric-value" style="color:#4263aa">₪50K</div><div class="metric-label">עלות הטמעה</div></div>
        <div class="metric"><div class="metric-value" style="color:#70bdb3">8 שבועות</div><div class="metric-label">זמן הטמעה</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">סיכום ROI צפוי</div>
    <div class="blue-box">
      <strong>השפעה כוללת (12 חודשים):</strong>
      <ul>
        <li><strong>לארגון:</strong> חיסכון של כ-₪350K בעלויות תחלופה, שיפור של 18% בציוני מעורבות עובדים, שמירה על ידע ארגוני קריטי</li>
        <li><strong>לעובד:</strong> הגדלת אפשרויות תעסוקה גמישה, תחושת ערך וביטחון תעסוקתי, הזדמנויות התפתחות מקצועית</li>
        <li><strong>למשק:</strong> הארכת חיי עבודה ב-2-3 שנים בממוצע, הפחתת התלות בקצבאות, חיזוק ההון האנושי הלאומי</li>
      </ul>
    </div>
  </div>

  ${footer}
</div>
</body></html>`

// ═══════════════════════════════════════════
// Generate PDFs
// ═══════════════════════════════════════════
async function generate() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
  })

  const docs = [
    { html: agreementHtml, name: 'agreement-sample.pdf' },
    { html: assessmentHtml, name: 'assessment-report.pdf' },
    { html: recommendationsHtml, name: 'recommendations.pdf' },
  ]

  mkdirSync(`${PUBLIC}/docs`, { recursive: true })

  for (const doc of docs) {
    const page = await browser.newPage()
    await page.setContent(doc.html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: `${PUBLIC}/docs/${doc.name}`,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    await page.close()
    console.log(`Generated: ${doc.name}`)
  }

  await browser.close()
  console.log('Done!')
}

generate().catch(console.error)
