import { buildPalette } from '../../shared/color.js';
import { FONTS } from '../../shared/constants.js';

export function themeVars(theme = {}) {
  const p = buildPalette(theme);
  return {
    palette: p,
    vars: {
      '--app-primary': p.primary,
      '--app-accent': p.accent,
      '--app-bg': p.bg,
      '--app-surface': p.surface,
      '--app-surface2': p.surface2,
      '--app-elevated': p.elevated,
      '--app-text': p.text,
      '--app-muted': p.muted,
      '--app-border': p.border,
      '--app-on-primary': p.onPrimary,
      '--app-on-accent': p.onAccent,
      '--app-primary-ink': p.primaryInk,
      '--app-primary-soft': p.primarySoft,
      '--app-accent-soft': p.accentSoft,
      '--app-success': p.success,
      '--app-danger': p.danger,
      '--app-warning': p.warning,
      '--app-shadow': p.shadow,
      '--app-radius': `${theme.radius ?? 18}px`,
      '--app-radius-sm': `${Math.max(6, Math.round((theme.radius ?? 18) * 0.6))}px`,
      '--app-radius-lg': `${Math.round((theme.radius ?? 18) * 1.35)}px`,
      '--app-font': `'${theme.font || 'Plus Jakarta Sans'}'`,
      '--app-heading-font': `'${theme.headingFont || theme.font || 'Plus Jakarta Sans'}'`,
      // mots mis en valeur (*…*) : italique de la police de titre si elle est serif,
      // sinon un serif italique élégant en contrepoint (signature éditoriale)
      '--app-em-font': FONTS[theme.headingFont] === 'serif' ? `'${theme.headingFont}'` : "'Instrument Serif'",
    },
  };
}

const loaded = new Set();
export function ensureFonts(theme = {}) {
  if (typeof document === 'undefined') return;
  const fams = [...new Set([theme.font, theme.headingFont, 'Instrument Serif'].filter((f) => f && FONTS[f]))];
  const missing = fams.filter((f) => !loaded.has(f));
  if (!missing.length) return;
  missing.forEach((f) => loaded.add(f));
  const q = missing
    .map((f) => {
      const serif = FONTS[f] === 'serif';
      const fam = f.replace(/ /g, '+');
      if (f === 'Instrument Serif') return `family=${fam}:ital@0;1`;
      if (f === 'DM Serif Display') return `family=${fam}:ital@0;1`;
      return serif ? `family=${fam}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600` : `family=${fam}:wght@400;500;600;700;800`;
    })
    .join('&');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${q}&display=swap`;
  document.head.appendChild(link);
}
