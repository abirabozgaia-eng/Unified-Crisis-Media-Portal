// src/components/Dashboard/Dashboard.js

'use strict';

/* ════════════════════════════════════════
   DATA CONSTANTS
   ════════════════════════════════════════ */

/** أسماء المناطق الجغرافية لخريطة الحرارة */
const HM_REGIONS = [
  'طرابلس', 'بنغازي', 'مصراتة',
  'الجفارة', 'سبها', 'درنة',
  'الجبل الغربي', 'الكفرة'
];

/** عدد الأعمدة الزمنية في الخريطة الحرارية (كل عمود = ساعة) */
const HM_COLS = 12;

/** قيم الكثافة الأساسية لكل منطقة (حوادث في الساعة) */
const HM_BASE_VALUES = [8, 4, 2, 1, 6, 10, 3, 2];

/** بيانات الشائعات المرصودة */
const RUMORS = [
  {
    id: 1, level: 'high', icon: '!',
    title: 'إشاعة: انهيار سد وادي كعام',
    meta: 'اكتُشفت منذ 23 دقيقة · فيسبوك، تيليغرام',
    spread: 87, tag: 'كارثة طبيعية'
  },
  {
    id: 2, level: 'high', icon: '!',
    title: 'معلومة مضللة: إغلاق مطار طرابلس',
    meta: 'اكتُشفت منذ 41 دقيقة · تويتر، واتساب',
    spread: 74, tag: 'أمن وطني'
  },
  {
    id: 3, level: 'high', icon: '!',
    title: 'خبر مزيف: انقطاع الكهرباء الوطنية',
    meta: 'اكتُشفت منذ 55 دقيقة · يوتيوب، فيسبوك',
    spread: 61, tag: 'بنية تحتية'
  },
  {
    id: 4, level: 'med', icon: '~',
    title: 'تضخيم: أعداد مصابي فيضان درنة',
    meta: 'اكتُشفت منذ 1.2 ساعة · تيليغرام',
    spread: 45, tag: 'صحة عامة'
  },
  {
    id: 5, level: 'med', icon: '~',
    title: 'معلومة ناقصة: إجراءات الإخلاء الساحلي',
    meta: 'اكتُشفت منذ 1.5 ساعة · واتساب',
    spread: 38, tag: 'إخلاء'
  },
  {
    id: 6, level: 'med', icon: '~',
    title: 'تشويه: بيان وزارة الصحة',
    meta: 'اكتُشفت منذ 2 ساعة · تويتر',
    spread: 32, tag: 'صحة'
  },
  {
    id: 7, level: 'med', icon: '~',
    title: 'شائعة: نقص الوقود في بنغازي',
    meta: 'اكتُشفت منذ 2.3 ساعة · فيسبوك',
    spread: 28, tag: 'إمدادات'
  },
  {
    id: 8, level: 'med', icon: '~',
    title: 'معلومة مضللة: قوافل إغاثة مسدودة',
    meta: 'اكتُشفت منذ 3 ساعات · تيليغرام',
    spread: 21, tag: 'إغاثة'
  },
  {
    id: 9, level: 'med', icon: '~',
    title: 'تلاعب: صور قديمة تُنسب لحريق اليوم',
    meta: 'اكتُشفت منذ 3.5 ساعة · تويتر',
    spread: 18, tag: 'تزوير بصري'
  },
  {
    id: 10, level: 'med', icon: '~',
    title: 'نسب مرتفعة: ضحايا الفيضانات مبالغ فيها',
    meta: 'اكتُشفت منذ 4 ساعات · يوتيوب',
    spread: 15, tag: 'إحصاء'
  },
  {
    id: 11, level: 'low', icon: '·',
    title: 'تكهنات: موعد انتهاء حالة الطوارئ',
    meta: 'اكتُشفت منذ 5 ساعات · تويتر',
    spread: 9, tag: 'سياسة'
  },
  {
    id: 12, level: 'low', icon: '·',
    title: 'معلومة غير مؤكدة: فتح ممرات بديلة',
    meta: 'اكتُشفت منذ 5.5 ساعة · فيسبوك',
    spread: 7, tag: 'مرور'
  },
  {
    id: 13, level: 'low', icon: '·',
    title: 'تخمين: توقيت انتهاء انقطاع المياه',
    meta: 'اكتُشفت منذ 6 ساعات · واتساب',
    spread: 5, tag: 'مياه'
  },
  {
    id: 14, level: 'low', icon: '·',
    title: 'نشر ساخر أُسيء فهمه عن الإخلاء',
    meta: 'اكتُشفت منذ 7 ساعات · تويتر',
    spread: 3, tag: 'نكتة'
  }
];

