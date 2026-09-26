// Fusionne le lecteur construit (HTML + JS + CSS) en UN seul fichier : public/export/player.html
import fs from 'node:fs';
import path from 'node:path';

const dir = 'build-player';
let html = fs.readFileSync(path.join(dir, 'player.html'), 'utf8');
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (m, href) => {
  const css = fs.readFileSync(path.join(dir, href.replace(/^\//, '')), 'utf8');
  return `<style>${css}</style>`;
});
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (m, src) => {
  const js = fs.readFileSync(path.join(dir, src.replace(/^\//, '')), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
if (!html.includes('<!--DEFAR_SPEC-->')) throw new Error('Marqueur DEFAR_SPEC manquant');
fs.mkdirSync('public/export', { recursive: true });
fs.writeFileSync('public/export/player.html', html);
console.log(`✓ Lecteur autonome : public/export/player.html (${Math.round(html.length / 1024)} Ko)`);
