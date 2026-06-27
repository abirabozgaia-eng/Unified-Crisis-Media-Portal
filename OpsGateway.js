// src/components/Gateway/OpsGateway.js

'use strict';

/* ════════════════════════════════════════
   CONSTANTS & STATE
   ════════════════════════════════════════ */

/** تعيين رمز JWT مزيف لكل جهة */
const ENTITY_TOKENS = {
  MOI:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MOI_CLAIM.sig_moi_xx',
  MOH:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MOH_CLAIM.sig_moh_xx',
  MOD:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MOD_CLAIM.sig_mod_xx',
  MOT:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MOT_CLAIM.sig_mot_xx',
  GECOL:  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.GECOL_CLAIM.sig_gecol',
  NLITC:  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.NLITC_CLAIM.sig_nlitc',
  CIVIL:  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.CIVIL_CLAIM.sig_civil',
  MUN:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MUN_CLAIM.sig_mun_xx',
  MFA:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MFA_CLAIM.sig_mfa_xx',
  MOJ:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MOJ_CLAIM.sig_moj_xx',
  MOE:    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.MOE_CLAIM.sig_moe_xx',
  NCECDM: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.NCECDM_CLAIM.sig_ncecdm'
};

/** عدد سكان كل منطقة (للتقدير) */
const GEO_POPULATION = {
  'طرابلس':       1_200_000,
  'الجفارة':       420_000,
  'مصراتة':        550_000,
  'درنة':           180_000,
  'بنغازي':         680_000,
  'سبها':           130_000,
  'الجبل الغربي':  240_000,
  'الكفرة':          50_000
};

/** مدة كل خطوة في محاكاة سير العمل (مللي ثانية) */
const STEP_DURATIONS = [5_000, 10_000, 60_000, 10_000, 5_000];

/** نصوص الحالة خلال كل خطوة */
const STEP_STATUS_LABELS = [
  'جارٍ الإرسال عبر API Gateway...',
  'التحقق التلقائي بالذكاء الاصطناعي...',
  'انتظار موافقة محرر مركز العمليات...',
  'النشر الفوري على جميع المنصات...',
  'تأكيد البث العام وأرشفة السجل...'
];

/** حالة النموذج والتنبيه الجغرافي */
let state = {
  selectedPriority:  null,           // 1 | 2 | 3 | 4
  activeRegions:     ['الجفارة', 'درنة'],
  activeChannels:    ['sms', 'email', 'app'],
  workflowRunning:   false,
  workflowStartTime: null,
  workflowStep:      0,
  workflowTimerID:   null,
  tickerID:          null
};

/* ════════════════════════════════════════
   UTILITY FUNCTIONS
   ════════════════════════════════════════ */

/**
 * يُهرّب HTML لمنع XSS.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * يُحوِّل الثواني إلى صيغة د:ثث.
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * يُحسب الزمن المنقضي منذ بدء سير العمل بالثواني.
 * @returns {number}
 */
function getElapsedSeconds() {
  if (!state.workflowStartTime) return 0;
  return Math.floor((Date.now() - state.workflowStartTime) / 1000);
}

/* ════════════════════════════════════════
   FORM SECTION — ENTITY & TOKEN
   ════════════════════════════════════════ */

/**
 * يُعالج تغيير الجهة المُرسِلة:
 * - يُحدِّث حقل الـ Token
 * - يُعيد فحص جاهزية الزر
 */
function handleEntityChange() {
  const sel   = document.getElementById('entity-sel');
  const field = document.getElementById('token-field');
  if (!sel || !field) return;

  const code = sel.value;
  field.value = code
    ? ENTITY_TOKENS[code] || `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${code}_CLAIM.sig_generic`
    : '••••••••••••••••••••';

  checkFormReadiness();
}

/* ════════════════════════════════════════
   FORM SECTION — PRIORITY
   ════════════════════════════════════════ */

/**
 * يُحدِّد مستوى الأولوية ويُحدِّث حالة الأزرار.
 * @param {number} level - 1 | 2 | 3 | 4
 * @param {HTMLElement} clickedBtn
 */
function setPriority(level, clickedBtn) {
  state.selectedPriority = level;

  // إعادة جميع الأزرار إلى الحالة الافتراضية
  document.querySelectorAll('.pri-btn').forEach(btn => {
    btn.className = 'pri-btn';
    btn.setAttribute('aria-checked', 'false');
  });

  // تفعيل الزر المضغوط
  clickedBtn.classList.add(`active-p${level}`);
  clickedBtn.setAttribute('aria-checked', 'true');

  checkFormReadiness();
}

