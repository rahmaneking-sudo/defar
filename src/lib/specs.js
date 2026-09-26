// Création, génération (IA + secours), partage et sauvegarde des maquettes.
import LZString from 'lz-string';
import { normalizeSpec } from '../../shared/normalize.js';
import { generateLocal } from '../../shared/generator/index.js';
import { uid } from '../../shared/utils.js';
import { cloudEnabled, accessToken, useAuth } from './cloud.js';

export function localSpec(idea, opts = {}) {
  return normalizeSpec(generateLocal(idea, opts)).spec;
}

const ACCESS_KEY = 'defar.access';
export const getAccessCode = () => {
  try {
    return localStorage.getItem(ACCESS_KEY) || '';
  } catch {
    return '';
  }
};
export const setAccessCode = (c) => {
  try {
    localStorage.setItem(ACCESS_KEY, c);
  } catch {
    /* navigation privée */
  }
};

// Appelle l'IA ; en cas d'échec, bascule sur le générateur local. Ne jette jamais.
export async function generateSpec({ idea, mode = 'create', spec, instruction, signal } = {}) {
  const started = Date.now();
  try {
    const token = cloudEnabled ? await accessToken() : '';
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-access-code': getAccessCode(), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ idea, mode, spec, instruction }),
      signal,
    });
    const data = await res.json().catch(() => null);
    if (res.status === 401) return data?.error === 'login_required' ? { spec: null, needsLogin: true, message: data.message } : { spec: null, needsCode: true };
    if (res.status === 402) {
      if (Number.isFinite(data?.credits)) useAuth.getState().setCredits(data.credits);
      return { spec: null, needsCredits: true, credits: data?.credits, cost: data?.cost, message: data?.message };
    }
    if (Number.isFinite(data?.credits)) useAuth.getState().setCredits(data.credits);
    if (data?.spec) {
      const n = normalizeSpec(data.spec).spec; // double sécurité côté navigateur
      return { spec: n, source: data.provider || 'ai', model: data.model, fallback: !!data.fallback, warning: data.warning, ms: Date.now() - started, cost: data.cost || 0 };
    }
    throw new Error(data?.error || `HTTP ${res.status}`);
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    if (mode === 'edit') return { spec: null, error: String(e?.message || e) };
    return { spec: localSpec(idea), source: 'template', fallback: true, warning: 'IA indisponible : maquette créée à partir d\'un modèle.', ms: Date.now() - started };
  }
}

export async function aiStatus() {
  try {
    const r = await fetch('/api/health', { headers: { 'x-access-code': getAccessCode() } });
    if (!r.ok) throw 0;
    return await r.json();
  } catch {
    return { ai: false, providers: [], pexels: false, payments: {}, offline: true };
  }
}

// ── Partage par lien (la maquette est compressée dans l'URL) ──
export function shareUrl(spec) {
  const packed = LZString.compressToEncodedURIComponent(JSON.stringify(spec));
  return `${location.origin}/p#${packed}`;
}
export function specFromHash(hash) {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(String(hash || '').replace(/^#/, ''));
    if (!raw) return null;
    return normalizeSpec(raw).spec;
  } catch {
    return null;
  }
}

// ── Projets (stockés dans le navigateur) ──
const KEY = 'defar.projects.v1';
function readProjects() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}
// Projets de cet appareil. owner=null : projets faits sans compte ; owner=id : copie locale d'un compte.
export function listProjects(owner) {
  const all = readProjects();
  if (owner === undefined) return all;
  return all.filter((p) => (p.owner || null) === owner);
}
export function saveProject(p) {
  const all = readProjects().filter((x) => x.id !== p.id);
  const item = { id: p.id || uid('p'), name: p.spec?.meta?.name || 'Sans titre', idea: p.idea || '', updatedAt: Date.now(), spec: p.spec, owner: p.owner || null };
  all.unshift(item);
  const trimmed = all.slice(0, 24);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // quota dépassé : on garde les 8 plus récents
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed.slice(0, 8)));
    } catch {
      /* ignore */
    }
  }
  return item;
}
export function getProject(id) {
  return readProjects().find((p) => p.id === id) || null;
}
export function deleteProject(id) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readProjects().filter((p) => p.id !== id)));
  } catch {
    /* ignore */
  }
}
// À la déconnexion : on efface de l'appareil les copies des projets du compte (appareils partagés)
export function forgetOwnerProjects(owner) {
  if (!owner) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(readProjects().filter((p) => p.owner !== owner)));
  } catch {
    /* ignore */
  }
}