/** بيانات التنبيهات النشطة */
const ALERTS = [
  { color: '#dc2626', text: 'تحذير فيضان — منطقة الجفارة الغربية',      time: 'منذ 4 د' },
  { color: '#dc2626', text: 'تنبيه طارئ — إغلاق طريق الساحلي',          time: 'منذ 11 د' },
  { color: '#dc2626', text: 'تحذير أمني — منطقة تاجوراء',               time: 'منذ 22 د' },
  { color: '#f59e0b', text: 'تنبيه صحي — تلوث مياه سبها',               time: 'منذ 38 د' },
  { color: '#f59e0b', text: 'بيان رسمي جديد — وزارة الداخلية',           time: 'منذ 51 د' },
  { color: '#3b82f6', text: 'تحديث: فرق الإنقاذ وصلت درنة',             time: 'منذ 1:04' },
  { color: '#10b981', text: 'إعادة تشغيل: محطة كهرباء طرابلس',          time: 'منذ 1:23' }
];

/** بيانات الجهات الحكومية */
const ENTITIES = [
  { name: 'داخلية',   count: 12, active: true },
  { name: 'صحة',      count: 8,  active: true },
  { name: 'دفاع',     count: 6,  active: true },
  { name: 'بلدية',    count: 9,  active: true },
  { name: 'حماية',    count: 5,  active: true },
  { name: 'خارجية',   count: 3,  active: true },
  { name: 'نفط',      count: 4,  active: true },
  { name: 'مواصلات',  count: 7,  active: true },
  { name: 'تعليم',    count: 2,  active: false },
  { name: 'عدل',      count: 1,  active: false }
];

/** بيانات مخطط النشر الشريطي */
const PUBLISH_DATA = [4, 7, 3, 9, 12, 6];
const PUBLISH_LABELS = ['الآن-6h', 'الآن-5h', 'الآن-4h', 'الآن-3h', 'الآن-2h', 'الآن-1h'];

/* ════════════════════════════════════════
   COLOUR HELPERS
   ════════════════════════════════════════ */

/**
 * يُرجع لون الخلية في الخريطة الحرارية بناءً على قيمة الكثافة.
 * @param {number} v - قيمة الكثافة (عدد الأحداث)
 * @returns {string} لون CSS
 */
function hmColor(v) {
  if (v === 0)   return '#e2e8f0'; // لا بيانات — رمادي فاتح
  if (v < 3)     return '#bbf7d0'; // منخفض — أخضر فاتح
  if (v < 6)     return '#86efac'; // منخفض-متوسط — أخضر
  if (v < 9)     return '#fcd34d'; // متوسط — أصفر
  if (v < 12)    return '#fca5a5'; // مرتفع — أحمر فاتح
  return '#f87171';                // بالغ — أحمر
}

/**
 * يُرجع ألوان عرض شريط انتشار الشائعة.
 * @param {string} level - 'high' | 'med' | 'low'
 * @returns {{bar: string, bg: string, text: string}}
 */
