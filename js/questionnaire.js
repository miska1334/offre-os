/* ═══════════════════════════════════════
   QUESTIONNAIRE.JS : Q1 à Q7
   Validation, navigation, sauvegarde
   - Q6 : différenciation (pourquoi toi ?)
   - Prix : champ optionnel sur Q7
   - Suggestions : lock sur Q2/Q3/Q5/Q6
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
      const saved = sessionStorage.getItem('offre_q' + i);
      if (saved) {
        try { this.answers[i] = JSON.parse(saved); }
        catch { this.answers[i] = saved; }
      }
    }
    const savedPrice = sessionStorage.getItem('offre_prix_opt');
    if (savedPrice) this.answers['prix_opt'] = savedPrice;

    const savedQ = parseInt(sessionStorage.getItem('offre_current_q') || '1');
    this.currentQ = Math.max(1, Math.min(savedQ, this.totalQ));
  },

  // ── Banner reprise ────────────────────
  checkResumeBanner() {
    const savedQ = parseInt(sessionStorage.getItem('offre_current_q') || '1');
    if (savedQ > 1 && Object.keys(this.answers).length > 0) {
      const banner = document.getElementById('resume-banner');
      const resumeQEl = document.getElementById('resume-q');
      if (banner) {
        resumeQEl.textContent = savedQ;
        banner.classList.remove('hidden');

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
  },

  clearSession() {
    for (let i = 1; i <= this.totalQ; i++) {
      sessionStorage.removeItem('offre_q' + i);
    }
    sessionStorage.removeItem('offre_current_q');
    sessionStorage.removeItem('offre_prix_opt');
    sessionStorage.removeItem('offre_result');
    sessionStorage.removeItem('offre_generation_complete');
    this.answers = {};
    this.currentQ = 1;
    this.resetFormUI();
  },

  resetFormUI() {
    document.querySelectorAll('.type-card, .channel-card, .suggestion-btn')
      .forEach((el) => el.classList.remove('selected'));
    document.querySelectorAll('.q-textarea, .q-input').forEach((el) => {
      el.value = '';
      el.classList.remove('error');
      delete el.dataset.suggestionLocked;
      delete el.dataset.suggestionLength;
      delete el.dataset.suggestionValue;
    });
    document.querySelectorAll('.q-error').forEach((el) => el.classList.add('hidden'));
    ['q2-count', 'q3-count', 'q4b-count', 'q4a-count', 'q5-count', 'q6-count']
      .forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
      });
  },

  // ── Affichage d'une question ─────────────
  renderQ(qNum) {
    this.currentQ = qNum;
    sessionStorage.setItem('offre_current_q', qNum);

    document.querySelectorAll('.q-screen').forEach(s => s.classList.remove('active'));
    const target = document.querySelector(`.q-screen[data-q="${qNum}"]`);
    if (target) target.classList.add('active');

    document.getElementById('q-current').textContent = qNum;
    document.getElementById('progress-fill').style.width = ((qNum - 1) / this.totalQ * 100) + '%';

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

    this.prefillAnswer(qNum);
    this.validateQ(qNum, false);
    window.scrollTo(0, 0);
    this.bindQEvents(qNum);
  },

  // ── Pré-remplissage ─────────────────────
  prefillAnswer(qNum) {
    const answer = this.answers[qNum];
    if (!answer && qNum !== 7) return;

    switch (qNum) {
      case 1:
        document.querySelectorAll('.type-card').forEach(card => {
          card.classList.toggle('selected', card.dataset.value === answer);
        });
        break;
      case 2:
        const q2 = document.getElementById('q2-input');
        if (q2 && answer) { q2.value = answer; this.updateCounter('q2-count', answer.length, 200); }
        break;
      case 3:
        const q3 = document.getElementById('q3-input');
        if (q3 && answer) { q3.value = answer; this.updateCounter('q3-count', answer.length, 300); }
        break;
      case 4:
        if (answer && answer.before) {
          const q4b = document.getElementById('q4-before');
          if (q4b) { q4b.value = answer.before; this.updateCounter('q4b-count', answer.before.length, 150); }
        }
        if (answer && answer.after) {
          const q4a = document.getElementById('q4-after');
          if (q4a) { q4a.value = answer.after; this.updateCounter('q4a-count', answer.after.length, 150); }
        }
        break;
      case 5:
        const q5 = document.getElementById('q5-input');
        if (q5 && answer) { q5.value = answer; this.updateCounter('q5-count', answer.length, 400); }
        break;
      case 6:
        const q6 = document.getElementById('q6-input');
        if (q6 && answer) { q6.value = answer; this.updateCounter('q6-count', answer.length, 400); }
        break;
      case 7:
        if (Array.isArray(answer)) {
          document.querySelectorAll('.channel-card').forEach(card => {
            card.classList.toggle('selected', answer.includes(card.dataset.value));
          });
        }
        // Pré-remplir le prix optionnel
        const priceEl = document.getElementById('price-input');
        if (priceEl && this.answers['prix_opt']) {
          priceEl.value = this.answers['prix_opt'];
        }
        break;
    }
  },

  // ── Bind events par question ─────────────
  bindQEvents(qNum) {
    switch (qNum) {
      case 1:
        document.querySelectorAll('.type-card').forEach(card => {
          card.onclick = () => {
            document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            this.saveAnswer(1, card.dataset.value);
            this.validateQ(1, false);
          };
        });
        break;

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
        this.bindTextarea('q6-input', 6, 20, 400, 'q6-count', 'q6-error');
        break;

      case 7:
        document.querySelectorAll('.channel-card').forEach(card => {
          card.onclick = () => {
            card.classList.toggle('selected');
            this.saveChannels();
            this.validateQ(7, false);
          };
        });
        // Prix optionnel
        const priceInput = document.getElementById('price-input');
        if (priceInput) {
          priceInput.oninput = () => {
            const val = priceInput.value.trim();
            this.answers['prix_opt'] = val;
            sessionStorage.setItem('offre_prix_opt', val);
          };
        }
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
  },

  // ── Helpers textarea ─────────────────────
  bindTextarea(id, qNum, minLen, maxLen, counterId, errorId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.oninput = () => {
      const val = el.value;

      // Gérer le lock suggestion : unlock seulement après +10 caractères
      if (el.dataset.suggestionLocked) {
        const suggLen = parseInt(el.dataset.suggestionLength || '0');
        const suggestionValue = (el.dataset.suggestionValue || '').trim();
        const rewritten = val.trim().length >= minLen
          && suggestionValue
          && val.trim() !== suggestionValue
          && !val.includes(suggestionValue);
        const detailAdded = val.trim().length >= suggLen + 10;

        if (detailAdded || rewritten) {
          delete el.dataset.suggestionLocked;
          delete el.dataset.suggestionLength;
          delete el.dataset.suggestionValue;
          const hintId = id.replace('-input', '-personal-hint');
          const hintEl = document.getElementById(hintId);
          if (hintEl) hintEl.classList.add('hidden');
        } else {
          // Toujours verrouillé : mettre à jour le compteur et sauvegarder, mais garder désactivé
          this.updateCounter(counterId, val.length, maxLen);
          this.saveAnswer(qNum, val);
          this.updateNextBtnState(qNum, false);
          return;
        }
      }

      this.updateCounter(counterId, val.length, maxLen);
      this.saveAnswer(qNum, val);
      const errEl = document.getElementById(errorId);
      if (errEl && val.length >= minLen) {
        errEl.classList.add('hidden');
        el.classList.remove('error');
      }
      this.updateNextBtnState(qNum, val.length >= minLen);
    };
  },

  bindBeforeAfter() {
    const beforeEl = document.getElementById('q4-before');
    const afterEl  = document.getElementById('q4-after');
    const update = () => {
      const bVal = beforeEl ? beforeEl.value : '';
      const aVal = afterEl  ? afterEl.value  : '';
      this.updateCounter('q4b-count', bVal.length, 150);
      this.updateCounter('q4a-count', aVal.length, 150);
      this.saveAnswer(4, { before: bVal, after: aVal });
      const valid = bVal.length >= 10 && aVal.length >= 10;
      this.updateNextBtnState(4, valid);
      if (valid) document.getElementById('q4-error').classList.add('hidden');
    };
    if (beforeEl) beforeEl.oninput = update;
    if (afterEl)  afterEl.oninput  = update;
  },

  updateCounter(counterId, current, max) {
    const el = document.getElementById(counterId);
    if (!el) return;
    el.textContent = current;
    const parent = el.closest('.char-counter');
    if (parent) {
      parent.classList.toggle('warning', current > max * 0.85);
      parent.classList.toggle('over',    current >= max);
    }
  },

  // CORRECTION : lecture via data-value, pas via input checkbox
  saveChannels() {
    const selected = Array.from(
      document.querySelectorAll('.channel-card.selected')
    ).map(card => card.dataset.value).filter(Boolean);
    this.saveAnswer(7, selected);
  },

  // ── Sauvegarde ───────────────────────────
  saveAnswer(qNum, value) {
    this.answers[qNum] = value;
    sessionStorage.setItem('offre_q' + qNum, JSON.stringify(value));
  },

  // ── Vérification suggestion lock ────────
  isFieldLocked(fieldId) {
    const el = document.getElementById(fieldId);
    return el && el.dataset.suggestionLocked === 'true';
  },

  showPersonalHint(hintId) {
    const el = document.getElementById(hintId);
    if (el) el.classList.remove('hidden');
  },

  // ── Validation ──────────────────────────
  validateQ(qNum, showError) {
    let valid = false;

    switch (qNum) {
      case 1:
        valid = !!document.querySelector('.type-card.selected');
        break;

      case 2: {
        const el = document.getElementById('q2-input');
        const val = el ? el.value : '';
        const locked = this.isFieldLocked('q2-input');
        valid = val.trim().length >= 10 && !locked;
        if (showError && !valid) {
          if (locked) this.showPersonalHint('q2-personal-hint');
          else this.showError('q2-input', 'q2-error');
        }
        break;
      }

      case 3: {
        const el = document.getElementById('q3-input');
        const val = el ? el.value : '';
        const locked = this.isFieldLocked('q3-input');
        valid = val.trim().length >= 20 && !locked;
        if (showError && !valid) {
          if (locked) this.showPersonalHint('q3-personal-hint');
          else this.showError('q3-input', 'q3-error');
        }
        break;
      }

      case 4: {
        const bv = (document.getElementById('q4-before') || {}).value || '';
        const av = (document.getElementById('q4-after')  || {}).value || '';
        valid = bv.trim().length >= 10 && av.trim().length >= 10;
        if (showError && !valid) {
          const errEl = document.getElementById('q4-error');
          if (errEl) errEl.classList.remove('hidden');
        }
        break;
      }

      case 5: {
        const el = document.getElementById('q5-input');
        const val = el ? el.value : '';
        const locked = this.isFieldLocked('q5-input');
        valid = val.trim().length >= 20 && !locked;
        if (showError && !valid) {
          if (locked) this.showPersonalHint('q5-personal-hint');
          else this.showError('q5-input', 'q5-error');
        }
        break;
      }

      case 6: {
        const el = document.getElementById('q6-input');
        const val = el ? el.value : '';
        const locked = this.isFieldLocked('q6-input');
        valid = val.trim().length >= 20 && !locked;
        if (showError && !valid) {
          if (locked) this.showPersonalHint('q6-personal-hint');
          else this.showError('q6-input', 'q6-error');
        }
        break;
      }

      case 7: {
        const checked = document.querySelectorAll('.channel-card.selected').length;
        valid = checked > 0;
        if (showError && !valid) {
          const errEl = document.getElementById('q7-error');
          if (errEl) errEl.classList.remove('hidden');
        }
        break;
      }
    }

    this.updateNextBtnState(qNum, valid);
    return valid;
  },

  showError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (error) error.classList.remove('hidden');
  },

  updateNextBtnState(qNum, valid) {
    if (qNum < this.totalQ) {
      const btn = document.getElementById('next-btn');
      if (btn) btn.disabled = !valid;
    } else {
      const btn = document.getElementById('generate-btn');
      if (btn) btn.disabled = !valid;
    }
  },

  // ── Retour landing ───────────────────────
  bindBackToLanding() {
    document.getElementById('back-to-landing').onclick = () => {
      if (this.currentQ > 1) {
        const ok = confirm('Retourner à l\'accueil ? Tes réponses sont sauvegardées.');
        if (!ok) return;
      }
      App.showScreen('landing');
    };
  },

  // ── Démarrer la génération ───────────────
  startGeneration() {
    if (App.isGenerating) return;

    // Q6 est maintenant obligatoire (différenciation)
    const required = [1, 2, 3, 4, 5, 6, 7];
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

    const retryBtn = document.getElementById('retry-btn');
    const errorBlock = document.getElementById('loading-error');
    const barEl = document.getElementById('loading-bar');
    if (retryBtn) retryBtn.style.display = '';
    if (errorBlock) errorBlock.classList.add('hidden');
    if (barEl) barEl.style.width = '0%';

    App.showScreen('loading');
    Generation.start({ ...this.answers });
  },
};


/* ═══════════════════════════════════════
   GENERATION : Appel API + Loading
═══════════════════════════════════════ */
const Generation = {
  retryCount: 0,
  maxRetries: 1,
  loadingMessages: [
    'Analyse de ta cible en cours…',
    'Je construis ta promesse de transformation…',
    'Rédaction de ta page de vente…',
    'Création de tes emails de lancement…',
    'Finalisation de ta structure d\'offre…',
    'Dernières vérifications…',
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
    document.getElementById('loading-error').classList.add('hidden');
    this.showLoading();
    this.callAPI(this.currentAnswers);
  },

  showLoading() {
    let msgIdx = 0;
    const msgEl = document.getElementById('loading-msg');
    if (msgEl) msgEl.textContent = this.loadingMessages[0];

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
  },

  stopLoading() {
    clearInterval(this.msgInterval);
    clearInterval(this.barInterval);
    const barEl = document.getElementById('loading-bar');
    if (barEl) barEl.style.width = '100%';
  },

  async callAPI(answers) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const warnTimeout = setTimeout(() => {
      const msgEl = document.getElementById('loading-msg');
      if (msgEl) msgEl.textContent = 'Ton offre est plus complexe que la moyenne, encore quelques secondes…';
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
        let serverMessage = '';
        try {
          const payload = await response.json();
          serverMessage = payload.error || '';
        } catch {
          serverMessage = '';
        }
        const error = new Error(serverMessage || 'Le service de génération est momentanément indisponible.');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      if (!data.result) throw new Error('La réponse reçue est incomplète.');

      const parsed = typeof data.result === 'object'
        ? data.result
        : this.parseClaudeResponse(data.result);
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
      const errorType = isAbort ? 'timeout' : (err.status === 429 ? 'rate_limit' : 'api_error');
      Analytics.generationError(errorType);
      console.error('[Generation error]', err);

      let message = err.message || 'Une erreur technique est survenue.';
      if (isAbort) message = 'La génération a pris trop de temps. Tes réponses sont sauvegardées, réessaie.';
      if (err.status === 429) message = 'Trop de générations ont été demandées. Attends un peu avant de réessayer.';

      this.showRetryError(message);
    }
  },

  parseClaudeResponse(text) {
    let clean = text.trim();
    clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    clean = clean.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const parsed = JSON.parse(clean);
      const required = ['titres', 'promesse', 'architecture_offre', 'prix', 'page_de_vente', 'page_capture', 'emails'];
      const missing = required.filter(k => !parsed[k]);
      if (missing.length > 0) console.warn('[Parsing] Clés manquantes:', missing);
      return parsed;
    } catch (e) {
      console.error('[Parsing] JSON.parse échoué:', e);
      return null;
    }
  },

  showRetryError(message) {
    App.isGenerating = false;
    const errBlock = document.getElementById('loading-error');
    const errMsg   = document.getElementById('loading-error-msg');
    if (errBlock) errBlock.classList.remove('hidden');
    if (errMsg)   errMsg.textContent = message;

    document.getElementById('retry-btn').onclick = () => {
      App.isGenerating = true;
      this.retry();
    };
    document.getElementById('back-from-error').onclick = () => {
      App.isGenerating = false;
      App.showScreen('questionnaire');
      Questionnaire.renderQ(Questionnaire.currentQ);
    };
  },

  showFatalError() {
    const errMsg = document.getElementById('loading-error-msg');
    if (errMsg) errMsg.textContent = 'Notre service rencontre un problème. Tes réponses sont bien sauvegardées, reviens dans quelques minutes.';
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) retryBtn.style.display = 'none';
  },
};


