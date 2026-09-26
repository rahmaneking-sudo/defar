// Briques visuelles du moteur : icônes, images, vidéos, fonds animés, avatars…
import { useContext, useEffect, useMemo, useRef, useState, memo } from 'react';
import { RtCtx } from './context.js';
import { motion, animate, useInView, AnimatePresence } from 'motion/react';
import { ICON_MAP } from './icon-map.js';
import { imageSrc, videoSources } from '../../shared/media.js';
import { formatMoney, hash, initials } from '../../shared/utils.js';

// ───────── Icône ─────────
export const Icon = memo(function Icon({ name, size = 20, className = '', strokeWidth = 2, style }) {
  if (typeof name === 'string' && name.startsWith('emoji:')) {
    return (
      <span className={className} style={{ fontSize: size * 0.95, lineHeight: 1, display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center', ...style }}>
        {name.slice(6)}
      </span>
    );
  }
  const C = ICON_MAP[name] || ICON_MAP.sparkles;
  return <C size={size} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true" />;
});

// ───────── Fond animé (motion design sans aucun fichier externe) ─────────
export function MotionBg({ className = '', variant = 'blobs', intensity = 1, grain = true, children, style }) {
  const blobs = [
    { c: 'var(--app-primary)', s: 70, x: -15, y: -10, d: 16 },
    { c: 'var(--app-accent)', s: 60, x: 45, y: 25, d: 19 },
    { c: 'color-mix(in srgb, var(--app-primary) 60%, #ffffff)', s: 45, x: 10, y: 55, d: 23 },
    { c: 'color-mix(in srgb, var(--app-accent) 55%, #000000)', s: 55, x: 60, y: -20, d: 27 },
  ];
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${grain ? 'grain' : ''} ${className}`}
      style={{ background: variant === 'dark' ? 'linear-gradient(160deg, #0d0b14, color-mix(in srgb, var(--app-primary) 35%, #0d0b14))' : 'linear-gradient(145deg, color-mix(in srgb, var(--app-primary) 88%, #000), color-mix(in srgb, var(--app-accent) 70%, var(--app-primary)))', ...style }}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${b.s}%`,
            aspectRatio: '1',
            left: `${b.x}%`,
            top: `${b.y}%`,
            background: `radial-gradient(circle at 50% 50%, ${b.c} 0%, color-mix(in srgb, ${b.c} 55%, transparent) 38%, transparent 70%)`,
            opacity: 0.9 * intensity,
            willChange: 'transform',
            animation: `blob ${b.d}s ease-in-out ${i * -3}s infinite`,
            mixBlendMode: i % 2 ? 'screen' : 'normal',
          }}
        />
      ))}
      {children}
    </div>
  );
}

// ───────── Image avec repli élégant ─────────
export function Img({ src, w = 800, alt = '', className = '', style, face = false, kenburns = false, rounded = '', eager = false, placeholder = true }) {
  const url = useMemo(() => imageSrc(src, w, { face }), [src, w, face]);
  const [state, setState] = useState(url ? 'loading' : 'failed');
  useEffect(() => setState(url ? 'loading' : 'failed'), [url]);
  const seed = hash(String(src || alt)) % 360;
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden ${rounded} ${className}`} style={style}>
      {state !== 'loaded' && placeholder && (
        <div
          className={`absolute inset-0 ${state === 'failed' ? 'grain' : ''}`}
          style={{
            background:
              state === 'failed'
                ? `radial-gradient(120% 90% at ${20 + (seed % 60)}% ${10 + (seed % 30)}%, color-mix(in srgb, var(--app-accent) 55%, transparent), transparent 60%), radial-gradient(90% 80% at ${90 - (seed % 40)}% 100%, color-mix(in srgb, var(--app-primary) 75%, #000 10%), transparent 70%), linear-gradient(${seed}deg, color-mix(in srgb, var(--app-primary) 70%, #1a1016), color-mix(in srgb, var(--app-accent) 45%, var(--app-primary)))`
                : `linear-gradient(${seed}deg, color-mix(in srgb, var(--app-primary) 22%, var(--app-surface)), color-mix(in srgb, var(--app-accent) 18%, var(--app-surface)))`,
          }}
        >
          {state === 'loading' && <div className="absolute inset-0 shimmer-sweep opacity-60" />}
        </div>
      )}
      {url && state !== 'failed' && (
        <img
          src={url}
          alt={alt}
          draggable={false}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className={`absolute inset-0 w-full h-full object-cover ${kenburns ? 'kenburns' : ''}`}
          style={{ opacity: state === 'loaded' ? 1 : 0, transition: 'opacity .45s ease' }}
        />
      )}
    </div>
  );
}