function rumorColors(level) {
  const map = {
    high: { bar: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
    med:  { bar: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
    low:  { bar: '#22c55e', bg: '#ecfdf5', text: '#065f46' }
  };
  return map[level] || map.low;
}

/* ════════════════════════════════════════
   BUILD: HEATMAP
   ════════════════════════════════════════ */

/**
 * يبني الخريطة الحرارية داخل العنصر #heatmap.
 * كل صف = منطقة، كل عمود = ساعة زمنية سابقة.
 */
function buildHeatmap() {
  const container = document.getElementById('heatmap');
  if (!container) return;

  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${HM_COLS}, 1fr)`;
  container.style.gridTemplateRows    = `repeat(${HM_REGIONS.length}, 1fr)`;

  HM_REGIONS.forEach((region, rowIdx) => {
    for (let col = 0; col < HM_COLS; col++) {
      const hoursAgo = HM_COLS - 1 - col;
      const base     = HM_BASE_VALUES[rowIdx] || 2;
      // تراجع الكثافة كلما ابتعدنا زمنياً + تقلبات عشوائية خفيفة
      const rawVal   = base * (1 - (hoursAgo / HM_COLS) * 0.7) + (Math.random() * 3 - 1);
      const val      = Math.max(0, Math.round(rawVal));

      const cell = document.createElement('div');
      cell.className        = 'hm-cell';
      cell.style.background = hmColor(val);
      cell.setAttribute('role',     'gridcell');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('title',
        `${region} — ${hoursAgo === 0 ? 'الآن' : 'منذ ' + hoursAgo + ' ساعة'}: ${val} أحداث`
      );
      cell.setAttribute('aria-label',
        `${region}، منذ ${hoursAgo === 0 ? 'الآن' : hoursAgo + ' ساعة'}، ${val} أحداث`
      );
      container.appendChild(cell);
    }
  });
}

/* ════════════════════════════════════════
   BUILD: ALERTS LIST
   ════════════════════════════════════════ */

/**
 * يبني قائمة التنبيهات النشطة داخل #alerts-list.
 */
function buildAlerts() {
  const container = document.getElementById('alerts-list');
  if (!container) return;

  container.innerHTML = '';

  ALERTS.forEach((alert, idx) => {
    const item = document.createElement('div');
    item.className = 'alert-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', `تنبيه ${idx + 1}: ${alert.text}، ${alert.time}`);

    item.innerHTML = `
      <div class="ai-dot" style="background:${alert.color}" aria-hidden="true"></div>
      <div class="alert-text">${escapeHtml(alert.text)}</div>
      <div class="alert-time">${escapeHtml(alert.time)}</div>
    `;
    container.appendChild(item);
  });

  // تحديث عداد الشارة
  const badge = document.getElementById('alert-count-badge');
  if (badge) {
    badge.textContent = `${ALERTS.length} نشط`;
    badge.setAttribute('aria-label', `${ALERTS.length} تنبيه نشط`);
  }
}

/* ════════════════════════════════════════
   BUILD: ENTITIES GRID
   ════════════════════════════════════════ */

/**
 * يبني شبكة الجهات الحكومية داخل #entities-grid.
 */
function buildEntities() {
  const container = document.getElementById('entities-grid');
  if (!container) return;

  container.innerHTML = '';

  ENTITIES.forEach(entity => {
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label',
      `${entity.name}: ${entity.count} بيان، الحالة: ${entity.active ? 'نشطة' : 'غير نشطة'}`
    );

    card.innerHTML = `
      <div class="entity-name">${escapeHtml(entity.name)}</div>
      <div class="entity-count">${entity.count}</div>
      <div class="entity-status"
           style="background:${entity.active ? '#16a34a' : '#94a3b8'}"
           aria-hidden="true">
      </div>
    `;
    container.appendChild(card);
  });
}

/* ════════════════════════════════════════
   BUILD: RUMORS LIST
   ════════════════════════════════════════ */

/** الفلتر الحالي للشائعات */
let currentRumorFilter = 'all';

/**
 * يرسم قائمة الشائعات بناءً على الفلتر المحدد.
 * @param {string} filter - 'all' | 'high' | 'med' | 'low'
 */
function renderRumors(filter) {
  currentRumorFilter = filter;
  const container = document.getElementById('rumors-list');
  if (!container) return;

  const list = filter === 'all'
    ? RUMORS
    : RUMORS.filter(r => r.level === filter);

  // نعرض بحد أقصى 6 شائعات لتجنب الفائض المرئي
  const visible = list.slice(0, 6);

  container.innerHTML = '';

  visible.forEach(rumor => {
    const colors = rumorColors(rumor.level);
    const item   = document.createElement('div');
    item.className  = 'rumor-item';
    item.setAttribute('role',     'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label',
      `شائعة: ${rumor.title}، انتشار ${rumor.spread}%، مستوى: ${rumor.level}`
    );
    item.setAttribute('data-id', rumor.id);

    item.innerHTML = `
      <div class="rumor-icon ri-${rumor.level}"
           style="background:${colors.bg};color:${colors.text}"
           aria-hidden="true">
        ${escapeHtml(rumor.icon)}
      </div>
      <div class="rumor-text">
        <div class="rumor-title">${escapeHtml(rumor.title)}</div>
        <div class="rumor-meta">${escapeHtml(rumor.meta)}</div>
        <div class="rumor-tag" style="color:${colors.text}">${escapeHtml(rumor.tag)}</div>
      </div>
      <div class="rumor-bar-wrap" aria-hidden="true">
        <div class="rumor-pct">${rumor.spread}%</div>
        <div class="rumor-bar">
          <div class="rumor-fill"
               style="width:${rumor.spread}%;background:${colors.bar}">
          </div>
        </div>
        <div class="rumor-bar-lbl">انتشار</div>
      </div>
    `;

    // حدث النقر لفتح التفاصيل (يمكن ربطه بـ sendPrompt أو نافذة منبثقة)
    item.addEventListener('click', () => handleRumorClick(rumor));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRumorClick(rumor);
      }
    });

    container.appendChild(item);
  });
}

/**
 * معالجة النقر على شائعة.
 * @param {{id:number, title:string}} rumor
 */
function handleRumorClick(rumor) {
  // في بيئة المنصة، يتم استدعاء sendPrompt مع تفاصيل الشائعة
  if (typeof sendPrompt === 'function') {
    sendPrompt(`اعرض تفاصيل الشائعة: ${rumor.title}`);
  } else {
    console.info('[Dashboard] Rumor clicked:', rumor.title);
  }
}

/**
 * تصفية الشائعات عند الضغط على تبويب.
 * @param {string} filter - 'all' | 'high' | 'med' | 'low'
 * @param {HTMLElement} btn - زر التبويب المضغوط
 */
function filterRumors(filter, btn) {
  // إزالة الحالة النشطة من جميع التبويبات
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  // تفعيل التبويب المضغوط
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  renderRumors(filter);
}

/* ════════════════════════════════════════
   LIVE CLOCK
   ════════════════════════════════════════ */

/**
 * يحدّث عنصر الساعة المباشرة كل ثانية.
 */
function startLiveClock() {
  const timeEl = document.getElementById('live-time');
  if (!timeEl) return;

  function tick() {
    const now = new Date();
    const formatted = now.toLocaleTimeString('ar-LY', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    timeEl.textContent = formatted;
    timeEl.setAttribute('datetime', now.toISOString());
  }

  tick();
  setInterval(tick, 1000);
}

/* ════════════════════════════════════════
   CHARTS (Chart.js)
   ════════════════════════════════════════ */

/** مرجع لمخطط النشر (لتجنب التكرار عند التحديث) */
let publishChartInstance = null;

/** مرجع لمخطط القنوات */
let channelChartInstance = null;

/**
 * ينشئ مخطط نشاط النشر الشريطي.
 */
function buildPublishChart() {
  const canvas = document.getElementById('publishChart');
  if (!canvas || typeof Chart === 'undefined') return;

  // تدمير الحالة السابقة إن وُجدت
  if (publishChartInstance) {
    publishChartInstance.destroy();
    publishChartInstance = null;
  }

  const ctx = canvas.getContext('2d');

  publishChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: PUBLISH_LABELS,
      datasets: [{
        label: 'بيانات صحفية',
        data:  PUBLISH_DATA,
        backgroundColor: [
          '#93c5fd', '#60a5fa', '#3b82f6',
          '#2563eb', '#1d4ed8', '#1e40af'
        ],
        borderRadius:     4,
        borderSkipped:    false
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend:  { display: false },
        tooltip: {
          rtl:         true,
          bodyFont:    { family: 'Cairo' },
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} بيانات`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            font:  { size: 9, family: 'IBM Plex Mono' },
            color: '#94a3b8'
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            font:        { size: 9, family: 'IBM Plex Mono' },
            color:       '#94a3b8',
            stepSize:    2,
            maxTicksLimit: 6
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * ينشئ مخطط توزيع قنوات النشر الدائري.
 */
function buildChannelChart() {
  const canvas = document.getElementById('channelChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (channelChartInstance) {
    channelChartInstance.destroy();
    channelChartInstance = null;
  }

  const ctx = canvas.getContext('2d');

  channelChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['تلفزيون', 'تواصل اجتماعي', 'SMS', 'بريد إلكتروني'],
      datasets: [{
        data:            [30, 35, 20, 15],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
        borderWidth:     0,
        hoverOffset:     4
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '62%',
      plugins: {
        legend:  { display: false },
        tooltip: {
          rtl:      true,
          bodyFont: { family: 'Cairo' },
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}%`
          }
        }
      }
    }
  });
}

/* ════════════════════════════════════════
   REFRESH HANDLER
   ════════════════════════════════════════ */

/**
 * يحدّث الخريطة الحرارية ببيانات عشوائية جديدة (محاكاة تحديث حي).
 */
function refreshDashboard() {
  buildHeatmap();

  // تحديث قيمة KPI التنبيهات بشكل عشوائي طفيف للمحاكاة
  const alertVal  = document.querySelector('#kpi-alerts .kpi-val');
  if (alertVal) {
    const newVal = Math.max(5, Math.round(7 + (Math.random() * 4 - 2)));
    alertVal.textContent = newVal;
    alertVal.setAttribute('aria-label', `${newVal} تنبيه نشط`);
  }

  console.info('[Dashboard] Refreshed at', new Date().toLocaleTimeString('ar-LY'));
}

/* ════════════════════════════════════════
   UTILITY
   ════════════════════════════════════════ */

/**
 * يُهرّب الأحرف الخاصة في HTML لمنع XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ════════════════════════════════════════
   INITIALISATION
   ════════════════════════════════════════ */

/**
 * نقطة الدخول الرئيسية — تُنفَّذ عند تحميل DOM.
 */
function initDashboard() {
  // بناء المكونات الثابتة
  buildHeatmap();
  buildAlerts();
  buildEntities();
  renderRumors('all');

  // الساعة المباشرة
  startLiveClock();

  // الرسوم البيانية (نتأكد من تحميل Chart.js أولاً)
  if (typeof Chart !== 'undefined') {
    buildPublishChart();
    buildChannelChart();
  } else {
    // إعادة محاولة بعد 500ms إن لم يُحمَّل Chart.js بعد
    setTimeout(() => {
      if (typeof Chart !== 'undefined') {
        buildPublishChart();
        buildChannelChart();
      }
    }, 500);
  }

  // زر التحديث اليدوي
  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshDashboard);
  }

  // تحديث تلقائي كل 60 ثانية (محاكاة البث الحي)
  setInterval(refreshDashboard, 60_000);

  console.info('[Dashboard] Initialized successfully — المنصة الإعلامية الوطنية الموحدة');
}

// تشغيل عند جهوزية DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

// تصدير الدوال للاستخدام الخارجي (في بيئة Module أو اختبارات)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initDashboard,
    buildHeatmap,
    buildAlerts,
    buildEntities,
    renderRumors,
    filterRumors,
    refreshDashboard,
    hmColor,
    rumorColors,
    escapeHtml
  };
}