/*
  admin.js
  Admin login + upload UI
  - Credentials are checked server-side
  - After login, show upload form
  - Upload saves into ./documentaries (video files)
*/

import { availableMemory } from "process";

const USERNAME_INPUT = document.getElementById('adminUser');
const PASSWORD_INPUT = document.getElementById('adminPass');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const uploadSection = document.getElementById('uploadSection');

const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');

const logoutBtn = document.getElementById('logoutBtn');
const refreshListBtn = document.getElementById('refreshListBtn');
const docList = document.getElementById('docList');

function setHidden(el, hidden){
  if(!el) return;
  if(hidden) el.classList.add('hidden');
  else el.classList.remove('hidden');
}

function showStatus(msg, type){
  if(!uploadStatus) return;
  uploadStatus.classList.remove('hidden');
  uploadStatus.textContent = msg;
  uploadStatus.style.color = type === 'error' ? 'rgba(220,38,38,0.95)' : 'rgba(134,239,172,0.95)';
}

async function apiFetch(path, options = {}){
  // admin APIs must be relative to the server root
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if(!res.ok){
    const err = data && (data.error || data.message) ? (data.error || data.message) : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data;
}

async function loadDocList(){
  if(!docList) return;
  docList.innerHTML = '';

  const data = await apiFetch('/api/documentaries');
  if(!Array.isArray(data) || data.length === 0){
    docList.innerHTML = `<div class="text-sm text-sand/70">No documentaries uploaded yet.</div>`;
    return;
  }

  for(const item of data){
    const li = document.createElement('div');
    li.className = 'rounded-2xl border border-white/10 bg-black/20 p-4';
    // item: { title, summary, filename, url }
    li.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-white">${escapeHtml(item.title || item.filename)}</p>
          <p class="text-xs text-sand/80 mt-1">${escapeHtml(item.summary || '')}</p>
        </div>
        <a href="${item.url}" target="_blank" class="social">Play</a>
      </div>
    `;
    docList.appendChild(li);
  }
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (c)=>({
    '&':'&amp;','<':'<','>':'>','"':'"',"'":'&#039;'
  }[c]));
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError?.classList.add('hidden');

  try{
    const username = USERNAME_INPUT?.value?.trim();
    const password = PASSWORD_INPUT?.value ?? '';


    const data = await apiFetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    // data.ok
    setHidden(loginSection, true);
    setHidden(uploadSection, false);
    await loadDocList();
    showStatus('Admin login successful ✅', 'ok');
  }catch(err){
    console.error(err);
    if(loginError) {
      loginError.textContent = 'Invalid credentials.';
      loginError.classList.remove('hidden');
    }
    showStatus('Login failed.', 'error');
  }
});

uploadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!uploadBtn) return;

  const title = document.getElementById('title')?.value?.trim();
  const summary = document.getElementById('summary')?.value?.trim();
  const file = document.getElementById('videoFile')?.files?.[0];

  if(!title || !summary || !file){
    showStatus('Please fill title, summary, and choose a video file.', 'error');
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading…';
  setHidden(uploadStatus, true);

  try{
    const formData = new FormData();
    formData.append('title', title);
    formData.append('summary', summary);
    formData.append('video', file);

    const data = await apiFetch('/api/documentaries/upload', {
      method: 'POST',
      body: formData
    });

    showStatus('Upload successful ✅ Access will be updated for viewers.', 'ok');
    await loadDocList();
    // reset form (keep login)
    uploadForm.reset();
  }catch(err){
    console.error(err);
    showStatus(err.message || 'Upload failed.', 'error');
  }finally{
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload documentary';
  }
});

logoutBtn?.addEventListener('click', async () => {
  try{
    await apiFetch('/api/admin/logout', { method: 'POST' });
  }catch{ /* ignore */ }
  location.reload();
});

refreshListBtn?.addEventListener('click', async (e) => {
  e.preventDefault();
  try{ await loadDocList(); }catch(err){ showStatus(err.message || 'Failed to refresh list.', 'error'); }
});

// If already logged in (server session cookie), try to switch UI.
(async function bootstrap(){
  try{
    const res = await apiFetch('/api/admin/me');
    if(res && res.loggedIn){
      setHidden(loginSection, true);
      setHidden(uploadSection, false);
      await loadDocList();
      return;
    }
  }catch{ /* not logged in */ }
  setHidden(uploadSection, true);
})();

