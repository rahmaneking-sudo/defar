import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useTransform } from 'motion/react';
import { useRt, useScreen } from '../context.js';
import { Avatar, Btn, Confetti, CountUp, HeartButton, Icon, Img, Media, Money, Qty, SectionHead, Stars, Rich } from '../ui.jsx';
import { Illustration } from '../illustrations.jsx';
import { Words } from './media.jsx';
import { useFiltered } from './content.jsx';
import { PAY_METHODS } from '../../../shared/constants.js';
import { formatMoney } from '../../../shared/utils.js';

// ───────────────────────── Grille produits ─────────────────────────
export function Products({ block }) {
  const rt = useRt();
  const items = useFiltered(block.items);
  if (!items.length) return <EmptySearch />;
  const one = block.columns === 1;
  const add = (it) => (e) => {
    e.stopPropagation();
    rt.addToCart(it, { el: e.currentTarget });
  };
  if (one)
    return (
      <div className="px-5">
        <SectionHead eyebrow={block.eyebrow} title={block.title} onAction={block.action ? () => rt.run(block.action) : null} />
        <div className="flex flex-col gap-3">
          {items.map((it, i) => (
            <motion.div key={it.id} layout whileTap={{ scale: 0.985 }} onClick={(e) => rt.run(it.action, { item: it, el: e.currentTarget })} data-tour="product-card" className="app-card flex items-center gap-3.5 p-2.5 pr-3.5 cursor-pointer" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: Math.min(i, 4) * 0.04 }}>
              <div className="relative w-[96px] h-[104px] shrink-0 overflow-hidden" style={{ borderRadius: 'calc(var(--app-radius) - 4px)' }}>
                <Img src={it.image} w={280} className="absolute inset-0" />
                {it.badge && <span className="absolute top-1.5 left-1.5 h-5 px-1.5 rounded-full text-[9.5px] font-bold flex items-center bg-white/90 text-black">{it.badge}</span>}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                {it.meta && <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--app-primary-ink)' }}>{it.meta}</p>}
                <p className="app-heading font-bold text-[16px] leading-tight line-clamp-2">{it.title}</p>
                {it.subtitle && <p className="text-[12.5px] text-app-muted line-clamp-1 mt-1">{it.subtitle}</p>}
                <div className="flex items-center justify-between mt-2.5 gap-2">
                  <span className="flex items-baseline gap-1.5">
                    {Number.isFinite(it.price) && <Money value={it.price} currency={rt.currency} className="app-num text-[16px] font-extrabold" />}
                    {it.oldPrice ? <Money value={it.oldPrice} currency={rt.currency} strike className="text-[11.5px] text-app-muted" /> : null}
                  </span>
                  {it.rating ? (
                    <span className="flex items-center gap-1 text-[12px] font-semibold">
                      <Icon name="star" size={12} style={{ fill: '#F5B301', color: '#F5B301' }} /> {it.rating}
                    </span>
                  ) : null}
                </div>
              </div>
              {block.cart && Number.isFinite(it.price) && (
                <motion.button type="button" whileTap={{ scale: 0.8, rotate: 90 }} onClick={add(it)} data-tour="add-to-cart" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 self-end" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }} aria-label="Ajouter au panier">
                  <Icon name="plus" size={18} strokeWidth={2.6} />
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} onAction={block.action ? () => rt.run(block.action) : null} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            layout
            whileTap={{ scale: 0.975 }}
            onClick={(e) => rt.run(it.action, { item: it, el: e.currentTarget })}
            data-tour="product-card"
            className="cursor-pointer"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28, delay: (i % 2) * 0.06 }}
          >
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/5', borderRadius: 'var(--app-radius-lg)', boxShadow: 'var(--app-shadow)' }}>
              <Img src={it.image} w={480} className="absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }} />
              {it.badge && (
                <span className="absolute top-2.5 left-2.5 h-[22px] px-2 rounded-full text-[10.5px] font-bold flex items-center" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>
                  {it.badge}
                </span>
              )}
              <div className="absolute top-2 right-2">
                <HeartButton size={32} light active={rt.favs.has(it.id)} onToggle={() => rt.toggleFav(it.id, it.title)} />
              </div>
              {it.rating ? (
                <span className="absolute left-2.5 bottom-2.5 h-6 px-2 rounded-full text-[11px] font-bold inline-flex items-center gap-1 text-white" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                  <Icon name="star" size={11} style={{ fill: '#F5B301', color: '#F5B301' }} /> {it.rating}
                </span>
              ) : null}
              {block.cart && Number.isFinite(it.price) && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.8, rotate: 90 }}
                  onClick={add(it)}
                  data-tour="add-to-cart"
                  className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)', boxShadow: '0 8px 18px -6px var(--app-primary), 0 0 0 3px color-mix(in srgb, var(--app-bg) 45%, transparent)' }}
                  aria-label="Ajouter au panier"
                >
                  <Icon name="plus" size={19} strokeWidth={2.6} />
                </motion.button>
              )}
            </div>
            <div className="pt-2.5 px-0.5">
              <p className="app-heading font-bold text-[15px] leading-snug line-clamp-1">{it.title}</p>
              {it.subtitle && <p className="text-[12px] text-app-muted truncate mt-0.5">{it.subtitle}</p>}
              {Number.isFinite(it.price) && (
                <p className="flex items-baseline gap-1.5 mt-1">
                  <Money value={it.price} currency={rt.currency} className="app-num text-[15.5px] font-extrabold" />
                  {it.oldPrice ? <Money value={it.oldPrice} currency={rt.currency} strike className="text-[11px] text-app-muted" /> : null}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmptySearch() {
  const scr = useScreen();
  if (!scr?.query) return null;
  return (
    <div className="px-5 py-8 text-center text-app-muted text-[14px]">
      <Icon name="search" size={28} className="mx-auto mb-2 opacity-60" />
      Aucun résultat pour « {scr.query} »
    </div>
  );
}

// ───────────────────────── Fiche détail ─────────────────────────
export function Detail({ block }) {
  const rt = useRt();
  const scr = useScreen();
  const p = block.fromItem ? scr.params.item : null;
  const it = useMemo(
    () => ({
      id: p?.id || block.id,
      title: p?.title || block.title,
      subtitle: p?.subtitle || block.subtitle,
      price: Number.isFinite(p?.price) ? p.price : block.price,
      oldPrice: p?.oldPrice || block.oldPrice,
      rating: p?.rating || block.rating,
      badge: p?.badge || block.badge,
      image: p?.image || (block.media?.kind === 'image' ? block.media.src : block.images?.[0]),
    }),
    [p, block]
  );
  const gallery = useMemo(() => {
    const g = [];
    if (p?.image) g.push({ kind: 'image', src: p.image });
    else if (block.media) g.push(block.media);
    (block.images || []).forEach((src) => src && src !== p?.image && g.push({ kind: 'image', src }));
    return g.slice(0, 5);
  }, [p, block]);
  const [gi, setGi] = useState(0);
  const [qty, setQty] = useState(1);
  const [opts, setOpts] = useState(() => Object.fromEntries((block.options || []).map((o) => [o.name, o.values[0]])));
  const [more, setMore] = useState(false);
  const total = Number.isFinite(it.price) ? it.price * (block.quantity ? qty : 1) : null;
  const y = useTransform(scr.scrollY, [0, 400], [0, 120]);
  const scale = useTransform(scr.scrollY, [-100, 0, 400], [1.15, 1, 1.05]);

  const action = block.cta?.action;
  const isCartAction = !action || action.type === 'addToCart';
  useEffect(() => {
    scr.setDetail({
      label: block.cta?.label || 'Ajouter au panier',
      total,
      onAction: (e) => {
        if (isCartAction) {
          rt.addToCart(it, { qty: block.quantity ? qty : 1, options: opts, el: e?.currentTarget });
        } else {
          rt.setBooking?.({ ...(rt.booking || {}), service: { title: it.title, price: it.price, image: it.image } });
          rt.run(action, { item: { ...it, qty } });
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, opts, it, total, block.cta]);

  const discount = it.oldPrice && it.price ? Math.round((1 - it.price / it.oldPrice) * 100) : 0;
  return (
    <div>
      <div className="relative overflow-hidden" style={{ height: 410 }}>
        <motion.div className="absolute inset-0" style={{ y, scale }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={gi} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <Media media={gallery[gi]} w={1000} kenburns={false} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 28%, transparent 70%, rgba(0,0,0,0.25))' }} />
        {gallery.length > 1 && (
          <div className="absolute left-0 right-0 flex justify-center gap-2" style={{ bottom: 44 }}>
            {gallery.map((g, i) => (
              <motion.button key={i} type="button" whileTap={{ scale: 0.9 }} onClick={() => setGi(i)} className="w-12 h-12 rounded-xl overflow-hidden" style={{ boxShadow: i === gi ? '0 0 0 2.5px #fff' : '0 0 0 1px rgba(255,255,255,0.4)', opacity: i === gi ? 1 : 0.75 }}>
                {g.kind === 'image' ? <Img src={g.src} w={140} className="w-full h-full" /> : <div className="w-full h-full flex items-center justify-center bg-black/50 text-white"><Icon name="play" size={16} /></div>}
              </motion.button>
            ))}
          </div>
        )}
      </div>
      <div className="relative -mt-7 bg-app-bg px-5 pt-6" style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12.5px]">
            {it.badge && <span className="h-6 px-2.5 rounded-full text-[11px] font-bold flex items-center" style={{ background: 'var(--app-primary-soft)', color: 'var(--app-primary-ink)' }}>{it.badge}</span>}
            <span className="flex items-center gap-1 text-app-muted">
              <Stars value={it.rating || 4.8} size={12} />
              <b className="text-app-text ml-0.5">{it.rating || 4.8}</b>({block.reviews})
            </span>
          </div>
          <HeartButton active={rt.favs.has(it.id)} onToggle={() => rt.toggleFav(it.id, it.title)} size={36} />
        </div>
        <h1 className="app-heading text-[26px] font-extrabold leading-[1.1] mt-2.5">{it.title}</h1>
        {it.subtitle && <p className="text-[14px] text-app-muted mt-1">{it.subtitle}</p>}
        {Number.isFinite(it.price) && (
          <div className="flex items-baseline gap-2.5 mt-3">
            <Money value={it.price} currency={rt.currency} className="app-heading text-[28px] font-extrabold" style={{ color: 'var(--app-primary-ink)' }} />
            {it.oldPrice ? <Money value={it.oldPrice} currency={rt.currency} strike className="text-[15px] text-app-muted" /> : null}
            {discount > 0 && <span className="h-6 px-2 rounded-md text-[12px] font-bold flex items-center" style={{ background: 'color-mix(in srgb, var(--app-success) 14%, transparent)', color: 'var(--app-success)' }}>-{discount}%</span>}
          </div>
        )}
        {block.vendor?.name && (
          <div className="app-card flex items-center gap-3 p-3 mt-4">
            <Avatar src={block.vendor.avatar} name={block.vendor.name} size={42} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14.5px] truncate flex items-center gap-1">
                {block.vendor.name} <Icon name="badge-check" size={15} style={{ color: 'var(--app-primary-ink)' }} />
              </p>
              {block.vendor.subtitle && <p className="text-[12px] text-app-muted truncate">{block.vendor.subtitle}</p>}
            </div>
            <button type="button" onClick={() => rt.run(rt.routes.chat ? { type: 'navigate', to: rt.routes.chat } : { type: 'whatsapp', phone: '221770000000' })} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--app-primary-soft)', color: 'var(--app-primary-ink)' }}>
              <Icon name="message-circle" size={19} />
            </button>
          </div>
        )}
        {(block.options || []).map((o) => (
          <div key={o.name} className="mt-5">
            <p className="text-[14px] font-bold mb-2.5">
              {o.name} <span className="text-app-muted font-medium">· {opts[o.name]}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {o.values.map((v, vi) =>
                o.type === 'colors' ? (
                  <motion.button key={v} type="button" whileTap={{ scale: 0.88 }} onClick={() => setOpts({ ...opts, [o.name]: v })} className="w-9 h-9 rounded-full" title={v} style={{ background: SWATCH[vi % SWATCH.length], boxShadow: opts[o.name] === v ? '0 0 0 2px var(--app-bg), 0 0 0 4px var(--app-primary)' : 'inset 0 0 0 1px var(--app-border)' }} />
                ) : (
                  <motion.button key={v} type="button" whileTap={{ scale: 0.92 }} onClick={() => setOpts({ ...opts, [o.name]: v })} className="h-10 min-w-[48px] px-4 text-[13.5px] font-semibold" style={{ borderRadius: 'min(var(--app-radius-sm), 999px)', background: opts[o.name] === v ? 'var(--app-text)' : 'var(--app-surface)', color: opts[o.name] === v ? 'var(--app-bg)' : 'var(--app-text)', transition: 'background .2s, color .2s' }}>
                    {v}
                  </motion.button>
                )
              )}
            </div>
          </div>
        ))}
        {block.quantity && Number.isFinite(it.price) && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-[14px] font-bold">Quantité</p>
            <Qty value={qty} onChange={setQty} />
          </div>
        )}
        {block.description && (
          <div className="mt-5">
            <p className="text-[14px] font-bold mb-1.5">Description</p>
            <p className={`text-[14px] text-app-muted leading-relaxed ${more ? '' : 'line-clamp-3'}`}>{block.description}</p>
            {block.description.length > 140 && (
              <button type="button" onClick={() => setMore((m) => !m)} className="text-[13px] font-semibold mt-1" style={{ color: 'var(--app-primary-ink)' }}>
                {more ? 'Voir moins' : 'Lire plus'}
              </button>
            )}
          </div>
        )}
        {block.features?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-5">
            {block.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-app-surface text-[12.5px] font-semibold" style={{ borderRadius: 'var(--app-radius-sm)' }}>
                <Icon name={f.icon} size={16} style={{ color: 'var(--app-primary-ink)' }} />
                <span className="truncate">{f.label}</span>
              </div>
            ))}
          </div>
        )}
        <div className="h-2" />
      </div>
    </div>
  );
}
const SWATCH = ['#1f2937', '#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#f5f5f4', '#92400e'];

