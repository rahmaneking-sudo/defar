// QA automatisée : ouvre chaque modèle, visite chaque écran, clique sur tout,
// et échoue à la moindre erreur JavaScript. Usage : node tools/qa-engine.mjs [baseUrl]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
let pw;
try {
  pw = require('playwright');
} catch {
  pw = require(process.env.PW_PATH || '/home/claude/.npm-global/lib/node_modules/playwright');
}
const { chromium } = pw;

const BASE = process.argv[2] || 'http://localhost:4173';
const CATS = (process.env.CATS || 'delivery,restaurant,beauty,fashion,shop,grocery,health,education,fitness,transport,realestate,events,finance,agriculture,services,travel,social,generic').split(',');
const SHOTS = process.env.SHOTS; // dossier de captures (optionnel)
const CLICKS = Number(process.env.CLICKS || 14);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 520, height: 960 }, deviceScaleFactor: 1 });
let totalErrors = 0;
const report = [];

for (const cat of CATS) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (/Failed to load resource|net::ERR|ERR_TUNNEL|ERR_NAME|status of 4\d\d|status of 5\d\d/.test(t)) return; // médias externes (hors ligne en test)
      errors.push('console: ' + t);
    }
  });
  await page.goto(`${BASE}/render?tpl=${cat}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__player && window.__spec, null, { timeout: 15000 });
  const screens = await page.evaluate(() => window.__spec.screens.map((s) => s.id));
  let clicks = 0;
  for (const id of screens) {
    await page.evaluate((sid) => window.__player.navigate(sid), id);
    await page.waitForTimeout(650);
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}/${cat}-${id}.png` });
    }
    // clique sur les éléments interactifs visibles de l'écran
    const n = await page.evaluate(() => {
      const root = window.__player.root();
      return [...root.querySelectorAll('button, [data-tour], [role=button]')].filter((e) => e.getClientRects().length).length;
    });
    for (let i = 0; i < Math.min(n, CLICKS); i++) {
      await page.evaluate(
        ({ sid, i }) => {
          const p = window.__player;
          if (p.current() !== sid) p.navigate(sid);
          const root = p.root();
          const els = [...root.querySelectorAll('button, [data-tour], [role=button]')].filter((e) => e.getClientRects().length);
          const el = els[i];
          if (el && !el.disabled) el.click();
        },
        { sid: id, i }
      );
      clicks++;
      await page.waitForTimeout(120);
    }
    // ferme d'éventuelles feuilles bloquées
    await page.keyboard.press('Escape').catch(() => {});
  }
  // parcours d'achat complet si possible
  const flow = await page.evaluate(async () => {
    const p = window.__player;
    const spec = window.__spec;
    const find = (t) => spec.screens.find((s) => s.blocks.some((b) => b.type === t))?.id;
    const out = [];
    const checkout = find('checkout');
    if (!checkout) return 'pas de paiement';
    p.navigate(checkout);
    await new Promise((r) => setTimeout(r, 700));
    const ok = await p.tap('[data-tour="pay-button"]', { hold: 50 });
    out.push('pay:' + ok);
    await new Promise((r) => setTimeout(r, 400));
    await p.tap('button:has(> span)', { hold: 10 }).catch(() => {});
    // remplit le PIN si nécessaire, puis attend la confirmation
    const pin = p.root().querySelector('[data-tour="pin-1"]');
    if (pin) for (const k of ['1', '2', '3', '4']) p.root().querySelector(`[data-tour="pin-${k}"]`)?.click();
    const demo = [...p.root().querySelectorAll('button')].find((b) => /J'ai validé/.test(b.textContent));
    demo?.click();
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const cur = p.current();
      if (spec.screens.find((s) => s.id === cur)?.blocks.some((b) => b.type === 'success')) return out.concat('success:' + cur).join(' ');
    }
    return out.concat('fin:' + p.current()).join(' ');
  });
  await page.waitForTimeout(300);
  report.push(`${cat.padEnd(12)} écrans=${screens.length} clics=${clicks} achat=[${flow}] erreurs=${errors.length}`);
  if (errors.length) report.push('   ' + [...new Set(errors)].slice(0, 6).join('\n   '));
  totalErrors += errors.length;
  await page.close();
}
await browser.close();
console.log(report.join('\n'));
console.log(totalErrors ? `\n✗ ${totalErrors} erreur(s)` : '\n✓ Aucune erreur');
process.exit(totalErrors ? 1 : 0);
