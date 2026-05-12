/* ═══════════════════════════════════════════════════════
   generate.js — OffreOS
   - MOCK_MODE=true : réponse simulée, 0 appel Claude
   - MOCK_MODE=false : appel Claude Haiku réel
   - Prompt sobre et crédible, sans marketing agressif
   - Tutoiement imposé dans tous les outputs
   - Promesses de résultats commerciaux interdites
═══════════════════════════════════════════════════════ */

// ── Rate limiting ─────────────────────────────────────
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  const LIMIT = 20;
  const WINDOW = 60 * 60 * 1000;
  if (!rateLimitMap.has(key)) { rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW }); return true; }
  const e = rateLimitMap.get(key);
  if (now > e.resetAt) { rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW }); return true; }
  if (e.count >= LIMIT) return false;
  e.count++;
  return true;
}

// ── Mock JSON — en tutoiement ─────────────────────────
const MOCK_RESULT = {
  titres: [
    "Structure ton activité de conseil et présente ton service avec clarté",
    "Un accompagnement pour clarifier ton offre et améliorer ta prospection",
    "Passe d'une idée floue à une première version de service testable"
  ],
  promesse: "Je t'aide à structurer ton activité de conseil pour pouvoir la présenter clairement et commencer à prospecter avec un message cohérent.",
  architecture_offre: "Accompagnement individuel sur 4 semaines.\n\n• 4 séances de travail en visio de 60 min\n• Accès à un espace de partage de documents entre les séances\n• Un compte-rendu écrit après chaque séance\n• Un document de synthèse final avec ton offre structurée et ton message de prospection",
  prix: {
    montant: "800€",
    justification: "Tarif cohérent avec le niveau d'accompagnement individuel et le temps passé. À ajuster selon ta valeur perçue, ton expérience et le marché visé."
  },
  page_de_vente: {
    headline: "Tu as une expertise, mais tu ne sais pas encore comment la présenter ?",
    probleme: "Tu as des compétences réelles. Tu sais ce que tu peux apporter à tes clients. Mais quand vient le moment de l'expliquer, les mots manquent, ou tu as l'impression de ne pas être assez différencié. Prospecter dans ces conditions est difficile.",
    solution: "En 4 semaines de travail ensemble, on clarifie ce que tu proposes exactement, à qui, et pourquoi c'est pertinent pour eux. Tu repars avec une offre structurée et un message de prospection que tu peux tester immédiatement.",
    offre: "Ce que comprend l'accompagnement :\n• 4 séances individuelles en visio de 60 min\n• Un espace de partage pour travailler entre les séances\n• Un compte-rendu écrit après chaque session\n• Un document de synthèse final : offre structurée + message de prospection",
    objections: "Est-ce adapté à ma situation ?\nCet accompagnement convient aux consultants, coachs et prestataires qui ont une activité en cours ou en démarrage et qui veulent clarifier leur positionnement. Un appel préalable permet de vérifier que c'est le bon moment.\n\nQu'est-ce que j'aurai concrètement à la fin ?\nUn document de synthèse avec ton offre structurée et ton message de prospection, que tu peux utiliser directement.\n\nEst-ce que ça garantit des résultats ?\nL'accompagnement ne garantit pas un résultat commercial. Il aide à clarifier les actions prioritaires et à éviter de rester seul face aux blocages.",
    cta: "Pour en savoir plus ou réserver un premier appel de 30 minutes, contacte-moi via le formulaire ci-dessous."
  },
  page_capture: {
    headline: "Télécharge le guide : structurer ton offre de conseil en partant de zéro",
    benefices: "• Les questions à te poser avant de prospecter\n• Comment formuler ta valeur ajoutée simplement\n• Un exemple de message de prospection sobre et efficace",
    lead_magnet: "Guide PDF — 8 pages — Structurer ton offre de conseil : méthode et exemples. Ressource gratuite à consulter et à adapter à ton contexte."
  },
  emails: [
    {
      numero: 1,
      objet: "Ton guide est disponible — et une question pour commencer",
      corps: "Salut,\n\nMerci d'avoir téléchargé le guide. J'espère qu'il te sera utile.\n\nAvant d'aller plus loin, une question directe : quelle est la partie qui te pose le plus de problème en ce moment — formuler ton offre, identifier ta cible, ou trouver comment te différencier ?\n\nTa réponse m'aide à adapter ce que je partage avec toi.\n\nÀ bientôt,"
    },
    {
      numero: 2,
      objet: "La question que je pose à tous mes clients au début",
      corps: "Salut,\n\nLa plupart des personnes que j'accompagne ont le même réflexe au départ : elles décrivent ce qu'elles font plutôt que ce que ça apporte.\n\n\"Je suis coach en gestion du temps\" plutôt que \"J'accompagne des managers qui n'arrivent plus à prioriser\".\n\nLa différence paraît petite, mais elle change complètement la manière dont tes prospects te perçoivent.\n\nDans le guide, je détaille comment reformuler ça. Si tu as des questions sur ton cas précis, réponds à cet email.\n\nÀ bientôt,"
    },
    {
      numero: 3,
      objet: "Si tu veux aller plus loin",
      corps: "Salut,\n\nDepuis quelques jours, je te partage des éléments pour clarifier ton offre.\n\nSi tu souhaites travailler ce sujet de manière plus structurée, je propose un accompagnement individuel de 4 semaines. L'objectif : repartir avec une offre claire et un message de prospection que tu peux tester immédiatement.\n\nSi ça t'intéresse, je te propose un premier appel de 30 minutes pour faire le point sur ta situation avant de décider.\n\nÀ bientôt,"
    }
  ]
};

