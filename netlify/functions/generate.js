/* Netlify Function — generate.js — Haiku + timeout 9s */

const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  if (!rateLimitMap.has(key)) { rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW }); return true; }
  const entry = rateLimitMap.get(key);
  if (now > entry.resetAt) { rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW }); return true; }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `Tu es un expert en création d'offres et en copywriting pour le marché francophone.

RÈGLE ABSOLUE : Réponds UNIQUEMENT avec un objet JSON valide. Pas de texte avant ou après. Pas de markdown.

Structure JSON :
{
  "titres": ["titre1", "titre2", "titre3"],
  "promesse": "string",
  "architecture_offre": "string",
  "prix": { "montant": "string", "justification": "string" },
  "page_de_vente": { "headline": "string", "probleme": "string", "solution": "string", "offre": "string", "objections": "string", "cta": "string" },
  "page_capture": { "headline": "string", "benefices": "string", "lead_magnet": "string" },
  "emails": [
    { "numero": 1, "objet": "string", "corps": "string" },
    { "numero": 2, "objet": "string", "corps": "string" },
    { "numero": 3, "objet": "string", "corps": "string" }
  ]
}

Règles : Français naturel. Titres 15-25 mots. Promesse avant/après en 1 phrase. Page de vente 400-600 mots. Emails 100-150 mots chacun. Ton humain. Pas de jargon anglais.`;

function buildPrompt(answers) {
  const types = { coaching:'Coaching', formation:'Formation en ligne', service:'Prestation de service', produit:'Produit digital' };
  const channels = Array.isArray(answers[7]) ? answers[7].join(', ') : (answers[7] || 'Non précisé');
  const q4b = (answers[4] && answers[4].before) ? answers[4].before : 'Non précisé';
  const q4a = (answers[4] && answers[4].after) ? answers[4].after : 'Non précisé';
  const prix = (answers[6] && answers[6] !== 'non précisé') ? answers[6] : 'suggère un prix adapté au marché FR';
  return `Crée une offre pour cet entrepreneur francophone.
TYPE : ${types[answers[1]] || answers[1] || 'Non précisé'}
CIBLE : ${answers[2] || 'Non précisé'}
PROBLÈME : ${answers[3] || 'Non précisé'}
AVANT : ${q4b}
APRÈS : ${q4a}
CONTENU : ${answers[5] || 'Non précisé'}
PRIX : ${prix}
CANAUX : ${channels}
Génère le JSON complet.`;
}

function sanitize(answers) {
  if (!answers || typeof answers !== 'object') return {};
  const clean = {};
  const max = { 1:50, 2:200, 3:300, 5:400, 6:100 };
  for (let i = 1; i <= 7; i++) {
    const v = answers[i];
    if (v == null) continue;
    if (i === 4 && typeof v === 'object') { clean[i] = { before: String(v.before||'').slice(0,150), after: String(v.after||'').slice(0,150) }; }
    else if (i === 7 && Array.isArray(v)) { clean[i] = v.filter(c => ['tiktok','instagram','linkedin','email','bouche_a_oreille','publicite','autre'].includes(c)).slice(0,6); }
    else if (typeof v === 'string') { clean[i] = v.slice(0, max[i]||500); }
    else { clean[i] = v; }
  }
  return clean;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const ip = (event.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Trop de requêtes.' }) };

  let answers;
  try {
    const b = JSON.parse(event.body || '{}');
    answers = b.answers;
    if (!answers) throw new Error();
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Requête invalide' }) };
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration manquante' }) };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(sanitize(answers)) }],
      }),
    });

    clearTimeout(tid);

    if (!res.ok) {
      if (res.status === 429) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Service surchargé — réessaie.' }) };
      if (res.status === 401) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Clé API invalide.' }) };
      throw new Error('API ' + res.status);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    if (!text) throw new Error('Réponse vide');
    return { statusCode: 200, headers, body: JSON.stringify({ result: text }) };

  } catch (err) {
    clearTimeout(tid);
    const msg = err.name === 'AbortError' ? 'Génération trop longue — réessaie.' : 'Erreur lors de la génération — réessaie.';
    return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) };
  }
};
