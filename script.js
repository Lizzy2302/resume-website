'use strict';

// ── View transition ───────────────────────────────────────────────────────────
const landing   = document.getElementById('landing');
const portfolio = document.getElementById('portfolio');
const ctaBtn    = document.getElementById('ctaBtn');
const backBtn   = document.getElementById('backBtn');

function showPortfolio() {
  if (portfolio.classList.contains('visible')) return;
  portfolio.scrollTop = 0;
  landing.classList.add('fade-out');
  setTimeout(() => {
    landing.style.display = 'none';
    portfolio.classList.add('visible');
  }, 650);
}

function showLanding() {
  portfolio.classList.remove('visible');
  landing.style.display = '';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    landing.classList.remove('fade-out');
  }));
}

landing.addEventListener('wheel', (e) => { if (e.deltaY > 0) showPortfolio(); }, { passive: true });
landing.addEventListener('touchstart', (e) => { landing._ty = e.touches[0].clientY; }, { passive: true });
landing.addEventListener('touchend', (e) => { if (landing._ty - e.changedTouches[0].clientY > 40) showPortfolio(); }, { passive: true });
ctaBtn.addEventListener('click', showPortfolio);
ctaBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPortfolio(); } });
backBtn.addEventListener('click', showLanding);

// ── Card entrance animations ──────────────────────────────────────────────────
if ('IntersectionObserver' in window) {
  const cards = document.querySelectorAll('.card');
  cards.forEach((c) => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(18px)';
    c.style.transition = 'opacity 0.45s ease, transform 0.45s ease, box-shadow 0.25s ease';
  });
  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    }),
    { root: portfolio, threshold: 0.08 }
  );
  cards.forEach((c) => io.observe(c));
}

// ── Admin mode ────────────────────────────────────────────────────────────────
const GH_REPO  = 'Lizzy2302/resume-website';
const GH_FILE  = 'index.html';
const TOKEN_KEY = 'portfolio_gh_token';

const deletedKeys = new Set();

const adminToggle = document.getElementById('adminToggle');
const adminBar    = document.getElementById('adminBar');
const adminSave   = document.getElementById('adminSave');
const adminReset  = document.getElementById('adminReset');
const adminExit   = document.getElementById('adminExit');

// ── Text formatting toolbar ───────────────────────────────────────────────────
let toolbar = null;

function createToolbar() {
  const t = document.createElement('div');
  t.id = 'formatToolbar';
  t.className = 'format-toolbar';
  t.innerHTML = `
    <button data-cmd="bold"        title="Fett">          <b>B</b></button>
    <button data-cmd="italic"      title="Kursiv">        <i>I</i></button>
    <button data-cmd="underline"   title="Unterstrichen"> <u>U</u></button>
    <span class="format-toolbar__sep"></span>
    <button data-cmd="justifyLeft"   title="Links">   &#8676;</button>
    <button data-cmd="justifyCenter" title="Mitte">   &#8596;</button>
    <button data-cmd="justifyRight"  title="Rechts">  &#8677;</button>
    <span class="format-toolbar__sep"></span>
    <select data-cmd="fontSize" title="Schriftgröße">
      <option value="1">10</option>
      <option value="2">13</option>
      <option value="3" selected>16</option>
      <option value="4">18</option>
      <option value="5">24</option>
      <option value="6">32</option>
      <option value="7">48</option>
    </select>
    <span class="format-toolbar__sep"></span>
    <input type="color" data-cmd="foreColor" title="Textfarbe" value="#111111" />
  `;
  document.body.appendChild(t);

  t.addEventListener('mousedown', (e) => {
    // Prevent toolbar click from blurring the editable field
    e.preventDefault();
  });

  t.querySelectorAll('button[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.execCommand(btn.dataset.cmd, false, null);
      updateToolbarState();
    });
  });

  t.querySelector('select[data-cmd]').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, e.target.value);
  });

  t.querySelector('input[data-cmd]').addEventListener('input', (e) => {
    document.execCommand('foreColor', false, e.target.value);
  });

  return t;
}

