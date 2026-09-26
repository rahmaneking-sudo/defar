// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT — /pay?a=15000&d=Acompte&m=Tresses%20%26%20Co&r=CMD-12&x=…&s=…
// Le client choisit Wave, Orange Money, Mixx by Yas ou la carte, puis est redirigé
// vers l'opérateur (ou vers le simulateur tant qu'aucune clé n'est configurée).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { I } from '../../ui/kit.jsx';
import { Link } from '../../router.jsx';
import { BRAND } from '../../config.js';
import { CountUp } from '../../engine/ui.jsx';
import { PayShell, PayMark, QR, StatusPill, METHOD_ORDER, methodInfo, useQuery, saveLast, formatPhone, phoneDigits, phoneValid, amountDigits, fcfa } from './common.jsx';

export default function PayPage() {
  const q = useQuery();
  const link = useMemo(
    () => ({
      a: Math.round(Number(q.get('a'))),
      d: String(q.get('d') || '').slice(0, 120),
      m: String(q.get('m') || '').slice(0, 40),
      r: String(q.get('r') || '').slice(0, 40),
      x: q.get('x') || '',
      s: q.get('s') || '',
    }),
    [q]
  );
  const demo = q.get('demo') === '1';
  const [cfg, setCfg] = useState(null);
  const [method, setMethod] = useState(() => (METHOD_ORDER.includes(q.get('method')) ? q.get('method') : 'wave'));
  const [phone, setPhone] = useState(() => formatPhone(phoneDigits(q.get('phone') || '')));
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [leaving, setLeaving] = useState(null);

  useEffect(() => {
    document.title = `Paiement — ${link.m || BRAND.name}`;
    const qs = new URLSearchParams(Object.entries(link).filter(([, v]) => v !== '' && v !== undefined && !Number.isNaN(v)));
    fetch(`/api/pay/config?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(setCfg)
      .catch(() => setCfg({ offline: true, mode: 'simulation', methods: {} }));
  }, [link]);

  const merchant = link.m || cfg?.merchant || BRAND.name;
  const invalid =
    !Number.isFinite(link.a) || link.a < 100 || link.a > 5_000_000
      ? 'amount'
      : link.x && Number(link.x) * 1000 < Date.now()
        ? 'expired'
        : cfg?.link && !cfg.link.ok && cfg.mode !== 'simulation' && !demo
          ? 'signature'
          : null;
  const simulated = demo || !cfg || cfg.mode === 'simulation' || cfg.methods?.[method] === 'sim' || cfg.offline;
  const needsPhone = method === 'orange_money' || method === 'free_money';
  const m = methodInfo(method);

  const pay = async () => {
    setErr('');
    if (needsPhone && !phoneValid(phone)) return setErr(`Entre ton numéro ${m.label} à 9 chiffres (ex. 77 123 45 67).`);
    if (phone && !needsPhone && method !== 'card' && !phoneValid(phone)) return setErr('Numéro invalide : 9 chiffres, ex. 77 123 45 67.');
    setBusy(true);
    try {
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...link, method, phone: phoneDigits(phone), name: name.trim(), demo: demo ? 1 : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.message || 'Le paiement n\'a pas pu démarrer. Réessaie dans un instant.');
      saveLast({ p: data.provider, id: data.id, ref: data.reference, a: link.a, d: link.d, m: merchant, method, back: location.href, t: Date.now() });
      setLeaving(data.provider === 'sim' ? 'le simulateur' : m.label);
      setTimeout(() => location.assign(data.url), 850);
    } catch (e) {
      setErr(e.message || 'Connexion impossible. Vérifie ta connexion internet.');
      setBusy(false);
    }
  };

  return (
    <PayShell colors={[m.color, '#d8407a', '#ff6a3d']}>
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-5 py-4 sm:py-10 grid lg:grid-cols-[1fr_440px] gap-8 lg:gap-14 items-center">
        {/* ── Récapitulatif ── */}
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="text-center lg:text-left">
          <div className="inline-flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-[20px] font-bold text-white bg-[linear-gradient(135deg,#ff7a3d,#d8407a)] shadow-[0_12px_30px_-12px_rgba(255,77,94,0.9)]">{merchant.trim()[0]?.toUpperCase() || 'D'}</span>
            <div className="text-left">
              <p className="font-semibold text-[16px] leading-tight">{merchant}</p>
              <p className="text-[12.5px] text-dune">te demande un paiement</p>
            </div>
          </div>
          {!invalid && (
            <>
              <p className="font-display leading-none mt-7 sm:mt-9 text-[64px] sm:text-[96px] tracking-[-0.02em]">
                <CountUp value={link.a} format={(n) => amountDigits(n)} />
                <span className="text-[26px] sm:text-[34px] text-sand/60 ml-3 align-top">FCFA</span>
              </p>
              {link.d && <p className="text-sand/75 text-[16px] sm:text-[18px] mt-3 max-w-md mx-auto lg:mx-0">{link.d}</p>}
              {link.r && <p className="text-[12.5px] text-dune mt-2">Référence {link.r}</p>}
              <ul className="hidden lg:flex flex-col gap-3 mt-10 text-[14.5px] text-sand/75">
                <li className="flex items-center gap-3">
                  <I n="shield-check" s={18} className="text-baobab" /> Paiement vérifié directement auprès de l'opérateur
                </li>
                <li className="flex items-center gap-3">
                  <I n="lock" s={18} className="text-baobab" /> Aucune donnée bancaire n'est conservée
                </li>
                <li className="flex items-center gap-3">
                  <I n="receipt" s={18} className="text-baobab" /> Reçu immédiat, partageable sur WhatsApp
                </li>
              </ul>
              <div className="hidden lg:flex items-center gap-4 mt-10 p-4 pr-6 rounded-3xl border border-white/10 bg-white/[0.03] w-max">
                <QR text={typeof location !== 'undefined' ? location.href : ''} size={92} className="rounded-xl" />
                <div>
                  <p className="font-semibold text-[14.5px]">Payer depuis ton téléphone</p>
                  <p className="text-[12.5px] text-dune mt-1 max-w-[210px]">Scanne ce code avec l'appareil photo pour ouvrir cette page sur ton mobile.</p>
                </div>
              </div>
            </>
          )}
        </motion.section>

        {/* ── Formulaire ── */}
        <motion.section initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="relative rounded-[30px] bg-[#fbf7f1] text-ink shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
          {invalid ? (
            <InvalidLink kind={invalid} reason={cfg?.link?.reason} />
          ) : (
            <div className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h1 className="font-semibold text-[18px]">Moyen de paiement</h1>
                {cfg && (simulated ? <StatusPill tone="warn" icon="info">Mode test</StatusPill> : <StatusPill tone="ok" icon="shield-check">{cfg.link?.signed ? 'Lien vérifié' : 'Sécurisé'}</StatusPill>)}
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-5" role="radiogroup" aria-label="Moyen de paiement">
                {METHOD_ORDER.map((id, i) => {
                  const info = methodInfo(id);
                  const on = method === id;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      data-method={id}
                      onClick={() => (setMethod(id), setErr(''))}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative text-left rounded-2xl p-3.5 border-2 transition-colors ${on ? 'bg-white' : 'bg-white/60 border-transparent hover:bg-white'}`}
                      style={{ borderColor: on ? info.color : undefined }}
                    >
                      <PayMark method={id} size={38} />
                      <p className="font-semibold text-[14px] mt-2.5 leading-tight">{info.label}</p>
                      <p className="text-[11.5px] text-ink/50 mt-0.5 leading-tight">{info.hint}</p>
                      <AnimatePresence>
                        {on && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: info.color === '#1DC8F2' ? '#0b8fb3' : info.color }}>
                            <I n="check" s={13} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {method !== 'card' && (
                  <motion.div key="phone" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <label className="block text-[13px] font-medium mt-5 mb-1.5" htmlFor="pay-phone">
                      Numéro {m.label} {!needsPhone && <span className="text-ink/40 font-normal">(facultatif)</span>}
                    </label>
                    <div className="flex items-stretch h-12 rounded-2xl bg-white border border-ink/10 focus-within:border-ink/40 overflow-hidden">
                      <span className="flex items-center gap-1.5 px-3 text-[14px] font-medium border-r border-ink/10 text-ink/70">
                        <span className="w-5 h-3.5 rounded-[2px] overflow-hidden flex">
                          <span className="flex-1 bg-[#00853f]" />
                          <span className="flex-1 bg-[#fdef42]" />
                          <span className="flex-1 bg-[#e31b23]" />
                        </span>
                        +221
                      </span>
                      <input id="pay-phone" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => (setPhone(formatPhone(phoneDigits(e.target.value))), setErr(''))} placeholder="77 123 45 67" className="flex-1 min-w-0 px-3 bg-transparent outline-none text-[16px] tracking-wide" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <label className="block text-[13px] font-medium mt-4 mb-1.5" htmlFor="pay-name">
                Ton nom <span className="text-ink/40 font-normal">(facultatif, pour le reçu)</span>
              </label>
              <input id="pay-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Awa Diop" autoComplete="name" className="w-full h-12 px-4 rounded-2xl bg-white border border-ink/10 focus:border-ink/40 outline-none text-[16px]" />

              <AnimatePresence>
                {err && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-4 text-[13.5px] text-[#c0263d] bg-[#c0263d]/8 rounded-xl px-3.5 py-2.5 flex gap-2">
                    <I n="circle-alert" s={17} className="shrink-0 mt-px" /> {err}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button type="button" data-tour="pay-button" onClick={pay} disabled={busy} whileTap={{ scale: 0.98 }} className="shimmer-sweep relative w-full h-14 mt-5 rounded-2xl font-semibold text-[16px] inline-flex items-center justify-center gap-2 overflow-hidden transition-colors disabled:opacity-80" style={{ background: m.color, color: m.ink, boxShadow: `0 16px 34px -14px ${m.color}` }}>
                {busy ? <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <I n="lock" s={17} />}
                {busy ? 'Connexion sécurisée…' : `Payer ${fcfa(link.a)}`}
              </motion.button>
              <p className="text-center text-[12px] text-ink/45 mt-3.5 leading-relaxed">
                {simulated ? 'Mode test : un simulateur remplace l\'opérateur, aucun argent n\'est débité.' : `Tu vas être redirigé vers ${m.label} pour valider le paiement.`}
              </p>
            </div>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {leaving && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-md flex flex-col items-center justify-center gap-5">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.1, repeat: Infinity }}>
              <PayMark method={method} size={76} />
            </motion.div>
            <p className="text-[17px] text-sand">Redirection vers {leaving}…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </PayShell>
  );
}

function InvalidLink({ kind, reason }) {
  const text = {
    amount: ['Lien de paiement incomplet', 'Le montant est manquant ou invalide. Demande un nouveau lien au commerçant.'],
    expired: ['Ce lien a expiré', 'Pour ta sécurité, les liens de paiement ont une durée limitée. Demande un nouveau lien au commerçant.'],
    signature: ['Lien non valide', `Ce lien a été modifié ou n'a pas été créé par le commerçant${reason ? ` (${reason.toLowerCase()})` : ''}. Aucun paiement n'est possible.`],
  }[kind];
  return (
    <div className="p-8 text-center">
      <span className="w-16 h-16 mx-auto rounded-3xl bg-[#c0263d]/10 text-[#c0263d] flex items-center justify-center">
        <I n={kind === 'expired' ? 'hourglass' : 'circle-alert'} s={30} />
      </span>
      <h1 className="font-display text-[34px] leading-tight mt-5">{text[0]}</h1>
      <p className="text-ink/60 mt-3 text-[14.5px] leading-relaxed">{text[1]}</p>
      <Link to="/" className="mt-7 h-12 px-6 inline-flex items-center gap-2 rounded-2xl bg-ink text-sand font-semibold">
        Retour à l'accueil
      </Link>
    </div>
  );
}
