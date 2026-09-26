// Modifications simples comprises sans IA (instantané, fonctionne hors ligne).
import { PALETTES, FONT_PAIRS } from '../../shared/constants.js';
import { deaccent, deepClone, slugify } from '../../shared/utils.js';
import { SCREEN_PRESETS } from './presets.js';

const COLORS = {
  vert: '#16a34a', green: '#16a34a', bleu: '#2563eb', blue: '#2563eb', rouge: '#e11d48', red: '#e11d48', orange: '#f97316', violet: '#7c3aed', mauve: '#9d4edd',
  rose: '#ec4899', pink: '#ec4899', jaune: '#eab308', or: '#d4a017', dore: '#d4a017', noir: '#111111', turquoise: '#14b8a6', marron: '#8b5a2b', bordeaux: '#7f1d1d', corail: '#ff6b6b', indigo: '#4f46e5', cyan: '#06b6d4',
};
const SCREEN_WORDS = [
  [/panier/, 'panier'], [/paiement|payer|checkout/, 'paiement'], [/confirmation|succes/, 'confirmation'], [/profil|compte/, 'profil'], [/reserv|rendez|rdv/, 'reservation'],
  [/suivi|tracking|livreur/, 'suivi'], [/message|chat|support|discussion/, 'messages'], [/formulaire|contact/, 'formulaire'], [/abonnement|offre|fidelit|premium/, 'offres'],
  [/catalogue|produits|boutique|menu/, 'catalogue'], [/tableau de bord|dashboard|statist/, 'tableau'], [/connexion|login|inscription/, 'connexion'], [/onboarding|bienvenue|intro/, 'onboarding'], [/fiche|detail/, 'detail'],
];

export function applyLocalInstruction(spec, text) {
  const t = deaccent(String(text || '').toLowerCase());
  const d = deepClone(spec);
  const done = [];
  const th = d.theme;

  if (/(mode |theme |en )?(sombre|dark|nuit)\b/.test(t) && !/palette nuit/.test(t)) {
    th.mode = 'dark';
    delete th.background;
    done.push('Mode sombre');
  } else if (/(mode |theme |en )(clair|light)\b/.test(t)) {
    th.mode = 'light';
    delete th.background;
    done.push('Mode clair');
  }
  for (const p of PALETTES) {
    const k = deaccent(p.label.toLowerCase());
    if (t.includes(k) || (p.id !== 'or' && new RegExp(`\\b${p.id}\\b`).test(t))) {
      Object.assign(th, { primary: p.primary, accent: p.accent, mode: p.mode });
      if (p.background) th.background = p.background;
      else delete th.background;
      done.push(`Palette ${p.label}`);
      break;
    }
  }
  const col = t.match(/(couleur|en|primaire|principale|accent)\s+(?:de\s+)?(vert|green|bleu|blue|rouge|red|orange|violet|mauve|rose|pink|jaune|or|dore|noir|turquoise|marron|bordeaux|corail|indigo|cyan)\b/);
  if (col) {
    const key = /accent/.test(col[1]) ? 'accent' : 'primary';
    th[key] = COLORS[col[2]];
    done.push(`Couleur ${key === 'accent' ? 'd\'accent' : 'principale'} : ${col[2]}`);
  }
  const font = /(luxe|luxueux|haut de gamme|chic|elegant|premium)/.test(t) ? 'luxe' : /(editorial|magazine)/.test(t) ? 'editorial' : /(moderne|epure)/.test(t) ? 'moderne' : /(tech|futur)/.test(t) ? 'futuriste' : /(ludique|fun|enfant|doux)/.test(t) ? 'doux' : /(audacieux|impact|fort)/.test(t) ? 'audacieux' : null;
  if (font) {
    const f = FONT_PAIRS.find((x) => x.id === font);
    th.font = f.body;
    th.headingFont = f.heading;
    if (font === 'luxe' || font === 'editorial') th.style = 'editorial';
    done.push(`Typographie ${f.label}`);
  }
  if (/(plus )?arrondi|coins ronds/.test(t)) {
    th.radius = 26;
    done.push('Coins arrondis');
  } else if (/carre|anguleux|coins droits/.test(t)) {
    th.radius = 6;
    done.push('Coins droits');
  }
  if (/verre|glass|transparen/.test(t)) (th.style = 'glass'), done.push('Style verre');
  else if (/minimal/.test(t)) (th.style = 'minimal'), done.push('Style minimal');
  else if (/(bold|brutal|contraste)/.test(t)) (th.style = 'bold'), done.push('Style audacieux');

  const name = String(text).match(/(?:renomme|appelle|nomme)(?:[- ]la| l'app(?:li(?:cation)?)?)?\s+(?:en\s+)?[«"“']?([^»"”'\n]{2,28})/i);
  if (name) {
    d.meta.name = name[1].trim();
    done.push(`Nom : ${d.meta.name}`);
  }

  if (/(ajoute|cree|rajoute|mets?)\b.*\becran\b|\becran de\b/.test(t)) {
    for (const [re, id] of SCREEN_WORDS) {
      if (!re.test(t)) continue;
      const preset = SCREEN_PRESETS.find((p) => p.id === id);
      if (!preset) continue;
      let sid = id;
      while (d.screens.some((s) => s.id === sid)) sid = `${id}-${Math.floor(Math.random() * 90 + 10)}`;
      d.screens.push({ id: sid, title: preset.label, header: { style: preset.header, title: preset.label }, blocks: preset.blocks() });
      done.push(`Écran « ${preset.label} » ajouté`);
      d.__newScreen = sid;
      break;
    }
  }
  if (!done.length) return null;
  const newScreen = d.__newScreen;
  delete d.__newScreen;
  return { spec: d, applied: done, newScreen: newScreen ? slugify(newScreen) : null };
}
