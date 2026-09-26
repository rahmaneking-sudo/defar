// ─────────────────────────────────────────────────────────────────────────────
// NORMALISEUR « ANTI-BUG »
// Prend N'IMPORTE QUELLE entrée (JSON cassé, champs manquants, types faux,
// liens vers des écrans inexistants…) et renvoie TOUJOURS une spec valide.
// C'est ce qui garantit qu'une maquette générée par l'IA ne plante jamais.
// ─────────────────────────────────────────────────────────────────────────────
import { jsonrepair } from 'jsonrepair';
import { str, num, bool, arr, oneOf, isObj, slugify, clamp, extractJsonText, deaccent, hash } from './utils.js';
import { normalizeColor } from './color.js';
import { ICONS, ICON_ALIASES, FONTS, STYLES, PAY_METHODS, BLOCK_TYPES, BLOCK_ALIASES, PALETTES } from './constants.js';
import { isRef, looksLikeVideoUrl, resolveSpecMedia } from './media.js';
import { detectCategory, CATEGORIES } from './detect.js';

const ICON_SET = new Set(ICONS);
const MAX_SCREENS = 16;
const MAX_BLOCKS = 24;

// ---------- Parsing tolérant ----------
export function parseLoose(input) {
  if (isObj(input)) return input;
  if (typeof input !== 'string') return null;
  const t = extractJsonText(input);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    try {
      return JSON.parse(jsonrepair(t));
    } catch {
      return null;
    }
  }
}

function unwrap(o) {
  if (!isObj(o)) return {};
  for (const k of ['app', 'spec', 'application', 'prototype', 'result', 'data', 'input']) {
    if (isObj(o[k]) && (o[k].screens || o[k].pages || o[k].theme)) return unwrap(o[k]);
  }
  return o;
}

