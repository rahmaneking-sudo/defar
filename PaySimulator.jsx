// ─────────────────────────────────────────────────────────────────────────────
// SIMULATEUR D'OPÉRATEUR — remplace Wave / Orange Money / Mixx / carte tant
// qu'aucune clé n'est configurée. Clairement signalé : aucun argent réel.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { I } from '../../ui/kit.jsx';
import { PayMark, methodInfo, useQuery, fcfa, formatPhone, amountDigits } from './common.jsx';

export default function PaySimulator() {
  const q = useQuery();
  const method = ['wave', 'orange_money', 'free_money', 'card'].includes(q.get('method')) ? q.get('method') : 'wave';
  const m = methodInfo(method);
  const amount = Math.round(Number(q.get('a')) || 0);
  const merchant = q.get('m') || 'Commerçant';
  const phone = q.get('phone') || '';
  const pinFlow = method === 'orange_money' || method === 'free_money';
  const [phase, setPhase] = useState('confirm'); // confirm | pin | processing | done
  const [pin, setPin] = useState('');
  const [card, setCard] = useState({ n: '4242 4242 4242 4242', e: '12/34', c: '123' });

  useEffect(() => {
    document.title = `Simulateur ${m.label}`;
  }, [m.label]);

  const finish = (ok) => {
    const back = new URLSearchParams({ p: 'sim', id: q.get('id') || '', ok: ok ? '1' : '0', a: String(amount), ref: q.get('ref') || '', m: merchant, d: q.get('d') || '', method });
    location.assign(`/pay/retour?${back}`);
  };
  const confirm = () => {
    setPhase('processing');
    setTimeout(() => setPhase('done'), 1700);
    setTimeout(() => finish(true), 2600);
  };
  const press = (k) => {
    if (phase !== 'pin') return;
    if (k === 'del') return setPin((p) => p.slice(0, -1));
    const next = (pin + k).slice(0, 4);
    setPin(next);
    if (next.length === 4) setTimeout(confirm, 350);
  };

  return (
    <div className="min-h-full bg-[#e9e6ef] text-ink flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[400px]">
        <div className="mb-3 flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          <I n="info" s={14} /> Simulation · aucun argent réel
        </div>
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="relative rounded-[34px] bg-white shadow-[0_40px_90px_-40px_rgba(20,10,40,0.45)] overflow-hidden">
          {/* bandeau diagonal « TEST » */}
          <div className="absolute top-5 -right-12 rotate-45 bg-ink text-white text-[10px] font-bold tracking-[0.2em] px-12 py-1 z-10">TEST</div>
          <div className="relative px-6 pt-7 pb-8 text-center overflow-hidden" style={{ background: `linear-gradient(160deg, ${m.color}, color-mix(in srgb, ${m.color} 70%, #000))`, color: m.ink }}>
            <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full opacity-20" style={{ background: m.ink }} />
            <div className="relative flex items-center justify-center gap-2.5">
              <PayMark method={method} size={36} className="ring-2 ring-white/60" />
              <span className="font-semibold text-[15px]">Simulateur {m.label}</span>
            </div>
            <p className="relative text-[13px] opacity-80 mt-6">Paiement à {merchant}</p>
            <p className="relative font-display text-[56px] leading-none mt-1.5">
              {amountDigits(amount)} <span className="text-[22px] opacity-75">FCFA</span>
            </p>
            {q.get('d') && <p className="relative text-[13px] opacity-80 mt-2">{q.get('d')}</p>}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {phase === 'confirm' && (
                <motion.div key="c" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {method === 'card' ? (
                    <div className="flex flex-col gap-3">
                      <label className="text-[12.5px] font-medium text-ink/60">
                        Numéro de carte (test)
                        <input value={card.n} onChange={(e) => setCard({ ...card, n: e.target.value })} className="mt-1 w-full h-12 px-4 rounded-2xl bg-ink/[0.04] border border-ink/10 text-[16px] text-ink tracking-wider outline-none focus:border-ink/40" />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-[12.5px] font-medium text-ink/60">
                          Expiration
                          <input value={card.e} onChange={(e) => setCard({ ...card, e: e.target.value })} className="mt-1 w-full h-12 px-4 rounded-2xl bg-ink/[0.04] border border-ink/10 text-[16px] text-ink outline-none focus:border-ink/40" />
                        </label>
                        <label className="text-[12.5px] font-medium text-ink/60">
                          CVC
                          <input value={card.c} onChange={(e) => setCard({ ...card, c: e.target.value })} className="mt-1 w-full h-12 px-4 rounded-2xl bg-ink/[0.04] border border-ink/10 text-[16px] text-ink outline-none focus:border-ink/40" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-ink/[0.04] p-4 flex items-center gap-3">
                      <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <I n="smartphone" s={20} />
                      </span>
                      <div className="text-left">
                        <p className="text-[12px] text-ink/50">Compte {m.label}</p>
                        <p className="font-semibold text-[16px] tracking-wide">{phone ? `+221 ${formatPhone(phone)}` : '+221 77 000 00 00'}</p>
                      </div>
                    </div>
                  )}
                  <button type="button" data-sim="confirm" onClick={() => (pinFlow ? setPhase('pin') : confirm())} className="w-full h-14 mt-5 rounded-2xl font-semibold text-[16px]" style={{ background: m.color, color: m.ink }}>
                    {pinFlow ? 'Continuer' : `Confirmer ${fcfa(amount)}`}
                  </button>
                  <button type="button" data-sim="cancel" onClick={() => finish(false)} className="w-full h-12 mt-2 rounded-2xl font-medium text-[15px] text-ink/60 hover:bg-ink/[0.04]">
                    Annuler
                  </button>
                </motion.div>
              )}

              {phase === 'pin' && (
                <motion.div key="p" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                  <p className="font-semibold text-[16px]">Saisis ton code secret</p>
                  <p className="text-[12.5px] text-ink/50 mt-1">N'importe quel code à 4 chiffres (simulation)</p>
                  <div className="flex justify-center gap-3 mt-5">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.span key={i} animate={{ scale: pin.length === i + 1 ? [1, 1.3, 1] : 1 }} className="w-4 h-4 rounded-full border-2" style={{ borderColor: m.color, background: pin.length > i ? m.color : 'transparent' }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) =>
                      k === '' ? (
                        <span key={i} />
                      ) : (
                        <button key={i} type="button" data-sim-key={k} onClick={() => press(k)} className="h-14 rounded-2xl bg-ink/[0.04] hover:bg-ink/[0.08] active:scale-95 transition text-[22px] font-semibold flex items-center justify-center">
                          {k === 'del' ? <I n="arrow-left" s={20} /> : k}
                        </button>
                      )
                    )}
                  </div>
                  <button type="button" onClick={() => finish(false)} className="w-full h-11 mt-3 rounded-2xl font-medium text-[14px] text-ink/55 hover:bg-ink/[0.04]">
                    Annuler
                  </button>
                </motion.div>
              )}

              {(phase === 'processing' || phase === 'done') && (
                <motion.div key="w" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 flex flex-col items-center text-center">
                  <div className="relative w-20 h-20">
                    <AnimatePresence mode="wait">
                      {phase === 'processing' ? (
                        <motion.span key="spin" exit={{ opacity: 0 }} className="absolute inset-0 rounded-full border-4 animate-spin" style={{ borderColor: `${m.color}33`, borderTopColor: m.color }} />
                      ) : (
                        <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }} className="absolute inset-0 rounded-full flex items-center justify-center text-white bg-[#16a34a]">
                          <I n="check" s={40} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="font-semibold text-[17px] mt-5">{phase === 'processing' ? 'Traitement en cours…' : 'Paiement accepté'}</p>
                  <p className="text-[13px] text-ink/50 mt-1">{phase === 'processing' ? `${m.label} confirme la transaction` : 'Retour chez le commerçant…'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        <p className="text-center text-[12px] text-ink/50 mt-4 leading-relaxed px-4">Cette page imite l'étape de validation chez l'opérateur pour tester le parcours. Ajoute tes clés Wave ou PayDunya pour encaisser pour de vrai.</p>
      </div>
    </div>
  );
}
