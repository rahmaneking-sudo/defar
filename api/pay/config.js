// GET /api/pay/config : moyens de paiement actifs (aucun secret).
// Avec les paramètres d'un lien (?a=&d=&m=&r=&x=&s=), indique aussi si le lien est valide.
import { json, corsHeaders, preflight } from '../_lib/http.js';
import { paymentConfig, verifyLink, cleanRef } from '../_lib/payments.js';

export function OPTIONS(request) {
  return preflight(request);
}
export function GET(request) {
  const cfg = paymentConfig();
  const q = new URL(request.url).searchParams;
  if (q.has('a')) {
    const link = { a: Math.round(Number(q.get('a'))), d: String(q.get('d') || '').slice(0, 120), m: String(q.get('m') || '').slice(0, 40), r: cleanRef(q.get('r')), x: q.get('x') || '', s: q.get('s') || '' };
    const v = verifyLink(link);
    cfg.link = { ok: v.ok, signed: !!v.signed, reason: v.reason || null };
  }
  return json(cfg, 200, corsHeaders(request));
}
