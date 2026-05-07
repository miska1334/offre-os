/* ═══════════════════════════════════════════════════════
   generate.js — OffreOS
   - Mode MOCK activable via variable d'env MOCK_MODE=true
   - JSON robuste : prompt court, max_tokens suffisant
   - Pas d'appel Claude si MOCK_MODE=true
═══════════════════════════════════════════════════════ */

// ── Rate limiting ────────────────────────────────────
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  const LIMIT = 20;
  const WINDOW = 60 * 60 * 1000;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW });
    return true;
  }

  const e = rateLimitMap.get(key);

  if (now > e.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW });
    return true;
  }

  if (e.count >= LIMIT) return false;

  e.count++;
  return true;
}

// ── Mock JSON — réponse simulée sans appel API ────────
const MOCK_RESULT = {
  titres: [
    "De la confusion à la clarté : crée une offre de coaching qui se vend en 30 jours",
    "L'accompagnement qui transforme les entrepreneurs bloqués en indépendants confiants",
    "Stop à la procrastination : structure ton offre et trouve tes premiers clients cette semaine"
  ],
  promesse: "Je t'aide à passer de l'idée floue à une offre concrète qui attire des clients — en moins de 30 jours.",
  architecture_offre: "Programme de 6 semaines en accompagnement individuel.\n\n• 6 appels vidéo hebdomadaires de 60 min\n• Accès à un espace de travail partagé\n• Feedback illimité par message entre les sessions\n• 3 templates de communication prêts à l'emploi\n• Accès à vie aux ressources du programme",
  prix: {
    montant: "1 200€",
    justification: "Positionnement premium justifié par l'accompagnement individuel sur 6 semaines. Marché FR : coaching business individuel de ce type se positionne entre 800 et 2 000€."
  },
  page_de_vente: {
    headline: "Tu as une idée, tu veux te lancer, mais tu tournes en rond depuis des mois ?",
    probleme: "Tu regardes d'autres entrepreneurs vendre leurs offres sur Instagram et tu te demandes comment ils font. Toi, tu as une idée. Tu as même commencé à réfléchir. Mais dès que tu ouvres un fichier pour structurer ton offre, tu bloques. Trop de questions sans réponse. Pas assez de clarté. Et les semaines passent.",
    solution: "Ce n'est pas un problème de talent ou de motivation. C'est un problème de méthode. En 6 semaines de travail ensemble, on structure ton offre de A à Z, on définit ta cible exacte, on crée ta page de vente et on planifie ton lancement.",
    offre: "Ce que tu obtiens :\n• 6 appels vidéo hebdomadaires de 60 min\n• Un espace de travail partagé pour avancer entre les sessions\n• Des feedbacks illimités par message\n• 3 templates de communication prêts à l'emploi\n• Accès à vie aux ressources du programme",
    objections: "Est-ce que ça marchera pour moi ?\nCe programme est fait pour les entrepreneurs qui ont une idée mais manquent de structure. Si tu es prêt à t'investir 6 semaines, les résultats sont au rendez-vous.\n\nEst-ce que c'est le bon moment ?\nIl n'y a jamais de moment parfait. Mais chaque semaine qui passe sans offre structurée, c'est une semaine sans clients.",
    cta: "Réserve ton appel de découverte gratuit de 30 min. On fait le point sur ton projet et on voit si ce programme est fait pour toi."
  },
  page_capture: {
    headline: "Télécharge le guide gratuit : 5 étapes pour structurer ton offre de coaching en un week-end",
    benefices: "• La méthode exacte pour définir ta cible en 20 minutes\n• Les 3 questions qui révèlent ta vraie valeur\n• Le template de page de vente prêt à remplir",
    lead_magnet: "Guide PDF : Structure ton offre en un week-end — 12 pages, exercices inclus"
  },
  emails: [
    {
      numero: 1,
      objet: "Bienvenue — voilà ce qui t'attend",
      corps: "Bonjour,\n\nMerci d'avoir téléchargé le guide.\n\nDans les prochains jours, je vais te partager les outils concrets que j'utilise avec mes clients pour structurer une offre qui se vend.\n\nMais d'abord, une question : quelle est la partie qui te bloque le plus en ce moment ?\n\nRéponds directement à cet email — je lis tous les messages.\n\nÀ très vite,"
    },
    {
      numero: 2,
      objet: "L'erreur que font 90% des coachs qui débutent",
      corps: "Bonjour,\n\nL'erreur numéro 1 que je vois chez les entrepreneurs qui galèrent à vendre ?\n\nIls parlent de leur offre avant de parler du problème de leur client.\n\nRésultat : les gens ne se reconnaissent pas. Ils passent leur chemin.\n\nLa règle d'or : commence toujours par la douleur de ton client. Décris sa situation mieux qu'il ne pourrait le faire lui-même. Et là, il te fait confiance.\n\nC'est la base de tout le reste.\n\nDemain je t'explique comment trouver les mots exacts.\n\nÀ demain,"
    },
    {
      numero: 3,
      objet: "Prêt à passer à l'étape suivante ?",
      corps: "Bonjour,\n\nCes deux derniers jours, on a parlé des fondations.\n\nMaintenant, si tu veux aller plus loin et structurer ton offre complète avec moi — pas en lisant un guide, mais en travaillant ensemble — j'ai ouvert 3 places pour un accompagnement individuel de 6 semaines.\n\nOn construit ton offre, ta page de vente et ton plan de lancement. Ensemble.\n\nSi ça t'intéresse, réserve un appel gratuit de 30 min ici pour qu'on en parle.\n\nÀ bientôt,"
    }
  ]
};

