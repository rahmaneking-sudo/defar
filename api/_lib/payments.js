// ─────────────────────────────────────────────────────────────────────────────
// PAIEMENTS : Wave (API Checkout directe) + PayDunya (Orange Money, Mixx by Yas,
// Wave, carte) + mode simulation quand aucune clé n'est configurée.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'node:crypto';

const WAVE_API = 'https://api.wave.com/v1';
const pdBase = () => (String(process.env.PAYDUNYA_MODE || 'test').toLowerCase() === 'live' ? 'https://app.paydunya.com/api/v1' : 'https://app.paydunya.com/sandbox-api/v1');

export const hasWave = () => !!process.env.WAVE_API_KEY;
export const hasPayDunya = () => !!(process.env.PAYDUNYA_MASTER_KEY && process.env.PAYDUNYA_PRIVATE_KEY && process.env.PAYDUNYA_TOKEN);
export const merchantName = () => (process.env.MERCHANT_NAME || 'Défar').slice(0, 40);
const linkSecret = () => process.env.PAY_LINK_SECRET || (process.env.ADMIN_PASSWORD ? crypto.createHash('sha256').update('defar-links:' + process.env.ADMIN_PASSWORD).digest('hex') : '');

const PD_CHANNEL = { wave: 'wave-senegal', orange_money: 'orange-money-senegal', free_money: 'free-money-senegal', card: 'card' };

export function routeFor(method) {
  if (method === 'wave' && hasWave()) return 'wave';
  if (PD_CHANNEL[method] && hasPayDunya()) return 'paydunya';
  return 'sim';
}

export function paymentConfig() {
  const methods = {};
  for (const m of ['wave', 'orange_money', 'free_money', 'card']) methods[m] = routeFor(m);
  const pdLive = hasPayDunya() && String(process.env.PAYDUNYA_MODE || 'test').toLowerCase() === 'live';
  return {
    mode: !hasWave() && !hasPayDunya() ? 'simulation' : hasWave() || pdLive ? 'live' : 'test',
    wave: hasWave(),
    paydunya: hasPayDunya(),
    paydunyaMode: hasPayDunya() ? String(process.env.PAYDUNYA_MODE || 'test').toLowerCase() : null,
    methods,
    signedLinks: !!linkSecret(),
    admin: !!process.env.ADMIN_PASSWORD,
    webhook: !!process.env.ORDER_WEBHOOK_URL,
    merchant: merchantName(),
  };
}

// ───────── Liens de paiement signés ─────────
export function linkPayload({ a, d = '', m = '', r = '', x = '' }) {
  return [Math.round(Number(a) || 0), String(d), String(m), String(r), String(x)].join('|');
}
export function signLink(p) {
  const sec = linkSecret();
  if (!sec) return '';
  return crypto.createHmac('sha256', sec).update(linkPayload(p)).digest('base64url').slice(0, 22);
}
export function verifyLink(p) {
  const sec = linkSecret();
  if (!sec) return { ok: true, signed: false };
  if (!p.s) return { ok: false, reason: 'Lien non signé' };
  const expected = signLink(p);
  const a = Buffer.from(String(p.s));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'Signature invalide' };
  if (p.x && Number(p.x) * 1000 < Date.now()) return { ok: false, reason: 'Lien expiré' };
  return { ok: true, signed: true };
}

export function newReference(prefix = 'DFR') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}
export const cleanRef = (r) => String(r || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);

// ───────── Wave ─────────
function waveHeaders(body) {
  const h = { authorization: `Bearer ${process.env.WAVE_API_KEY}`, 'content-type': 'application/json' };
  if (process.env.WAVE_SIGNING_SECRET && body !== undefined) {
    const t = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac('sha256', process.env.WAVE_SIGNING_SECRET).update(String(t) + body).digest('hex');
    h['wave-signature'] = `t=${t},v1=${sig}`;
  }
  return h;
}

