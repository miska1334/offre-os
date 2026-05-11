/* ═══════════════════════════════════════
QUESTIONNAIRE.JS — Q1 à Q7
Validation, navigation, sauvegarde
═══════════════════════════════════════ */

const Questionnaire = {
currentQ: 1,
totalQ: 7,
answers: {},

init() {
this.loadFromSession();
this.checkResumeBanner();
this.renderQ(this.currentQ);
this.bindBackToLanding();
},

// ── Chargement depuis sessionStorage ────
loadFromSession() {
for (let i = 1; i <= this.totalQ; i++) {
const saved = sessionStorage.getItem(‘offre_q’ + i);
if (saved) {
try {
this.answers[i] = JSON.parse(saved);
} catch {
this.answers[i] = saved;
}
}
}
const savedQ = parseInt(sessionStorage.getItem(‘offre_current_q’) || ‘1’);
this.currentQ = Math.max(1, Math.min(savedQ, this.totalQ));
},

// ── Banner reprise ────────────────────
checkResumeBanner() {
const savedQ = parseInt(sessionStorage.getItem(‘offre_current_q’) || ‘1’);
if (savedQ > 1 && Object.keys(this.answers).length > 0) {
const banner = document.getElementById(‘resume-banner’);
const resumeQEl = document.getElementById(‘resume-q’);
if (banner) {
resumeQEl.textContent = savedQ;
banner.classList.remove(‘hidden’);

```
    document.getElementById('resume-btn').onclick = () => {
      banner.classList.add('hidden');
      this.renderQ(savedQ);
    };
    document.getElementById('restart-btn').onclick = () => {
      this.clearSession();
      banner.classList.add('hidden');
      this.renderQ(1);
      Analytics.track('session_restarted');
    };

    Analytics.sessionResumed(savedQ);
  }
}
```

},

clearSession() {
for (let i = 1; i <= this.totalQ; i++) {
sessionStorage.removeItem(‘offre_q’ + i);
}
sessionStorage.removeItem(‘offre_current_q’);
this.answers = {};
this.currentQ = 1;
},

// ── Affichage d’une question ─────────────
renderQ(qNum) {
this.currentQ = qNum;
sessionStorage.setItem(‘offre_current_q’, qNum);

```
// Afficher le bon écran de question
document.querySelectorAll('.q-screen').forEach(s => s.classList.remove('active'));
const target = document.querySelector(`.q-screen[data-q="${qNum}"]`);
if (target) target.classList.add('active');

// Progress bar
document.getElementById('q-current').textContent = qNum;
document.getElementById('progress-fill').style.width = ((qNum - 1) / this.totalQ * 100) + '%';

// Boutons nav
const prevBtn     = document.getElementById('prev-btn');
const nextBtn     = document.getElementById('next-btn');
const generateBtn = document.getElementById('generate-btn');

prevBtn.classList.toggle('hidden', qNum === 1);

if (qNum < this.totalQ) {
  nextBtn.classList.remove('hidden');
  generateBtn.classList.add('hidden');
} else {
  nextBtn.classList.add('hidden');
  generateBtn.classList.remove('hidden');
}

// Pré-remplir la réponse sauvegardée
this.prefillAnswer(qNum);

// Valider l'état initial du bouton
this.validateQ(qNum, false);

// Scroll to top
window.scrollTo(0, 0);

// Setup events pour cette question
this.bindQEvents(qNum);
```

},

// ── Pré-remplissage ─────────────────────
prefillAnswer(qNum) {
const answer = this.answers[qNum];
if (!answer) return;

```
switch (qNum) {
  case 1:
    document.querySelectorAll('.type-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.value === answer);
    });
    break;
  case 2:
    const q2 = document.getElementById('q2-input');
    if (q2) { q2.value = answer; this.updateCounter('q2-count', answer.length, 200); }
    break;
  case 3:
    const q3 = document.getElementById('q3-input');
    if (q3) { q3.value = answer; this.updateCounter('q3-count', answer.length, 300); }
    break;
  case 4:
    if (answer.before) {
      const q4b = document.getElementById('q4-before');
      if (q4b) { q4b.value = answer.before; this.updateCounter('q4b-count', answer.before.length, 150); }
    }
    if (answer.after) {
      const q4a = document.getElementById('q4-after');
      if (q4a) { q4a.value = answer.after; this.updateCounter('q4a-count', answer.after.length, 150); }
    }
    break;
  case 5:
    const q5 = document.getElementById('q5-input');
    if (q5) { q5.value = answer; this.updateCounter('q5-count', answer.length, 400); }
    break;
  case 6:
    const q6 = document.getElementById('q6-input');
    if (q6) q6.value = answer || '';
    break;
  case 7:
    // CORRECTION : lecture via data-value, pas via input checkbox
    if (Array.isArray(answer)) {
      document.querySelectorAll('.channel-card').forEach(card => {
        card.classList.toggle('selected', answer.includes(card.dataset.value));
      });
    }
    break;
}
```

},

// ── Bind events par question ─────────────
bindQEvents(qNum) {
switch (qNum) {
case 1:
document.querySelectorAll(’.type-card’).forEach(card => {
card.onclick = () => {
document.querySelectorAll(’.type-card’).forEach(c => c.classList.remove(‘selected’));
card.classList.add(‘selected’);
this.saveAnswer(1, card.dataset.value);
this.validateQ(1, false);
};
});
break;

```
  case 2:
    this.bindTextarea('q2-input', 2, 10, 200, 'q2-count', 'q2-error');
    break;

  case 3:
    this.bindTextarea('q3-input', 3, 20, 300, 'q3-count', 'q3-error');
    break;

  case 4:
    this.bindBeforeAfter();
    break;

  case 5:
    this.bindTextarea('q5-input', 5, 20, 400, 'q5-count', 'q5-error');
    break;

  case 6:
    const q6 = document.getElementById('q6-input');
    if (q6) {
      q6.oninput = () => {
        this.saveAnswer(6, q6.value.trim() || 'non précisé');
        this.validateQ(6, false);
      };
    }
    break;

  case 7:
    document.querySelectorAll('.channel-card').forEach(card => {
      card.onclick = () => {
        card.classList.toggle('selected');
        this.saveChannels();
        this.validateQ(7, false);
      };
    });
    break;
}

// Bouton Suivant
document.getElementById('next-btn').onclick = () => {
  if (this.validateQ(qNum, true)) {
    Analytics.questionAnswered(qNum);
    this.renderQ(qNum + 1);
  }
};

// Bouton Générer (Q7 uniquement)
document.getElementById('generate-btn').onclick = () => {
  if (this.validateQ(7, true)) {
    Analytics.questionAnswered(7);
    this.startGeneration();
  }
};

// Bouton Précédent
document.getElementById('prev-btn').onclick = () => {
  if (qNum > 1) this.renderQ(qNum - 1);
};
```

},

// ── Helpers textarea ─────────────────────
bindTextarea(id, qNum, minLen, maxLen, counterId, errorId) {
const el = document.getElementById(id);
if (!el) return;
el.oninput = () => {
const val = el.value;
this.updateCounter(counterId, val.length, maxLen);
this.saveAnswer(qNum, val);
const errEl = document.getElementById(errorId);
if (errEl && val.length >= minLen) {
errEl.classList.add(‘hidden’);
el.classList.remove(‘error’);
}
this.updateNextBtnState(qNum, val.length >= minLen);
};
},

bindBeforeAfter() {
const beforeEl = document.getElementById(‘q4-before’);
const afterEl  = document.getElementById(‘q4-after’);
const update = () => {
const bVal = beforeEl ? beforeEl.value : ‘’;
const aVal = afterEl  ? afterEl.value  : ‘’;
this.updateCounter(‘q4b-count’, bVal.length, 150);
this.updateCounter(‘q4a-count’, aVal.length, 150);
this.saveAnswer(4, { before: bVal, after: aVal });
const valid = bVal.length >= 10 && aVal.length >= 10;
this.updateNextBtnState(4, valid);
if (valid) document.getElementById(‘q4-error’).classList.add(‘hidden’);
};
if (beforeEl) beforeEl.oninput = update;
if (afterEl)  afterEl.oninput  = update;
},

updateCounter(counterId, current, max) {
const el = document.getElementById(counterId);
if (!el) return;
el.textContent = current;
const parent = el.closest(’.char-counter’);
if (parent) {
parent.classList.toggle(‘warning’, current > max * 0.85);
parent.classList.toggle(‘over’,    current >= max);
}
},

// CORRECTION : lecture via data-value, pas via input checkbox
saveChannels() {
const selected = Array.from(
document.querySelectorAll(’.channel-card.selected’)
).map(card => card.dataset.value).filter(Boolean);
this.saveAnswer(7, selected);
},

// ── Sauvegarde ───────────────────────────
saveAnswer(qNum, value) {
this.answers[qNum] = value;
sessionStorage.setItem(‘offre_q’ + qNum, JSON.stringify(value));
},

// ── Validation ──────────────────────────
validateQ(qNum, showError) {
let valid = false;

```
switch (qNum) {
  case 1:
    valid = !!document.querySelector('.type-card.selected');
    break;
  case 2:
    const q2v = (document.getElementById('q2-input') || {}).value || '';
    valid = q2v.trim().length >= 10;
    if (showError && !valid) this.showError('q2-input', 'q2-error');
    break;
  case 3:
    const q3v = (document.getElementById('q3-input') || {}).value || '';
    valid = q3v.trim().length >= 20;
    if (showError && !valid) this.showError('q3-input', 'q3-error');
    break;
  case 4:
    const bv = (document.getElementById('q4-before') || {}).value || '';
    const av = (document.getElementById('q4-after')  || {}).value || '';
    valid = bv.trim().length >= 10 && av.trim().length >= 10;
    if (showError && !valid) {
      const errEl = document.getElementById('q4-error');
      if (errEl) errEl.classList.remove('hidden');
    }
    break;
  case 5:
    const q5v = (document.getElementById('q5-input') || {}).value || '';
    valid = q5v.trim().length >= 20;
    if (showError && !valid) this.showError('q5-input', 'q5-error');
    break;
  case 6:
    valid = true;
    break;
  case 7:
    const checked = document.querySelectorAll('.channel-card.selected').length;
    valid = checked > 0;
    if (showError && !valid) {
      const errEl = document.getElementById('q7-error');
      if (errEl) errEl.classList.remove('hidden');
    }
    break;
}

this.updateNextBtnState(qNum, valid);
return valid;
```

},

showError(inputId, errorId) {
const input = document.getElementById(inputId);
const error = document.getElementById(errorId);
if (input) input.classList.add(‘error’);
if (error) error.classList.remove(‘hidden’);
},

updateNextBtnState(qNum, valid) {
if (qNum < this.totalQ) {
const btn = document.getElementById(‘next-btn’);
if (btn) btn.disabled = !valid;
} else {
const btn = document.getElementById(‘generate-btn’);
if (btn) btn.disabled = !valid;
}
},

// ── Retour landing ───────────────────────
bindBackToLanding() {
document.getElementById(‘back-to-landing’).onclick = () => {
if (this.currentQ > 1) {
const ok = confirm(‘Retourner à l'accueil ? Tes réponses sont sauvegardées.’);
if (!ok) return;
}
App.showScreen(‘landing’);
};
},

// ── Démarrer la génération ───────────────
startGeneration() {
if (App.isGenerating) return;

```
const required = [1, 2, 3, 4, 5, 7];
for (const q of required) {
  if (!this.answers[q]) {
    alert('Il manque des réponses. Vérifie toutes les questions.');
    this.renderQ(q);
    return;
  }
}

App.isGenerating = true;
App.generationStartTime = Date.now();
Analytics.generationStarted();

App.showScreen('loading');
Generation.start(this.answers);
```

},
};

/* ═══════════════════════════════════════
GENERATION — Appel API + Loading
═══════════════════════════════════════ */
const Generation = {
retryCount: 0,
maxRetries: 1,
loadingMessages: [
‘Analyse de ta cible en cours…’,
‘Je construis ta promesse de transformation…’,
‘Rédaction de ta page de vente…’,
‘Création de tes emails de lancement…’,
‘Finalisation de l'offre complète…’,
‘Dernières vérifications…’,
],
msgInterval: null,
barInterval: null,
currentAnswers: null,

start(answers) {
this.currentAnswers = answers;
this.retryCount = 0;
this.showLoading();
this.callAPI(answers);
},

retry() {
if (this.retryCount >= this.maxRetries) {
this.showFatalError();
return;
}
this.retryCount++;
document.getElementById(‘loading-error’).classList.add(‘hidden’);
this.showLoading();
this.callAPI(this.currentAnswers);
},

showLoading() {
let msgIdx = 0;
const msgEl = document.getElementById(‘loading-msg’);
if (msgEl) msgEl.textContent = this.loadingMessages[0];

```
clearInterval(this.msgInterval);
this.msgInterval = setInterval(() => {
  msgIdx = (msgIdx + 1) % this.loadingMessages.length;
  if (msgEl) {
    msgEl.style.opacity = 0;
    setTimeout(() => {
      msgEl.textContent = this.loadingMessages[msgIdx];
      msgEl.style.opacity = 1;
    }, 200);
  }
}, 4000);

const barEl = document.getElementById('loading-bar');
let progress = 0;
clearInterval(this.barInterval);
this.barInterval = setInterval(() => {
  progress = Math.min(progress + (88 / 25), 88);
  if (barEl) barEl.style.width = progress + '%';
  if (progress >= 88) clearInterval(this.barInterval);
}, 1000);
```

},

stopLoading() {
clearInterval(this.msgInterval);
clearInterval(this.barInterval);
const barEl = document.getElementById(‘loading-bar’);
if (barEl) barEl.style.width = ‘100%’;
},

async callAPI(answers) {
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);

```
const warnTimeout = setTimeout(() => {
  const msgEl = document.getElementById('loading-msg');
  if (msgEl) msgEl.textContent = 'Ton offre est plus complexe que la moyenne — encore quelques secondes…';
}, 30000);

try {
  const response = await fetch('/.netlify/functions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  clearTimeout(warnTimeout);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Erreur serveur');
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (!data.result) throw new Error('Pas de résultat dans la réponse');

  const parsed = this.parseClaudeResponse(data.result);
  if (!parsed) throw new Error('Parsing JSON échoué');

  this.stopLoading();
  App.isGenerating = false;

  const duration = Date.now() - App.generationStartTime;
  Analytics.generationComplete(duration);

  sessionStorage.setItem('offre_result', JSON.stringify(parsed));
  sessionStorage.setItem('offre_generation_complete', 'true');

  Results.render(parsed);
  App.showScreen('results');

} catch (err) {
  clearTimeout(timeoutId);
  clearTimeout(warnTimeout);
  this.stopLoading();

  const isAbort = err.name === 'AbortError';
  Analytics.generationError(isAbort ? 'timeout' : 'api_error');
  console.error('[Generation error]', err);

  this.showRetryError(isAbort
    ? 'La génération a pris trop de temps. Tes réponses sont sauvegardées — réessaie.'
    : 'Une erreur technique est survenue. Tes réponses sont sauvegardées — clique sur Réessayer.'
  );
}
```

},

parseClaudeResponse(text) {
let clean = text.trim();
clean = clean.replace(/^`json\s*/i, '').replace(/\s*`$/i, ‘’).trim();
clean = clean.replace(/^`\s*/i, '').replace(/\s*`$/i, ‘’).trim();

```
try {
  const parsed = JSON.parse(clean);
  const required = ['titres', 'promesse', 'architecture_offre', 'prix', 'page_de_vente', 'page_capture', 'emails'];
  const missing = required.filter(k => !parsed[k]);
  if (missing.length > 0) {
    console.warn('[Parsing] Clés manquantes:', missing);
  }
  return parsed;
} catch (e) {
  console.error('[Parsing] JSON.parse échoué:', e);
  return null;
}
```

},

showRetryError(message) {
App.isGenerating = false;
const errBlock = document.getElementById(‘loading-error’);
const errMsg   = document.getElementById(‘loading-error-msg’);
if (errBlock) errBlock.classList.remove(‘hidden’);
if (errMsg)   errMsg.textContent = message;

```
document.getElementById('retry-btn').onclick = () => {
  App.isGenerating = true;
  this.retry();
};
document.getElementById('back-from-error').onclick = () => {
  App.isGenerating = false;
  App.showScreen('questionnaire');
  Questionnaire.renderQ(Questionnaire.currentQ);
};
```

},

showFatalError() {
const errMsg = document.getElementById(‘loading-error-msg’);
if (errMsg) errMsg.textContent = ‘Notre service rencontre un problème. Tes réponses sont bien sauvegardées — reviens dans quelques minutes.’;
const retryBtn = document.getElementById(‘retry-btn’);
if (retryBtn) retryBtn.style.display = ‘none’;
},
};

/* ═══════════════════════════════════════
SUGGESTIONS — Logique cliquable
═══════════════════════════════════════ */
(function initSuggestions() {
document.addEventListener(‘click’, function(e) {
const btn = e.target.closest(’.suggestion-btn’);
if (!btn) return;

```
const value = btn.dataset.value;
const target = btn.dataset.target;

if (btn.classList.contains('suggestion-autre')) {
  const grid = btn.closest('.suggestions-grid');
  const textarea = grid ? grid.nextElementSibling : null;
  if (textarea && (textarea.tagName === 'TEXTAREA' || textarea.tagName === 'INPUT')) {
    textarea.focus();
    textarea.value = '';
    textarea.dispatchEvent(new Event('input'));
  }
  btn.closest('.suggestions-grid').querySelectorAll('.suggestion-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  return;
}

let field = null;
if (target) {
  field = document.getElementById(target);
} else {
  const grid = btn.closest('.suggestions-grid');
  field = grid ? grid.nextElementSibling : null;
  if (field && field.classList.contains('char-counter')) {
    field = null;
  }
  if (!field || (field.tagName !== 'TEXTAREA' && field.tagName !== 'INPUT')) {
    const qContent = btn.closest('.q-content');
    field = qContent ? (qContent.querySelector('textarea') || qContent.querySelector('input[type="text"]')) : null;
  }
}

if (field) {
  field.value = value;
  field.dispatchEvent(new Event('input'));
  field.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

btn.closest('.suggestions-grid').querySelectorAll('.suggestion-btn').forEach(b => b.classList.remove('selected'));
btn.classList.add('selected');
```

});
})();
