'use strict';

const landing   = document.getElementById('landing');
const portfolio = document.getElementById('portfolio');
const ctaBtn    = document.getElementById('ctaBtn');
const backBtn   = document.getElementById('backBtn');

// ── Transition: Landing → Portfolio ──────────────────────────────────────────
function showPortfolio() {
  // 1. Fade out landing
  landing.classList.add('fade-out');

  // 2. After the CSS transition (700ms), hide landing and reveal portfolio
  setTimeout(() => {
    landing.hidden = true;

    portfolio.hidden = false;
    portfolio.removeAttribute('hidden');

    // Scroll to very top before making it visible
    window.scrollTo({ top: 0, behavior: 'instant' });
    portfolio.scrollTop = 0;

    // Force a reflow so the browser registers the initial state before
    // adding the class that triggers the fade-in transition.
    // eslint-disable-next-line no-unused-expressions
    portfolio.offsetHeight;

    portfolio.classList.add('visible');
  }, 700);
}

// ── Transition: Portfolio → Landing ──────────────────────────────────────────
function showLanding() {
  portfolio.classList.remove('visible');

  // Wait for portfolio fade-out
  setTimeout(() => {
    portfolio.hidden = true;

    landing.hidden = false;
    landing.classList.remove('fade-out');

    window.scrollTo({ top: 0, behavior: 'instant' });
  }, 400);
}

// ── Event listeners ───────────────────────────────────────────────────────────
ctaBtn.addEventListener('click', showPortfolio);

backBtn.addEventListener('click', showLanding);

// Allow keyboard navigation (Enter / Space on CTA)
ctaBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    showPortfolio();
  }
});

// ── Subtle card entrance animation on scroll ─────────────────────────────────
// Animates cards in as they scroll into view in the portfolio grid.
if ('IntersectionObserver' in window) {
  const cards = document.querySelectorAll('.card');

  // Set initial hidden state via JS (keeps CSS clean when JS is off)
  cards.forEach((card) => {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.25s ease, transform 0.25s ease';
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
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  cards.forEach((card) => observer.observe(card));
}
