// POST /api/pay/create
// Body : { a, d, m, r, x, s  (paramètres du lien de paiement), method, phone, name }
// -> { provider, url, id, reference }   (url = page Wave / PayDunya / simulateur)
import { json, readJson, corsHeaders, preflight, originOf, clientIp, rateLimit } from '../_lib/http.js';
import { routeFor, verifyLink, waveCreate, paydunyaCreate, newReference, cleanRef, merchantName } from '../_lib/payments.js';

export function OPTIONS(request) {
  return preflight(request);
}

const METHODS = ['wave', 'orange_money', 'free_money', 'card'];

export async function POST(request) {
  const cors = corsHeaders(request);
  if (!rateLimit('pay:' + clientIp(request), 60)) return json({ error: 'rate_limited', message: 'Trop de tentatives, réessaie plus tard.' }, 429, cors);
  let b;
  try {
    b = await readJson(request, 20_000);
  } catch (e) {
    return json({ error: 'bad_request', message: e.message }, e.status || 400, cors);
  }
  const amount = Math.round(Number(b.a));
  if (!Number.isFinite(amount) || amount < 100 || amount > 5_000_000) return json({ error: 'bad_amount', message: 'Montant invalide (entre 100 et 5 000 000 FCFA).' }, 400, cors);
  const method = METHODS.includes(b.method) ? b.method : 'wave';
  // demo = parcours de démonstration (landing) : toujours simulé, jamais d'argent réel
  const demo = b.demo === true || b.demo === 1 || b.demo === '1';
  const route = demo ? 'sim' : routeFor(method);
  const link = { a: amount, d: String(b.d || '').slice(0, 120), m: String(b.m || '').slice(0, 40), r: cleanRef(b.r), x: b.x ? String(b.x) : '', s: b.s };
  const v = verifyLink(link);
  if (route !== 'sim' && !v.ok) return json({ error: 'bad_link', message: v.reason || 'Lien de paiement invalide.' }, 403, cors);

  const reference = link.r ? `${link.r}-${newReference('').slice(1, 6)}` : newReference();
  const origin = originOf(request);
  const digits = String(b.phone || '').replace(/\D/g, '').slice(-9);
  try {
    if (route === 'wave') {
      const r = await waveCreate({ amount, reference, origin });
      return json({ ...r, reference }, 200, cors);
    }
    if (route === 'paydunya') {
      const r = await paydunyaCreate({ amount, description: link.d || `Paiement ${link.m || merchantName()}`, reference, method, customer: { name: String(b.name || '').slice(0, 60), phone: digits }, origin });
      return json({ ...r, reference }, 200, cors);
    }
    // Simulation : aucune clé configurée -> faux opérateur pour tester le parcours
    const id = 'sim_' + reference;
    const q = new URLSearchParams({ id, a: String(amount), m: link.m || merchantName(), d: link.d, method, ref: reference, phone: digits });
    return json({ provider: 'sim', id, url: `${origin}/pay/simulateur?${q}`, reference, simulated: true }, 200, cors);
  } catch (e) {
    return json({ error: 'provider_error', message: `Le paiement n'a pas pu être initié : ${e.message}` }, 502, cors);
  }
}
