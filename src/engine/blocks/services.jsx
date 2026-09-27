import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import QRCode from 'qrcode';
import { useRt, useScreen } from '../context.js';
import { Avatar, Btn, Icon, Img, Money, SectionHead, Rich } from '../ui.jsx';
import { hash } from '../../../shared/utils.js';
import { openOrder, isDemoPhone, prettyPhone } from '../live.jsx';

const WEEK = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// ───────────────────────── Réservation ─────────────────────────
export function Booking({ block }) {
  const rt = useRt();
  const scr = useScreen();
  const p = scr.params.item;
  const svc = block.service || (p?.title ? { title: p.title, price: p.price, image: p.image, duration: p.meta } : rt.booking?.service || null);
  const days = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < block.days; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      out.push({ d, wd: i === 0 ? 'auj.' : WEEK[d.getDay()], n: d.getDate(), m: MONTHS[d.getMonth()], closed: d.getDay() === 0 && i > 0 });
    }
    return out;
  }, [block.days]);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(null);
  const [staff, setStaff] = useState(0);
  const taken = (s) => block.unavailable.includes(s) || hash(`${day}-${s}`) % 5 === 0 || days[day]?.closed;
  const cur = days[day];
  const confirm = () => {
    if (!slot) return rt.toast('Choisis un créneau', 'clock');
    const dateLabel = `${cur.wd === 'auj.' ? "Aujourd'hui" : cur.wd} ${cur.n} ${cur.m}`;
    rt.setBooking({ service: svc || { title: rt.spec.meta.name, price: 0 }, dateLabel, slot, staff: block.staff[staff]?.name });
    // Site en ligne : la réservation est envoyée au vendeur (jamais de fausse confirmation)
    if (rt.live) {
      rt.setOrder(null);
      rt.clearCart();
      return setTimeout(() => openOrder(rt, 'reservation'), 0);
    }
    rt.run(block.cta?.action || (rt.routes.checkout ? { type: 'navigate', to: rt.routes.checkout } : { type: 'toast', message: 'Rendez-vous confirmé ✓' }));
  };
  return (
    <div className="px-5">
      {block.title && <h2 className="app-heading text-[21px] font-bold mb-4"><Rich text={block.title} /></h2>}
      {svc?.title && (
        <div className="app-card flex items-center gap-3 p-3 mb-5">
          {svc.image ? <Img src={svc.image} w={200} className="w-16 h-16 shrink-0" style={{ borderRadius: 'var(--app-radius-sm)' }} /> : null}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] truncate">{svc.title}</p>
            {svc.duration && (
              <p className="text-[12.5px] text-app-muted flex items-center gap-1 mt-0.5">
                <Icon name="clock" size={13} /> {svc.duration}
              </p>
            )}
          </div>
          {Number.isFinite(svc.price) && <Money value={svc.price} currency={rt.currency} className="font-bold text-[15px]" style={{ color: 'var(--app-primary-ink)' }} />}
        </div>
      )}
      <div className="flex items-center justify-between mb-2.5">
        <p className="font-bold text-[14.5px]">Date</p>
        <p className="text-[13px] text-app-muted capitalize">{cur?.m} {cur?.d.getFullYear()}</p>
      </div>
      <div className="hscroll gap-2 -mx-5 px-5 pb-1">
        {days.map((d, i) => (
          <motion.button key={i} type="button" whileTap={{ scale: 0.92 }} disabled={d.closed} onClick={() => { setDay(i); setSlot(null); }} data-tour={`day-${i}`} className="relative shrink-0 w-[58px] h-[76px] flex flex-col items-center justify-center gap-1" style={{ borderRadius: 'min(var(--app-radius), 20px)', opacity: d.closed ? 0.4 : 1 }}>
            {i === day ? <motion.span className="absolute inset-0" style={{ borderRadius: 'min(var(--app-radius), 20px)', background: 'var(--app-primary)', boxShadow: '0 10px 20px -10px var(--app-primary)' }} initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 32 }} /> : <span className="absolute inset-0 bg-app-surface" style={{ borderRadius: 'min(var(--app-radius), 20px)' }} />}
            <span className="relative text-[11.5px] font-semibold" style={{ color: i === day ? 'var(--app-on-primary)' : 'var(--app-muted)' }}>{d.wd}</span>
            <span className="relative text-[19px] font-bold" style={{ color: i === day ? 'var(--app-on-primary)' : 'var(--app-text)' }}>{d.n}</span>
          </motion.button>
        ))}
      </div>
      <p className="font-bold text-[14.5px] mt-5 mb-2.5">Heure</p>
      <div className="grid grid-cols-4 gap-2">
        {block.slots.map((s, i) => {
          const off = taken(s);
          const on = slot === s;
          return (
            <motion.button key={s} type="button" whileTap={off ? undefined : { scale: 0.92 }} disabled={off} onClick={() => setSlot(s)} data-tour={off ? undefined : 'slot'} className="h-11 text-[14px] font-semibold" style={{ borderRadius: 'min(var(--app-radius-sm), 14px)', background: on ? 'var(--app-primary)' : 'var(--app-surface)', color: on ? 'var(--app-on-primary)' : off ? 'var(--app-muted)' : 'var(--app-text)', textDecoration: off ? 'line-through' : 'none', opacity: off ? 0.5 : 1, transition: 'background .2s, color .2s' }}>
              {s}
            </motion.button>
          );
        })}
      </div>
      {block.staff.length > 0 && (
        <>
          <p className="font-bold text-[14.5px] mt-5 mb-2.5">Avec</p>
          <div className="hscroll gap-3 -mx-5 px-5">
            {block.staff.map((m, i) => (
              <motion.button key={i} type="button" whileTap={{ scale: 0.93 }} onClick={() => setStaff(i)} className="shrink-0 flex flex-col items-center gap-1.5 w-[70px]">
                <span className="rounded-full p-[2.5px]" style={{ background: i === staff ? 'var(--app-primary)' : 'transparent' }}>
                  <span className="block rounded-full p-[2px] bg-app-bg">
                    <Avatar src={m.avatar} name={m.name} size={54} />
                  </span>
                </span>
                <span className="text-[12px] font-semibold truncate w-full text-center">{m.name}</span>
                {m.role && <span className="text-[10.5px] text-app-muted -mt-1 truncate w-full text-center">{m.role}</span>}
              </motion.button>
            ))}
          </div>
        </>
      )}
      <Btn full size="lg" className="mt-6" onClick={confirm} style={{ opacity: slot ? 1 : 0.55 }}>
        <span data-tour="booking-cta">{slot ? `${block.cta?.label || 'Confirmer'} · ${slot}` : 'Choisis un créneau'}</span>
      </Btn>
    </div>
  );
}

