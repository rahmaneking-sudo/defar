// Résolution des médias : références compactes -> URLs, et choix automatique
// d'une photo / vidéo pertinente dans la bibliothèque à partir d'une requête.
import { IMAGES, VIDEOS, PORTRAITS, unsplashUrl, mixkitSources, mixkitPoster } from './media-library.js';
import { deaccent, hash, isObj, rng } from './utils.js';

// ---------- Références -> URLs ----------
// Image : "u:<id Unsplash>" | "https://..."
// Vidéo : "mx:<chemin Mixkit>#<vignette>" | "https://....mp4"
export function imageSrc(ref, w = 800, opts = {}) {
  if (!ref || typeof ref !== 'string') return null;
  if (ref.startsWith('u:')) {
    const face = opts.face ? '&crop=faces&h=' + w : '';
    return unsplashUrl(ref.slice(2), w, face);
  }
  if (/^https?:\/\//i.test(ref)) return ref;
  if (ref.startsWith('/') || ref.startsWith('data:image/')) return ref;
  return null;
}

export function videoSources(ref) {
  if (!ref || typeof ref !== 'string') return null;
  if (ref.startsWith('mx:')) {
    const [path, t] = ref.slice(3).split('#');
    return { sources: mixkitSources(path), poster: mixkitPoster(path, Number(t) || 0) };
  }
  if (/^https?:\/\//i.test(ref) || ref.startsWith('/')) return { sources: [ref], poster: null };
  return null;
}

export const isUrl = (s) => typeof s === 'string' && (/^https?:\/\/[^\s]+$/i.test(s) || s.startsWith('/media/'));
export const isRef = (s) => typeof s === 'string' && (s.startsWith('u:') || s.startsWith('mx:') || isUrl(s));
export const looksLikeVideoUrl = (s) => typeof s === 'string' && /\.(mp4|webm|mov|m3u8)(\?|#|$)/i.test(s);

// ---------- Dictionnaire FR / Wolof -> tags ----------
const DICT = {
  thieb: 'thieboudienne rice fish', thiebou: 'thieboudienne rice fish', thieboudienne: 'thieboudienne rice fish', ceebu: 'thieboudienne rice fish', ceebujen: 'thieboudienne rice fish',
  yassa: 'yassa chicken', mafe: 'mafe stew', dibi: 'dibi grilled meat', fataya: 'fataya pastry', pastel: 'pastry fataya', pastels: 'pastry fataya',
  beignet: 'pastry', beignets: 'pastry', bissap: 'bissap juice hibiscus', bouye: 'bouye juice', gingembre: 'ginger juice', thiakry: 'yogurt', lakh: 'yogurt',
  poulet: 'chicken', poisson: 'fish', riz: 'rice', viande: 'meat', boeuf: 'meat', mouton: 'meat', brochette: 'skewers', brochettes: 'skewers', grillade: 'grilled',
  salade: 'salad', frites: 'fries', jus: 'juice', boisson: 'drink', boissons: 'drink', patisserie: 'pastry bakery', pain: 'bread bakery', gateau: 'cake dessert',
  cafe: 'coffee', the: 'tea drink', dessert: 'dessert', cuisine: 'food cooking kitchen', plat: 'dish food', plats: 'dish food', repas: 'meal food', menu: 'food dish',
  dejeuner: 'lunch food', petit: 'breakfast', resto: 'restaurant', restaurant: 'restaurant', traiteur: 'food restaurant', fastfood: 'fastfood burger', snack: 'fastfood',
  dakar: 'dakar senegal', senegal: 'senegal dakar', plage: 'beach', hotel: 'hotel', chambre: 'room hotel', maison: 'house', villa: 'villa house', appartement: 'apartment',
  logement: 'apartment house', location: 'apartment house', immobilier: 'house real estate', terrain: 'house', bureau: 'office business', boutique: 'shop store',
  magasin: 'store shop', marche: 'market', supermarche: 'supermarket grocery', epicerie: 'grocery', courses: 'grocery', pharmacie: 'pharmacy', medicament: 'pharmacy pills',
  hopital: 'health doctor', clinique: 'health doctor', medecin: 'doctor health', docteur: 'doctor health', sante: 'health doctor', dentiste: 'dentist health',
  consultation: 'doctor health', ecole: 'education school', cours: 'education class', formation: 'education learning', universite: 'university education',
  etudiant: 'student education', etudiants: 'student education', eleve: 'student school', eleves: 'student school', apprendre: 'learning education',
  livraison: 'delivery courier', livreur: 'delivery courier rider', coursier: 'courier delivery', moto: 'motorcycle scooter', scooter: 'scooter',
  jakarta: 'motorcycle scooter', taxi: 'taxi car', vtc: 'taxi car', chauffeur: 'car taxi', voiture: 'car', transport: 'car taxi city', colis: 'package parcel delivery',
  coiffure: 'hair salon', coiffeur: 'hair salon hairdresser', coiffeuse: 'hair salon hairdresser', salon: 'salon', tresses: 'braids hair', nattes: 'braids hair',
  barbier: 'barber', barber: 'barber', maquillage: 'makeup beauty', beaute: 'beauty', soin: 'skincare beauty', soins: 'skincare beauty', spa: 'spa beauty',
  couture: 'sewing tailor couture', tailleur: 'tailor sewing', mode: 'fashion', vetements: 'fashion clothes', habits: 'fashion clothes', robe: 'dress fashion',
  wax: 'wax fabric', pagne: 'wax fabric', tissu: 'fabric', tissus: 'fabric', bazin: 'fabric', chaussures: 'shoes sneakers', baskets: 'sneakers', sac: 'handbag bag',
  sacs: 'handbag bag', montre: 'watch', parfum: 'perfume', cosmetique: 'cosmetics', cosmetiques: 'cosmetics', telephone: 'smartphone phone', smartphone: 'smartphone',
  ordinateur: 'laptop', paiement: 'payment', argent: 'money finance', xaalis: 'money finance', epargne: 'saving money', tontine: 'tontine money saving',
  cotisation: 'tontine money', banque: 'finance', credit: 'finance', pret: 'finance', transfert: 'money transfer', wallet: 'payment money', portefeuille: 'money finance',
  sport: 'fitness sport', salle: 'gym', gym: 'gym fitness', musculation: 'gym fitness', football: 'football soccer', foot: 'football soccer', courir: 'running',
  course: 'running', yoga: 'fitness', agriculture: 'farm crops', champ: 'farm field', champs: 'farm field', culture: 'farm crops', cultures: 'farm crops',
  recolte: 'harvest farm', agriculteur: 'farmer farm', paysan: 'farmer farm', fermier: 'farmer farm', tracteur: 'tractor farm', elevage: 'livestock farm',
  betail: 'livestock cows', vache: 'cows', arachide: 'farm crops', mil: 'millet grain', mais: 'corn farm', semences: 'seeds farm', meteo: 'farm field sky',
  concert: 'concert music event', musique: 'music concert', soiree: 'party event', fete: 'party event', mariage: 'wedding', evenement: 'event', evenements: 'event',
  billet: 'event concert', billets: 'event concert', ticket: 'event', festival: 'festival event', nettoyage: 'cleaning', menage: 'cleaning house',
  plombier: 'service home', electricien: 'service home', bricolage: 'service home', reparation: 'service', voyage: 'travel', vacances: 'travel beach',
  equipe: 'team business', entreprise: 'business', startup: 'business startup', reunion: 'meeting business',
};

const STOP = new Set('le la les un une des de du et en au aux pour avec sur dans par ou a son sa ses mon ma mes ton ta tes votre vos notre nos the and for with of to in app application mobile my'.split(' '));

function norm(t) {
  let w = deaccent(t.toLowerCase());
  if (w.length > 4 && w.endsWith('s')) w = w.slice(0, -1);
  return w;
}

export function tokens(text) {
  const out = [];
  const raw = deaccent(String(text || '').toLowerCase()).split(/[^a-z0-9]+/).filter((w) => w && w.length > 1 && !STOP.has(w));
  for (const w of raw) {
    const tr = DICT[w] || DICT[w.replace(/s$/, '')];
    if (tr) tr.split(' ').forEach((x) => out.push(norm(x)));
    else out.push(norm(w));
  }
  return out;
}

const index = (list, kind) =>
  list.map((e) => {
    const tags = kind === 'video' ? e[2] : e[1];
    const ref = kind === 'video' ? `mx:${e[0]}#${e[1]}` : `u:${e[0]}`;
    return { ref, tags: new Set(tags.split(' ').map(norm)) };
  });

const IMG_INDEX = index(IMAGES, 'image');
const VID_INDEX = index(VIDEOS, 'video');

// Poids IDF : un mot rare ("scooter") compte plus qu'un mot fréquent ("food")
function idfMap(list) {
  const df = new Map();
  for (const e of list) for (const t of e.tags) df.set(t, (df.get(t) || 0) + 1);
  const out = new Map();
  for (const [t, n] of df) out.set(t, Math.log(1 + list.length / n));
  return out;
}
const IMG_IDF = idfMap(IMG_INDEX);
const VID_IDF = idfMap(VID_INDEX);

// Catégorie d'app -> tags par défaut
export const CATEGORY_TAGS = {
  delivery: 'delivery food courier',
  restaurant: 'restaurant food chef',
  beauty: 'beauty hair salon',
  fashion: 'fashion wax fabric',
  shop: 'product shopping store',
  grocery: 'grocery market vegetables',
  health: 'health doctor pharmacy',
  education: 'education student',
  fitness: 'fitness gym',
  transport: 'taxi car city',
  realestate: 'house apartment villa',
  events: 'event concert party',
  finance: 'finance money payment',
  agriculture: 'farm farmer crops',
  services: 'cleaning service home',
  travel: 'travel beach hotel',
  social: 'people friends african',
  generic: 'business people african',
};

export function pickMedia({ q = '', kind = 'image', category = 'generic', used, seed = 0 }) {
  const list = kind === 'video' ? VID_INDEX : IMG_INDEX;
  const idf = kind === 'video' ? VID_IDF : IMG_IDF;
  const qTokens = [...new Set(tokens(q))];
  const cTokens = tokens(CATEGORY_TAGS[category] || CATEGORY_TAGS.generic).filter((t) => !qTokens.includes(t));
  const r = rng(hash(q + '|' + category + '|' + seed));
  let best = null;
  let bestScore = -Infinity;
  for (const e of list) {
    let s = 0;
    for (const t of qTokens) if (e.tags.has(t)) s += 3 * (idf.get(t) || 1);
    for (const t of cTokens) if (e.tags.has(t)) s += 0.45 * (idf.get(t) || 1);
    if (used) s -= (used.get(e.ref) || 0) * 3.2;
    s += r() * 1.1;
    if (s > bestScore) {
      bestScore = s;
      best = e;
    }
  }
  if (!best) return null;
  if (used) used.set(best.ref, (used.get(best.ref) || 0) + 1);
  return best.ref;
}

const F_NAMES = new Set(
  'aminata fatou awa mariama khady khadija aissatou aicha ndeye coumba rokhaya astou binta dieynaba fatoumata maimouna oumou seynabou sokhna yacine bineta nafi penda mareme anta adji arame kine ndella ngone soda sophie marie fanta kadiatou hawa nabou mame dior diary nogaye codou oulimata amy sarah fatim ramatoulaye absa ami nene salimata'.split(' ')
);

export function guessGender(name) {
  const first = deaccent(String(name || '').trim().split(/\s+/)[0] || '').toLowerCase();
  if (F_NAMES.has(first)) return 'f';
  if (/(a|e|ata|ou)$/.test(first) && !/^(moussa|mamadou|abdou|pape|serigne|ousmane|souleymane|mbaye|samba|demba|alioune|aliou|lamine|modou|cheikh|mustapha|moustapha|khadim|fallou|saliou|babacar|boubacar|idrissa|tidiane|youssou|mouhamadou|ibrahima|assane)$/.test(first)) return 'f';
  return 'm';
}

export function pickPortrait(name, usedPortraits) {
  const g = guessGender(name);
  const pool = PORTRAITS[g];
  let i = hash(String(name || 'x')) % pool.length;
  if (usedPortraits) {
    for (let k = 0; k < pool.length && usedPortraits.has(pool[i]); k++) i = (i + 1) % pool.length;
    usedPortraits.add(pool[i]);
  }
  return `u:${pool[i]}`;
}

// ---------- Parcours de la spec : remplace les requêtes par des médias ----------
// Un "placeholder" est { q: 'texte', kind: 'image'|'video', avatar?: true }.
export const isPlaceholder = (v) => isObj(v) && typeof v.q === 'string' && !v.src;

export function resolveSpecMedia(spec, { resolver } = {}) {
  const category = spec?.meta?.category || 'generic';
  const used = new Map();
  const usedPortraits = new Set();
  let n = 0;
  const pickFor = (ph) => {
    n++;
    if (ph.avatar) return pickPortrait(ph.q, usedPortraits);
    const custom = resolver ? resolver(ph) : null;
    if (custom) return custom;
    return pickMedia({ q: ph.q, kind: ph.kind === 'video' ? 'video' : 'image', category, used, seed: n });
  };
  const walk = (node, depth = 0) => {
    if (depth > 12 || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (isPlaceholder(node[i])) {
          const got = pickFor(node[i]);
          node[i] = (isObj(got) ? got.src : got) || '';
        } else walk(node[i], depth + 1);
      }
      return;
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (isPlaceholder(v)) {
        const got = pickFor(v);
        const ref = isObj(got) ? got.src : got;
        const poster = isObj(got) ? got.poster : undefined;
        if (k === 'media') node[k] = ref ? { kind: ref.startsWith('mx:') || looksLikeVideoUrl(ref) ? 'video' : 'image', src: ref, ...(poster ? { poster } : {}) } : null;
        else node[k] = ref || '';
      } else if (v && typeof v === 'object') {
        if (k === 'media' && isPlaceholder(v.src)) {
          const got = pickFor(v.src);
          const ref = isObj(got) ? got.src : got;
          v.src = ref || '';
          if (isObj(got) && got.poster) v.poster = got.poster;
          v.kind = ref && (ref.startsWith('mx:') || looksLikeVideoUrl(ref)) ? 'video' : 'image';
        } else walk(v, depth + 1);
      }
    }
  };
  walk(spec);
  return spec;
}
