/**
 * script.js
 * - Fake subscription state via localStorage
 * - Renders documentary cards with locked overlays for non-subscribers
 * - Shows MTN MoMo instructions + a simple verification form
 *
 * Update the DOCUMENTARIES array with real thumbnails/titles/durations/embeds.
 */

const SUB_KEY = 'aimechristian_subscribed_v1';

const DOCUMENTARIES = [
  {
    id: 'doc-1',
    title: 'Inyenyeri z’Ubwenge',
    duration: '43:12',
    description: 'Rwanda — stories of resilience and the truth behind the headlines.',
    thumbnail:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=70',
    // Placeholder embed; replace with real video embed URL
    embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4?rel=0'
  },
  {
    id: 'doc-2',
    title: 'Inkuru y’Igihango',
    duration: '58:05',
    description: 'An investigation into culture, leadership, and community memory.',
    thumbnail:
      'https://images.unsplash.com/photo-1520975958225-9f06e1e8c7d7?auto=format&fit=crop&w=900&q=70',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'
  },
  {
    id: 'doc-3',
    title: 'Ubumenyi n’Urugendo',
    duration: '37:49',
    description: 'Ad-free full documentary experience (placeholder player).',
    thumbnail:
      'https://images.unsplash.com/photo-1502920917128-1aa500764b5e?auto=format&fit=crop&w=900&q=70',
    embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?rel=0'
  },
  {
    id: 'doc-4',
    title: 'Imizi y’Ukuri',
    duration: '49:20',
    description: 'A cinematic look at Rwanda’s quiet truths.',
    thumbnail:
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=70',
    embedUrl: 'https://www.youtube.com/embed/5qap5aO4i9A?rel=0'
  },
  {
    id: 'doc-5',
    title: 'Ibyegeranyo by’Itorero',
    duration: '52:33',
    description: 'Where tradition meets investigation — premium viewing unlocked.',
    thumbnail:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=70',
    embedUrl: 'https://www.youtube.com/embed/3GwjfUFyY6M?rel=0'
  },
  {
    id: 'doc-6',
    title: 'Inzira y’Itangazamakuru',
    duration: '46:11',
    description: 'A story-driven documentary crafted with respect and clarity.',
    thumbnail:
      'https://images.unsplash.com/photo-1516542591242-9f7b8d0f8b4a?auto=format&fit=crop&w=900&q=70',
    embedUrl: 'https://www.youtube.com/embed/tgbNymZ7vqY?rel=0'
  }
];

function getSubscribed(){
  return localStorage.getItem(SUB_KEY) === 'true';
}

function setSubscribed(val){
  localStorage.setItem(SUB_KEY, val ? 'true' : 'false');
}

