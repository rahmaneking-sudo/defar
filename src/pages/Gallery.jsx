// ─────────────────────────────────────────────────────────────────────────────
// GALERIE — les 18 modèles vivants, à tester en plein écran puis personnaliser.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { I, Button, Pattern } from '../ui/kit.jsx';
import { SiteHeader, SiteFooter } from '../ui/site.jsx';
import { useRoute, go, Link } from '../router.jsx';
import { CATEGORY_INFO, CATEGORY_GROUPS, BRAND } from '../config.js';
import { AppPlayer, FitPhone } from '../engine/Player.jsx';
import { computeRoutes } from '../engine/context.js';
import { localSpec, shareUrl } from '../lib/specs.js';
import { playTour } from '../lib/tours.js';

const CATS = Object.keys(CATEGORY_INFO);
const specCache = new Map();
function templateSpec(cat) {
  if (!specCache.has(cat)) specCache.set(cat, localSpec(CATEGORY_INFO[cat].idea, { category: cat }));
  return specCache.get(cat);
}

export default function Gallery() {
  const { search } = useRoute();
  const [group, setGroup] = useState('all');
  const [open, setOpen] = useState(() => (CATEGORY_INFO[search.get('t')] ? search.get('t') : null));
  const list = CATS.filter((c) => group === 'all' || CATEGORY_INFO[c].group === group);

  useEffect(() => {
    document.title = `Galerie — ${BRAND.name}`;
  }, []);
  const show = useCallback((cat) => {
    setOpen(cat);
    history.replaceState({}, '', `/galerie?t=${cat}`);
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    history.replaceState({}, '', '/galerie');
  }, []);

  return (
    <div className="relative min-h-full bg-ink text-sand overflow-x-hidden">
      <SiteHeader active="/galerie" />
      <section className="relative pt-36 pb-10 px-5 overflow-hidden">
        <Pattern opacity={0.035} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full blur-[130px] opacity-30 bg-[radial-gradient(ellipse,#ff6a3d,#d8407a_45%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[12.5px] uppercase tracking-[0.2em] text-sunset">
            Galerie · {CATS.length} modèles
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="font-display text-[52px] sm:text-[80px] leading-[0.92] mt-4 max-w-4xl">
            Un métier, <em className="text-transparent bg-clip-text bg-[linear-gradient(100deg,#ffb86b,#ff6a3d_35%,#ff4d5e_65%,#e0679d)]">une app vivante.</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-sand/65 text-[17px] mt-6 max-w-2xl leading-relaxed">
            Chaque modèle est une application complète et cliquable : écrans, parcours, paiement Wave, Orange Money ou Mixx. Teste-le comme ton client le ferait, puis personnalise-le en un clic.
          </motion.p>
          <div className="mt-10 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
            {CATEGORY_GROUPS.map((g) => (
              <button key={g.id} type="button" onClick={() => setGroup(g.id)} className={`relative shrink-0 h-10 px-4 rounded-full text-[14px] transition-colors ${group === g.id ? 'text-ink' : 'text-sand/75 hover:text-sand border border-white/10'}`}>
                {group === g.id && <motion.span layoutId="gal-chip" className="absolute inset-0 rounded-full bg-sand" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-5 pb-24">
        <motion.div layout className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {list.map((cat, i) => (
              <TemplateCard key={cat} cat={cat} index={i} onOpen={() => show(cat)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="relative px-5 pb-28">
        <div className="max-w-6xl mx-auto rounded-[32px] border border-white/[0.08] overflow-hidden relative p-8 sm:p-12 flex flex-col md:flex-row md:items-center gap-8 justify-between bg-[linear-gradient(120deg,rgba(255,106,61,0.14),rgba(216,64,122,0.1)_50%,rgba(255,255,255,0.02))]">
          <div className="max-w-xl">
            <h2 className="font-display text-[40px] sm:text-[52px] leading-[0.95]">
              Ton métier n'est pas là ? <em>Décris-le.</em>
            </h2>
            <p className="text-sand/65 mt-4 leading-relaxed">L'IA compose une app sur mesure en quelques secondes, avec les mêmes animations, vidéos et le même paiement mobile.</p>
          </div>
          <Link to="/studio" className="shrink-0 h-12 px-6 inline-flex items-center gap-2 rounded-2xl text-white font-semibold bg-[linear-gradient(135deg,#ff7a3d,#ff4d5e_55%,#c8367c)] shadow-[0_12px_30px_-10px_rgba(255,77,94,0.9)]">
            <I n="wand-sparkles" s={18} /> Créer mon app
          </Link>
        </div>
      </section>

      <SiteFooter />
      <AnimatePresence>{open && <TryModal key={open} cat={open} onClose={close} onSwitch={show} />}</AnimatePresence>
    </div>
  );
}

// ───────── Carte d'un modèle (aperçu vivant, chargé à l'approche) ─────────
function TemplateCard({ cat, index, onOpen }) {
  const info = CATEGORY_INFO[cat];
  const spec = templateSpec(cat);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '300px 0px' });
  const p = spec.theme.primary;
  const a = spec.theme.accent || p;
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-[30px] border border-white/[0.07] bg-ink-2/70 overflow-hidden hover:border-white/15 transition-colors"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Tester ${spec.meta.name}`}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
        className="relative block w-full h-[430px] overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sunset/70"
      >
        <div className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(60% 55% at 50% 40%, ${p}66, transparent 70%), radial-gradient(45% 40% at 85% 95%, ${a}44, transparent 70%)` }} />
        <div className="absolute inset-x-0 top-8 -bottom-[130px] pointer-events-none transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-4">
          {inView && (
            <FitPhone className="w-full h-full" pad={0}>
              <AppPlayer spec={spec} mode="thumb" reducedMotion screenId={computeRoutes(spec).home} />
            </FitPhone>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#131019] to-transparent pointer-events-none" />
        <span className="absolute top-4 right-4 h-9 px-3.5 rounded-full bg-black/55 backdrop-blur text-[13px] text-white inline-flex items-center gap-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          <I n="play" s={14} /> Tester
        </span>
      </div>
      <div className="px-5 pb-5 pt-2">
        <div className="flex items-center gap-2 text-[12px] text-dune">
          <span className="flex -space-x-1">
            <span className="w-3.5 h-3.5 rounded-full ring-2 ring-[#131019]" style={{ background: p }} />
            <span className="w-3.5 h-3.5 rounded-full ring-2 ring-[#131019]" style={{ background: a }} />
          </span>
          <span className="uppercase tracking-[0.12em]">{info.label}</span>
          <span className="ml-auto">{spec.screens.length} écrans</span>
        </div>
        <h3 className="font-display text-[32px] leading-none mt-3">{spec.meta.name}</h3>
        <p className="text-sand/60 text-[14px] mt-2">{info.blurb}</p>
        <div className="flex gap-2 mt-4">
          <Button size="sm" icon="play" onClick={onOpen}>
            Tester
          </Button>
          <Button size="sm" variant="outline" icon="pencil" onClick={() => go(`/studio?tpl=${cat}`)}>
            Personnaliser
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

// ───────── Essai en grand : l'app interactive + visite guidée ─────────
function TryModal({ cat, onClose, onSwitch }) {
  const info = CATEGORY_INFO[cat];
  const spec = templateSpec(cat);
  const player = useRef(null);
  const [screen, setScreen] = useState(spec.initial);
  const [touring, setTouring] = useState(false);
  const [copied, setCopied] = useState(false);
  const idx = CATS.indexOf(cat);
  const link = useMemo(() => shareUrl(spec), [spec]);

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) onSwitch(CATS[(idx + 1) % CATS.length]);
      if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) onSwitch(CATS[(idx - 1 + CATS.length) % CATS.length]);
    };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [onClose, onSwitch, idx]);

  useEffect(() => {
    if (!touring) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => player.current && playTour(player.current, spec, { signal: ctrl.signal }), 50);
    return () => (clearTimeout(t), ctrl.abort());
  }, [touring, spec]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copie ce lien :', link);
    }
  };

  return createPortal(
    <motion.div className="fixed inset-0 z-[150] flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="absolute inset-0 bg-[#07060b]/90 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: `radial-gradient(40% 50% at 35% 50%, ${spec.theme.primary}55, transparent 70%)` }} />
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }} className="relative m-auto w-full h-full max-w-6xl flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-10 p-3 sm:p-6 overflow-y-auto lg:overflow-hidden">
        <button type="button" aria-label="Fermer" onClick={onClose} className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <I n="x" s={20} />
        </button>
        <div className="relative shrink-0 h-[74vh] lg:h-full lg:flex-1 min-h-[480px]" onPointerDownCapture={(e) => e.isTrusted && touring && setTouring(false)}>
          <FitPhone className="w-full h-full" pad={12}>
            <AppPlayer ref={player} spec={spec} autopilot={touring} onScreenChange={setScreen} />
          </FitPhone>
        </div>
        <div className="relative lg:w-[400px] shrink-0 pb-8 lg:pb-0 px-2">
          <p className="text-[12px] uppercase tracking-[0.18em] text-sunset">{info.label}</p>
          <h2 className="font-display text-[48px] sm:text-[60px] leading-[0.92] mt-2">{spec.meta.name}</h2>
          <p className="text-sand/70 text-[16px] mt-3">{spec.meta.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant={touring ? 'subtle' : 'accent'} icon={touring ? 'pause' : 'play'} onClick={() => setTouring((t) => !t)}>
              {touring ? 'Arrêter la visite' : 'Visite guidée'}
            </Button>
            <Button variant="primary" icon="pencil" onClick={() => go(`/studio?tpl=${cat}`)}>
              Personnaliser
            </Button>
          </div>
          <p className="text-[12px] uppercase tracking-[0.16em] text-dune mt-8 mb-3">Écrans</p>
          <div className="flex flex-wrap gap-1.5">
            {spec.screens.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTouring(false);
                  player.current?.navigate(s.id);
                }}
                className={`h-8 px-3 rounded-full text-[12.5px] border transition-colors ${screen === s.id ? 'bg-sand text-ink border-sand' : 'border-white/12 text-sand/75 hover:text-sand hover:border-white/30'}`}
              >
                {s.title}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[13.5px]">
            <button type="button" onClick={copy} className="inline-flex items-center gap-2 text-sand/80 hover:text-sand">
              <I n={copied ? 'check' : 'link'} s={16} /> {copied ? 'Lien copié' : 'Copier le lien de présentation'}
            </button>
            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sand/80 hover:text-sand">
              <I n="external-link" s={16} /> Plein écran
            </a>
          </div>
          <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-[13px] text-dune">
            <button type="button" onClick={() => onSwitch(CATS[(idx - 1 + CATS.length) % CATS.length])} className="inline-flex items-center gap-1.5 hover:text-sand">
              <I n="chevron-left" s={16} /> {CATEGORY_INFO[CATS[(idx - 1 + CATS.length) % CATS.length]].label}
            </button>
            <button type="button" onClick={() => onSwitch(CATS[(idx + 1) % CATS.length])} className="inline-flex items-center gap-1.5 hover:text-sand">
              {CATEGORY_INFO[CATS[(idx + 1) % CATS.length]].label} <I n="chevron-right" s={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
