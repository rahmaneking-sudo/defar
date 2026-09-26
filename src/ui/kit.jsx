// Kit d'interface de la plateforme Défar (studio, landing, paiements).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, ExternalLink, CircleX, LoaderCircle, EyeOff, Printer, Webhook, TriangleAlert, RotateCcw, KeyRound, ReceiptText, Maximize2 } from 'lucide-react';
import { ICON_MAP } from '../engine/icon-map.js';
import { BRAND } from '../config.js';

// Icônes réservées à l'interface de la plateforme (en plus de celles des maquettes)
const UI_ICONS = { link: Link2, 'external-link': ExternalLink, 'circle-x': CircleX, 'loader-circle': LoaderCircle, 'eye-off': EyeOff, printer: Printer, webhook: Webhook, 'triangle-alert': TriangleAlert, 'rotate-ccw': RotateCcw, 'key-round': KeyRound, 'receipt-text': ReceiptText, 'maximize-2': Maximize2 };

export function I({ n, s = 18, className = '', ...rest }) {
  const C = ICON_MAP[n] || UI_ICONS[n] || ICON_MAP.sparkles;
  return <C size={s} className={className} strokeWidth={1.9} {...rest} />;
}

export function Logo({ size = 30, word = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="lg-d" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff8a3d" />
            <stop offset="0.55" stopColor="#ff4d5e" />
            <stop offset="1" stopColor="#c8367c" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="#17151f" />
        <path d="M17 13h15c11.6 0 19 7.8 19 19s-7.4 19-19 19H17z" fill="url(#lg-d)" />
        <rect x="25.5" y="23" width="8" height="18" rx="3.4" fill="#17151f" />
        <circle cx="41.5" cy="32" r="3.6" fill="#f4ecdf" />
      </svg>
      {word && <span className="font-display italic text-[25px] leading-none tracking-tight text-sand">{BRAND.name}</span>}
    </span>
  );
}

export function Button({ children, variant = 'primary', size = 'md', icon, iconRight, className = '', loading = false, ...rest }) {
  const sizes = { sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg', md: 'h-10 px-4 text-[14px] gap-2 rounded-xl', lg: 'h-12 px-6 text-[15px] gap-2 rounded-2xl' };
  const variants = {
    primary: 'bg-sand text-ink hover:bg-white',
    accent: 'text-white bg-[linear-gradient(135deg,#ff7a3d,#ff4d5e_55%,#c8367c)] hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(255,77,94,0.8)]',
    ghost: 'text-sand/80 hover:text-sand hover:bg-white/[0.06]',
    outline: 'text-sand border border-white/12 hover:border-white/25 hover:bg-white/[0.04]',
    subtle: 'bg-white/[0.06] text-sand hover:bg-white/[0.1]',
    danger: 'bg-ember/15 text-[#ff8a9a] hover:bg-ember/25',
  };
  return (
    <button type="button" className={`inline-flex items-center justify-center font-medium transition-all disabled:opacity-40 disabled:pointer-events-none select-none ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon && <I n={icon} s={size === 'sm' ? 15 : 17} />}
      {children}
      {iconRight && <I n={iconRight} s={size === 'sm' ? 15 : 17} />}
    </button>
  );
}

export function IconBtn({ icon, title, onClick, active, className = '', disabled, size = 34 }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${active ? 'bg-white/[0.12] text-sand' : 'text-sand/65 hover:text-sand hover:bg-white/[0.07]'} ${className}`} style={{ width: size, height: size }}>
      <I n={icon} s={17} />
    </button>
  );
}

export const inputCls = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 text-[13.5px] text-sand placeholder:text-dune/60 outline-none focus:border-sunset/60 focus:bg-white/[0.06] transition-colors';

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-[11.5px] font-medium text-dune mb-1.5 tracking-wide">{label}</span>}
      {children}
      {hint && <span className="block text-[11px] text-dune/70 mt-1">{hint}</span>}
    </label>
  );
}

export function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div className={`flex p-0.5 rounded-xl bg-white/[0.05] border border-white/[0.06] ${className}`}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        const on = v === value;
        return (
          <button key={v} type="button" onClick={() => onChange(v)} className={`relative flex-1 h-8 px-2.5 text-[12.5px] font-medium rounded-[10px] transition-colors ${on ? 'text-ink' : 'text-sand/70 hover:text-sand'}`}>
            {on && <motion.span layoutId={`seg-${options.map((x) => (typeof x === 'string' ? x : x.value)).join('')}`} className="absolute inset-0 rounded-[10px] bg-sand" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon && <I n={o.icon} s={14} />}
              {l}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ on, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-sunset' : 'bg-white/15'}`} aria-pressed={on}>
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className="absolute top-1 w-4 h-4 rounded-full bg-white" style={{ left: on ? 20 : 4 }} />
    </button>
  );
}

export function Modal({ open, onClose, children, width = 560, title, className = '' }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div className={`relative w-full max-h-[88vh] overflow-hidden flex flex-col rounded-3xl bg-ink-2 border border-white/10 shadow-2xl ${className}`} style={{ maxWidth: width }} initial={{ y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.98 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
            {title && (
              <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.07] shrink-0">
                <h3 className="font-semibold text-[15px]">{title}</h3>
                <IconBtn icon="x" title="Fermer" onClick={onClose} />
              </div>
            )}
            <div className="overflow-y-auto scroll-thin">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ───────── Toasts de la plateforme ─────────
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2 pointer-events-none">
          <AnimatePresence>
            {items.map((t) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className={`flex items-center gap-2 px-4 h-11 rounded-full text-[13.5px] font-medium shadow-xl border ${t.type === 'error' ? 'bg-[#2a1116] border-ember/40 text-[#ffb3bf]' : 'bg-ink-3 border-white/10 text-sand'}`}>
                <I n={t.type === 'error' ? 'circle-alert' : t.type === 'info' ? 'info' : 'circle-check'} s={16} className={t.type === 'error' ? 'text-ember' : 'text-baobab'} />
                {t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export function useClickOutside(ref, fn) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && fn();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, fn]);
}

export function Menu({ button, children, align = 'right', width = 260 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      {button(() => setOpen((o) => !o), open)}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }} className={`absolute top-full mt-2 z-[120] rounded-2xl bg-ink-3 border border-white/10 shadow-2xl p-1.5 ${align === 'right' ? 'right-0' : 'left-0'}`} style={{ width }} onClick={() => setOpen(false)}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({ icon, children, sub, onClick, danger }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.06] ${danger ? 'text-[#ff9aa8]' : 'text-sand'}`}>
      {icon && <I n={icon} s={17} className="mt-0.5 shrink-0 opacity-80" />}
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium">{children}</span>
        {sub && <span className="block text-[11.5px] text-dune mt-0.5">{sub}</span>}
      </span>
    </button>
  );
}

// Motif géométrique original (inspiré des tissages ouest-africains), en fond discret
export function Pattern({ className = '', opacity = 0.05 }) {
  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} style={{ opacity }} aria-hidden="true">
      <defs>
        <pattern id="defar-pattern" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M0 28 L14 14 L28 28 L14 42 Z M28 28 L42 14 L56 28 L42 42 Z" fill="none" stroke="#f4ecdf" strokeWidth="1" />
          <circle cx="28" cy="0" r="2" fill="#f4ecdf" />
          <circle cx="28" cy="56" r="2" fill="#f4ecdf" />
          <path d="M22 6h12M22 50h12" stroke="#f4ecdf" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#defar-pattern)" />
    </svg>
  );
}
