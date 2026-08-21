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

const adminToggle  = document.getElementById('adminToggle');
const adminBar     = document.getElementById('adminBar');
const adminSave    = document.getElementById('adminSave');
const adminReset   = document.getElementById('adminReset');
const adminExit    = document.getElementById('adminExit');
const adminAddCard = document.getElementById('adminAddCard');
const grid         = document.getElementById('portfolioGrid');

// ── Drag & drop state ─────────────────────────────────────────────────────────
let dragSrc    = null;
let dragArmed  = false; // only drag when mousedown was on the handle

function onDragStart(e) {
  if (!dragArmed) { e.preventDefault(); return; }
  dragSrc = e.currentTarget;
  dragSrc.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  dragArmed = false;
  dragSrc && dragSrc.classList.remove('dragging');
  document.querySelectorAll('.card').forEach((c) => {
    c.classList.remove('drag-over-before', 'drag-over-after');
  });
  dragSrc = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const target = e.target.closest('.card');
  if (!target || target === dragSrc) return;
  document.querySelectorAll('.card').forEach((c) => {
    c.classList.remove('drag-over-before', 'drag-over-after');
  });
  const rect = target.getBoundingClientRect();
  const mid  = rect.top + rect.height / 2;
  target.classList.add(e.clientY < mid ? 'drag-over-before' : 'drag-over-after');
}

function onDrop(e) {
  e.preventDefault();
  const target = e.target.closest('.card');
  if (!target || target === dragSrc || !dragSrc) return;
  const rect = target.getBoundingClientRect();
  const before = e.clientY < rect.top + rect.height / 2;
  grid.insertBefore(dragSrc, before ? target : target.nextSibling);
  document.querySelectorAll('.card').forEach((c) => {
    c.style.gridColumn = '';
    c.style.gridRow    = '';
  });
}

function initDragAndDrop() {
  document.querySelectorAll('.card').forEach((card) => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend',   onDragEnd);
  });
  grid.addEventListener('dragover', onDragOver);
  grid.addEventListener('drop',     onDrop);
}

function teardownDragAndDrop() {
  dragArmed = false;
  document.querySelectorAll('.card').forEach((card) => {
    card.removeAttribute('draggable');
    card.removeEventListener('dragstart', onDragStart);
    card.removeEventListener('dragend',   onDragEnd);
  });
  grid.removeEventListener('dragover', onDragOver);
  grid.removeEventListener('drop',     onDrop);
}

// ── Edit mode: make fields editable ──────────────────────────────────────────
function makeFieldsEditable() {
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
  });
}

function injectCardControls() {
  document.querySelectorAll('.card').forEach((card) => {
    const handle = document.createElement('div');
    handle.className = 'card-drag-handle admin-injected';
    handle.setAttribute('aria-hidden', 'true');
    handle.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/><circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/></svg>';
    handle.addEventListener('mousedown', () => { dragArmed = true; });
    card.appendChild(handle);

    const del = document.createElement('button');
    del.className = 'card-delete-btn admin-injected';
    del.setAttribute('aria-label', 'Karte löschen');
    del.textContent = '✕';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirm(card, del);
    });
    card.appendChild(del);
  });
}

function showDeleteConfirm(card, triggerBtn) {
  const existing = card.querySelector('.card-delete-confirm');
  if (existing) { existing.remove(); return; }

  const pop = document.createElement('div');
  pop.className = 'card-delete-confirm admin-injected';
  pop.innerHTML = `
    <span>Karte löschen?</span>
    <button class="card-delete-confirm__yes">Ja</button>
    <button class="card-delete-confirm__no">Nein</button>
  `;
  pop.querySelector('.card-delete-confirm__yes').addEventListener('click', () => card.remove());
  pop.querySelector('.card-delete-confirm__no').addEventListener('click', () => pop.remove());
  card.appendChild(pop);
}

function enterAdminMode() {
  document.body.classList.add('admin-mode');
  adminBar.hidden = false;
  makeFieldsEditable();
  injectCardControls();
  initDragAndDrop();
}

// ── Edit mode: restore display state ─────────────────────────────────────────
function exitAdminMode() {
  document.body.classList.remove('admin-mode');
  adminBar.hidden = true;
  teardownDragAndDrop();

  document.querySelectorAll('[data-editable]').forEach((el) => {
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
  });

  document.querySelectorAll('.admin-injected').forEach((el) => el.remove());
}

// ── Add card: type picker modal ───────────────────────────────────────────────
const CARD_TYPES = [
  { id: 'text',     label: 'Text',     desc: 'Titel + Freitext' },
  { id: 'timeline', label: 'Timeline', desc: 'Werdegang-Einträge' },
  { id: 'tags',     label: 'Tags',     desc: 'Skill-Gruppen mit Tags' },
  { id: 'liste',    label: 'Liste',    desc: 'Aufzählungsliste' },
  { id: 'kontakt',  label: 'Kontakt',  desc: 'E-Mail & Links' },
];

