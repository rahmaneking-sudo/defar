// ─────────────────────────────────────────────────────────────────────────────
// Faux Supabase local (tests uniquement) : vraie base Postgres (PGlite) avec les
// règles d'accès de supabase/schema.sql, + les routes utilisées par supabase-js :
//   /auth/v1   inscription, connexion, jeton, utilisateur, mot de passe oublié
//   /rest/v1   tables (select / insert / update / delete) et fonctions (rpc)
//   /storage/v1 envoi et lecture publique de fichiers
// Lancer seul : node tools/mock-supabase/server.mjs [port]
// ─────────────────────────────────────────────────────────────────────────────
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const SECRET = 'defar-mock-secret-for-local-tests-only';
const IDENT = /^[a-z_][a-z0-9_]*$/;

const b64u = (b) => Buffer.from(b).toString('base64url');
export function signJwt(payload) {
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify(payload));
  const s = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}
function verifyJwt(token) {
  const [h, p, s] = String(token || '').split('.');
  if (!h || !p || !s) return null;
  const ok = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
  if (ok.length !== s.length || !crypto.timingSafeEqual(Buffer.from(ok), Buffer.from(s))) return null;
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  return payload;
}
export const ANON_KEY = signJwt({ role: 'anon', iss: 'mock', iat: 1700000000, exp: 4102444800 });
export const SERVICE_KEY = signJwt({ role: 'service_role', iss: 'mock', iat: 1700000000, exp: 4102444800 });

const hashPw = (pw) => {
  const salt = crypto.randomBytes(8).toString('hex');
  return `${salt}:${crypto.scryptSync(String(pw), salt, 32).toString('hex')}`;
};
const checkPw = (pw, stored) => {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(String(pw), salt, 32));
};

