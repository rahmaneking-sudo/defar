// Aides HTTP communes aux fonctions Vercel (signature Web : Request -> Response).
import crypto from 'node:crypto';

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origin || !allowed.length) return {};
  if (allowed.includes('*') || allowed.includes(origin)) {
    return { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-access-code,x-admin-key', vary: 'origin' };
  }
  return {};
}

export function preflight(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function readJson(request, maxBytes = 400_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw Object.assign(new Error('Requête trop volumineuse'), { status: 413 });
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('JSON invalide'), { status: 400 });
  }
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

// Code d'accès optionnel pour protéger tes crédits d'IA (variable ACCESS_CODE)
export function checkAccess(request) {
  const code = process.env.ACCESS_CODE;
  if (!code) return true;
  return safeEqual(request.headers.get('x-access-code') || '', code);
}

export function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
}

// Limiteur simple en mémoire (par instance) : suffisant contre les abus basiques
const buckets = new Map();
export function rateLimit(key, perHour = Number(process.env.RATE_LIMIT_PER_HOUR || 30)) {
  const now = Date.now();
  const b = buckets.get(key) || { n: 0, t: now };
  if (now - b.t > 3600_000) {
    b.n = 0;
    b.t = now;
  }
  b.n++;
  buckets.set(key, b);
  if (buckets.size > 5000) buckets.clear();
  return b.n <= perHour;
}

export function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(new Error('timeout')), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

export function originOf(request) {
  const env = process.env.PUBLIC_URL;
  if (env) return env.replace(/\/+$/, '');
  const u = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') || u.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || u.host;
  return `${proto}://${host}`;
}
