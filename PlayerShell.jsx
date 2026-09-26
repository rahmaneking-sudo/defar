// Présentation d'une maquette : téléphone au centre sur ordinateur, plein écran sur mobile.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AppPlayer, FitPhone } from '../engine/Player.jsx';
import { themeVars } from '../engine/theme.js';

function useIsPhone() {
  const q = () => typeof window !== 'undefined' && (window.matchMedia('(max-width: 560px)').matches || (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 760));
  const [m, setM] = useState(q);
  useEffect(() => {
    const on = () => setM(q());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return m;
}

export function PlayerShell({ spec, badge = true, onEdit }) {
  const phone = useIsPhone();
  const ref = useRef(null);
  const [device, setDevice] = useState('iphone');
  const { palette } = themeVars(spec.theme);
  useEffect(() => {
    document.title = `${spec.meta.name} — maquette interactive`;
  }, [spec.meta.name]);

  if (phone) {
    return (
      <div style={{ position: 'fixed', inset: 0, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', background: palette.bg }}>
        <AppPlayer ref={ref} spec={spec} frame={false} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 px-6 py-10" style={{ background: '#0b0a10', minHeight: '100dvh' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full blur-[120px] opacity-40" style={{ background: palette.primary }} />
        <div className="absolute -bottom-52 -right-40 w-[700px] h-[700px] rounded-full blur-[140px] opacity-30" style={{ background: palette.accent }} />
      </div>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="relative max-w-sm text-center lg:text-left order-2 lg:order-1">
        <p className="text-[12px] uppercase tracking-[0.2em] text-white/50 font-medium">Maquette interactive</p>
        <h1 className="text-white text-[44px] leading-[1.02] mt-3" style={{ fontFamily: `'${spec.theme.headingFont}', serif`, fontWeight: 800, letterSpacing: '-0.03em' }}>
          {spec.meta.name}
        </h1>
        {spec.meta.tagline && <p className="text-white/70 text-[17px] mt-3 leading-relaxed">{spec.meta.tagline}</p>}
        <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start text-[12.5px] text-white/70">
          <span className="px-3 h-8 rounded-full bg-white/[0.07] border border-white/10 flex items-center">{spec.screens.length} écrans</span>
          <span className="px-3 h-8 rounded-full bg-white/[0.07] border border-white/10 flex items-center">Paiement Wave · Orange Money</span>
          <span className="px-3 h-8 rounded-full bg-white/[0.07] border border-white/10 flex items-center">Touche tout, tout marche</span>
        </div>
        <div className="mt-7 flex gap-2 justify-center lg:justify-start">
          <button type="button" onClick={() => ref.current?.reset()} className="h-10 px-4 rounded-xl bg-white text-black text-[13.5px] font-semibold">
            Recommencer
          </button>
          <button type="button" onClick={() => setDevice((d) => (d === 'iphone' ? 'android' : 'iphone'))} className="h-10 px-4 rounded-xl border border-white/15 text-white/85 text-[13.5px] font-medium hover:bg-white/5">
            {device === 'iphone' ? 'Voir en Android' : 'Voir en iPhone'}
          </button>
          {onEdit && (
            <button type="button" onClick={onEdit} className="h-10 px-4 rounded-xl border border-white/15 text-white/85 text-[13.5px] font-medium hover:bg-white/5">
              Modifier
            </button>
          )}
        </div>
        <p className="mt-8 text-[12.5px] text-white/45 leading-relaxed">Astuce : ouvre ce lien sur ton téléphone pour vivre la maquette en plein écran, comme une vraie app.</p>
        {badge && (
          <p className="mt-6 text-[12px] text-white/35">
            Créé avec <span className="italic text-white/60" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 15 }}>Défar</span>
          </p>
        )}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} className="relative order-1 lg:order-2" style={{ width: 'min(92vw, 430px)', height: 'min(88vh, 900px)' }}>
        <FitPhone device={device} className="w-full h-full" pad={0}>
          <AppPlayer ref={ref} spec={spec} device={device} />
        </FitPhone>
      </motion.div>
    </div>
  );
}
