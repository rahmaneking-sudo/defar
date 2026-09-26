// Démos en direct de la landing — chargées à la demande (le moteur complet
// n'est téléchargé que lorsque la section approche de l'écran).
import { useEffect, useMemo, useRef } from 'react';
import { useInView } from 'motion/react';
import { AppPlayer, FitPhone } from '../../engine/Player.jsx';
import { localSpec } from '../../lib/specs.js';
import { TOURS, runTour } from '../../lib/tours.js';

export function LiveDemo({ cat, idea, caption, delay = 0 }) {
  const spec = useMemo(() => localSpec(idea, { category: cat }), [cat, idea]);
  const box = useRef(null);
  const player = useRef(null);
  const inView = useInView(box, { amount: 0.35 });
  useEffect(() => {
    if (!inView || !player.current || !TOURS[cat]) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => runTour(player.current, TOURS[cat], { signal: ctrl.signal }).catch(() => {}), delay);
    return () => (clearTimeout(t), ctrl.abort());
  }, [inView, cat, delay]);
  return (
    <div ref={box} className="flex flex-col items-center">
      <div className="w-[300px] h-[620px] sm:w-[320px] sm:h-[660px]">
        <FitPhone className="w-full h-full" pad={0}>
          <AppPlayer ref={player} spec={spec} autopilot mode="play" screenId={TOURS[cat]?.start} />
        </FitPhone>
      </div>
      <p className="mt-5 text-[13px] uppercase tracking-[0.16em] text-dune">{caption}</p>
      <p className="font-display italic text-[22px] text-sand mt-1">{spec.meta.name}</p>
    </div>
  );
}

// Téléphone qui montre uniquement le paiement
export function CheckoutDemo() {
  const spec = useMemo(() => localSpec('Salon de tresses', { category: 'beauty' }), []);
  const payScreen = spec.screens.find((s) => s.blocks.some((b) => b.type === 'checkout'))?.id;
  return (
    <div className="relative w-[300px] h-[620px] -rotate-2">
      <FitPhone className="w-full h-full" pad={0}>
        <AppPlayer spec={spec} screenId={payScreen} />
      </FitPhone>
    </div>
  );
}

export default LiveDemo;