/* ═══════════════════════════════════════
   SUGGESTIONS : Logique cliquable
   - Q2/Q3/Q5/Q6 : lock suggestion,
     oblige une modification personnelle
   - Q1/Q7 : comportement standard
═══════════════════════════════════════ */
(function initSuggestions() {

  // Questions qui nécessitent une personnalisation après suggestion
  const PERSONAL_REQUIRED_IDS = ['q2-input', 'q3-input', 'q5-input', 'q6-input'];

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.suggestion-btn');
    if (!btn) return;

    const value = btn.dataset.value;
    const target = btn.dataset.target;

    // Cas "Autre" : focus sur le textarea, ne pas pré-remplir
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

    // Trouver le champ cible
    let field = null;
    if (target) {
      field = document.getElementById(target);
    } else {
      const grid = btn.closest('.suggestions-grid');
      field = grid ? grid.nextElementSibling : null;
      if (field && field.classList.contains('char-counter')) field = null;
      if (!field || (field.tagName !== 'TEXTAREA' && field.tagName !== 'INPUT')) {
        const qContent = btn.closest('.q-content');
        field = qContent ? (qContent.querySelector('textarea') || qContent.querySelector('input[type="text"]')) : null;
      }
    }

    if (!field) return;

    // Remplir le champ
    field.value = value;

    // Marquer le bouton comme sélectionné
    btn.closest('.suggestions-grid').querySelectorAll('.suggestion-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Comportement selon le type de champ
    if (PERSONAL_REQUIRED_IDS.includes(field.id)) {
      // Lock : oblige une personnalisation (+10 caractères minimum)
      field.dataset.suggestionLocked = 'true';
      field.dataset.suggestionLength = value.length.toString();
      field.dataset.suggestionValue = value;

      // Mettre à jour le compteur manuellement
      const countId = field.id.replace('-input', '-count');
      const countEl = document.getElementById(countId);
      if (countEl) {
        countEl.textContent = field.value.length;
        const maxLen = parseInt(field.getAttribute('maxlength')) || 400;
        const parent = countEl.closest('.char-counter');
        if (parent) {
          parent.classList.toggle('warning', field.value.length > maxLen * 0.85);
          parent.classList.remove('over');
        }
      }

      // Afficher le hint personnalisation
      const hintId = field.id.replace('-input', '-personal-hint');
      const hintEl = document.getElementById(hintId);
      if (hintEl) hintEl.classList.remove('hidden');

      // Désactiver le bouton Suivant
      Questionnaire.updateNextBtnState(Questionnaire.currentQ, false);

      // Scroll vers le champ pour inviter à modifier
      field.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      field.focus();

    } else {
      // Comportement standard : dispatch input event
      field.dispatchEvent(new Event('input'));
      field.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
})();
