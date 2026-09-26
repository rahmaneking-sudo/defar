// Domaine des sites publiés (ex. defar.sn -> salon-awa.defar.sn). Vide = adresse /s/nom
export const SITES_DOMAIN = (import.meta.env.VITE_SITES_DOMAIN || '').replace(/^\.+|\/+$/g, '');

// Sous-domaine d'un site publié quand VITE_SITES_DOMAIN est défini
export function siteFromHost() {
  if (!SITES_DOMAIN || typeof location === 'undefined') return null;
  const h = location.hostname.toLowerCase();
  if (!h.endsWith('.' + SITES_DOMAIN)) return null;
  const sub = h.slice(0, -(SITES_DOMAIN.length + 1));
  return sub && sub !== 'www' && !sub.includes('.') ? sub : null;
}
