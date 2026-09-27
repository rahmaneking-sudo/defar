// ─────────────────────────────────────────────────────────────────────────────
// LANDING — identité originale « coucher de soleil sur Dakar », vidéos animées,
// démos en direct qui s'utilisent toutes seules.
// ─────────────────────────────────────────────────────────────────────────────
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { I, Pattern } from '../ui/kit.jsx';
import { SiteHeader, SiteFooter, useHashScroll } from '../ui/site.jsx';
import { Link, go } from '../router.jsx';
import { EXAMPLES, BRAND } from '../config.js';
import { mixkitSources, mixkitPoster } from '../../shared/media-library.js';
import { MotionBg } from '../engine/ui.jsx';
import { Illustration, CATEGORY_ILLU } from '../engine/illustrations.jsx';
import { themeVars } from '../engine/theme.js';
import { isTouch, pauseAllOffscreen, saveData, useIdle, useQueuedMount, whenIdle } from '../lib/offscreen.js';

const FX = !isTouch(); // flous et effets lourds : seulement sur ordinateur

// ───────── Fond animé de secours (si la vidéo ne charge pas, rien n'est jamais vide) ─────────
function MotionArt({ tpl, primary, accent, illu = true, size = 190 }) {
  const vars = useMemo(() => themeVars({ mode: 'dark', primary, accent, radius: 20 }).vars, [primary, accent]);
  return (
    <div className="absolute inset-0" style={vars}>
      <MotionBg variant="dark" intensity={1} />
      {illu && (
        <div className="absolute inset-0 flex items-center justify-center pb-20 opacity-95">
          <Illustration name={CATEGORY_ILLU[tpl] || 'success'} size={size} />
        </div>
      )}
    </div>
  );
}

// Petit écran : vidéos allégées
const isSmall = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 768px)').matches;

// ───────── Vidéo de fond : chargée seulement à l'approche, en pause hors écran ─────────
// - le fond animé (art) ne sert que tant que l'affiche n'est pas là : plus rien ne tourne derrière une image ;
// - la vidéo se télécharge à l'approche mais ne joue que si elle est vraiment visible ;
// - la vidéo du haut attend que la page soit chargée (l'affiche s'affiche tout de suite).
function LoopVideo({ sources, mobileSources, poster, className = '', style, fallback = 'linear-gradient(135deg,#2a1320,#120f1a)', eager = false, art = null }) {
  const wrap = useRef(null);
  const ref = useRef(null);
  const visible = useRef(false);
  const list = useMemo(() => (mobileSources && isSmall() ? mobileSources : sources), [sources, mobileSources]);
  const [near, setNear] = useState(false);
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [posterOk, setPosterOk] = useState(false);
  const [skip] = useState(saveData);
  useEffect(() => {
    const el = wrap.current;
    if (!el || skip) return;
    let stopIdle = () => {};
    const nearIo = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        nearIo.disconnect();
        if (eager) stopIdle = whenIdle(() => setNear(true), 2500);
        else setNear(true);
      },
      { rootMargin: eager ? '1200px 0px' : '300px 0px' }
    );
    const playIo = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        const v = ref.current;
        if (!v) return;
        if (e.isIntersecting) v.play?.().catch(() => {});
        else v.pause?.();
      },
      { threshold: 0.15 }
    );
    nearIo.observe(el);
    playIo.observe(el);
    return () => (nearIo.disconnect(), playIo.disconnect(), stopIdle());
  }, [skip, eager]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute('muted', '');
    if (visible.current) v.play?.().catch(() => {});
  }, [near, i]);
  return (
    <div ref={wrap} className={`overflow-hidden ${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} ${className}`} style={{ background: fallback, ...style }}>
      {art && !posterOk && !ready && art}
      {poster && <img src={poster} alt="" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async" className="absolute inset-0 w-full h-full object-cover" onLoad={() => setPosterOk(true)} onError={(e) => (e.currentTarget.style.display = 'none')} />}
      {near && !failed && (
        <video
          key={i}
          ref={ref}
          src={list[i]}
          muted
          playsInline
          loop
          preload={eager ? 'auto' : 'metadata'}
          onLoadedData={(e) => visible.current && e.currentTarget.play?.().catch(() => {})}
          onPlaying={() => setReady(true)}
          onError={() => (i + 1 < list.length ? setI(i + 1) : setFailed(true))}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: ready ? 1 : 0, transition: 'opacity .8s ease' }}
        />
      )}
    </div>
  );
}

