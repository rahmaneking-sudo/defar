// Briques communes aux pages de paiement (checkout, simulateur, retour, tableau de bord).
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Logo, I } from '../../ui/kit.jsx';
import { Link } from '../../router.jsx';
import { BRAND } from '../../config.js';
import { PAY_METHODS } from '../../../shared/constants.js';
import { formatMoney } from '../../../shared/utils.js';

export const PAY_KEY = 'defar.pay.last';
export const METHOD_ORDER = ['wave', 'orange_money', 'free_money', 'card'];
export const fcfa = (n) => formatMoney(n, 'FCFA');
export const amountDigits = (n) => Math.abs(Math.round(Number(n) || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');

// Lecture tolérante de l'URL : certains opérateurs ajoutent « ?token=… » à une
// adresse qui contient déjà un « ? » (ex. /pay/retour?cancel=1?token=abc).
export function readQuery(search = typeof location !== 'undefined' ? location.search : '') {
  const raw = String(search).replace(/^\?/, '').replace(/\?/g, '&');
  return new URLSearchParams(raw);
}
export function useQuery() {
  return useMemo(() => readQuery(), []);
}

export function readLast() {
  try {
    const v = JSON.parse(sessionStorage.getItem(PAY_KEY) || 'null');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
export function saveLast(v) {
  try {
    sessionStorage.setItem(PAY_KEY, JSON.stringify(v));
  } catch {
    /* navigation privée */
  }
}

export const formatPhone = (digits) =>
  String(digits || '')
    .replace(/\D/g, '')
    .slice(0, 9)
    .replace(/^(\d{2})(\d{0,3})(\d{0,2})(\d{0,2}).*/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' '));
export const phoneDigits = (s) => String(s || '').replace(/\D/g, '').replace(/^(00)?221(?=\d{9}$)/, '').slice(0, 9);
export const phoneValid = (s) => /^7\d{8}$/.test(phoneDigits(s));

export function methodInfo(method) {
  return PAY_METHODS[method] || PAY_METHODS.card;
}

// Pastille d'un moyen de paiement (couleur de l'opérateur, sans reproduire de logo)
export function PayMark({ method, size = 44, className = '' }) {
  const m = methodInfo(method);
  return (
    <span className={`inline-flex items-center justify-center font-extrabold shrink-0 select-none ${className}`} style={{ width: size, height: size, borderRadius: size * 0.3, background: m.color, color: m.ink, fontSize: size * 0.34, letterSpacing: '-0.03em', boxShadow: `0 8px 20px -10px ${m.color}` }}>
      {method === 'card' ? <I n="credit-card" s={Math.round(size * 0.46)} /> : m.short}
    </span>
  );
}

// Fond animé aux couleurs de la marque
export function Aurora({ colors = ['#ff6a3d', '#d8407a', '#f2b544'], opacity = 0.5 }) {
  const blobs = [
    { c: colors[0], s: 58, x: -12, y: -18, d: 18 },
    { c: colors[1], s: 52, x: 55, y: 10, d: 22 },
    { c: colors[2] || colors[0], s: 40, x: 15, y: 60, d: 26 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {blobs.map((b, i) => (
        <div key={i} className="absolute rounded-full" style={{ width: `${b.s}vmax`, height: `${b.s}vmax`, left: `${b.x}%`, top: `${b.y}%`, background: `radial-gradient(circle, ${b.c} 0%, color-mix(in srgb, ${b.c} 45%, transparent) 30%, transparent 68%)`, willChange: 'transform', opacity, animation: `blob ${b.d}s ease-in-out ${i * -4}s infinite` }} />
      ))}
      <div className="grain absolute inset-0" />
    </div>
  );
}

export function PayShell({ children, colors, footer = true, badge }) {
  return (
    <div className="relative min-h-full bg-ink text-sand overflow-x-hidden flex flex-col">
      <Aurora colors={colors} opacity={0.32} />
      <header className="relative z-10 max-w-5xl w-full mx-auto h-16 px-5 flex items-center justify-between no-print">
        <Link to="/" aria-label={BRAND.name}>
          <Logo size={28} />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-sand/70">
          <I n="lock" s={14} /> {badge || 'Paiement sécurisé'}
        </span>
      </header>
      <main className="relative z-10 flex-1 flex flex-col">{children}</main>
      {footer && (
        <footer className="relative z-10 py-6 px-5 text-center text-[12px] text-dune no-print">
          Wave · Orange Money · Mixx by Yas · Carte bancaire — propulsé par {BRAND.name}
        </footer>
      )}
    </div>
  );
}

export function QR({ text, size = 180, className = '', dark = '#0b0a10', light = '#ffffff' }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(String(text || ''), { margin: 1, width: size * 2, errorCorrectionLevel: 'M', color: { dark, light } })
      .then((u) => alive && setSrc(u))
      .catch(() => alive && setSrc(''));
    return () => {
      alive = false;
    };
  }, [text, size, dark, light]);
  return src ? <img src={src} alt="QR code" width={size} height={size} className={className} style={{ width: size, height: size, imageRendering: 'pixelated' }} /> : <div className={className} style={{ width: size, height: size, background: light, borderRadius: 12 }} />;
}

export async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function StatusPill({ tone = 'neutral', icon, children }) {
  const tones = {
    neutral: 'bg-white/[0.06] text-sand/80 border-white/10',
    ok: 'bg-baobab/12 text-baobab border-baobab/25',
    warn: 'bg-gold/12 text-gold border-gold/25',
    bad: 'bg-ember/12 text-[#ff8a9a] border-ember/25',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[12px] font-medium ${tones[tone]}`}>
      {icon && <I n={icon} s={13} />}
      {children}
    </span>
  );
}
