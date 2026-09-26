// Visites guidées automatiques : un "doigt" virtuel utilise l'app toute seule.
// Utilisées sur la landing (démos en direct) et pour filmer les vidéos promo.
import { computeRoutes } from '../engine/context.js';

const wait = (ms, signal) =>
  new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    signal?.addEventListener('abort', () => (clearTimeout(t), rej(new Error('stop'))), { once: true });
  });

export const TOURS = {
  delivery: {
    start: 'accueil',
    steps: [
      ['wait', 1400], ['scroll', 260], ['wait', 900], ['tap', '[data-tour="add-to-cart"]', 0], ['wait', 900], ['tap', '[data-tour="add-to-cart"]', 3], ['wait', 1000],
      ['tap', '[data-tour="product-card"]', 1], ['wait', 1900], ['tap', '[data-tour="detail-cta"]'], ['wait', 1300],
      ['back'], ['wait', 900], ['tap', '[data-tour="tab-panier"]'], ['wait', 1700], ['tap', '[data-tour="cart-checkout"]'], ['wait', 1600],
      ['tap', '[data-tour="method-wave"]'], ['wait', 500], ['tap', '[data-tour="pay-button"]'], ['wait', 6200],
      ['tap', '[data-tour="success-primary"]'], ['wait', 4200],
    ],
  },
  beauty: {
    start: 'onboarding',
    steps: [
      ['wait', 1600], ['tap', '[data-tour="onboarding-next"]'], ['wait', 1400], ['tap', '[data-tour="onboarding-next"]'], ['wait', 1400], ['tap', '[data-tour="onboarding-next"]'], ['wait', 1500],
      ['scroll', 380], ['wait', 1100], ['nav', 'services'], ['wait', 1300], ['tap', '[data-tour="product-card"]', 0], ['wait', 1900], ['tap', '[data-tour="detail-cta"]'], ['wait', 1500],
      ['tap', '[data-tour="day-2"]'], ['wait', 600], ['tap', '[data-tour="slot"]', 1], ['wait', 700], ['tap', '[data-tour="booking-cta"]'], ['wait', 1600],
      ['tap', '[data-tour="method-orange_money"]'], ['wait', 500], ['tap', '[data-tour="pay-button"]'], ['wait', 6500],
    ],
  },
  finance: {
    start: 'onboarding',
    steps: [
      ['wait', 1500], ['tap', '[data-tour="onboarding-next"]'], ['wait', 1300], ['tap', '[data-tour="onboarding-next"]'], ['wait', 1300], ['tap', '[data-tour="onboarding-next"]'], ['wait', 1300],
      ['tap', '[data-tour="auth-continue"]'], ['wait', 4200], ['scroll', 420], ['wait', 1500], ['nav', 'tontines'], ['wait', 1600], ['scroll', 300], ['wait', 900],
      ['tap', '[data-tour="button-block"]'], ['wait', 1500], ['tap', '[data-tour="method-wave"]'], ['wait', 500], ['tap', '[data-tour="pay-button"]'], ['wait', 6200],
    ],
  },
};

// Visite « intelligente » pour n'importe quelle maquette (générée par l'IA ou modèle) :
// accueil → fiche → réservation / panier → paiement mobile → confirmation.
// Chaque geste est tenté puis ignoré s'il n'existe pas : jamais de blocage.
export async function smartTour(player, spec, { signal, loop = true } = {}) {
  const routes = computeRoutes(spec);
  const w = (ms) => wait(ms, signal);
  const tap = (sel, index = 0) => (signal?.aborted ? false : player.tap(sel, { index }));
  do {
    player.reset();
    const home = routes.home || spec.initial;
    player.navigate(home);
    await w(1500);
    player.scrollBy(260);
    await w(1100);
    if (await tap('[data-tour="add-to-cart"]')) await w(900);
    for (const sel of ['product-card', 'carousel-item', 'list-item']) {
      if (await tap(`[data-tour="${sel}"]`)) break;
    }
    await w(1800);
    const done = new Set();
    const tapOnce = async (cur, sels) => {
      for (const s of sels) {
        if (done.has(`${cur}:${s}`)) continue;
        if (await tap(`[data-tour="${s}"]`)) {
          done.add(`${cur}:${s}`);
          return s;
        }
      }
      return null;
    };
    for (let i = 0; i < 7 && !signal?.aborted; i++) {
      const cur = player.current();
      if (cur === routes.success) break;
      if (await tapOnce(cur, ['day-2'])) {
        await w(500);
        await tap('[data-tour="slot"]', 1);
        await w(600);
      }
      if ((await tap('[data-tour="method-wave"]')) || (await tap('[data-tour^="method-"]'))) {
        await w(500);
        if (await tap('[data-tour="pay-button"]')) {
          await w(6800);
          continue;
        }
      }
      if (await tapOnce(cur, ['booking-cta', 'detail-cta', 'cart-checkout', 'footer-cta', 'form-submit'])) {
        await w(1700);
        continue;
      }
      const next = routes.cart && cur !== routes.cart ? routes.cart : routes.checkout;
      if (!next || next === cur) break;
      if (!(await tap(`[data-tour="tab-${next}"]`))) player.navigate(next);
      await w(1600);
    }
    await w(1400);
    if (await tap('[data-tour="success-primary"]')) await w(3800);
    else await w(1500);
  } while (loop && !signal?.aborted);
}

// Choisit la meilleure visite : scénario écrit à la main si disponible, sinon visite intelligente.
export function playTour(player, spec, { signal, loop = true } = {}) {
  const cat = spec?.meta?.category;
  const t = TOURS[cat];
  const has = (id) => spec.screens.some((s) => s.id === id);
  const ok = t && (!t.start || has(t.start)) && t.steps.every(([k, a]) => k !== 'nav' || has(a));
  return (ok ? runTour(player, t, { signal, loop }) : smartTour(player, spec, { signal, loop })).catch(() => {});
}

export async function runTour(player, tour, { signal, loop = true, onStep } = {}) {
  do {
    player.reset();
    if (tour.start) player.navigate(tour.start);
    await wait(300, signal);
    for (const [kind, a, b] of tour.steps) {
      if (signal?.aborted) return;
      onStep?.(kind, a);
      if (kind === 'wait') await wait(a, signal);
      else if (kind === 'tap') await player.tap(a, { index: b || 0 });
      else if (kind === 'scroll') player.scrollBy(a);
      else if (kind === 'nav') player.navigate(a);
      else if (kind === 'back') player.back();
    }
  } while (loop && !signal?.aborted);
}
