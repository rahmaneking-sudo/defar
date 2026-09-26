// Illustrations animées (SVG + motion) aux couleurs de l'app. Aucun fichier externe.
import { motion } from 'motion/react';

const P = 'var(--app-primary)';
const A = 'var(--app-accent)';
const S = 'var(--app-surface2)';
const T = 'var(--app-text)';
const W = 'var(--app-elevated)';
const loop = (d = 2, delay = 0, ease = 'easeInOut') => ({ duration: d, delay, repeat: Infinity, ease });
const f = (c) => ({ style: { fill: c } });
const st = (c, w = 3) => ({ style: { stroke: c, fill: 'none', strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' } });

function Frame({ children }) {
  return (
    <svg viewBox="0 0 240 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <motion.ellipse cx="120" cy="182" rx="78" ry="9" {...f(S)} animate={{ scaleX: [1, 0.9, 1] }} transition={loop(2.4)} />
      {children}
    </svg>
  );
}

const Delivery = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    {[0, 1, 2].map((i) => (
      <motion.rect key={i} y={168} height="4" width="34" rx="2" {...f(S)} initial={{ x: 240 }} animate={{ x: -40 }} transition={{ duration: 1.4, delay: i * 0.47, repeat: Infinity, ease: 'linear' }} />
    ))}
    <motion.g animate={{ y: [0, -3, 0] }} transition={loop(0.45)}>
      <rect x="62" y="96" width="48" height="40" rx="8" {...f(A)} />
      <rect x="70" y="104" width="32" height="6" rx="3" {...f(W)} opacity="0.7" />
      <path d="M112 132h58l14-22h-24" {...st(T, 5)} />
      <path d="M92 138h86" {...st(P, 12)} />
      <circle cx="170" cy="96" r="12" {...f(T)} />
      <rect x="160" y="80" width="22" height="10" rx="5" {...f(P)} />
    </motion.g>
    {[82, 166].map((cx, i) => (
      <motion.g key={i} animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} style={{ originX: `${cx}px`, originY: '156px' }}>
        <circle cx={cx} cy="156" r="16" {...f(T)} />
        <circle cx={cx} cy="156" r="6" {...f(W)} />
        <rect x={cx - 1.5} y="142" width="3" height="10" {...f(W)} />
      </motion.g>
    ))}
    {[0, 1, 2].map((i) => (
      <motion.path key={i} d={`M${34 - i * 4} ${104 + i * 12}h${18 + i * 6}`} {...st(P, 3)} animate={{ opacity: [0, 1, 0], x: [8, -6, -14] }} transition={loop(0.9, i * 0.2)} />
    ))}
    <motion.g animate={{ y: [0, -6, 0] }} transition={loop(1.6)}>
      <path d="M204 34c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" {...f(P)} />
      <circle cx="204" cy="50" r="6" {...f(W)} />
    </motion.g>
  </Frame>
);

const Payment = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    {[0, 1, 2].map((i) => (
      <motion.circle key={i} cx="120" cy="92" r="40" {...st(P, 2)} initial={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }} />
    ))}
    <motion.g animate={{ y: [0, -5, 0], rotate: [-4, 2, -4] }} transition={loop(3)}>
      <rect x="86" y="30" width="68" height="126" rx="14" {...f(T)} />
      <rect x="91" y="38" width="58" height="110" rx="9" {...f(W)} />
      <circle cx="120" cy="84" r="22" {...f(P)} />
      <motion.path d="M109 84l8 8 15-16" {...st('var(--app-on-primary)', 4.5)} initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }} transition={loop(2.4)} />
      <rect x="100" y="118" width="40" height="7" rx="3.5" {...f(S)} />
      <rect x="106" y="130" width="28" height="7" rx="3.5" {...f(A)} />
    </motion.g>
    {[
      [58, 150, 0],
      [182, 140, 0.6],
      [168, 60, 1.2],
    ].map(([x, y, dl], i) => (
      <motion.g key={i} animate={{ y: [0, -26, 0], opacity: [0, 1, 0] }} transition={loop(2.2, dl)}>
        <circle cx={x} cy={y} r="11" {...f(A)} />
        <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" style={{ fill: 'var(--app-on-accent)' }}>
          F
        </text>
      </motion.g>
    ))}
  </Frame>
);

