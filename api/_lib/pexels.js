// Médias pertinents via l'API Pexels (gratuite) quand PEXELS_API_KEY est définie.
// Sinon, la bibliothèque intégrée prend le relais automatiquement.
import { isPlaceholder } from '../../shared/media.js';

const MAX_QUERIES = 12;

function collect(spec) {
  const out = new Map();
  const walk = (node, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 12) return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, depth + 1));
    for (const [k, v] of Object.entries(node)) {
      const ph = isPlaceholder(v) ? v : k === 'media' && v && isPlaceholder(v.src) ? v.src : null;
      if (ph && !ph.avatar) {
        const key = `${ph.kind === 'video' ? 'v' : 'i'}|${ph.q.toLowerCase().trim()}`;
        if (!out.has(key)) out.set(key, ph);
      } else if (v && typeof v === 'object') walk(v, depth + 1);
    }
  };
  walk(spec);
  return out;
}

async function search(key, ph, apiKey) {
  const video = ph.kind === 'video';
  const url = video
    ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(ph.q)}&per_page=6&size=medium`
    : `https://api.pexels.com/v1/search?query=${encodeURIComponent(ph.q)}&per_page=8`;
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 6000);
  try {
    const res = await fetch(url, { headers: { authorization: apiKey }, signal: c.signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (video) {
      const vids = data.videos || [];
      const v = vids[Math.floor(Math.random() * Math.min(3, vids.length))];
      if (!v) return null;
      const files = (v.video_files || []).filter((f) => f.file_type === 'video/mp4' && f.width >= 540 && f.width <= 1920).sort((a, b) => Math.abs(a.width - 1080) - Math.abs(b.width - 1080));
      const f = files[0] || (v.video_files || [])[0];
      return f?.link ? { src: f.link, poster: v.image } : null;
    }
    const photos = data.photos || [];
    const p = photos[Math.floor(Math.random() * Math.min(4, photos.length))];
    return p?.src?.large ? { src: p.src.large, poster: undefined } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Renvoie une fonction "resolver" utilisable par resolveSpecMedia
export async function pexelsResolver(spec) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;
  const phs = [...collect(spec).entries()];
  // priorité aux vidéos et aux premiers visuels (bannières, onboarding)
  phs.sort((a, b) => (a[1].kind === 'video' ? -1 : 0) - (b[1].kind === 'video' ? -1 : 0));
  const picked = phs.slice(0, MAX_QUERIES);
  const found = new Map();
  await Promise.all(
    picked.map(async ([key, ph]) => {
      const r = await search(key, ph, apiKey);
      if (r) found.set(key, r);
    })
  );
  if (!found.size) return null;
  return (ph) => {
    const r = found.get(`${ph.kind === 'video' ? 'v' : 'i'}|${ph.q.toLowerCase().trim()}`);
    if (!r) return null;
    return ph.kind === 'video' ? r : r.src;
  };
}
