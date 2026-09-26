import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

// En local (`npm run dev`), ce plugin exécute les fonctions du dossier /api
// exactement comme Vercel le fait en production : pas besoin de `vercel dev`.
function devApi() {
  return {
    name: 'defar-dev-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        const url = new URL(req.url, 'http://localhost');
        const rel = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
        const file = path.join(process.cwd(), 'api', rel + '.js');
        if (!fs.existsSync(file) || rel.split('/').some((p) => p.startsWith('_'))) {
          res.statusCode = 404;
          res.setHeader('content-type', 'application/json');
          return res.end(JSON.stringify({ error: 'not_found' }));
        }
        try {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const host = req.headers.host || 'localhost:5173';
          const request = new Request(`http://${host}${req.url}`, {
            method: req.method,
            headers: Object.entries(req.headers).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v]),
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
          });
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method] || mod.default?.fetch;
          if (!handler) {
            res.statusCode = 405;
            return res.end('Method Not Allowed');
          }
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          console.error('[api]', e);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'server_error', message: String(e?.message || e) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  },
});
