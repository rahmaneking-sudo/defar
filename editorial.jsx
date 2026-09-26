// ─────────────────────────────────────────────────────────────────────────────
// BLOCS SIGNATURE — direction artistique : éditorial, lookbook, bento, bandeau
// défilant, équipe, citation. Ce sont eux qui donnent aux maquettes une allure
// de magazine plutôt que de kit d'interface.
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useRt } from '../context.js';
import { Avatar, CountUp, Icon, Img, Money, Rich, SectionHead, Stars } from '../ui.jsx';
import { initials } from '../../../shared/utils.js';

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { type: 'spring', stiffness: 200, damping: 28 } };

// ───────── Éditorial : une phrase d'affiche, un auteur, une respiration ─────────
export function Editorial({ block }) {
  const rt = useRt();
  const dark = block.tone === 'dark';
  const surface = block.tone === 'surface';
  const center = block.align === 'center';
  const boxed = dark || surface;
  return (
    <div className="px-5">
      <div
        className={`relative overflow-hidden ${boxed ? 'p-6' : 'py-2'} ${center ? 'text-center' : ''} ${dark ? 'app-on-media' : ''}`}
        style={{
          borderRadius: boxed ? 'var(--app-radius-lg)' : undefined,
          background: dark ? 'linear-gradient(150deg, color-mix(in srgb, var(--app-primary) 55%, #0b0a10), #0b0a10 75%)' : surface ? 'var(--app-surface)' : undefined,
          color: dark ? '#fff' : undefined,
        }}
      >
        {dark && <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full blur-3xl opacity-50" style={{ background: 'var(--app-accent)' }} />}
        <div className="relative">
          {block.number && (
            <span className="app-display block text-[64px] leading-none font-bold mb-1" style={{ color: 'transparent', WebkitTextStroke: `1.2px ${dark ? 'rgba(255,255,255,0.4)' : 'color-mix(in srgb, var(--app-primary) 55%, transparent)'}` }}>
              {block.number}
            </span>
          )}
          {block.eyebrow && (
            <p className="app-eyebrow mb-3" style={{ color: dark ? 'rgba(255,255,255,0.75)' : 'var(--app-primary-ink)' }}>
              {block.eyebrow}
            </p>
          )}
          <motion.div initial="hide" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
            <InViewWords text={block.title} className="app-display font-bold" size={block.size === 'xl' ? 38 : block.size === 'lg' ? 33 : 28} />
          </motion.div>
          {block.text && (
            <motion.p {...reveal} transition={{ ...reveal.transition, delay: 0.2 }} className={`text-[15px] leading-relaxed mt-4 ${center ? 'mx-auto max-w-[310px]' : ''}`} style={{ color: dark ? 'rgba(255,255,255,0.72)' : 'var(--app-muted)' }}>
              {block.text}
            </motion.p>
          )}
          {block.author?.name && (
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }} className={`flex items-center gap-3 mt-5 ${center ? 'justify-center' : ''}`}>
              <Avatar src={block.author.avatar} name={block.author.name} size={44} ring />
              <div className="text-left">
                <p className="font-semibold text-[14.5px] leading-tight">{block.author.name}</p>
                {block.author.role && <p className="text-[12.5px] opacity-65">{block.author.role}</p>}
              </div>
            </motion.div>
          )}
          {block.cta && (
            <motion.button {...reveal} type="button" whileTap={{ scale: 0.96 }} onClick={() => rt.run(block.cta.action)} className="mt-5 h-11 pl-5 pr-4 rounded-full inline-flex items-center gap-2 text-[14px] font-semibold" style={{ background: dark ? '#fff' : 'var(--app-text)', color: dark ? '#0b0a10' : 'var(--app-bg)' }}>
              {block.cta.label} <Icon name="arrow-right" size={16} />
            </motion.button>
          )}
        </div>
      </div>
      {block.image && (
        <motion.div {...reveal} className="relative mt-4 overflow-hidden" style={{ height: 230, borderRadius: 'var(--app-radius-lg)' }}>
          <Img src={block.image} w={900} className="absolute inset-0" kenburns />
          {block.caption && <span className="absolute left-3 bottom-3 h-7 px-3 rounded-full text-[11.5px] font-semibold text-white bg-black/40 backdrop-blur flex items-center">{block.caption}</span>}
        </motion.div>
      )}
    </div>
  );
}

