// Tests automatisés (sans navigateur) : npm test
// Normaliseur (fuzz + idempotence), modèles, paiements (signatures, webhooks),
// repli IA (fetch simulé) et fonctions API (Request -> Response).
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { normalizeSpec } from '../shared/normalize.js';
import { BLOCK_TYPES } from '../shared/constants.js';
import { TEMPLATES, generateLocal } from '../shared/generator/index.js';

let pass = 0;
let fail = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    pass++;
  } catch (e) {
    fail++;
    failures.push(`✗ ${name}\n    ${e?.stack?.split('\n').slice(0, 3).join('\n    ') || e}`);
  }
}
const ENV0 = { ...process.env };
const resetEnv = () => {
  for (const k of Object.keys(process.env)) if (!(k in ENV0)) delete process.env[k];
  Object.assign(process.env, ENV0);
};

// ───────── Vérifie qu'une spec normalisée est saine ─────────
const SCREEN_ACTIONS = new Set(['navigate', 'tab', 'modal']);
function checkSpec(spec) {
  assert.ok(spec && Array.isArray(spec.screens) && spec.screens.length >= 1, 'au moins un écran');
  const ids = new Set(spec.screens.map((s) => s.id));
  assert.equal(ids.size, spec.screens.length, 'identifiants d\'écran uniques');
  assert.ok(ids.has(spec.initial), 'écran initial existant');
  for (const t of spec.tabs) assert.ok(ids.has(t.screen), `onglet vers un écran existant (${t.screen})`);
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    if (typeof o.type === 'string' && SCREEN_ACTIONS.has(o.type) && typeof o.to === 'string') assert.ok(ids.has(o.to), `action vers un écran existant (${o.to})`);
    Object.values(o).forEach(walk);
  };
  for (const s of spec.screens) {
    assert.ok(Array.isArray(s.blocks), 'blocs = tableau');
    for (const b of s.blocks) assert.ok(BLOCK_TYPES.includes(b.type), `type de bloc connu (${b.type})`);
    walk(s.blocks);
    walk(s.header);
    walk(s.footer);
  }
  assert.ok(/^#[0-9a-f]{6}$/i.test(spec.theme.primary), 'couleur principale valide');
}

// ───────── Générateur pseudo-aléatoire pour le fuzz ─────────
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const junk = (d = 0) => {
  const r = rnd();
  if (d > 3) return pick([null, 1, 'x', true, '', -5]);
  if (r < 0.15) return null;
  if (r < 0.25) return Math.round(rnd() * 1e6) * (rnd() < 0.2 ? -1 : 1);
  if (r < 0.4) return pick(['', 'hello', '<script>alert(1)</script>', 'accueil', 'panier', '12 500 FCFA', '#ff0000', 'navigate:detail', '💥'.repeat(3), 'a'.repeat(900)]);
  if (r < 0.5) return rnd() < 0.5;
  if (r < 0.7) return Array.from({ length: Math.floor(rnd() * 5) }, () => junk(d + 1));
  const o = {};
  for (let i = 0; i < 1 + Math.floor(rnd() * 6); i++) o[pick(['type', 'title', 'items', 'action', 'media', 'price', 'blocks', 'screens', 'to', 'header', 'style', 'image', 'value', 'label', 'id'])] = junk(d + 1);
  return o;
};
const randomSpec = () => ({
  meta: rnd() < 0.8 ? { name: junk(3), category: pick(['delivery', 'beauty', 'nope', null]) } : junk(1),
  theme: rnd() < 0.7 ? { primary: pick(['#abc', 'red', 'rgb(1,2,3)', 'nope', '#12345G', null]), mode: pick(['dark', 'light', 'x']), font: pick(['Inter', 'Comic', null]) } : junk(1),
  tabs: rnd() < 0.6 ? [{ label: 'A', screen: pick(['accueil', 'x', null]) }, junk(2)] : junk(1),
  screens: rnd() < 0.85
    ? Array.from({ length: Math.floor(rnd() * 6) }, (_, i) => ({ id: pick([`s${i}`, 'accueil', '', null, 'accueil']), title: junk(3), header: junk(2), blocks: Array.from({ length: Math.floor(rnd() * 7) }, () => ({ type: pick([...BLOCK_TYPES, 'banner', 'lookbook', 'ticker', 'unknown', '', null, 'Hero Video']), ...junk(1) })) }))
    : junk(1),
  initial: junk(3),
});

