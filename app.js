/* ═══════════════════════════════════════
   APP.JS — Gestion des écrans + Landing
═══════════════════════════════════════ */

// ── State global ─────────────────────────
const App = {
  currentScreen: 'landing',
  isGenerating: false,
  generationStartTime: null,

  // Afficher un écran
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + screenId);
    if (screen) {
      screen.classList.add('active');
      this.currentScreen = screenId;
      window.scrollTo(0, 0);
      Analytics.pageViewed(screenId);
    }
  },
};


// ── Landing — Capture email ──────────────
(function initLanding() {
  const emailInput  = document.getElementById('email-input');
  const rgpdCheck   = document.getElementById('rgpd-check');
  const startBtn    = document.getElementById('start-btn');
  const emailError  = document.getElementById('email-error');

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function updateStartBtn() {
    const emailOk = emailInput.value.trim().length > 0;
    const rgpdOk  = rgpdCheck.checked;
    startBtn.disabled = !(emailOk && rgpdOk);
  }

  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error');
    emailError.textContent = '';
    updateStartBtn();
  });

  rgpdCheck.addEventListener('change', updateStartBtn);

  startBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();

    // Validation email
    if (!validateEmail(email)) {
      emailInput.classList.add('error');
      emailError.textContent = 'Format d\'email invalide, vérifie ton adresse.';
      emailInput.focus();
      return;
    }

    // Sauvegarder l'email
    sessionStorage.setItem('offre_email', email);

    // Envoyer à Systeme.io (best-effort — ne bloque pas si ça échoue)
    captureEmailSystemeIO(email).catch(() => {
      console.log('[Dev] Systeme.io non configuré, email stocké localement uniquement');
    });

    Analytics.emailCaptured();

    // Aller au questionnaire
    App.showScreen('questionnaire');
    Questionnaire.init();
  });

  // Soumettre avec Entrée sur le champ email
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !startBtn.disabled) startBtn.click();
  });

  Analytics.pageViewed('landing');
})();


// ── Envoi email vers Systeme.io ──────────
async function captureEmailSystemeIO(email) {
  // Configurer l'URL de ton formulaire Systeme.io
  // Remplacer VOTRE_FORM_ID par l'ID de ton formulaire Systeme.io
  const SYSTEME_IO_FORM_URL = 'https://systeme.io/api/contacts'; // A adapter

  // Option 1 : Utiliser un formulaire embed Systeme.io (recommandé)
  // Option 2 : Appel API direct si tu as une clé API Systeme.io
  // Pour le prototype, on stocke en sessionStorage et on envoie via fetch

  // Si pas encore configuré, juste retourner
  if (SYSTEME_IO_FORM_URL.includes('A adapter')) {
    console.log('[Dev] Systeme.io non configuré, configurer SYSTEME_IO_FORM_URL dans app.js');
    return;
  }

  // En prod : appel POST vers ton endpoint Systeme.io ou webhook
  const response = await fetch('/api/capture-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) throw new Error('Capture email failed');
}


// ── Reprise de session ────────────────────
(function checkSessionResume() {
  const savedQ = sessionStorage.getItem('offre_current_q');
  const generationDone = sessionStorage.getItem('offre_generation_complete');

  if (generationDone === 'true') {
    // Résultats déjà générés — proposer de les revoir
    // (optionnel pour le prototype)
    return;
  }

  if (savedQ && parseInt(savedQ) > 1) {
    const banner = document.getElementById('resume-banner');
    const resumeQEl = document.getElementById('resume-q');
    if (banner && resumeQEl) {
      resumeQEl.textContent = savedQ;
      // Le banner sera affiché quand on arrive sur le questionnaire
      // (géré dans questionnaire.js)
    }
  }
})();