export async function waveCreate({ amount, reference, origin }) {
  const body = JSON.stringify({
    amount: String(Math.round(amount)),
    currency: 'XOF',
    success_url: `${origin}/pay/retour?p=wave&ref=${encodeURIComponent(reference)}`,
    error_url: `${origin}/pay/retour?p=wave&ref=${encodeURIComponent(reference)}&err=1`,
    client_reference: reference,
  });
  const res = await fetch(`${WAVE_API}/checkout/sessions`, { method: 'POST', headers: waveHeaders(body), body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.wave_launch_url) throw new Error(data?.message || data?.code || `Wave ${res.status}`);
  return { provider: 'wave', id: data.id, url: data.wave_launch_url, expires: data.when_expires };
}

const waveStatus = (s) => (s?.payment_status === 'succeeded' ? 'paid' : s?.checkout_status === 'expired' ? 'expired' : s?.payment_status === 'cancelled' ? 'failed' : 'pending');

export async function waveGet({ id, reference }) {
  let session = null;
  if (id) {
    const res = await fetch(`${WAVE_API}/checkout/sessions/${encodeURIComponent(id)}`, { headers: waveHeaders() });
    if (res.ok) session = await res.json();
  }
  if (!session && reference) {
    const res = await fetch(`${WAVE_API}/checkout/sessions/search?client_reference=${encodeURIComponent(reference)}`, { headers: waveHeaders() });
    if (res.ok) {
      const data = await res.json();
      const list = data.result || [];
      session = list.find((s) => s.payment_status === 'succeeded') || list[list.length - 1] || null;
    }
  }
  if (!session) return { status: 'unknown' };
  return { status: waveStatus(session), amount: Number(session.amount), currency: session.currency, reference: session.client_reference, id: session.id, transaction: session.transaction_id, error: session.last_payment_error?.message };
}

export function verifyWaveWebhook(rawBody, header) {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = String(header).split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 60 * 60 * 24 * 3) return false; // Wave relance jusqu'à 3 jours
  const expected = crypto.createHmac('sha256', secret).update(t + rawBody).digest('hex');
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

// ───────── PayDunya ─────────
const pdHeaders = () => ({
  'content-type': 'application/json',
  'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
  'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
  'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN,
});

export async function paydunyaCreate({ amount, description, reference, method, customer, origin }) {
  const invoice = { total_amount: Math.round(amount), description: description || `Paiement ${merchantName()}` };
  if (PD_CHANNEL[method]) invoice.channels = [PD_CHANNEL[method]];
  if (customer?.name || customer?.phone) invoice.customer = { name: customer.name || '', phone: customer.phone || '', email: customer.email || '' };
  const body = {
    invoice,
    store: { name: merchantName(), website_url: origin },
    actions: { cancel_url: `${origin}/pay/retour?cancel=1`, return_url: `${origin}/pay/retour`, callback_url: `${origin}/api/pay/webhook-paydunya` },
    custom_data: { reference },
  };
  const res = await fetch(`${pdBase()}/checkout-invoice/create`, { method: 'POST', headers: pdHeaders(), body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (data.response_code !== '00' || !data.token) throw new Error(data.response_text || data.description || `PayDunya ${res.status}`);
  return { provider: 'paydunya', id: data.token, url: data.response_text };
}

export async function paydunyaGet({ token }) {
  const res = await fetch(`${pdBase()}/checkout-invoice/confirm/${encodeURIComponent(token)}`, { headers: pdHeaders() });
  const data = await res.json().catch(() => ({}));
  const st = String(data.status || '').toLowerCase();
  return {
    status: st === 'completed' ? 'paid' : st === 'cancelled' || st === 'failed' ? 'failed' : st === 'pending' ? 'pending' : 'unknown',
    amount: Number(data.invoice?.total_amount) || undefined,
    currency: 'XOF',
    reference: data.custom_data?.reference,
    id: token,
    receipt: data.receipt_url,
    error: data.fail_reason,
  };
}

export function sha512(s) {
  return crypto.createHash('sha512').update(String(s)).digest('hex');
}

// Décode "data[invoice][token]=x&data[status]=completed" en objet imbriqué
export function parseBracketForm(text) {
  const out = {};
  for (const [k, v] of new URLSearchParams(text)) {
    const path = k.replace(/\]/g, '').split('[');
    let cur = out;
    path.forEach((p, i) => {
      if (i === path.length - 1) cur[p] = v;
      else cur = cur[p] = cur[p] && typeof cur[p] === 'object' ? cur[p] : {};
    });
  }
  return out;
}

// ───────── Notification au commerçant (Make, Zapier, Google Sheets, etc.) ─────────
export async function forwardOrder(event) {
  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) return false;
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 4000);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event), signal: c.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