/* ════════════════════════════════════════
   FORM SECTION — TITLE & BODY COUNTERS
   ════════════════════════════════════════ */

function handleTitleInput() {
  const input   = document.getElementById('alert-title');
  const counter = document.getElementById('title-counter');
  if (input && counter) {
    counter.textContent = `${input.value.length} / 120`;
  }
  checkFormReadiness();
}

function handleBodyInput() {
  const input   = document.getElementById('alert-body');
  const counter = document.getElementById('body-counter');
  if (input && counter) {
    counter.textContent = `${input.value.length} / 500`;
  }
  checkFormReadiness();
}

/* ════════════════════════════════════════
   FORM SECTION — READINESS CHECK
   ════════════════════════════════════════ */

/**
 * يتحقق من اكتمال الحقول المطلوبة ويُفعِّل/يُعطِّل زر الإرسال.
 */
function checkFormReadiness() {
  const entity    = (document.getElementById('entity-sel')  ?.value || '').trim();
  const eventType = (document.getElementById('event-type')  ?.value || '').trim();
  const title     = (document.getElementById('alert-title') ?.value || '').trim();
  const body      = (document.getElementById('alert-body')  ?.value || '').trim();

  const isReady = entity && eventType && title && body && state.selectedPriority;

  const btn = document.getElementById('send-btn');
  if (btn) {
    btn.disabled = !isReady;
    btn.setAttribute('aria-disabled', isReady ? 'false' : 'true');
  }
}

/* ════════════════════════════════════════
   FORM SECTION — RELATED ENTITIES
   ════════════════════════════════════════ */

/**
 * يُضيف جهة معنية كـ Tag في منطقة العلامات.
 */
function addRelatedEntity() {
  const picker = document.getElementById('entity-picker');
  const tags   = document.getElementById('entity-tags');
  if (!picker || !tags) return;

  const val = picker.value;
  if (!val) return;

  // منع التكرار
  const exists = Array.from(tags.querySelectorAll('.etag')).some(
    t => t.textContent.trim().replace('×','').trim() === val
  );
  if (exists) { picker.value = ''; return; }

  const tag      = document.createElement('span');
  tag.className  = 'etag';
  tag.setAttribute('role', 'listitem');
  tag.innerHTML  = `
    ${esc(val)}
    <button type="button" class="etag-remove"
            aria-label="إزالة ${esc(val)}"
            onclick="removeEntityTag(this)">×</button>
  `;
  tags.appendChild(tag);
  picker.value = '';
}

/**
 * يُزيل جهة من قائمة العلامات.
 * @param {HTMLElement} btn - زر الإزالة ×
 */
function removeEntityTag(btn) {
  const tag = btn.closest('.etag');
  if (tag) tag.remove();
}

/* ════════════════════════════════════════
   FORM SECTION — SEND & DRAFT
   ════════════════════════════════════════ */

/**
 * يُعالج ضغط زر الإرسال:
 * - يتحقق من صحة النموذج
 * - يُحدِّث واجهة المستخدم
 * - يُشغِّل سير العمل
 */
