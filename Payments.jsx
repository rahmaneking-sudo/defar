// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU DE BORD PAIEMENTS — /paiements
// État de la configuration, création de liens de paiement signés (WhatsApp, QR),
// et guide pour brancher Wave, PayDunya et les notifications de commande.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { I, inputCls } from '../../ui/kit.jsx';
import { SiteHeader, SiteFooter } from '../../ui/site.jsx';
import { BRAND } from '../../config.js';
import { PayMark, QR, StatusPill, copyText, fcfa, METHOD_ORDER, methodInfo } from './common.jsx';

const HIST_KEY = 'defar.links.v1';
const ADMIN_KEY = 'defar.admin';
const readHist = () => {
  try {
    const v = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const writeHist = (h) => {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 12)));
  } catch {
    /* ignore */
  }
};

export default function Payments() {
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState(() => {
    const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    const a = Math.round(Number(q.get('a')));
    return { amount: Number.isFinite(a) && a >= 100 ? String(a) : '15000', description: (q.get('d') || 'Acompte maquette application').slice(0, 120), reference: (q.get('r') || '').slice(0, 40), merchant: '', days: '7' };
  });
  const [admin, setAdmin] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_KEY) || '';
    } catch {
      return '';
    }
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hist, setHist] = useState(readHist);
  const [copied, setCopied] = useState('');
  const origin = typeof location !== 'undefined' ? location.origin : '';

  useEffect(() => {
    document.title = `Paiements — ${BRAND.name}`;
    fetch('/api/pay/config')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(setCfg)
      .catch(() => setCfg({ offline: true, mode: 'simulation', methods: {}, admin: false, signedLinks: false }));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const amount = Math.round(Number(String(form.amount).replace(/\s/g, '')));
  const amountOk = Number.isFinite(amount) && amount >= 100 && amount <= 5_000_000;

  const flash = (k) => {
    setCopied(k);
    setTimeout(() => setCopied(''), 1600);
  };

  const create = async () => {
    setErr('');
    if (!amountOk) return setErr('Montant entre 100 et 5 000 000 FCFA.');
    setBusy(true);
    try {
      let url;
      let signed = false;
      if (cfg?.admin) {
        if (!admin) throw new Error('Entre le mot de passe administrateur (variable ADMIN_PASSWORD).');
        const r = await fetch('/api/pay/link', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-admin-key': admin },
          body: JSON.stringify({ amount, description: form.description, reference: form.reference, merchant: form.merchant || undefined, days: Number(form.days) || 0 }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.url) throw new Error(data.message || 'Création du lien impossible.');
        url = data.url;
        signed = true;
        try {
          sessionStorage.setItem(ADMIN_KEY, admin);
        } catch {
          /* ignore */
        }
      } else {
        const p = new URLSearchParams({ a: String(amount) });
        if (form.description.trim()) p.set('d', form.description.trim().slice(0, 120));
        if ((form.merchant || cfg?.merchant || '').trim()) p.set('m', (form.merchant || cfg?.merchant).trim().slice(0, 40));
        if (form.reference.trim()) p.set('r', form.reference.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40));
        url = `${origin}/pay?${p}`;
      }
      const item = { url, amount, description: form.description.trim(), signed, at: Date.now() };
      setResult(item);
      const h = [item, ...hist.filter((x) => x.url !== url)];
      setHist(h);
      writeHist(h);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const waText = (it) => `Bonjour 👋\nVoici le lien pour régler ${fcfa(it.amount)}${it.description ? ` (${it.description})` : ''} par Wave, Orange Money, Mixx ou carte :\n${it.url}`;
  const downloadQr = async (it) => {
    const u = await QRCode.toDataURL(it.url, { margin: 2, width: 800, color: { dark: '#0b0a10', light: '#ffffff' } });
    const a = document.createElement('a');
    a.href = u;
    a.download = `qr-paiement-${it.amount}.png`;
    a.click();
  };

  const mode = cfg?.mode;
  const modeInfo = mode === 'live' ? ['ok', 'Encaissement réel', 'circle-check'] : mode === 'test' ? ['warn', 'Mode test (bac à sable)', 'info'] : ['warn', 'Simulation', 'info'];

  return (
    <div className="relative min-h-full bg-ink text-sand overflow-x-hidden">
      <SiteHeader active="/paiements" />
      <section className="relative pt-32 pb-10 px-5 overflow-hidden">
        <div className="absolute -top-44 right-[-10%] w-[760px] h-[520px] rounded-full blur-[130px] opacity-25 bg-[radial-gradient(ellipse,#1DC8F2,#ff7900_55%,transparent_72%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <p className="text-[12.5px] uppercase tracking-[0.2em] text-sunset">Encaisser</p>
            <h1 className="font-display text-[48px] sm:text-[72px] leading-[0.92] mt-4 max-w-3xl">
              Un lien, et ton client <em>paie depuis son téléphone.</em>
            </h1>
            <p className="text-sand/65 text-[17px] mt-5 max-w-2xl leading-relaxed">Crée un lien de paiement pour un acompte, une commande ou une maquette, envoie-le sur WhatsApp ou imprime son QR code. Ton client choisit Wave, Orange Money, Mixx by Yas ou la carte.</p>
          </div>
          <div className="flex items-center gap-2">
            {METHOD_ORDER.map((m, i) => (
              <motion.span key={m} initial={{ opacity: 0, y: 10, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                <PayMark method={m} size={52} />
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── État de la configuration ── */}
      <section className="relative px-5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Mode" value={cfg ? modeInfo[1] : '…'} tone={cfg ? modeInfo[0] : 'neutral'} icon={cfg ? modeInfo[2] : 'loader-circle'} />
          <StatCard label="Wave (API directe)" value={cfg ? (cfg.wave ? 'Connecté' : 'Non configuré') : '…'} tone={cfg?.wave ? 'ok' : 'neutral'} icon={cfg?.wave ? 'circle-check' : 'circle-alert'} />
          <StatCard label="PayDunya (OM, Mixx, carte)" value={cfg ? (cfg.paydunya ? `Connecté · ${cfg.paydunyaMode === 'live' ? 'réel' : 'test'}` : 'Non configuré') : '…'} tone={cfg?.paydunya ? 'ok' : 'neutral'} icon={cfg?.paydunya ? 'circle-check' : 'circle-alert'} />
          <StatCard label="Liens signés" value={cfg ? (cfg.signedLinks ? 'Activés' : 'Désactivés') : '…'} tone={cfg?.signedLinks ? 'ok' : 'warn'} icon={cfg?.signedLinks ? 'shield-check' : 'triangle-alert'} />
          <StatCard label="Notification commandes" value={cfg ? (cfg.webhook ? 'Activée' : 'Désactivée') : '…'} tone={cfg?.webhook ? 'ok' : 'neutral'} icon="webhook" />
        </div>
        {cfg && (
          <div className="max-w-6xl mx-auto mt-3 flex flex-wrap gap-2">
            {METHOD_ORDER.map((m) => (
              <span key={m} className="inline-flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full border border-white/10 bg-white/[0.03] text-[12.5px]">
                <PayMark method={m} size={24} />
                {methodInfo(m).label}
                <span className={cfg.methods?.[m] && cfg.methods[m] !== 'sim' ? 'text-baobab' : 'text-dune'}>· {cfg.methods?.[m] === 'wave' ? 'Wave API' : cfg.methods?.[m] === 'paydunya' ? 'PayDunya' : 'simulé'}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Créateur de lien ── */}
      <section className="relative px-5 py-14">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5">
          <div className="rounded-[28px] border border-white/[0.08] bg-ink-2/70 p-6 sm:p-7">
            <h2 className="font-display text-[34px] leading-none">Créer un lien de paiement</h2>
            <p className="text-sand/55 text-[14px] mt-2">{cfg?.admin ? 'Le lien est signé : le montant ne peut pas être modifié par le client.' : 'Astuce : définis ADMIN_PASSWORD dans Vercel pour signer tes liens (montant infalsifiable).'}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <label className="sm:col-span-2 text-[13px] text-sand/75">
                Montant (FCFA)
                <input inputMode="numeric" value={form.amount} onChange={set('amount')} className={`${inputCls} h-12 mt-1.5 text-[18px] font-semibold`} placeholder="15000" />
                <span className="flex flex-wrap gap-1.5 mt-2">
                  {[5000, 10000, 25000, 50000, 100000].map((v) => (
                    <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, amount: String(v) }))} className={`h-7 px-2.5 rounded-lg text-[12px] border transition-colors ${amount === v ? 'border-sunset/70 text-sand bg-sunset/10' : 'border-white/10 text-sand/65 hover:text-sand'}`}>
                      {fcfa(v)}
                    </button>
                  ))}
                </span>
              </label>
              <label className="sm:col-span-2 text-[13px] text-sand/75">
                Description
                <input value={form.description} onChange={set('description')} maxLength={120} className={`${inputCls} h-11 mt-1.5`} placeholder="Acompte, commande n°…" />
              </label>
              <label className="text-[13px] text-sand/75">
                Référence <span className="text-dune">(facultatif)</span>
                <input value={form.reference} onChange={set('reference')} maxLength={40} className={`${inputCls} h-11 mt-1.5`} placeholder="CMD-042" />
              </label>
              <label className="text-[13px] text-sand/75">
                Nom affiché
                <input value={form.merchant} onChange={set('merchant')} maxLength={40} className={`${inputCls} h-11 mt-1.5`} placeholder={cfg?.merchant || BRAND.name} />
              </label>
              {cfg?.admin && (
                <>
                  <label className="text-[13px] text-sand/75">
                    Validité
                    <select value={form.days} onChange={set('days')} className={`${inputCls} h-11 mt-1.5`}>
                      <option value="1">24 heures</option>
                      <option value="7">7 jours</option>
                      <option value="30">30 jours</option>
                      <option value="0">Sans limite</option>
                    </select>
                  </label>
                  <label className="text-[13px] text-sand/75">
                    Mot de passe admin
                    <input type="password" value={admin} onChange={(e) => setAdmin(e.target.value)} className={`${inputCls} h-11 mt-1.5`} placeholder="ADMIN_PASSWORD" autoComplete="current-password" />
                  </label>
                </>
              )}
            </div>
            <AnimatePresence>
              {err && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-4 text-[13.5px] text-[#ff8a9a] bg-ember/10 rounded-xl px-3.5 py-2.5 flex gap-2">
                  <I n="circle-alert" s={17} className="shrink-0 mt-px" /> {err}
                </motion.p>
              )}
            </AnimatePresence>
            <button type="button" onClick={create} disabled={busy || !amountOk} className="mt-6 w-full h-13 py-3.5 rounded-2xl font-semibold text-[15.5px] text-white inline-flex items-center justify-center gap-2 bg-[linear-gradient(135deg,#ff7a3d,#ff4d5e_55%,#c8367c)] shadow-[0_14px_32px_-12px_rgba(255,77,94,0.9)] disabled:opacity-50">
              {busy ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <I n="link" s={18} />}
              Générer le lien {amountOk ? `· ${fcfa(amount)}` : ''}
            </button>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-6 sm:p-7 flex flex-col">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key={result.url} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[16px]">Lien prêt à envoyer</h3>
                    {result.signed ? <StatusPill tone="ok" icon="shield-check">Signé</StatusPill> : <StatusPill tone="warn" icon="info">Non signé</StatusPill>}
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row gap-5 items-center">
                    <div className="p-3 rounded-3xl bg-white shrink-0">
                      <QR text={result.url} size={168} />
                    </div>
                    <div className="min-w-0 flex-1 w-full">
                      <p className="font-display text-[44px] leading-none">{fcfa(result.amount)}</p>
                      {result.description && <p className="text-sand/65 mt-2">{result.description}</p>}
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/30 border border-white/10 pl-3 pr-1.5 h-11">
                        <span className="flex-1 min-w-0 truncate text-[12.5px] font-mono text-sand/70">{result.url}</span>
                        <button type="button" onClick={async () => (await copyText(result.url)) && flash('main')} className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-[12.5px] inline-flex items-center gap-1.5">
                          <I n={copied === 'main' ? 'check' : 'copy'} s={14} /> {copied === 'main' ? 'Copié' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <a href={`https://wa.me/?text=${encodeURIComponent(waText(result))}`} target="_blank" rel="noreferrer" className="h-11 rounded-xl bg-[#1faa53] text-white text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5">
                      <I n="message-circle" s={16} /> WhatsApp
                    </a>
                    <button type="button" onClick={() => downloadQr(result)} className="h-11 rounded-xl bg-white/10 hover:bg-white/15 text-[13.5px] font-medium inline-flex items-center justify-center gap-1.5">
                      <I n="download" s={16} /> QR code
                    </button>
                    <a href={result.url} target="_blank" rel="noreferrer" className="h-11 rounded-xl bg-white/10 hover:bg-white/15 text-[13.5px] font-medium inline-flex items-center justify-center gap-1.5">
                      <I n="external-link" s={16} /> Tester
                    </a>
                  </div>
                  {!result.signed && mode !== 'simulation' && <p className="text-[12.5px] text-gold mt-4">Ce lien n'est pas signé : un client pourrait modifier le montant. Définis ADMIN_PASSWORD dans Vercel.</p>}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-10">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-[28px] border-2 border-dashed border-white/15 flex items-center justify-center">
                      <I n="qr-code" s={56} className="text-sand/30" />
                    </div>
                    <motion.span className="absolute -right-4 -bottom-3" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
                      <PayMark method="wave" size={44} />
                    </motion.span>
                  </div>
                  <p className="text-sand/60 mt-6 max-w-xs">Ton lien et son QR code apparaîtront ici, prêts à partager sur WhatsApp ou à imprimer au comptoir.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {hist.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[12.5px] uppercase tracking-[0.16em] text-dune">Derniers liens (sur cet appareil)</h3>
              <button type="button" onClick={() => (setHist([]), writeHist([]))} className="text-[12.5px] text-dune hover:text-sand">
                Effacer
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-white/[0.07] divide-y divide-white/[0.06] overflow-hidden">
              {hist.map((h) => (
                <div key={h.url} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02]">
                  <span className="font-semibold w-28 shrink-0">{fcfa(h.amount)}</span>
                  <span className="flex-1 min-w-0 truncate text-sand/65 text-[14px]">{h.description || '—'}</span>
                  <span className="hidden sm:block text-[12px] text-dune">{new Date(h.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  <button type="button" title="Copier" onClick={async () => (await copyText(h.url)) && flash(h.url)} className="w-8 h-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center text-sand/70">
                    <I n={copied === h.url ? 'check' : 'copy'} s={15} />
                  </button>
                  <button type="button" title="Afficher" onClick={() => setResult(h)} className="w-8 h-8 rounded-lg hover:bg-white/10 inline-flex items-center justify-center text-sand/70">
                    <I n="qr-code" s={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Guide de branchement ── */}
      <section className="relative px-5 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-[40px] sm:text-[54px] leading-[0.95]">
            Passer en <em>encaissement réel</em>
          </h2>
          <p className="text-sand/60 mt-3 max-w-2xl">Ajoute les variables dans Vercel (Projet → Settings → Environment Variables), puis redéploie. Aucune clé n'est jamais envoyée au navigateur.</p>
          <div className="grid lg:grid-cols-3 gap-4 mt-8">
            <Guide
              mark="wave"
              title="Wave (direct)"
              steps={['Ouvre ton compte Wave Business et va dans la section Développeurs du portail.', 'Crée une clé API avec l\'accès « Checkout » et colle-la dans WAVE_API_KEY.', 'Ajoute un webhook vers l\'adresse ci-dessous et copie son secret dans WAVE_WEBHOOK_SECRET.', 'Si tu actives la signature des requêtes sur la clé, ajoute aussi WAVE_SIGNING_SECRET.']}
              vars={['WAVE_API_KEY', 'WAVE_WEBHOOK_SECRET', 'WAVE_SIGNING_SECRET']}
              url={`${origin}/api/pay/webhook-wave`}
              onCopy={async (t) => (await copyText(t)) && flash(t)}
              copied={copied}
            />
            <Guide
              mark="orange_money"
              title="PayDunya (Orange Money, Mixx, carte)"
              steps={['Crée un compte marchand PayDunya et une application dans « Intégrez notre API ».', 'Copie la clé principale, la clé privée et le token dans les trois variables.', 'Commence avec PAYDUNYA_MODE = test, puis passe à live après validation du compte.', 'Les notifications de paiement (IPN) arrivent automatiquement sur l\'adresse ci-dessous.']}
              vars={['PAYDUNYA_MASTER_KEY', 'PAYDUNYA_PRIVATE_KEY', 'PAYDUNYA_TOKEN', 'PAYDUNYA_MODE']}
              url={`${origin}/api/pay/webhook-paydunya`}
              onCopy={async (t) => (await copyText(t)) && flash(t)}
              copied={copied}
            />
            <Guide
              icon="webhook"
              title="Sécurité & commandes"
              steps={['ADMIN_PASSWORD protège la création de liens et les signe : le montant devient infalsifiable.', 'MERCHANT_NAME est le nom affiché sur le checkout et le reçu.', 'ORDER_WEBHOOK_URL reçoit chaque paiement confirmé (scénario Make, Zapier ou Google Apps Script vers Google Sheets).', 'PUBLIC_URL fixe l\'adresse de retour si tu utilises un nom de domaine.']}
              vars={['ADMIN_PASSWORD', 'MERCHANT_NAME', 'ORDER_WEBHOOK_URL', 'PUBLIC_URL']}
              onCopy={async (t) => (await copyText(t)) && flash(t)}
              copied={copied}
            />
          </div>
          <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.06] p-4 text-[13.5px] text-sand/80 flex gap-3">
            <I n="info" s={18} className="text-gold shrink-0 mt-0.5" />
            <span>Un paiement n'est considéré comme réussi que lorsque l'opérateur le confirme (vérification côté serveur ou webhook signé). Ne te fie jamais à une capture d'écran : vérifie dans ton espace Wave ou PayDunya, ou dans tes notifications de commande.</span>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function StatCard({ label, value, tone = 'neutral', icon }) {
  const color = { ok: 'text-baobab', warn: 'text-gold', bad: 'text-ember', neutral: 'text-sand/50' }[tone];
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <I n={icon} s={18} className={`${color} ${icon === 'loader-circle' ? 'animate-spin' : ''}`} />
      <p className="text-[12px] text-dune mt-3">{label}</p>
      <p className="font-semibold text-[14.5px] mt-0.5">{value}</p>
    </div>
  );
}

function Guide({ mark, icon, title, steps, vars, url, onCopy, copied }) {
  return (
    <div className="rounded-[26px] border border-white/[0.08] bg-ink-2/60 p-6 flex flex-col">
      <div className="flex items-center gap-3">
        {mark ? <PayMark method={mark} size={40} /> : <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><I n={icon} s={19} /></span>}
        <h3 className="font-semibold text-[16px] leading-tight">{title}</h3>
      </div>
      <ol className="mt-5 flex flex-col gap-2.5 text-[13.5px] text-sand/70">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-white/10 text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {vars.map((v) => (
          <button key={v} type="button" onClick={() => onCopy(v)} title="Copier" className="h-7 px-2 rounded-md bg-black/30 border border-white/10 font-mono text-[11.5px] text-sand/80 hover:text-sand">
            {copied === v ? '✓ copié' : v}
          </button>
        ))}
      </div>
      {url && (
        <button type="button" onClick={() => onCopy(url)} className="mt-4 text-left rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 hover:border-white/20">
          <span className="block text-[11px] uppercase tracking-[0.12em] text-dune">Adresse du webhook</span>
          <span className="flex items-center gap-2 mt-1 font-mono text-[12px] text-sand/85 break-all">
            {url} <I n={copied === url ? 'check' : 'copy'} s={13} className="shrink-0" />
          </span>
        </button>
      )}
    </div>
  );
}
