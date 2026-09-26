// POST /api/pay/webhook-paydunya : IPN PayDunya (hash SHA-512 de la clé principale vérifié)
import { json } from '../_lib/http.js';
import { parseBracketForm, sha512, forwardOrder } from '../_lib/payments.js';

export async function POST(request) {
  const raw = await request.text();
  const type = request.headers.get('content-type') || '';
  let data = {};
  try {
    data = type.includes('json') ? JSON.parse(raw).data || JSON.parse(raw) : parseBracketForm(raw).data || {};
  } catch {
    return json({ error: 'bad_body' }, 400);
  }
  const master = process.env.PAYDUNYA_MASTER_KEY;
  if (!master || String(data.hash || '').toLowerCase() !== sha512(master)) return json({ error: 'invalid_hash' }, 401);
  const st = String(data.status || '').toLowerCase();
  await forwardOrder({
    provider: 'paydunya',
    event: 'invoice.' + st,
    status: st === 'completed' ? 'paid' : st === 'cancelled' || st === 'failed' ? 'failed' : 'pending',
    amount: Number(data.invoice?.total_amount) || null,
    currency: 'XOF',
    reference: data.custom_data?.reference || null,
    token: data.invoice?.token || null,
    customer: data.customer ? { name: data.customer.name, phone: data.customer.phone } : null,
    receipt: data.receipt_url || null,
    at: new Date().toISOString(),
  });
  return json({ received: true });
}
