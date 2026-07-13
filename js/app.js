/* ═══════════════════════════════════════
   APP.JS : Écrans, landing et capture bêta
═══════════════════════════════════════ */

const APP_VERSION = '1.1.0-beta';

const App = {
  currentScreen: 'landing',
  isGenerating: false,
  generationStartTime: null,

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
    const screen = document.getElementById(`screen-${screenId}`);
    if (!screen) return;

    screen.classList.add('active');
    this.currentScreen = screenId;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    Analytics.pageViewed(screenId);
  },
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearOfferSession({ keepEmail = true } = {}) {
  const preservedEmail = keepEmail ? sessionStorage.getItem('offre_email') : null;
  const preservedCapture = keepEmail ? sessionStorage.getItem('offre_email_captured') : null;

  Object.keys(sessionStorage)
    .filter((key) => key.startsWith('offre_'))
    .forEach((key) => sessionStorage.removeItem(key));

  if (preservedEmail) sessionStorage.setItem('offre_email', preservedEmail);
  if (preservedCapture) sessionStorage.setItem('offre_email_captured', preservedCapture);
}

async function captureEmailNetlify(email) {
  const alreadyCaptured = sessionStorage.getItem('offre_email_captured');
  if (alreadyCaptured === email) return;

  // Netlify Forms n'est pas disponible sur un simple serveur local.
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    sessionStorage.setItem('offre_email_captured', email);
    return;
  }

  const body = new URLSearchParams({
    'form-name': 'aicoach-beta',
    email,
    consent: 'bêta et ressources AICoach',
    source: window.location.href,
    version: APP_VERSION,
  });

  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Email capture failed (${response.status})`);
  }

  sessionStorage.setItem('offre_email_captured', email);
}

function restoreSavedResult() {
  const saved = sessionStorage.getItem('offre_result');
  if (!saved) return false;

  try {
    const result = JSON.parse(saved);
    Results.render(result);
    App.showScreen('results');
    Analytics.track('saved_result_opened');
    return true;
  } catch (error) {
    console.warn('[AICoach] Résultat sauvegardé illisible, suppression.', error);
    sessionStorage.removeItem('offre_result');
    sessionStorage.removeItem('offre_generation_complete');
    return false;
  }
}

(function initLanding() {
  const emailInput = document.getElementById('email-input');
  const rgpdCheck = document.getElementById('rgpd-check');
  const startBtn = document.getElementById('start-btn');
  const emailError = document.getElementById('email-error');
  const savedResultCard = document.getElementById('saved-result-card');
  const viewSavedResultBtn = document.getElementById('view-saved-result');
  const newOfferBtn = document.getElementById('new-offer-btn');

  const savedEmail = sessionStorage.getItem('offre_email');
  if (savedEmail) emailInput.value = savedEmail;

  function updateStartBtn() {
    const emailOk = emailInput.value.trim().length > 0;
    startBtn.disabled = !(emailOk && rgpdCheck.checked);
  }

  function refreshSavedResultCard() {
    const hasResult = sessionStorage.getItem('offre_generation_complete') === 'true'
      && Boolean(sessionStorage.getItem('offre_result'));
    if (savedResultCard) savedResultCard.classList.toggle('hidden', !hasResult);
  }

  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error');
    emailError.textContent = '';
    updateStartBtn();
  });

  rgpdCheck.addEventListener('change', updateStartBtn);

  startBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();

    if (!validateEmail(email)) {
      emailInput.classList.add('error');
      emailError.textContent = 'Vérifie le format de ton adresse email.';
      emailInput.focus();
      return;
    }

    const originalText = startBtn.textContent;
    startBtn.disabled = true;
    startBtn.textContent = 'Ouverture du test…';
    emailError.textContent = '';

    try {
      await captureEmailNetlify(email);
      sessionStorage.setItem('offre_email', email);
      Analytics.emailCaptured();

      App.showScreen('questionnaire');
      Questionnaire.init();
    } catch (error) {
      console.error('[AICoach] Capture email impossible', error);
      emailInput.classList.add('error');
      emailError.textContent = 'Impossible d’enregistrer ton accès pour le moment. Réessaie dans quelques secondes.';
    } finally {
      startBtn.textContent = originalText;
      updateStartBtn();
    }
  });

  emailInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !startBtn.disabled) startBtn.click();
  });

  if (viewSavedResultBtn) {
    viewSavedResultBtn.addEventListener('click', restoreSavedResult);
  }

  if (newOfferBtn) {
    newOfferBtn.addEventListener('click', () => {
      clearOfferSession({ keepEmail: true });
      if (savedResultCard) savedResultCard.classList.add('hidden');
      rgpdCheck.checked = false;
      updateStartBtn();
      emailInput.focus();
      Analytics.track('new_offer_started');
    });
  }

  refreshSavedResultCard();
  updateStartBtn();
  Analytics.pageViewed('landing');
})();