function buildCardHtml(type, title, uid) {
  switch (type) {
    case 'text':
      return `<article class="card" aria-label="${title}">
  <div class="card__body">
    <h2 class="card__title" data-editable="${uid}-title">${title}</h2>
    <p class="card__text" data-editable="${uid}-text">Dein Text hier…</p>
  </div>
</article>`;
    case 'timeline':
      return `<article class="card card--experience" aria-label="${title}">
  <div class="card__body">
    <h2 class="card__title" data-editable="${uid}-title">${title}</h2>
    <ol class="timeline" reversed>
      <li class="timeline__item">
        <div class="timeline__meta">
          <strong class="timeline__company" data-editable="${uid}-job1-company">Unternehmen</strong>
          <span class="timeline__period" data-editable="${uid}-job1-period">2020 – heute</span>
        </div>
        <p class="timeline__role" data-editable="${uid}-job1-role">Position</p>
        <ul class="timeline__bullets">
          <li data-editable="${uid}-job1-bullet1">Aufgabe oder Leistung</li>
        </ul>
      </li>
    </ol>
  </div>
</article>`;
    case 'tags':
      return `<article class="card card--skills" aria-label="${title}">
  <div class="card__body">
    <h2 class="card__title" data-editable="${uid}-title">${title}</h2>
    <div class="skills__group">
      <h3 class="skills__category" data-editable="${uid}-cat1">Kategorie</h3>
      <div class="skills__tags" data-editable="${uid}-tags1" data-editable-type="tags">
        <span class="tag">Tag 1</span>
        <span class="tag">Tag 2</span>
      </div>
    </div>
  </div>
</article>`;
    case 'liste':
      return `<article class="card card--education" aria-label="${title}">
  <div class="card__body">
    <h2 class="card__title" data-editable="${uid}-title">${title}</h2>
    <ul class="education__list">
      <li class="education__item">
        <div class="education__meta">
          <strong class="education__degree" data-editable="${uid}-item1-heading">Eintrag</strong>
          <span class="education__period" data-editable="${uid}-item1-period">2020</span>
        </div>
        <p class="education__institution" data-editable="${uid}-item1-sub">Unterpunkt</p>
      </li>
    </ul>
  </div>
</article>`;
    case 'kontakt':
      return `<article class="card card--contact" aria-label="${title}">
  <div class="card__body card__body--center">
    <h2 class="card__title" data-editable="${uid}-title">${title}</h2>
    <p class="card__text" data-editable="${uid}-text">Schreib mir eine Nachricht.</p>
    <a href="mailto:email@example.com" class="contact__btn" data-editable="${uid}-email" data-editable-type="email">E-Mail schreiben</a>
    <div class="contact__links">
      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="contact__link" data-editable="${uid}-linkedin" data-editable-type="url">LinkedIn</a>
    </div>
  </div>
</article>`;
    default:
      return '';
  }
}

function showAddCardModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay admin-injected';
  overlay.innerHTML = `
    <div class="modal">
      <h2 class="modal__title">Kartentyp wählen</h2>
      <div class="modal__type-grid">
        ${CARD_TYPES.map((t) => `
          <button class="modal__type-btn" data-type="${t.id}">
            <span class="modal__type-label">${t.label}</span>
            <span class="modal__type-desc">${t.desc}</span>
          </button>`).join('')}
      </div>
      <div class="modal__row" style="margin-top:20px;">
        <label class="modal__label">Kartentitel</label>
        <input id="newCardTitle" type="text" class="modal__input" placeholder="z.B. Projekte" value="" />
      </div>
      <div class="modal__actions">
        <button id="modalCancel" class="admin-bar__btn admin-bar__btn--ghost">Abbrechen</button>
        <button id="modalConfirm" class="admin-bar__btn admin-bar__btn--primary" disabled>Hinzufügen</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let selectedType = null;
  const confirmBtn = overlay.querySelector('#modalConfirm');
  const titleInput = overlay.querySelector('#newCardTitle');

  overlay.querySelectorAll('.modal__type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.modal__type-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedType = btn.dataset.type;
      if (!titleInput.value) titleInput.value = btn.querySelector('.modal__type-label').textContent;
      confirmBtn.disabled = false;
    });
  });

  overlay.querySelector('#modalCancel').addEventListener('click', () => overlay.remove());
  confirmBtn.addEventListener('click', () => {
    if (!selectedType) return;
    const title = titleInput.value.trim() || 'Neue Karte';
    const uid   = 'card' + Date.now();
    const html  = buildCardHtml(selectedType, title, uid);
    const tmp   = document.createElement('div');
    tmp.innerHTML = html;
    const newCard = tmp.firstElementChild;
    grid.appendChild(newCard);
    overlay.remove();
    // Make the new card's fields editable and inject controls
    newCard.querySelectorAll('[data-editable]').forEach((el) => {
      const type = el.dataset.editableType;
      if (type === 'tags') {
        const currentTags = Array.from(el.querySelectorAll('.tag')).map((t) => t.textContent.trim()).join(', ');
        const input = document.createElement('input');
        input.type = 'text'; input.value = currentTags;
        input.placeholder = 'Tags kommagetrennt';
        input.className = 'admin-tag-input';
        input.style.cssText = 'width:100%;border:none;background:transparent;font:inherit;outline:none;padding:2px 4px;';
        el.innerHTML = ''; el.appendChild(input);
      } else if (type === 'email') {
        el.contentEditable = 'true'; el.textContent = el.getAttribute('href').replace('mailto:', '');
      } else if (type === 'url') {
        el.contentEditable = 'true'; el.textContent = el.getAttribute('href');
      } else {
        el.contentEditable = 'true';
      }
    });
    // Inject handle + delete
    const handle = document.createElement('div');
    handle.className = 'card-drag-handle admin-injected';
    handle.setAttribute('aria-hidden', 'true');
    handle.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/><circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/></svg>';
    handle.addEventListener('mousedown', () => { dragArmed = true; });
    newCard.appendChild(handle);
    const del = document.createElement('button');
    del.className = 'card-delete-btn admin-injected';
    del.setAttribute('aria-label', 'Karte löschen'); del.textContent = '✕';
    del.addEventListener('click', (e) => { e.stopPropagation(); showDeleteConfirm(newCard, del); });
    newCard.appendChild(del);
    newCard.setAttribute('draggable', 'true');
    newCard.addEventListener('dragstart', onDragStart);
    newCard.addEventListener('dragend',   onDragEnd);
  });
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
  return result;
}

// ── Serialize current grid to HTML ────────────────────────────────────────────
function serializeGrid() {
  const clone = grid.cloneNode(true);
  clone.querySelectorAll('.admin-injected').forEach((el) => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
  clone.querySelectorAll('[draggable]').forEach((el) => el.removeAttribute('draggable'));
  clone.querySelectorAll('[data-editable-type="tags"]').forEach((el) => {
    const input = el.querySelector('.admin-tag-input');
    if (input) {
      el.innerHTML = input.value.split(',').map((t) => t.trim()).filter(Boolean)
        .map((t) => `<span class="tag">${t}</span>`).join('\n              ');
    }
  });
  clone.querySelectorAll('[data-editable-type="email"]').forEach((el) => {
    const val = el.textContent.trim();
    el.setAttribute('href', 'mailto:' + val);
    el.textContent = 'E-Mail schreiben';
  });
  clone.querySelectorAll('[data-editable-type="url"]').forEach((el) => {
    const val = el.textContent.trim();
    el.setAttribute('href', val);
  });
  return clone.outerHTML;
}

// ── Replace grid block in fetched HTML ────────────────────────────────────────
function replaceGridInHtml(html, newGridHtml) {
  return html.replace(
    /(<main\b[^>]*\bid="portfolioGrid"[^>]*>)[\s\S]*?(<\/main>)/,
    `$1\n\n      ${newGridHtml}\n\n    $2`
  );
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
  // Serialize current layout before exiting admin mode
  const newGridHtml = serializeGrid();

  let token = localStorage.getItem(TOKEN_KEY);
  if (token) token = token.replace(/[^\x21-\x7e]/g, '').trim();
  if (!token) {
    token = await promptForToken();
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Update button state
  adminSave.textContent = '⏳ Wird gespeichert…';
  adminSave.disabled = true;

  try {
    // 1. Get current file from GitHub
    const file = await ghGetFile(token);
    const currentHtml = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));

    // 2. Replace entire grid block (handles reorder, add, delete)
    const newHtml = replaceGridInHtml(currentHtml, newGridHtml);

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
    banner.textContent = '✓ Gespeichert – live in ~1 Minute auf GitHub Pages';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);

  } catch (err) {
    adminSave.textContent = 'Speichern';
    adminSave.disabled = false;

    // If token was wrong, clear it so user can re-enter
    if (err.message.includes('401') || err.message.includes('Bad credentials')) {
      localStorage.removeItem(TOKEN_KEY);
    }

    alert(`Fehler beim Speichern:\n${err.message}`);
  }

  adminSave.textContent = 'Speichern';
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
adminAddCard.addEventListener('click', showAddCardModal);

if (new URLSearchParams(location.search).has('admin')) enterAdminMode();