// ════════════════════════ 1. Normaliseur ════════════════════════
await test('normaliseur : entrées absurdes → spec valide, jamais d\'exception', () => {
  for (const x of [null, undefined, 0, '', 'bonjour', '{"screens":', [], [1, 2], { screens: 'x' }, { screens: [null, 1, 'a'] }, '```json\n{"meta":{"name":"Test"},"screens":[{"id":"a","blocks":[{"type":"hero"}]}]}\n```']) {
    const { spec } = normalizeSpec(x);
    checkSpec(spec);
  }
});
await test('normaliseur : fuzz 400 specs aléatoires', () => {
  for (let i = 0; i < 400; i++) {
    const { spec } = normalizeSpec(randomSpec());
    checkSpec(spec);
  }
});
await test('normaliseur : idempotent sur les 18 modèles', () => {
  for (const cat of Object.keys(TEMPLATES)) {
    const a = normalizeSpec(generateLocal(`app ${cat}`, { category: cat })).spec;
    const b = normalizeSpec(JSON.parse(JSON.stringify(a))).spec;
    assert.deepEqual(b, a, `idempotence (${cat})`);
  }
});
await test('normaliseur : idempotent sur 100 specs aléatoires', () => {
  for (let i = 0; i < 100; i++) {
    const a = normalizeSpec(randomSpec()).spec;
    const b = normalizeSpec(JSON.parse(JSON.stringify(a))).spec;
    assert.deepEqual(b, a);
  }
});
await test('normaliseur : HTML retiré des textes', () => {
  const { spec } = normalizeSpec({ screens: [{ id: 'a', blocks: [{ type: 'text', title: '<img src=x onerror=alert(1)>Salut', text: '<b>gras</b>' }] }] });
  const b = spec.screens[0].blocks[0];
  assert.ok(!/[<>]/.test(b.title + b.text));
});
await test('normaliseur : panier sans paiement → écrans paiement + confirmation ajoutés', () => {
  const { spec } = normalizeSpec({ screens: [{ id: 'accueil', blocks: [{ type: 'products', items: [{ title: 'A', price: 1000 }] }] }, { id: 'panier', blocks: [{ type: 'cart' }] }] });
  const types = spec.screens.flatMap((s) => s.blocks.map((b) => b.type));
  assert.ok(types.includes('checkout') && types.includes('success'));
  checkSpec(spec);
});
await test('normaliseur : alias des nouveaux blocs signature', () => {
  const { spec } = normalizeSpec({ screens: [{ id: 'a', blocks: [{ type: 'lookbook', items: [{ title: 'X' }] }, { type: 'ticker', items: ['a', 'b'] }, { type: 'testimonial', text: 'Top' }, { type: 'staff', items: [{ name: 'Awa' }] }, { type: 'mosaic', items: [{ title: 'T', value: 3 }] }, { type: 'statement', title: 'Hé *oui*' }] }] });
  assert.deepEqual(spec.screens[0].blocks.map((b) => b.type), ['showcase', 'marquee', 'quote', 'team', 'bento', 'editorial']);
});

// ════════════════════════ 2. Modèles ════════════════════════
await test('modèles : 18 métiers valides avec paiement et confirmation', () => {
  assert.equal(Object.keys(TEMPLATES).length, 18);
  for (const cat of Object.keys(TEMPLATES)) {
    const { spec } = normalizeSpec(generateLocal(`app ${cat}`, { category: cat }));
    checkSpec(spec);
    const types = new Set(spec.screens.flatMap((s) => s.blocks.map((b) => b.type)));
    if (cat !== 'social') assert.ok(types.has('checkout') && types.has('success'), `${cat} : parcours de paiement`);
    assert.ok(spec.screens.length >= 4, `${cat} : assez d'écrans`);
  }
});
await test('modèles : détection du métier depuis une idée libre', () => {
  const cases = { 'livraison de thiéboudienne à Dakar': 'delivery', 'salon de tresses et coiffure': 'beauty', 'tontine entre amis': 'finance', 'clinique dentaire avec rendez-vous': 'health', 'billetterie de concerts': 'events' };
  for (const [idea, cat] of Object.entries(cases)) assert.equal(normalizeSpec(generateLocal(idea)).spec.meta.category, cat, idea);
});