const Booking = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    <motion.g animate={{ y: [0, -4, 0] }} transition={loop(3)}>
      <rect x="54" y="42" width="132" height="116" rx="16" {...f(W)} style={{ fill: 'var(--app-elevated)', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.12))' }} />
      <rect x="54" y="42" width="132" height="30" rx="16" {...f(P)} />
      <rect x="54" y="60" width="132" height="12" {...f(P)} />
      {[82, 158].map((x) => (
        <rect key={x} x={x - 4} y="32" width="8" height="20" rx="4" {...f(T)} />
      ))}
      {[...Array(12)].map((_, i) => {
        const x = 70 + (i % 4) * 30;
        const y = 86 + Math.floor(i / 4) * 22;
        const hit = i === 6;
        return hit ? (
          <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ duration: 0.6, delay: 0.5, repeat: Infinity, repeatDelay: 2.4 }} style={{ originX: `${x + 9}px`, originY: `${y + 7}px` }}>
            <circle cx={x + 9} cy={y + 7} r="11" {...f(A)} />
            <path d={`M${x + 4} ${y + 7}l4 4 7-8`} {...st('var(--app-on-accent)', 3)} />
          </motion.g>
        ) : (
          <rect key={i} x={x} y={y} width="18" height="12" rx="4" {...f(S)} />
        );
      })}
    </motion.g>
    <motion.g animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
      <circle cx="194" cy="150" r="20" {...f(T)} />
      <path d="M194 150v-12M194 150l8 5" {...st(W, 3)} />
    </motion.g>
  </Frame>
);

const Shopping = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    {[
      [96, 60, A, 0],
      [132, 50, P, 0.3],
      [118, 40, T, 0.6],
    ].map(([x, y, c, dl], i) => (
      <motion.rect key={i} x={x} y={y} width="22" height="22" rx={i === 2 ? 11 : 6} {...f(c)} animate={{ y: [18, -8, 18], rotate: [0, i % 2 ? 20 : -20, 0] }} transition={loop(1.8, dl)} />
    ))}
    <motion.g animate={{ scale: [1, 1.03, 1] }} transition={loop(1.8)}>
      <path d="M70 86h100l-8 76a10 10 0 0 1-10 9H88a10 10 0 0 1-10-9z" {...f(P)} />
      <path d="M96 96V80a24 24 0 0 1 48 0v16" {...st(T, 5)} />
      <circle cx="96" cy="100" r="5" {...f(W)} />
      <circle cx="144" cy="100" r="5" {...f(W)} />
    </motion.g>
  </Frame>
);

const Success = () => (
  <Frame>
    {[0, 1].map((i) => (
      <motion.circle key={i} cx="120" cy="96" r="60" {...st(P, 2)} initial={{ scale: 0.7, opacity: 0.6 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 2, delay: i, repeat: Infinity, ease: 'easeOut' }} />
    ))}
    <motion.circle cx="120" cy="96" r="56" {...f(P)} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} />
    <motion.path d="M96 97l17 17 32-34" {...st('var(--app-on-primary)', 9)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, delay: 0.35, ease: 'easeOut' }} />
    {[
      [44, 44],
      [196, 52],
      [52, 150],
      [192, 148],
      [120, 18],
    ].map(([x, y], i) => (
      <motion.path key={i} d={`M${x} ${y - 8}v16M${x - 8} ${y}h16`} {...st(i % 2 ? A : P, 3)} animate={{ scale: [0, 1, 0], rotate: [0, 90] }} transition={loop(1.6, 0.4 + i * 0.25)} style={{ originX: `${x}px`, originY: `${y}px` }} />
    ))}
  </Frame>
);

const Health = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    <motion.path d="M120 158s-54-32-54-72c0-18 13-32 30-32 11 0 19 6 24 15 5-9 13-15 24-15 17 0 30 14 30 32 0 40-54 72-54 72z" {...f(P)} animate={{ scale: [1, 1.08, 1, 1.05, 1] }} transition={loop(1.3)} />
    <motion.path d="M34 104h46l10-22 16 44 12-30 8 8h80" {...st('var(--app-on-primary)', 4)} initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1], opacity: [1, 1, 0] }} transition={loop(1.8, 0, 'linear')} />
    <motion.g animate={{ y: [0, -6, 0] }} transition={loop(2.2)}>
      <rect x="182" y="30" width="30" height="30" rx="8" {...f(W)} style={{ fill: 'var(--app-elevated)', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.12))' }} />
      <path d="M197 37v16M189 45h16" {...st(A, 4)} />
    </motion.g>
  </Frame>
);