// Mots révélés à l'entrée dans l'écran (variantes héritées du parent)
function InViewWords({ text, className, size }) {
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
  return (
    <motion.h2 className={className} style={{ fontSize: size }} variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
      {tokens.map((t, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
          <motion.span className={`inline-block ${t.em ? 'app-em' : ''}`} variants={{ hide: { y: '110%' }, show: { y: '0%', transition: { type: 'spring', stiffness: 220, damping: 26 } } }}>
            {t.w}
            {i < tokens.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}

// ───────── Lookbook : grandes cartes verticales numérotées ─────────
export function Showcase({ block }) {
  const rt = useRt();
  const box = useRef(null);
  const [p, setP] = useState(0);
  const items = block.items || [];
  if (!items.length) return null;
  const tall = block.style !== 'square';
  const bar = Math.max(18, 100 / items.length);
  const W = tall ? 244 : 210;
  const H = tall ? 330 : 230;
  return (
    <div>
      <div className="px-5">
        <SectionHead eyebrow={block.eyebrow} title={block.title} size={24} onAction={block.action ? () => rt.run(block.action) : null} />
      </div>
      <div ref={box} className="hscroll gap-3.5 px-5 pb-1" style={{ scrollPaddingLeft: 20 }} onScroll={(e) => setP(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.scrollWidth - e.currentTarget.clientWidth))}>
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => rt.run(it.action, { item: it, el: e.currentTarget })}
            data-tour="carousel-item"
            className="relative shrink-0 overflow-hidden cursor-pointer app-on-media"
            style={{ width: W, height: H, borderRadius: 'calc(var(--app-radius-lg) * 1.1)', scrollSnapAlign: 'start' }}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 200, damping: 26, delay: Math.min(i, 3) * 0.06 }}
          >
            <Img src={it.image} w={700} className="absolute inset-0" kenburns={i === 0} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,6,10,0.88) 0%, rgba(6,6,10,0.25) 45%, transparent 65%, rgba(6,6,10,0.3) 100%)' }} />
            <span className="absolute top-3.5 left-4 app-display text-[30px] font-bold leading-none text-white/90" style={{ WebkitTextStroke: '0.5px rgba(255,255,255,0.4)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {it.badge && <span className="absolute top-4 right-3.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold flex items-center text-white" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' }}>{it.badge}</span>}
            <div className="absolute left-4 right-4 bottom-4 text-white">
              {it.meta && <p className="app-eyebrow text-[10px] opacity-80 mb-1.5">{it.meta}</p>}
              <p className="app-display text-[24px] font-bold leading-[1.02]">
                <Rich text={it.title} />
              </p>
              {it.subtitle && <p className="text-[12.5px] opacity-75 mt-1.5 line-clamp-2">{it.subtitle}</p>}
              {(Number.isFinite(it.price) || it.rating) && (
                <div className="flex items-center justify-between mt-3">
                  {Number.isFinite(it.price) ? <Money value={it.price} currency={rt.currency} className="h-8 px-3 rounded-full inline-flex items-center text-[13px] font-bold bg-white text-black" /> : <span />}
                  {it.rating ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold">
                      <Icon name="star" size={13} style={{ fill: '#F5B301', color: '#F5B301' }} /> {it.rating}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mx-5 mt-3.5 h-[3px] rounded-full bg-app-surface overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${bar}%`, transform: `translateX(${p * ((100 - bar) / bar) * 100}%)`, background: 'var(--app-primary)', transition: 'transform .12s linear' }} />
      </div>
    </div>
  );
}

// ───────── Bento : mosaïque asymétrique (image, chiffre, texte, atout) ─────────
export function Bento({ block }) {
  const rt = useRt();
  const items = block.items || [];
  if (!items.length) return null;
  let statN = 0;
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} size={24} />
      <div className="grid grid-cols-2 gap-2.5" style={{ gridAutoRows: 92 }}>
        {items.map((it, i) => {
          const span = `${it.span === 2 ? 'col-span-2' : ''} ${it.tall ? 'row-span-2' : ''}`;
          const tap = it.action ? () => rt.run(it.action) : undefined;
          const common = { onClick: tap, whileTap: tap ? { scale: 0.97 } : undefined, initial: { opacity: 0, scale: 0.94 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true, amount: 0.3 }, transition: { type: 'spring', stiffness: 240, damping: 26, delay: (i % 4) * 0.05 } };
          if (it.kind === 'image')
            return (
              <motion.div key={i} {...common} className={`relative overflow-hidden app-on-media ${span} ${tap ? 'cursor-pointer' : ''}`} style={{ borderRadius: 'var(--app-radius-lg)' }}>
                <Img src={it.image} w={700} className="absolute inset-0" kenburns={!!it.tall} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent 60%)' }} />
                <div className="absolute left-3.5 right-3.5 bottom-3 text-white">
                  {it.title && <p className="app-display text-[19px] font-bold leading-tight"><Rich text={it.title} /></p>}
                  {it.text && <p className="text-[11.5px] opacity-80 mt-0.5 line-clamp-2">{it.text}</p>}
                </div>
              </motion.div>
            );
          if (it.kind === 'stat') {
            const hero = statN++ === 0;
            return (
              <motion.div key={i} {...common} className={`relative overflow-hidden p-4 flex flex-col justify-between ${span}`} style={{ borderRadius: 'var(--app-radius-lg)', background: hero ? 'var(--app-primary)' : 'var(--app-surface)', color: hero ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
                {it.icon ? <Icon name={it.icon} size={18} style={{ opacity: 0.8 }} /> : <span />}
                <div>
                  <p className="app-display app-num font-bold leading-none" style={{ fontSize: it.span === 2 ? 44 : 34 }}>
                    {Number.isFinite(it.value) ? <CountUp value={it.value} format={(n) => (Math.abs(it.value) < 10 && !Number.isInteger(it.value) ? n.toFixed(1).replace('.', ',') : Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' '))} /> : it.value}
                    {it.suffix && <span className="text-[0.5em] ml-0.5 opacity-80">{it.suffix}</span>}
                  </p>
                  {it.title && <p className="text-[12px] font-semibold mt-1.5 opacity-80 leading-tight">{it.title}</p>}
                </div>
              </motion.div>
            );
          }
          if (it.kind === 'text')
            return (
              <motion.div key={i} {...common} className={`relative overflow-hidden p-4 flex flex-col justify-end ${span} ${tap ? 'cursor-pointer' : ''}`} style={{ borderRadius: 'var(--app-radius-lg)', background: 'linear-gradient(160deg, var(--app-accent-soft), var(--app-surface))' }}>
                {it.title && <p className="app-display text-[20px] font-bold leading-[1.05]"><Rich text={it.title} /></p>}
                {it.text && <p className="text-[12px] text-app-muted mt-1.5 leading-snug line-clamp-3">{it.text}</p>}
              </motion.div>
            );
          return (
            <motion.div key={i} {...common} className={`relative overflow-hidden p-3.5 flex ${it.tall ? 'flex-col justify-between' : 'items-center gap-3'} ${span} ${tap ? 'cursor-pointer' : ''}`} style={{ borderRadius: 'var(--app-radius-lg)', background: i % 3 === 0 ? 'var(--app-text)' : 'var(--app-elevated)', color: i % 3 === 0 ? 'var(--app-bg)' : 'var(--app-text)', boxShadow: i % 3 === 0 ? undefined : 'inset 0 0 0 1px var(--app-border)' }}>
              <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ background: i % 3 === 0 ? 'color-mix(in srgb, var(--app-bg) 14%, transparent)' : 'var(--app-primary-soft)', color: i % 3 === 0 ? 'inherit' : 'var(--app-primary-ink)' }}>
                <Icon name={it.icon || 'sparkles'} size={19} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[13.5px] leading-tight">{it.title}</p>
                {it.text && <p className="text-[11.5px] opacity-65 mt-0.5 leading-snug line-clamp-2">{it.text}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ───────── Bandeau défilant : mots d'affiche en mouvement continu ─────────
export function Marquee({ block }) {
  const items = block.items?.length ? block.items : ['Nouveau'];
  const tone = block.tone || 'plain';
  const bg = tone === 'primary' ? 'var(--app-primary)' : tone === 'dark' ? '#0b0a10' : tone === 'accent' ? 'var(--app-accent)' : 'transparent';
  const color = tone === 'primary' ? 'var(--app-on-primary)' : tone === 'dark' ? '#fff' : tone === 'accent' ? 'var(--app-on-accent)' : 'var(--app-text)';
  const outline = block.style === 'outline';
  const row = [...items, ...items, ...items];
  const dur = Math.max(10, row.join('').length * 0.32) / (block.speed || 1);
  return (
    <div className="overflow-hidden py-1" style={{ transform: block.tilt ? 'rotate(-2.5deg) scale(1.06)' : undefined, margin: block.tilt ? '10px 0' : undefined }}>
      <div className="py-3" style={{ background: bg, color }}>
        <div className="flex w-max" style={{ animation: `app-marquee ${dur}s linear infinite` }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center shrink-0" aria-hidden={k === 1}>
              {row.map((w, i) => (
                <span key={i} className="flex items-center">
                  <span className={`app-display font-bold whitespace-nowrap px-4 ${i % 2 && !outline ? 'app-em' : ''}`} style={{ fontSize: block.size === 'sm' ? 20 : 30, lineHeight: 1.1, color: outline && i % 2 ? 'transparent' : undefined, WebkitTextStroke: outline && i % 2 ? `1px ${color}` : undefined, '--app-em-color': tone === 'plain' ? 'var(--app-primary-ink)' : 'inherit' }}>
                    {w}
                  </span>
                  <Icon name="sparkles" size={block.size === 'sm' ? 14 : 18} style={{ opacity: 0.7, color: tone === 'plain' ? 'var(--app-primary-ink)' : undefined }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────── Équipe : portraits en arche ─────────
export function Team({ block }) {
  const rt = useRt();
  const items = block.items || [];
  if (!items.length) return null;
  return (
    <div>
      <div className="px-5">
        <SectionHead eyebrow={block.eyebrow} title={block.title} size={24} />
      </div>
      <div className="hscroll gap-3 px-5 pb-1">
        {items.map((m, i) => (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => rt.run(m.action || (rt.routes.booking ? { type: 'navigate', to: rt.routes.booking } : { type: 'toast', message: `${m.name} · ${m.role || 'Équipe'}` }))}
            className="shrink-0 text-left"
            style={{ width: 142, scrollSnapAlign: 'start' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26, delay: Math.min(i, 4) * 0.06 }}
          >
            <div className="relative overflow-hidden" style={{ height: 178, borderRadius: '999px 999px var(--app-radius) var(--app-radius)', background: `linear-gradient(${150 + i * 25}deg, color-mix(in srgb, var(--app-primary) 70%, #1a1016), color-mix(in srgb, var(--app-accent) 60%, var(--app-primary)))` }}>
              <span className="absolute inset-0 flex items-center justify-center app-display text-[44px] font-bold text-white/85">{initials(m.name)}</span>
              <Img src={m.avatar} w={420} face className="absolute inset-0" placeholder={false} />
              {m.rating ? (
                <span className="absolute left-2 bottom-2 h-6 px-2 rounded-full bg-white/90 text-black text-[11px] font-bold inline-flex items-center gap-1">
                  <Icon name="star" size={11} style={{ fill: '#F5B301', color: '#F5B301' }} /> {m.rating}
                </span>
              ) : null}
            </div>
            <p className="font-bold text-[14.5px] mt-2.5 leading-tight">{m.name}</p>
            {m.role && <p className="text-[12px] text-app-muted mt-0.5 leading-tight">{m.role}</p>}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ───────── Citation : un témoignage en grand ─────────
export function Quote({ block }) {
  return (
    <div className="px-5">
      <motion.figure {...reveal} className="relative overflow-hidden p-6 pt-5" style={{ borderRadius: 'var(--app-radius-lg)', background: 'var(--app-surface)' }}>
        <span className="app-em block leading-none select-none" style={{ fontSize: 88, height: 52, color: 'var(--app-primary)' }}>
          “
        </span>
        <blockquote className="app-display font-semibold leading-[1.18]" style={{ fontSize: 21 }}>
          <Rich text={block.text} />
        </blockquote>
        <figcaption className="flex items-center gap-3 mt-5">
          <Avatar src={block.avatar} name={block.author} size={42} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] truncate">{block.author}</p>
            {block.role && <p className="text-[12px] text-app-muted truncate">{block.role}</p>}
          </div>
          {block.rating ? <Stars value={block.rating} size={12} /> : null}
        </figcaption>
      </motion.figure>
    </div>
  );
}