// ── Prompt système — sobre, crédible, tutoiement, sans promesses de résultats ──
const SYSTEM_PROMPT = `Tu es un consultant en positionnement et en copywriting pour le marché francophone. Tu aides des entrepreneurs, consultants, coachs et prestataires de service à structurer leur offre et leur message.

RÈGLE DE FORMAT ABSOLUE : Réponds uniquement avec un objet JSON valide. Aucun texte avant ou après. Aucun markdown. JSON brut uniquement.

Structure JSON obligatoire :
{"titres":["t1","t2","t3"],"promesse":"string","architecture_offre":"string","prix":{"montant":"string","justification":"string"},"page_de_vente":{"headline":"string","probleme":"string","solution":"string","offre":"string","objections":"string","cta":"string"},"page_capture":{"headline":"string","benefices":"string","lead_magnet":"string"},"emails":[{"numero":1,"objet":"string","corps":"string"},{"numero":2,"objet":"string","corps":"string"},{"numero":3,"objet":"string","corps":"string"}]}

RÈGLE DE TUTOIEMENT ABSOLUE :
- Tous les contenus générés s'adressent à l'entrepreneur en le tutoyant.
- Utiliser systématiquement : "tu", "ton", "ta", "tes", "toi".
- Ne jamais utiliser "vous", "votre", "vos" pour s'adresser à l'entrepreneur.
- Exception unique : dans la page de vente ou les emails, quand l'entrepreneur s'adresse à ses propres clients, le ton peut être au vouvoiement ou tutoiement selon ce qui est naturel pour sa niche. Mais l'entrepreneur lui-même est toujours tutoyé.
- Garder un ton professionnel, sobre et crédible malgré le tutoiement.

RÈGLES DE CONTENU — à respecter impérativement :

TON ET STYLE :
- Français professionnel, direct, sobre. Pas de superlatifs inutiles.
- Éviter le registre "formateur business agressif" ou "gourou du marketing".
- Préférer : "clarifier", "structurer", "présenter avec clarté", "améliorer", "construire une base", "mettre en place une méthode", "mieux présenter ton service", "préparer tes premiers messages".
- Éviter : "changer ta vie", "devenir libre", "revenus automatiques", "méthode infaillible", "les agences cachent ça".

INTERDICTIONS ABSOLUES SUR LES PROMESSES DE RÉSULTATS :
Ces formulations sont strictement interdites dans tous les champs du JSON.

Ne jamais promettre des clients obtenus :
- Interdit : "tes premiers clients", "décrocher des clients", "avoir des clients en X jours", "1-2 clients avant la fin de", "remplir ton agenda".
- Autorisé : "mettre en place une méthode de prospection", "préparer tes premiers messages", "construire une base de prospection".

Ne jamais promettre des revenus :
- Interdit : "tes premiers revenus", "revenus concrets", "revenus réguliers", "X€ par mois", "des revenus dès".
- Autorisé : "clarifier ton positionnement", "avoir une offre plus claire à tester".

Ne jamais promettre un retour sur investissement :
- Interdit : "un seul client rembourse", "ça se rentabilise", "l'investissement devient positif", "ce coût se rembourse".
- Autorisé : "Tarif cohérent avec le niveau d'accompagnement et le temps passé."

Ne jamais promettre un délai de résultat :
- Interdit : "en 30 jours", "en 3 mois tu auras", "d'ici la fin du programme", "avant la fin de l'accompagnement tu obtiendras".
- Autorisé : "sortir avec un plan d'action concret", "identifier les actions prioritaires".

Ne jamais promettre un volume de prospects ou de rendez-vous :
- Interdit : "5 prospects par semaine", "2 rendez-vous par mois", "X contacts qualifiés".
- Autorisé : "augmenter tes chances d'obtenir des retours".

Ne jamais garantir l'efficacité :
- Interdit : "ça marche si tu appliques", "les résultats seront au rendez-vous", "tu auras des clients si tu suis le plan", "résultats garantis".
- Autorisé : "éviter de rester seul face aux blocages", "mieux présenter ton service".

RÈGLES SPÉCIFIQUES PAR SECTION :

PRIX — justification :
- Ne jamais écrire que l'accompagnement "se rembourse avec un client" ou que "l'investissement devient positif".
- Écrire uniquement : "Tarif cohérent avec le niveau d'accompagnement et le temps passé. À ajuster selon ta valeur perçue, ton expérience et le marché visé."

OBJECTIONS — réponses :
- Ne jamais écrire "ça marche si tu appliques" ou toute formulation garantissant un résultat.
- Inclure systématiquement : "L'accompagnement ne garantit pas un résultat commercial. Il aide à clarifier les actions prioritaires et à éviter de rester seul face aux blocages."

PAGE DE CAPTURE — lead_magnet et benefices :
- Ne jamais écrire qu'un email automatique sera envoyé ("on t'envoie des emails", "tu recevras une série de conseils", "emails pendant 1-2 semaines").
- Décrire uniquement la ressource téléchargeable : "Ressource gratuite à consulter immédiatement", "Guide à utiliser comme base de travail", "Exemple de plan d'action à adapter à ton contexte".

URGENCE ET RARETÉ :
- Ne jamais inventer d'urgence artificielle ("demain les portes se ferment", "plus que 3 places").
- Ne jamais inventer de garantie de remboursement si l'utilisateur ne l'a pas mentionnée.
- Ne jamais créer de fausse rareté.

EMAILS :
- Ton conversationnel, professionnel, en tutoiement. Pas de fausse deadline.
- Email 1 : accueil + question ouverte.
- Email 2 : valeur concrète, conseil ou méthode utile.
- Email 3 : présentation sobre de l'offre, invitation à un échange, sans promesse de résultat commercial.

PAGE DE VENTE :
- Persuasive mais honnête. Décrire le problème réellement, sans dramatisation excessive.
- Les objections doivent être réelles et les réponses factuelles, sans garantie de résultat.
- Le CTA doit inviter à un premier contact ou à un appel, pas à acheter impulsivement.

ADAPTATION :
- Adapter le registre au type de projet (coaching, formation, service, produit).
- Adapter le niveau de promesse à ce que l'utilisateur a fourni.
- Ne pas compléter agressivement ce qui manque — rester sobre si les informations sont limitées.`;

