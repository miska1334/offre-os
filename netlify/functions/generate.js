/* ═══════════════════════════════════════
   NETLIFY FUNCTION — generate.js
   Appel Claude API côté serveur
   La clé API n'est JAMAIS exposée au client
═══════════════════════════════════════ */

const Anthropic = require('@anthropic-ai/sdk');

// Rate limiting simple en mémoire (reset au redémarrage de la fonction)
// Pour une vraie protection, utiliser Upstash Redis ou Netlify KV
const rateLimitMap = new Map();
const RATE_LIMIT = 10;         // max appels par IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 heure

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  const entry = rateLimitMap.get(key);
  if (now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Le prompt système (ne change jamais) ───
const SYSTEM_PROMPT = `Tu es un expert en création d'offres et en copywriting pour le marché francophone.
Tu aides les entrepreneurs français, belges, suisses et québécois à structurer et vendre leurs offres en ligne.
Tu connais les codes culturels francophones, les plateformes populaires (Systeme.io, Notion, Canva, TikTok) et les attentes des clients sur ce marché.

RÈGLE ABSOLUE : Tu réponds UNIQUEMENT avec un objet JSON valide.
Pas de texte avant. Pas de texte après. Pas de balises markdown. Pas d'explication. Juste le JSON brut, parseable directement.

Le JSON doit respecter exactement cette structure :
{
  "titres": ["titre1", "titre2", "titre3"],
  "promesse": "string",
  "architecture_offre": "string",
  "prix": { "montant": "string", "justification": "string" },
  "page_de_vente": {
    "headline": "string",
    "probleme": "string",
    "solution": "string",
    "offre": "string",
    "objections": "string",
    "cta": "string"
  },
  "page_capture": {
    "headline": "string",
    "benefices": "string",
    "lead_magnet": "string"
  },
  "emails": [
    { "numero": 1, "objet": "string", "corps": "string" },
    { "numero": 2, "objet": "string", "corps": "string" },
    { "numero": 3, "objet": "string", "corps": "string" }
  ]
}

RÈGLES DE QUALITÉ OBLIGATOIRES :
- Tout le contenu est en français naturel, pas en franglais
- Les titres : 15-25 mots, percutants, orientés transformation, concrets
- La promesse : 1 phrase, 20-35 mots, structure "Avant → Après" claire
- La page de vente : 600-900 mots au total, copywriting direct et humain, pas de jargon
- Les emails : 150-250 mots chacun, ton conversationnel, pas corporatif
- Pas de jargon marketing anglophone (pas de "funnel", "lead", "nurturing", "mindset")
- Adapter le ton au type de projet : coaching = chaleureux et encourageant, service = professionnel et précis, formation = pédagogique, produit = direct et orienté bénéfice
- La justification du prix doit mentionner des éléments concrets du marché FR
- L'architecture de l'offre doit être concrète et détaillée (pas générique)
- Les objections doivent être formulées comme des vraies questions que se pose le client, avec des réponses rassurantes`;

// ── Construire le prompt utilisateur ────────
function buildUserPrompt(answers) {
  const typeLabels = {
    coaching:  'Coaching (accompagnement individuel ou en groupe)',
    formation: 'Formation en ligne (cours vidéo, programme)',
    service:   'Prestation de service (freelance, consultant)',
    produit:   'Produit digital (template, outil, ressource)',
  };

  const typeLabel = typeLabels[answers[1]] || answers[1] || 'Non précisé';
  const channels  = Array.isArray(answers[7]) ? answers[7].join(', ') : (answers[7] || 'Non précisé');

  let q4before = 'Non précisé';
  let q4after  = 'Non précisé';
  if (answers[4] && typeof answers[4] === 'object') {
    q4before = answers[4].before || 'Non précisé';
    q4after  = answers[4].after  || 'Non précisé';
  } else if (typeof answers[4] === 'string') {
    q4before = answers[4];
    q4after  = answers[4];
  }

  const prix = answers[6] && answers[6] !== 'non précisé'
    ? answers[6]
    : 'non précisé — suggère un prix adapté au marché FR pour ce type d\'offre et cette cible';

  return `Crée une offre complète pour cet entrepreneur francophone.

TYPE DE PROJET : ${typeLabel}
CIBLE : ${answers[2] || 'Non précisé'}
PROBLÈME PRINCIPAL : ${answers[3] || 'Non précisé'}
TRANSFORMATION AVANT : ${q4before}
TRANSFORMATION APRÈS : ${q4after}
CONTENU DE L'OFFRE : ${answers[5] || 'Non précisé'}
BUDGET CLIENT : ${prix}
CANAUX D'ACQUISITION : ${channels}

Génère l'offre complète selon le format JSON spécifié. Sois spécifique, concret et adapté à la cible décrite.`;
}

// ── Handler Netlify ──────────────────────────
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Méthode uniquement POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Rate limiting
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown';
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Trop de requêtes — réessaie dans 1 heure.' })
    };
  }

  // Parser le body
  let answers;
  try {
    const body = JSON.parse(event.body || '{}');
    answers = body.answers;
    if (!answers) throw new Error('Pas de réponses');
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  // Validation basique des inputs
  const cleanAnswers = sanitizeAnswers(answers);

  // Clé API
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('[generate] CLAUDE_API_KEY manquante');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration serveur manquante' }) };
  }

  // Appel Claude
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(cleanAnswers) }],
    });

    const resultText = response.content[0]?.text || '';

    if (!resultText) {
      throw new Error('Réponse Claude vide');
    }

    // Vérification rapide que c'est du JSON valide
    try {
      JSON.parse(resultText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
    } catch {
      // Retry avec instruction explicite
      const retryResponse = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserPrompt(cleanAnswers) },
          { role: 'assistant', content: resultText },
          { role: 'user', content: 'Ta réponse précédente n\'était pas du JSON valide. Génère UNIQUEMENT le JSON brut, sans aucun texte ni backtick.' },
        ],
      });
      const retryText = retryResponse.content[0]?.text || '';
      return { statusCode: 200, headers, body: JSON.stringify({ result: retryText }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ result: resultText }) };

  } catch (err) {
    console.error('[generate] Erreur Claude API:', err.message);

    if (err.status === 429) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Service temporairement surchargé — réessaie dans quelques secondes.' }) };
    }
    if (err.status === 401) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur d\'authentification serveur.' }) };
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur lors de la génération — réessaie.' }) };
  }
};

// ── Sanitisation des inputs ──────────────────
function sanitizeAnswers(answers) {
  if (!answers || typeof answers !== 'object') return {};

  const clean = {};
  const maxLengths = { 1:50, 2:200, 3:300, 5:400, 6:100 };

  for (let i = 1; i <= 7; i++) {
    const val = answers[i];
    if (val === null || val === undefined) continue;

    if (i === 4 && typeof val === 'object') {
      clean[i] = {
        before: String(val.before || '').slice(0, 150),
        after:  String(val.after  || '').slice(0, 150),
      };
    } else if (i === 7 && Array.isArray(val)) {
      // Valeurs autorisées pour les canaux
      const allowedChannels = ['tiktok','instagram','linkedin','email','bouche_a_oreille','publicite','autre'];
      clean[i] = val.filter(c => allowedChannels.includes(c)).slice(0, 6);
    } else if (typeof val === 'string') {
      clean[i] = val.slice(0, maxLengths[i] || 500);
    } else {
      clean[i] = val;
    }
  }

  return clean;
}