// ───────────────────────── Panier ─────────────────────────
export function Cart({ block }) {
  const rt = useRt();
  useEffect(() => {
    rt.prefillCart(block.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);
  const items = rt.cart;
  const subtotal = rt.cartTotal;
  const fee = items.length ? block.fee || 0 : 0;
  const discount = applied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + fee - discount;
  if (!items.length) {
    return (
      <div className="px-6 py-6 flex flex-col items-center text-center">
        <Illustration name="shopping" size={210} />
        <h3 className="app-heading text-[21px] font-bold mt-3">Ton panier est vide</h3>
        <p className="text-[14px] text-app-muted mt-1.5 max-w-[260px]">Ajoute tes coups de cœur, on s'occupe du reste.</p>
        <Btn className="mt-5" onClick={() => rt.home()}>
          Découvrir
        </Btn>
      </div>
    );
  }
  return (
    <div className="px-5">
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div key={it.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60, height: 0, marginBottom: -12 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }} className="app-card flex items-center gap-3 p-2.5">
              <Img src={it.image} w={220} className="w-[76px] h-[76px] shrink-0" style={{ borderRadius: 'var(--app-radius-sm)' }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14.5px] truncate">{it.title}</p>
                <p className="text-[12px] text-app-muted truncate">{Object.values(it.options || {}).join(' · ') || it.subtitle || ' '}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <Money value={it.price * it.qty} currency={rt.currency} className="font-bold text-[14.5px]" />
                  <Qty value={it.qty} onChange={(q) => rt.setQty(it.key, q)} min={0} size="sm" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex gap-2 mt-4">
        <div className="flex-1 flex items-center gap-2 h-12 px-3.5 bg-app-surface" style={{ borderRadius: 'min(var(--app-radius), 999px)' }}>
          <Icon name="tag" size={17} className="text-app-muted" />
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code promo" className="flex-1 min-w-0 bg-transparent outline-none text-[14px] placeholder:text-app-muted" />
        </div>
        <Btn
          variant={applied ? 'secondary' : 'dark'}
          onClick={() => {
            if (applied) return;
            setApplied(true);
            rt.toast('Code appliqué : -10 %', 'percent');
          }}
        >
          {applied ? '✓' : 'Appliquer'}
        </Btn>
      </div>
      <div className="app-card p-4 mt-4 flex flex-col gap-2.5 text-[14px]">
        <Row label="Sous-total" value={formatMoney(subtotal, rt.currency, true)} />
        {fee > 0 && <Row label={block.feeLabel} value={formatMoney(fee, rt.currency, true)} />}
        {discount > 0 && <Row label="Réduction" value={`− ${formatMoney(discount, rt.currency, true)}`} accent />}
        <div className="h-px bg-app-border my-1" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-[15px]">Total</span>
          <Money value={total} currency={rt.currency} compact={false} className="app-heading font-extrabold text-[20px]" />
        </div>
      </div>
      <Btn
        full
        size="lg"
        className="mt-4"
        onClick={() => {
          rt.setOrder({ status: 'draft', subtotal, fee, discount, total, lines: items.map((i) => ({ title: i.title, qty: i.qty, price: i.price * i.qty })) });
          rt.run(block.checkoutAction || (rt.routes.checkout ? { type: 'navigate', to: rt.routes.checkout } : null));
        }}
        style={{ boxShadow: '0 14px 28px -12px var(--app-primary)' }}
      >
        <span data-tour="cart-checkout" className="flex items-center gap-2">
          {block.ctaLabel} · <Money value={total} currency={rt.currency} />
        </span>
      </Btn>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-app-muted">{label}</span>
      <span className="font-semibold" style={{ color: accent ? 'var(--app-success)' : undefined, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

// ───────────────────────── Paiement Mobile Money (simulé) ─────────────────────────
const PHONE_OK = (d) => d.length === 9 && /^7[05678]/.test(d);
const fmtPhone = (d) => d.replace(/\D/g, '').slice(0, 9).replace(/^(\d{2})(\d{0,3})(\d{0,2})(\d{0,2}).*/, (m, a, b, c, e) => [a, b, c, e].filter(Boolean).join(' '));

export function Checkout({ block }) {
  const rt = useRt();
  const scr = useScreen();
  const draft = rt.order?.status === 'draft' ? rt.order : null;
  const pItem = scr.params.item;
  const lines = useMemo(() => {
    if (rt.cart.length) return rt.cart.map((i) => ({ title: `${i.title}${i.qty > 1 ? ` × ${i.qty}` : ''}`, price: i.price * i.qty }));
    if (draft?.lines?.length) return draft.lines.map((l) => ({ title: `${l.title}${l.qty > 1 ? ` × ${l.qty}` : ''}`, price: l.price }));
    if (rt.booking?.service?.title) return [{ title: rt.booking.service.title, sub: [rt.booking.dateLabel, rt.booking.slot].filter(Boolean).join(' · '), price: rt.booking.service.price || 0 }];
    if (pItem?.title) return [{ title: pItem.title, price: (pItem.price || 0) * (pItem.qty || 1) }];
    return [];
  }, [rt.cart, draft, rt.booking, pItem]);
  const computed = lines.reduce((n, l) => n + (l.price || 0), 0);
  const total = block.amount || (rt.cart.length ? rt.cartTotal + (draft?.fee || 0) - (draft?.discount || 0) : draft?.total) || computed || 15000;
  const methods = block.methods?.length ? block.methods : ['wave', 'orange_money', 'free_money', 'card'];
  const [method, setMethod] = useState(methods[0]);
  const [phone, setPhone] = useState('771234567');
  const [err, setErr] = useState('');
  const [showLines, setShowLines] = useState(false);
  const mm = ['wave', 'orange_money', 'free_money'].includes(method);
  const merchant = block.merchant || rt.spec.meta.name;

  const finish = (m) => {
    const ref = 'CMD-' + String(Math.floor(10000 + Math.random() * 89999));
    const pm = PAY_METHODS[m];
    rt.setOrder({ status: 'paid', ref, total, method: m, methodLabel: pm.label, phone: fmtPhone(phone), lines, date: new Date() });
    rt.clearCart();
    if (m !== 'cash') rt.notify({ title: pm.label, text: `Paiement de ${formatMoney(total, rt.currency, true)} à ${merchant} confirmé.`, short: pm.short, color: pm.color, ink: pm.ink });
    rt.run(block.successAction || (rt.routes.success ? { type: 'navigate', to: rt.routes.success } : { type: 'toast', message: 'Paiement confirmé ✓' }));
  };

  const pay = () => {
    if (mm && !PHONE_OK(phone)) {
      setErr('Numéro invalide (ex : 77 123 45 67)');
      return;
    }
    setErr('');
    if (method === 'cash') return finish('cash');
    rt.openSheet({ locked: true, render: (close) => <PaySheet method={method} total={total} phone={fmtPhone(phone)} merchant={merchant} onDone={() => { close(); setTimeout(() => finish(method), 180); }} onCancel={close} /> });
  };

  return (
    <div className="px-5">
      <div className="relative overflow-hidden p-5 text-center" style={{ borderRadius: 'var(--app-radius-lg)', background: 'linear-gradient(145deg, var(--app-primary), color-mix(in srgb, var(--app-accent) 55%, var(--app-primary)))', color: 'var(--app-on-primary)' }}>
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-10 -bottom-12 w-36 h-36 rounded-full bg-black/10" />
        <p className="relative text-[13px] font-semibold opacity-85">Total à payer</p>
        <p className="relative app-heading text-[38px] font-extrabold leading-tight mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <CountUp value={total} duration={0.9} /> <span className="text-[18px] font-bold opacity-80">{rt.currency}</span>
        </p>
        <p className="relative text-[12.5px] opacity-80 mt-1 flex items-center justify-center gap-1.5">
          <Icon name="shield-check" size={14} /> {merchant} · paiement sécurisé
        </p>
        {lines.length > 0 && (
          <button type="button" onClick={() => setShowLines((s) => !s)} className="relative mt-3 text-[12.5px] font-semibold underline underline-offset-4 opacity-90">
            {showLines ? 'Masquer' : 'Voir'} le détail ({lines.length})
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {showLines && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="app-card p-4 mt-3 flex flex-col gap-2 text-[13.5px]">
              {lines.map((l, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate">{l.title}</span>
                    {l.sub && <span className="block text-[11.5px] text-app-muted">{l.sub}</span>}
                  </span>
                  <Money value={l.price} currency={rt.currency} className="font-semibold shrink-0" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[14px] font-bold mt-6 mb-3">Moyen de paiement</p>
      <div className="flex flex-col gap-2.5">
        {methods.map((m) => {
          const pm = PAY_METHODS[m];
          const on = m === method;
          return (
            <motion.button
              key={m}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setMethod(m);
                setErr('');
              }}
              data-tour={`method-${m}`}
              className="app-card flex items-center gap-3 p-3 text-left"
              style={{ boxShadow: on ? '0 0 0 2px var(--app-primary)' : undefined, transition: 'box-shadow .2s' }}
            >
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center font-extrabold text-[13px] shrink-0" style={{ background: pm.color, color: pm.ink }}>
                {m === 'card' ? <Icon name="credit-card" size={20} /> : m === 'cash' ? <Icon name="banknote" size={20} /> : pm.short}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-[15px]">{pm.label}</span>
                <span className="block text-[12px] text-app-muted">{pm.hint}</span>
              </span>
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ boxShadow: on ? 'none' : 'inset 0 0 0 2px var(--app-border)', background: on ? 'var(--app-primary)' : 'transparent', color: 'var(--app-on-primary)' }}>
                {on && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Icon name="check" size={15} strokeWidth={3} />
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mm ? (
          <motion.div key="mm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5">
            <p className="text-[14px] font-bold mb-2">Numéro {PAY_METHODS[method].label}</p>
            <motion.div animate={err ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} className="flex items-center h-[54px] bg-app-surface overflow-hidden" style={{ borderRadius: 'min(var(--app-radius), 999px)', boxShadow: err ? '0 0 0 2px var(--app-danger)' : undefined }}>
              <span className="h-full px-4 flex items-center gap-1.5 text-[15px] font-semibold border-r border-app-border">🇸🇳 +221</span>
              <input value={fmtPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} inputMode="numeric" className="flex-1 min-w-0 h-full px-4 bg-transparent outline-none text-[16px] font-semibold tracking-wide" placeholder="77 123 45 67" />
            </motion.div>
            {err && <p className="text-[12.5px] mt-1.5" style={{ color: 'var(--app-danger)' }}>{err}</p>}
          </motion.div>
        ) : method === 'card' ? (
          <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 app-card p-4 flex flex-col gap-3 text-[14.5px]">
            <div className="flex items-center justify-between">
              <span className="tracking-[0.12em] font-semibold">4242 4242 4242 4242</span>
              <Icon name="credit-card" size={20} className="text-app-muted" />
            </div>
            <div className="flex gap-3 text-app-muted text-[13.5px]">
              <span>Exp. 12/28</span>
              <span>CVC •••</span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="cash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 flex items-center gap-2 text-[13.5px] text-app-muted">
            <Icon name="info" size={16} /> Tu paieras {formatMoney(total, rt.currency, false)} à la réception.
          </motion.div>
        )}
      </AnimatePresence>

      <Btn full size="lg" className="mt-6" onClick={pay} style={{ boxShadow: '0 16px 30px -14px var(--app-primary)' }}>
        <span data-tour="pay-button" className="flex items-center gap-2">
          <Icon name={method === 'cash' ? 'check' : 'lock'} size={17} />
          {method === 'cash' ? 'Confirmer la commande' : `Payer ${formatMoney(total, rt.currency, true)}`}
        </span>
      </Btn>
      <p className="text-center text-[11.5px] text-app-muted mt-3 flex items-center justify-center gap-1.5">
        <Icon name="shield-check" size={13} /> Transactions chiffrées · aucune donnée bancaire stockée
      </p>
    </div>
  );
}

function PaySheet({ method, total, phone, merchant, onDone, onCancel }) {
  const rt = useRt();
  const pm = PAY_METHODS[method];
  const pinFlow = method === 'orange_money' || method === 'free_money';
  const [phase, setPhase] = useState(pinFlow ? 'pin' : 'sending');
  const [pin, setPin] = useState('');
  const auto = rt.mode === 'capture' || rt.autopilot;
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (phase === 'sending') later(() => setPhase(method === 'card' ? 'processing' : 'confirm'), 1100);
    if (phase === 'confirm') later(() => setPhase('processing'), auto ? 1600 : 2600);
    if (phase === 'processing') later(() => setPhase('done'), 1300);
    if (phase === 'done') later(onDone, 1000);
    if (phase === 'pin' && auto) {
      [0, 1, 2, 3].forEach((i) => later(() => setPin((p) => (p + '•').slice(0, 4)), 700 + i * 280));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  useEffect(() => {
    if (phase === 'pin' && pin.length === 4) later(() => setPhase('processing'), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="px-5 pt-3 pb-4 text-center">
      <div className="flex items-center justify-center gap-2.5">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-[13px]" style={{ background: pm.color, color: pm.ink }}>
          {method === 'card' ? <Icon name="credit-card" size={19} /> : pm.short}
        </span>
        <div className="text-left">
          <p className="font-bold text-[15px] leading-tight">{pm.label}</p>
          <p className="text-[12px] text-app-muted">{merchant} · {formatMoney(total, rt.currency, true)}</p>
        </div>
      </div>
      <div className="relative h-[190px] flex items-center justify-center mt-2">
        <AnimatePresence mode="wait">
          {phase === 'done' ? (
            <motion.div key="done" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }} className="w-[104px] h-[104px] rounded-full flex items-center justify-center" style={{ background: 'var(--app-success)' }}>
              <svg width="54" height="54" viewBox="0 0 24 24">
                <motion.path d="M5 12.5l4.5 4.5L19 7.5" style={{ fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.1 }} />
              </svg>
            </motion.div>
          ) : phase === 'pin' ? (
            <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <p className="text-[14.5px] font-semibold">Saisis ton code secret</p>
              <p className="text-[12px] text-app-muted mt-0.5">Envoyé sur le {phone}</p>
              <div className="flex justify-center gap-3.5 my-4">
                {[0, 1, 2, 3].map((i) => (
                  <motion.span key={i} animate={{ scale: pin.length > i ? [1, 1.3, 1] : 1 }} className="w-3.5 h-3.5 rounded-full" style={{ background: pin.length > i ? pm.color : 'var(--app-surface2)' }} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
                  <button key={i} type="button" disabled={!k} onClick={() => setPin((p) => (k === '⌫' ? p.slice(0, -1) : (p + '•').slice(0, 4)))} className="h-10 rounded-xl text-[17px] font-semibold active:bg-app-surface2" style={{ background: k ? 'var(--app-surface)' : 'transparent' }} data-tour={k ? `pin-${k}` : undefined}>
                    {k}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key={phase} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="absolute w-24 h-24 rounded-full" style={{ border: `2px solid ${pm.color}` }} initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }} />
              ))}
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="relative w-[70px] h-[120px] rounded-[16px] p-1.5" style={{ background: '#15151a' }}>
                <div className="w-full h-full rounded-[11px] flex flex-col items-center justify-center gap-1.5" style={{ background: pm.color, color: pm.ink }}>
                  <span className="font-extrabold text-[15px]">{method === 'card' ? '3DS' : pm.short}</span>
                  <motion.span className="w-8 h-1.5 rounded-full bg-current opacity-60" animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="font-bold text-[16px]">
        {phase === 'sending' && 'Envoi de la demande…'}
        {phase === 'confirm' && (method === 'wave' ? 'Valide le paiement dans Wave' : 'Confirme sur ton téléphone')}
        {phase === 'processing' && (method === 'card' ? 'Vérification 3D Secure…' : 'Paiement en cours…')}
        {phase === 'done' && 'Paiement réussi !'}
        {phase === 'pin' && ' '}
      </p>
      <p className="text-[12.5px] text-app-muted mt-1 min-h-[18px]">
        {phase === 'confirm' && method === 'wave' && `Une notification a été envoyée au ${phone}`}
        {phase === 'processing' && 'Ne ferme pas l\'application'}
      </p>
      {phase === 'confirm' && (
        <button type="button" onClick={() => setPhase('processing')} className="mt-3 text-[13px] font-semibold underline underline-offset-4" style={{ color: 'var(--app-primary-ink)' }}>
          J'ai validé (démo)
        </button>
      )}
      {phase === 'pin' && (
        <div className="flex justify-center gap-4 mt-3">
          <button type="button" onClick={onCancel} className="text-[13px] font-semibold text-app-muted">
            Annuler
          </button>
          <button type="button" onClick={() => setPin('••••')} className="text-[13px] font-semibold" style={{ color: 'var(--app-primary-ink)' }}>
            Remplir (démo)
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Confirmation ─────────────────────────
export function Success({ block }) {
  const rt = useRt();
  const o = rt.order?.status === 'paid' ? rt.order : null;
  const details = block.details?.length
    ? block.details
    : o
      ? [
          { label: 'Référence', value: o.ref },
          { label: 'Montant', value: formatMoney(o.total, rt.currency, false) },
          { label: 'Payé avec', value: o.methodLabel },
          { label: 'Date', value: o.date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
        ]
      : [];
  const buttons = block.buttons?.length
    ? block.buttons
    : [
        ...(rt.routes.tracking ? [{ label: 'Suivre ma commande', action: { type: 'navigate', to: rt.routes.tracking } }] : rt.routes.ticket ? [{ label: 'Voir mon billet', action: { type: 'navigate', to: rt.routes.ticket } }] : []),
        { label: 'Retour à l\'accueil', action: { type: 'home' }, style: 'ghost' },
      ];
  return (
    <div className="relative px-5 flex flex-col items-center text-center" style={{ paddingTop: rt.safeTop + 30, minHeight: 640 }}>
      {block.confetti && <Confetti />}
      <Illustration name={block.illustration && block.illustration !== 'success' ? block.illustration : 'success'} size={200} />
      <Words as="h1" text={block.title} delay={0.3} className="app-heading text-[28px] font-extrabold leading-tight mt-2" />
      {block.subtitle && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-[14.5px] text-app-muted mt-2 max-w-[300px] leading-relaxed">
          {block.subtitle}
        </motion.p>
      )}
      {details.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, type: 'spring', stiffness: 200, damping: 24 }} className="app-card w-full mt-6 p-4 text-[14px] relative">
          {details.map((d, i) => (
            <div key={i} className={`flex justify-between gap-4 py-2 ${i ? 'border-t border-dashed border-app-border' : ''}`}>
              <span className="text-app-muted">{d.label}</span>
              <span className="font-semibold text-right">{d.value}</span>
            </div>
          ))}
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="w-full flex flex-col gap-2 mt-6">
        {buttons.map((b, i) => (
          <Btn key={i} full size="lg" variant={i === 0 && b.style !== 'ghost' ? 'primary' : 'ghost'} onClick={() => rt.run(b.action)}>
            <span data-tour={i === 0 ? 'success-primary' : undefined}>{b.label}</span>
          </Btn>
        ))}
      </motion.div>
    </div>
  );
}

// ───────────────────────── Offres / abonnements ─────────────────────────
export function Plans({ block }) {
  const rt = useRt();
  return (
    <div className="px-5">
      {(block.title || block.subtitle) && (
        <div className="mb-4">
          {block.title && <h2 className="app-heading text-[22px] font-bold"><Rich text={block.title} /></h2>}
          {block.subtitle && <p className="text-[14px] text-app-muted mt-1">{block.subtitle}</p>}
        </div>
      )}
      <div className="flex flex-col gap-3.5">
        {block.items.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative p-[2px]" style={{ borderRadius: 'var(--app-radius-lg)', background: p.highlight ? 'linear-gradient(135deg, var(--app-primary), var(--app-accent))' : 'var(--app-border)' }}>
            <div className="relative p-5 bg-app-elevated" style={{ borderRadius: 'calc(var(--app-radius-lg) - 2px)' }}>
              {p.badge && <span className="absolute -top-3 right-5 h-6 px-3 rounded-full text-[11px] font-bold flex items-center" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>{p.badge}</span>}
              <p className="font-bold text-[16px]">{p.name}</p>
              <p className="mt-1">
                <Money value={p.price} currency={rt.currency} className="app-heading text-[30px] font-extrabold" />
                <span className="text-[13px] text-app-muted ml-1">{p.period}</span>
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {p.features.map((f, k) => (
                  <li key={k} className="flex items-start gap-2 text-[13.5px]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-[1px]" style={{ background: 'var(--app-primary-soft)', color: 'var(--app-primary-ink)' }}>
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Btn
                full
                className="mt-4"
                variant={p.highlight ? 'primary' : 'secondary'}
                onClick={() => {
                  rt.setOrder({ status: 'draft', total: p.price, lines: [{ title: `Offre ${p.name}`, qty: 1, price: p.price }] });
                  rt.clearCart();
                  rt.run(p.cta?.action || (rt.routes.checkout ? { type: 'navigate', to: rt.routes.checkout } : null));
                }}
              >
                {p.cta?.label || 'Choisir'}
              </Btn>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
