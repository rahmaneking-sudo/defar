import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRt, useScreen } from '../context.js';
import { Avatar, Btn, Icon, Img, Media, MotionBg, Money, SectionHead, Stars, HeartButton, Rich } from '../ui.jsx';
import { deaccent } from '../../../shared/utils.js';

export function useFiltered(items = []) {
  const scr = useScreen();
  const q = deaccent((scr?.query || '').trim().toLowerCase());
  if (!q) return items;
  return items.filter((it) => deaccent(`${it.title || ''} ${it.subtitle || ''} ${it.label || ''}`.toLowerCase()).includes(q));
}

function Price({ item, big = false }) {
  const rt = useRt();
  if (!Number.isFinite(item.price)) return null;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <Money value={item.price} currency={rt.currency} className={`${big ? 'text-[17px]' : 'text-[14.5px]'} font-bold`} />
      {item.oldPrice ? <Money value={item.oldPrice} currency={rt.currency} strike className="text-[12px] text-app-muted" /> : null}
    </span>
  );
}

export function Carousel({ block }) {
  const rt = useRt();
  const items = useFiltered(block.items);
  const style = block.style || 'card';
  if (!items.length) return null;
  const open = (it, e) => rt.run(it.action, { item: it, el: e.currentTarget });
  return (
    <div>
      <SectionHead pad eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} onAction={block.action ? () => rt.run(block.action) : null} />
      <div className="hscroll gap-3.5 px-5 pb-2">
        {items.map((it, i) => {
          if (style === 'wide')
            return (
              <motion.div key={it.id} whileTap={{ scale: 0.98 }} onClick={(e) => open(it, e)} data-tour="carousel-item" className="relative shrink-0 overflow-hidden cursor-pointer" style={{ width: 300, height: 176, borderRadius: 'var(--app-radius-lg)' }}>
                <Img src={it.image} w={700} className="absolute inset-0" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78), transparent 58%)' }} />
                {it.badge && <span className="absolute top-3 left-3 h-6 px-2.5 rounded-full text-[11px] font-bold flex items-center" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>{it.badge}</span>}
                <div className="absolute left-4 right-4 bottom-3.5 text-white">
                  <p className="app-heading text-[18px] font-bold leading-tight truncate">{it.title}</p>
                  <p className="text-[12.5px] opacity-85 truncate mt-0.5 flex items-center gap-1.5">
                    {it.rating ? (
                      <>
                        <Icon name="star" size={12} style={{ fill: '#F5B301', color: '#F5B301' }} />
                        {it.rating} ·
                      </>
                    ) : null}
                    {it.subtitle || it.meta}
                  </p>
                </div>
              </motion.div>
            );
          if (style === 'poster')
            return (
              <motion.div key={it.id} whileTap={{ scale: 0.97 }} onClick={(e) => open(it, e)} data-tour="carousel-item" className="relative shrink-0 overflow-hidden cursor-pointer" style={{ width: 168, height: 240, borderRadius: 'var(--app-radius-lg)' }}>
                <Img src={it.image} w={480} className="absolute inset-0" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82), transparent 55%)' }} />
                {it.badge && <span className="absolute top-2.5 left-2.5 h-6 px-2 rounded-full text-[10.5px] font-bold flex items-center bg-white/90 text-black">{it.badge}</span>}
                <div className="absolute left-3 right-3 bottom-3 text-white">
                  {it.meta && <p className="text-[11px] font-semibold opacity-80 uppercase tracking-wide">{it.meta}</p>}
                  <p className="app-heading text-[16px] font-bold leading-tight line-clamp-2">{it.title}</p>
                  {Number.isFinite(it.price) && <Money value={it.price} currency={rt.currency} className="text-[13px] font-semibold opacity-95" />}
                </div>
              </motion.div>
            );
          if (style === 'circle')
            return (
              <motion.button type="button" key={it.id} whileTap={{ scale: 0.94 }} onClick={(e) => open(it, e)} className="shrink-0 flex flex-col items-center gap-2" style={{ width: 82 }}>
                <Img src={it.image} w={220} className="w-[74px] h-[74px] rounded-full" />
                <span className="text-[12px] font-semibold text-center leading-tight line-clamp-2">{it.title}</span>
              </motion.button>
            );
          if (style === 'compact')
            return (
              <motion.div key={it.id} whileTap={{ scale: 0.98 }} onClick={(e) => open(it, e)} className="app-card shrink-0 flex items-center gap-3 p-2.5 cursor-pointer" style={{ width: 262 }}>
                <Img src={it.image} w={200} className="w-[68px] h-[68px] shrink-0" style={{ borderRadius: 'var(--app-radius-sm)' }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[14.5px] truncate">{it.title}</p>
                  <p className="text-[12px] text-app-muted truncate">{it.subtitle || it.meta}</p>
                  <div className="mt-1">
                    <Price item={it} />
                  </div>
                </div>
              </motion.div>
            );
          return (
            <motion.div key={it.id} whileTap={{ scale: 0.98 }} onClick={(e) => open(it, e)} data-tour="carousel-item" className="app-card shrink-0 overflow-hidden cursor-pointer" style={{ width: 232 }}>
              <div className="relative">
                <Img src={it.image} w={560} className="w-full" style={{ aspectRatio: '4/3' }} />
                {it.badge && <span className="absolute top-2.5 left-2.5 h-6 px-2.5 rounded-full text-[11px] font-bold flex items-center" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>{it.badge}</span>}
                <div className="absolute top-2 right-2">
                  <HeartButton size={32} light active={rt.favs.has(it.id)} onToggle={() => rt.toggleFav(it.id, it.title)} />
                </div>
              </div>
              <div className="p-3.5">
                <p className="font-bold text-[15px] truncate app-heading">{it.title}</p>
                {it.subtitle && <p className="text-[12.5px] text-app-muted truncate mt-0.5">{it.subtitle}</p>}
                <div className="flex items-center justify-between mt-2 text-[12.5px]">
                  <span className="flex items-center gap-1 text-app-muted">
                    {it.rating ? (
                      <>
                        <Icon name="star" size={13} style={{ fill: '#F5B301', color: '#F5B301' }} />
                        <b className="text-app-text">{it.rating}</b>
                      </>
                    ) : null}
                    {it.meta && <span>{it.rating ? '· ' : ''}{it.meta}</span>}
                  </span>
                  <Price item={it} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function List({ block }) {
  const rt = useRt();
  const items = useFiltered(block.items);
  if (!items.length) return null;
  const style = block.style || 'inset';
  const row = (it, i, last) => (
    <motion.div
      key={it.id}
      whileTap={{ scale: 0.985 }}
      onClick={(e) => rt.run(it.action, { item: it, el: e.currentTarget })}
      data-tour="list-item"
      className={`flex items-center gap-3 cursor-pointer ${style === 'card' ? 'app-card p-3' : 'px-4 py-3'} relative`}
    >
      {it.image ? (
        <Img src={it.image} w={180} className="w-12 h-12 shrink-0" style={{ borderRadius: 'var(--app-radius-sm)' }} />
      ) : it.avatar !== undefined ? (
        <Avatar src={it.avatar} name={it.title} size={46} />
      ) : it.icon ? (
        <span className="w-11 h-11 shrink-0 flex items-center justify-center" style={{ borderRadius: 'min(var(--app-radius-sm), 14px)', background: i % 2 ? 'var(--app-accent-soft)' : 'var(--app-primary-soft)', color: i % 2 ? 'var(--app-accent)' : 'var(--app-primary-ink)' }}>
          <Icon name={it.icon} size={20} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[15px] truncate flex items-center gap-2">
          {it.title}
          {it.badge && <span className="h-5 px-2 rounded-full text-[10.5px] font-bold flex items-center shrink-0" style={{ background: 'var(--app-primary-soft)', color: 'var(--app-primary-ink)' }}>{it.badge}</span>}
        </p>
        {(it.subtitle || it.meta) && <p className="text-[12.5px] text-app-muted truncate mt-0.5">{it.subtitle || it.meta}</p>}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {Number.isFinite(it.amount) ? (
          <Money value={it.amount} currency={rt.currency} signed={!it.neutral} className="text-[14.5px] font-bold" style={{ color: it.neutral || it.amount < 0 ? 'var(--app-text)' : 'var(--app-success)' }} />
        ) : it.value ? (
          <span className="text-[13px] text-app-muted font-medium">{it.value}</span>
        ) : null}
        {it.unread && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--app-primary)' }} />}
        {!Number.isFinite(it.amount) && <Icon name="chevron-right" size={17} className="text-app-muted" />}
      </div>
      {style === 'inset' && !last && <span className="absolute bottom-0 right-0 h-px bg-app-border" style={{ left: it.image || it.icon || it.avatar !== undefined ? 72 : 16 }} />}
    </motion.div>
  );
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} onAction={block.action ? () => rt.run(block.action) : null} />
      {style === 'inset' ? (
        <div className="app-card overflow-hidden">{items.map((it, i) => row(it, i, i === items.length - 1))}</div>
      ) : (
        <div className={style === 'card' ? 'flex flex-col gap-2.5' : ''}>{items.map((it, i) => row(it, i, i === items.length - 1))}</div>
      )}
    </div>
  );
}

export function Feed({ block }) {
  const rt = useRt();
  return (
    <div className="flex flex-col gap-4 px-5">
      {block.items.map((p, i) => (
        <Post key={i} p={p} i={i} rt={rt} />
      ))}
    </div>
  );
}

function Post({ p, i, rt }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <article className="app-card overflow-hidden">
      <div className="flex items-center gap-3 p-3.5">
        <Avatar src={p.avatar} name={p.author} size={40} ring={i < 2} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14.5px] truncate">{p.author}</p>
          <p className="text-[12px] text-app-muted">
            {p.time}
            {p.tag ? ` · ${p.tag}` : ''}
          </p>
        </div>
        <Icon name="menu" size={18} className="text-app-muted" />
      </div>
      {p.text && <p className="px-3.5 pb-3 text-[14.5px] leading-relaxed">{p.text}</p>}
      {p.media && (
        <div className="relative w-full" style={{ aspectRatio: '4/4.4' }} onDoubleClick={() => setLiked(true)}>
          <Media media={p.media} w={900} kenburns={false} />
        </div>
      )}
      <div className="flex items-center gap-5 px-3.5 py-3">
        <HeartButton active={liked} onToggle={() => setLiked((l) => !l)} size={30} />
        <span className="text-[13px] font-semibold -ml-3">{p.likes + (liked ? 1 : 0)}</span>
        <button type="button" onClick={() => rt.toast('Commentaires', 'message-circle')} className="flex items-center gap-1.5 text-[13px] font-semibold">
          <Icon name="message-circle" size={20} /> {p.comments}
        </button>
        <button type="button" onClick={() => rt.run({ type: 'share' })} className="flex items-center">
          <Icon name="send" size={19} />
        </button>
        <button type="button" onClick={() => setSaved((s) => !s)} className="ml-auto" style={{ color: saved ? 'var(--app-primary-ink)' : undefined }}>
          <Icon name="bookmark" size={20} style={{ fill: saved ? 'currentColor' : 'none' }} />
        </button>
      </div>
    </article>
  );
}