// ════════════════════════ 3. Paiements ════════════════════════
const pay = await import('../api/_lib/payments.js');
await test('liens de paiement : signature valide / montant modifié / expiré', () => {
  process.env.PAY_LINK_SECRET = 'test-secret';
  const p = { a: 15000, d: 'Acompte', m: 'Glow', r: 'CMD-1', x: '' };
  const s = pay.signLink(p);
  assert.ok(s.length >= 16);
  assert.equal(pay.verifyLink({ ...p, s }).ok, true);
  assert.equal(pay.verifyLink({ ...p, a: 100, s }).ok, false, 'montant modifié refusé');
  assert.equal(pay.verifyLink({ ...p }).ok, false, 'lien non signé refusé');
  const past = { ...p, x: String(Math.floor(Date.now() / 1000) - 60) };
  assert.equal(pay.verifyLink({ ...past, s: pay.signLink(past) }).ok, false, 'lien expiré refusé');
  resetEnv();
});
await test('liens de paiement : sans secret, tout lien est accepté (mode simple)', () => {
  delete process.env.PAY_LINK_SECRET;
  delete process.env.ADMIN_PASSWORD;
  assert.equal(pay.verifyLink({ a: 5000 }).ok, true);
  resetEnv();
});
await test('webhook Wave : signature HMAC vérifiée', () => {
  process.env.WAVE_WEBHOOK_SECRET = 'wave_sn_WHS_test';
  const body = JSON.stringify({ type: 'checkout.session.completed', data: { payment_status: 'succeeded', amount: '15000' } });
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET).update(t + body).digest('hex');
  assert.equal(pay.verifyWaveWebhook(body, `t=${t},v1=${sig}`), true);
  assert.equal(pay.verifyWaveWebhook(body + ' ', `t=${t},v1=${sig}`), false, 'corps modifié');
  assert.equal(pay.verifyWaveWebhook(body, `t=${t},v1=${'0'.repeat(64)}`), false, 'mauvaise signature');
  const old = t - 60 * 60 * 24 * 10;
  const sigOld = crypto.createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET).update(old + body).digest('hex');
  assert.equal(pay.verifyWaveWebhook(body, `t=${old},v1=${sigOld}`), false, 'trop ancien');
  assert.equal(pay.verifyWaveWebhook(body, ''), false);
  resetEnv();
});
await test('IPN PayDunya : décodage data[...] et hash SHA-512', () => {
  const o = pay.parseBracketForm('data[invoice][token]=abc&data[status]=completed&data[custom_data][reference]=DFR-1&data[hash]=zz');
  assert.equal(o.data.invoice.token, 'abc');
  assert.equal(o.data.status, 'completed');
  assert.equal(o.data.custom_data.reference, 'DFR-1');
  assert.equal(pay.sha512('abc').length, 128);
});
await test('routage des moyens de paiement selon les clés', () => {
  for (const k of ['WAVE_API_KEY', 'PAYDUNYA_MASTER_KEY', 'PAYDUNYA_PRIVATE_KEY', 'PAYDUNYA_TOKEN']) delete process.env[k];
  assert.equal(pay.routeFor('wave'), 'sim');
  process.env.WAVE_API_KEY = 'x';
  assert.equal(pay.routeFor('wave'), 'wave');
  assert.equal(pay.routeFor('orange_money'), 'sim');
  Object.assign(process.env, { PAYDUNYA_MASTER_KEY: 'm', PAYDUNYA_PRIVATE_KEY: 'p', PAYDUNYA_TOKEN: 't' });
  assert.equal(pay.routeFor('orange_money'), 'paydunya');
  assert.equal(pay.paymentConfig().mode, 'live');
  resetEnv();
});