function positionToolbar(el) {
  const rect = el.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  toolbar.style.top  = `${rect.top + scrollY - toolbar.offsetHeight - 8}px`;
  toolbar.style.left = `${Math.max(8, rect.left)}px`;
  toolbar.style.display = 'flex';
}

function updateToolbarState() {
  if (!toolbar) return;
  ['bold', 'italic', 'underline'].forEach((cmd) => {
    const btn = toolbar.querySelector(`[data-cmd="${cmd}"]`);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
}

function hideToolbar() {
  if (toolbar) toolbar.style.display = 'none';
}

function onEditableFocus(e) {
  if (!toolbar) toolbar = createToolbar();
  // Wait one frame so the toolbar has dimensions before positioning
  requestAnimationFrame(() => positionToolbar(e.target));
  updateToolbarState();
}

function onEditableBlur(e) {
  // Delay so toolbar clicks don't hide it before they fire
  setTimeout(() => {
    const active = document.activeElement;
    if (active && (active.closest('#formatToolbar') || active.hasAttribute('data-editable'))) return;
    hideToolbar();
  }, 150);
}

function onEditableKeyUp() {
  updateToolbarState();
}

// ── Edit mode: make fields editable ──────────────────────────────────────────
function enterAdminMode() {
  document.body.classList.add('admin-mode');
  adminBar.hidden = false;

  document.querySelectorAll('[data-editable]').forEach((el) => {
    const type = el.dataset.editableType;
    if (type === 'tags') {
      const currentTags = Array.from(el.querySelectorAll('.tag'))
        .map((t) => t.textContent.trim()).join(', ');
      el.dataset.originalHtml = el.innerHTML;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentTags;
      input.placeholder = 'Tags kommagetrennt, z.B. Salesforce, HubSpot';
      input.className = 'admin-tag-input';
      input.style.cssText = 'width:100%;border:none;background:transparent;font:inherit;outline:none;padding:2px 4px;';
      el.innerHTML = '';
      el.appendChild(input);
    } else if (type === 'email') {
      el.contentEditable = 'true';
      el.textContent = el.getAttribute('href').replace('mailto:', '');
    } else if (type === 'url') {
      el.contentEditable = 'true';
      el.textContent = el.getAttribute('href');
    } else {
      el.contentEditable = 'true';
    }
    if (el.contentEditable === 'true') {
      el.addEventListener('focus',  onEditableFocus);
      el.addEventListener('blur',   onEditableBlur);
      el.addEventListener('keyup',  onEditableKeyUp);
    }

    // Delete button
    const wrap = document.createElement('span');
    wrap.className = 'editable-wrap admin-injected';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);

    const del = document.createElement('button');
    del.className = 'field-delete-btn admin-injected';
    del.title = 'Feld löschen';
    del.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    del.addEventListener('mousedown', (e) => e.preventDefault());
    del.addEventListener('click', () => {
      deletedKeys.add(el.dataset.editable);
      wrap.remove();
    });
    wrap.appendChild(del);
  });
}

// ── Edit mode: restore display state ─────────────────────────────────────────
function exitAdminMode() {
  document.body.classList.remove('admin-mode');
  adminBar.hidden = true;
  hideToolbar();

  document.querySelectorAll('[data-editable]').forEach((el) => {
    el.removeEventListener('focus',  onEditableFocus);
    el.removeEventListener('blur',   onEditableBlur);
    el.removeEventListener('keyup',  onEditableKeyUp);
    const type = el.dataset.editableType;
    if (type === 'tags') {
      const input = el.querySelector('.admin-tag-input');
      const tags = input ? input.value : '';
      el.innerHTML = tags.split(',').map((t) => t.trim()).filter(Boolean)
        .map((t) => `<span class="tag">${t}</span>`).join('');
    } else if (type === 'email') {
      const email = el.textContent.trim();
      el.href = 'mailto:' + email;
      el.textContent = 'E-Mail schreiben';
      el.removeAttribute('contenteditable');
    } else if (type === 'url') {
      el.href = el.textContent.trim();
      el.removeAttribute('contenteditable');
    } else {
      el.removeAttribute('contenteditable');
    }
    // Unwrap from editable-wrap, putting the element back in place
    const wrap = el.closest('.editable-wrap');
    if (wrap) wrap.replaceWith(el);
  });

  document.querySelectorAll('.admin-injected').forEach((el) => el.remove());
  deletedKeys.clear();
}

// ── Collect edited values from live DOM ───────────────────────────────────────
function collectEdits() {
  const edits = {};
  document.querySelectorAll('[data-editable]').forEach((el) => {
    const key  = el.dataset.editable;
    const type = el.dataset.editableType;
    if (type === 'tags') {
      const input = el.querySelector('.admin-tag-input');
      edits[key] = { type, value: input ? input.value : '' };
    } else if (type === 'email') {
      edits[key] = { type, value: el.textContent.trim() };
    } else if (type === 'url') {
      edits[key] = { type, value: el.textContent.trim() };
    } else {
      edits[key] = { type: 'html', value: el.innerHTML };
    }
  });
  return edits;
}

// ── Patch the raw HTML string with edited values ──────────────────────────────
function applyEditsToHtml(html, edits) {
  let result = html;
  for (const [key, { type, value }] of Object.entries(edits)) {
    if (type === 'tags') {
      const tagSpans = value.split(',').map((t) => t.trim()).filter(Boolean)
        .map((t) => `<span class="tag">${t}</span>`).join('\n              ');
      // Replace content between data-editable="key" container's > and </div>
      result = result.replace(
        new RegExp(`(data-editable="${key}"[^>]*>)([\\s\\S]*?)(</div>)`),
        `$1\n              ${tagSpans}\n            $3`
      );
    } else if (type === 'email') {
      result = result.replace(
        new RegExp(`(href="mailto:)[^"]*(")`),
        `$1${value}$2`
      );
    } else if (type === 'url') {
      // Match the specific link by its data-editable attribute
      result = result.replace(
        new RegExp(`(data-editable="${key}"[^>]*href=")[^"]*(")`),
        `$1${value}$2`
      );
      result = result.replace(
        new RegExp(`(data-editable="${key}"[^>]*href=")[^"]*("[^>]*>)[^<]*(</a>)`),
        (m, pre, mid, close) => `${pre}${value}${mid}${key.replace('contact-', '').charAt(0).toUpperCase() + key.replace('contact-', '').slice(1)}${close}`
      );
    } else {
      // Replace innerHTML between opening tag and closing tag
      result = result.replace(
        new RegExp(`(data-editable="${key}"[^>]*>)([\\s\\S]*?)(<\\/)`),
        (m, open, _old, close) => `${open}${value}${close}`
      );
    }
  }
  // Remove deleted fields entirely from the HTML
  for (const key of deletedKeys) {
    result = result.replace(
      new RegExp(`<[^>]+data-editable="${key}"[^>]*>[\\s\\S]*?<\\/[^>]+>\\s*`),
      ''
    );
  }
  return result;
}

// ── GitHub API: fetch current file SHA + content ──────────────────────────────
async function ghGetFile(token) {
  const res = await fetch(
    `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );
  if (!res.ok) throw new Error(`GitHub API Fehler: ${res.status} ${res.statusText}`);
  return res.json(); // { sha, content (base64) }
}

// ── GitHub API: commit updated file ──────────────────────────────────────────
async function ghPutFile(token, sha, newContent) {
  const encoded = btoa(unescape(encodeURIComponent(newContent)));
  const res = await fetch(
    `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update portfolio content via admin panel',
        content: encoded,
        sha,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API Fehler: ${res.status}`);
  }
  return res.json();
}

// ── Token prompt dialog ───────────────────────────────────────────────────────
function promptForToken() {
  return new Promise((resolve) => {
    // Build modal
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:2000;
      background:rgba(0,0,0,0.55);
      display:flex;align-items:center;justify-content:center;
      font-family:var(--font);
    `;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px 28px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">GitHub Token eingeben</h2>
        <p style="font-size:0.875rem;color:#555;line-height:1.6;margin-bottom:4px;">
          Damit Änderungen für alle sichtbar werden, braucht die Seite ein
          <strong>GitHub Personal Access Token</strong> mit <code>repo</code>-Berechtigung.
        </p>
        <p style="font-size:0.8rem;color:#888;margin-bottom:20px;">
          Erstellen unter: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → <em>repo</em> ankreuzen.
          Das Token wird nur in deinem Browser gespeichert.
        </p>
        <input id="tokenInput" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          style="width:100%;padding:10px 14px;border:1.5px solid #e5e5e5;border-radius:8px;font:inherit;font-size:0.875rem;margin-bottom:16px;box-sizing:border-box;" />
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="tokenCancel" style="padding:9px 18px;border:none;border-radius:8px;background:#f1f5f9;font:inherit;font-size:0.875rem;font-weight:600;cursor:pointer;">Abbrechen</button>
          <button id="tokenConfirm" style="padding:9px 18px;border:none;border-radius:8px;background:#2563eb;color:#fff;font:inherit;font-size:0.875rem;font-weight:600;cursor:pointer;">Speichern &amp; veröffentlichen</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#tokenInput');
    input.focus();
    overlay.querySelector('#tokenCancel').onclick = () => { overlay.remove(); resolve(null); };
    overlay.querySelector('#tokenConfirm').onclick = () => {
      // Strip all non-ASCII characters that are invalid in HTTP headers
      const val = input.value.replace(/[^\x21-\x7e]/g, '').trim();
      if (!val) { input.style.borderColor = 'red'; return; }
      overlay.remove();
      resolve(val);
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') overlay.querySelector('#tokenConfirm').click(); });
  });
}

// ── Save: commit to GitHub ────────────────────────────────────────────────────
async function saveToGitHub() {
  const edits = collectEdits();

  let token = localStorage.getItem(TOKEN_KEY);
  if (token) token = token.replace(/[^\x21-\x7e]/g, '').trim();
  if (!token) {
    token = await promptForToken();
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Update button state
  adminSave.textContent = '⏳ Saving…';
  adminSave.disabled = true;

  try {
    // 1. Get current file from GitHub
    const file = await ghGetFile(token);
    const currentHtml = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));

    // 2. Patch HTML with edits
    const newHtml = applyEditsToHtml(currentHtml, edits);

    // 3. Commit
    await ghPutFile(token, file.sha, newHtml);

    exitAdminMode();

    // Success banner
    const banner = document.createElement('div');
    banner.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:#16a34a;color:#fff;font-family:var(--font);font-size:0.875rem;
      font-weight:600;padding:12px 24px;border-radius:999px;
      box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:3000;
      animation:fadeInUp 0.3s ease both;
    `;
    banner.textContent = '✓ Saved — live in ~1 min on GitHub Pages';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);

  } catch (err) {
    adminSave.textContent = 'Save';
    adminSave.disabled = false;

    // If token was wrong, clear it so user can re-enter
    if (err.message.includes('401') || err.message.includes('Bad credentials')) {
      localStorage.removeItem(TOKEN_KEY);
    }

    alert(`Fehler beim Speichern:\n${err.message}`);
  }

  adminSave.textContent = 'Save';
  adminSave.disabled = false;
}

function resetToken() {
  if (!confirm('GitHub Token löschen?')) return;
  localStorage.removeItem(TOKEN_KEY);
  alert('Token gelöscht. Beim nächsten Speichern wirst du nach einem neuen gefragt.');
}

adminToggle.addEventListener('click', () => {
  if (document.body.classList.contains('admin-mode')) exitAdminMode();
  else enterAdminMode();
});
adminSave.addEventListener('click', saveToGitHub);
adminExit.addEventListener('click', exitAdminMode);
adminReset.addEventListener('click', resetToken);

if (new URLSearchParams(location.search).has('admin')) enterAdminMode();