// ---------- Icônes ----------
const EMOJI_RE = /\p{Extended_Pictographic}/u;
export function normIcon(v, hint = '', def = 'sparkles') {
  if (typeof v === 'string' && v.trim()) {
    const raw = v.trim();
    if (EMOJI_RE.test(raw) && raw.length <= 8) return 'emoji:' + raw;
    const k = raw
      .replace(/^lucide[:\-]/i, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
    if (ICON_SET.has(k)) return k;
    const k2 = k.replace(/-icon$/, '').replace(/^icon-/, '');
    if (ICON_SET.has(k2)) return k2;
    const w = deaccent(k2).replace(/-/g, '');
    if (ICON_ALIASES[w]) return ICON_ALIASES[w];
    for (const part of deaccent(k2).split('-')) if (ICON_ALIASES[part]) return ICON_ALIASES[part];
    for (const part of k2.split('-')) if (ICON_SET.has(part)) return part;
  }
  if (hint) {
    for (const word of deaccent(String(hint).toLowerCase()).split(/[^a-z]+/)) {
      if (ICON_ALIASES[word]) return ICON_ALIASES[word];
      if (ICON_SET.has(word)) return word;
    }
  }
  return def;
}

// ---------- Médias ----------
function mediaInputToString(v) {
  if (typeof v === 'string') return v.trim();
  if (isObj(v)) {
    for (const k of ['src', 'url', 'uri', 'href', 'image', 'video', 'poster']) if (typeof v[k] === 'string' && v[k].trim()) return v[k].trim();
    for (const k of ['q', 'query', 'search', 'keywords', 'prompt', 'description', 'alt']) if (typeof v[k] === 'string' && v[k].trim()) return { q: v[k].trim() };
  }
  return null;
}

// Image : renvoie une ref ("u:..", URL) ou un placeholder {q, kind:'image'} ou ''
export function normImage(v, hint = '') {
  const s = mediaInputToString(v);
  if (typeof s === 'string' && s) {
    if (isRef(s) && !looksLikeVideoUrl(s)) return s;
    if (!/^(https?:|data:|javascript:|\/)/i.test(s) && s.length < 160) return { q: s, kind: 'image' };
  }
  if (isObj(s) && s.q) return { q: s.q.slice(0, 160), kind: 'image' };
  return hint ? { q: String(hint).slice(0, 160), kind: 'image' } : '';
}

// Média (image ou vidéo) : {kind, src} ou placeholder
export function normMedia(v, hint = '', preferVideo = false) {
  if (v === false || v === 'none') return null;
  if (isObj(v)) {
    // formes {video:'...'} / {image:'...'} / {type:'video', src/query}
    const typ = oneOf(v.kind || v.type, ['video', 'image'], null);
    if (typeof v.video === 'string' && v.video.trim()) return withPoster(normMediaStr(v.video.trim(), true, hint), v.poster);
    if (isObj(v.video)) return normMedia(v.video, hint, true);
    if (typeof v.image === 'string' && v.image.trim() && !v.src) return normMediaStr(v.image.trim(), false, hint);
    const s = mediaInputToString(v);
    if (typeof s === 'string') return withPoster(normMediaStr(s, typ ? typ === 'video' : preferVideo, hint), v.poster);
    if (isObj(s)) return { q: s.q.slice(0, 160), kind: (typ || (preferVideo ? 'video' : 'image')) };
  }
  if (typeof v === 'string' && v.trim()) return normMediaStr(v.trim(), preferVideo, hint);
  return hint ? { q: String(hint).slice(0, 160), kind: preferVideo ? 'video' : 'image' } : null;
}

function normMediaStr(s, preferVideo, hint) {
  if (isRef(s)) {
    const isVid = s.startsWith('mx:') || looksLikeVideoUrl(s);
    return { kind: isVid ? 'video' : 'image', src: s };
  }
  if (/^(javascript|data):/i.test(s)) return hint ? { q: hint, kind: preferVideo ? 'video' : 'image' } : null;
  return { q: s.slice(0, 160), kind: preferVideo ? 'video' : 'image' };
}

function withPoster(m, poster) {
  if (m && m.src && typeof poster === 'string' && isRef(poster)) m.poster = poster;
  return m;
}

export function normAvatar(v, name = '') {
  const s = mediaInputToString(v);
  if (typeof s === 'string' && isRef(s) && !looksLikeVideoUrl(s)) return s;
  if (v === false || v === 'none' || v === 'initials') return '';
  return name ? { q: str(name, 'Client', 60), avatar: true } : '';
}

// ---------- Actions ----------
const ACTION_TYPES = ['navigate', 'back', 'home', 'tab', 'modal', 'toast', 'link', 'call', 'whatsapp', 'share', 'addToCart', 'reset', 'none', 'like'];

export function normAction(v) {
  if (v === null || v === undefined || v === '' || v === false) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const low = s.toLowerCase();
    if (/^(back|retour|go ?back|pop)$/.test(low)) return { type: 'back' };
    if (/^(home|accueil|root)$/.test(low)) return { type: 'home' };
    if (/^https?:\/\//.test(s)) return { type: 'link', url: s };
    if (/^tel:/.test(low)) return { type: 'call', phone: s.slice(4) };
    if (/^(wa|whatsapp):/.test(low)) return { type: 'whatsapp', phone: s.split(':')[1] };
    if (/^(toast|alert|message):/.test(low)) return { type: 'toast', message: str(s.split(':').slice(1).join(':'), 'OK', 120) };
    if (/^(share|partager)$/.test(low)) return { type: 'share' };
    if (/^(addtocart|add_to_cart|add-to-cart|ajouter au panier)$/.test(low)) return { type: 'addToCart' };
    const m = s.match(/^(?:screen|navigate|go|goto|nav|open|tab|modal|#|\/)[:\s]*(.+)$/i);
    const target = m ? m[1] : s;
    const kind = /^tab[:\s]/i.test(s) ? 'tab' : /^modal[:\s]/i.test(s) ? 'modal' : 'navigate';
    return { type: kind, to: target.replace(/^[#/]+/, '').trim() };
  }
  if (isObj(v)) {
    const t = String(v.type || v.action || v.kind || '').toLowerCase().replace(/[\s_-]/g, '');
    const to = v.to || v.target || v.screen || v.screenId || v.screen_id || v.navigate || v.go || v.goto || v.page || v.id;
    if (t === 'back' || t === 'goback' || t === 'pop') return { type: 'back' };
    if (t === 'home') return { type: 'home' };
    if (t === 'toast' || t === 'alert' || t === 'message' || t === 'snackbar') return { type: 'toast', message: str(v.message || v.text || v.title, 'C\'est fait !', 140) };
    if (t === 'link' || t === 'url' || t === 'open' && v.url || t === 'external') return /^https?:\/\//.test(v.url || v.href || '') ? { type: 'link', url: v.url || v.href } : { type: 'toast', message: 'Lien externe' };
    if (t === 'call' || t === 'phone') return { type: 'call', phone: str(v.phone || v.number || to, '', 30) };
    if (t === 'whatsapp') return { type: 'whatsapp', phone: str(v.phone || v.number || to, '', 30), message: str(v.message, '', 200) };
    if (t === 'share') return { type: 'share' };
    if (t === 'like' || t === 'favorite') return { type: 'like' };
    if (t === 'addtocart' || t === 'cart' && !to) return { type: 'addToCart' };
    if (t === 'reset' || t === 'restart') return { type: 'reset' };
    if (t === 'none' || t === 'noop') return null;
    if (typeof to === 'string' && to.trim()) {
      const kind = t === 'tab' || t === 'switchtab' ? 'tab' : t === 'modal' || t === 'sheet' || t === 'present' ? 'modal' : 'navigate';
      return { type: kind, to: to.trim().replace(/^[#/]+/, '') };
    }
    if (v.url) return normAction(String(v.url));
  }
  return null;
}

// Mots-clés -> écran cible (quand l'IA vise un écran qui n'existe pas)
const INTENTS = [
  [/check.?out|paiement|payment|pay|payer|regler|reglement/, 'checkout'],
  [/cart|panier|basket|bag/, 'cart'],
  [/success|confirm|merci|thank|done|termine|valide/, 'success'],
  [/track|suivi|livraison.?en.?cours|map|carte|en.?route/, 'tracking'],
  [/book|reserv|rdv|rendez|appoint|creneau|slot|calend/, 'booking'],
  [/detail|product|produit|item|article|plat|service|fiche|course/, 'detail'],
  [/chat|message|support|discussion|conversation|assistant/, 'chat'],
  [/profil|profile|account|compte|moi|user/, 'profile'],
  [/login|auth|connexion|signin|sign.?up|inscription|otp|register/, 'auth'],
  [/onboard|welcome|bienvenue|intro|start/, 'onboarding'],
  [/plan|abonn|subscri|pricing|premium|offre/, 'plans'],
  [/ticket|billet|recu|receipt/, 'ticket'],
  [/order|commande|historique|history/, 'timeline'],
  [/home|accueil|main|index|dashboard|tableau/, 'home'],
];

// ---------- Normalisation par bloc ----------
const T = (v, d = '', m = 160) => str(v, d, m);
const P = (v) => {
  const n = num(v, NaN, 0, 1e9);
  return Number.isFinite(n) ? Math.round(n) : null;
};

function items(v, fn, max = 16) {
  const out = [];
  arr(v, max).forEach((x, i) => {
    try {
      const r = fn(isObj(x) ? x : typeof x === 'string' || typeof x === 'number' ? { title: String(x), label: String(x), name: String(x) } : {}, i);
      if (r) out.push(r);
    } catch {
      /* élément ignoré */
    }
  });
  return out;
}

function buttons(v, ctx) {
  return items(v, (b) => {
    const label = T(b.label || b.title || b.text, '', 40);
    if (!label) return null;
    return { label, action: normAction(b.action ?? b.to ?? b.screen ?? b.href ?? null), style: oneOf(b.style || b.variant, ['primary', 'secondary', 'outline', 'ghost'], 'primary'), icon: b.icon ? normIcon(b.icon, label) : '' };
  }, 3);
}

function cta(v, def) {
  if (!v && !def) return null;
  if (typeof v === 'string') return { label: T(v, def?.label || 'Continuer', 40), action: def?.action || null };
  const o = isObj(v) ? v : {};
  const label = T(o.label || o.title || o.text, def?.label || '', 40);
  if (!label) return null;
  return { label, action: normAction(o.action ?? o.to ?? o.screen ?? null) || def?.action || null };
}

function itemCommon(x, i, ctx, { needImage = false, hint = '' } = {}) {
  const title = T(x.title || x.name || x.label, '', 70);
  const subtitle = T(x.subtitle || x.description || x.desc || x.category || x.text, '', 120);
  const it = { id: x.id ? slugify(x.id, `item-${i}`) : slugify(title || `item-${i}`, `item-${i}`) + '-' + i, title: title || `Élément ${i + 1}` };
  if (subtitle) it.subtitle = subtitle;
  const price = P(x.price ?? x.amount ?? x.cost ?? x.prix);
  if (price !== null) it.price = price;
  const old = P(x.oldPrice ?? x.old_price ?? x.compareAt ?? x.originalPrice);
  if (old !== null && price !== null && old > price) it.oldPrice = old;
  const badge = T(x.badge || x.tag || x.label2, '', 22);
  if (badge) it.badge = badge;
  const rating = num(x.rating ?? x.stars ?? x.note, NaN, 0, 5);
  if (Number.isFinite(rating)) it.rating = Math.round(rating * 10) / 10;
  const meta = T(x.meta || x.time || x.duration || x.distance || x.location, '', 40);
  if (meta) it.meta = meta;
  const img = x.image ?? x.img ?? x.photo ?? x.thumbnail ?? x.picture ?? x.cover;
  const image = normImage(img, needImage ? [title, hint].filter(Boolean).join(' ') : '');
  if (image) it.image = image;
  const act = normAction(x.action ?? x.to ?? x.screen ?? x.link ?? null);
  if (act) it.action = act;
  return it;
}

const B = {
  hero(b, ctx) {
    return {
      eyebrow: T(b.eyebrow || b.kicker || b.tag, '', 40),
      title: T(b.title || b.heading, ctx.appName, 90),
      subtitle: T(b.subtitle || b.text || b.description, '', 160),
      media: normMedia(b.media ?? b.video ?? b.image ?? b.background, [b.title, ctx.category].filter(Boolean).join(' '), b.image && !b.video ? false : true),
      height: oneOf(b.height || b.size, ['full', 'tall', 'medium', 'short'], 'tall'),
      align: oneOf(b.align, ['bottom', 'center'], 'bottom'),
      overlay: oneOf(b.overlay, ['dark', 'brand', 'light', 'none'], 'dark'),
      buttons: buttons(b.buttons || (b.cta ? [isObj(b.cta) ? b.cta : { label: b.cta, action: b.action }] : []), ctx),
      badge: T(b.badge, '', 30),
      chips: items(b.chips || b.highlights || b.meta, (x) => {
        const label = T(x.label || x.title || x.text || x.name, '', 28);
        return label ? { label, icon: x.icon ? normIcon(x.icon, label) : '' } : null;
      }, 4),
    };
  },
  search(b) {
    return { placeholder: T(b.placeholder || b.title || b.label, 'Rechercher…', 50), action: normAction(b.action), filter: bool(b.filter ?? b.filters, true) };
  },
  chips(b) {
    const it = items(b.items || b.chips || b.options || b.categories, (x) => {
      const label = T(x.label || x.title || x.name, '', 24);
      return label ? { label, icon: x.icon ? normIcon(x.icon, label) : '' } : null;
    }, 12);
    return { items: it.length ? it : [{ label: 'Tout', icon: '' }, { label: 'Populaire', icon: '' }, { label: 'Nouveau', icon: '' }], selected: clamp(num(b.selected, 0), 0, 11) };
  },
  segmented(b) {
    const it = arr(b.items || b.tabs || b.options, 4).map((x) => T(isObj(x) ? x.label || x.title : x, '', 20)).filter(Boolean);
    return { items: it.length >= 2 ? it : ['En cours', 'Terminées'], selected: 0 };
  },
  categories(b, ctx) {
    const it = items(b.items || b.categories, (x) => {
      const label = T(x.label || x.title || x.name, '', 24);
      if (!label) return null;
      const o = { label, icon: normIcon(x.icon, label, 'layout-grid'), action: normAction(x.action ?? x.to ?? null) };
      if (x.image) o.image = normImage(x.image, label);
      if (x.color) o.color = normalizeColor(x.color, undefined);
      return o;
    }, 12);
    return { title: T(b.title, '', 50), action: normAction(b.action), columns: clamp(num(b.columns, 4), 2, 5), style: oneOf(b.style, ['icon', 'image', 'pill'], it.some((x) => x.image) ? 'image' : 'icon'), items: it };
  },
  actions(b) {
    const it = items(b.items || b.actions, (x) => {
      const label = T(x.label || x.title || x.name, '', 22);
      return label ? { label, icon: normIcon(x.icon, label, 'zap'), action: normAction(x.action ?? x.to ?? null) } : null;
    }, 8);
    return { title: T(b.title, '', 50), items: it, columns: clamp(num(b.columns, 4), 2, 4) };
  },
  carousel(b, ctx) {
    return {
      title: T(b.title, '', 50),
      subtitle: T(b.subtitle, '', 80),
      action: normAction(b.action ?? b.seeAll ?? null),
      style: oneOf(b.style || b.variant, ['card', 'wide', 'poster', 'circle', 'compact'], 'card'),
      items: items(b.items || b.cards || b.products, (x, i) => itemCommon(x, i, ctx, { needImage: true, hint: b.title || ctx.category }), 12),
    };
  },
  products(b, ctx) {
    return {
      title: T(b.title, '', 50),
      action: normAction(b.action ?? b.seeAll ?? null),
      columns: clamp(num(b.columns, 2), 1, 2),
      cart: bool(b.cart ?? b.addToCart, true),
      items: items(b.items || b.products || b.dishes, (x, i) => itemCommon(x, i, ctx, { needImage: true, hint: b.title || ctx.category }), 16),
    };
  },
  list(b, ctx) {
    return {
      title: T(b.title, '', 50),
      action: normAction(b.action ?? b.seeAll ?? null),
      style: oneOf(b.style || b.variant, ['plain', 'card', 'inset'], 'inset'),
      items: items(b.items || b.rows || b.transactions || b.orders, (x, i) => {
        const it = itemCommon(x, i, ctx);
        delete it.price;
        if (x.icon) it.icon = normIcon(x.icon, it.title);
        if (x.avatar !== undefined) it.avatar = normAvatar(x.avatar, it.title);
        const amount = num(x.amount ?? x.montant, NaN, -1e9, 1e9);
        if (Number.isFinite(amount)) {
          it.amount = Math.round(amount);
          if (x.neutral === true) it.neutral = true;
        }
        else if (x.price !== undefined && P(x.price) !== null) {
          it.amount = P(x.price);
          it.neutral = true;
        }
        const value = T(x.value || x.trailing || x.right || x.status, '', 26);
        if (value) it.value = value;
        if (x.unread || x.new) it.unread = true;
        return it;
      }, 20),
    };
  },
  feed(b, ctx) {
    return {
      items: items(b.items || b.posts, (x, i) => {
        const author = T(x.author || x.name || x.user, 'Membre', 40);
        return {
          author,
          avatar: normAvatar(x.avatar, author),
          time: T(x.time || x.date, 'il y a 2 h', 24),
          text: T(x.text || x.content || x.caption || x.title, '', 280),
          media: x.media || x.image || x.video ? normMedia(x.media ?? x.video ?? x.image, x.text || ctx.category, !!x.video) : null,
          likes: Math.round(num(x.likes, 12 + ((i * 37) % 180), 0, 1e7)),
          comments: Math.round(num(x.comments, 2 + ((i * 7) % 30), 0, 1e6)),
          tag: T(x.tag, '', 24),
        };
      }, 10),
    };
  },
  promo(b, ctx) {
    return {
      eyebrow: T(b.eyebrow || b.tag, '', 30),
      title: T(b.title, 'Offre spéciale', 70),
      subtitle: T(b.subtitle || b.text, '', 120),
      code: T(b.code || b.promoCode, '', 16),
      cta: cta(b.cta || (b.button ? b.button : null), b.action ? { label: 'J\'en profite', action: normAction(b.action) } : null),
      media: b.media || b.image || b.video ? normMedia(b.media ?? b.video ?? b.image, b.title, !!b.video) : null,
      tone: oneOf(b.tone || b.color || b.variant, ['primary', 'accent', 'dark', 'gradient', 'light'], 'gradient'),
    };
  },
  text(b) {
    return { eyebrow: T(b.eyebrow, '', 40), title: T(b.title || b.heading, '', 120), text: T(b.text || b.body || b.content || b.description, '', 600), align: oneOf(b.align, ['left', 'center'], 'left'), size: oneOf(b.size, ['sm', 'md', 'lg', 'xl'], 'md') };
  },
  features(b) {
    return {
      title: T(b.title, '', 60),
      layout: oneOf(b.layout, ['grid', 'list'], 'grid'),
      items: items(b.items || b.features, (x) => {
        const title = T(x.title || x.label || x.name, '', 40);
        return title ? { icon: normIcon(x.icon, title, 'sparkles'), title, text: T(x.text || x.description || x.subtitle, '', 110) } : null;
      }, 6),
    };
  },
  notice(b) {
    return { icon: normIcon(b.icon, b.title, 'info'), title: T(b.title, '', 60), text: T(b.text || b.message || b.description, '', 200), tone: oneOf(b.tone || b.type, ['info', 'success', 'warning', 'brand'], 'brand'), action: normAction(b.action) };
  },
  faq(b) {
    return { title: T(b.title, 'Questions fréquentes', 60), items: items(b.items || b.questions, (x) => { const q = T(x.q || x.question || x.title, '', 120); return q ? { q, a: T(x.a || x.answer || x.text, '', 400) } : null; }, 8) };
  },
  reviews(b, ctx) {
    const it = items(b.items || b.reviews, (x, i) => {
      const author = T(x.author || x.name || x.user, 'Client', 40);
      return { author, avatar: normAvatar(x.avatar, author), rating: clamp(Math.round(num(x.rating, 5)), 1, 5), text: T(x.text || x.comment || x.content, '', 240), date: T(x.date || x.time, '', 24) };
    }, 8);
    return { title: T(b.title, 'Avis clients', 60), rating: Math.round(num(b.rating, 4.8, 0, 5) * 10) / 10, count: Math.round(num(b.count, 128 + it.length * 11, 0, 1e7)), items: it };
  },
  button(b) {
    const label = T(b.label || b.title || b.text, 'Continuer', 40);
    const sec = isObj(b.secondary) ? cta(b.secondary) : null;
    return { label, action: normAction(b.action ?? b.to ?? b.screen ?? null), style: oneOf(b.style || b.variant, ['primary', 'secondary', 'outline', 'ghost'], 'primary'), icon: b.icon ? normIcon(b.icon, label) : '', secondary: sec };
  },
  detail(b, ctx) {
    const title = T(b.title || b.name, '', 80);
    const images = arr(b.images || b.gallery, 6).map((x) => normImage(x, title)).filter(Boolean);
    return {
      fromItem: bool(b.fromItem ?? b.dynamic, true),
      title: title || 'Produit',
      subtitle: T(b.subtitle || b.category || b.vendorName, '', 80),
      price: P(b.price),
      oldPrice: P(b.oldPrice ?? b.old_price),
      rating: Number.isFinite(num(b.rating, NaN)) ? clamp(num(b.rating, 4.8), 0, 5) : 4.8,
      reviews: Math.round(num(b.reviews ?? b.reviewCount, 124, 0, 1e7)),
      badge: T(b.badge, '', 22),
      media: normMedia(b.media ?? b.video ?? b.image, [title, ctx.category].join(' '), !!b.video),
      images,
      description: T(b.description || b.text || b.about, '', 600),
      options: items(b.options || b.variants, (o) => {
        const name = T(o.name || o.label || o.title, '', 24);
        const values = arr(o.values || o.options || o.items, 8).map((x) => T(isObj(x) ? x.label || x.name : x, '', 20)).filter(Boolean);
        return name && values.length ? { name, values, type: /coul|color/i.test(name) ? 'colors' : 'chips' } : null;
      }, 3),
      features: items(b.features || b.highlights, (x) => { const label = T(x.label || x.title || x.text || x.name, '', 40); return label ? { icon: normIcon(x.icon, label, 'check'), label } : null; }, 6),
      quantity: bool(b.quantity ?? b.qty, true),
      cta: cta(b.cta || b.button, { label: 'Ajouter au panier', action: { type: 'addToCart' } }),
      vendor: isObj(b.vendor) ? { name: T(b.vendor.name, '', 40), subtitle: T(b.vendor.subtitle || b.vendor.role, '', 60), avatar: normAvatar(b.vendor.avatar, b.vendor.name) } : null,
    };
  },
  cart(b, ctx) {
    return {
      title: T(b.title, 'Mon panier', 40),
      items: items(b.items || b.demoItems, (x, i) => ({ ...itemCommon(x, i, ctx, { needImage: true, hint: ctx.category }), qty: clamp(Math.round(num(x.qty ?? x.quantity, 1)), 1, 20) }), 6),
      fee: P(b.fee ?? b.deliveryFee ?? b.shipping) ?? 0,
      feeLabel: T(b.feeLabel, b.fee || b.deliveryFee ? 'Livraison' : 'Frais de service', 30),
      checkoutAction: normAction(b.checkoutAction ?? b.action ?? 'checkout'),
      ctaLabel: T(b.ctaLabel || b.cta?.label || b.cta, 'Commander', 30),
    };
  },
  checkout(b) {
    const methods = arr(b.methods || b.paymentMethods, 5)
      .map((m) => deaccent(String(isObj(m) ? m.id || m.name || m.label : m).toLowerCase()).replace(/[\s-]+/g, '_'))
      .map((m) => (/wave/.test(m) ? 'wave' : /orange|^om$/.test(m) ? 'orange_money' : /free|mixx|yas/.test(m) ? 'free_money' : /card|carte|visa|master/.test(m) ? 'card' : /cash|espece|livraison|delivery/.test(m) ? 'cash' : null))
      .filter(Boolean);
    return {
      title: T(b.title, 'Paiement', 40),
      amount: P(b.amount ?? b.total),
      summary: items(b.summary || b.lines, (x) => { const label = T(x.label || x.title || x.name, '', 40); return label ? { label, value: T(x.value ?? x.amount ?? x.price, '', 30) } : null; }, 6),
      methods: methods.length ? [...new Set(methods)] : ['wave', 'orange_money', 'free_money', 'card'],
      successAction: normAction(b.successAction ?? b.onSuccess ?? b.action ?? 'success'),
      merchant: T(b.merchant || b.business, '', 40),
    };
  },
  success(b) {
    return {
      title: T(b.title, 'Paiement confirmé !', 60),
      subtitle: T(b.subtitle || b.text || b.message, '', 200),
      illustration: T(b.illustration, 'success', 20),
      details: items(b.details || b.summary || b.lines, (x) => { const label = T(x.label || x.title, '', 40); return label ? { label, value: T(x.value, '', 40) } : null; }, 6),
      buttons: buttons(b.buttons || (b.cta ? [isObj(b.cta) ? b.cta : { label: b.cta, action: b.action }] : []), {}),
      confetti: bool(b.confetti, true),
    };
  },
  plans(b) {
    return {
      title: T(b.title, '', 60),
      subtitle: T(b.subtitle, '', 120),
      items: items(b.items || b.plans || b.offers, (x, i) => {
        const name = T(x.name || x.title || x.label, '', 30);
        if (!name) return null;
        return {
          name,
          price: P(x.price) ?? 0,
          period: T(x.period || x.interval, '/mois', 16),
          features: arr(x.features || x.benefits, 6).map((f) => T(isObj(f) ? f.label || f.text : f, '', 60)).filter(Boolean),
          highlight: bool(x.highlight ?? x.popular ?? x.featured, false),
          badge: T(x.badge, x.highlight || x.popular ? 'Populaire' : '', 20),
          cta: cta(x.cta || x.button, { label: 'Choisir', action: normAction(x.action ?? 'checkout') }),
        };
      }, 4),
    };
  },
  booking(b, ctx) {
    const slots = arr(b.slots || b.times || b.hours, 16).map((x) => T(isObj(x) ? x.time || x.label : x, '', 8)).filter(Boolean);
    const svc = isObj(b.service) ? b.service : null;
    return {
      title: T(b.title, 'Choisis ton créneau', 50),
      service: svc ? { title: T(svc.title || svc.name, '', 60), price: P(svc.price), duration: T(svc.duration, '', 20), image: normImage(svc.image, svc.title || ctx.category) } : null,
      days: clamp(Math.round(num(b.days, 7)), 3, 14),
      slots: slots.length ? slots : ['09:00', '10:30', '11:00', '14:00', '15:30', '16:00', '17:30', '18:00'],
      unavailable: arr(b.unavailable || b.booked, 12).map((x) => T(x, '', 8)).filter(Boolean),
      staff: items(b.staff || b.team || b.experts, (x) => { const name = T(x.name || x.title, '', 30); return name ? { name, role: T(x.role || x.subtitle, '', 30), avatar: normAvatar(x.avatar, name) } : null; }, 5),
      cta: cta(b.cta || b.button, { label: 'Confirmer le rendez-vous', action: normAction(b.action ?? 'checkout') }),
    };
  },
  tracking(b) {
    const c = isObj(b.courier || b.driver) ? b.courier || b.driver : {};
    const cname = T(c.name, 'Moussa D.', 30);
    return {
      title: T(b.title, 'Ta commande arrive', 60),
      status: T(b.status, 'En route', 40),
      eta: T(b.eta || b.time, '12 min', 20),
      from: T(b.from, '', 40),
      to: T(b.to || b.address, '', 50),
      steps: items(b.steps || b.timeline, (x, i) => { const label = T(x.label || x.title, '', 40); return label ? { label, time: T(x.time, '', 12), done: bool(x.done ?? x.completed, i < 2) } : null; }, 5),
      courier: { name: cname, avatar: normAvatar(c.avatar, cname), vehicle: T(c.vehicle || c.car || c.plate, 'Moto · DK 2451 A', 40), rating: clamp(num(c.rating, 4.9), 0, 5), phone: T(c.phone, '', 20) },
    };
  },
  map(b) {
    return { title: T(b.title, '', 50), caption: T(b.caption || b.subtitle || b.address, '', 80), height: clamp(num(b.height, 200), 120, 420), route: bool(b.route, false), pins: items(b.pins || b.markers || b.places, (x) => { const label = T(x.label || x.title || x.name, '', 30); return label ? { label, sub: T(x.sub || x.subtitle || x.price, '', 30) } : null; }, 6) };
  },
  timeline(b) {
    return { title: T(b.title, '', 50), items: items(b.items || b.steps, (x, i) => { const title = T(x.title || x.label, '', 60); return title ? { title, subtitle: T(x.subtitle || x.text, '', 100), time: T(x.time || x.date, '', 20), done: bool(x.done ?? x.completed, i < 2), icon: x.icon ? normIcon(x.icon, title) : '' } : null; }, 8) };
  },
  ticket(b) {
    return { title: T(b.title, 'Ton billet', 60), subtitle: T(b.subtitle, '', 80), date: T(b.date, '', 30), time: T(b.time, '', 12), place: T(b.place || b.location || b.venue, '', 60), seat: T(b.seat || b.zone, '', 20), holder: T(b.holder || b.name, '', 40), code: T(b.code || b.reference, 'DFR-' + (hash(String(b.title)) % 900000 + 100000), 20), price: P(b.price), qr: bool(b.qr, true) };
  },
  countdown(b) {
    const secs = num(b.seconds, NaN) || num(b.minutes, NaN) * 60 || num(b.hours, NaN) * 3600 || 2 * 3600 + 14 * 60;
    return { title: T(b.title, '', 60), label: T(b.label || b.subtitle, 'Fin de l\'offre dans', 50), seconds: clamp(Math.round(secs), 60, 30 * 86400) };
  },
  contact(b) {
    const phone = T(b.phone, '+221 77 000 00 00', 24);
    return { title: T(b.title, 'Nous contacter', 50), phone, whatsapp: T(b.whatsapp, phone, 24), address: T(b.address, 'Dakar, Sénégal', 80), hours: T(b.hours, '', 50), email: T(b.email, '', 60) };
  },
  balance(b, ctx) {
    return {
      label: T(b.label || b.title, 'Solde disponible', 40),
      amount: Math.round(num(b.amount ?? b.balance ?? b.value, 245000, -1e10, 1e10)),
      trend: T(b.trend || b.change, '', 20),
      number: T(b.number || b.cardNumber, '', 24),
      holder: T(b.holder || b.name, '', 40),
      style: oneOf(b.style, ['card', 'plain'], 'card'),
      actions: items(b.actions, (x) => { const label = T(x.label || x.title, '', 16); return label ? { label, icon: normIcon(x.icon, label, 'send'), action: normAction(x.action ?? x.to ?? null) } : null; }, 4),
    };
  },
  stats(b) {
    return {
      title: T(b.title, '', 50),
      items: items(b.items || b.stats || b.kpis, (x) => {
        const label = T(x.label || x.title || x.name, '', 30);
        if (!label) return null;
        const n = num(x.value, NaN, -1e12, 1e12);
        return { label, value: Number.isFinite(n) ? n : T(x.value, '—', 16), prefix: T(x.prefix, '', 6), suffix: T(x.suffix || x.unit, '', 10), trend: T(x.trend || x.change, '', 12), icon: x.icon ? normIcon(x.icon, label) : '' };
      }, 4),
    };
  },
  chart(b) {
    let series = arr(b.series || b.data || b.values, 24).map((x) => num(isObj(x) ? x.value ?? x.y : x, NaN)).filter(Number.isFinite);
    if (series.length < 3) series = [12, 18, 15, 22, 28, 24, 34];
    const labels = arr(b.labels, 24).map((x) => T(x, '', 8));
    const ct = oneOf(b.chartType || b.variant || b.kind || b.style, ['area', 'bar', 'line'], null) || oneOf(b.type, ['area', 'bar', 'line'], 'area');
    return { title: T(b.title, '', 50), value: T(b.value, '', 24), change: T(b.change || b.trend, '', 12), period: T(b.period, '', 30), chartType: ct, series, labels: labels.length === series.length ? labels : [] };
  },
  progress(b) {
    const max = num(b.max ?? b.target ?? b.goal, 100, 1, 1e12);
    return { title: T(b.title, '', 50), label: T(b.label || b.subtitle, '', 80), value: clamp(num(b.value ?? b.current, max * 0.64, 0, 1e12), 0, max), max, unit: T(b.unit, '', 10), style: oneOf(b.style, ['ring', 'bar'], 'ring') };
  },
  form(b) {
    const fields = items(b.fields || b.inputs, (x) => {
      const label = T(x.label || x.name || x.title, '', 40);
      if (!label) return null;
      return { label, type: oneOf(x.type, ['text', 'phone', 'email', 'select', 'textarea', 'date', 'number', 'password'], /t[eé]l|phone|num[eé]ro/i.test(label) ? 'phone' : 'text'), placeholder: T(x.placeholder, '', 50), options: arr(x.options, 8).map((o) => T(isObj(o) ? o.label : o, '', 30)).filter(Boolean), value: T(x.value, '', 60) };
    }, 8);
    return { title: T(b.title, '', 60), subtitle: T(b.subtitle, '', 140), fields: fields.length ? fields : [{ label: 'Nom complet', type: 'text', placeholder: 'Awa Diop', options: [], value: '' }, { label: 'Téléphone', type: 'phone', placeholder: '77 123 45 67', options: [], value: '' }], submit: cta(b.submit || b.cta || b.button, { label: 'Envoyer', action: normAction(b.action) || { type: 'toast', message: 'Envoyé avec succès ✓' } }) };
  },
  auth(b) {
    return { title: T(b.title, 'Bienvenue 👋', 60), subtitle: T(b.subtitle, 'Connecte-toi avec ton numéro de téléphone', 120), method: oneOf(b.method, ['phone', 'email'], 'phone'), action: normAction(b.action ?? b.next ?? 'home') || normAction('home'), social: bool(b.social, true), terms: T(b.terms, '', 140) };
  },
  profile(b, ctx) {
    const name = T(b.name || b.title, ctx.userName || 'Awa Diop', 40);
    return { name, subtitle: T(b.subtitle || b.email || b.phone, '+221 77 123 45 67', 60), avatar: normAvatar(b.avatar, name), badge: T(b.badge || b.level, '', 24), stats: items(b.stats, (x) => { const label = T(x.label || x.title, '', 20); return label ? { label, value: T(x.value, '0', 12) } : null; }, 3) };
  },
  settings(b) {
    const rawGroups = b.groups || b.sections || (b.items ? [{ title: b.title, items: b.items }] : []);
    const groups = items(rawGroups, (g) => {
      const it = items(g.items || g.rows || g.options, (x) => {
        const label = T(x.label || x.title || x.name, '', 40);
        if (!label) return null;
        const o = { label, icon: normIcon(x.icon, label, 'chevron-right') };
        if (x.value !== undefined && typeof x.value !== 'boolean') o.value = T(x.value, '', 24);
        if (typeof x.toggle === 'boolean' || typeof x.value === 'boolean' || x.type === 'toggle' || x.switch !== undefined) o.toggle = bool(x.toggle ?? x.value ?? x.switch, true);
        const act = normAction(x.action ?? x.to ?? null);
        if (act) o.action = act;
        if (x.danger || /d[ée]connex|logout|supprimer/i.test(label)) o.danger = true;
        if (x.badge) o.badge = T(x.badge, '', 10);
        return o;
      }, 10);
      return it.length ? { title: T(g.title, '', 40), items: it } : null;
    }, 5);
    return { groups };
  },
  chat(b) {
    const c = isObj(b.contact) ? b.contact : {};
    const name = T(c.name || b.name || b.title, 'Support', 40);
    const msgs = items(b.messages || b.conversation, (x) => {
      const text = T(x.text || x.message || x.content, '', 300);
      if (!text) return null;
      const from = /^(me|user|moi|client|sent|outgoing)$/i.test(String(x.from || x.sender || x.role || '')) ? 'me' : 'them';
      return { from, text, time: T(x.time, '', 10) };
    }, 12);
    return {
      contact: { name, status: T(c.status || b.status, 'En ligne', 30), avatar: normAvatar(c.avatar, name) },
      messages: msgs,
      replies: arr(b.replies || b.autoReplies, 6).map((x) => T(x, '', 200)).filter(Boolean),
      quick: arr(b.quick || b.suggestions || b.quickReplies, 4).map((x) => T(isObj(x) ? x.label : x, '', 30)).filter(Boolean),
      placeholder: T(b.placeholder, 'Écris un message…', 40),
    };
  },
  onboarding(b, ctx) {
    const slides = items(b.slides || b.items || b.pages, (x, i) => {
      const title = T(x.title, '', 70);
      if (!title) return null;
      const illu = T(x.illustration, '', 20);
      return { title, text: T(x.text || x.subtitle || x.description, '', 160), media: illu && !x.media && !x.image && !x.video ? null : normMedia(x.media ?? x.video ?? x.image, title + ' ' + ctx.category, i === 0 || !!x.video), illustration: illu };
    }, 4);
    return { slides: slides.length ? slides : [{ title: ctx.appName, text: 'Bienvenue', media: normMedia(null, ctx.category, true), illustration: '' }], action: normAction(b.action ?? b.next ?? b.done ?? 'auth'), cta: T(b.cta || b.ctaLabel, 'Commencer', 24), skip: bool(b.skip, true) };
  },
  stories(b) {
    return { items: items(b.items || b.stories, (x, i) => { const name = T(x.name || x.title || x.label, '', 20); return name ? { name, image: normImage(x.image ?? x.avatar, name) } : null; }, 10) };
  },
  video(b, ctx) {
    return { title: T(b.title, '', 70), subtitle: T(b.subtitle || b.text, '', 120), duration: T(b.duration, '', 10), style: oneOf(b.style, ['card', 'full', 'reel'], 'card'), media: normMedia(b.media ?? b.video ?? b.src ?? b.url, [b.title, ctx.category].join(' '), true) };
  },
  gallery(b, ctx) {
    const imgs = arr(b.images || b.items || b.photos, 9).map((x) => normImage(x, b.title || ctx.category)).filter(Boolean);
    return { title: T(b.title, '', 50), layout: oneOf(b.layout, ['grid', 'masonry', 'strip'], 'masonry'), images: imgs.length ? imgs : [1, 2, 3, 4].map((i) => normImage(null, (b.title || ctx.category) + ' ' + i)) };
  },
  illustration(b) {
    return { name: oneOf(b.name || b.illustration || b.kind, ['delivery', 'payment', 'booking', 'shopping', 'success', 'health', 'learning', 'growth', 'chat', 'location', 'gift', 'security', 'empty'], 'empty'), title: T(b.title, '', 70), text: T(b.text || b.subtitle, '', 160), cta: cta(b.cta || b.button, null) };
  },
  spacer(b) {
    return { size: clamp(num(b.size ?? b.height, 16), 4, 80), line: bool(b.line ?? b.divider, false) };
  },
  editorial(b, ctx) {
    const a = isObj(b.author) ? b.author : b.author ? { name: b.author } : null;
    const aname = a ? T(a.name, '', 40) : '';
    return {
      eyebrow: T(b.eyebrow || b.kicker, '', 40),
      number: T(b.number || b.index, '', 4),
      title: T(b.title || b.heading || b.quote, ctx.appName, 140),
      text: T(b.text || b.body || b.subtitle || b.description, '', 320),
      author: aname ? { name: aname, role: T(a.role || a.subtitle, '', 50), avatar: normAvatar(a.avatar, aname) } : null,
      image: b.image || b.media ? normImage(isObj(b.media) ? b.media.image || b.media.src || b.media.q : b.image ?? b.media, b.title || ctx.category) : '',
      caption: T(b.caption, '', 50),
      align: oneOf(b.align, ['left', 'center'], 'left'),
      tone: oneOf(b.tone || b.style || b.variant, ['plain', 'surface', 'dark'], 'plain'),
      size: oneOf(b.size, ['md', 'lg', 'xl'], 'lg'),
      cta: cta(b.cta || b.button, b.action ? { label: 'Découvrir', action: normAction(b.action) } : null),
    };
  },
  showcase(b, ctx) {
    return {
      eyebrow: T(b.eyebrow || b.kicker, '', 40),
      title: T(b.title, '', 60),
      action: normAction(b.action ?? b.seeAll ?? null),
      style: oneOf(b.style || b.variant, ['tall', 'square'], 'tall'),
      items: items(b.items || b.cards || b.products, (x, i) => itemCommon(x, i, ctx, { needImage: true, hint: b.title || ctx.category }), 10),
    };
  },
  bento(b, ctx) {
    const it = items(b.items || b.tiles || b.cells, (x, i) => {
      const kind = oneOf(x.kind || x.type || x.variant, ['image', 'stat', 'text', 'feature'], x.image ? 'image' : x.value !== undefined ? 'stat' : x.icon ? 'feature' : 'text');
      const title = T(x.title || x.label || x.name, '', 70);
      const o = { kind, title, text: T(x.text || x.subtitle || x.description, '', 120), span: clamp(Math.round(num(x.span ?? x.cols, 1)), 1, 2), tall: bool(x.tall ?? x.rows === 2, false), icon: x.icon ? normIcon(x.icon, title) : '' };
      if (kind === 'image') o.image = normImage(x.image ?? x.media, title || ctx.category) || normImage(null, title || ctx.category);
      if (kind === 'stat') {
        const n = num(x.value, NaN, -1e12, 1e12);
        o.value = Number.isFinite(n) ? n : T(x.value, '—', 12);
        o.suffix = T(x.suffix || x.unit, '', 8);
      }
      const act = normAction(x.action ?? x.to ?? null);
      if (act) o.action = act;
      return title || o.text || kind === 'image' ? o : null;
    }, 8);
    return { eyebrow: T(b.eyebrow, '', 40), title: T(b.title, '', 60), items: it };
  },
  marquee(b) {
    const it = arr(b.items || b.words || b.text && String(b.text).split(/[·•|,]/), 12).map((x) => T(isObj(x) ? x.label || x.title : x, '', 30)).filter(Boolean);
    return { items: it.length ? it : ['Nouveau', 'Fait à Dakar', 'Livré vite'], tone: oneOf(b.tone || b.color, ['plain', 'primary', 'accent', 'dark'], 'primary'), style: oneOf(b.style, ['solid', 'outline'], 'solid'), size: oneOf(b.size, ['sm', 'md'], 'md'), tilt: bool(b.tilt ?? b.rotate, false), speed: clamp(num(b.speed, 1), 0.3, 3) };
  },
  team(b) {
    return {
      eyebrow: T(b.eyebrow, '', 40),
      title: T(b.title, 'Notre équipe', 60),
      items: items(b.items || b.members || b.staff, (x) => {
        const name = T(x.name || x.title, '', 30);
        if (!name) return null;
        const r = num(x.rating, NaN, 0, 5);
        return { name, role: T(x.role || x.subtitle || x.job, '', 40), avatar: normAvatar(x.avatar ?? x.image ?? x.photo, name), rating: Number.isFinite(r) ? Math.round(r * 10) / 10 : null, action: normAction(x.action ?? null) };
      }, 8),
    };
  },
  quote(b) {
    const author = T(b.author || b.name, 'Client fidèle', 40);
    const r = num(b.rating, NaN, 0, 5);
    return { text: T(b.text || b.quote || b.title, 'Un service exceptionnel.', 220), author, role: T(b.role || b.subtitle, '', 50), avatar: normAvatar(b.avatar, author), rating: Number.isFinite(r) ? Math.round(r) : 5 };
  },
};

export function canonicalType(t) {
  if (typeof t !== 'string') return null;
  const k = t.trim();
  if (BLOCK_TYPES.includes(k)) return k;
  const low = deaccent(k.toLowerCase()).replace(/[^a-z_]/g, '');
  if (BLOCK_TYPES.includes(low)) return low;
  const flat = low.replace(/_/g, '');
  if (BLOCK_ALIASES[flat]) return BLOCK_ALIASES[flat];
  if (BLOCK_ALIASES[low]) return BLOCK_ALIASES[low];
  for (const bt of BLOCK_TYPES) if (flat.includes(bt) && bt.length > 3) return bt;
  return null;
}

function normBlock(raw, ctx, warnings) {
  if (!isObj(raw)) return null;
  let type = canonicalType(raw.type || raw.block || raw.component || raw.kind);
  let b = isObj(raw.props) ? { ...raw.props, ...raw } : raw;
  if (!type) {
    if (Array.isArray(b.items) && b.items.length) type = 'list';
    else if (b.title || b.text) type = 'text';
    else {
      warnings.push(`Bloc inconnu ignoré (${String(raw.type).slice(0, 30)})`);
      return null;
    }
  }
  try {
    const out = B[type](b, ctx);
    if (out.eyebrow === undefined && (b.eyebrow || b.kicker)) out.eyebrow = T(b.eyebrow || b.kicker, '', 40);
    return { type, id: slugify(b.id || `${type}-${ctx.blockIndex}`, `${type}-${ctx.blockIndex}`), ...out };
  } catch (e) {
    warnings.push(`Bloc ${type} réparé (${e?.message || 'erreur'})`);
    return null;
  }
}

function normHeader(h, screenTitle, isFirst) {
  const o = isObj(h) ? h : typeof h === 'string' ? { style: h } : {};
  const style = oneOf(o.style || o.type || o.variant, ['large', 'compact', 'greeting', 'transparent', 'none'], isFirst ? 'large' : 'compact');
  return {
    style,
    title: T(o.title, screenTitle, 50),
    subtitle: T(o.subtitle || o.location || o.greeting, '', 70),
    actions: items(o.actions || o.buttons || o.icons, (x) => {
      const icon = normIcon(x.icon || x.label || x.name, x.label, 'bell');
      return { icon, action: normAction(x.action ?? x.to ?? null), badge: T(x.badge, '', 4) };
    }, 3),
  };
}

// ---------- Point d'entrée ----------
export function normalizeSpec(input, opts = {}) {
  const warnings = [];
  let raw = parseLoose(input);
  if (!raw) {
    warnings.push('Spec illisible : maquette vide créée');
    raw = {};
  }
  raw = unwrap(raw);

  // --- méta
  const m = isObj(raw.meta) ? raw.meta : {};
  const appName = T(m.name || raw.name || raw.appName || raw.title, opts.fallbackName || 'Mon App', 32);
  const tagline = T(m.tagline || raw.tagline || m.slogan, '', 90);
  let category = oneOf(m.category || raw.category, CATEGORIES, null);
  const meta = { name: appName, tagline, description: T(m.description || raw.description, '', 300), category: 'generic', locale: 'fr', currency: T(m.currency || raw.currency, 'FCFA', 6) };

  // --- thème
  const th = isObj(raw.theme) ? raw.theme : {};
  const palette = PALETTES.find((p) => p.id === th.palette) || null;
  const mode = oneOf(th.mode || (th.dark === true ? 'dark' : null), ['light', 'dark'], palette?.mode || 'light');
  const primary = normalizeColor(th.primary || th.primaryColor || th.brand || th.color || palette?.primary, PALETTES[0].primary);
  const theme = {
    mode,
    primary,
    accent: normalizeColor(th.accent || th.secondary || th.accentColor || palette?.accent, undefined),
    background: normalizeColor(th.background || th.bg || palette?.background, undefined),
    font: FONTS[th.font] ? th.font : FONTS[th.bodyFont] ? th.bodyFont : 'Plus Jakarta Sans',
    headingFont: FONTS[th.headingFont] ? th.headingFont : FONTS[th.titleFont] ? th.titleFont : FONTS[th.font] ? th.font : 'Plus Jakarta Sans',
    radius: clamp(Math.round(num(th.radius ?? th.borderRadius ?? th.corners, 18)), 0, 32),
    style: oneOf(th.style || th.dna, STYLES, 'soft'),
  };
  if (!theme.accent) delete theme.accent;
  if (!theme.background) delete theme.background;
  // un fond clair en mode sombre (ou l'inverse) est ignoré
  if (theme.background && (require_lum(theme.background) < 0.4) !== (mode === 'dark')) delete theme.background;

  // --- écrans
  let rawScreens = raw.screens || raw.pages || raw.views || [];
  if (isObj(rawScreens)) rawScreens = Object.entries(rawScreens).map(([id, s]) => (isObj(s) ? { id, ...s } : { id }));
  rawScreens = arr(rawScreens, MAX_SCREENS).filter(isObj);

  const allText = [appName, tagline, meta.description, JSON.stringify(rawScreens).slice(0, 4000)].join(' ');
  if (!category) category = detectCategory(allText);
  meta.category = category;
  const ctx = { appName, category, userName: T(raw.user?.name, '', 30), blockIndex: 0 };

  const usedIds = new Set();
  const screens = [];
  rawScreens.forEach((s, si) => {
    const title = T(s.title || s.name || s.label, `Écran ${si + 1}`, 40);
    let id = slugify(s.id || s.key || title, `ecran-${si + 1}`);
    while (usedIds.has(id)) id = id + '-' + (si + 1);
    usedIds.add(id);
    let rawBlocks = s.blocks || s.components || s.sections || s.content || s.children || [];
    if (isObj(rawBlocks)) rawBlocks = Object.values(rawBlocks);
    const blocks = [];
    arr(rawBlocks, MAX_BLOCKS).forEach((rb, bi) => {
      ctx.blockIndex = bi;
      const nb = normBlock(rb, ctx, warnings);
      if (nb) blocks.push(nb);
    });
    // ids de blocs uniques dans l'écran
    const seen = new Set();
    blocks.forEach((b, i) => {
      if (seen.has(b.id)) b.id = `${b.id}-${i}`;
      seen.add(b.id);
    });
    const isOnboarding = blocks[0]?.type === 'onboarding';
    const header = normHeader(s.header ?? s.appBar ?? s.navbar, title, si === 0);
    if (isOnboarding || blocks[0]?.type === 'auth' || (blocks[0]?.type === 'success' && blocks.length <= 2)) header.style = 'none';
    // Fiche détail / bannière en tête : en-tête flottant transparent (plus premium)
    if (header.style === 'compact' && (blocks[0]?.type === 'detail' || (blocks[0]?.type === 'hero' && si > 0))) header.style = 'transparent';
    let footer = null;
    const f = s.footer || s.bottomBar || s.stickyCta;
    if (f) {
      const c = cta(f, null);
      if (c) footer = { ...c, sublabel: T(f.sublabel || f.subtitle || f.note, '', 50), price: P(f.price ?? f.amount) };
    }
    screens.push({
      id,
      title,
      header,
      blocks,
      footer,
      background: oneOf(s.background, ['default', 'surface'], 'default'),
      presentation: oneOf(s.presentation || s.transition, ['push', 'modal', 'fade'], 'push'),
      tab: s.tab === true || s.inTabBar === true,
    });
  });

  if (!screens.length) {
    warnings.push('Aucun écran : écran d\'accueil ajouté');
    screens.push({
      id: 'accueil', title: 'Accueil', header: { style: 'large', title: appName, subtitle: '', actions: [] }, footer: null, background: 'default', presentation: 'push', tab: false,
      blocks: [{ type: 'hero', id: 'hero-0', ...B.hero({ title: appName, subtitle: tagline }, ctx) }, { type: 'features', id: 'features-1', ...B.features({ items: [{ title: 'Rapide', icon: 'zap' }, { title: 'Fiable', icon: 'shield-check' }] }) }],
    });
  }

  const byId = new Map(screens.map((s) => [s.id, s]));
  const hasBlock = (type) => screens.find((s) => s.blocks.some((b) => b.type === type));

  // --- flux : un panier sans écran de paiement -> on ajoute le paiement
  if (hasBlock('cart') && !hasBlock('checkout')) {
    const sid = byId.has('paiement') ? 'paiement-2' : 'paiement';
    const s = { id: sid, title: 'Paiement', header: { style: 'compact', title: 'Paiement', subtitle: '', actions: [] }, footer: null, background: 'default', presentation: 'push', tab: false, blocks: [{ type: 'checkout', id: 'checkout-0', ...B.checkout({}) }] };
    screens.push(s);
    byId.set(sid, s);
  }
  // --- flux : écran de confirmation pour le paiement
  if (hasBlock('checkout') && !hasBlock('success')) {
    const sid = byId.has('succes') ? 'succes-2' : 'succes';
    const s = { id: sid, title: 'Confirmation', header: { style: 'none', title: 'Confirmation', subtitle: '', actions: [] }, footer: null, background: 'default', presentation: 'fade', tab: false, blocks: [{ type: 'success', id: 'success-0', ...B.success({ buttons: [{ label: 'Retour à l\'accueil', action: 'home' }] }) }] };
    screens.push(s);
    byId.set(sid, s);
  }

  // --- résolution des cibles d'actions
  const titleIndex = new Map(screens.map((s) => [slugify(s.title), s.id]));
  const intentTarget = (key) => {
    for (const [re, type] of INTENTS) {
      if (!re.test(key)) continue;
      if (type === 'home') return screens.find((s) => s.tab)?.id || homeCandidate();
      const s = hasBlock(type) || screens.find((x) => x.id.includes(type));
      if (s) return s.id;
    }
    return null;
  };
  function homeCandidate() {
    return (screens.find((s) => /accueil|home/.test(s.id)) || screens.find((s) => !['onboarding', 'auth'].includes(s.blocks[0]?.type)) || screens[0]).id;
  }
  const fixTarget = (to) => {
    if (typeof to !== 'string') return null;
    const k = slugify(to, '');
    if (byId.has(to)) return to;
    if (byId.has(k)) return k;
    if (titleIndex.has(k)) return titleIndex.get(k);
    for (const s of screens) if (k && (s.id.startsWith(k) || k.startsWith(s.id))) return s.id;
    return intentTarget(deaccent(String(to).toLowerCase()));
  };
  const fixAction = (a) => {
    if (!isObj(a)) return null;
    if (['navigate', 'tab', 'modal'].includes(a.type)) {
      const t = fixTarget(a.to) || (/(auth|login|connexion|home|accueil|start|onboard|main)/i.test(String(a.to)) ? homeCandidate() : null);
      if (t) return { ...a, to: t };
      return { type: 'toast', message: 'Bientôt disponible ✨' };
    }
    return ACTION_TYPES.includes(a.type) ? a : null;
  };
  const walkActions = (node, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 8) return;
    if (Array.isArray(node)) return node.forEach((n) => walkActions(n, depth + 1));
    for (const k of Object.keys(node)) {
      if (/action$/i.test(k) && (isObj(node[k]) || node[k] === null)) {
        node[k] = fixAction(node[k]);
        if (node[k] === null) delete node[k];
      } else if (node[k] && typeof node[k] === 'object') walkActions(node[k], depth + 1);
    }
  };
  screens.forEach((s) => walkActions(s));

  // --- onglets
  let tabs = items(raw.tabs || raw.tabBar || raw.navigation?.tabs || raw.bottomNav, (t) => {
    const target = fixTarget(t.screen || t.to || t.id || t.target || t.label);
    if (!target) return null;
    const label = T(t.label || t.title || byId.get(target)?.title, 'Onglet', 16);
    return { label, icon: normIcon(t.icon, label, 'circle-check'), screen: target };
  }, 5);
  const seenTab = new Set();
  tabs = tabs.filter((t) => !seenTab.has(t.screen) && seenTab.add(t.screen));
  if (tabs.length === 0) {
    const flagged = screens.filter((s) => s.tab);
    if (flagged.length >= 2) tabs = flagged.slice(0, 5).map((s) => ({ label: s.title.slice(0, 16), icon: normIcon(null, s.title + ' ' + s.id, 'circle-check'), screen: s.id }));
  }
  if (tabs.length === 1) tabs = [];
  const tabSet = new Set(tabs.map((t) => t.screen));
  screens.forEach((s) => {
    s.tab = tabSet.has(s.id);
    if (s.tab && s.header.style === 'compact') s.header.style = 'large';
  });

  // --- écran initial
  let initial = fixTarget(raw.initial || raw.initialScreen || raw.start || raw.home || '') || screens[0].id;
  if (!byId.has(initial)) initial = screens[0].id;

  const spec = { version: 1, meta, theme, tabs, initial, screens, user: { name: ctx.userName || 'Awa Diop' } };

  if (opts.resolveMedia !== false) resolveSpecMedia(spec, { resolver: opts.mediaResolver });
  return { spec, warnings };
}

// luminance simple (évite une dépendance circulaire)
function require_lum(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Valide une spec déjà normalisée (utilisé par le studio avant sauvegarde)
export function safeSpec(spec) {
  try {
    return normalizeSpec(spec, { resolveMedia: true }).spec;
  } catch {
    return normalizeSpec({}, {}).spec;
  }
}
