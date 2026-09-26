// Accès à Supabase depuis les fonctions serveur (sans dépendance : simple fetch).
// Toujours avec le jeton de l'utilisateur : les règles de la base s'appliquent.
import { withTimeout } from './http.js';

export const sbUrl = () => (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
export const sbAnon = () => process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
export const cloudOn = () => !!(sbUrl() && sbAnon());

export function bearer(request) {
  return (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
}
export function jwtSub(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString()).sub || null;
  } catch {
    return null;
  }
}

export async function rest(path, { token, method = 'GET', body, timeout = 8000 } = {}) {
  const t = withTimeout(timeout);
  try {
    const res = await fetch(`${sbUrl()}/rest/v1/${path}`, {
      method,
      signal: t.signal,
      // jeton de l'utilisateur si connecté ; sinon la clé publique (seulement dans apikey pour les nouvelles clés « publishable »)
      headers: { apikey: sbAnon(), ...(token ? { authorization: `Bearer ${token}` } : sbAnon().startsWith('eyJ') ? { authorization: `Bearer ${sbAnon()}` } : {}), 'content-type': 'application/json', accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: String(e?.message || e) } };
  } finally {
    t.done();
  }
}

// Solde de crédits de l'utilisateur connecté. auth=false si le jeton est absent ou expiré.
export async function getCredits(token) {
  const sub = jwtSub(token);
  if (!token || !sub) return { auth: false };
  const r = await rest(`profiles?select=credits&id=eq.${encodeURIComponent(sub)}`, { token });
  if (r.status === 401 || r.status === 403) return { auth: false };
  if (!r.ok) return { auth: true, error: r.data?.message || `HTTP ${r.status}` };
  return { auth: true, sub, credits: Number(r.data?.[0]?.credits ?? 0) };
}

export async function spendCredits(token, amount, reason) {
  const r = await rest('rpc/spend_credits', { token, method: 'POST', body: { p_amount: amount, p_reason: reason } });
  if (!r.ok) return { ok: false, error: r.data?.message || `HTTP ${r.status}` };
  return { ok: true, credits: Number(r.data) };
}

export async function publicSite(slug) {
  const r = await rest('rpc/get_public_site', { method: 'POST', body: { p_slug: slug, p_count: false }, timeout: 5000 });
  return r.ok ? r.data : null;
}
