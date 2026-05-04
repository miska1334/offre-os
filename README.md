# OffreOS — Prototype AICoach
## REVENUS-IA.FR — Guide de déploiement complet

---

## 📁 Structure des fichiers

```
offre-os/
├── index.html                  ← L'app complète (landing + questionnaire + résultats)
├── confidentialite.html        ← Page RGPD (à compléter)
├── mentions-legales.html       ← Page légale (à compléter)
├── css/
│   └── style.css               ← Tous les styles
├── js/
│   ├── analytics.js            ← Tracking Plausible
│   ├── app.js                  ← Gestion des écrans + landing
│   ├── questionnaire.js        ← Q1-Q7 + logique génération
│   └── results.js              ← Affichage résultats + copier
├── netlify/
│   └── functions/
│       └── generate.js         ← Appel Claude API (côté serveur)
├── netlify.toml                ← Config Netlify
├── package.json                ← Dépendances
└── .env.example                ← Template variables d'env
```

---

## 🚀 Déploiement — Étapes dans l'ordre

### ÉTAPE 1 — Préparer les comptes (30 min)

1. **Netlify** : créer un compte sur netlify.com (gratuit)
2. **Anthropic** : récupérer ta clé API sur console.anthropic.com
3. **Gumroad** : créer le produit "AICoach Pro — 47€" — copier l'URL

### ÉTAPE 2 — Configurer le projet (10 min)

**a) Remplacer le lien Gumroad dans index.html :**
```
Chercher : https://gumroad.com/VOTRE_LIEN
Remplacer par : ton URL Gumroad réelle
```

**b) Configurer Plausible Analytics dans js/analytics.js :**
```
Chercher : data-domain', 'revenus-ia.fr'
Remplacer par ton domaine réel
```

**c) Compléter les pages légales :**
- `confidentialite.html` — remplir les [champs entre crochets]
- `mentions-legales.html` — remplir les [champs entre crochets]

**d) Configurer Systeme.io dans js/app.js (optionnel pour le prototype) :**
```
Si tu veux capturer les emails dans Systeme.io dès le départ :
→ Créer un formulaire dans Systeme.io
→ Copier l'ID du formulaire
→ Adapter la fonction captureEmailSystemeIO() dans app.js
```

### ÉTAPE 3 — Déployer sur Netlify (15 min)

**Option A — Interface Netlify (plus simple) :**
1. Aller sur netlify.com → "Add new site" → "Deploy manually"
2. Glisser-déposer le dossier `offre-os/`
3. Le site est en ligne immédiatement

**Option B — CLI (recommandé pour les mises à jour) :**
```bash
# Installer Node.js (https://nodejs.org) si pas déjà installé

# Dans le dossier offre-os/
npm install
npx netlify login
npx netlify init
npm run deploy
```

### ÉTAPE 4 — Configurer la clé API Claude (CRITIQUE)

**Ne jamais mettre la clé API dans les fichiers — uniquement dans le Dashboard Netlify :**

1. Dashboard Netlify → ton site → "Site configuration"
2. "Environment variables" → "Add a variable"
3. Key : `CLAUDE_API_KEY`
4. Value : ta clé API Anthropic (commence par `sk-ant-api03-...`)
5. Save → **Redéployer le site** (nécessaire pour que la variable soit prise en compte)

### ÉTAPE 5 — Connecter un domaine (optionnel mais recommandé)

1. Acheter `revenus-ia.fr` sur OVH, Namecheap ou Porkbun (~10€/an)
2. Dashboard Netlify → "Domain management" → "Add domain"
3. Suivre les instructions DNS de Netlify
4. HTTPS activé automatiquement (Let's Encrypt)

### ÉTAPE 6 — Tester avant de lancer

**Checklist de test :**
```
□ Flux complet : landing → email → Q1-Q7 → génération → résultats → paywall
□ Tester sur iPhone (Safari) ET Android (Chrome)
□ Tester avec une réponse trop courte sur Q2 → vérifier le message d'erreur
□ Tester Q6 avec "je ne sais pas" → vérifier que Claude génère un prix
□ Tester l'abandon à Q4 → quitter → revenir → vérifier la reprise de session
□ Tester les boutons Copier sur mobile
□ Vérifier que le lien Gumroad fonctionne
□ Vérifier les pages /confidentialite et /mentions-legales
□ Lire les outputs générés : est-ce en français naturel ? Pertinent ?
□ Vérifier que la clé API n'apparaît nulle part dans les sources du navigateur
```

---

## ⚙️ Configuration avancée

### Adapter le prompt Claude (si les outputs ne te satisfont pas)

Modifier `netlify/functions/generate.js` — la constante `SYSTEM_PROMPT`.
Après modification : redéployer (`npm run deploy`).

### Ajouter des preuves bêta sur la landing

Dans `index.html`, chercher `id="proofs-block"` et remplacer le badge par des vraies cartes :
```html
<div class="proofs-grid">
  <div class="proof-card">
    <strong>Camille, coach bien-être</strong> — "Offre créée en 17 minutes. J'avais bloqqué dessus 2 semaines."
  </div>
  <!-- ajouter d'autres -->
</div>
```

### Changer le prix Gumroad

1. Modifier le prix sur Gumroad
2. Mettre à jour le texte dans `index.html` (paywall section — "47€")

---

## 🔧 Développement local

```bash
npm install

# Créer un fichier .env (copier .env.example)
cp .env.example .env
# Éditer .env et ajouter ta vraie clé API

# Lancer le serveur local avec les fonctions Netlify
npm run dev
# → http://localhost:8888
```

---

## 📊 KPIs à suivre dès le lancement

| KPI | Où mesurer | Objectif semaine 1 |
|-----|-----------|-------------------|
| Visiteurs landing | Plausible | — (établir la baseline) |
| Taux complétion Q7 | Plausible events | > 50% |
| Taux generation_complete | Plausible | > 40% des Q7 |
| Taux copy_clicked | Plausible | > 60% des résultats |
| Taux paywall_viewed | Plausible | > 80% des résultats |
| Conversion paywall → achat | Gumroad | > 3% |

---

## ❓ Questions fréquentes

**Q : La clé API va coûter combien ?**
Claude Sonnet coûte ~0.003$/1k tokens en input, ~0.015$/1k en output. Une génération ≈ ~2000 tokens total ≈ 0.03-0.05$ par appel. Budget estimé : ~10-20€ pour 300-500 générations.

**Q : Que faire si les outputs sont mauvais ?**
Améliorer le SYSTEM_PROMPT dans `generate.js`. Ajouter des exemples concrets ("Voilà un exemple de bonne page de vente FR : [exemple]"). Redéployer.

**Q : Peut-on utiliser autre chose que Netlify ?**
Oui : Vercel (même principe avec `api/` folder), Railway, Render. L'important est que la clé API reste côté serveur.

---

*OffreOS — le système pour créer et structurer une offre*
*AICoach — REVENUS-IA.FR — Système DÉCLIC™*