const Learning = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    <path d="M40 150c30-12 56-12 80 4 24-16 50-16 80-4V70c-30-12-56-12-80 4-24-16-50-16-80-4z" {...f(W)} style={{ fill: 'var(--app-elevated)', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.12))' }} />
    <path d="M120 74v80" {...st(S, 3)} />
    {[0, 1, 2].map((i) => (
      <rect key={i} x="54" y={88 + i * 14} width={48 - i * 8} height="6" rx="3" {...f(S)} />
    ))}
    <motion.path d="M120 74c24-16 50-16 80-4v80c-30-12-56-12-80 4z" {...f(A)} opacity="0.9" animate={{ scaleX: [1, -1, 1] }} transition={loop(3.2)} style={{ originX: 0 }} />
    <motion.g animate={{ y: [0, -8, 0] }} transition={loop(2)}>
      <circle cx="120" cy="36" r="16" {...f(P)} />
      <rect x="114" y="52" width="12" height="8" rx="2" {...f(T)} />
      <motion.circle cx="120" cy="36" r="24" {...st(P, 2)} animate={{ opacity: [0, 0.8, 0], scale: [0.7, 1.3] }} transition={loop(1.6)} />
    </motion.g>
  </Frame>
);

const Growth = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    {[0, 1, 2, 3].map((i) => (
      <motion.rect key={i} x={62 + i * 32} width="22" rx="6" {...f(i === 3 ? P : A)} initial={{ height: 0, y: 160 }} animate={{ height: [0, 30 + i * 26], y: [160, 130 - i * 26] }} transition={{ duration: 0.9, delay: 0.15 * i, repeat: Infinity, repeatDelay: 2.2, ease: 'easeOut' }} />
    ))}
    <motion.path d="M56 124l38-24 30 12 52-50" {...st(T, 4)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.9, ease: 'easeOut' }} />
    <motion.path d="M160 60h18v18" {...st(T, 4)} animate={{ opacity: [0, 1, 1, 0] }} transition={loop(3.1)} />
    <rect x="50" y="160" width="140" height="4" rx="2" {...f(S)} />
  </Frame>
);

const Chat = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    <motion.g initial={{ scale: 0 }} animate={{ scale: [0, 1, 1, 1, 0] }} transition={loop(4, 0)} style={{ originX: 0, originY: 1 }}>
      <rect x="44" y="50" width="104" height="44" rx="18" {...f(W)} style={{ fill: 'var(--app-elevated)', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))' }} />
      <rect x="58" y="64" width="62" height="6" rx="3" {...f(S)} />
      <rect x="58" y="76" width="40" height="6" rx="3" {...f(S)} />
    </motion.g>
    <motion.g initial={{ scale: 0 }} animate={{ scale: [0, 0, 1, 1, 0] }} transition={loop(4, 0)} style={{ originX: 1, originY: 1 }}>
      <rect x="92" y="104" width="104" height="44" rx="18" {...f(P)} />
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={128 + i * 16} cy="126" r="5" {...f('var(--app-on-primary)')} animate={{ y: [0, -5, 0] }} transition={loop(0.8, i * 0.15)} />
      ))}
    </motion.g>
  </Frame>
);

const Location = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    <path d="M52 70l44-18 48 18 44-18v96l-44 18-48-18-44 18z" {...f(W)} style={{ fill: 'var(--app-elevated)', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.1))' }} />
    <path d="M96 52v96M144 70v96" {...st(S, 2)} />
    <motion.path d="M66 130c20-10 30 6 50-6s24-30 50-24" {...st(A, 3)} strokeDasharray="6 6" style={{ stroke: A, fill: 'none', strokeWidth: 3, strokeDasharray: '6 6', animation: 'dash 1s linear infinite' }} />
    <motion.g initial={{ y: -40 }} animate={{ y: [-40, 0, 0, -40] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.25, 0.85, 1], ease: 'easeOut' }}>
      <path d="M166 58c-11 0-20 9-20 20 0 15 20 32 20 32s20-17 20-32c0-11-9-20-20-20z" {...f(P)} />
      <circle cx="166" cy="78" r="7" {...f(W)} />
    </motion.g>
    <motion.ellipse cx="166" cy="112" rx="14" ry="5" {...st(P, 2)} animate={{ scale: [0.5, 1.6], opacity: [0.8, 0] }} transition={loop(1.5)} />
  </Frame>
);

