// Utilitaires purs, partagés entre le navigateur et les fonctions serverless.

export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function str(v, def = '', max = 400) {
  if (v === null || v === undefined) return def;
  if (typeof v === 'number' && Number.isFinite(v)) v = String(v);
  if (typeof v === 'boolean') return def;
  if (typeof v !== 'string') return def;
  // retire les balises HTML et normalise les espaces
  let s = v.replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/\s+/g, ' ').trim();
  if (s.length > max) s = s.slice(0, max - 1).trimEnd() + '…';
  return s || def;
}

export function num(v, def = 0, min = -Infinity, max = Infinity) {
  if (typeof v === 'number' && Number.isFinite(v)) return clamp(v, min, max);
  if (typeof v === 'string') {
    // "12 500 FCFA", "12.500", "12,5", "4.8/5"
    const cleaned = v.replace(/\s| | /g, '').replace(/fcfa|cfa|xof|f\b|€|\$/gi, '');
    const m = cleaned.match(/-?\d+(?:[.,]\d+)*/);
    if (m) {
      let t = m[0];
      // "12.500" ou "12,500" (séparateur de milliers) vs "4.8" (décimal)
      if (/^-?\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, '');
      else t = t.replace(',', '.');
      const n = parseFloat(t);
      if (Number.isFinite(n)) return clamp(n, min, max);
    }
  }
  return def;
}

export function bool(v, def = false) {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1 || v === '1' || v === 'yes' || v === 'oui') return true;
  if (v === 'false' || v === 0 || v === '0' || v === 'no' || v === 'non') return false;
  return def;
}

export function arr(v, max = 30) {
  if (Array.isArray(v)) return v.slice(0, max);
  if (v === null || v === undefined || v === '') return [];
  if (isObj(v)) {
    // {a:{...}, b:{...}} -> [..]
    const vals = Object.values(v);
    if (vals.length && vals.every((x) => isObj(x))) return vals.slice(0, max);
    return [v];
  }
  if (typeof v === 'string') return v.split(/\s*[,;|\n]\s*/).filter(Boolean).slice(0, max);
  return [];
}

export function oneOf(v, list, def) {
  if (typeof v === 'string') {
    const k = v.trim().toLowerCase();
    const hit = list.find((x) => x.toLowerCase() === k);
    if (hit) return hit;
  }
  return def;
}

export function deaccent(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function slugify(s, def = 'ecran') {
  const out = deaccent(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return out || def;
}

// Hash déterministe (FNV-1a) -> entier 32 bits
export function hash(s) {
  let h = 0x811c9dc5;
  const t = String(s);
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Générateur pseudo-aléatoire déterministe
export function rng(seed) {
  let a = typeof seed === 'number' ? seed : hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(list, r = Math.random) {
  return list[Math.floor(r() * list.length) % Math.max(1, list.length)];
}

export function uid(prefix = 'id') {
  const r = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36).slice(-4);
  return `${prefix}_${t}${r}`;
}

// Format prix FCFA : 12500 -> "12 500 F"
// 12500 -> « 12 500 » (rapide : pas d'Intl à chaque image d'animation)
export function groupThousands(n) {
  const v = Math.round(Number(n) || 0);
  return (v < 0 ? '-' : '') + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatMoney(n, currency = 'FCFA', compact = false) {
  const v = Math.round(Number(n) || 0);
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = v < 0 ? '−' : '';
  if (compact) return `${sign}${s} F`;
  return `${sign}${s} ${currency || 'FCFA'}`;
}

export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '?';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

export function deepClone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

// Extraction robuste d'un objet JSON dans un texte (réponses d'IA)
export function extractJsonText(text) {
  if (typeof text !== 'string') return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.indexOf('{');
  if (first === -1) return null;
  const last = t.lastIndexOf('}');
  return last > first ? t.slice(first, last + 1) : t.slice(first);
}
