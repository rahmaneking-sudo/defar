// Briques pour écrire les modèles de secours de manière concise.
import { PALETTES, FONT_PAIRS } from '../constants.js';
import { hash, rng, pick } from '../utils.js';

export const PEOPLE = ['Awa Diop', 'Moussa Ndiaye', 'Fatou Sow', 'Cheikh Fall', 'Aminata Ba', 'Ibrahima Sarr', 'Mariama Diallo', 'Ousmane Gueye', 'Khady Faye', 'Modou Mbaye', 'Ndeye Seck', 'Pape Diouf', 'Rokhaya Ndour', 'Babacar Cissé'];
export const QUARTIERS = ['Plateau', 'Almadies', 'Mermoz', 'Sacré-Cœur', 'Médina', 'Ouakam', 'Yoff', 'Point E', 'Parcelles Assainies', 'Liberté 6', 'Ngor', 'Grand Yoff'];

export function makeCtx(idea, { name, category, seed } = {}) {
  const r = rng(hash(`${idea}|${seed || 0}`));
  return {
    idea,
    name,
    category,
    r,
    pick: (list) => pick(list, r),
    person: (i) => PEOPLE[(hash(idea) + i) % PEOPLE.length],
    quartier: (i = 0) => QUARTIERS[(hash(idea) + i) % QUARTIERS.length],
  };
}

export const S = (id, title, blocks, extra = {}) => ({ id, title, blocks, ...extra });
export const H = (style, title, subtitle, actions) => ({ style, title, subtitle, actions: actions || [] });
export const act = (to) => ({ type: 'navigate', to });

export function theme(ctx, paletteIds, fontIds, extra = {}) {
  // Tirage unique AVANT la recherche (sinon chaque comparaison re-tire au hasard
  // et la palette retombe presque toujours sur la première de la liste).
  const pid = ctx.pick(paletteIds);
  const fid = ctx.pick(fontIds);
  const p = PALETTES.find((x) => x.id === pid) || PALETTES[0];
  const f = FONT_PAIRS.find((x) => x.id === fid) || FONT_PAIRS[0];
  return { mode: p.mode, primary: p.primary, accent: p.accent, background: p.background, font: f.body, headingFont: f.heading, radius: 20, style: 'soft', ...extra };
}

// ── Écrans communs ──
export const onboardingScreen = (ctx, slides, next = 'connexion') =>
  S('onboarding', 'Bienvenue', [{ type: 'onboarding', slides, action: next, cta: 'Commencer' }], { header: 'none' });

export const authScreen = (ctx, next = 'accueil') =>
  S('connexion', 'Connexion', [{ type: 'auth', title: `Bienvenue sur ${ctx.name} 👋`, subtitle: 'Entre ton numéro, on t\'envoie un code par SMS.', action: next }], { header: 'none' });

export const cartScreen = (ctx, { fee = 1000, feeLabel = 'Livraison', cta = 'Commander' } = {}) =>
  S('panier', 'Mon panier', [{ type: 'cart', fee, feeLabel, ctaLabel: cta, checkoutAction: 'paiement' }], { header: H('large', 'Mon panier') });

export const checkoutScreen = (ctx, { methods = ['wave', 'orange_money', 'free_money', 'card', 'cash'], title = 'Paiement' } = {}) =>
  S('paiement', title, [{ type: 'checkout', methods, successAction: 'confirmation' }], { header: H('compact', title) });

export const successScreen = (ctx, { title = 'Commande confirmée !', subtitle = 'Merci ! Tu recevras une notification à chaque étape.', buttons } = {}) =>
  S('confirmation', 'Confirmation', [{ type: 'success', title, subtitle, buttons }], { header: 'none', presentation: 'fade' });

export const chatScreen = (ctx, { name, messages, replies, quick, title = 'Messages' } = {}) =>
  S('messages', title, [{ type: 'chat', contact: { name: name || `Service client ${ctx.name}`, status: 'En ligne · répond en 2 min' }, messages, replies, quick }], { header: H('compact', title) });

export const profileScreen = (ctx, { stats, groups, badge } = {}) =>
  S('profil', 'Profil', [
    { type: 'profile', name: ctx.person(0), subtitle: '+221 77 123 45 67', badge, stats },
    {
      type: 'settings',
      groups: groups || [
        { title: 'Mon compte', items: [{ label: 'Informations personnelles', icon: 'user' }, { label: 'Moyens de paiement', icon: 'wallet', value: 'Wave' }, { label: 'Adresses', icon: 'map-pin', value: ctx.quartier(1) }] },
        { title: 'Préférences', items: [{ label: 'Notifications', icon: 'bell', toggle: true }, { label: 'Mode sombre', icon: 'moon', toggle: false }, { label: 'Langue', icon: 'languages', value: 'Français' }] },
        { title: 'Aide', items: [{ label: 'Aide sur WhatsApp', icon: 'circle-help', action: { type: 'whatsapp', phone: '221770000000' } }, { label: 'Se déconnecter', icon: 'log-out', danger: true }] },
      ],
    },
  ], { header: H('large', 'Profil') });

export const trackingScreen = (ctx, { title = 'Ta commande arrive', courier } = {}) =>
  S('suivi', 'Suivi', [
    { type: 'tracking', title, status: 'En route', eta: '12 min', to: `${ctx.quartier(2)}, Dakar`, courier: courier || { name: ctx.person(5), vehicle: 'Moto · DK 2451 AB', rating: 4.9 }, steps: [{ label: 'Confirmée', done: true }, { label: 'Préparée', done: true }, { label: 'En route', done: false }, { label: 'Livrée', done: false }] },
  ], { header: H('transparent', 'Suivi') });

export const detailScreen = (ctx, detail) => S('detail', 'Détail', [{ type: 'detail', ...detail }], { header: H('transparent', 'Détail', '', [{ icon: 'share-2', action: 'share' }]) });
