// Tests de la base de données (supabase/schema.sql) avec le vrai client supabase-js
// contre un faux Supabase local : comptes, crédits, sites, publication, formulaires,
// admin, avis et photos. Aucune connexion Internet nécessaire.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { startMockSupabase } from '../tools/mock-supabase/server.mjs';

const mock = await startMockSupabase({ port: 54399, quiet: true });
const client = () => createClient(mock.url, mock.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

let pass = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    pass++;
  } catch (e) {
    failures.push(`✗ ${name}\n    ${e?.stack?.split('\n').slice(0, 4).join('\n    ') || e}`);
  }
}
const expectErr = (r, re) => {
  assert.ok(r.error, `erreur attendue (${re}), reçu : ${JSON.stringify(r.data)}`);
  if (re) assert.match(`${r.error.message} ${r.error.code}`, re);
};

const A = client();
const B = client();
const anon = client();
const spec = (name) => ({ meta: { name }, theme: { primary: '#ff6a3d' }, screens: [{ id: 'accueil', blocks: [] }], tabs: [] });
let ua;
let ub;
let siteA;

await test('inscription : profil créé avec 50 crédits de bienvenue', async () => {
  const r = await A.auth.signUp({ email: 'awa@test.sn', password: 'secret123', options: { data: { full_name: 'Awa Diop', phone: '771234567' } } });
  assert.ifError(r.error);
  ua = r.data.user.id;
  const p = await A.from('profiles').select('*').eq('id', ua).single();
  assert.ifError(p.error);
  assert.equal(p.data.credits, 50);
  assert.equal(p.data.full_name, 'Awa Diop');
  assert.equal(p.data.plan, 'essai');
  const ev = await A.from('credit_events').select('*');
  assert.equal(ev.data.length, 1);
  assert.equal(ev.data[0].delta, 50);
  const r2 = await B.auth.signUp({ email: 'moussa@test.sn', password: 'secret123' });
  assert.ifError(r2.error);
  ub = r2.data.user.id;
});

await test('inscription : e-mail déjà utilisé et mauvais mot de passe refusés', async () => {
  expectErr(await client().auth.signUp({ email: 'awa@test.sn', password: 'autre123' }), /already/i);
  expectErr(await client().auth.signInWithPassword({ email: 'awa@test.sn', password: 'faux' }), /invalid/i);
  const ok = await client().auth.signInWithPassword({ email: 'awa@test.sn', password: 'secret123' });
  assert.ifError(ok.error);
});

await test('profil : chacun ne voit que le sien et ne peut pas se donner de crédits', async () => {
  const seen = await B.from('profiles').select('*');
  assert.equal(seen.data.length, 1);
  assert.equal(seen.data[0].id, ub);
  expectErr(await A.from('profiles').update({ credits: 9999 }).eq('id', ua), /permission/i);
  expectErr(await A.from('profiles').update({ is_admin: true }).eq('id', ua), /permission/i);
  const up = await A.from('profiles').update({ full_name: 'Awa D.' }).eq('id', ua);
  assert.ifError(up.error);
  expectErr(await anon.from('profiles').select('*'), /permission/i);
});

await test('sites : création, lecture privée, pas de publication directe', async () => {
  siteA = crypto.randomUUID();
  const ins = await A.from('sites').insert({ id: siteA, name: 'Salon Awa', idea: 'tresses', spec: spec('Salon Awa'), cover: 'https://x/y.jpg', color: '#ff6a3d' });
  assert.ifError(ins.error);
  const mine = await A.from('sites').select('id,name,published,cover').order('updated_at', { ascending: false });
  assert.equal(mine.data.length, 1);
  assert.equal(mine.data[0].published, false);
  assert.equal((await B.from('sites').select('id')).data.length, 0);
  expectErr(await anon.from('sites').select('id'), /permission/i);
  expectErr(await A.from('sites').update({ published: true }).eq('id', siteA), /permission/i);
  expectErr(await A.from('sites').update({ slug: 'salon' }).eq('id', siteA), /permission/i);
  expectErr(await B.from('sites').insert({ name: 'x', spec: spec('x'), owner: ua }), /permission/i);
  const upd = await B.from('sites').update({ name: 'piraté' }).eq('id', siteA).select('id');
  assert.equal(upd.data?.length || 0, 0);
  const one = await A.from('sites').select('*').eq('id', siteA).maybeSingle();
  assert.equal(one.data.name, 'Salon Awa');
});

