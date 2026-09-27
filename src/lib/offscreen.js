// ─────────────────────────────────────────────────────────────────────────────
// Économie d'énergie : tout ce qui est hors de l'écran s'arrête.
// Un seul observateur pour toute la page pose l'attribut data-off sur les zones
// invisibles ; le CSS (index.css) met alors leurs animations en pause.
// ─────────────────────────────────────────────────────────────────────────────
import { startTransition, useEffect, useState } from 'react';

let io = null;
function observer() {
  if (io || typeof IntersectionObserver === 'undefined') return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.removeAttribute('data-off');
        else e.target.setAttribute('data-off', '');
      }
    },
    { rootMargin: '80px 0px' }
  );
  return io;
}

// Observe un élément ; renvoie la fonction de nettoyage.
export function pauseOffscreen(el) {
  const o = observer();
  if (!el || !o) return () => {};
  o.observe(el);
  return () => {
    o.unobserve(el);
    el.removeAttribute('data-off');
  };
}

// Même chose pour une liste d'éléments (sections d'une page).
export function pauseAllOffscreen(els) {
  const stops = [...els].map(pauseOffscreen);
  return () => stops.forEach((s) => s());
}

// Réseau lent ou « économie de données » activée : pas de vidéo, l'image suffit.
export function saveData() {
  try {
    const c = typeof navigator !== 'undefined' && navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
  } catch {
    return false;
  }
}

// Téléphone ou tablette (écran tactile, pas de souris) : on allège les effets coûteux.
export const isTouch = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: none), (pointer: coarse)').matches;

// Vrai quand le navigateur est libre (après le chargement), pour lancer le non-essentiel.
export function whenIdle(fn, timeout = 1500) {
  if (typeof window === 'undefined') return () => {};
  let id = 0;
  let t = 0;
  const run = () => {
    if (typeof requestIdleCallback === 'function') id = requestIdleCallback(fn, { timeout });
    else t = setTimeout(fn, 200);
  };
  const onLoad = () => (t = setTimeout(run, 300));
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', onLoad, { once: true });
  return () => {
    window.removeEventListener('load', onLoad);
    if (id && typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
    clearTimeout(t);
  };
}

export function useIdle(timeout) {
  const [ready, setReady] = useState(false);
  useEffect(() => whenIdle(() => setReady(true), timeout), [timeout]);
  return ready;
}

// File d'attente : les éléments lourds (aperçus d'apps) se montent un par un,
// pendant les temps libres, sans jamais bloquer le défilement ni le toucher.
const queue = [];
let pumping = false;
function pump() {
  if (pumping) return;
  pumping = true;
  const step = (deadline) => {
    const next = queue.shift();
    if (next) next();
    if (queue.length) {
      if (typeof requestIdleCallback === 'function') requestIdleCallback(step, { timeout: 600 });
      else setTimeout(step, 60);
    } else pumping = false;
    void deadline;
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(step, { timeout: 600 });
  else setTimeout(step, 60);
}
export function useQueuedMount(active) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active || on) return;
    let alive = true;
    // rendu « interruptible » : React rend la main au navigateur toutes les quelques millisecondes
    const job = () => alive && startTransition(() => setOn(true));
    queue.push(job);
    pump();
    return () => {
      alive = false;
      const i = queue.indexOf(job);
      if (i >= 0) queue.splice(i, 1);
    };
  }, [active, on]);
  return on;
}
