import { useState } from 'react';
import { motion, useTransform } from 'motion/react';
import { useRt, useScreen } from '../context.js';
import { Btn, Icon, Img, Media, Video, SectionHead, Rich } from '../ui.jsx';
import { Illustration } from '../illustrations.jsx';

// Titre révélé mot par mot ; *mots* = mise en valeur (italique serif, couleur de marque)
export function Words({ text, className = '', delay = 0, stagger = 0.06, as = 'h2', style }) {
  const tokens = [];
  let em = false;
  String(text || '')
    .split(/(\*)/)
    .forEach((seg) => {
      if (seg === '*') return void (em = !em);
      seg
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w) => tokens.push({ w, em }));
    });
  const C = motion[as] || motion.h2;
  return (
    <C className={className} style={style} initial="hide" animate="show" variants={{ show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}>
      {tokens.map((t, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
          <motion.span className={`inline-block ${t.em ? 'app-em' : ''}`} variants={{ hide: { y: '110%', rotate: 4 }, show: { y: '0%', rotate: 0, transition: { type: 'spring', stiffness: 220, damping: 26 } } }}>
            {t.w}
            {i < tokens.length - 1 ? '\u00a0' : ''}
          </motion.span>
        </span>
      ))}
    </C>
  );
}

const OVERLAYS = {
  dark: 'linear-gradient(to top, rgba(8,8,12,0.92) 0%, rgba(8,8,12,0.55) 32%, rgba(8,8,12,0.08) 62%, rgba(8,8,12,0.45) 100%)',
  brand: 'linear-gradient(to top, color-mix(in srgb, var(--app-primary) 90%, #000) 0%, color-mix(in srgb, var(--app-primary) 45%, transparent) 45%, rgba(0,0,0,0.3) 100%)',
  light: 'linear-gradient(to top, var(--app-bg) 8%, color-mix(in srgb, var(--app-bg) 60%, transparent) 45%, transparent 75%)',
  none: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent 45%)',
};

