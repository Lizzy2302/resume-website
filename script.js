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
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    }),
    { root: portfolio, threshold: 0.08 }
  );
  cards.forEach((c) => observer.observe(c));
}

// ── Admin mode ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'portfolio_content';
const adminToggle = document.getElementById('adminToggle');
const adminBar    = document.getElementById('adminBar');
const adminSave   = document.getElementById('adminSave');
const adminReset  = document.getElementById('adminReset');
const adminExit   = document.getElementById('adminExit');

// Load saved content from localStorage on page load
function loadSavedContent() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);

  document.querySelectorAll('[data-editable]').forEach((el) => {
    const key = el.dataset.editable;
    if (!(key in data)) return;

    const type = el.dataset.editableType;
    if (type === 'tags') {
      // Rebuild tag spans from comma-separated string
      el.innerHTML = data[key]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => `<span class="tag">${t}</span>`)
        .join('');
    } else if (type === 'email') {
      el.href = 'mailto:' + data[key];
    } else if (type === 'url') {
      el.href = data[key];
    } else {
      el.innerHTML = data[key];
    }
  });
}

// Collect current content into a plain object
function collectContent() {
  const data = {};
  document.querySelectorAll('[data-editable]').forEach((el) => {
    const key = el.dataset.editable;
    const type = el.dataset.editableType;
    if (type === 'tags') {
      data[key] = Array.from(el.querySelectorAll('.tag'))
        .map((t) => t.textContent.trim())
        .join(', ');
    } else if (type === 'email') {
      data[key] = el.getAttribute('href').replace('mailto:', '');
    } else if (type === 'url') {
      data[key] = el.getAttribute('href');
    } else {
      data[key] = el.innerHTML;
    }
  });
  return data;
}

function enterAdminMode() {
  document.body.classList.add('admin-mode');
  adminBar.hidden = false;

  document.querySelectorAll('[data-editable]').forEach((el) => {
    const type = el.dataset.editableType;

    if (type === 'tags') {
      // Replace tag spans with a plain text input (comma-separated)
      const currentTags = Array.from(el.querySelectorAll('.tag'))
        .map((t) => t.textContent.trim())
        .join(', ');
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
      el.dataset.originalHref = el.getAttribute('href');
      el.textContent = el.getAttribute('href').replace('mailto:', '');

    } else if (type === 'url') {
      el.contentEditable = 'true';
      el.dataset.originalHref = el.getAttribute('href');
      el.textContent = el.getAttribute('href');

    } else {
      el.contentEditable = 'true';
    }
  });
}

function exitAdminMode() {
  document.body.classList.remove('admin-mode');
  adminBar.hidden = true;

  document.querySelectorAll('[data-editable]').forEach((el) => {
    const type = el.dataset.editableType;

    if (type === 'tags') {
      // Rebuild tag spans from input value
      const input = el.querySelector('.admin-tag-input');
      const tags = input ? input.value : '';
      el.innerHTML = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => `<span class="tag">${t}</span>`)
        .join('');

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
}

function saveContent() {
  // Collect while still in edit mode (inputs still active)
  const data = {};
  document.querySelectorAll('[data-editable]').forEach((el) => {
    const key = el.dataset.editable;
    const type = el.dataset.editableType;
    if (type === 'tags') {
      const input = el.querySelector('.admin-tag-input');
      data[key] = input ? input.value : '';
    } else if (type === 'email') {
      data[key] = el.textContent.trim();
    } else if (type === 'url') {
      data[key] = el.textContent.trim();
    } else {
      data[key] = el.innerHTML;
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Flash all cards to confirm save
  document.querySelectorAll('.card').forEach((c) => {
    c.classList.remove('saved-flash');
    void c.offsetWidth;
    c.classList.add('saved-flash');
  });

  exitAdminMode();
}

function resetContent() {
  if (!confirm('Alle gespeicherten Änderungen löschen und Originalinhalte wiederherstellen?')) return;
  localStorage.removeItem(STORAGE_KEY);
  exitAdminMode();
  location.reload();
}

adminToggle.addEventListener('click', () => {
  if (document.body.classList.contains('admin-mode')) {
    exitAdminMode();
  } else {
    enterAdminMode();
  }
});

adminSave.addEventListener('click', saveContent);
adminExit.addEventListener('click', exitAdminMode);
adminReset.addEventListener('click', resetContent);

// Also activate via URL param ?admin
if (new URLSearchParams(location.search).has('admin')) {
  enterAdminMode();
}

// Apply saved content immediately
loadSavedContent();
