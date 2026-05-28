// ===============================================
// script.js - Full Updated Version
// ===============================================

let currentUserPhone = null;
let allDocumentaries = [];

// Utility Functions
function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

// Load Documentaries from Firestore via backend
async function loadDocumentaries() {
  try {
    const res = await fetch('/api/documentaries');
    allDocumentaries = await res.json();
    console.log(`Loaded ${allDocumentaries.length} documentaries`);
  } catch (err) {
    console.error('Failed to load documentaries:', err);
    allDocumentaries = [];
  }
}

// Check if user has active subscription
async function checkUserAccess(phone) {
  if (!phone) return false;
  try {
    const res = await fetch(`/api/me/access?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    return data.hasAccess === true;
  } catch (err) {
    console.error('Access check failed:', err);
    return false;
  }
}

// Render Library with Paywall
function renderLibrary(hasAccess) {
  const grid = document.getElementById('docGrid');
  if (!grid) return;

  if (allDocumentaries.length === 0) {
    grid.innerHTML = `<p class="text-center text-zinc-400 py-12">No documentaries available yet.</p>`;
    return;
  }

  grid.innerHTML = allDocumentaries.map(doc => `
    <article class="glass-card p-4 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.03] transition-all duration-300"
             onclick="${hasAccess ? `watchDocumentary('${doc.cloudinaryUrl}', '${doc.title}')` : `goToPayment()`}">
      
      <div class="relative">
        <img src="${doc.thumbnail || 'https://via.placeholder.com/640x360?text=' + encodeURIComponent(doc.title)}" 
             alt="${doc.title}"
             class="w-full aspect-video object-cover rounded-xl">
        <div class="absolute top-3 right-3 bg-black/80 text-white text-xs px-2.5 py-1 rounded-lg">
          HD
        </div>
        ${!hasAccess ? `
        <div class="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
          <div class="text-center">
            <span class="text-3xl">🔒</span>
            <p class="text-white text-sm mt-2 font-medium">Premium</p>
          </div>
        </div>` : ''}
      </div>

      <div class="mt-4">
        <h3 class="font-semibold text-lg leading-tight">${doc.title}</h3>
        <p class="text-zinc-400 text-sm mt-2 line-clamp-3">${doc.summary || 'No summary available.'}</p>
      </div>

      ${!hasAccess ? `
      <div class="mt-4 text-red-400 text-xs font-medium flex items-center gap-1">
        <span>Subscribe to unlock</span>
      </div>` : ''}
    </article>
  `).join('');
}

// Watch Documentary (opens Cloudinary video)
function watchDocumentary(url, title) {
  if (!url) return alert("Video not available");
  
  // You can replace this with a nice modal player later
  window.open(url, '_blank');
}

// Scroll to Payment Section
function goToPayment() {
  const paymentSection = document.getElementById('paymentSection');
  if (paymentSection) {
    paymentSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    alert("Please go to the payment section to subscribe.");
  }
}

// ====================== PAYMENT HANDLING ======================
async function handlePaymentSubmit(e) {
  e.preventDefault();
  
  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const momoPassword = document.getElementById('momoPassword').value.trim();
  const planType = document.getElementById('planType').value;
  const amount = document.getElementById('amount').value;

  if (!fullName || !phone || !momoPassword || !planType) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const data = await apiFetch('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({ fullName, phone, momoPassword, planType, amount })
    });

    if (data.success) {
      // Save phone for later use
      currentUserPhone = normalizePhone(phone);
      localStorage.setItem('userPhone', currentUserPhone);

      document.getElementById('paymentId').value = data.paymentId;
      document.getElementById('uploadProofSection').classList.remove('hidden');
      document.getElementById('submitPaymentBtn').classList.add('hidden');
      
      alert("Payment record created. Please upload your MTN MoMo screenshot.");
    }
  } catch (err) {
    alert("Failed to create payment: " + err.message);
  }
}

// Upload Screenshot to Cloudinary via backend
async function handleScreenshotUpload(e) {
  e.preventDefault();
  
  const paymentId = document.getElementById('paymentId').value;
  const fileInput = document.getElementById('screenshot');
  const file = fileInput.files[0];

  if (!paymentId || !file) {
    alert("Please select a screenshot");
    return;
  }

  const formData = new FormData();
  formData.append('screenshot', file);
  formData.append('paymentId', paymentId);

  try {
    const res = await fetch('/api/payments/upload-proof', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert("Screenshot uploaded successfully! Admin will verify your payment soon.");
      // Reset form
      document.getElementById('paymentForm').reset();
      document.getElementById('uploadProofSection').classList.add('hidden');
      document.getElementById('submitPaymentBtn').classList.remove('hidden');
    } else {
      alert(data.error || "Upload failed");
    }
  } catch (err) {
    alert("Upload error: " + err.message);
  }
}

// ====================== INIT ======================
async function init() {
  // Load documentaries
  await loadDocumentaries();

  // Check if user was previously logged in
  currentUserPhone = localStorage.getItem('userPhone');
  
  let hasAccess = false;
  if (currentUserPhone) {
    hasAccess = await checkUserAccess(currentUserPhone);
  }

  // Render library
  renderLibrary(hasAccess);

  // Attach form listeners
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', handlePaymentSubmit);
  }

  const screenshotForm = document.getElementById('screenshotForm');
  if (screenshotForm) {
    screenshotForm.addEventListener('submit', handleScreenshotUpload);
  }

  console.log('🚀 ibyegeranyo script initialized');
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
