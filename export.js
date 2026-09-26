// Exports : lien de présentation, HTML autonome, pack client (.zip), JSON.
import JSZip from 'jszip';
import { shareUrl } from '../lib/specs.js';
import { slugify } from '../../shared/utils.js';

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1500);
}

export async function copyShareLink(spec) {
  const url = shareUrl(spec);
  try {
    await navigator.clipboard.writeText(url);
    return { url, copied: true };
  } catch {
    return { url, copied: false };
  }
}

export async function buildStandaloneHtml(spec) {
  const res = await fetch('/export/player.html', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Le lecteur autonome n\'est pas encore construit (lance « npm run build »).');
  const tpl = await res.text();
  if (!tpl.includes('<!--DEFAR_SPEC-->')) throw new Error('Lecteur autonome invalide.');
  const data = JSON.stringify(spec).replace(/</g, '\\u003c');
  const title = `${spec.meta.name} — maquette interactive`;
  return tpl.replace('<!--DEFAR_SPEC-->', `<script>window.__SPEC__=${data};</script>`).replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/</g, '')}</title>`);
}

export async function downloadHtml(spec) {
  const html = await buildStandaloneHtml(spec);
  download(new Blob([html], { type: 'text/html;charset=utf-8' }), `${slugify(spec.meta.name, 'maquette')}.html`);
}

export function downloadJson(spec) {
  download(new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' }), `${slugify(spec.meta.name, 'maquette')}.json`);
}

export async function downloadClientPack(spec) {
  const html = await buildStandaloneHtml(spec);
  const zip = new JSZip();
  const slug = slugify(spec.meta.name, 'maquette');
  const folder = zip.folder(slug);
  folder.file('index.html', html);
  folder.file('maquette.json', JSON.stringify(spec, null, 2));
  folder.file(
    'LISEZMOI.txt',
    [
      `${spec.meta.name} — maquette interactive`,
      '='.repeat(40),
      '',
      '1. Ouvrir la maquette',
      '   Double-clique sur « index.html » : elle s\'ouvre dans ton navigateur,',
      '   sur ordinateur (dans un téléphone) ou sur mobile (en plein écran).',
      '   Une connexion internet est nécessaire pour les photos, vidéos et polices.',
      '',
      '2. La mettre en ligne (gratuit, 1 minute)',
      '   • Vercel : vercel.com > Add New > Project > glisse ce dossier.',
      '   • Netlify : app.netlify.com/drop > glisse ce dossier.',
      '   Tu obtiens un lien à partager par WhatsApp.',
      '',
      '3. Pour le développeur',
      '   « maquette.json » décrit tous les écrans, contenus, couleurs et parcours.',
      '   Il sert de cahier des charges visuel pour développer l\'application réelle.',
      '',
      `Écrans : ${spec.screens.map((s) => s.title).join(', ')}`,
      '',
      'Paiements : Wave, Orange Money, Mixx by Yas et carte sont simulés dans la maquette.',
    ].join('\n')
  );
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  download(blob, `${slug}-pack-client.zip`);
}
