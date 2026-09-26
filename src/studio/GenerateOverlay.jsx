// Écran de génération : étapes animées + téléphone qui s'assemble.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { I, Logo } from '../ui/kit.jsx';

const STEPS = [
  { t: 0, label: 'Analyse de ton idée', icon: 'lightbulb' },
  { t: 3, label: 'Architecture des écrans et du parcours client', icon: 'layers' },
  { t: 8, label: 'Design system : couleurs, typographies, style', icon: 'palette' },
  { t: 14, label: 'Rédaction des contenus en français', icon: 'pencil' },
  { t: 21, label: 'Choix des vidéos et des photos', icon: 'film' },
  { t: 30, label: 'Paiement Wave, Orange Money, Mixx by Yas', icon: 'wallet' },
  { t: 40, label: 'Animations et transitions', icon: 'sparkles' },
  { t: 52, label: 'Vérification anti-bug de chaque écran', icon: 'shield-check' },
];
const TIPS = [
  'Astuce : en mode « Éditer », clique sur n\'importe quel bloc du téléphone pour le modifier.',
  'Astuce : demande à l\'IA « passe en mode sombre » ou « ajoute un écran de fidélité ».',
  'Astuce : le lien « Présenter » s\'ouvre en plein écran sur le téléphone de ton client.',
  'Astuce : exporte un pack client (.zip) prêt à envoyer par WhatsApp.',
];

export function GenerateOverlay({ idea, done, onFinished }) {
  const [elapsed, setElapsed] = useState(0);
  const [tip, setTip] = useState(0);
  const [finishing, setFinishing] = useState(false);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - t0) / 1000), 200);
    const tt = setInterval(() => setTip((x) => (x + 1) % TIPS.length), 5200);
    return () => (clearInterval(id), clearInterval(tt));
  }, []);
  useEffect(() => {
    if (!done) return;
    setFinishing(true);
    const t = setTimeout(onFinished, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  const current = finishing ? STEPS.length : STEPS.filter((s) => elapsed >= s.t).length;
  const pct = finishing ? 100 : Math.min(94, (elapsed / 60) * 100 * 0.9 + 4);
  return (
    <motion.div className="fixed inset-0 z-[150] bg-ink flex items-center justify-center overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}>
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute w-[720px] h-[720px] rounded-full blur-[140px] opacity-40" style={{ background: 'radial-gradient(circle, #ff6a3d, transparent 65%)', left: '-10%', top: '-20%' }} animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity }} />
        <motion.div className="absolute w-[640px] h-[640px] rounded-full blur-[140px] opacity-30" style={{ background: 'radial-gradient(circle, #d8407a, transparent 65%)', right: '-12%', bottom: '-25%' }} animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity }} />
      </div>
      <div className="relative w-full max-w-5xl px-6 grid lg:grid-cols-[1fr_320px] gap-12 items-center">
        <div>
          <Logo />
          <h2 className="font-display text-[44px] md:text-[56px] leading-[0.98] mt-8 text-sand">
            On construit <em className="text-transparent bg-clip-text bg-[linear-gradient(120deg,#ff8a3d,#ff4d5e,#d8407a)]">ton app</em>…
          </h2>
          {idea && <p className="mt-4 text-dune text-[15px] max-w-xl line-clamp-2">« {idea} »</p>}
          <div className="mt-8 flex flex-col gap-2.5 max-w-xl">
            {STEPS.map((s, i) => {
              const state = i < current - 1 || finishing ? 'done' : i === current - 1 ? 'doing' : 'todo';
              return (
                <motion.div key={s.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: state === 'todo' ? 0.35 : 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 text-[14.5px]">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${state === 'done' ? 'bg-baobab/20 text-baobab' : state === 'doing' ? 'bg-sunset/20 text-sunset' : 'bg-white/5 text-dune'}`}>
                    {state === 'done' ? <I n="check" s={15} /> : state === 'doing' ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <I n={s.icon} s={14} />}
                  </span>
                  <span className={state === 'doing' ? 'text-sand' : 'text-sand/80'}>{s.label}</span>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-8 max-w-xl h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
            <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#ff8a3d,#ff4d5e,#d8407a)]" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={tip} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-[13px] text-dune max-w-xl">
              {elapsed > 70 && !finishing ? 'Les IA prennent parfois un peu plus de temps… on reste sur le coup.' : TIPS[tip]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="hidden lg:flex justify-center">
          <div className="relative w-[270px] h-[560px] rounded-[46px] p-3 bg-[linear-gradient(145deg,#3a3a40,#15151a)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
            <div className="relative w-full h-full rounded-[36px] bg-[#f6f3ee] overflow-hidden">
              <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-20 h-6 rounded-full bg-black z-10" />
              {[
                { h: 150, c: 'linear-gradient(135deg,#ff8a3d,#d8407a)' },
                { h: 36, c: '#e8e2d9' },
                { h: 70, c: '#ece6dd' },
                { h: 110, c: '#e6e0d6' },
                { h: 90, c: '#ece6dd' },
              ].reduce(
                (acc, b, i) => {
                  acc.items.push(
                    <motion.div key={i} className="absolute left-3 right-3 rounded-2xl overflow-hidden" style={{ top: acc.y, height: b.h, background: b.c }} initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={current > i + 1 || finishing ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.25, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
                      <div className="absolute inset-0 shimmer-sweep" />
                    </motion.div>
                  );
                  acc.y += b.h + 10;
                  return acc;
                },
                { y: 48, items: [] }
              ).items}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
