/**
 * script.js
 * Server-backed paywall:
 * - Render documentary cards locked/unlocked via /api/me/access (phone)
 * - MoMo: create payment record (/api/payments/create), show USSD code, dial via tel:
 * - Upload screenshot proof (/api/payments/upload-proof)
 */

const DOCUMENTARIES = [
  {
    id: 'doc-1',
    title: 'Inyenyeri z’Ubwenge',
    duration: '43:12',
    description: 'Rwanda — stories of resilience and the truth behind the headlines.',
    thumbnail:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=70',
    embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4?rel=0'
  },
  {
    id: 'doc-2',
    title: 'Inkuru y’Igihango',
    duration: '58:05',
    description:
      'An investigation into culture, leadership, and community memory.',
    thumbnail:
      'https://images.unsplash.com/photo-1520975958225-9f06e1e8c7d7?auto=format&fit=crop&w=900&q=70',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'
  }
];

const PRICING = {
  month: { label: '2,000 RWF/month', amount: 2000, planType: 'monthly' },
  week: { label: '700 RWF/week', amount: 700, planType: 'weekly' },
  yearly: { label: '22,000 RWF/year', amount: 22000, planType: 'yearly' },
  doc: { label: '200 RWF/one documentary', amount: 200, planType: 'single' }
};

const MO_CODE_PLACEHOLDER = '12345';

function smoothScrollTo(hash) {
  const el = document.querySelector(hash);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err =
      data && (data.error || data.message)
        ? data.error || data.message
        : `HTTP ${res.status}`;
    throw new Error(err);
  }

  return data;
}

function getSelectedPlanUI() {
  const planRadios = document.querySelectorAll('input[name="planType"]');
  for (const r of planRadios) {
    if (r.checked) return r.value;
  }
  return 'monthly';
}

function getDocSelection() {
  const sel = document.getElementById('singleDocSelect');
  if (!sel) return [];
  const v = sel.value;
  return v ? [v] : [];
}

function getAmountForPlan(planType) {
  if (planType === 'single') return PRICING.doc.amount;
  if (planType === 'weekly') return PRICING.week.amount;
  if (planType === 'yearly') return PRICING.yearly.amount;
  return PRICING.month.amount;
}

function buildUSSD(phone, amount) {
  const cleaned = String(phone || '').replace(/\D/g, '');
  // Current backend uses *182*8*{code}*{phone}*{amount}#
  // If you later confirm a different USSD pattern that only prompts for PIN on the last step,
  // update the backend computeUsseForMtnMoMo + this helper.
  return `*182*8*${MO_CODE_PLACEHOLDER}*${cleaned}*${amount}#`;
}


function setBadge(hasAccess) {
  const badge = document.getElementById('subscriptionBadge');
  const badgeText = document.getElementById('subscriptionBadgeText');
  const heroText = document.getElementById('heroSubText');
  const heroCTA = document.getElementById('heroCTA');
  const statusText = document.getElementById('statusText');
  const statusSubText = document.getElementById('statusSubText');

  badge?.classList.remove('hidden');
  if (badgeText) badgeText.textContent = hasAccess ? 'Subscribed' : 'Free';
  if (heroText) heroText.textContent = hasAccess ? 'Subscribed' : 'Free';
  if (heroCTA) heroCTA.textContent = hasAccess ? 'Watch now' : 'Subscribe';
  if (statusText) statusText.textContent = hasAccess ? 'Subscribed' : 'Free';
  if (statusSubText)
    statusSubText.textContent = hasAccess
      ? 'Ad-free documentaries unlocked. Enjoy full viewing.'
      : 'Pay to unlock ad-free documentaries.';
}

async function fetchAccessByPhone(phone) {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return { hasAccess: false };

  const url = new URL('/api/me/access', window.location.origin);
  url.searchParams.set('phone', cleaned);
  const res = await apiFetch(url.toString());
  return res;
}