await test('publication : adresses invalides, réservées, prises ; version publiée séparée', async () => {
  expectErr(await A.rpc('publish_site', { p_site: siteA, p_slug: 'A b', p_whatsapp: null }), /ADRESSE_INVALIDE/);
  expectErr(await A.rpc('publish_site', { p_site: siteA, p_slug: 'admin', p_whatsapp: null }), /ADRESSE_RESERVEE/);
  const ok = await A.rpc('publish_site', { p_site: siteA, p_slug: 'salon-awa', p_whatsapp: '+221 77 123 45 67' });
  assert.ifError(ok.error);
  assert.equal(ok.data, 'salon-awa');
  assert.equal((await anon.rpc('slug_available', { p_slug: 'salon-awa' })).data, false);
  assert.equal((await anon.rpc('slug_available', { p_slug: 'boutique-moussa' })).data, true);
  const siteB = crypto.randomUUID();
  await B.from('sites').insert({ id: siteB, name: 'B', spec: spec('B') });
  expectErr(await B.rpc('publish_site', { p_site: siteB, p_slug: 'salon-awa' }), /ADRESSE_PRISE/);
  expectErr(await B.rpc('publish_site', { p_site: siteA, p_slug: 'vol' }), /SITE_INTROUVABLE/);
  expectErr(await anon.rpc('publish_site', { p_site: siteA, p_slug: 'vol' }), /permission|NON_CONNECTE/i);
  // brouillon modifié : le public voit toujours l'ancienne version
  await A.from('sites').update({ spec: spec('Nouveau nom') }).eq('id', siteA);
  const pub = await anon.rpc('get_public_site', { p_slug: 'salon-awa' });
  assert.ifError(pub.error);
  assert.equal(pub.data.spec.meta.name, 'Salon Awa');
  assert.equal(pub.data.whatsapp, '221771234567');
  await A.rpc('publish_site', { p_site: siteA, p_slug: 'salon-awa', p_whatsapp: null });
  const pub2 = await anon.rpc('get_public_site', { p_slug: 'SALON-AWA' });
  assert.equal(pub2.data.spec.meta.name, 'Nouveau nom');
  assert.equal(pub2.data.whatsapp, '221771234567');
  const views = await A.from('sites').select('views').eq('id', siteA).single();
  assert.equal(views.data.views, 2);
  assert.equal((await anon.rpc('get_public_site', { p_slug: 'inconnu' })).data, null);
});

await test('publication : limite de 3 sites en phase d\'essai', async () => {
  for (let i = 1; i <= 3; i++) {
    const id = crypto.randomUUID();
    await A.from('sites').insert({ id, name: `S${i}`, spec: spec(`S${i}`) });
    const r = await A.rpc('publish_site', { p_site: id, p_slug: `site-${i}` });
    if (i < 3) assert.ifError(r.error);
    else expectErr(r, /LIMITE_SITES/);
  }
});

await test('formulaires : un visiteur envoie, seul le propriétaire lit', async () => {
  const r = await anon.rpc('submit_form', { p_slug: 'salon-awa', p_kind: 'reservation', p_data: { nom: 'Fatou', telephone: '776543210', service: 'Tresses' } });
  assert.ifError(r.error);
  expectErr(await anon.rpc('submit_form', { p_slug: 'inconnu', p_kind: 'message', p_data: { a: 1 } }), /SITE_INTROUVABLE/);
  expectErr(await anon.rpc('submit_form', { p_slug: 'salon-awa', p_kind: 'message', p_data: 'texte' }), /DONNEES_INVALIDES/);
  expectErr(await anon.from('submissions').select('*'), /permission/i);
  expectErr(await anon.from('submissions').insert({ site_id: siteA, data: {} }), /permission/i);
  const mine = await A.from('submissions').select('*').order('created_at', { ascending: false });
  assert.equal(mine.data.length, 1);
  assert.equal(mine.data[0].kind, 'reservation');
  assert.equal(mine.data[0].data.nom, 'Fatou');
  assert.equal((await B.from('submissions').select('*')).data.length, 0);
  const cnt = await A.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'nouveau');
  assert.equal(cnt.count, 1);
  assert.ifError((await A.from('submissions').update({ status: 'traite' }).eq('id', mine.data[0].id)).error);
  expectErr(await A.from('submissions').update({ data: {} }).eq('id', mine.data[0].id), /permission/i);
});

await test('crédits : dépense sécurisée, jamais négative', async () => {
  const r = await A.rpc('spend_credits', { p_amount: 5, p_reason: 'Création IA' });
  assert.ifError(r.error);
  assert.equal(r.data, 45);
  expectErr(await A.rpc('spend_credits', { p_amount: 500 }), /MONTANT_INVALIDE/);
  for (let i = 0; i < 9; i++) await A.rpc('spend_credits', { p_amount: 5 });
  expectErr(await A.rpc('spend_credits', { p_amount: 1 }), /CREDITS_INSUFFISANTS/);
  assert.equal((await A.from('profiles').select('credits').eq('id', ua).single()).data.credits, 0);
  expectErr(await anon.rpc('spend_credits', { p_amount: 1 }), /permission|NON_CONNECTE/i);
});

