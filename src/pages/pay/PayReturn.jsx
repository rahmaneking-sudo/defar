// ─────────────────────────────────────────────────────────────────────────────
// RETOUR DE PAIEMENT — /pay/retour
// Vérifie le statut AUPRÈS DE L'OPÉRATEUR (via /api/pay/status), jamais sur la
// seule foi de l'URL, puis affiche un reçu imprimable et partageable.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { I } from '../../ui/kit.jsx';
import { Link } from '../../router.jsx';
import { BRAND } from '../../config.js';
import { Confetti } from '../../engine/ui.jsx';
import { PayShell, PayMark, StatusPill, methodInfo, useQuery, readLast, fcfa, amountDigits } from './common.jsx';

const MAX_TRIES = 40; // ≈ 2 minutes
const EVERY = 3000;

export default function PayReturn() {
  const q = useQuery();
  const last = useMemo(readLast, []);
  const token = q.get('token');
  const provider = q.get('p') || (token ? 'paydunya' : last.p) || 'unknown';
  const id = q.get('id') || token || (provider === last.p ? last.id : '') || '';
  const ref = q.get('ref') || last.ref || '';
  const cancelled = q.get('cancel') === '1' || q.get('err') === '1' || q.get('ok') === '0';
  const method = q.get('method') || last.method || (provider === 'wave' ? 'wave' : '');

  const [status, setStatus] = useState({ status: 'checking' });
  const [tries, setTries] = useState(0);
  const timer = useRef();

  const statusUrl = useMemo(() => {
    if (provider === 'sim') return `/api/pay/status?${new URLSearchParams({ p: 'sim', id, ok: q.get('ok') || '0', a: q.get('a') || String(last.a || ''), ref })}`;
    if (provider === 'wave') return `/api/pay/status?${new URLSearchParams({ p: 'wave', ...(id ? { id } : {}), ...(ref ? { ref } : {}) })}`;
    if (provider === 'paydunya' && id) return `/api/pay/status?${new URLSearchParams({ p: 'paydunya', token: id })}`;
    return null;
  }, [provider, id, ref, q, last.a]);

  const check = useCallback(
    async (n) => {
      if (!statusUrl) return setStatus({ status: cancelled ? 'failed' : 'unknown' });
      try {
        const r = await fetch(statusUrl);
        const data = await r.json();
        const st = data.status;
        if (st === 'paid' || st === 'failed' || st === 'expired') return setStatus(data);
        // annulé côté opérateur et toujours rien au bout de 2 essais : on conclut
        if (cancelled && n >= 1) return setStatus({ ...data, status: 'failed' });
        if (n + 1 >= MAX_TRIES) return setStatus({ ...data, status: 'pending' });
        setStatus((s) => ({ ...data, status: s.status === 'pending' ? 'pending' : 'checking' }));
      } catch {
        if (n + 1 >= MAX_TRIES) return setStatus({ status: 'pending' });
      }
      timer.current = setTimeout(() => setTries(n + 1), EVERY);
    },
    [statusUrl, cancelled]
  );

  useEffect(() => {
    check(tries);
    return () => clearTimeout(timer.current);
  }, [tries, check]);

  useEffect(() => {
    document.title = status.status === 'paid' ? 'Paiement réussi' : 'Paiement';
  }, [status.status]);

  const amount = status.amount || Number(q.get('a')) || last.a || 0;
  const merchant = q.get('m') || last.m || BRAND.name;
  const desc = q.get('d') || last.d || '';
  const reference = status.reference || ref;
  const simulated = provider === 'sim' || status.simulated;
  const st = status.status;
  const retry = () => {
    clearTimeout(timer.current);
    setStatus({ status: 'checking' });
    setTries(0);
    if (tries === 0) check(0);
  };

  return (
    <PayShell colors={st === 'paid' ? ['#16a34a', '#37c6e8', '#f2b544'] : st === 'failed' || st === 'expired' ? ['#ff3d5a', '#d8407a', '#ff6a3d'] : undefined} badge={simulated ? 'Mode test' : undefined}>
      <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 sm:py-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {(st === 'checking' || st === 'unknown') && statusUrl ? (
            <Checking key="checking" method={method} tries={tries} />
          ) : st === 'paid' ? (
            <Receipt key="paid" {...{ amount, merchant, desc, reference, method, simulated, status }} />
          ) : st === 'failed' || st === 'expired' ? (
            <Failed key="failed" expired={st === 'expired'} cancelled={cancelled} back={last.back} error={status.error} />
          ) : (
            <Pending key="pending" onRetry={retry} unknown={!statusUrl} back={last.back} />
          )}
        </AnimatePresence>
      </div>
    </PayShell>
  );
}