// ── Prompt utilisateur ────────────────────────────────
function buildPrompt(a) {
  const types = {
    coaching:  'Coaching individuel ou collectif',
    formation: 'Formation en ligne ou programme',
    service:   'Prestation de service ou consulting',
    produit:   'Produit digital (template, outil, ressource)'
  };
  const ch = Array.isArray(a[7]) ? a[7].join(', ') : (a[7] || 'non précisé');
  const b  = (a[4] && a[4].before) ? a[4].before : 'non précisé';
  const af = (a[4] && a[4].after)  ? a[4].after  : 'non précisé';
  const px = (a[6] && a[6].length > 2 && a[6] !== 'non précisé')
    ? a[6]
    : 'non fourni — proposer une fourchette réaliste pour ce type d\'offre sur le marché FR, sans être agressif';

  return `Crée une offre structurée pour cet entrepreneur francophone.

TYPE DE PROJET : ${types[a[1]] || a[1] || 'non précisé'}
CIBLE : ${a[2] || 'non précisée'}
PROBLÈME PRINCIPAL DE LA CIBLE : ${a[3] || 'non précisé'}
SITUATION AVANT L'ACCOMPAGNEMENT : ${b}
SITUATION APRÈS L'ACCOMPAGNEMENT : ${af}
CONTENU DE L'OFFRE : ${a[5] || 'non précisé'}
BUDGET CLIENT : ${px}
CANAUX D'ACQUISITION : ${ch}

Instructions :
- Tutoie l'entrepreneur dans tous les contenus générés.
- Reste sobre et crédible.
- Ne promets aucun client obtenu, aucun revenu, aucun retour sur investissement, aucun délai de résultat commercial.
- Ne mentionne pas d'envoi automatique d'emails si ce n'est pas explicitement fourni.
- Si des informations manquent, complète de façon raisonnable sans exagérer.
- Génère le JSON complet.`;
}

