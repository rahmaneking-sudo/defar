// Couleurs : parsing tolérant, contraste WCAG, dérivation d'un thème complet.

const NAMED = {
  black: '#000000', white: '#ffffff', red: '#e53935', green: '#16a34a', blue: '#2563eb', orange: '#f97316',
  yellow: '#facc15', purple: '#7c3aed', violet: '#7c3aed', pink: '#ec4899', teal: '#0d9488', cyan: '#06b6d4',
  indigo: '#4f46e5', gold: '#d4a017', navy: '#1e3a8a', coral: '#ff6b6b', mint: '#10b981', gray: '#6b7280',
  grey: '#6b7280', brown: '#8b5a2b', beige: '#e8dcc8', maroon: '#7f1d1d', lime: '#84cc16', emerald: '#10b981',
  rose: '#f43f5e', amber: '#f59e0b', sky: '#0ea5e9', fuchsia: '#d946ef', turquoise: '#14b8a6', olive: '#6b8e23',
  // français
  noir: '#000000', blanc: '#ffffff', rouge: '#e53935', vert: '#16a34a', bleu: '#2563eb', jaune: '#facc15',
  violet_fr: '#7c3aed', rose_fr: '#ec4899', or: '#d4a017', marron: '#8b5a2b', gris: '#6b7280',
};

export function parseColor(input) {
  if (typeof input !== 'string') return null;
  let s = input.trim().toLowerCase();
  if (NAMED[s]) s = NAMED[s];
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    h = h.slice(0, 6);
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  m = s.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
  if (m) return { r: Math.min(255, +m[1]), g: Math.min(255, +m[2]), b: Math.min(255, +m[3]) };
  m = s.match(/^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/);
  if (m) return hslToRgb(+m[1], +m[2] / 100, +m[3] / 100);
  return null;
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export function toHex({ r, g, b }) {
  const h = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function normalizeColor(input, def) {
  const c = parseColor(input) || (def ? parseColor(def) : null);
  return c ? toHex(c) : def;
}

function lin(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
export function luminance(hex) {
  const c = parseColor(hex) || { r: 0, g: 0, b: 0 };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function mix(a, b, t) {
  const ca = parseColor(a) || { r: 0, g: 0, b: 0 };
  const cb = parseColor(b) || { r: 0, g: 0, b: 0 };
  return toHex({ r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t });
}

export function alpha(hex, a) {
  const c = parseColor(hex) || { r: 0, g: 0, b: 0 };
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

// Assombrit/éclaircit jusqu'à atteindre un contraste minimal contre le fond
export function ensureContrast(fg, bg, min = 3) {
  let c = fg;
  const towards = luminance(bg) > 0.4 ? '#000000' : '#ffffff';
  for (let i = 0; i < 12 && contrast(c, bg) < min; i++) c = mix(c, towards, 0.12);
  return c;
}

export function onColor(bg) {
  return contrast('#ffffff', bg) >= contrast('#0b0b0f', bg) ? '#ffffff' : '#0b0b0f';
}

// Construit toutes les variables de thème à partir de quelques couleurs
export function buildPalette(theme) {
  const dark = theme.mode === 'dark';
  const primary = theme.primary || '#ff5a36';
  const accent = theme.accent || mix(primary, dark ? '#ffffff' : '#000000', 0.35);
  const bg = theme.background || (dark ? '#0b0b10' : '#ffffff');
  const surface = theme.surface || (dark ? mix(bg, '#ffffff', 0.06) : mix(bg, mix(primary, '#f3f3f5', 0.93), 0.9));
  let text = theme.text || (dark ? '#f5f5f7' : '#0f1115');
  if (contrast(text, bg) < 7) text = dark ? '#f5f5f7' : '#0f1115';
  const muted = dark ? mix(text, bg, 0.42) : mix(text, bg, 0.48);
  const border = dark ? alpha('#ffffff', 0.09) : alpha('#000000', 0.08);
  const primaryInk = ensureContrast(primary, bg, 3.2); // primaire lisible en texte sur le fond
  return {
    primary,
    accent,
    bg,
    surface,
    surface2: dark ? mix(bg, '#ffffff', 0.1) : mix(surface, '#000000', 0.035),
    elevated: dark ? mix(bg, '#ffffff', 0.08) : '#ffffff',
    text,
    muted,
    border,
    onPrimary: onColor(primary),
    onAccent: onColor(accent),
    primaryInk,
    primarySoft: alpha(primary, dark ? 0.2 : 0.12),
    accentSoft: alpha(accent, dark ? 0.22 : 0.14),
    success: dark ? '#34d399' : '#0e9f6e',
    danger: dark ? '#f87171' : '#e02424',
    warning: '#f59e0b',
    shadow: dark ? '0 10px 30px rgba(0,0,0,0.45)' : '0 10px 30px rgba(17, 12, 34, 0.08)',
    dark,
  };
}
