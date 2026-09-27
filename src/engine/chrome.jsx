// Habillage du téléphone : cadre, barre d'état, barre d'onglets, indicateur.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './ui.jsx';

export const DEVICES = {
  iphone: { w: 393, h: 852, bezel: 12, radius: 58, screenRadius: 47, safeTop: 54, safeBottom: 30 },
  android: { w: 392, h: 846, bezel: 10, radius: 44, screenRadius: 36, safeTop: 38, safeBottom: 18 },
};

export function DeviceFrame({ device = 'iphone', children, shadow = true }) {
  const d = DEVICES[device] || DEVICES.iphone;
  const W = d.w + d.bezel * 2;
  const H = d.h + d.bezel * 2;
  const isIphone = device !== 'android';
  return (
    <div className="relative" style={{ width: W, height: H }}>
      {/* boutons latéraux */}
      {isIphone ? (
        <>
          <Side left top={150} h={32} />
          <Side left top={210} h={62} />
          <Side left top={284} h={62} />
          <Side top={236} h={98} />
        </>
      ) : (
        <>
          <Side top={180} h={70} />
          <Side top={290} h={110} />
        </>
      )}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: d.radius,
          background: isIphone
            ? 'linear-gradient(145deg, #3a3a40 0%, #1b1b20 30%, #2b2b31 60%, #111114 100%)'
            : 'linear-gradient(145deg, #2a2a2e, #0d0d10)',
          boxShadow: shadow
            ? '0 0 0 1.5px rgba(255,255,255,0.08) inset, 0 40px 80px -20px rgba(0,0,0,0.65), 0 18px 36px -18px rgba(0,0,0,0.5)'
            : '0 0 0 1.5px rgba(255,255,255,0.08) inset',
        }}
      />
      <div
        className="absolute overflow-hidden bg-black"
        style={{ left: d.bezel, top: d.bezel, width: d.w, height: d.h, borderRadius: d.screenRadius, isolation: 'isolate', transform: 'translateZ(0)' }}
      >
        {children}
        {isIphone ? (
          <div className="absolute left-1/2 -translate-x-1/2 z-[80] bg-black rounded-full pointer-events-none" style={{ top: 11, width: 122, height: 35 }} />
        ) : (
          <div className="absolute left-1/2 -translate-x-1/2 z-[80] bg-black rounded-full pointer-events-none" style={{ top: 12, width: 14, height: 14 }} />
        )}
      </div>
    </div>
  );
}

function Side({ left = false, top, h }) {
  return (
    <div
      className="absolute"
      style={{
        [left ? 'left' : 'right']: -2.5,
        top,
        width: 4,
        height: h,
        borderRadius: 3,
        background: 'linear-gradient(90deg, #2c2c31, #4a4a50, #2c2c31)',
      }}
    />
  );
}

function useClock() {
  const fmt = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 20000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function StatusBar({ light = false, device = 'iphone' }) {
  const t = useClock();
  const c = light ? '#ffffff' : 'var(--app-text)';
  const isIphone = device !== 'android';
  return (
    <div className="absolute top-0 left-0 right-0 z-[70] pointer-events-none flex items-start justify-between" style={{ height: isIphone ? 54 : 38, padding: isIphone ? '17px 32px 0 40px' : '11px 22px 0 24px', color: c, transition: 'color .3s' }}>
      <span className="font-semibold" style={{ fontSize: isIphone ? 16 : 14, letterSpacing: '-0.01em', fontFamily: '-apple-system, system-ui, sans-serif' }}>
        {t}
      </span>
      <span className="flex items-center gap-[6px]" style={{ marginTop: isIphone ? 2 : 1 }}>
        <svg width="18" height="12" viewBox="0 0 18 12" style={{ fill: c }}>
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" style={{ fill: c }}>
          <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.2C13.2 1.8 10.7.8 8 .8S2.8 1.8.9 3.6L2 4.8c1.6-1.5 3.7-2.4 6-2.4z" />
          <path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.2C11.5 4.7 9.8 4 8 4s-3.5.7-4.8 1.8l1.1 1.2c1-.9 2.3-1.4 3.7-1.4z" />
          <path d="M8 8.8c.6 0 1.1.2 1.5.6L8 11 6.5 9.4c.4-.4.9-.6 1.5-.6z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" style={{ fill: 'none', stroke: c, opacity: 0.4 }} />
          <rect x="2" y="2" width="17" height="9" rx="2.4" style={{ fill: c }} />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" style={{ fill: c, opacity: 0.45 }} />
        </svg>
      </span>
    </div>
  );
}

export function HomeIndicator({ light = false, device = 'iphone' }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-[70] rounded-full pointer-events-none"
      style={{ bottom: device === 'android' ? 6 : 8, width: device === 'android' ? 110 : 136, height: 5, background: light ? 'rgba(255,255,255,0.85)' : 'var(--app-text)', opacity: light ? 1 : 0.85, transition: 'background .3s' }}
    />
  );
}

// Repère de l'onglet actif : un seul élément déplacé en CSS (fluide, sans mesure de la page).
const SLIDE = 'transform .42s cubic-bezier(.2,.9,.25,1.12), opacity .2s';
function TabIndicator({ n, index, floating }) {
  const on = index >= 0;
  const i = Math.max(0, index);
  if (floating)
    return (
      <span
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{ top: 9, bottom: 9, left: 12, width: `calc((100% - 12px) / ${n} - 12px)`, background: 'var(--app-primary-soft)', transform: `translateX(calc(${i} * (100% + 12px)))`, opacity: on ? 1 : 0, transition: SLIDE }}
      />
    );
  return (
    <span aria-hidden="true" className="absolute top-0 left-0 flex justify-center pointer-events-none" style={{ width: `calc(100% / ${n})`, transform: `translateX(${i * 100}%)`, opacity: on ? 1 : 0, transition: SLIDE }}>
      <span className="h-[3px] w-8 rounded-b-full" style={{ background: 'var(--app-primary)' }} />
    </span>
  );
}