await test('admin : fonctions réservées, ajout de crédits', async () => {
  expectErr(await A.rpc('admin_stats'), /ADMIN_SEULEMENT/);
  expectErr(await A.rpc('admin_grant_credits', { p_user: ua, p_amount: 100 }), /ADMIN_SEULEMENT/);
  await mock.sql('update public.profiles set is_admin = true where id = $1', [ua]);
  const st = await A.rpc('admin_stats');
  assert.ifError(st.error);
  assert.equal(st.data.users, 2);
  assert.equal(st.data.published, 3);
  const users = await A.rpc('admin_users', { p_search: '' });
  assert.equal(users.data.length, 2);
  assert.ok(users.data.find((u) => u.email === 'awa@test.sn').published >= 3);
  const g = await A.rpc('admin_grant_credits', { p_user: ub, p_amount: 100, p_reason: 'Testeur' });
  assert.ifError(g.error);
  assert.equal(g.data, 150);
  const ev = await B.from('credit_events').select('*').order('created_at', { ascending: false });
  assert.equal(ev.data[0].delta, 100);
  assert.ifError((await A.rpc('admin_set_plan', { p_user: ub, p_plan: 'pro' })).error);
  expectErr(await A.rpc('admin_set_plan', { p_user: ub, p_plan: 'gold' }), /FORFAIT_INVALIDE/);
  const sites = await A.rpc('admin_sites');
  assert.ok(sites.data.length >= 5);
  assert.equal((await A.from('sites').select('id')).data.length >= 5, true);
});

await test('avis : tout le monde peut en laisser, seul l\'admin les lit', async () => {
  assert.ifError((await anon.from('feedback').insert({ rating: 5, message: 'Super !', page: '/studio' })).error);
  assert.ifError((await B.from('feedback').insert({ rating: 3, message: 'Un peu lent', page: '/' })).error);
  assert.equal((await B.from('feedback').select('*')).data.length, 0);
  const all = await A.from('feedback').select('*').order('created_at', { ascending: false });
  assert.equal(all.data.length, 2);
  assert.equal(all.data.find((f) => f.rating === 3).user_id, ub);
  expectErr(await anon.from('feedback').insert({ rating: 9, message: 'x' }), /check|violates/i);
});

await test('photos : chacun envoie dans son dossier, lecture publique', async () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const up = await A.storage.from('media').upload(`${ua}/logo.png`, new Blob([png], { type: 'image/png' }), { contentType: 'image/png' });
  assert.ifError(up.error);
  const url = A.storage.from('media').getPublicUrl(`${ua}/logo.png`).data.publicUrl;
  const res = await fetch(url);
  assert.equal(res.status, 200);
  assert.equal((await res.arrayBuffer()).byteLength, png.length);
  const bad = await A.storage.from('media').upload(`${ub}/vol.png`, new Blob([png], { type: 'image/png' }), { contentType: 'image/png' });
  assert.ok(bad.error, 'écriture dans le dossier d\'un autre refusée');
  const pdf = await A.storage.from('media').upload(`${ua}/doc.pdf`, new Blob(['%PDF'], { type: 'application/pdf' }), { contentType: 'application/pdf' });
  assert.ok(pdf.error, 'type de fichier refusé');
  const anonUp = await anon.storage.from('media').upload(`x/y.png`, new Blob([png], { type: 'image/png' }));
  assert.ok(anonUp.error, 'visiteur non connecté refusé');
});

await test('dépublier et supprimer', async () => {
  assert.ifError((await A.rpc('unpublish_site', { p_site: siteA })).error);
  assert.equal((await anon.rpc('get_public_site', { p_slug: 'salon-awa' })).data, null);
  expectErr(await anon.rpc('submit_form', { p_slug: 'salon-awa', p_kind: 'message', p_data: { a: 1 } }), /SITE_INTROUVABLE/);
  await B.from('sites').delete().eq('id', siteA);
  assert.ok((await A.from('sites').select('id').eq('id', siteA)).data.length === 1, 'un autre ne peut pas supprimer');
  assert.ifError((await A.from('sites').delete().eq('id', siteA)).error);
  assert.equal((await A.from('sites').select('id').eq('id', siteA)).data.length, 0);
  assert.equal((await mock.sql('select count(*)::int n from public.submissions'))[0].n, 0);
});

await test('mot de passe oublié : lien de récupération puis nouveau mot de passe', async () => {
  const c = client();
  assert.ifError((await c.auth.resetPasswordForEmail('moussa@test.sn', { redirectTo: 'http://localhost:5173/nouveau-mot-de-passe' })).error);
  assert.equal(mock.mail.length, 1);
  assert.match(mock.mail[0].link, /type=recovery/);
  const u = await B.auth.updateUser({ password: 'nouveau456' });
  assert.ifError(u.error);
  assert.ifError((await client().auth.signInWithPassword({ email: 'moussa@test.sn', password: 'nouveau456' })).error);
});