// ───────── Vidéo en boucle (lecture auto, pause hors écran, repli) ─────────
export function Video({ src, poster, className = '', style, rounded = '', fallback = 'motion', showPoster = true }) {
  const rt = useContext(RtCtx);
  const still = rt?.mode === 'thumb'; // vignettes (galerie) : l'affiche suffit, zéro téléchargement vidéo
  const vs = useMemo(() => videoSources(src), [src]);
  const posterUrl = useMemo(() => imageSrc(poster, 900) || vs?.poster || null, [poster, vs]);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(!vs);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState(false);
  const ref = useRef(null);
  const wrap = useRef(null);
  useEffect(() => {
    setIdx(0);
    setFailed(!vs);
    setReady(false);
  }, [vs]);
  useEffect(() => {
    const el = wrap.current;
    if (!el || still) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          ref.current?.play?.().catch(() => {});
        } else ref.current?.pause?.();
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [still]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute('muted', '');
    v.play?.().catch(() => {});
  }, [idx, near]);
  return (
    <div ref={wrap} className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden ${rounded} ${className}`} style={style}>
      {(!ready || failed) && (fallback === 'motion' ? <MotionBg grain={false} /> : <div className="absolute inset-0 bg-app-surface2" />)}
      {showPoster && posterUrl && !ready && (
        <img src={posterUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}
      {!failed && vs && near && !still && (
        <video
          key={idx}
          ref={ref}
          src={vs.sources[idx]}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          onPlaying={() => setReady(true)}
          onError={() => (idx + 1 < vs.sources.length ? setIdx(idx + 1) : setFailed(true))}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: ready ? 1 : 0, transition: 'opacity .6s ease' }}
        />
      )}
    </div>
  );
}

// Média générique : {kind, src} -> vidéo ou image
export function Media({ media, className = '', style, w = 900, kenburns = true, rounded = '' }) {
  if (!media || !media.src) return <MotionBg className={className} style={style} />;
  if (media.kind === 'video') return <Video src={media.src} poster={media.poster} className={`absolute inset-0 ${className}`} style={style} rounded={rounded} />;
  return <Img src={media.src} w={w} className={`absolute inset-0 ${className}`} style={style} kenburns={kenburns} rounded={rounded} />;
}

// ───────── Avatar ─────────
export function Avatar({ src, name = '', size = 40, ring = false, className = '' }) {
  const [failed, setFailed] = useState(false);
  const url = imageSrc(src, size * 3, { face: true });
  const hue = hash(name) % 60;
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        padding: ring ? 2 : 0,
        background: ring ? 'conic-gradient(from 200deg, var(--app-primary), var(--app-accent), var(--app-primary))' : undefined,
      }}
    >
      <div className="w-full h-full rounded-full overflow-hidden" style={{ boxShadow: ring ? '0 0 0 2px var(--app-bg)' : undefined }}>
        {url && !failed ? (
          <img src={url} alt={name} draggable={false} className="w-full h-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-semibold"
            style={{
              fontSize: size * 0.38,
              color: 'var(--app-on-primary)',
              background: `linear-gradient(${135 + hue}deg, var(--app-primary), color-mix(in srgb, var(--app-accent) 70%, var(--app-primary)))`,
            }}
          >
            {initials(name)}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────── Étoiles ─────────
const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';
export function Stars({ value = 5, size = 12 }) {
  const row = (color) => (
    <span className="flex" style={{ gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ fill: color, flexShrink: 0 }}>
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
  const pct = Math.max(0, Math.min(1, Number(value) / 5)) * 100;
  return (
    <span className="relative inline-flex" aria-label={`${value} sur 5`}>
      <span style={{ opacity: 0.28 }}>{row('var(--app-muted)')}</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row('#F5B301')}
      </span>
    </span>
  );
}

// ───────── Nombre animé ─────────
export function CountUp({ value = 0, duration = 1.1, format = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' '), className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, Number(value) || 0, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, value, duration]);
  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {format(v)}
    </span>
  );
}

export function Money({ value, currency = 'FCFA', compact = true, className = '', strike = false, signed = false, style }) {
  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums', textDecoration: strike ? 'line-through' : undefined, whiteSpace: 'nowrap', ...style }}>
      {signed && value > 0 ? '+' : ''}
      {formatMoney(value, currency, compact)}
    </span>
  );
}

// ───────── Boutons ─────────
export function Btn({ children, onClick, variant = 'primary', className = '', full = false, size = 'md', disabled, icon, style, type = 'button' }) {
  const base = 'relative inline-flex items-center justify-center gap-2 font-semibold select-none transition-[filter,opacity] disabled:opacity-50';
  const sizes = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-12 px-5 text-[15px]', lg: 'h-14 px-6 text-[16px]' };
  const variants = {
    primary: { background: 'var(--app-primary)', color: 'var(--app-on-primary)' },
    secondary: { background: 'var(--app-primary-soft)', color: 'var(--app-primary-ink)' },
    outline: { background: 'transparent', color: 'var(--app-text)', boxShadow: 'inset 0 0 0 1.5px var(--app-border)' },
    ghost: { background: 'transparent', color: 'var(--app-primary-ink)' },
    dark: { background: 'var(--app-text)', color: 'var(--app-bg)' },
    light: { background: '#ffffff', color: '#0f1115' },
    glass: { background: 'rgba(255,255,255,0.18)', color: '#ffffff', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)' },
  };
  return (
    <motion.button
      type={type}
      whileTap={disabled ? undefined : { scale: 0.965 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      style={{ borderRadius: 'min(var(--app-radius), 999px)', ...variants[variant], ...style }}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </motion.button>
  );
}

export function Tap({ children, onClick, className = '', style, as = 'div', ...rest }) {
  const C = as === 'button' ? motion.button : motion.div;
  return (
    <C whileTap={{ scale: 0.975 }} transition={{ type: 'spring', stiffness: 520, damping: 32 }} onClick={onClick} className={`cursor-pointer ${className}`} style={style} {...rest}>
      {children}
    </C>
  );
}

// ───────── Cœur favori avec éclat ─────────
export function HeartButton({ active, onToggle, size = 34, className = '', light = false }) {
  const [burst, setBurst] = useState(0);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!active) setBurst((b) => b + 1);
        onToggle?.();
      }}
      className={`relative inline-flex items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, background: light ? 'rgba(255,255,255,0.9)' : 'color-mix(in srgb, var(--app-bg) 82%, transparent)', backdropFilter: 'blur(8px)' }}
      aria-label="Favori"
    >
      <motion.span key={String(active)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 14 }} className="inline-flex">
        <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" strokeWidth="2" style={{ fill: active ? '#ff3b5c' : 'none', stroke: active ? '#ff3b5c' : light ? '#0f1115' : 'var(--app-text)' }}>
          <path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.6 3 5 6.6 5c2.1 0 3.6 1.2 5.4 3.2C13.8 6.2 15.3 5 17.4 5 21 5 23.1 8.6 21.6 11.9 19.5 16.4 12 21 12 21z" />
        </svg>
      </motion.span>
      <AnimatePresence>
        {burst > 0 && (
          <motion.span key={burst} className="absolute inset-0 pointer-events-none" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }}>
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: i % 2 ? '#ff3b5c' : 'var(--app-accent)' }}
                initial={{ x: '-50%', y: '-50%', scale: 1 }}
                animate={{ x: `calc(-50% + ${Math.cos((i / 8) * Math.PI * 2) * size * 0.75}px)`, y: `calc(-50% + ${Math.sin((i / 8) * Math.PI * 2) * size * 0.75}px)`, scale: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ───────── Quantité ─────────
export function Qty({ value, onChange, min = 1, max = 20, size = 'md' }) {
  const h = size === 'sm' ? 30 : 38;
  return (
    <div className="inline-flex items-center rounded-full bg-app-surface" style={{ height: h, padding: 3 }}>
      <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onChange?.(Math.max(min, value - 1)); }} className="rounded-full flex items-center justify-center bg-app-elevated" style={{ width: h - 6, height: h - 6, color: 'var(--app-text)' }} aria-label="Moins">
        <Icon name={value <= min && min === 0 ? 'trash-2' : 'minus'} size={size === 'sm' ? 13 : 15} />
      </motion.button>
      <div className="relative overflow-hidden text-center font-semibold" style={{ width: size === 'sm' ? 24 : 30, height: h - 6, fontVariantNumeric: 'tabular-nums' }}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={value} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} className="absolute inset-0 flex items-center justify-center text-[14px]">
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onChange?.(Math.min(max, value + 1)); }} className="rounded-full flex items-center justify-center" style={{ width: h - 6, height: h - 6, background: 'var(--app-primary)', color: 'var(--app-on-primary)' }} aria-label="Plus">
        <Icon name="plus" size={size === 'sm' ? 13 : 15} />
      </motion.button>
    </div>
  );
}

