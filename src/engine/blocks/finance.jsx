import { useId, useMemo, useState } from 'react';
import { groupThousands } from '../../../shared/utils.js';
import { motion } from 'motion/react';
import { useRt } from '../context.js';
import { CountUp, Icon, MotionBg, SectionHead, Rich } from '../ui.jsx';

export function Balance({ block }) {
  const rt = useRt();
  const [hidden, setHidden] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const plain = block.style === 'plain';
  return (
    <div className="px-5">
      {plain ? (
        <div className="py-2">
          <p className="text-[13.5px] text-app-muted">{block.label}</p>
          <p className="app-heading text-[38px] font-extrabold leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {hidden ? '••••••' : <CountUp value={block.amount} />} <span className="text-[16px] text-app-muted font-bold">{rt.currency}</span>
          </p>
        </div>
      ) : (
        <motion.div
          className="relative overflow-hidden p-5"
          style={{ borderRadius: 'var(--app-radius-lg)', minHeight: 196, color: '#fff', transformPerspective: 900, rotateX: tilt.y, rotateY: tilt.x, boxShadow: '0 24px 40px -22px var(--app-primary)' }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 10, y: -((e.clientY - r.top) / r.height - 0.5) * 10 });
          }}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <MotionBg />
          <div className="absolute inset-0 shimmer-sweep opacity-70" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[13px] font-semibold opacity-85">{block.label}</p>
              <p className="app-heading text-[34px] font-extrabold leading-tight mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {hidden ? '•••••••' : <CountUp value={block.amount} />} <span className="text-[15px] font-bold opacity-80">{rt.currency}</span>
              </p>
              {block.trend && (
                <span className="inline-flex items-center gap-1 h-6 px-2 mt-2 rounded-full text-[11.5px] font-bold bg-white/20">
                  <Icon name="trending-up" size={13} /> {block.trend}
                </span>
              )}
            </div>
            <button type="button" onClick={() => setHidden((h) => !h)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center" aria-label="Masquer le solde">
              <Icon name={hidden ? 'eye' : 'lock'} size={17} />
            </button>
          </div>
          <div className="relative flex items-end justify-between mt-6">
            <div>
              <div className="w-10 h-7 rounded-md mb-2" style={{ background: 'linear-gradient(135deg, #f7e7a1, #c9a94e)' }} />
              <p className="font-mono text-[14px] tracking-[0.18em] opacity-90">{block.number || '•••• •••• 4821'}</p>
            </div>
            <p className="text-[12.5px] font-semibold opacity-85">{block.holder || rt.spec.user?.name}</p>
          </div>
        </motion.div>
      )}
      {block.actions?.length > 0 && (
        <div className="grid gap-2 mt-4" style={{ gridTemplateColumns: `repeat(${block.actions.length}, 1fr)` }}>
          {block.actions.map((a, i) => (
            <motion.button key={i} type="button" whileTap={{ scale: 0.9 }} onClick={() => rt.run(a.action || { type: 'toast', message: a.label })} className="flex flex-col items-center gap-1.5">
              <span className="w-[54px] h-[54px] rounded-full flex items-center justify-center" style={{ background: i === 0 ? 'var(--app-primary)' : 'var(--app-surface)', color: i === 0 ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
                <Icon name={a.icon} size={21} />
              </span>
              <span className="text-[12px] font-semibold">{a.label}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Stats({ block }) {
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="grid grid-cols-2 gap-3">
        {block.items.map((s, i) => {
          const up = !String(s.trend).trim().startsWith('-');
          return (
            <motion.div key={i} className="app-card p-4" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <div className="flex items-center justify-between">
                {s.icon ? (
                  <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: i % 2 ? 'var(--app-accent-soft)' : 'var(--app-primary-soft)', color: i % 2 ? 'var(--app-accent)' : 'var(--app-primary-ink)' }}>
                    <Icon name={s.icon} size={17} />
                  </span>
                ) : (
                  <span />
                )}
                {s.trend && (
                  <span className="text-[11px] font-bold px-1.5 h-5 rounded-md flex items-center" style={{ color: up ? 'var(--app-success)' : 'var(--app-danger)', background: up ? 'color-mix(in srgb, var(--app-success) 12%, transparent)' : 'color-mix(in srgb, var(--app-danger) 12%, transparent)' }}>
                    {s.trend}
                  </span>
                )}
              </div>
              <p className="app-heading text-[24px] font-extrabold mt-3 leading-none">
                {s.prefix}
                {typeof s.value === 'number' ? <CountUp value={s.value} /> : s.value}
                <span className="text-[14px] font-bold text-app-muted ml-0.5">{s.suffix}</span>
              </p>
              <p className="text-[12.5px] text-app-muted mt-1.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function Chart({ block }) {
  const id = useId().replace(/:/g, '');
  const W = 340;
  const H = 150;
  const data = block.series;
  const max = Math.max(...data) * 1.12 || 1;
  const min = Math.min(0, Math.min(...data));
  const pts = useMemo(() => data.map((v, i) => [(i / Math.max(1, data.length - 1)) * W, H - ((v - min) / (max - min)) * H]), [data, max, min]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const smooth = pts.reduce((d, p, i) => {
    if (!i) return `M${p[0]} ${p[1]}`;
    const prev = pts[i - 1];
    const cx = (prev[0] + p[0]) / 2;
    return d + ` C${cx} ${prev[1]}, ${cx} ${p[1]}, ${p[0]} ${p[1]}`;
  }, '');
  const [hover, setHover] = useState(null);
  const up = !String(block.change).trim().startsWith('-');
  return (
    <div className="px-5">
      <div className="app-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            {block.title && <p className="text-[13px] text-app-muted">{block.title}</p>}
            {block.value && <p className="app-heading text-[26px] font-extrabold leading-tight">{hover !== null ? data[hover].toLocaleString('fr-FR') : block.value}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            {block.change && (
              <span className="text-[12px] font-bold px-2 h-6 rounded-full flex items-center gap-1" style={{ color: up ? 'var(--app-success)' : 'var(--app-danger)', background: up ? 'color-mix(in srgb, var(--app-success) 12%, transparent)' : 'color-mix(in srgb, var(--app-danger) 12%, transparent)' }}>
                <Icon name={up ? 'trending-up' : 'trending-down'} size={13} /> {block.change}
              </span>
            )}
            {block.period && <span className="text-[11.5px] text-app-muted">{block.period}</span>}
          </div>
        </div>
        <svg
          viewBox={`0 -8 ${W} ${H + 16}`}
          width="100%"
          height={H + 16}
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--app-primary)', stopOpacity: 0.35 }} />
              <stop offset="100%" style={{ stopColor: 'var(--app-primary)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} style={{ stroke: 'var(--app-border)', strokeDasharray: '3 5' }} />
          ))}
          {block.chartType === 'bar' ? (
            data.map((v, i) => {
              const bw = (W / data.length) * 0.56;
              const x = (i + 0.22) * (W / data.length);
              const h = ((v - min) / (max - min)) * H;
              return <motion.rect key={i} x={x} width={bw} rx={Math.min(8, bw / 2)} style={{ fill: i === (hover ?? data.length - 1) ? 'var(--app-primary)' : 'color-mix(in srgb, var(--app-primary) 30%, transparent)' }} initial={{ y: H, height: 0 }} whileInView={{ y: H - h, height: h }} viewport={{ once: true }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 22 }} />;
            })
          ) : (
            <>
              {block.chartType === 'area' && <motion.path d={`${smooth} L${W} ${H} L0 ${H} Z`} style={{ fill: `url(#g${id})` }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.6 }} />}
              <motion.path d={block.chartType === 'line' ? line : smooth} style={{ fill: 'none', stroke: 'var(--app-primary)', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.3, ease: 'easeInOut' }} vectorEffect="non-scaling-stroke" />
              {hover !== null && pts[hover] && (
                <g>
                  <line x1={pts[hover][0]} x2={pts[hover][0]} y1="0" y2={H} style={{ stroke: 'var(--app-muted)', strokeDasharray: '3 3' }} />
                  <circle cx={pts[hover][0]} cy={pts[hover][1]} r="6" style={{ fill: 'var(--app-bg)', stroke: 'var(--app-primary)', strokeWidth: 3 }} />
                </g>
              )}
              {hover === null && <motion.circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" style={{ fill: 'var(--app-primary)' }} initial={{ scale: 0 }} whileInView={{ scale: [0, 1.4, 1] }} viewport={{ once: true }} transition={{ delay: 1.2 }} />}
            </>
          )}
        </svg>
        {block.labels?.length > 0 && (
          <div className="flex justify-between mt-1.5 text-[10.5px] text-app-muted">
            {block.labels.map((l, i) => (
              <span key={i} style={{ fontWeight: i === hover ? 700 : 500 }}>{l}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Progress({ block }) {
  const pct = Math.max(0, Math.min(1, block.value / block.max));
  const fmt = (n) => groupThousands(n);
  if (block.style === 'bar') {
    return (
      <div className="px-5">
        <div className="app-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[15px]"><Rich text={block.title} /></p>
            <p className="font-bold text-[14px]" style={{ color: 'var(--app-primary-ink)' }}>{Math.round(pct * 100)} %</p>
          </div>
          <div className="h-3 rounded-full bg-app-surface overflow-hidden mt-3">
            <motion.div className="h-full rounded-full relative overflow-hidden" style={{ background: 'linear-gradient(90deg, var(--app-primary), var(--app-accent))' }} initial={{ width: 0 }} whileInView={{ width: `${pct * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <span className="absolute inset-0 shimmer-sweep" />
            </motion.div>
          </div>
          <p className="text-[12.5px] text-app-muted mt-2">
            {fmt(block.value)} / {fmt(block.max)} {block.unit} {block.label && `· ${block.label}`}
          </p>
        </div>
      </div>
    );
  }
  const R = 62;
  const C = 2 * Math.PI * R;
  return (
    <div className="px-5">
      <div className="app-card p-5 flex items-center gap-5">
        <div className="relative w-[150px] h-[150px] shrink-0">
          <svg viewBox="0 0 150 150" width="150" height="150">
            <circle cx="75" cy="75" r={R} style={{ fill: 'none', stroke: 'var(--app-surface2)', strokeWidth: 13 }} />
            <motion.circle cx="75" cy="75" r={R} transform="rotate(-90 75 75)" style={{ fill: 'none', stroke: 'var(--app-primary)', strokeWidth: 13, strokeLinecap: 'round', strokeDasharray: C }} initial={{ strokeDashoffset: C }} whileInView={{ strokeDashoffset: C * (1 - pct) }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="app-heading text-[30px] font-extrabold leading-none">
              <CountUp value={pct * 100} />%
            </p>
            {block.unit && <p className="text-[11px] text-app-muted mt-1">{block.unit}</p>}
          </div>
        </div>
        <div className="min-w-0">
          {block.title && <p className="font-bold text-[16px] leading-tight"><Rich text={block.title} /></p>}
          <p className="text-[13px] text-app-muted mt-1.5 leading-snug">
            {fmt(block.value)} sur {fmt(block.max)} {block.unit}
          </p>
          {block.label && <p className="text-[12.5px] mt-2 font-semibold" style={{ color: 'var(--app-primary-ink)' }}>{block.label}</p>}
        </div>
      </div>
    </div>
  );
}
