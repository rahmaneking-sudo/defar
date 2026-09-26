// GET /api/og?slug=… : page d'aperçu pour WhatsApp, Facebook, Telegram…
// (les robots de prévisualisation n'exécutent pas le JavaScript : on leur sert
// directement le titre, la description et l'image du site publié).
import { publicSite, cloudOn } from './_lib/supabase.js';
import { originOf } from './_lib/http.js';
import { specCover } from '../shared/cover.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function GET(request) {
  const url = new URL(request.url);
  const slug = String(url.searchParams.get('slug') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const origin = originOf(request);
  const page = `${origin}/s/${slug}`;
  const site = slug && cloudOn() ? await publicSite(slug).catch(() => null) : null;
  const spec = site?.spec;
  const title = spec?.meta?.name || site?.name || 'Défar';
  const desc = spec?.meta?.tagline || (site ? `Découvre ${title} en ligne.` : 'Crée ton site en quelques minutes avec Défar.');
  const image = (spec && specCover(spec, 1200)) || `${origin}/media/hero-poster.jpg`;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(title)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(page)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(page)}?v=1">
</head><body><a href="${esc(page)}">${esc(title)}</a></body></html>`;
  return new Response(html, { status: site ? 200 : 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=300' } });
}