function handleSendAlert() {
  // إخفاء أي رسائل سابقة
  hideBanner('validation-summary');
  hideBanner('success-banner');

  // التحقق النهائي
  const errors = validateForm();
  if (errors.length) {
    showValidationSummary(errors);
    return;
  }

  // تحديث عداد اليوم
  const counter = document.getElementById('pub-count');
  if (counter) counter.textContent = (parseInt(counter.textContent, 10) + 1).toString();

  // تعطيل الزر وتغيير نصه
  const btn = document.getElementById('send-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
      تم الإرسال — جارٍ المعالجة
    `;
  }

  // إظهار بانر النجاح
  showSuccessBanner('تم الإرسال بنجاح — جارٍ تشغيل سير العمل تلقائياً...');

  // تشغيل سير العمل تلقائياً
  setTimeout(() => runWorkflow(), 400);
}

/**
 * يُنفِّذ التحقق من صحة النموذج.
 * @returns {string[]} قائمة رسائل الخطأ
 */
function validateForm() {
  const errors = [];
  if (!document.getElementById('entity-sel')?.value)  errors.push('يجب اختيار الجهة المُرسِلة.');
  if (!document.getElementById('event-type')?.value)  errors.push('يجب اختيار نوع الحدث.');
  if (!state.selectedPriority)                         errors.push('يجب تحديد مستوى الأولوية.');
  if (!document.getElementById('alert-title')?.value.trim()) errors.push('يجب كتابة عنوان البيان العاجل.');
  if (!document.getElementById('alert-body')?.value.trim())  errors.push('يجب كتابة نص البيان الرسمي.');
  return errors;
}

/**
 * يحفظ المسودة (محاكاة).
 */
function handleSaveDraft() {
  const title = document.getElementById('alert-title')?.value || '(بدون عنوان)';
  showSuccessBanner(`تم حفظ المسودة: "${esc(title.substring(0, 40))}"`);
  console.info('[Gateway] Draft saved:', title);
}

/** يعرض رسالة خطأ التحقق */
function showValidationSummary(errors) {
  const el = document.getElementById('validation-summary');
  if (!el) return;
  el.innerHTML = errors.map(e => `<div>• ${esc(e)}</div>`).join('');
  el.style.display = 'block';
  el.focus();
}

/** يعرض بانر النجاح */
function showSuccessBanner(msg) {
  const el   = document.getElementById('success-banner');
  const text = document.getElementById('success-text');
  if (!el || !text) return;
  text.textContent = msg;
  el.style.display = 'flex';
}

/** يُخفي عنصراً بالـ ID */
function hideBanner(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ════════════════════════════════════════
   GEO-TARGETING SECTION
   ════════════════════════════════════════ */

/**
 * يُبدِّل حالة تحديد قناة الإرسال.
 * @param {HTMLElement} btn
 */
function toggleChannel(btn) {
  const ch = btn.getAttribute('data-ch');
  const isActive = btn.classList.toggle('active');
  btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

  if (isActive) {
    if (!state.activeChannels.includes(ch)) state.activeChannels.push(ch);
  } else {
    state.activeChannels = state.activeChannels.filter(c => c !== ch);
  }
  updateReachEstimate();
}

/**
 * يُبدِّل حالة تحديد منطقة جغرافية (زر + خريطة).
 * @param {HTMLElement} btn
 */
function toggleRegion(btn) {
  const region   = btn.getAttribute('data-region');
  const isActive = btn.classList.toggle('active');
  btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

  if (isActive) {
    if (!state.activeRegions.includes(region)) state.activeRegions.push(region);
  } else {
    state.activeRegions = state.activeRegions.filter(r => r !== region);
  }

  syncMapHighlight();
  updateReachEstimate();
  updateTargetCountBadge();
}

/**
 * يمزامن تظليل الخريطة SVG مع المناطق المحددة.
 */
function syncMapHighlight() {
  document.querySelectorAll('.map-region').forEach(rect => {
    const name = rect.getAttribute('data-region');
    const label = rect.nextElementSibling; // عنصر <text>

    if (state.activeRegions.includes(name)) {
      rect.classList.add('active-geo');
      if (label && label.tagName === 'text') {
        label.classList.add('active-label');
      }
    } else {
      rect.classList.remove('active-geo');
      if (label && label.tagName === 'text') {
        label.classList.remove('active-label');
      }
    }
  });
}

/**
 * يُحسب ويُحدِّث عدد المستفيدين المقدَّرين.
 */
function updateReachEstimate() {
  const totalPop = state.activeRegions.reduce((sum, r) => sum + (GEO_POPULATION[r] || 0), 0);
  const chFactor = 0.4 + state.activeChannels.length * 0.12;
  const estimate = Math.round(totalPop * Math.min(chFactor, 0.92));

  const el = document.getElementById('reach-estimate');
  if (el) el.textContent = estimate.toLocaleString('ar-LY');
}

/**
 * يُحدِّث شارة عدد المناطق المحددة.
 */
function updateTargetCountBadge() {
  const badge = document.getElementById('target-count-badge');
  if (badge) {
    const count = state.activeRegions.length;
    badge.textContent = `${count} ${count === 1 ? 'منطقة محددة' : 'مناطق محددة'}`;
  }
}

/* ════════════════════════════════════════
   WORKFLOW SECTION
   ════════════════════════════════════════ */

/**
 * يُشغِّل محاكاة سير العمل من الخطوة 0.
 */
function runWorkflow() {
  if (state.workflowRunning) return;

  state.workflowRunning   = true;
  state.workflowStartTime = Date.now();
  state.workflowStep      = 0;

  const runBtn = document.getElementById('wf-run-btn');
  if (runBtn) runBtn.disabled = true;

  // بدء مؤقت العرض (يُحدَّث كل 200ms)
  state.tickerID = setInterval(updateWorkflowTicker, 200);

  // تنفيذ الخطوة الأولى
  advanceWorkflowStep();
}

/**
 * يُنفِّذ خطوة سير العمل الحالية ثم يُجدوِل الخطوة التالية.
 */
function advanceWorkflowStep() {
  const step = state.workflowStep;
  if (step > 4) return;

  renderWorkflowSteps(step);
  updateTimelineBar(step);
  updateWorkflowStatusText(STEP_STATUS_LABELS[step]);

  state.workflowTimerID = setTimeout(() => {
    // تسجيل الوقت المستغرق للخطوة
    const timeEl = document.getElementById(`t${step}`);
    if (timeEl) {
      timeEl.textContent = `✓ اكتمل في ${getElapsedSeconds()} ث`;
    }

    state.workflowStep++;

    if (state.workflowStep < 5) {
      advanceWorkflowStep();
    } else {
      finishWorkflow();
    }
  }, STEP_DURATIONS[step]);
}

/**
 * يُنهي سير العمل بنجاح.
 */
function finishWorkflow() {
  clearInterval(state.tickerID);

  // تعيين جميع الخطوات كمنتهية
  renderWorkflowSteps(5); // 5 = جميع الخطوات منتهية
  updateTimelineBar(5);
  updateWorkflowStatusText('البث مكتمل — تم النشر للعموم وأرشفة السجل ✓');

  const elapsed = getElapsedSeconds();
  const badge   = document.getElementById('wf-elapsed-badge');
  if (badge) {
    badge.textContent = formatTime(elapsed);
    badge.className   = elapsed < 180
      ? 'badge badge-green'
      : 'badge badge-red';
  }

  state.workflowRunning = false;

  const runBtn = document.getElementById('wf-run-btn');
  if (runBtn) runBtn.disabled = false;

  console.info(`[Workflow] Completed in ${elapsed}s — KPI-1 ${elapsed < 180 ? '✓ PASS' : '✗ FAIL'}`);
}

/**
 * يُعيد تعيين سير العمل إلى الحالة الأولية.
 */
function resetWorkflow() {
  // إيقاف المؤقتات الجارية
  clearInterval(state.tickerID);
  clearTimeout(state.workflowTimerID);

  // إعادة الحالة
  state.workflowRunning   = false;
  state.workflowStartTime = null;
  state.workflowStep      = 0;

  // إعادة رسم الخطوات
  renderWorkflowSteps(-1); // -1 = إعادة تعيين
  updateTimelineBar(-1);
  updateWorkflowStatusText('انتظار إرسال البيان...');

  // إعادة تعيين المؤقت والشريط
  setWorkflowTimerDisplay(0);
  setWorkflowProgressBar(0);

  const badge = document.getElementById('wf-elapsed-badge');
  if (badge) { badge.textContent = '00:00'; badge.className = 'badge badge-blue'; }

  // إعادة تعيين أوقات الخطوات
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById(`t${i}`);
    if (el) el.textContent = '';
  }

  const runBtn = document.getElementById('wf-run-btn');
  if (runBtn) runBtn.disabled = false;
}

/**
 * يُحدِّث الساعة وشريط التقدم كل 200ms أثناء الجري.
 */
function updateWorkflowTicker() {
  const elapsed = getElapsedSeconds();
  const pct     = Math.min(Math.round((elapsed / 180) * 100), 100);

  setWorkflowTimerDisplay(elapsed);
  setWorkflowProgressBar(pct);

  const badge = document.getElementById('wf-elapsed-badge');
  if (badge) badge.textContent = formatTime(elapsed);
}

/**
 * يُعيِّن قيمة عرض مؤقت سير العمل.
 * @param {number} seconds
 */
function setWorkflowTimerDisplay(seconds) {
  const el = document.getElementById('wf-timer');
  if (el) {
    el.textContent = formatTime(seconds);
    el.setAttribute('aria-label', `الوقت المنقضي: ${formatTime(seconds)}`);
  }
}

/**
 * يُعيِّن نسبة شريط التقدم.
 * @param {number} pct - 0 إلى 100
 */
function setWorkflowProgressBar(pct) {
  const fill = document.getElementById('wf-progress-fill');
  const bar  = document.getElementById('wf-progress-bar');
  const lbl  = document.getElementById('wf-progress-pct');

  if (fill) fill.style.width  = `${pct}%`;
  if (bar)  bar.setAttribute('aria-valuenow', pct);
  if (lbl)  lbl.textContent   = `${pct}%`;

  // تحويل اللون إلى أحمر إذا تجاوز 90%
  if (fill) {
    fill.style.background = pct < 75
      ? 'var(--navy)'
      : pct < 90
        ? 'var(--amber)'
        : 'var(--red)';
  }
}

/**
 * يرسم حالة خطوات سير العمل.
 * @param {number} currentStep - الخطوة الجارية حالياً (-1 = إعادة تعيين، 5 = الكل منتهٍ)
 */
function renderWorkflowSteps(currentStep) {
  const steps = document.querySelectorAll('.wf-step');
  steps.forEach((stepEl, idx) => {
    const dot = stepEl.querySelector('.step-dot');

    if (currentStep === -1) {
      // إعادة تعيين كاملة
      stepEl.className = `wf-step ${idx === 0 ? 'active' : 'waiting'}`;
      if (dot) {
        dot.className = `step-dot ${idx === 0 ? 'dot-active pulse-dot' : 'dot-wait'}`;
        dot.textContent = idx + 1;
      }
    } else if (idx < currentStep) {
      // خطوات مكتملة
      stepEl.className = 'wf-step done';
      if (dot) { dot.className = 'step-dot dot-done'; dot.textContent = '✓'; }
    } else if (idx === currentStep && currentStep < 5) {
      // الخطوة الجارية
      stepEl.className = 'wf-step active';
      if (dot) { dot.className = 'step-dot dot-active pulse-dot'; dot.textContent = idx + 1; }
    } else {
      // خطوات في الانتظار
      stepEl.className = 'wf-step waiting';
      if (dot) { dot.className = 'step-dot dot-wait'; dot.textContent = idx + 1; }
    }

    // تحديث ARIA
    const isDone = idx < currentStep || currentStep === 5;
    const isActive = idx === currentStep && currentStep < 5;
    const status = isDone ? 'مكتملة' : isActive ? 'قيد التنفيذ' : 'في الانتظار';
    stepEl.setAttribute('aria-label',
      `الخطوة ${idx + 1}: ${stepEl.querySelector('.step-title')?.textContent || ''} — ${status}`
    );
  });
}

/**
 * يُحدِّث شريط التايم لاين.
 * @param {number} currentStep
 */
function updateTimelineBar(currentStep) {
  const segs = document.querySelectorAll('.t-seg');
  segs.forEach((seg, idx) => {
    seg.className = 't-seg';
    if (currentStep === -1) {
      if (idx === 0) seg.classList.add('active-seg');
    } else if (idx < currentStep || currentStep === 5) {
      seg.classList.add('done-seg');
    } else if (idx === currentStep) {
      seg.classList.add('active-seg');
    }
  });
}

/**
 * يُحدِّث نص حالة سير العمل.
 * @param {string} text
 */
function updateWorkflowStatusText(text) {
  const el = document.getElementById('wf-status-text');
  if (el) el.textContent = text;
}

/* ════════════════════════════════════════
   INITIALISATION
   ════════════════════════════════════════ */

/**
 * يُعيِّن التاريخ والوقت الحاليين كقيم افتراضية لحقول الحدث.
 */
function setDefaultDateTime() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timeStr = today.toTimeString().slice(0, 5);

  const dateEl = document.getElementById('event-date');
  const timeEl = document.getElementById('event-time');
  if (dateEl) dateEl.value = dateStr;
  if (timeEl) timeEl.value = timeStr;
}

/**
 * نقطة الدخول الرئيسية.
 */
function initGateway() {
  // قيم التاريخ والوقت الافتراضية
  setDefaultDateTime();

  // مزامنة الحالة الأولية مع واجهة المستخدم
  syncMapHighlight();
  updateReachEstimate();
  updateTargetCountBadge();
  checkFormReadiness();

  // التحقق عند تغيير نوع الحدث
  const eventTypeEl = document.getElementById('event-type');
  if (eventTypeEl) {
    eventTypeEl.addEventListener('change', checkFormReadiness);
  }

  console.info('[OpsGateway] Initialized — المنصة الإعلامية الوطنية الموحدة');
}

// تشغيل عند جهوزية DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGateway);
} else {
  initGateway();
}

// تصدير للاستخدام الخارجي أو الاختبارات
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initGateway,
    handleEntityChange,
    setPriority,
    handleTitleInput,
    handleBodyInput,
    checkFormReadiness,
    addRelatedEntity,
    removeEntityTag,
    handleSendAlert,
    handleSaveDraft,
    toggleChannel,
    toggleRegion,
    syncMapHighlight,
    updateReachEstimate,
    runWorkflow,
    resetWorkflow,
    validateForm,
    formatTime,
    esc
  };
}