export function Promo({ block }) {
  const rt = useRt();
  const [copied, setCopied] = useState(false);
  const tone = block.tone;
  const dark = tone === 'dark';
  const light = tone === 'light';
  const onDark = !light;
  return (
    <div className="px-5">
      <motion.div whileTap={block.cta ? { scale: 0.985 } : undefined} onClick={() => block.cta && rt.run(block.cta.action)} className="relative overflow-hidden cursor-pointer" style={{ borderRadius: 'var(--app-radius-lg)', minHeight: 158, background: light ? 'var(--app-primary-soft)' : tone === 'primary' ? 'var(--app-primary)' : tone === 'accent' ? 'var(--app-accent)' : undefined }}>
        {tone === 'gradient' && <MotionBg />}
        {dark && <MotionBg variant="dark" />}
        {block.media?.kind === 'video' && (
          <div className="absolute inset-0 opacity-90">
            <Media media={block.media} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/10" />
          </div>
        )}
        {block.media?.kind === 'image' && (
          <div className="absolute right-[-18px] bottom-[-18px] w-[150px] h-[150px] rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 6px rgba(255,255,255,0.18)' }}>
            <Img src={block.media.src} w={400} className="w-full h-full" />
          </div>
        )}
        <div className={`relative p-5 pr-[130px] ${onDark ? 'app-on-media' : ''}`} style={{ color: onDark ? (tone === 'accent' ? 'var(--app-on-accent)' : '#fff') : 'var(--app-text)', paddingRight: block.media?.kind === 'image' ? 140 : 20 }}>
          {block.eyebrow && <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] opacity-80 mb-1.5">{block.eyebrow}</p>}
          <h3 className="app-heading text-[22px] font-extrabold leading-[1.08]"><Rich text={block.title} /></h3>
          {block.subtitle && <p className="text-[13px] opacity-85 mt-1.5 leading-snug">{block.subtitle}</p>}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {block.code && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(block.code).catch(() => {});
                  setCopied(true);
                  rt.toast(`Code ${block.code} copié`, 'copy');
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="h-9 px-3 rounded-full text-[12.5px] font-bold flex items-center gap-1.5 border border-dashed"
                style={{ borderColor: 'currentColor', background: 'rgba(255,255,255,0.14)' }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={14} /> {block.code}
              </button>
            )}
            {block.cta && (
              <span className="h-9 px-4 rounded-full text-[13px] font-bold flex items-center gap-1.5" style={{ background: onDark ? '#fff' : 'var(--app-primary)', color: onDark ? '#111' : 'var(--app-on-primary)' }}>
                {block.cta.label} <Icon name="arrow-right" size={15} />
              </span>
            )}
          </div>
        </div>
        {tone !== 'light' && <div className="absolute inset-0 shimmer-sweep pointer-events-none" />}
      </motion.div>
    </div>
  );
}

