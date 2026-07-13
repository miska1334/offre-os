/* ═══════════════════════════════════════
   RESULTS.JS : Affichage des outputs
   + Paywall + Copy logic
═══════════════════════════════════════ */

const Results = {
  data: null,
  paywallObserver: null,

  render(data) {
    this.data = data;

    // Sécurité : si données manquantes, afficher ce qu'on a
    this.renderTitres(data.titres || []);
    this.renderPromesse(data.promesse || '');
    this.renderArchitecture(data.architecture_offre || '');
    this.renderPrix(data.prix || {});
    this.renderPageDeVente(data.page_de_vente || {});
    this.renderCapture(data.page_capture || {});
    this.renderEmails(data.emails || []);
    this.initPaywall();
    this.initCopyAll();
    this.initProSticky();
  },

  // ── Titres ──────────────────────────────
  renderTitres(titres) {
    const container = document.getElementById('titres-output');
    if (!container) return;

    if (!Array.isArray(titres) || titres.length === 0) {
      container.innerHTML = '<p style="color:var(--mid)">Les titres n\'ont pas pu être générés. Réessaie.</p>';
      return;
    }

    container.innerHTML = titres.map((titre, i) => `
      <div class="titre-card">
        <span class="titre-text">${this.escape(titre)}</span>
        <button class="btn-copy" data-text="${this.escapeAttr(titre)}" data-section="titre_${i+1}">Copier</button>
      </div>
    `).join('');

    this.bindCopyButtons(container);
  },

  // ── Promesse ─────────────────────────────
  renderPromesse(promesse) {
    const container = document.getElementById('promesse-output');
    if (!container) return;

    container.innerHTML = `
      <span class="promesse-text" style="flex:1">"${this.escape(promesse)}"</span>
      <button class="btn-copy" data-text="${this.escapeAttr(promesse)}" data-section="promesse" style="align-self:flex-start;flex-shrink:0">Copier</button>
    `;
    this.bindCopyButtons(container);
  },

  // ── Architecture ──────────────────────────
  renderArchitecture(text) {
    const container = document.getElementById('architecture-output');
    if (!container) return;

    container.innerHTML = `
      <div style="white-space:pre-wrap;word-break:break-word;font-size:.92rem;color:var(--mid);line-height:1.8">${this.escape(text)}</div>
      <button class="btn-copy" data-text="${this.escapeAttr(text)}" data-section="architecture" style="margin-top:12px">Copier</button>
    `;
    this.bindCopyButtons(container);
  },

  // ── Prix ────────────────────────────────
  renderPrix(prix) {
    const montantEl = document.getElementById('prix-montant');
    const justifEl  = document.getElementById('prix-justification');
    if (montantEl) montantEl.textContent = prix.montant || '-';
    if (justifEl)  justifEl.textContent  = prix.justification || '';

    // Bouton copier
    const copyBtn = document.querySelector('#section-prix .btn-copy');
    if (copyBtn && prix.montant) {
      const fullText = `Prix recommandé : ${prix.montant}\n${prix.justification || ''}`;
      copyBtn.dataset.text    = fullText;
      copyBtn.dataset.section = 'prix';
      copyBtn.onclick = () => this.copyText(fullText, copyBtn);
    }
  },

  // ── Page de vente ─────────────────────────
  renderPageDeVente(pdv) {
    const container = document.getElementById('pdv-output');
    if (!container) return;

    const blocs = [
      { key: 'headline',   label: 'Headline' },
      { key: 'probleme',   label: 'Le problème' },
      { key: 'solution',   label: 'La solution' },
      { key: 'offre',      label: 'Ce que tu offres' },
      { key: 'objections', label: 'Les objections' },
      { key: 'cta',        label: 'L\'appel à l\'action' },
    ];

    container.innerHTML = blocs.map(b => `
      <div class="pdv-block">
        <div class="pdv-block-header">
          <span class="pdv-block-label">${b.label}</span>
          <button class="btn-copy" data-text="${this.escapeAttr(pdv[b.key] || '')}" data-section="pdv_${b.key}">Copier</button>
        </div>
        <div class="pdv-block-content">${this.escape(pdv[b.key] || '-')}</div>
      </div>
    `).join('');

    this.bindCopyButtons(container);
  },

  // ── Page de capture ────────────────────────
  renderCapture(capture) {
    const container = document.getElementById('capture-output');
    if (!container) return;

    const blocs = [
      { key: 'headline',    label: 'Headline' },
      { key: 'benefices',   label: 'Les bénéfices' },
      { key: 'lead_magnet', label: 'Lead magnet suggéré' },
    ];

    container.innerHTML = blocs.map(b => `
      <div class="capture-block">
        <div class="capture-block-header">
          <span>${b.label}</span>
          <button class="btn-copy" data-text="${this.escapeAttr(capture[b.key] || '')}" data-section="capture_${b.key}">Copier</button>
        </div>
        <div class="capture-block-content">${this.escape(capture[b.key] || '-')}</div>
      </div>
    `).join('');

    this.bindCopyButtons(container);
  },

  // ── Emails ──────────────────────────────
  renderEmails(emails) {
    const container = document.getElementById('emails-output');
    if (!container) return;

    if (!Array.isArray(emails) || emails.length === 0) {
      container.innerHTML = '<p style="color:var(--mid)">Les emails n\'ont pas pu être générés.</p>';
      return;
    }

    const labels = ['Bienvenue', 'Valeur', 'Vente'];

    container.innerHTML = emails.map((email, i) => {
      const fullText = `OBJET : ${email.objet || ''}\n\n${email.corps || ''}`;
      return `
        <div class="email-card">
          <div class="email-card-header">
            <span class="email-num">Email ${i + 1} : ${labels[i] || ''}</span>
            <button class="btn-copy" data-text="${this.escapeAttr(fullText)}" data-section="email_${i+1}">Copier cet email</button>
          </div>
          <div class="email-objet">
            <span class="email-objet-label">Objet : </span>
            ${this.escape(email.objet || '-')}
          </div>
          <div class="email-corps">${this.escape(email.corps || '-')}</div>
        </div>
      `;
    }).join('');

    this.bindCopyButtons(container);
  },

  // ── Copy All : Page de vente ─────────────
  initCopyAll() {
    const btn = document.getElementById('copy-all-pdv');
    if (!btn || !this.data) return;

    btn.onclick = () => {
      const pdv = this.data.page_de_vente || {};
      const blocs = [
        ['HEADLINE', pdv.headline],
        ['LE PROBLÈME', pdv.probleme],
        ['LA SOLUTION', pdv.solution],
        ['CE QUE J\'OFFRE', pdv.offre],
        ['LES OBJECTIONS', pdv.objections],
        ['APPEL À L\'ACTION', pdv.cta],
      ];
      const fullText = blocs
        .filter(([, val]) => val)
        .map(([label, val]) => `=== ${label} ===\n${val}`)
        .join('\n\n');

      this.copyText(fullText, btn);
      Analytics.copyClicked('pdv_all');
    };
  },

  // ── Paywall ──────────────────────────────
  initPaywall() {
    // IntersectionObserver pour tracker la vue
    const paywall = document.getElementById('section-paywall');
    if (this.paywallObserver) this.paywallObserver.disconnect();
    if (paywall && 'IntersectionObserver' in window) {
      let tracked = false;
      this.paywallObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !tracked) {
          tracked = true;
          Analytics.paywallViewed();
          this.paywallObserver.disconnect();
        }
      }, { threshold: 0.3 });
      this.paywallObserver.observe(paywall);
    }

    // CTA payant
    const ctaBtn = document.getElementById('paywall-cta');
    if (ctaBtn) {
      ctaBtn.onclick = () => Analytics.paywallCtaClicked();
    }

    // Dismiss
    const dismissBtn = document.getElementById('paywall-dismiss');
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        dismissBtn.textContent = 'Bonne continuation ! Reviens quand tu veux créer une nouvelle offre.';
        dismissBtn.disabled = true;
      };
    }
  },

  // ── Pro sticky ───────────────────────────
  initProSticky() {
    const btn = document.getElementById('pro-sticky-btn');
    if (!btn) return;
    btn.onclick = () => {
      const paywall = document.getElementById('section-paywall');
      if (paywall) paywall.scrollIntoView({ behavior: 'smooth' });
      Analytics.paywallViewed();
    };
  },

  // ── Helpers copier ──────────────────────
  bindCopyButtons(container) {
    container.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const text    = btn.dataset.text || '';
        const section = btn.dataset.section || 'unknown';
        this.copyText(text, btn);
        Analytics.copyClicked(section);
      });
    });
  },

  copyText(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showCopied(btn);
      }).catch(() => {
        this.fallbackCopy(text, btn);
      });
    } else {
      this.fallbackCopy(text, btn);
    }
  },

  fallbackCopy(text, btn) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showCopied(btn);
    } catch {
      btn.textContent = 'Copie manuelle nécessaire';
    }
    document.body.removeChild(ta);
  },

  showCopied(btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copié ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copied');
    }, 2000);
  },

  // ── Escape HTML ──────────────────────────
  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  },

  escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '&#10;');
  },
};