function renderDocumentaries(hasAccess) {
  const grid = document.getElementById('docGrid');
  const empty = document.getElementById('libraryEmpty');
  if (!grid) return;

  if (!DOCUMENTARIES || DOCUMENTARIES.length === 0) {
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

  grid.innerHTML = DOCUMENTARIES.map((doc) => {
    const locked = !hasAccess;
    return `
      <article class="doc-card" data-doc-id="${doc.id}">
        <div class="doc-thumb" style="background-image:url('${doc.thumbnail}')">
          <div class="absolute left-0 top-0 z-10 p-4 flex items-center gap-2">
            <span class="inline-flex items-center rounded-full bg-black/35 border border-white/10 px-3 py-1 text-xs text-sand/90">
              ${doc.duration}
            </span>
          </div>

          ${locked
            ? `
              <div class="lock-overlay">
                <div class="lock-badge">
                  <div class="lock-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round"/>
                      <path d="M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke="white" stroke-opacity="0.9" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-white">Locked</p>
                    <p class="text-[11px] text-sand/80">Subscribe to watch ad-free</p>
                  </div>
                </div>
              </div>
            `
            : ''}
        </div>

        <div class="p-5">
          <h3 class="text-white font-semibold text-base leading-snug">${doc.title}</h3>
          <p class="text-sm text-sand/80 mt-2 leading-relaxed">${doc.description}</p>

          <div class="mt-4">
            ${locked
              ? `<button class="btn btn-primary w-full justify-center" type="button" data-action="subscribe">Subscribe</button>`
              : `
                <div class="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  <div class="player-wrap">
                    <iframe
                      src="${doc.embedUrl}"
                      title="${doc.title}"
                      class="player-iframe w-full h-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      referrerpolicy="strict-origin-when-cross-origin"
                      allowfullscreen
                    ></iframe>
                  </div>
                </div>
              `}
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-action="subscribe"]').forEach((btn) => {
    btn.addEventListener('click', () => smoothScrollTo('#pricing'));
  });
}

function showManualUssd(ussd) {
  const wrap = document.getElementById('manualUssdWrap');
  const codeEl = document.getElementById('manualUssdCode');
  if (!wrap || !codeEl) return;
  wrap.classList.remove('hidden');
  codeEl.textContent = ussd;
}

async function initPayFlow() {
  const payBtn = document.getElementById('momoPayBtn');
  const instructions = document.getElementById('momoInstructions');
  const form = document.getElementById('momoForm');

  const status = document.getElementById('momoStatus');
  const statusTitle = document.getElementById('momoStatusTitle');
  const statusText = document.getElementById('momoStatusText');
  const successBox = document.getElementById('momoSuccess');

  const proofForm = document.getElementById('proofForm');
  const proofFileInput = document.getElementById('proofFile');
  const proofSubmitBtn = document.getElementById('proofSubmitBtn');

  const paymentIdInput = document.getElementById('paymentId');

  payBtn?.addEventListener('click', () => instructions?.classList.toggle('hidden'));
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName')?.value?.trim();
    const phone = document.getElementById('phone')?.value?.trim();
    const momoPassword = document.getElementById('momoPassword')?.value?.trim();

    const planType = getSelectedPlanUI();
    const amount = getAmountForPlan(planType);
    const documentaryIds = planType === 'single' ? getDocSelection() : [];

    // momoPassword is the platform password/access password the user uses on-site.
    if (!fullName || !phone || !momoPassword) return;

    const phoneClean = normalizePhone(phone);

    // Create payment request (server persists it)
    const createRes = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        phone: phoneClean,
        momoPassword,
        planType,
        amount,
        documentaryIds
      })
    });

    const createData = await createRes.json().catch(() => ({}));

    if (!createRes.ok || !createData.success) {
      if (statusText) statusText.textContent = createData.error || 'Failed to create payment';
      if (statusTitle) statusTitle.textContent = 'Error';
      status?.classList.remove('hidden');
      return;
    }

    if (status) {
      status.classList.remove('hidden');
      if (successBox) successBox.classList.add('hidden');
      if (statusTitle) statusTitle.textContent = 'Open MoMo to complete payment';
      if (statusText)
        statusText.textContent = 'After you finish, upload the screenshot below.';
    }

    if (paymentIdInput) paymentIdInput.value = createData.paymentId;

    const ussd = createData.ussd || buildUSSD(phoneClean, amount);

    showManualUssd(ussd);
    document.getElementById('proofSection')?.classList.remove('hidden');

    const pendingText = document.getElementById('pendingText');
    pendingText && (pendingText.textContent = 'confirmation pending');

    try {
      window.location.href = `tel:${encodeURIComponent(ussd)}`;
    } catch {
      // ignore
    }
  });

  proofForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const paymentId = paymentIdInput?.value?.trim();
    if (!paymentId) return;

    const file = proofFileInput?.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('paymentId', paymentId);
    fd.append('screenshot', file);

    proofSubmitBtn && (proofSubmitBtn.disabled = true);

    try {
      const res = await fetch('/api/payments/upload-proof', {
        method: 'POST',
        body: fd
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        if (statusTitle) statusTitle.textContent = 'Upload error';
        if (statusText) statusText.textContent = data.error || 'Failed to upload proof';
        return;
      }

      if (statusTitle) statusTitle.textContent = 'Proof uploaded ✅';
      if (statusText) statusText.textContent = 'confirmation pending';
      const pendingText = document.getElementById('pendingText');
      pendingText && (pendingText.textContent = 'confirmation pending');
    } finally {
      proofSubmitBtn && (proofSubmitBtn.disabled = false);
    }
  });
}

async function bootstrap() {
  document.getElementById('year')?.replaceChildren(document.createTextNode(new Date().getFullYear()));

  // Locked by default; unlock only after confirmed payment.
  setBadge(false);
  renderDocumentaries(false);

  await initPayFlow();
}

document.addEventListener('DOMContentLoaded', bootstrap);