// ── Prompt système compact ────────────────────────────
const SYSTEM_PROMPT = `Tu es expert en copywriting francophone. Réponds UNIQUEMENT avec du JSON valide, sans markdown ni texte autour.

Format exact (respecte toutes les clés) :
{"titres":["t1","t2","t3"],"promesse":"string","architecture_offre":"string","prix":{"montant":"string","justification":"string"},"page_de_vente":{"headline":"string","probleme":"string","solution":"string","offre":"string","objections":"string","cta":"string"},"page_capture":{"headline":"string","benefices":"string","lead_magnet":"string"},"emails":[{"numero":1,"objet":"string","corps":"string"},{"numero":2,"objet":"string","corps":"string"},{"numero":3,"objet":"string","corps":"string"}]}

Règles : français naturel, ton humain, pas de jargon anglais, textes courts et percutants.`;

function buildPrompt(a) {
  const types = {
    coaching: 'Coaching',
    formation: 'Formation en ligne',
    service: 'Service',
    produit: 'Produit digital'
  };

  const ch = Array.isArray(a[7]) ? a[7].join(', ') : (a[7] || 'Non précisé');
  const b = (a[4] && a[4].before) ? a[4].before : 'Non précisé';
  const af = (a[4] && a[4].after) ? a[4].after : 'Non précisé';
  const px = (a[6] && a[6].length > 2) ? a[6] : 'à suggérer selon le marché FR';

  return `Offre pour entrepreneur FR.
Type: ${types[a[1]] || a[1] || '?'}
Cible: ${a[2] || '?'}
Problème: ${a[3] || '?'}
Avant: ${b} | Après: ${af}
Contenu: ${a[5] || '?'}
Prix: ${px}
Canaux: ${ch}`;
}

function sanitize(answers) {
  if (!answers || typeof answers !== 'object') return {};

  const clean = {};
  const max = {
    1: 50,
    2: 150,
    3: 200,
    5: 300,
    6: 80
  };

  for (let i = 1; i <= 7; i++) {
    const v = answers[i];

    if (v == null) continue;

    if (i === 4 && typeof v === 'object') {
      clean[i] = {
        before: String(v.before || '').slice(0, 120),
        after: String(v.after || '').slice(0, 120)
      };
    } else if (i === 7 && Array.isArray(v)) {
      clean[i] = v.slice(0, 6);
    } else if (typeof v === 'string') {
      clean[i] = v.slice(0, max[i] || 300);
    } else {
      clean[i] = v;
    }
  }

  return clean;
}

function cleanAndParse(text) {
  if (!text) return null;

  let t = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');

  if (start === -1 || end === -1) return null;

  t = t.slice(start, end + 1);

  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

// ── Handler principal ─────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed'
      })
    };
  }

  const ip = (event.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';

  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({
        error: 'Trop de requêtes — réessaie dans 1h.'
      })
    };
  }

  let answers;

  try {
    const b = JSON.parse(event.body || '{}');
    answers = b.answers;

    if (!answers) throw new Error();
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Requête invalide'
      })
    };
  }

  // ══ MODE MOCK — aucun appel API Claude ══
  const isMock = process.env.MOCK_MODE === 'true';

  if (isMock) {
    console.log('[MOCK] Réponse simulée — pas d\'appel Claude');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        result: JSON.stringify(MOCK_RESULT),
        mock: true
      })
    };
  }

  // ══ MODE RÉEL ══
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Clé API manquante dans les variables Netlify.'
      })
    };
  }

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildPrompt(sanitize(answers))
          }
        ],
      }),
    });

    clearTimeout(tid);

    if (!res.ok) {
      const t = await res.text().catch(() => '');

      console.error('Claude error:', res.status, t.slice(0, 200));

      if (res.status === 429) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: 'API surchargée — réessaie dans quelques secondes.'
          })
        };
      }

      if (res.status === 401) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Clé API invalide — vérifie dans Netlify > Environment variables.'
          })
        };
      }

      throw new Error('API ' + res.status);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    if (!text) {
      throw new Error('Réponse Claude vide');
    }

    const parsed = cleanAndParse(text);

    if (!parsed) {
      console.error('JSON invalide reçu de Claude:', text.slice(0, 300));
      throw new Error('JSON invalide');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        result: JSON.stringify(parsed)
      })
    };
  } catch (err) {
    clearTimeout(tid);

    console.error('Erreur generate:', err.message);

    const msg = err.name === 'AbortError'
      ? 'La génération a pris trop de temps — réessaie.'
      : 'Erreur lors de la génération — réessaie.';

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: msg
      })
    };
  }
};