// ── Sanitisation ──────────────────────────────────────
function sanitize(answers) {
  if (!answers || typeof answers !== 'object') return {};
  const clean = {};
  const max = { 1:50, 2:150, 3:200, 5:300, 6:80 };
  for (let i = 1; i <= 7; i++) {
    const v = answers[i];
    if (v == null) continue;
    if (i === 4 && typeof v === 'object') {
      clean[i] = { before: String(v.before||'').slice(0,120), after: String(v.after||'').slice(0,120) };
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

// ── Parsing robuste ───────────────────────────────────
function cleanAndParse(text) {
  if (!text) return null;
  let t = text.trim()
    .replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
    .replace(/^```\s*/i, '').replace(/\s*```$/i, '')
    .trim();
  const start = t.indexOf('{');
  const end   = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  t = t.slice(start, end + 1);
  try { return JSON.parse(t); } catch (e) {
    console.error('[Parsing] Echec JSON.parse:', e.message, '| Texte reçu (200 car.):', t.slice(0, 200));
    return null;
  }
}

// ── Handler Netlify ───────────────────────────────────
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
  if (!checkRateLimit(ip)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Trop de requêtes — réessaie dans 1 heure.' }) };

  let answers;
  try {
    const b = JSON.parse(event.body || '{}');
    answers = b.answers;
    if (!answers) throw new Error();
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Requête invalide.' }) };
  }

  // ══ MODE MOCK ══
  if (process.env.MOCK_MODE === 'true') {
    console.log('[MOCK] Réponse simulée — aucun appel Claude.');
    return { statusCode: 200, headers, body: JSON.stringify({ result: JSON.stringify(MOCK_RESULT), mock: true }) };
  }

  // ══ MODE RÉEL ══
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Clé API Claude manquante dans les variables Netlify.' }) };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 25000);

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
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(sanitize(answers)) }],
      }),
    });

    clearTimeout(tid);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Claude API error:', res.status, errText.slice(0, 200));
      if (res.status === 429) return { statusCode: 429, headers, body: JSON.stringify({ error: 'API surchargée — réessaie dans quelques secondes.' }) };
      if (res.status === 401) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Clé API invalide — vérifie dans Netlify > Environment variables.' }) };
      throw new Error('API ' + res.status);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    if (!text) throw new Error('Réponse Claude vide.');

    const parsed = cleanAndParse(text);
    if (!parsed) throw new Error('JSON invalide reçu de Claude.');

    return { statusCode: 200, headers, body: JSON.stringify({ result: JSON.stringify(parsed) }) };

  } catch (err) {
    clearTimeout(tid);
    console.error('[generate] Erreur:', err.message);
    const msg = err.name === 'AbortError'
      ? 'La génération a pris trop de temps — réessaie.'
      : 'Erreur lors de la génération — réessaie.';
    return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) };
  }
};