function Card({ children, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className={`relative rounded-[30px] bg-[#fbf7f1] text-ink shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] overflow-hidden ${className}`}>
      {children}
    </motion.div>
  );
}

function Checking({ method, tries }) {
  const m = methodInfo(method);
  return (
    <Card className="p-8 text-center">
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="absolute inset-0 rounded-full border-2" style={{ borderColor: method ? m.color : '#ff6a3d' }} initial={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }} />
        ))}
        {method ? <PayMark method={method} size={60} /> : <span className="w-14 h-14 rounded-2xl bg-ink text-sand flex items-center justify-center"><I n="lock" s={24} /></span>}
      </div>
      <h1 className="font-display text-[34px] leading-tight mt-7">Vérification du paiement</h1>
      <p className="text-ink/60 mt-2 text-[14.5px]">On confirme la transaction directement auprès de {method ? m.label : 'l\'opérateur'}. Ne ferme pas cette page.</p>
      {tries > 4 && <p className="text-[12.5px] text-ink/45 mt-4">Si tu as validé sur ton téléphone, la confirmation peut prendre quelques instants…</p>}
    </Card>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-dashed border-ink/10 last:border-0">
      <span className="text-[13px] text-ink/50">{k}</span>
      <span className={`text-[14px] font-semibold text-right break-all ${mono ? 'font-mono text-[12.5px]' : ''}`}>{v}</span>
    </div>
  );
}

function Receipt({ amount, merchant, desc, reference, method, simulated, status }) {
  const m = methodInfo(method);
  const date = new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const share = `✅ Paiement confirmé${simulated ? ' (SIMULATION, aucun débit)' : ''}\n${merchant}${desc ? ` — ${desc}` : ''}\nMontant : ${fcfa(amount)}\nMoyen : ${method ? m.label : '—'}\nRéférence : ${reference || '—'}\nDate : ${date}`;
  return (
    <div>
      <div className="fixed inset-0 pointer-events-none z-40 no-print">
        <Confetti colors={['#16a34a', '#ff6a3d', '#f2b544', '#37c6e8']} count={60} />
      </div>
      <Card className="print-area">
        {simulated && <div className="bg-[repeating-linear-gradient(135deg,#f2b544,#f2b544_10px,#f7cf7a_10px,#f7cf7a_20px)] text-ink text-center text-[11.5px] font-bold uppercase tracking-[0.14em] py-1.5">Simulation · aucun argent n'a été débité</div>}
        <div className="px-7 pt-8 pb-6 text-center">
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.15 }} className="w-20 h-20 mx-auto rounded-full bg-[#16a34a] text-white flex items-center justify-center shadow-[0_18px_40px_-14px_#16a34a]">
            <I n="check" s={40} />
          </motion.span>
          <p className="text-[13px] font-semibold text-[#16a34a] uppercase tracking-[0.14em] mt-5">Paiement confirmé</p>
          <p className="font-display text-[54px] leading-none mt-2">
            {amountDigits(amount)} <span className="text-[22px] text-ink/50">FCFA</span>
          </p>
          <p className="text-ink/60 mt-2 text-[14.5px]">
            à <b className="text-ink">{merchant}</b>
            {desc ? ` · ${desc}` : ''}
          </p>
        </div>
        <div className="relative px-7">
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-ink" />
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-ink" />
          <div className="border-t-2 border-dashed border-ink/10 mx-2" />
        </div>
        <div className="px-7 py-5">
          <Row k="Référence" v={reference || '—'} mono />
          <Row k="Moyen de paiement" v={method ? <span className="inline-flex items-center gap-2"><PayMark method={method} size={20} />{m.label}</span> : '—'} />
          {status.transaction && <Row k="Transaction" v={status.transaction} mono />}
          <Row k="Date" v={date} />
          <Row k="Statut" v={<StatusPill tone="ok" icon="circle-check">Payé</StatusPill>} />
        </div>
        <div className="px-7 pb-7 grid grid-cols-2 gap-2.5 no-print">
          <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noreferrer" className="h-12 rounded-2xl bg-[#1faa53] text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2">
            <I n="message-circle" s={17} /> Partager
          </a>
          <button type="button" onClick={() => window.print()} className="h-12 rounded-2xl bg-ink text-sand font-semibold text-[14px] inline-flex items-center justify-center gap-2">
            <I n="download" s={17} /> Reçu PDF
          </button>
          {status.receipt && (
            <a href={status.receipt} target="_blank" rel="noreferrer" className="col-span-2 h-11 rounded-2xl border border-ink/10 text-[13.5px] font-medium inline-flex items-center justify-center gap-2 hover:bg-ink/[0.03]">
              <I n="receipt" s={16} /> Reçu officiel de l'opérateur
            </a>
          )}
        </div>
      </Card>
      <p className="text-center text-[12.5px] text-dune mt-5 no-print">
        <Link to="/" className="hover:text-sand">
          Retour à l'accueil
        </Link>
      </p>
    </div>
  );
}