// ───────────────────────── Carte stylisée (sans tuiles externes) ─────────────────────────
const ROUTE = 'M70 262 C 110 250, 120 210, 150 196 S 214 190, 232 150 S 262 92, 318 70';
export function MapCanvas({ height = 300, route = true, courier = false, pins = [], progress }) {
  const rt = useRt();
  const dark = rt.palette.dark;
  const land = dark ? '#1b1d24' : '#eef0ec';
  const block_ = dark ? '#23262f' : '#e2e5df';
  const road = dark ? '#2e323d' : '#ffffff';
  const sea = dark ? '#132433' : '#cfe6f3';
  const park = dark ? '#1c2b22' : '#d6ebd3';
  const pathRef = useRef(null);
  const [pt, setPt] = useState({ x: 70, y: 262, a: 0 });
  const mv = useMotionValue(0.08);
  useEffect(() => {
    if (!courier) return;
    const c = animate(mv, [0.08, 0.92], { duration: 26, repeat: Infinity, ease: 'linear', repeatType: 'loop' });
    return () => c.stop();
  }, [courier, mv]);
  useMotionValueEvent(mv, 'change', (t) => {
    const p = pathRef.current;
    if (!p) return;
    const L = p.getTotalLength();
    const a = p.getPointAtLength(L * t);
    const b = p.getPointAtLength(Math.min(L, L * t + 2));
    setPt({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
  });
  const pinPos = (i) => {
    const h = hash('pin' + i);
    return { x: 50 + (h % 290), y: 50 + ((h >> 8) % Math.max(60, height - 110)) };
  };
  return (
    <svg viewBox={`0 0 390 ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid slice" style={{ display: 'block', background: land }}>
      <path d={`M0 0 H90 C 60 70, 40 150, 0 210 Z`} style={{ fill: sea }} />
      <path d={`M0 ${height} V${height - 60} C 60 ${height - 40}, 140 ${height - 20}, 170 ${height} Z`} style={{ fill: sea }} />
      <rect x="250" y="190" width="120" height="80" rx="18" style={{ fill: park }} />
      {[...Array(18)].map((_, i) => {
        const x = 100 + (i % 6) * 48;
        const y = 20 + Math.floor(i / 6) * 70;
        return <rect key={i} x={x} y={y} width="36" height="54" rx="6" style={{ fill: block_ }} />;
      })}
      {['M0 120 H390', 'M0 186 C 120 176, 260 200, 390 170', 'M150 0 V320', 'M300 0 C 290 100, 310 220, 300 320', 'M60 320 L 230 0'].map((d, i) => (
        <path key={i} d={d} style={{ stroke: road, strokeWidth: i < 2 ? 12 : 8, fill: 'none', strokeLinecap: 'round' }} />
      ))}
      {route && (
        <>
          <path ref={pathRef} d={ROUTE} style={{ stroke: 'color-mix(in srgb, var(--app-primary) 30%, transparent)', strokeWidth: 10, fill: 'none', strokeLinecap: 'round' }} />
          <motion.path d={ROUTE} style={{ stroke: 'var(--app-primary)', strokeWidth: 5, fill: 'none', strokeLinecap: 'round' }} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
          <path d={ROUTE} style={{ stroke: '#fff', strokeWidth: 2, fill: 'none', strokeDasharray: '2 10', strokeLinecap: 'round', animation: 'dash 1.2s linear infinite', opacity: 0.8 }} />
          <g transform="translate(70 262)">
            <circle r="16" style={{ fill: 'var(--app-primary)', opacity: 0.18 }} />
            <circle r="8" style={{ fill: 'var(--app-primary)', stroke: '#fff', strokeWidth: 3 }} />
          </g>
          <g transform="translate(318 70)">
            <motion.circle r="10" style={{ fill: 'var(--app-accent)', opacity: 0.35 }} animate={{ scale: [1, 2.6], opacity: [0.45, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
            <path d="M0 -26c-8 0-14 6-14 14 0 10 14 22 14 22s14-12 14-22c0-8-6-14-14-14z" style={{ fill: 'var(--app-text)' }} />
            <circle cy="-12" r="5" style={{ fill: 'var(--app-bg)' }} />
          </g>
        </>
      )}
      {courier && route && (
        <g transform={`translate(${pt.x} ${pt.y})`}>
          <circle r="22" style={{ fill: 'var(--app-primary)', opacity: 0.16 }} />
          <circle r="15" style={{ fill: 'var(--app-bg)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }} />
          <g transform={`rotate(${pt.a})`}>
            <path d="M-7 -5 L8 0 L-7 5 L-4 0 Z" style={{ fill: 'var(--app-primary)' }} />
          </g>
        </g>
      )}
      {pins.map((p, i) => {
        const { x, y } = pinPos(i);
        return (
          <motion.g key={i} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 300, damping: 18 }}>
            <g transform={`translate(${x} ${y})`}>
              <rect x={-4 - p.label.length * 3.4} y="-40" width={8 + p.label.length * 6.8} height="24" rx="12" style={{ fill: i === 0 ? 'var(--app-primary)' : 'var(--app-elevated)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }} />
              <text y="-24" textAnchor="middle" fontSize="11.5" fontWeight="700" style={{ fill: i === 0 ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
                {p.label}
              </text>
              <circle r="5" style={{ fill: i === 0 ? 'var(--app-primary)' : 'var(--app-text)', stroke: '#fff', strokeWidth: 2 }} />
            </g>
          </motion.g>
        );
      })}
    </svg>
  );
}

export function MapBlock({ block }) {
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="overflow-hidden app-card" style={{ borderRadius: 'var(--app-radius-lg)' }}>
        <MapCanvas height={block.height} route={block.route} pins={block.pins} courier={block.route} />
        {block.caption && (
          <div className="flex items-center gap-2 px-4 py-3 text-[13.5px]">
            <Icon name="map-pin" size={16} style={{ color: 'var(--app-primary-ink)' }} />
            <span className="truncate">{block.caption}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Suivi en direct ─────────────────────────
export function Tracking({ block, index }) {
  const rt = useRt();
  const [eta, setEta] = useState(() => parseInt(block.eta, 10) || 12);
  useEffect(() => {
    const t = setInterval(() => setEta((e) => Math.max(1, e - 1)), 9000);
    return () => clearInterval(t);
  }, []);
  const steps = block.steps.length ? block.steps : [
    { label: 'Commande confirmée', time: '', done: true },
    { label: 'En préparation', time: '', done: true },
    { label: 'En route', time: '', done: false },
    { label: 'Livrée', time: '', done: false },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const c = block.courier;
  return (
    <div>
      <div className="relative">
        <MapCanvas height={340} route courier />
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="absolute left-1/2 -translate-x-1/2 h-9 px-3.5 rounded-full flex items-center gap-2 text-[13px] font-semibold bg-app-elevated" style={{ boxShadow: 'var(--app-shadow)', top: index === 0 ? rt.safeTop + 6 : 16 }}>
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full" style={{ background: 'var(--app-success)', animation: 'pulse-ring 1.6s ease-out infinite' }} />
            <span className="relative w-2.5 h-2.5 rounded-full" style={{ background: 'var(--app-success)' }} />
          </span>
          En direct
        </motion.div>
      </div>
      <div className="relative -mt-6 bg-app-bg px-5 pt-5" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] text-app-muted">{block.title}</p>
            <p className="app-heading text-[30px] font-extrabold leading-tight">
              {eta} min <span className="text-[15px] font-semibold text-app-muted">· {block.status}</span>
            </p>
          </div>
          {block.to && <p className="text-[12px] text-app-muted text-right max-w-[130px]">{block.to}</p>}
        </div>
        <div className="flex gap-1.5 mt-4">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-app-surface overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: 'var(--app-primary)', originX: 0 }} initial={{ scaleX: 0 }} animate={{ scaleX: i < doneCount ? 1 : i === doneCount ? [0, 0.7, 0] : 0 }} transition={i === doneCount ? { duration: 2.2, repeat: Infinity } : { duration: 0.6, delay: i * 0.2 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-app-muted">
          {steps.map((s, i) => (
            <span key={i} className={i === doneCount ? 'font-bold' : ''} style={{ color: i === doneCount ? 'var(--app-text)' : undefined }}>
              {s.label}
            </span>
          ))}
        </div>
        <div className="app-card flex items-center gap-3 p-3.5 mt-5">
          <Avatar src={c.avatar} name={c.name} size={50} ring />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] truncate">{c.name}</p>
            <p className="text-[12.5px] text-app-muted truncate">{c.vehicle}</p>
            <p className="text-[12px] flex items-center gap-1 mt-0.5">
              <Icon name="star" size={12} style={{ fill: '#F5B301', color: '#F5B301' }} /> <b>{c.rating}</b>
            </p>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => rt.run(rt.routes.chat ? { type: 'navigate', to: rt.routes.chat } : { type: 'toast', message: 'Message envoyé à ' + c.name })} className="w-11 h-11 rounded-full flex items-center justify-center bg-app-surface">
            <Icon name="message-circle" size={20} />
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => rt.run({ type: 'call', phone: c.phone || c.name })} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>
            <Icon name="phone" size={19} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Étapes ─────────────────────────
export function Timeline({ block }) {
  const firstTodo = block.items.findIndex((s) => !s.done);
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="app-card p-4">
        {block.items.map((s, i) => {
          const current = i === firstTodo;
          return (
            <div key={i} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 400, damping: 20 }} className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: s.done ? 'var(--app-primary)' : current ? 'var(--app-primary-soft)' : 'var(--app-surface)', color: s.done ? 'var(--app-on-primary)' : current ? 'var(--app-primary-ink)' : 'var(--app-muted)' }}>
                  {current && <span className="absolute inset-0 rounded-full" style={{ border: '2px solid var(--app-primary)', animation: 'pulse-ring 1.8s ease-out infinite' }} />}
                  <Icon name={s.done ? 'check' : s.icon || 'clock'} size={15} strokeWidth={s.done ? 3 : 2} />
                </motion.span>
                {i < block.items.length - 1 && <span className="w-[2px] flex-1 my-1 rounded-full" style={{ background: s.done ? 'var(--app-primary)' : 'var(--app-border)', minHeight: 22 }} />}
              </div>
              <div className="pb-5 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[14.5px]" style={{ color: s.done || current ? 'var(--app-text)' : 'var(--app-muted)' }}>{s.title}</p>
                  {s.time && <span className="text-[12px] text-app-muted shrink-0">{s.time}</span>}
                </div>
                {s.subtitle && <p className="text-[12.5px] text-app-muted mt-0.5">{s.subtitle}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── Billet ─────────────────────────
export function Ticket({ block }) {
  const rt = useRt();
  const [svg, setSvg] = useState('');
  const code = rt.order?.ref || block.code;
  useEffect(() => {
    let alive = true;
    QRCode.toString(`${rt.spec.meta.name} · ${code}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#0000' } })
      .then((s) => alive && setSvg(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [code, rt.spec.meta.name]);
  const info = [
    ['Date', block.date],
    ['Heure', block.time],
    ['Lieu', block.place],
    ['Place', block.seat],
    ['Titulaire', block.holder || rt.spec.user?.name],
    ['Prix', Number.isFinite(block.price) ? rt.fmt(block.price) : ''],
  ].filter((x) => x[1]);
  return (
    <div className="px-5">
      <motion.div initial={{ rotateX: 12, opacity: 0, y: 20 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }} className="relative overflow-hidden" style={{ borderRadius: 'var(--app-radius-lg)', background: 'var(--app-elevated)', boxShadow: 'var(--app-shadow)' }}>
        <div className="p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-accent) 60%, var(--app-primary)))', color: 'var(--app-on-primary)' }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] opacity-80">{rt.spec.meta.name}</p>
          <h3 className="app-heading text-[22px] font-extrabold leading-tight mt-1"><Rich text={block.title} /></h3>
          {block.subtitle && <p className="text-[13px] opacity-85 mt-1">{block.subtitle}</p>}
        </div>
        <div className="relative h-5">
          <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-app-bg" />
          <span className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-app-bg" />
          <span className="absolute left-5 right-5 top-3 border-t-2 border-dashed border-app-border" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5">
          {info.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <p className="text-[11px] text-app-muted uppercase tracking-wide">{k}</p>
              <p className="font-semibold text-[14px] truncate">{v}</p>
            </div>
          ))}
        </div>
        {block.qr && (
          <div className="flex flex-col items-center py-5">
            <div className="w-[150px] h-[150px] p-3 bg-white rounded-2xl" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="font-mono text-[12.5px] tracking-[0.2em] mt-2.5 text-app-muted">{code}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ───────────────────────── Compte à rebours ─────────────────────────
export function Countdown({ block }) {
  const [left, setLeft] = useState(block.seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : block.seconds)), 1000);
    return () => clearInterval(t);
  }, [block.seconds]);
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const parts = [...(d ? [[d, 'jours']] : []), [h, 'h'], [m, 'min'], [s, 's']];
  return (
    <div className="px-5">
      <div className="app-card p-4 text-center">
        {block.title && <p className="font-bold text-[15px] mb-0.5"><Rich text={block.title} /></p>}
        <p className="text-[12.5px] text-app-muted mb-3">{block.label}</p>
        <div className="flex justify-center gap-2">
          {parts.map(([v, u], i) => (
            <div key={i} className="w-[62px] py-2 rounded-2xl" style={{ background: i === parts.length - 1 ? 'var(--app-primary)' : 'var(--app-surface)', color: i === parts.length - 1 ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
              <motion.p key={v} initial={{ y: -8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className="app-heading text-[24px] font-extrabold leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {String(v).padStart(2, '0')}
              </motion.p>
              <p className="text-[10.5px] font-semibold opacity-70 mt-1">{u}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Contact ─────────────────────────
export function Contact({ block }) {
  const rt = useRt();
  const phone = rt.live?.whatsapp && isDemoPhone(block.phone) ? prettyPhone(rt.live.whatsapp) : block.phone;
  const rows = [
    ['phone', phone],
    ['map-pin', block.address],
    ['clock', block.hours],
    ['mail', block.email],
  ].filter((r) => r[1]);
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="app-card p-4">
        {rows.map(([ic, v], i) => (
          <div key={i} className="flex items-center gap-3 py-2 text-[14px]">
            <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--app-primary-soft)', color: 'var(--app-primary-ink)' }}>
              <Icon name={ic} size={17} />
            </span>
            <span className="min-w-0 truncate">{v}</span>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Btn variant="secondary" icon="phone" onClick={() => rt.run({ type: 'call', phone })}>
            Appeler
          </Btn>
          <Btn icon="message-circle" onClick={() => rt.run({ type: 'whatsapp', phone: block.whatsapp || block.phone })} style={{ background: '#25D366', color: '#fff' }}>
            WhatsApp
          </Btn>
        </div>
      </div>
    </div>
  );
}