// ───────── Barre d'onglets ─────────
export function TabBar({ tabs, active, onSelect, visible, cartScreen, cartCount, floating, safeBottom }) {
  return (
    <AnimatePresence>
      {visible && tabs.length > 1 && (
        <motion.nav
          initial={{ y: 110, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 110, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="absolute left-0 right-0 bottom-0 z-[50]"
          style={{ paddingBottom: floating ? safeBottom : 0, paddingLeft: floating ? 14 : 0, paddingRight: floating ? 14 : 0 }}
        >
          <div
            className={`relative flex items-stretch ${floating ? 'fx-bar-el' : 'fx-bar'}`}
            style={
              floating
                ? {
                    height: 66,
                    borderRadius: 999,
                    background: 'color-mix(in srgb, var(--app-elevated) 82%, transparent)',
                    backdropFilter: 'blur(22px) saturate(1.7)',
                    WebkitBackdropFilter: 'blur(22px) saturate(1.7)',
                    boxShadow: '0 12px 34px rgba(0,0,0,0.18), inset 0 0 0 1px var(--app-border)',
                    padding: '0 6px',
                  }
                : {
                    height: 56 + safeBottom,
                    paddingBottom: safeBottom,
                    background: 'color-mix(in srgb, var(--app-bg) 86%, transparent)',
                    backdropFilter: 'blur(22px) saturate(1.7)',
                    WebkitBackdropFilter: 'blur(22px) saturate(1.7)',
                    borderTop: '1px solid var(--app-border)',
                  }
            }
          >
            <TabIndicator n={tabs.length} index={tabs.findIndex((t) => t.screen === active)} floating={floating} />
            {tabs.map((t) => {
              const on = t.screen === active;
              const isCart = t.screen === cartScreen;
              return (
                <button key={t.screen} type="button" onClick={() => onSelect(t.screen)} className="relative flex-1 flex flex-col items-center justify-center gap-[3px]" data-cart-target={isCart ? 'true' : undefined} data-tour={`tab-${t.screen}`}>
                  <span className="relative" style={{ color: on ? 'var(--app-primary-ink)' : 'var(--app-muted)', transition: 'color .2s' }}>
                    <motion.span className="inline-flex" animate={{ scale: on ? 1.08 : 1, y: on ? -1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                      <Icon name={t.icon} size={22} strokeWidth={on ? 2.3 : 1.9} />
                    </motion.span>
                    <AnimatePresence>
                      {isCart && cartCount > 0 && (
                        <motion.span
                          key={cartCount}
                          initial={{ scale: 0.3 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 700, damping: 15 }}
                          className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)', boxShadow: '0 0 0 2px var(--app-bg)' }}
                        >
                          {cartCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="relative text-[10.5px] font-semibold tracking-tight" style={{ color: on ? 'var(--app-primary-ink)' : 'var(--app-muted)' }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

// ───────── Barre de navigation « site web » (affichage ordinateur) ─────────
export const WEB_NAV_H = 68;
export function WebNav({ tabs, active, onSelect, onHome, name, cartScreen, cartCount, onCart, whatsapp }) {
  const links = tabs.filter((t) => t.screen !== cartScreen);
  const initial = String(name || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <nav
      className="fx-bar absolute top-0 left-0 right-0 z-[60]"
      style={{ height: WEB_NAV_H, background: 'color-mix(in srgb, var(--app-bg) 82%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', borderBottom: '1px solid var(--app-border)' }}
      data-web-nav
    >
      <div className="h-full mx-auto flex items-center gap-8 px-6" style={{ maxWidth: 1208 }}>
        <button type="button" onClick={onHome} className="flex items-center gap-2.5 shrink-0 min-w-0" data-tour="web-home">
          <span className="w-9 h-9 flex items-center justify-center font-extrabold text-[16px] shrink-0" style={{ borderRadius: 'min(var(--app-radius-sm), 12px)', background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>
            {initial}
          </span>
          <span className="app-heading font-extrabold text-[18px] truncate max-w-[260px]">{name}</span>
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
          {links.length > 1 &&
            links.map((t) => {
              const on = t.screen === active;
              return (
                <button key={t.screen} type="button" onClick={() => onSelect(t.screen)} className="relative h-10 px-3.5 text-[14.5px] font-semibold whitespace-nowrap" style={{ color: on ? 'var(--app-text)' : 'var(--app-muted)' }} data-tour={`tab-${t.screen}`}>
                  {t.label}
                  {on && <motion.span className="absolute left-3.5 right-3.5 -bottom-[1px] h-[2px] rounded-full" style={{ background: 'var(--app-primary)' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                </button>
              );
            })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cartScreen && (
            <button type="button" onClick={onCart} className="relative w-10 h-10 rounded-full flex items-center justify-center bg-app-surface" aria-label="Panier" data-cart-target="true">
              <Icon name="shopping-bag" size={19} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold flex items-center justify-center" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>
                  {cartCount}
                </span>
              )}
            </button>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${String(whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="h-10 px-4 rounded-full inline-flex items-center gap-2 text-[14px] font-semibold text-white" style={{ background: '#25D366' }}>
              <Icon name="message-circle" size={17} /> Nous écrire
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