export function Text({ block }) {
  const sizes = { sm: 'text-[18px]', md: 'text-[22px]', lg: 'text-[28px]', xl: 'text-[34px]' };
  return (
    <div className={`px-5 ${block.align === 'center' ? 'text-center' : ''}`}>
      {block.eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--app-primary-ink)' }}>{block.eyebrow}</p>}
      {block.title && <h2 className={`app-heading ${sizes[block.size] || sizes.md} font-bold leading-[1.12]`}><Rich text={block.title} /></h2>}
      {block.text && <p className="text-[14.5px] text-app-muted leading-relaxed mt-2 whitespace-pre-line">{block.text}</p>}
    </div>
  );
}

export function Features({ block }) {
  const list = block.layout === 'list';
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className={list ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}>
        {block.items.map((f, i) => (
          <motion.div key={i} className={`app-card p-4 ${list ? 'flex items-start gap-3' : ''}`} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <span className={`w-11 h-11 flex items-center justify-center shrink-0 ${list ? '' : 'mb-3'}`} style={{ borderRadius: 'min(var(--app-radius-sm), 14px)', background: i % 2 ? 'var(--app-accent-soft)' : 'var(--app-primary-soft)', color: i % 2 ? 'var(--app-accent)' : 'var(--app-primary-ink)' }}>
              <Icon name={f.icon} size={21} />
            </span>
            <div>
              <p className="font-bold text-[14.5px] leading-tight">{f.title}</p>
              {f.text && <p className="text-[12.5px] text-app-muted mt-1 leading-snug">{f.text}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Notice({ block }) {
  const rt = useRt();
  const tones = {
    info: ['#3b82f6', 'rgba(59,130,246,0.1)'],
    success: ['var(--app-success)', 'color-mix(in srgb, var(--app-success) 12%, transparent)'],
    warning: ['#d97706', 'rgba(245,158,11,0.12)'],
    brand: ['var(--app-primary-ink)', 'var(--app-primary-soft)'],
  };
  const [c, bg] = tones[block.tone] || tones.brand;
  return (
    <div className="px-5">
      <motion.div whileTap={block.action ? { scale: 0.98 } : undefined} onClick={() => block.action && rt.run(block.action)} className="flex items-start gap-3 p-4" style={{ borderRadius: 'var(--app-radius)', background: bg }}>
        <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--app-elevated)', color: c }}>
          <Icon name={block.icon} size={18} />
        </span>
        <div className="flex-1 min-w-0">
          {block.title && <p className="font-bold text-[14.5px]"><Rich text={block.title} /></p>}
          {block.text && <p className="text-[13px] text-app-muted leading-snug mt-0.5">{block.text}</p>}
        </div>
        {block.action && <Icon name="chevron-right" size={18} className="text-app-muted mt-2" />}
      </motion.div>
    </div>
  );
}

export function Faq({ block }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="app-card overflow-hidden">
        {block.items.map((f, i) => (
          <div key={i} className={i ? 'border-t border-app-border' : ''}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
              <span className="font-semibold text-[14.5px]">{f.q}</span>
              <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="shrink-0" style={{ color: 'var(--app-primary-ink)' }}>
                <Icon name="plus" size={18} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-[13.5px] text-app-muted leading-relaxed">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Reviews({ block }) {
  const dist = [0.72, 0.18, 0.06, 0.03, 0.01];
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="app-card p-4 flex items-center gap-5 mb-3">
        <div className="text-center">
          <p className="app-heading text-[40px] font-extrabold leading-none">{block.rating}</p>
          <div className="mt-1.5">
            <Stars value={block.rating} size={13} />
          </div>
          <p className="text-[11.5px] text-app-muted mt-1">{block.count} avis</p>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          {dist.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-app-muted">
              <span className="w-2">{5 - i}</span>
              <div className="flex-1 h-[6px] rounded-full bg-app-surface overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: '#F5B301' }} initial={{ width: 0 }} whileInView={{ width: `${d * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.08 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {block.items.map((r, i) => (
          <div key={i} className="app-card p-4">
            <div className="flex items-center gap-3">
              <Avatar src={r.avatar} name={r.author} size={38} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] truncate">{r.author}</p>
                <Stars value={r.rating} size={11} />
              </div>
              {r.date && <span className="text-[11.5px] text-app-muted">{r.date}</span>}
            </div>
            {r.text && <p className="text-[13.5px] leading-relaxed mt-2.5 text-app-muted">{r.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ButtonBlock({ block }) {
  const rt = useRt();
  return (
    <div className="px-5 flex flex-col gap-2">
      <Btn full size="lg" variant={block.style === 'primary' ? 'primary' : block.style} icon={block.icon || undefined} onClick={() => rt.run(block.action)}>
        <span data-tour="button-block">{block.label}</span>
      </Btn>
      {block.secondary && (
        <Btn full variant="ghost" onClick={() => rt.run(block.secondary.action)}>
          {block.secondary.label}
        </Btn>
      )}
    </div>
  );
}

export function Spacer({ block }) {
  return <div style={{ height: block.size }} className="px-5 flex items-center">{block.line && <div className="h-px w-full bg-app-border" />}</div>;
}