export async function startMockSupabase({ port = 54321, quiet = false } = {}) {
  const db = new PGlite();
  await db.exec(fs.readFileSync(path.join(here, 'bootstrap.sql'), 'utf8'));
  await db.exec(fs.readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8'));
  const files = fs.mkdtempSync(path.join(os.tmpdir(), 'mock-sb-'));
  const refresh = new Map(); // refresh_token -> user id
  const mail = []; // liens de récupération « envoyés »
  const log = (...a) => !quiet && console.log('[mock-supabase]', ...a);

  // Exécute une requête avec le rôle et les « claims » du jeton (comme PostgREST)
  async function asRole(claims, fn) {
    const role = ['anon', 'authenticated', 'service_role'].includes(claims?.role) ? claims.role : 'anon';
    return db.transaction(async (tx) => {
      await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims || { role: 'anon' })]);
      await tx.exec(`set local role ${role}`);
      return fn(tx);
    });
  }

  const userJson = (u) => ({
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: u.email_confirmed_at,
    confirmed_at: u.email_confirmed_at,
    user_metadata: u.raw_user_meta_data || {},
    app_metadata: { provider: 'email', providers: ['email'] },
    identities: [],
    created_at: u.created_at,
    updated_at: u.updated_at,
  });
  function session(u) {
    const now = Math.floor(Date.now() / 1000);
    const access = signJwt({ sub: u.id, role: 'authenticated', aud: 'authenticated', email: u.email, iat: now, exp: now + 3600, session_id: crypto.randomUUID() });
    const rt = crypto.randomBytes(16).toString('hex');
    refresh.set(rt, u.id);
    return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: rt, user: userJson(u) };
  }
  const getUser = async (id) => (await db.query('select * from auth.users where id = $1', [id])).rows[0];

  // ───────── Réponses ─────────
  const CORS = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS',
    'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info,prefer,range,accept-profile,content-profile,x-upsert,cache-control,x-supabase-api-version',
    'access-control-expose-headers': 'content-range,x-supabase-api-version',
  };
  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { ...CORS, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };
  const authErr = (res, status, code, msg) => send(res, status, { code: status, error_code: code, msg, error: code, error_description: msg });
  const pgErr = (res, e, claims) => {
    const code = e?.code || '';
    const status = code === '42501' ? (claims?.role === 'anon' ? 401 : 403) : code === '23505' ? 409 : code === 'PGRST116' ? 406 : 400;
    send(res, status, { code, message: e?.message || String(e), details: e?.detail || null, hint: e?.hint || null });
  };

  async function readBody(req) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    return Buffer.concat(chunks);
  }
  const claimsOf = (req) => {
    const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers.apikey;
    return verifyJwt(tok);
  };

  // ───────── Auth ─────────
  async function handleAuth(req, res, url, body) {
    const route = url.pathname.replace(/^\/auth\/v1/, '');
    const json = body.length ? JSON.parse(body.toString() || '{}') : {};
    if (route === '/signup' && req.method === 'POST') {
      const email = String(json.email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return authErr(res, 400, 'validation_failed', 'Unable to validate email address: invalid format');
      if (String(json.password || '').length < 6) return authErr(res, 422, 'weak_password', 'Password should be at least 6 characters.');
      const exists = (await db.query('select 1 from auth.users where email = $1', [email])).rows.length;
      if (exists) return authErr(res, 422, 'user_already_exists', 'User already registered');
      const u = (await db.query('insert into auth.users (email, encrypted_password, raw_user_meta_data) values ($1, $2, $3) returning *', [email, hashPw(json.password), JSON.stringify(json.data || {})])).rows[0];
      log('inscription', email);
      return send(res, 200, session(u));
    }
    if (route === '/token' && req.method === 'POST') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        const u = (await db.query('select * from auth.users where email = $1', [String(json.email || '').trim().toLowerCase()])).rows[0];
        if (!u || !checkPw(json.password, u.encrypted_password)) return authErr(res, 400, 'invalid_credentials', 'Invalid login credentials');
        return send(res, 200, session(u));
      }
      if (grant === 'refresh_token') {
        const id = refresh.get(json.refresh_token);
        if (!id) return authErr(res, 400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found');
        refresh.delete(json.refresh_token);
        const u = await getUser(id);
        if (!u) return authErr(res, 400, 'user_not_found', 'User not found');
        return send(res, 200, session(u));
      }
      return authErr(res, 400, 'unsupported_grant_type', 'unsupported grant type');
    }
    const claims = claimsOf(req);
    if (route === '/user' && req.method === 'GET') {
      if (!claims?.sub) return authErr(res, 401, 'bad_jwt', 'invalid JWT');
      const u = await getUser(claims.sub);
      if (!u) return authErr(res, 404, 'user_not_found', 'User not found');
      return send(res, 200, userJson(u));
    }
    if (route === '/user' && req.method === 'PUT') {
      if (!claims?.sub) return authErr(res, 401, 'bad_jwt', 'invalid JWT');
      if (json.password !== undefined) {
        if (String(json.password).length < 6) return authErr(res, 422, 'weak_password', 'Password should be at least 6 characters.');
        await db.query('update auth.users set encrypted_password = $1, updated_at = now() where id = $2', [hashPw(json.password), claims.sub]);
      }
      if (json.data) await db.query('update auth.users set raw_user_meta_data = raw_user_meta_data || $1::jsonb where id = $2', [JSON.stringify(json.data), claims.sub]);
      return send(res, 200, userJson(await getUser(claims.sub)));
    }
    if (route === '/logout' && req.method === 'POST') return send(res, 204);
    if (route === '/recover' && req.method === 'POST') {
      const u = (await db.query('select * from auth.users where email = $1', [String(json.email || '').trim().toLowerCase()])).rows[0];
      if (u) {
        const s = session(u);
        const redirect = url.searchParams.get('redirect_to') || json.redirect_to || 'http://localhost:5173/';
        const link = `${redirect}#access_token=${s.access_token}&expires_at=${s.expires_at}&expires_in=3600&refresh_token=${s.refresh_token}&token_type=bearer&type=recovery`;
        mail.push({ email: u.email, link });
        log('lien de récupération pour', u.email);
      }
      return send(res, 200, {});
    }
    if (route === '/settings') return send(res, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: true });
    return authErr(res, 404, 'not_found', 'route inconnue ' + route);
  }

  // ───────── REST (sous-ensemble de PostgREST) ─────────
  function parseFilters(url, params) {
    const where = [];
    for (const [k, raw] of url.searchParams) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
      if (!IDENT.test(k)) throw Object.assign(new Error(`colonne invalide ${k}`), { code: '42703' });
      let v = raw;
      let not = false;
      if (v.startsWith('not.')) {
        not = true;
        v = v.slice(4);
      }
      const dot = v.indexOf('.');
      const op = v.slice(0, dot);
      const val = v.slice(dot + 1);
      const P = () => (params.push(val), `$${params.length}`);
      let cond;
      if (op === 'eq') cond = `${k} = ${P()}`;
      else if (op === 'neq') cond = `${k} <> ${P()}`;
      else if (op === 'gt') cond = `${k} > ${P()}`;
      else if (op === 'gte') cond = `${k} >= ${P()}`;
      else if (op === 'lt') cond = `${k} < ${P()}`;
      else if (op === 'lte') cond = `${k} <= ${P()}`;
      else if (op === 'like') cond = `${k}::text like ${P().replace(/\*/g, '%')}`;
      else if (op === 'ilike') {
        params.push(val.replace(/\*/g, '%'));
        cond = `${k}::text ilike $${params.length}`;
      } else if (op === 'is') cond = `${k} is ${val === 'null' ? 'null' : val === 'true' ? 'true' : 'false'}`;
      else if (op === 'in') {
        const items = val.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/^"|"$/g, ''));
        cond = `${k}::text in (${items.map((it) => (params.push(it), `$${params.length}`)).join(',') || 'null'})`;
      } else throw Object.assign(new Error(`opérateur non géré ${op}`), { code: 'PGRST100' });
      where.push(not ? `not (${cond})` : cond);
    }
    return where.length ? ` where ${where.join(' and ')}` : '';
  }
  const selectList = (s) => {
    if (!s || s === '*') return '*';
    const cols = s.split(',').map((c) => c.trim()).filter(Boolean);
    for (const c of cols) if (!IDENT.test(c)) throw Object.assign(new Error(`sélection non gérée ${c}`), { code: 'PGRST100' });
    return cols.join(', ');
  };
  const orderBy = (s) => {
    if (!s) return '';
    return (
      ' order by ' +
      s
        .split(',')
        .map((part) => {
          const [col, ...mods] = part.split('.');
          if (!IDENT.test(col)) throw new Error('tri invalide');
          return `${col} ${mods.includes('desc') ? 'desc' : 'asc'}${mods.includes('nullslast') ? ' nulls last' : mods.includes('nullsfirst') ? ' nulls first' : ''}`;
        })
        .join(', ')
    );
  };
  const pgValue = (v) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : v);

  async function handleRest(req, res, url, body) {
    const claims = claimsOf(req);
    if (!claims) return send(res, 401, { code: 'PGRST301', message: 'JWT invalide' });
    const route = url.pathname.replace(/^\/rest\/v1\//, '');
    const prefer = String(req.headers.prefer || '');
    const wantObject = String(req.headers.accept || '').includes('vnd.pgrst.object');
    try {
      // Fonctions
      if (route.startsWith('rpc/')) {
        const fn = route.slice(4);
        if (!IDENT.test(fn)) return send(res, 404, { code: 'PGRST202', message: 'fonction inconnue' });
        const args = body.length ? JSON.parse(body.toString()) : Object.fromEntries(url.searchParams);
        const info = (await db.query(`select p.proretset, t.typname, p.proargnames, p.pronargs, (select array_agg(format_type(x, null) order by o) from unnest(p.proargtypes) with ordinality as a(x, o)) as argtypes from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type t on t.oid = p.prorettype where n.nspname = 'public' and p.proname = $1`, [fn])).rows[0];
        if (!info) return send(res, 404, { code: 'PGRST202', message: `Could not find the function public.${fn}` });
        const argNames = (info.proargnames || []).slice(0, info.pronargs);
        const names = Object.keys(args);
        for (const n of names) if (!argNames.includes(n)) return send(res, 404, { code: 'PGRST202', message: `Could not find the function public.${fn}(${names.join(', ')})` });
        // comme PostgREST : les arguments JSON sont convertis selon les types de la fonction
        const cols = names.map((n) => `${n} ${info.argtypes[argNames.indexOf(n)]}`).join(', ');
        const call = `public.${fn}(${names.map((n) => `${n} => _.${n}`).join(', ')})`;
        const from = names.length ? ` from json_to_record($1::json) as _(${cols})` : '';
        const params = names.length ? [JSON.stringify(args)] : [];
        const out = await asRole(claims, async (tx) => {
          if (info.proretset || info.typname === 'record') return (await tx.query(names.length ? `select f.* from json_to_record($1::json) as _(${cols}), lateral ${call} as f` : `select * from ${call}`, params)).rows;
          return (await tx.query(`select ${call} as r${from}`, params)).rows[0]?.r ?? null;
        });
        if (info.typname === 'void') return send(res, 204);
        return send(res, 200, out);
      }
      // Tables
      if (!IDENT.test(route)) return send(res, 404, { code: '42P01', message: 'table inconnue' });
      const table = `public.${route}`;
      const params = [];
      if (req.method === 'GET' || req.method === 'HEAD') {
        const where = parseFilters(url, params);
        const cols = selectList(url.searchParams.get('select'));
        const limit = url.searchParams.get('limit') ? ` limit ${Number(url.searchParams.get('limit')) | 0}` : '';
        const offset = url.searchParams.get('offset') ? ` offset ${Number(url.searchParams.get('offset')) | 0}` : '';
        const { rows, total } = await asRole(claims, async (tx) => {
          const rows = (await tx.query(`select ${cols} from ${table}${where}${orderBy(url.searchParams.get('order'))}${limit}${offset}`, params)).rows;
          let total = null;
          if (/count=exact/.test(prefer)) total = Number((await tx.query(`select count(*)::int as n from ${table}${where}`, params)).rows[0].n);
          return { rows, total };
        });
        const headers = total !== null ? { 'content-range': `${rows.length ? `0-${rows.length - 1}` : '*'}/${total}` } : {};
        if (req.method === 'HEAD') return send(res, 200, undefined, headers);
        if (wantObject) {
          if (rows.length !== 1) return send(res, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows` });
          return send(res, 200, rows[0], headers);
        }
        return send(res, 200, rows, headers);
      }
      const returning = /return=representation/.test(prefer) ? ` returning ${selectList(url.searchParams.get('select'))}` : '';
      if (req.method === 'POST') {
        const payload = JSON.parse(body.toString() || '{}');
        const list = Array.isArray(payload) ? payload : [payload];
        const out = await asRole(claims, async (tx) => {
          const rows = [];
          for (const obj of list) {
            const keys = Object.keys(obj);
            for (const k of keys) if (!IDENT.test(k)) throw new Error('colonne invalide');
            const vals = keys.map((k) => pgValue(obj[k]));
            const sql = `insert into ${table} (${keys.join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')})${returning}`;
            const r = await tx.query(sql, vals);
            rows.push(...(r.rows || []));
          }
          return rows;
        });
        if (!returning) return send(res, 201);
        return send(res, 201, wantObject ? out[0] : out);
      }
      if (req.method === 'PATCH') {
        const obj = JSON.parse(body.toString() || '{}');
        const keys = Object.keys(obj);
        for (const k of keys) if (!IDENT.test(k)) throw new Error('colonne invalide');
        keys.forEach((k) => params.push(pgValue(obj[k])));
        const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const where = parseFilters(url, params);
        const out = await asRole(claims, async (tx) => (await tx.query(`update ${table} set ${set}${where}${returning}`, params)).rows);
        if (!returning) return send(res, 204);
        return send(res, 200, wantObject ? out[0] : out);
      }
      if (req.method === 'DELETE') {
        const where = parseFilters(url, params);
        const out = await asRole(claims, async (tx) => (await tx.query(`delete from ${table}${where}${returning}`, params)).rows);
        if (!returning) return send(res, 204);
        return send(res, 200, out);
      }
      return send(res, 405, { message: 'méthode non gérée' });
    } catch (e) {
      return pgErr(res, e, claims);
    }
  }

  // ───────── Stockage ─────────
  async function handleStorage(req, res, url, body) {
    const route = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\//, ''));
    if (req.method === 'GET' && route.startsWith('public/')) {
      const [bucket, ...rest] = route.slice(7).split('/');
      const b = (await db.query('select * from storage.buckets where id = $1', [bucket])).rows[0];
      const file = path.join(files, bucket, ...rest);
      if (!b?.public || !file.startsWith(files) || !fs.existsSync(file)) return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      const meta = (await db.query('select metadata from storage.objects where bucket_id = $1 and name = $2', [bucket, rest.join('/')])).rows[0]?.metadata || {};
      res.writeHead(200, { ...CORS, 'content-type': meta.mimetype || 'application/octet-stream' });
      return res.end(fs.readFileSync(file));
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const claims = claimsOf(req);
      if (!claims) return send(res, 400, { statusCode: '403', error: 'Unauthorized', message: 'invalid jwt' });
      const [bucket, ...rest] = route.split('/');
      const name = rest.join('/');
      const b = (await db.query('select * from storage.buckets where id = $1', [bucket])).rows[0];
      if (!b) return send(res, 400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
      let data = body;
      let mimetype = String(req.headers['content-type'] || 'application/octet-stream');
      if (mimetype.startsWith('multipart/form-data')) {
        const form = await new Request('http://x', { method: 'POST', headers: { 'content-type': mimetype }, body }).formData();
        let f = null;
        for (const [, v] of form) if (typeof v === 'object' && v?.arrayBuffer) f = v;
        if (!f) return send(res, 400, { statusCode: '400', error: 'invalid', message: 'fichier manquant' });
        data = Buffer.from(await f.arrayBuffer());
        mimetype = f.type || 'application/octet-stream';
      }
      if (b.file_size_limit && data.length > Number(b.file_size_limit)) return send(res, 400, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' });
      if (b.allowed_mime_types?.length && !b.allowed_mime_types.includes(mimetype.split(';')[0])) return send(res, 400, { statusCode: '415', error: 'invalid_mime_type', message: `mime type ${mimetype} is not supported` });
      try {
        await asRole(claims, (tx) => tx.query('insert into storage.objects (bucket_id, name, owner, metadata) values ($1, $2, $3, $4)', [bucket, name, claims.sub || null, JSON.stringify({ mimetype, size: data.length })]));
      } catch (e) {
        const dup = e?.code === '23505';
        return send(res, 400, { statusCode: dup ? '409' : '403', error: dup ? 'Duplicate' : 'Unauthorized', message: dup ? 'The resource already exists' : 'new row violates row-level security policy' });
      }
      const file = path.join(files, bucket, ...rest);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, data);
      return send(res, 200, { Key: `${bucket}/${name}`, Id: crypto.randomUUID() });
    }
    return send(res, 404, { message: 'route de stockage inconnue' });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (req.method === 'OPTIONS') return send(res, 204);
      const body = await readBody(req);
      if (url.pathname.startsWith('/auth/v1')) return await handleAuth(req, res, url, body);
      if (url.pathname.startsWith('/rest/v1/')) return await handleRest(req, res, url, body);
      if (url.pathname.startsWith('/storage/v1/object/')) return await handleStorage(req, res, url, body);
      if (url.pathname === '/__test/mail') return send(res, 200, mail);
      if (url.pathname === '/__test/sql' && req.method === 'POST') {
        const { sql, params } = JSON.parse(body.toString());
        return send(res, 200, (await db.query(sql, params || [])).rows);
      }
      return send(res, 404, { message: 'inconnu' });
    } catch (e) {
      log('erreur', e);
      return send(res, 500, { message: String(e?.message || e) });
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  log(`prêt sur http://127.0.0.1:${port}`);
  return {
    url: `http://127.0.0.1:${port}`,
    anonKey: ANON_KEY,
    db,
    mail,
    sql: (q, p) => db.query(q, p).then((r) => r.rows),
    close: () => new Promise((r) => server.close(() => r())),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 54321);
  const m = await startMockSupabase({ port });
  console.log(`VITE_SUPABASE_URL=${m.url}`);
  console.log(`VITE_SUPABASE_ANON_KEY=${m.anonKey}`);
}