// ───────── Fonctions serveur : crédits dépensés à la génération, aperçus WhatsApp ─────────
{
  const http = await import('node:http');
  const { generateLocal } = await import('../shared/generator/index.js');
  let aiFail = false;
  const ai = http.createServer((req, res) => {
    if (aiFail) return res.writeHead(500).end('{}');
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(generateLocal('salon de coiffure')) } }] }));
  });
  await new Promise((r) => ai.listen(54398, '127.0.0.1', r));
  Object.assign(process.env, { VITE_SUPABASE_URL: mock.url, VITE_SUPABASE_ANON_KEY: mock.anonKey, OPENAI_API_KEY: 'test', OPENAI_BASE_URL: 'http://127.0.0.1:54398/v1', AI_PROVIDER: 'openai', OPENAI_MODEL: 'mock', ACCESS_CODE: 'bloque' });
  const { POST } = await import('../api/generate.js');
  const { GET: og } = await import('../api/og.js');
  const gen = (token, body = { idea: 'Salon de tresses à Dakar' }) => POST(new Request('http://x/api/generate', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 200)}` }, body: JSON.stringify(body) }));
  const C = client();
  const su = await C.auth.signUp({ email: 'fatou@test.sn', password: 'secret123' });
  const tok = su.data.session.access_token;

  await test('génération : connexion obligatoire (le code d\'accès ne bloque plus les comptes)', async () => {
    const r = await gen('');
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, 'login_required');
    assert.equal((await gen('jeton.invalide.x')).status, 401);
  });
  await test('génération : 5 crédits dépensés seulement si l\'IA réussit', async () => {
    const r = await gen(tok);
    const d = await r.json();
    assert.equal(r.status, 200);
    assert.ok(d.spec?.screens?.length >= 2);
    assert.equal(d.credits, 45);
    assert.equal(d.cost, 5);
    aiFail = true;
    const r2 = await gen(tok);
    const d2 = await r2.json();
    assert.equal(r2.status, 200, 'secours par modèle');
    assert.equal(d2.fallback, true);
    assert.equal(d2.credits, 45, 'aucun crédit dépensé quand l\'IA échoue');
    aiFail = false;
    const r3 = await gen(tok, { mode: 'edit', spec: d.spec, instruction: 'Ajoute un écran de fidélité' });
    assert.equal(r3.status, 200);
    assert.equal((await r3.json()).credits, 44, 'modification = 1 crédit');
  });
  await test('génération : refusée sans assez de crédits', async () => {
    await mock.sql('update public.profiles set credits = 3 where email = $1', ['fatou@test.sn']);
    const r = await gen(tok);
    assert.equal(r.status, 402);
    const d = await r.json();
    assert.equal(d.error, 'credits');
    assert.equal(d.credits, 3);
    assert.equal((await mock.sql('select credits from public.profiles where email = $1', ['fatou@test.sn']))[0].credits, 3);
  });
  await test('aperçu WhatsApp : titre, description et image du site publié', async () => {
    const id = crypto.randomUUID();
    const spec = { meta: { name: 'Salon <Awa>', tagline: 'Tresses & soins' }, theme: {}, screens: [{ id: 'a', blocks: [{ type: 'hero', media: { kind: 'image', src: 'u:1611853904829-6d0f4034ce2f' } }] }], tabs: [] };
    await C.from('sites').insert({ id, name: 'Salon', spec });
    await C.rpc('publish_site', { p_site: id, p_slug: 'salon-fatou' });
    const r = await og(new Request('http://defar.test/api/og?slug=salon-fatou'));
    const html = await r.text();
    assert.equal(r.status, 200);
    assert.match(html, /og:title" content="Salon &lt;Awa&gt;"/);
    assert.match(html, /og:description" content="Tresses &amp; soins"/);
    assert.match(html, /og:image" content="https:\/\/images\.unsplash\.com\/photo-1611853904829/);
    assert.match(html, /url=http:\/\/defar\.test\/s\/salon-fatou\?v=1/);
    const views = (await mock.sql('select views from public.sites where id = $1', [id]))[0].views;
    assert.equal(views, 0, 'les robots ne comptent pas comme des visites');
    assert.equal((await og(new Request('http://defar.test/api/og?slug=inconnu'))).status, 404);
  });
  ai.close();
}

await mock.close();
console.log(failures.join('\n'));
console.log(`\n${failures.length ? '✗' : '✓'} ${pass} tests de base de données réussis, ${failures.length} en échec`);
process.exit(failures.length ? 1 : 0);
