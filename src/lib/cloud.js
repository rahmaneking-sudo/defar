// ─────────────────────────────────────────────────────────────────────────────
// Compte et données en ligne (Supabase).
// supabase-js n'est chargé qu'à la demande : l'accueil reste léger.
// Sans VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, tout le reste du site
// fonctionne comme avant (studio local, galerie, paiements).
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { SITES_DOMAIN, siteFromHost } from './host.js';

export { SITES_DOMAIN, siteFromHost };

const URL_ = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const STORAGE_KEY = 'defar-auth';
export const cloudEnabled = !!(URL_ && KEY);

let clientPromise = null;
export function getClient() {
  if (!cloudEnabled) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL_, KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: STORAGE_KEY, flowType: 'implicit' },
      })
    );
  }
  return clientPromise;
}

// Indice immédiat (sans charger supabase-js) : quelqu'un est-il connecté sur cet appareil ?
export function storedUser() {
  if (!cloudEnabled) return null;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const u = raw?.user || raw?.currentSession?.user;
    return u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name || '' } : null;
  } catch {
    return null;
  }
}

// ───────── Messages d'erreur en français ─────────
const MESSAGES = {
  'invalid login credentials': 'E-mail ou mot de passe incorrect.',
  'user already registered': 'Un compte existe déjà avec cet e-mail. Connecte-toi.',
  'email not confirmed': 'Confirme d\'abord ton e-mail : regarde ta boîte de réception.',
  'password should be at least': 'Le mot de passe doit faire au moins 6 caractères.',
  'unable to validate email': 'Adresse e-mail invalide.',
  'invalid format': 'Adresse e-mail invalide.',
  'rate limit': 'Trop de tentatives. Réessaie dans quelques minutes.',
  'for security purposes': 'Trop de tentatives. Réessaie dans une minute.',
  'new password should be different': 'Choisis un mot de passe différent de l\'ancien.',
  'failed to fetch': 'Connexion impossible. Vérifie ta connexion Internet.',
  'networkerror': 'Connexion impossible. Vérifie ta connexion Internet.',
  'load failed': 'Connexion impossible. Vérifie ta connexion Internet.',
  NON_CONNECTE: 'Connecte-toi pour continuer.',
  CREDITS_INSUFFISANTS: 'Tu n\'as plus assez de crédits.',
  ADRESSE_INVALIDE: 'Adresse invalide : 3 à 40 caractères, lettres minuscules, chiffres et tirets.',
  ADRESSE_RESERVEE: 'Cette adresse est réservée. Choisis-en une autre.',
  ADRESSE_PRISE: 'Cette adresse est déjà prise. Choisis-en une autre.',
  LIMITE_SITES: 'Tu as atteint le nombre de sites en ligne de ton forfait. Dépublie un site ou change de forfait.',
  LIMITE_PROJETS: 'Tu as atteint le nombre maximum de projets. Supprime-en un pour continuer.',
  SITE_INTROUVABLE: 'Ce site est introuvable.',
  TROP_DE_MESSAGES: 'Ce site reçoit trop de messages aujourd\'hui. Réessaie demain.',
  DONNEES_INVALIDES: 'Formulaire invalide.',
  ADMIN_SEULEMENT: 'Réservé à l\'administrateur.',
  MONTANT_INVALIDE: 'Montant invalide.',
  COMPTE_INTROUVABLE: 'Compte introuvable.',
  'duplicate key': 'Cette adresse est déjà prise. Choisis-en une autre.',
  'jwt expired': 'Ta session a expiré. Reconnecte-toi.',
};
export function frError(e) {
  const raw = String(e?.message || e?.error_description || e || '');
  for (const [k, v] of Object.entries(MESSAGES)) if (raw.toLowerCase().includes(k.toLowerCase())) return v;
  return raw ? 'Une erreur est survenue. Réessaie.' : '';
}
const must = ({ data, error }) => {
  if (error) throw Object.assign(new Error(frError(error)), { cause: error, code: error.code, raw: error.message });
  return data;
};