// ───────── Interrupteur ─────────
export function Toggle({ on, onChange }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(!on); }} className="relative rounded-full shrink-0" style={{ width: 50, height: 30, background: on ? 'var(--app-success)' : 'var(--app-surface2)', transition: 'background .25s' }} aria-pressed={on}>
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className="absolute top-[3px] rounded-full bg-white" style={{ width: 24, height: 24, left: on ? 23 : 3, boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />
    </button>
  );
}

// ───────── Texte riche : *mot* = mise en valeur (italique serif, couleur de marque) ─────────
export function Rich({ text }) {
  const parts = String(text ?? '').split(/(\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.length > 2 && p.startsWith('*') && p.endsWith('*') ? (
      <em key={i} className="app-em">
        {p.slice(1, -1)}
      </em>
    ) : (
      p
    )
  );
}
export const plain = (t) => String(t ?? '').replace(/\*/g, '');

// ───────── Titre de section (sur-titre + titre d'affiche) ─────────
export function SectionHead({ title, subtitle, eyebrow, actionLabel = 'Voir tout', onAction, pad = false, size = 21 }) {
  if (!title && !eyebrow) return null;
  return (
    <div className={`flex items-end justify-between mb-3.5 ${pad ? 'px-5' : ''}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="app-eyebrow mb-1.5" style={{ color: 'var(--app-primary-ink)' }}>
            {eyebrow}
          </p>
        )}
        {title && (
          <h3 className="app-heading font-bold leading-[1.08]" style={{ fontSize: size, letterSpacing: '-0.025em' }}>
            <Rich text={title} />
          </h3>
        )}
        {subtitle && <p className="text-[13px] text-app-muted mt-1 truncate">{subtitle}</p>}
      </div>
      {onAction && (
        <button type="button" onClick={onAction} className="h-8 pl-3 pr-2 rounded-full text-[12.5px] font-semibold shrink-0 ml-3 inline-flex items-center gap-0.5 bg-app-surface" style={{ color: 'var(--app-text)' }}>
          {actionLabel} <Icon name="chevron-right" size={15} />
        </button>
      )}
    </div>
  );
}

// ───────── Confettis ─────────
export function Confetti({ count = 46, colors }) {
  const parts = useMemo(
    () =>
      [...Array(count)].map((_, i) => {
        const r = (n) => ((hash(i + ':' + n) % 1000) / 1000);
        return { x: r(1) * 100, delay: r(2) * 0.35, rot: r(3) * 720 - 360, dur: 1.8 + r(4) * 1.4, w: 6 + r(5) * 6, h: 8 + r(6) * 10, c: i % 4, drift: (r(7) - 0.5) * 120, round: r(8) > 0.7 };
      }),
    [count]
  );
  const palette = colors || ['var(--app-primary)', 'var(--app-accent)', '#FFD166', '#06D6A0'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0"
          style={{ left: `${p.x}%`, width: p.w, height: p.round ? p.w : p.h, background: palette[p.c], borderRadius: p.round ? 99 : 2 }}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: 900, x: p.drift, rotate: p.rot, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: [0.2, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  );
}

// ───────── Bouton rond d'en-tête ─────────
export function RoundIcon({ icon, onClick, badge, glass = false, className = '', size = 40, dataCart }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      data-cart-target={dataCart ? 'true' : undefined}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: glass ? 'rgba(20,20,26,0.32)' : 'var(--app-surface)',
        color: glass ? '#fff' : 'var(--app-text)',
        backdropFilter: glass ? 'blur(14px) saturate(1.6)' : undefined,
        WebkitBackdropFilter: glass ? 'blur(14px) saturate(1.6)' : undefined,
        boxShadow: glass ? 'inset 0 0 0 1px rgba(255,255,255,0.18)' : undefined,
      }}
    >
      <Icon name={icon} size={19} />
      <AnimatePresence>
        {badge ? (
          <motion.span
            key={String(badge)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 700, damping: 18 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)', boxShadow: '0 0 0 2px var(--app-bg)' }}
          >
            {badge}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
