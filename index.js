// Générateur local (sans IA) : produit une app complète à partir d'une idée.
// Sert de filet de sécurité si l'IA est indisponible, et de mode démo.
import { TEMPLATES } from './templates.js';
import { makeCtx } from './kit.js';
import { detectCategory } from '../detect.js';
import { hash } from '../utils.js';

const NAMES = {
  delivery: ['Gaaw Food', 'Yóbbu', 'LivrExpress', 'Ñam Ñam', 'Lekk Rek'],
  restaurant: ['Chez Fatou', 'Teranga Grill', 'Le Baobab', 'Saveurs de Dakar', 'Lekk Na'],
  beauty: ['Rafet Studio', 'Glow Dakar', 'Tresses & Co', 'Salon Jamm'],
  fashion: ['Wax & Co', 'Jënd Style', 'Pagne Chic', 'Bazin Royal'],
  shop: ['Jaay', 'Market Dakar', 'Jënd', 'Teranga Store'],
  grocery: ['Marché Frais', 'Bol Vert', 'Jënd Légumes', 'Panier Local'],
  health: ['Wér Santé', 'Doktor', 'Santé+ Dakar', 'Pharma Teranga'],
  education: ['Jàng Academy', 'Xam-Xam', 'Classe+', 'Bac Facile'],
  fitness: ['Doole Fit', 'FitDakar', 'Kër Sport', 'Lamb Fitness'],
  transport: ['Dem', 'Yoon', 'Taxi Teranga', 'Wolu Ride'],
  realestate: ['Kër Immo', 'Dakar Homes', 'Logis Teranga', 'Kërëm'],
  events: ['Ndaje', 'Teranga Events', 'Sabar Pass', 'Tickets Dakar'],
  finance: ['Xaalis', 'Tontine+', 'Nafa', 'Mbokk Pay'],
  agriculture: ['Beykat', 'Mbay Pro', 'Tool Connect', 'AgriSen'],
  services: ['Ligeey', 'Fix Dakar', 'Jàmbaar Pro', 'Maison Service'],
  travel: ['Tukki', 'Teranga Trips', 'Saly Escapes', 'Casamance Voyages'],
  social: ['Mbokk', 'Dalal', 'Teranga Club'],
  generic: ['Jamm', 'Leer', 'Nexa', 'Sama App'],
};

export function extractName(idea) {
  const s = String(idea || '');
  const m =
    s.match(/(?:appel[ée]e?s?|nomm[ée]e?s?|nom\s*:?|baptis[ée]e?|called|named)\s+[«"'“]?([A-ZÀ-Ý0-9][\wÀ-ÿ'’&+.-]*(?:\s+[A-ZÀ-Ý0-9][\wÀ-ÿ'’&+.-]*){0,2})/i) ||
    s.match(/[«"“]\s*([^»"”]{2,28})\s*[»"”]/);
  if (!m) return null;
  return m[1].trim().replace(/[.,;:!?]+$/, '').slice(0, 28);
}

export function pickName(category, idea, seed = 0) {
  const list = NAMES[category] || NAMES.generic;
  return list[(hash(idea) + seed) % list.length];
}

export function generateLocal(idea, { category, seed = 0, name } = {}) {
  const cat = category && TEMPLATES[category] ? category : detectCategory(idea);
  const appName = name || extractName(idea) || pickName(cat, idea, seed);
  const ctx = makeCtx(String(idea || ''), { name: appName, category: cat, seed });
  return TEMPLATES[cat](ctx);
}

export { TEMPLATES };