const Gift = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    <rect x="72" y="92" width="96" height="70" rx="10" {...f(P)} />
    <rect x="112" y="92" width="16" height="70" {...f(A)} />
    <motion.g animate={{ y: [0, -18, 0], rotate: [0, -8, 0] }} transition={loop(1.8)}>
      <rect x="64" y="72" width="112" height="24" rx="8" {...f(P)} style={{ fill: 'color-mix(in srgb, var(--app-primary) 80%, #000)' }} />
      <rect x="112" y="72" width="16" height="24" {...f(A)} />
      <path d="M120 72c-8-18-30-18-28-4 2 10 28 4 28 4zm0 0c8-18 30-18 28-4-2 10-28 4-28 4z" {...f(A)} />
    </motion.g>
    {[...Array(6)].map((_, i) => (
      <motion.circle key={i} cx={100 + i * 8} cy="80" r="4" {...f(i % 2 ? A : T)} animate={{ y: [0, -50 - i * 6], x: [(i - 3) * 4, (i - 3) * 16], opacity: [0, 1, 0] }} transition={loop(1.8, 0.1 * i, 'easeOut')} />
    ))}
  </Frame>
);

const Security = () => (
  <Frame>
    <circle cx="120" cy="96" r="78" {...f('var(--app-primary-soft)')} />
    <motion.path d="M120 28l56 20v42c0 36-24 60-56 72-32-12-56-36-56-72V48z" {...f(P)} animate={{ scale: [1, 1.03, 1] }} transition={loop(2.4)} />
    <motion.path d="M98 96l15 15 29-30" {...st('var(--app-on-primary)', 8)} initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1] }} transition={loop(2.4)} />
    <motion.rect x="64" width="112" height="3" rx="1.5" {...f(A)} animate={{ y: [40, 150, 40], opacity: [0.2, 0.9, 0.2] }} transition={loop(3, 0, 'linear')} />
  </Frame>
);

const Empty = () => (
  <Frame>
    <motion.circle cx="120" cy="96" r="70" {...st(S, 3)} strokeDasharray="10 10" style={{ stroke: S, fill: 'none', strokeWidth: 3, strokeDasharray: '10 10' }} animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} />
    <motion.g animate={{ y: [0, -10, 0] }} transition={loop(2.6)}>
      <path d="M80 80l40-20 40 20v44l-40 20-40-20z" {...f('var(--app-primary-soft)')} style={{ fill: 'color-mix(in srgb, var(--app-primary) 25%, var(--app-bg))' }} />
      <path d="M80 80l40 20 40-20M120 100v44" {...st(P, 3)} />
      <path d="M80 80l40-20 40 20v44l-40 20-40-20z" {...st(P, 3)} />
    </motion.g>
  </Frame>
);

export const ILLUSTRATIONS = { delivery: Delivery, payment: Payment, booking: Booking, shopping: Shopping, success: Success, health: Health, learning: Learning, growth: Growth, chat: Chat, location: Location, gift: Gift, security: Security, empty: Empty };

export function Illustration({ name = 'empty', size = 220 }) {
  const C = ILLUSTRATIONS[name] || Empty;
  return (
    <div className="inline-flex" style={{ width: size, height: (size * 200) / 240 }}>
      <C />
    </div>
  );
}

// Illustration la plus pertinente selon la catégorie
export const CATEGORY_ILLU = { delivery: 'delivery', restaurant: 'delivery', beauty: 'booking', fashion: 'shopping', shop: 'shopping', grocery: 'shopping', health: 'health', education: 'learning', fitness: 'growth', transport: 'location', realestate: 'location', events: 'gift', finance: 'growth', agriculture: 'growth', services: 'booking', travel: 'location', social: 'chat', generic: 'success' };
