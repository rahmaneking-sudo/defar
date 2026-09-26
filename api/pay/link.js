// POST /api/pay/link  (réservé au commerçant : en-tête x-admin-key = ADMIN_PASSWORD)
// { amount, description, reference, days } -> { url, params }
import { json, readJson, safeEqual, originOf } from '../_lib/http.js';
import { signLink, cleanRef, merchantName } from '../_lib/payments.js';

export async function POST(request) {
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin) return json({ error: 'no_admin', message: 'Définis ADMIN_PASSWORD dans Vercel pour créer des liens signés.' }, 400);
  if (!safeEqual(request.headers.get('x-admin-key') || '', admin)) return json({ error: 'unauthorized', message: 'Mot de passe administrateur incorrect.' }, 401);
  let b;
  try {
    b = await readJson(request, 10_000);
  } catch (e) {
    return json({ error: 'bad_request', message: e.message }, 400);
  }
  const a = Math.round(Number(b.amount));
  if (!Number.isFinite(a) || a < 100 || a > 5_000_000) return json({ error: 'bad_amount', message: 'Montant entre 100 et 5 000 000 FCFA.' }, 400);
  const days = Math.min(90, Math.max(0, Number(b.days) || 0));
  const p = { a, d: String(b.description || '').slice(0, 120), m: String(b.merchant || merchantName()).slice(0, 40), r: cleanRef(b.reference), x: days ? String(Math.floor(Date.now() / 1000) + days * 86400) : '' };
  const s = signLink(p);
  const qs = new URLSearchParams(Object.entries({ ...p, s }).filter(([, v]) => v !== '' && v !== undefined));
  return json({ url: `${originOf(request)}/pay?${qs}`, params: { ...p, s } });
}