function smoothScrollTo(hash){
  const el = document.querySelector(hash);
  if(!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderDocumentaries(){
  const grid = document.getElementById('docGrid');
  const empty = document.getElementById('libraryEmpty');
  const subscribed = getSubscribed();

  if(!grid) return;

  if(DOCUMENTARIES.length === 0){
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

  grid.innerHTML = DOCUMENTARIES.map(doc => {
    const locked = !subscribed;

    return `
      <article class="doc-card" data-doc-id="${doc.id}">
        <div class="doc-thumb" style="background-image:url('${doc.thumbnail}')">
          <div class="absolute left-0 top-0 z-10 p-4 flex items-center gap-2">
            <span class="inline-flex items-center rounded-full bg-black/35 border border-white/10 px-3 py-1 text-xs text-sand/90">
              ${doc.duration}
            </span>
          </div>

          ${locked ? `
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
          ` : ''}
        </div>

        <div class="p-5">
          <h3 class="text-white font-semibold text-base leading-snug">${doc.title}</h3>
          <p class="text-sm text-sand/80 mt-2 leading-relaxed">${doc.description}</p>

          <div class="mt-4">
            ${locked ? `
              <button class="btn btn-primary w-full justify-center" type="button" data-action="subscribe">Subscribe</button>
            ` : `
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

  // Hook subscribe buttons
  grid.querySelectorAll('[data-action="subscribe"]').forEach(btn => {
    btn.addEventListener('click', () => smoothScrollTo('#pricing'));
  });
}

function updateSubscriptionUI(){
  const subscribed = getSubscribed();

  const badge = document.getElementById('subscriptionBadge');
  const badgeText = document.getElementById('subscriptionBadgeText');
  const heroText = document.getElementById('heroSubText');
  const heroCTA = document.getElementById('heroCTA');

  const statusText = document.getElementById('statusText');
  const statusSubText = document.getElementById('statusSubText');

  if(badge){
    badge.classList.remove('hidden');
    badgeText.textContent = subscribed ? 'Subscribed' : 'Free';
    const dot = badge.querySelector('span.h-2');
    if(dot){
      dot.className = subscribed ? 'h-2 w-2 rounded-full bg-green-500' : 'h-2 w-2 rounded-full bg-red-500/80';
    }
  }

  if(heroText) heroText.textContent = subscribed ? 'Subscribed' : 'Free';
  if(heroCTA){
    heroCTA.textContent = subscribed ? 'Watch now' : 'Subscribe';
    heroCTA.onclick = (e) => {
      if(subscribed){
        e.preventDefault();
        smoothScrollTo('#library');
      }
    };
  }

  if(statusText) statusText.textContent = subscribed ? 'Subscribed' : 'Free';
  if(statusSubText){
    statusSubText.textContent = subscribed
      ? 'Ad-free documentaries unlocked. Enjoy full viewing.'
      : 'Pay to unlock ad-free documentaries.';
  }

  // Paywall form (optional UX)
  const navSubscribe = document.getElementById('navSubscribe');
  if(navSubscribe && subscribed){
    navSubscribe.textContent = 'Watch';
    navSubscribe.onclick = (e) => {
      e.preventDefault();
      smoothScrollTo('#library');
    };
  }

  renderDocumentaries();
}

function initMoMoFlow(){
  const payBtn = document.getElementById('momoPayBtn');
  const instructions = document.getElementById('momoInstructions');
  const form = document.getElementById('momoForm');
  const status = document.getElementById('momoStatus');
  const statusTitle = document.getElementById('momoStatusTitle');
  const statusText = document.getElementById('momoStatusText');
  const successBox = document.getElementById('momoSuccess');
  const resetBtn = document.getElementById('resetSubBtn');

  const subscribed = getSubscribed();
  if(subscribed){
    instructions?.classList.add('hidden');
  }

  payBtn?.addEventListener('click', () => {
    // Toggle instructions
    instructions?.classList.toggle('hidden');
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Demo validation
    const phone = document.getElementById('phone')?.value?.trim();
    const txid = document.getElementById('txid')?.value?.trim();
    if(!phone || !txid) return;

    // Fake processing
    if(status){
      status.classList.remove('hidden');
      if(successBox) successBox.classList.add('hidden');
      if(statusTitle) statusTitle.textContent = 'Processing payment…';
      if(statusText) statusText.textContent = 'Verifying transaction details. Please wait.';
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Submitting…';

    setTimeout(() => {
      setSubscribed(true);
      updateSubscriptionUI();

      if(status){
        if(statusTitle) statusTitle.textContent = 'Payment verified ✅';
        if(statusText) statusText.textContent = 'Access unlocked. Enjoy ad-free documentaries.';
      }
      if(successBox) successBox.classList.remove('hidden');

      // Restore button
      if(payBtn){
        payBtn.disabled = false;
        payBtn.textContent = 'Pay with MTN MoMo';
      }
    }, 1400);
  });

  resetBtn?.addEventListener('click', () => {
    setSubscribed(false);
    updateSubscriptionUI();
    successBox?.classList.add('hidden');
    status?.classList.add('hidden');
    const phone = document.getElementById('phone');
    const txid = document.getElementById('txid');
    if(phone) phone.value = '';
    if(txid) txid.value = '';
  });
}

function init(){
  document.getElementById('year').textContent = new Date().getFullYear();

  updateSubscriptionUI();
  initMoMoFlow();
}

document.addEventListener('DOMContentLoaded', init);

