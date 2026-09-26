// Image de couverture d'une maquette (vignettes de l'espace client, aperçus WhatsApp).
import { imageSrc, videoSources } from './media.js';

export function specCover(spec, w = 1200) {
  let img = null;
  let poster = null;
  const walk = (o, key) => {
    if (img || !o) return;
    if (typeof o === 'string') {
      if (!/(image|src|poster|cover|photo|images)/i.test(key || '')) return;
      if (o.startsWith('mx:')) {
        poster ||= videoSources(o)?.poster || null;
        return;
      }
      if (/\.(mp4|webm|mov)(\?|#|$)/i.test(o)) return;
      if (o.startsWith('u:') || /^https?:\/\//.test(o)) img = imageSrc(o, w);
      return;
    }
    if (Array.isArray(o)) return o.forEach((x) => walk(x, key));
    if (typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, k);
  };
  for (const s of spec?.screens || []) {
    walk(s.blocks, 'blocks');
    if (img) break;
  }
  return String(img || poster || '').slice(0, 1000);
}