function Failed({ expired, cancelled, back, error }) {
  return (
    <Card className="p-8 text-center">
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 16 }} className="w-20 h-20 mx-auto rounded-full bg-[#c0263d] text-white flex items-center justify-center">
        <I n="x" s={40} />
      </motion.span>
      <h1 className="font-display text-[36px] leading-tight mt-6">{expired ? 'Session expirée' : cancelled ? 'Paiement annulé' : 'Paiement non abouti'}</h1>
      <p className="text-ink/60 mt-2 text-[14.5px]">{error ? `${error}. ` : ''}Aucun montant n'a été débité. Tu peux réessayer en toute sécurité.</p>
      <div className="mt-7 flex flex-col gap-2">
        {back && (
          <a href={back} className="h-12 rounded-2xl bg-ink text-sand font-semibold inline-flex items-center justify-center gap-2">
            <I n="refresh-cw" s={17} /> Réessayer
          </a>
        )}
        <Link to="/" className="h-11 rounded-2xl text-[14px] text-ink/60 inline-flex items-center justify-center hover:bg-ink/[0.04]">
          Retour à l'accueil
        </Link>
      </div>
    </Card>
  );
}

function Pending({ onRetry, unknown, back }) {
  return (
    <Card className="p-8 text-center">
      <span className="w-20 h-20 mx-auto rounded-full bg-gold/20 text-[#a86a00] flex items-center justify-center">
        <I n="hourglass" s={36} />
      </span>
      <h1 className="font-display text-[34px] leading-tight mt-6">{unknown ? 'Paiement introuvable' : 'Confirmation en attente'}</h1>
      <p className="text-ink/60 mt-2 text-[14.5px]">
        {unknown ? 'On ne trouve pas de paiement associé à cette page. Si tu as payé, garde le SMS de confirmation de ton opérateur.' : 'L\'opérateur n\'a pas encore confirmé. Si tu as validé sur ton téléphone, le commerçant sera notifié automatiquement dès la confirmation.'}
      </p>
      <div className="mt-7 flex flex-col gap-2">
        {!unknown && (
          <button type="button" onClick={onRetry} className="h-12 rounded-2xl bg-ink text-sand font-semibold inline-flex items-center justify-center gap-2">
            <I n="refresh-cw" s={17} /> Vérifier à nouveau
          </button>
        )}
        {back && (
          <a href={back} className="h-11 rounded-2xl text-[14px] text-ink/70 inline-flex items-center justify-center hover:bg-ink/[0.04]">
            Revenir au paiement
          </a>
        )}
      </div>
    </Card>
  );
}
