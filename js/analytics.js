/* ═══════════════════════════════════════
   ANALYTICS — Plausible (cookieless, RGPD-ok)
   Remplacer src par ton domaine Plausible
═══════════════════════════════════════ */

// Injecter le script Plausible dynamiquement
(function() {
  if (typeof window === 'undefined') return;

  // En dev local, ne pas charger Plausible
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.plausible = function(event, opts) {
      console.log('[Analytics DEV]', event, opts || '');
    };
    return;
  }

  // Charger Plausible en prod
  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', 'revenus-ia.fr'); // ← adapter votre domaine
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);

  // Wrapper sécurisé
  window.plausible = window.plausible || function() {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
})();

// ── API publique ──────────────────────────
const Analytics = {
  track(event, props = {}) {
    try {
      if (typeof window.plausible === 'function') {
        window.plausible(event, { props });
      }
    } catch (e) {
      // Analytics ne doit jamais faire planter l'app
    }
  },

  // Événements spécifiques
  pageViewed(screenName) {
    this.track('page_viewed', { screen_name: screenName });
  },
  emailCaptured() {
    this.track('email_captured');
  },
  questionAnswered(questionNumber) {
    this.track('question_answered', { question_number: questionNumber });
  },
  generationStarted() {
    this.track('generation_started');
  },
  generationComplete(durationMs) {
    this.track('generation_complete', { duration_ms: durationMs });
  },
  generationError(errorType) {
    this.track('generation_error', { error_type: errorType });
  },
  copyCLicked(sectionName) {
    this.track('copy_clicked', { section_name: sectionName });
  },
  paywallViewed() {
    this.track('paywall_viewed');
  },
  paywallCtaClicked() {
    this.track('paywall_cta_clicked');
  },
  sessionResumed(fromQuestion) {
    this.track('session_resumed', { resumed_from_question: fromQuestion });
  },
};
