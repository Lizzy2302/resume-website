'use strict';

const landing   = document.getElementById('landing');
const portfolio = document.getElementById('portfolio');
const ctaBtn    = document.getElementById('ctaBtn');
const backBtn   = document.getElementById('backBtn');

// ── Show portfolio (fade landing out, portfolio in) ───────────────────────────
function showPortfolio() {
  if (portfolio.classList.contains('visible')) return;

  portfolio.scrollTop = 0;
  landing.classList.add('fade-out');

  setTimeout(() => {
    landing.style.display = 'none';
    portfolio.classList.add('visible');
  }, 650);
}

// ── Show landing (reverse) ────────────────────────────────────────────────────
function showLanding() {
  portfolio.classList.remove('visible');
  landing.style.display = '';

  // Small delay so landing is painted before fade-out class is removed
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      landing.classList.remove('fade-out');
    });
  });
}

// ── Scroll on landing page triggers transition ────────────────────────────────
landing.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) showPortfolio();
}, { passive: true });

landing.addEventListener('touchstart', (e) => {
  landing._touchStartY = e.touches[0].clientY;
}, { passive: true });

landing.addEventListener('touchend', (e) => {
  if (landing._touchStartY - e.changedTouches[0].clientY > 40) showPortfolio();
}, { passive: true });

// ── CTA button ────────────────────────────────────────────────────────────────
ctaBtn.addEventListener('click', showPortfolio);

ctaBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPortfolio(); }
});

// ── Back button ───────────────────────────────────────────────────────────────
backBtn.addEventListener('click', showLanding);

// ── Card entrance animations on scroll within portfolio ───────────────────────
if ('IntersectionObserver' in window) {
  const cards = document.querySelectorAll('.card');

  cards.forEach((card) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(18px)';
    card.style.transition = 'opacity 0.45s ease, transform 0.45s ease, box-shadow 0.25s ease';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { root: portfolio, threshold: 0.08 }
  );

  cards.forEach((card) => observer.observe(card));
}