export function Hero({ block, index }) {
  const rt = useRt();
  const scr = useScreen();
  const first = index === 0;
  const heights = { full: rt.fullscreen ? '88dvh' : 720, tall: 590, medium: 430, short: 300 };
  const h = first ? heights[block.height] : heights[block.height === 'full' || block.height === 'tall' ? 'medium' : block.height];
  const y = useTransform(scr.scrollY, [0, 600], [0, first ? 190 : 0]);
  const zoom = useTransform(scr.scrollY, [-220, 0, 600], [1.3, 1.04, 1.12]);
  const fade = useTransform(scr.scrollY, [0, 330], [1, first ? 0 : 1]);
  const lift = useTransform(scr.scrollY, [0, 330], [0, first ? -46 : 0]);
  const light = block.overlay === 'light';
  const big = first && (block.height === 'full' || block.height === 'tall');
  const titleSize = first ? (block.height === 'full' ? 46 : block.height === 'tall' ? 42 : 34) : 28;
  return (
    <div className={first ? 'relative' : 'px-5'}>
      <div className={`relative overflow-hidden ${light ? '' : 'app-on-media'}`} style={{ height: h, borderRadius: first ? '0 0 34px 34px' : 'var(--app-radius-lg)' }}>
        <motion.div className="absolute inset-0" style={{ y, scale: zoom }}>
          <Media media={block.media} w={1100} />
        </motion.div>
        <div className="absolute inset-0" style={{ background: OVERLAYS[block.overlay] || OVERLAYS.dark }} />
        {!light && <div className="absolute inset-0 grain pointer-events-none" style={{ opacity: 0.55 }} />}
        <motion.div
          className={`absolute inset-x-0 ${block.align === 'center' ? 'inset-y-0 flex flex-col justify-center items-center text-center' : 'bottom-0'} px-6`}
          style={{ opacity: fade, y: lift, color: light ? 'var(--app-text)' : '#fff', paddingTop: first ? rt.safeTop + 48 : 20, paddingBottom: big ? 40 : 26 }}
        >
          {(block.badge || block.eyebrow) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`flex items-center gap-3 mb-3.5 flex-wrap ${block.align === 'center' ? 'justify-center' : ''}`}>
              {block.badge && (
                <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-semibold" style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)' }}>
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'var(--app-accent)', opacity: 0.7 }} />
                    <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: 'var(--app-accent)' }} />
                  </span>
                  {block.badge}
                </span>
              )}
              {block.eyebrow && <span className="app-eyebrow opacity-90">{block.eyebrow}</span>}
            </motion.div>
          )}
          <Words text={block.title} delay={0.12} className="app-display font-extrabold" style={{ fontSize: titleSize }} />
          {block.subtitle && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.86, y: 0 }} transition={{ delay: 0.5 }} className="text-[15px] leading-relaxed mt-3.5 max-w-[320px]">
              {block.subtitle}
            </motion.p>
          )}
          {block.chips?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }} className={`flex gap-2 mt-4 flex-wrap ${block.align === 'center' ? 'justify-center' : ''}`}>
              {block.chips.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold" style={{ background: light ? 'var(--app-surface)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: light ? undefined : 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}>
                  {c.icon && <Icon name={c.icon} size={14} style={c.icon === 'star' ? { fill: '#F5B301', color: '#F5B301' } : undefined} />}
                  {c.label}
                </span>
              ))}
            </motion.div>
          )}
          {block.buttons?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }} className={`flex gap-2.5 mt-6 flex-wrap ${block.align === 'center' ? 'justify-center' : ''}`}>
              {block.buttons.map((b, i) => (
                <Btn key={i} variant={i === 0 ? (light ? 'primary' : 'light') : 'glass'} icon={b.icon || undefined} onClick={() => rt.run(b.action)} size="md">
                  {b.label}
                </Btn>
              ))}
            </motion.div>
          )}
        </motion.div>
        {big && !light && (
          <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-9 h-[3px] rounded-full bg-white/35 overflow-hidden" style={{ opacity: fade }}>
            <motion.span className="block h-full w-1/2 rounded-full bg-white" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function VideoBlock({ block }) {
  const rt = useRt();
  const [paused, setPaused] = useState(false);
  const reel = block.style === 'reel';
  const full = block.style === 'full';
  return (
    <div className={full ? '' : 'px-5'}>
      <div className={`relative overflow-hidden ${full ? '' : 'app-card'}`} style={{ borderRadius: full ? 0 : 'var(--app-radius-lg)', aspectRatio: reel ? '9/14' : full ? '4/5' : '16/11' }}>
        <div className="absolute inset-0" style={{ filter: paused ? 'saturate(0.6) brightness(0.8)' : undefined, transition: 'filter .3s' }}>
          <Media media={block.media} />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 55%)' }} />
        <button type="button" onClick={() => setPaused((p) => !p)} className="absolute inset-0 flex items-center justify-center" aria-label="Lecture">
          <motion.span key={String(paused)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: paused ? 1 : 0 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)' }}>
            <Icon name={paused ? 'play' : 'pause'} size={28} />
          </motion.span>
        </button>
        {block.duration && <span className="absolute top-3 right-3 px-2 h-6 flex items-center rounded-full text-[11px] font-semibold text-white bg-black/45 backdrop-blur">{block.duration}</span>}
        <div className="absolute left-0 right-0 bottom-0 p-4 text-white pointer-events-none">
          {block.title && <h3 className="app-heading text-[19px] font-bold leading-tight"><Rich text={block.title} /></h3>}
          {block.subtitle && <p className="text-[13px] opacity-85 mt-1 line-clamp-2">{block.subtitle}</p>}
          <div className="mt-3 h-[3px] rounded-full bg-white/25 overflow-hidden">
            <motion.div className="h-full bg-white" initial={{ width: '0%' }} animate={{ width: paused ? undefined : '100%' }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} />
          </div>
        </div>
        {reel && (
          <div className="absolute right-3 bottom-20 flex flex-col gap-4 text-white">
            {[
              ['heart', '2,4k'],
              ['message-circle', '318'],
              ['share-2', ''],
            ].map(([ic, n]) => (
              <button key={ic} type="button" onClick={() => rt.run({ type: ic === 'heart' ? 'like' : ic === 'share-2' ? 'share' : 'toast', message: 'Commentaires' })} className="flex flex-col items-center gap-1">
                <span className="w-11 h-11 rounded-full flex items-center justify-center bg-black/30 backdrop-blur">
                  <Icon name={ic} size={22} />
                </span>
                {n && <span className="text-[11px] font-semibold">{n}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Gallery({ block }) {
  const rt = useRt();
  const imgs = block.images || [];
  if (block.layout === 'strip') {
    return (
      <div>
        <SectionHead pad eyebrow={block.eyebrow} title={block.title} />
        <div className="hscroll gap-3 px-5 pb-1">
          {imgs.map((src, i) => (
            <motion.button type="button" whileTap={{ scale: 0.97 }} key={i} onClick={() => rt.openLightbox({ image: src })} className="shrink-0 overflow-hidden" style={{ width: 150, height: 190, borderRadius: 'var(--app-radius)' }}>
              <Img src={src} w={420} className="w-full h-full" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
  const heights = [200, 150, 170, 230, 160, 190, 210, 140, 180];
  const cols = block.layout === 'grid' ? 3 : 2;
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {block.layout === 'grid'
          ? imgs.map((src, i) => (
              <motion.button type="button" whileTap={{ scale: 0.97 }} key={i} onClick={() => rt.openLightbox({ image: src })} className="overflow-hidden aspect-square" style={{ borderRadius: 'var(--app-radius-sm)' }}>
                <Img src={src} w={360} className="w-full h-full" />
              </motion.button>
            ))
          : [0, 1].map((c) => (
              <div key={c} className="flex flex-col gap-2.5">
                {imgs
                  .filter((_, i) => i % 2 === c)
                  .map((src, i) => (
                    <motion.button type="button" whileTap={{ scale: 0.97 }} key={i} onClick={() => rt.openLightbox({ image: src })} className="overflow-hidden" style={{ height: heights[(i * 2 + c) % heights.length], borderRadius: 'var(--app-radius)' }}>
                      <Img src={src} w={420} className="w-full h-full" />
                    </motion.button>
                  ))}
              </div>
            ))}
      </div>
    </div>
  );
}

export function Stories({ block }) {
  const rt = useRt();
  const items = block.items || [];
  return (
    <div className="hscroll gap-3.5 px-5 pb-1">
      {items.map((it, i) => (
        <motion.button key={i} type="button" whileTap={{ scale: 0.93 }} onClick={() => rt.openStory(items, i)} className="shrink-0 flex flex-col items-center gap-1.5" style={{ width: 68 }}>
          <span className="rounded-full p-[2.5px]" style={{ background: i < 3 ? 'conic-gradient(from 210deg, var(--app-primary), var(--app-accent), #ffd166, var(--app-primary))' : 'var(--app-surface2)' }}>
            <span className="block rounded-full p-[2.5px] bg-app-bg">
              <Img src={it.image} w={180} className="w-[58px] h-[58px] rounded-full" />
            </span>
          </span>
          <span className="text-[11.5px] font-medium truncate w-full text-center">{it.name}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function IllustrationBlock({ block }) {
  const rt = useRt();
  return (
    <div className="px-6 py-4 flex flex-col items-center text-center">
      <Illustration name={block.name} size={230} />
      {block.title && <h3 className="app-heading text-[22px] font-bold mt-3 leading-tight"><Rich text={block.title} /></h3>}
      {block.text && <p className="text-[14.5px] text-app-muted mt-2 leading-relaxed max-w-[300px]">{block.text}</p>}
      {block.cta && (
        <Btn className="mt-5" onClick={() => rt.run(block.cta.action)}>
          {block.cta.label}
        </Btn>
      )}
    </div>
  );
}

export { Video };