// ───────── État du compte ─────────
export const useAuth = create((set, get) => ({
  ready: !cloudEnabled,
  user: null,
  profile: null,
  recovery: false,
  async init() {
    if (!cloudEnabled || get()._inited) return;
    set({ _inited: true });
    const sb = await getClient();
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') set({ recovery: true });
      const user = session?.user || null;
      const changed = user?.id !== get().user?.id;
      set({ user, ready: true });
      if (!user) set({ profile: null });
      else if (changed || event === 'USER_UPDATED') setTimeout(() => get().refreshProfile(), 0);
    });
    const { data } = await sb.auth.getSession();
    set({ user: data.session?.user || null, ready: true });
    if (data.session?.user) {
      get().refreshProfile();
      sb.rpc('touch_profile').then(() => {}, () => {});
    }
  },
  async refreshProfile() {
    const u = get().user;
    if (!u) return null;
    const sb = await getClient();
    const { data } = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
    if (data) set({ profile: data });
    return data;
  },
  setCredits(credits) {
    const p = get().profile;
    if (p && Number.isFinite(credits)) set({ profile: { ...p, credits } });
  },
}));

export async function signUp({ email, password, name, phone }) {
  const sb = await getClient();
  const data = must(
    await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: (name || '').trim(), phone: (phone || '').trim() }, emailRedirectTo: `${location.origin}/espace` },
    })
  );
  return { needsConfirmation: !data.session, user: data.user };
}
export async function signIn({ email, password }) {
  const sb = await getClient();
  return must(await sb.auth.signInWithPassword({ email: email.trim(), password }));
}
export async function signOut() {
  const sb = await getClient();
  const uid = useAuth.getState().user?.id;
  await sb.auth.signOut().catch(() => {});
  useAuth.setState({ user: null, profile: null });
  if (uid) (await import('./specs.js')).forgetOwnerProjects(uid);
}
export async function sendPasswordReset(email) {
  const sb = await getClient();
  return must(await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/nouveau-mot-de-passe` }));
}
export async function updatePassword(password) {
  const sb = await getClient();
  return must(await sb.auth.updateUser({ password }));
}
export async function updateProfile({ full_name, phone }) {
  const sb = await getClient();
  const id = useAuth.getState().user?.id;
  must(await sb.from('profiles').update({ full_name: (full_name || '').slice(0, 80), phone: (phone || '').slice(0, 30) }).eq('id', id));
  return useAuth.getState().refreshProfile();
}
export async function accessToken() {
  if (!cloudEnabled) return '';
  const sb = await getClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token || '';
}

// ───────── Sites (projets du studio) ─────────
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s) => UUID.test(String(s || ''));
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => ((Math.random() * 16) | (c === 'x' ? 0 : 8)).toString(16).slice(-1)));

const LIST_COLS = 'id,name,idea,slug,published,published_at,views,cover,color,settings,updated_at,created_at';
export async function listSites() {
  const sb = await getClient();
  return must(await sb.from('sites').select(LIST_COLS).order('updated_at', { ascending: false }));
}
export async function getSite(id) {
  const sb = await getClient();
  return must(await sb.from('sites').select('*').eq('id', id).maybeSingle());
}
// Enregistre (crée ou met à jour) un projet ; renvoie l'identifiant
export async function saveSite({ id, idea, spec }) {
  const sb = await getClient();
  const { specCover } = await import('../../shared/cover.js');
  const row = { name: String(spec?.meta?.name || 'Sans titre').slice(0, 120), idea: String(idea || '').slice(0, 2000), spec, cover: specCover(spec, 800), color: String(spec?.theme?.primary || '').slice(0, 20) };
  if (isUuid(id)) {
    const upd = must(await sb.from('sites').update(row).eq('id', id).select('id'));
    if (upd?.length) return id;
  }
  const nid = isUuid(id) ? id : newId();
  must(await sb.from('sites').insert({ id: nid, ...row }));
  return nid;
}
export async function deleteSite(id) {
  const sb = await getClient();
  must(await sb.from('sites').delete().eq('id', id));
}
export async function publishSite(id, slug, whatsapp) {
  const sb = await getClient();
  return must(await sb.rpc('publish_site', { p_site: id, p_slug: slug, p_whatsapp: whatsapp ?? null }));
}
export async function unpublishSite(id) {
  const sb = await getClient();
  must(await sb.rpc('unpublish_site', { p_site: id }));
}
export async function slugAvailable(slug, siteId) {
  const sb = await getClient();
  return must(await sb.rpc('slug_available', { p_slug: slug, p_site: siteId || null }));
}

// Numéro WhatsApp au format international (77 123 45 67 -> 221771234567)
export function normPhone(s) {
  const d = String(s || '').replace(/\D/g, '').replace(/^00/, '');
  if (d.length === 9 && /^[37]/.test(d)) return '221' + d;
  return d.slice(0, 15);
}

// Adresse propre à partir d'un nom : « Salon Awa » -> « salon-awa »
export function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export function publicSiteUrl(slug) {
  if (!slug) return '';
  if (SITES_DOMAIN) return `https://${slug}.${SITES_DOMAIN}`;
  return `${location.origin}/s/${slug}`;
}

// ───────── Lecture publique (sans charger supabase-js : plus rapide pour les visiteurs) ─────────
async function publicRpc(fn, args) {
  const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    // nouvelles clés « publishable » : seulement dans apikey ; anciennes clés anon (JWT) : les deux en-têtes
    headers: { apikey: KEY, ...(KEY.startsWith('eyJ') ? { authorization: `Bearer ${KEY}` } : {}), 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw Object.assign(new Error(frError(data?.message || res.statusText)), { raw: data?.message });
  return data;
}
export function getPublicSite(slug, count = true) {
  if (!cloudEnabled) return Promise.resolve(null);
  return publicRpc('get_public_site', { p_slug: slug, p_count: count });
}
export function submitForm(slug, kind, data) {
  return publicRpc('submit_form', { p_slug: slug, p_kind: kind, p_data: data });
}

// ───────── Messages reçus ─────────
export async function listSubmissions(limit = 300) {
  const sb = await getClient();
  return must(await sb.from('submissions').select('*').order('created_at', { ascending: false }).limit(limit));
}
export async function unreadCount() {
  const sb = await getClient();
  const { count } = await sb.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'nouveau');
  return count || 0;
}
export async function setSubmissionStatus(id, status) {
  const sb = await getClient();
  must(await sb.from('submissions').update({ status }).eq('id', id));
}
export async function deleteSubmission(id) {
  const sb = await getClient();
  must(await sb.from('submissions').delete().eq('id', id));
}

// ───────── Crédits ─────────
export async function listCreditEvents(limit = 60) {
  const sb = await getClient();
  return must(await sb.from('credit_events').select('*').order('created_at', { ascending: false }).limit(limit));
}

// ───────── Avis ─────────
export async function sendFeedback({ rating, message, email }) {
  if (!cloudEnabled) throw new Error('Les avis seront disponibles quand la base de données sera branchée.');
  const sb = await getClient();
  must(await sb.from('feedback').insert({ rating: rating || null, message: String(message || '').slice(0, 4000), page: location.pathname.slice(0, 200), email: email ? String(email).slice(0, 200) : null }));
}

// ───────── Admin ─────────
export async function adminStats() {
  const sb = await getClient();
  return must(await sb.rpc('admin_stats'));
}
export async function adminUsers(search = '') {
  const sb = await getClient();
  return must(await sb.rpc('admin_users', { p_search: search }));
}
export async function adminSites() {
  const sb = await getClient();
  return must(await sb.rpc('admin_sites'));
}
export async function adminGrant(userId, amount, reason) {
  const sb = await getClient();
  return must(await sb.rpc('admin_grant_credits', { p_user: userId, p_amount: amount, p_reason: reason || '' }));
}
export async function adminSetPlan(userId, plan) {
  const sb = await getClient();
  must(await sb.rpc('admin_set_plan', { p_user: userId, p_plan: plan }));
}
export async function adminFeedback() {
  const sb = await getClient();
  return must(await sb.from('feedback').select('*').order('created_at', { ascending: false }).limit(300));
}

// ───────── Photos ─────────
// Réduit la photo (1600 px max, JPEG ~80 %) avant l'envoi : rapide même en 3G.
async function compressImage(file, max = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choisis une photo (JPEG, PNG ou WebP).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error('Photo illisible.'));
      i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const keepPng = file.type === 'image/png' && file.size < 400_000;
    const blob = await new Promise((ok) => c.toBlob(ok, keepPng ? 'image/png' : 'image/jpeg', 0.8));
    return blob || file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function uploadImage(file) {
  const sb = await getClient();
  const uid = useAuth.getState().user?.id;
  if (!uid) throw new Error('Connecte-toi pour ajouter tes photos.');
  const blob = await compressImage(file);
  if (blob.size > 5 * 1024 * 1024) throw new Error('Photo trop lourde (5 Mo maximum).');
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `${uid}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  must(await sb.storage.from('media').upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false }));
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}