// ───────── Démos (moteur complet) : chargées quand la section approche ─────────
const LiveDemo = lazy(() => import('./landing/Demos.jsx').then((m) => ({ default: m.LiveDemo })));
const CheckoutDemo = lazy(() => import('./landing/Demos.jsx').then((m) => ({ default: m.CheckoutDemo })));
function Near({ children, className = '', margin = '500px 0px', early = false }) {
  const ref = useRef(null);
  const size = useRef(null);
  const [near, setNear] = useState(false);
  const [shown, setShown] = useState(false);
  // early : préparée pendant un temps libre après le chargement, avant même que l'on défile
  const idle = useIdle(3500);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: margin });
    // hors écran, la démo n'est plus dessinée (content-visibility) : le téléphone ne travaille plus pour elle,
    // mais tout reste prêt, donc elle réapparaît instantanément
    const vis = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting && el.offsetHeight) size.current = [el.offsetWidth, el.offsetHeight];
        setShown(e.isIntersecting);
      },
      { rootMargin: '300px 200px' }
    );
    io.observe(el);
    vis.observe(el);
    return () => (io.disconnect(), vis.disconnect());
  }, [margin]);
  // une démo à la fois, en rendu interruptible : le défilement reste fluide
  const on = useQueuedMount(near || (early && idle));
  const ph = <div className="w-[300px] h-[620px] sm:w-[320px] sm:h-[660px] rounded-[48px] bg-white/[0.03] border border-white/[0.06]" />;
  const [w, h] = size.current || (isSmall() ? [300, 620] : [320, 660]);
  return (
    <div ref={ref} className={className} style={on && !shown ? { contentVisibility: 'hidden', containIntrinsicSize: `${w}px ${h}px` } : undefined}>
      {on ? <Suspense fallback={ph}>{children}</Suspense> : ph}
    </div>
  );
}

// ───────── Zone de saisie de l'idée (avec machine à écrire) ─────────
function IdeaBox({ big = true }) {
  const [idea, setIdea] = useState('');
  const box = useRef(null);
  const ta = useRef(null);
  // machine à écrire : écrit directement dans le champ (aucun re-rendu), et s'arrête hors écran
  useEffect(() => {
    const el = ta.current;
    if (idea || !el) return;
    let k = 0;
    let n = 0;
    let dir = 1;
    let id = 0;
    const tick = () => {
      const text = EXAMPLES[k % EXAMPLES.length].idea;
      n += dir * (dir > 0 ? 1 : 3);
      el.placeholder = text.slice(0, Math.max(0, n)) + '▍';
      if (n >= text.length + 26) dir = -1;
      if (n <= 0 && dir < 0) {
        k++;
        n = 0;
        dir = 1;
      }
    };
    const start = () => !id && (id = setInterval(tick, 45));
    const stop = () => (clearInterval(id), (id = 0));
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(box.current || el);
    return () => (io.disconnect(), stop());
  }, [idea]);
  const submit = () => idea.trim().length > 3 && go(`/studio?idea=${encodeURIComponent(idea.trim())}`);
  return (
    <div ref={box} className="w-full">
      <div className="relative rounded-[28px] p-[1.5px] bg-[linear-gradient(135deg,rgba(255,138,61,0.85),rgba(255,77,94,0.55)_40%,rgba(255,255,255,0.12)_75%)] shadow-[0_30px_80px_-30px_rgba(255,77,94,0.55)]">
        <div className="rounded-[26px] bg-[#120f18]/90 backdrop-blur-xl p-3 sm:p-4">
          <textarea
            ref={ta}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit())}
            rows={big ? 3 : 2}
            placeholder="▍"
            aria-label="Décris ton application"
            className="w-full bg-transparent outline-none resize-none text-[16px] sm:text-[18px] leading-relaxed text-sand placeholder:text-dune/70 px-2 pt-1"
          />
          <div className="flex items-center justify-between gap-3 mt-2 px-1">
            <div className="hidden sm:flex items-center gap-3 text-[12px] text-dune">
              <span className="inline-flex items-center gap-1.5">
                <I n="languages" s={14} /> FR · Wolof · EN
              </span>
              <span className="inline-flex items-center gap-1.5">
                <I n="shield-check" s={14} /> Sans carte bancaire
              </span>
            </div>
            <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={submit} className="ml-auto h-12 px-5 sm:px-6 rounded-2xl font-semibold text-[15px] text-white inline-flex items-center gap-2 bg-[linear-gradient(135deg,#ff7a3d,#ff4d5e_55%,#c8367c)] shadow-[0_12px_30px_-10px_rgba(255,77,94,0.9)] disabled:opacity-50" disabled={idea.trim().length < 4}>
              <I n="wand-sparkles" s={18} /> Donner vie
            </motion.button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {EXAMPLES.slice(0, 6).map((e) => (
          <button key={e.label} type="button" onClick={() => setIdea(e.idea)} className="text-[12.5px] px-3.5 h-8 rounded-full border border-white/12 bg-white/[0.03] text-sand/80 hover:text-sand hover:border-white/30 backdrop-blur">
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const reveal = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.25 }, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } };

const TRADES = [
  { label: 'Restaurants & traiteurs', app: 'Menu, réservation, livraison', v: 'videos/4678/4678', t: 0, tpl: 'restaurant', c: ['#e8552d', '#f2a33a'] },
  { label: 'Coiffure & beauté', app: 'Créneaux, acompte Wave', v: 'videos/40126/40126', t: 0, tpl: 'beauty', c: ['#c2185b', '#f48fb1'] },
  { label: 'Couture & mode', app: 'Catalogue wax, tailles', v: 'videos/45527/45527', t: 0, tpl: 'fashion', c: ['#7b3fe4', '#f2b134'] },
  { label: 'Livraison', app: 'Suivi du livreur en direct', v: 'videos/31974/31974', t: 0, tpl: 'delivery', c: ['#ff5a36', '#ffb347'] },
  { label: 'Santé', app: 'RDV, téléconsultation', v: 'videos/6562/6562', t: 0, tpl: 'health', c: ['#0f9d8a', '#5ec8f2'] },
  { label: 'Agriculture', app: 'Météo, prix, conseils', v: 'videos/46563/46563', t: 2, tpl: 'agriculture', c: ['#2e8b3d', '#c6d93b'] },
  { label: 'Événements', app: 'Billets QR code', v: 'videos/4127/4127', t: 0, tpl: 'events', c: ['#6c2bd9', '#ff4d8d'] },
  { label: 'Tontines & finance', app: 'Cotisations, rappels', v: 'videos/23168/23168', t: 2, tpl: 'finance', c: ['#0b8f6a', '#e9b949'] },
];

