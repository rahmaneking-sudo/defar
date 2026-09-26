// POST /api/pay/webhook-wave : notifications Wave (signature HMAC vérifiée)
// À déclarer dans le portail Wave Business > Développeurs > Webhooks.
import { json } from '../_lib/http.js';
import { verifyWaveWebhook, forwardOrder } from '../_lib/payments.js';

export async function POST(request) {
  const raw = await request.text();
  const ok = verifyWaveWebhook(raw, request.headers.get('wave-signature'));
  if (!ok) return json({ error: 'invalid_signature' }, 401);
  let ev = {};
  try {
    ev = JSON.parse(raw);
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const d = ev.data || {};
  const paid = ev.type === 'checkout.session.completed' && d.payment_status === 'succeeded';
  await forwardOrder({
    provider: 'wave',
    event: ev.type,
    eventId: ev.id,
    status: paid ? 'paid' : ev.type === 'checkout.session.payment_failed' ? 'failed' : d.payment_status || 'unknown',
    amount: Number(d.amount) || null,
    currency: d.currency || 'XOF',
    reference: d.client_reference || null,
    sessionId: d.id || null,
    transactionId: d.transaction_id || null,
    at: new Date().toISOString(),
  });
  return json({ received: true });
}