// ════════════════════════ 4. Fonctions API ════════════════════════
const req = (url, init = {}) => new Request(`http://localhost${url}`, { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
await test('API /pay/create : simulation, montant invalide, lien falsifié', async () => {
  resetEnv();
  const { POST } = await import('../api/pay/create.js');
  let r = await POST(req('/api/pay/create', { method: 'POST', body: JSON.stringify({ a: 15000, d: 'Test', method: 'orange_money', phone: '771234567' }) }));
  let j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.provider, 'sim');
  assert.ok(j.url.includes('/pay/simulateur?'));
  r = await POST(req('/api/pay/create', { method: 'POST', body: JSON.stringify({ a: 50 }) }));
  assert.equal(r.status, 400);
  process.env.WAVE_API_KEY = 'x';
  process.env.PAY_LINK_SECRET = 's';
  r = await POST(req('/api/pay/create', { method: 'POST', body: JSON.stringify({ a: 15000, method: 'wave', s: 'faux' }) }));
  assert.equal(r.status, 403, 'lien falsifié refusé en mode réel');
  r = await POST(req('/api/pay/create', { method: 'POST', body: JSON.stringify({ a: 15000, method: 'wave', demo: 1 }) }));
  j = await r.json();
  assert.equal(j.provider, 'sim', 'la démo reste simulée même en mode réel');
  resetEnv();
});
await test('API /pay/status et /pay/config', async () => {
  const { GET } = await import('../api/pay/status.js');
  let j = await (await GET(req('/api/pay/status?p=sim&ok=1&a=5000&ref=R1'))).json();
  assert.equal(j.status, 'paid');
  assert.equal(j.simulated, true);
  j = await (await GET(req('/api/pay/status?p=sim&ok=0'))).json();
  assert.equal(j.status, 'failed');
  j = await (await GET(req('/api/pay/status?token=abc'))).json();
  assert.equal(j.status, 'unknown', 'PayDunya non configuré');
  const cfg = await import('../api/pay/config.js');
  j = await (await cfg.GET(req('/api/pay/config?a=5000&d=x'))).json();
  assert.equal(j.mode, 'simulation');
  assert.equal(j.link.ok, true);
  assert.ok(!JSON.stringify(j).includes('secret'));
});
await test('API /pay/link : mot de passe admin requis, lien signé vérifiable', async () => {
  const { POST } = await import('../api/pay/link.js');
  let r = await POST(req('/api/pay/link', { method: 'POST', body: JSON.stringify({ amount: 5000 }) }));
  assert.equal(r.status, 400, 'pas d\'ADMIN_PASSWORD');
  process.env.ADMIN_PASSWORD = 'motdepasse';
  r = await POST(req('/api/pay/link', { method: 'POST', headers: { 'x-admin-key': 'faux' }, body: JSON.stringify({ amount: 5000 }) }));
  assert.equal(r.status, 401);
  r = await POST(req('/api/pay/link', { method: 'POST', headers: { 'x-admin-key': 'motdepasse' }, body: JSON.stringify({ amount: 5000, description: 'Acompte', days: 7 }) }));
  const j = await r.json();
  assert.equal(r.status, 200);
  const u = new URL(j.url);
  const p = Object.fromEntries(u.searchParams);
  assert.equal(pay.verifyLink({ a: p.a, d: p.d || '', m: p.m || '', r: p.r || '', x: p.x || '', s: p.s }).ok, true);
  resetEnv();
});
await test('API webhooks : signatures invalides rejetées', async () => {
  process.env.WAVE_WEBHOOK_SECRET = 'x';
  process.env.PAYDUNYA_MASTER_KEY = 'm';
  const w = await import('../api/pay/webhook-wave.js');
  let r = await w.POST(req('/api/pay/webhook-wave', { method: 'POST', body: '{}', headers: { 'wave-signature': 't=1,v1=00' } }));
  assert.equal(r.status, 401);
  const p = await import('../api/pay/webhook-paydunya.js');
  r = await p.POST(new Request('http://localhost/api/pay/webhook-paydunya', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'data[hash]=faux&data[status]=completed' }));
  assert.equal(r.status, 401);
  r = await p.POST(new Request('http://localhost/api/pay/webhook-paydunya', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `data[hash]=${pay.sha512('m')}&data[status]=completed` }));
  assert.equal(r.status, 200, 'IPN authentique acceptée');
  resetEnv();
});

// ════════════════════════ 5. IA : repli et génération ════════════════════════
const realFetch = globalThis.fetch;
await test('IA : sans clé → modèle local, jamais d\'erreur', async () => {
  for (const k of ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'ACCESS_CODE']) delete process.env[k];
  const { POST } = await import('../api/generate.js');
  const r = await POST(req('/api/generate', { method: 'POST', headers: { 'x-forwarded-for': '10.0.0.1' }, body: JSON.stringify({ idea: 'Une app de livraison de plats à Dakar' }) }));
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.fallback, true);
  checkSpec(j.spec);
  resetEnv();
});
await test('IA : fournisseur en panne → fournisseur suivant (fetch simulé)', async () => {
  process.env.ANTHROPIC_API_KEY = 'a';
  process.env.OPENAI_API_KEY = 'o';
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_PROVIDER;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('anthropic')) return new Response(JSON.stringify({ error: { message: 'overloaded' } }), { status: 529 });
    const spec = { meta: { name: 'Teranga' }, screens: [{ id: 'accueil', blocks: [{ type: 'hero', title: 'Salut' }] }, { id: 'b', blocks: [{ type: 'text', title: 'B' }] }] };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(spec) } }] }), { status: 200 });
  };
  const { generateJson } = await import('../api/_lib/llm.js');
  const res = await generateJson({ system: 's', user: 'u', validate: (o) => Array.isArray(o.screens) });
  assert.equal(res.provider, 'openai');
  assert.equal(res.data.meta.name, 'Teranga');
  assert.ok(calls.some((u) => u.includes('anthropic')) && calls.some((u) => u.includes('openai')));
  globalThis.fetch = realFetch;
  resetEnv();
});
await test('IA : réponse JSON abîmée réparée par le normaliseur', () => {
  const broken = '```json\n{"meta":{"name":"Yoff Grill",},"screens":[{"id":"accueil","blocks":[{"type":"hero","title":"Grillades",}]},{"id":"menu","blocks":[{"type":"products","items":[{"title":"Dibi","price":"5 000 FCFA"}]}]}]\n```';
  const { spec } = normalizeSpec(broken);
  assert.equal(spec.meta.name, 'Yoff Grill');
  assert.equal(spec.screens[1].blocks[0].items[0].price, 5000);
  checkSpec(spec);
});

globalThis.fetch = realFetch;
console.log(failures.join('\n'));
console.log(`\n${fail ? '✗' : '✓'} ${pass} tests réussis, ${fail} en échec`);
process.exit(fail ? 1 : 0);
