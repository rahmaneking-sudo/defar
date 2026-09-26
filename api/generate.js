// POST /api/generate
// { idea } -> crée une maquette   |   { mode:'edit', spec, instruction } -> modifie une maquette
// Toujours une réponse exploitable : si l'IA échoue, un modèle local prend le relais.
import { json, readJson, checkAccess, clientIp, rateLimit, corsHeaders, preflight } from './_lib/http.js';
import { generateJson, availableProviders } from './_lib/llm.js';
import { pexelsResolver } from './_lib/pexels.js';
import { SYSTEM_PROMPT, buildUserMessage, compactForEdit } from '../shared/prompt.js';
import { normalizeSpec } from '../shared/normalize.js';
import { resolveSpecMedia } from '../shared/media.js';
import { generateLocal } from '../shared/generator/index.js';
import { cloudOn, bearer, getCredits, spendCredits } from './_lib/supabase.js';
import { COSTS } from '../shared/plans.js';

export function OPTIONS(request) {
  return preflight(request);
}

const looksComplete = (o) => o && typeof o === 'object' && Array.isArray(o.screens || o.app?.screens) && (o.screens || o.app.screens).length >= 2;

export async function POST(request) {
  const cors = corsHeaders(request);
  // Avec les comptes (Supabase) : connexion + crédits. Sinon : code d'accès facultatif.
  const cloud = cloudOn();
  const token = cloud ? bearer(request) : '';
  if (!cloud && !checkAccess(request)) return json({ error: 'access_code_required', message: 'Code d\'accès requis' }, 401, cors);
  if (!rateLimit('gen:' + clientIp(request))) return json({ error: 'rate_limited', message: 'Trop de générations, réessaie dans une heure.' }, 429, cors);

  let body;
  try {
    body = await readJson(request);
  } catch (e) {
    return json({ error: 'bad_request', message: e.message }, e.status || 400, cors);
  }
  const mode = body.mode === 'edit' ? 'edit' : 'create';
  const idea = String(body.idea || '').slice(0, 2000).trim();
  const instruction = String(body.instruction || '').slice(0, 1000).trim();
  if (mode === 'create' && idea.length < 3) return json({ error: 'bad_request', message: 'Décris ton idée en quelques mots.' }, 400, cors);
  if (mode === 'edit' && (!body.spec || !instruction)) return json({ error: 'bad_request', message: 'Instruction manquante.' }, 400, cors);

  // Crédits : vérifiés avant l'IA, dépensés seulement si l'IA a réussi
  const cost = mode === 'edit' ? COSTS.edit : COSTS.create;
  let credits = null;
  if (cloud) {
    if (!token) return json({ error: 'login_required', message: 'Connecte-toi pour utiliser l\'IA.' }, 401, cors);
    const c = await getCredits(token);
    if (!c.auth) return json({ error: 'login_required', message: 'Ta session a expiré. Reconnecte-toi.' }, 401, cors);
    if (c.error) return json({ error: 'cloud_unavailable', message: 'Service momentanément indisponible, réessaie.' }, 503, cors);
    credits = c.credits;
    if (credits < cost) return json({ error: 'credits', message: `Il te faut ${cost} crédit${cost > 1 ? 's' : ''} pour cette action.`, credits, cost }, 402, cors);
  }

  const user = buildUserMessage({ mode, idea, instruction, spec: mode === 'edit' ? compactForEdit(body.spec) : undefined });
  const result = availableProviders().length ? await generateJson({ system: SYSTEM_PROMPT, user, validate: looksComplete }) : { error: 'Aucune clé d\'IA configurée' };

  if (result.data) {
    const { spec: draft, warnings } = normalizeSpec(result.data, { resolveMedia: false, fallbackName: body.spec?.meta?.name });
    let resolver = null;
    try {
      resolver = await pexelsResolver(draft);
    } catch {
      resolver = null;
    }
    resolveSpecMedia(draft, { resolver });
    if (cloud) {
      const spent = await spendCredits(token, cost, mode === 'edit' ? 'Modification avec l\'IA' : 'Création avec l\'IA');
      if (!spent.ok) {
        const lack = /CREDITS_INSUFFISANTS/.test(spent.error || '');
        return json({ error: lack ? 'credits' : 'cloud_unavailable', message: lack ? 'Tu n\'as plus assez de crédits.' : 'Service momentanément indisponible, réessaie.', credits: lack ? 0 : credits, cost }, lack ? 402 : 503, cors);
      }
      credits = spent.credits;
    }
    return json({ spec: draft, provider: result.provider, model: result.model, ms: result.ms, warnings: warnings.slice(0, 10), credits, cost: cloud ? cost : 0 }, 200, cors);
  }

  // ── Secours ──
  if (mode === 'edit') return json({ error: 'ai_unavailable', message: 'L\'IA n\'a pas pu appliquer la modification. Ta maquette est intacte, réessaie.', details: result.errors?.slice(0, 3) }, 503, cors);
  const { spec } = normalizeSpec(generateLocal(idea));
  return json({ spec, provider: 'template', fallback: true, credits, cost: 0, warning: result.error === 'Aucune clé d\'IA configurée' ? 'Mode démo : ajoute une clé d\'IA pour des maquettes sur mesure.' : 'IA momentanément indisponible : maquette créée à partir d\'un modèle.', details: result.errors?.slice(0, 3) }, 200, cors);
}