export default function Landing() {
  const heroRef = useRef(null);
  // progression du défilement dans le haut de page (0 → 1), calculée sans mesurer toute la page
  const scrollYProgress = useMotionValue(0);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let h = el.offsetHeight || 1;
    const onResize = () => (h = el.offsetHeight || 1);
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      if (p !== scrollYProgress.get()) scrollYProgress.set(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => (window.removeEventListener('scroll', onScroll), window.removeEventListener('resize', onResize));
  }, [scrollYProgress]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const root = useRef(null);
  useHashScroll();
  useEffect(() => {
    document.title = `${BRAND.name} — Décris ton app, elle prend vie`;
  }, []);
  // sections hors écran : animations CSS en pause (défilé, fonds, grain…)
  useEffect(() => pauseAllOffscreen(root.current?.querySelectorAll('section, [data-pause]') || []), []);

  return (
    <div ref={root} className="relative bg-ink text-sand overflow-x-hidden">
      <SiteHeader />

      {/* ───── Hero vidéo ───── */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <LoopVideo eager className="absolute inset-0" art={<MotionArt primary="#ff6a3d" accent="#d8407a" illu={false} />} sources={['/media/hero.webm', '/media/hero.mp4']} mobileSources={['/media/hero-mobile.webm', '/media/hero-mobile.mp4', '/media/hero.mp4']} poster="/media/hero-poster.jpg" fallback="#120f18" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,10,16,0.35),rgba(11,10,16,0.88)_70%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />
        </motion.div>
        <div className="grain absolute inset-0 pointer-events-none" />
        <motion.div style={{ opacity: heroFade }} className="relative z-10 w-full max-w-4xl px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full border border-white/12 bg-white/[0.04] backdrop-blur text-[12.5px] text-sand/85">
            <span className="w-1.5 h-1.5 rounded-full bg-sunset animate-pulse" />
            Défar veut dire « construire » en wolof
          </motion.div>
          <h1 className="font-display text-[54px] sm:text-[84px] md:text-[104px] leading-[0.9] tracking-[-0.02em] mt-6">
            <motion.span initial={{ opacity: 0, y: 40, ...(FX && { filter: 'blur(10px)' }) }} animate={{ opacity: 1, y: 0, ...(FX && { filter: 'blur(0px)' }) }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="block">
              Décris ton app.
            </motion.span>
            <motion.em initial={{ opacity: 0, y: 40, ...(FX && { filter: 'blur(10px)' }) }} animate={{ opacity: 1, y: 0, ...(FX && { filter: 'blur(0px)' }) }} transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }} className="block text-transparent bg-clip-text bg-[linear-gradient(100deg,#ffb86b,#ff6a3d_30%,#ff4d5e_60%,#e0679d)]">
              Elle prend vie.
            </motion.em>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 text-[17px] sm:text-[19px] text-sand/75 max-w-2xl mx-auto leading-relaxed">
            Une idée en quelques mots, et {BRAND.name} livre une vraie app animée : vidéos, parcours complet, paiement Wave, Orange Money et Mixx by Yas. Prête à montrer à ton client dans la minute.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="mt-9 max-w-3xl mx-auto">
            <IdeaBox />
          </motion.div>
        </motion.div>
        <motion.a href="#demo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-sand/50">
          Regarde
          <span className="inline-block" style={{ animation: 'nudge 1.6s ease-in-out infinite' }}>
            <I n="chevron-right" s={18} className="rotate-90" />
          </span>
        </motion.a>
      </section>

      {/* ───── Bandeau défilant ───── */}
      <div className="relative border-y border-white/[0.06] py-5 overflow-hidden" data-pause>
        <div className="flex gap-10 whitespace-nowrap w-max" style={{ animation: 'marquee 40s linear infinite' }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-10 items-center font-display italic text-[28px] text-sand/40">
              {['Livraison', 'Salon de tresses', 'Tontine', 'Boutique wax', 'Clinique', 'Taxi', 'Billetterie', 'Agriculture', 'Hôtel à Saly', 'Épicerie', 'Coaching', 'Immobilier'].map((w) => (
                <span key={w + k} className="flex items-center gap-10">
                  {w}
                  <span className="w-2 h-2 rotate-45 bg-sunset/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ───── Démos en direct ───── */}
      <section id="demo" className="relative py-28 px-5">
        <Pattern opacity={0.035} />
        <div className="relative max-w-6xl mx-auto">
          <motion.div {...reveal} className="max-w-2xl">
            <p className="text-[12.5px] uppercase tracking-[0.2em] text-sunset">En direct, rien n'est filmé</p>
            <h2 className="font-display text-[46px] sm:text-[64px] leading-[0.95] mt-4">
              Ces apps <em>s'utilisent toutes seules</em> sous tes yeux.
            </h2>
            <p className="text-sand/65 text-[17px] mt-5 leading-relaxed">Commande, réservation, paiement Wave, confirmation, suivi du livreur : chaque maquette générée est un vrai parcours cliquable, animé de bout en bout.</p>
          </motion.div>
          <div className="mt-16 flex gap-10 overflow-x-auto no-scrollbar snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible -mx-5 px-5 lg:mx-0 lg:px-0">
            {[
              { cat: 'delivery', idea: 'Livraison de plats sénégalais à Dakar', caption: 'Livraison · paiement Wave', delay: 0 },
              { cat: 'beauty', idea: 'Salon de tresses à Dakar', caption: 'Réservation · Orange Money', delay: 1800 },
              { cat: 'finance', idea: 'Tontine digitale entre amis', caption: 'Tontine · cotisation mobile', delay: 900 },
            ].map((d) => (
              <div key={d.cat} className="snap-center shrink-0">
                <Near early>
                  <LiveDemo {...d} />
                </Near>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Métiers (vidéos) ───── */}
      <section id="metiers" className="relative py-28 px-5 bg-ink-2/60">
        <div className="max-w-6xl mx-auto">
          <motion.div {...reveal} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[12.5px] uppercase tracking-[0.2em] text-sunset">Tous les métiers</p>
              <h2 className="font-display text-[46px] sm:text-[60px] leading-[0.95] mt-4">
                Une app qui parle <em>à tes clients</em>, pas à la Silicon Valley.
              </h2>
            </div>
            <p className="text-sand/60 max-w-sm text-[15.5px] leading-relaxed">Prix en FCFA, prénoms et quartiers d'ici, français chaleureux, paiements locaux. Choisis un métier pour partir d'un modèle.</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-14">
            {TRADES.map((t, i) => (
              <motion.button key={t.label} type="button" onClick={() => go(`/studio?tpl=${t.tpl}`)} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: (i % 4) * 0.08, duration: 0.7 }} className={`group relative overflow-hidden rounded-3xl text-left ${i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[3/4] lg:aspect-[3/4]'}`}>
                <LoopVideo className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" art={<MotionArt tpl={t.tpl} primary={t.c[0]} accent={t.c[1]} />} sources={[...mixkitSources(t.v)].reverse()} poster={mixkitPoster(t.v, t.t)} fallback={`linear-gradient(160deg, #0d0b14, ${t.c[0]}55)`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="font-display text-[24px] sm:text-[28px] leading-none">{t.label}</p>
                  <p className="text-[12.5px] text-white/70 mt-2">{t.app}</p>
                </div>
                <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <I n="arrow-up-right" s={17} />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Comment ça marche ───── */}
      <section className="relative py-28 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...reveal} className="font-display text-[46px] sm:text-[60px] leading-[0.95] max-w-3xl">
            Trois gestes, <em>zéro ligne de code.</em>
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-5 mt-14">
            {[
              { n: '01', t: 'Décris', d: 'Ton activité, tes clients, ce que l\'app doit faire. En français, en wolof ou en anglais.', icon: 'pencil' },
              { n: '02', t: 'Ajuste', d: 'Clique sur un bloc pour changer un texte, une photo, une vidéo, un prix. Ou demande à l\'IA.', icon: 'sliders-horizontal' },
              { n: '03', t: 'Présente & encaisse', d: 'Envoie le lien par WhatsApp : ton client teste l\'app sur son téléphone. Puis encaisse l\'acompte.', icon: 'send' },
            ].map((s, i) => (
              <motion.div key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }} className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-7 overflow-hidden">
                <span className="font-display text-[90px] leading-none text-white/[0.06] absolute -top-2 right-4">{s.n}</span>
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[linear-gradient(135deg,#ff7a3d,#d8407a)] text-white">
                  <I n={s.icon} s={22} />
                </span>
                <h3 className="font-display text-[34px] mt-6">{s.t}</h3>
                <p className="text-sand/65 mt-3 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Film ───── */}
      <section className="relative py-10 px-5">
        <motion.div {...reveal} className="max-w-6xl mx-auto relative rounded-[36px] overflow-hidden border border-white/[0.08] aspect-video">
          <LoopVideo className="absolute inset-0" art={<MotionArt primary="#ff6a3d" accent="#d8407a" illu={false} />} sources={['/media/film.webm', '/media/film.mp4']} poster="/media/film-poster.jpg" fallback="#120f18" />
          <div className="absolute left-5 bottom-5 sm:left-8 sm:bottom-8 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-black/45 backdrop-blur text-[13px] text-white/85">
            <I n="film" s={15} /> {BRAND.name} en 26 secondes
          </div>
        </motion.div>
      </section>

      {/* ───── Paiement ───── */}
      <section id="paiement" className="relative py-28 px-5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <motion.div {...reveal}>
            <p className="text-[12.5px] uppercase tracking-[0.2em] text-sunset">Paiement mobile intégré</p>
            <h2 className="font-display text-[46px] sm:text-[60px] leading-[0.95] mt-4">
              Wave, Orange Money, Mixx. <em>Pour de vrai.</em>
            </h2>
            <p className="text-sand/65 text-[17px] mt-5 leading-relaxed">Dans les maquettes, le paiement est simulé à la perfection : code secret, notification, reçu. Et quand tu es prêt, {BRAND.name} encaisse réellement via l'API Wave Business et PayDunya, avec des liens de paiement signés à partager sur WhatsApp.</p>
            <ul className="mt-7 flex flex-col gap-3 text-[15px]">
              {['Liens de paiement signés, impossibles à modifier', 'Vérification du paiement auprès de l\'opérateur, jamais côté client', 'Notification de commande vers Google Sheets, Make ou Zapier', 'Mode test complet sans aucune clé'].map((x) => (
                <li key={x} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-baobab/15 text-baobab flex items-center justify-center shrink-0 mt-0.5">
                    <I n="check" s={14} />
                  </span>
                  <span className="text-sand/85">{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/paiements" className="h-12 px-6 inline-flex items-center gap-2 rounded-2xl bg-sand text-ink font-semibold hover:bg-white">
                Créer un lien de paiement <I n="arrow-right" s={17} />
              </Link>
              <Link to="/pay?a=15000&d=Acompte%20maquette%20Glow%20Dakar&m=Glow%20Dakar&demo=1" className="h-12 px-6 inline-flex items-center gap-2 rounded-2xl border border-white/15 hover:bg-white/5">
                Essayer le checkout
              </Link>
            </div>
          </motion.div>
          <motion.div {...reveal} className="relative flex justify-center">
            <div className="absolute w-[640px] h-[640px] opacity-40 bg-[radial-gradient(closest-side,#ff6a3d,rgba(255,106,61,0.35)_45%,transparent)] pointer-events-none" />
            <Near>
              <CheckoutDemo />
            </Near>
          </motion.div>
        </div>
      </section>

      {/* ───── Atouts ───── */}
      <section className="relative py-24 px-5 bg-ink-2/60">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ['film', 'Vidéos & motion design', 'Bannières vidéo, transitions natives, micro-animations, confettis : chaque écran respire.'],
            ['shield-check', 'Zéro écran cassé', 'Un moteur de rendu testé répare automatiquement tout ce que l\'IA pourrait mal faire.'],
            ['pencil', 'Éditeur au pixel près', 'Textes, photos, vidéos, prix, couleurs, écrans, parcours : tout se modifie en un clic.'],
            ['wand-sparkles', 'L\'IA de ton choix', 'Claude, OpenAI ou Gemini. Sans clé, des modèles par métier prennent le relais.'],
            ['package', 'Export en un clic', 'Lien de présentation, fichier HTML autonome, pack client .zip avec mode d\'emploi.'],
            ['smartphone', 'Vraie sensation d\'app', 'Sur téléphone, la maquette s\'ouvre en plein écran, comme une application installée.'],
          ].map(([icon, t, d], i) => (
            <motion.div key={t} {...reveal} transition={{ ...reveal.transition, delay: (i % 3) * 0.08 }} className="rounded-3xl border border-white/[0.07] p-6 hover:border-white/15 transition-colors">
              <I n={icon} s={24} className="text-sunset" />
              <h3 className="text-[18px] font-semibold mt-4">{t}</h3>
              <p className="text-sand/60 mt-2 leading-relaxed text-[14.5px]">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───── Appel final ───── */}
      <section className="relative py-32 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[760px] opacity-35 bg-[radial-gradient(closest-side,#ff6a3d,rgba(216,64,122,0.6)_45%,transparent)]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.h2 {...reveal} className="font-display text-[52px] sm:text-[78px] leading-[0.92]">
            Ton prochain client attend de <em>voir</em> son app.
          </motion.h2>
          <motion.div {...reveal} className="mt-10">
            <IdeaBox big={false} />
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
