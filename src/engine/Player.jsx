// ─────────────────────────────────────────────────────────────────────────────
// AppPlayer : exécute une spec d'app (navigation, panier, paiement simulé,
// animations) dans un cadre de téléphone ou en plein écran.
// ─────────────────────────────────────────────────────────────────────────────
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { RtCtx, computeRoutes } from './context.js';
import { themeVars, ensureFonts } from './theme.js';
import { DeviceFrame, DEVICES, StatusBar, HomeIndicator, TabBar } from './chrome.jsx';
import { Toast, Banner, Sheet, Flyers, StoryViewer, Lightbox, Finger } from './overlays.jsx';
import { Screen } from './Screen.jsx';
import { formatMoney, uid } from '../../shared/utils.js';
import { FONTS } from '../../shared/constants.js';
import { pickPortrait } from '../../shared/media.js';

const spring = { type: 'spring', stiffness: 360, damping: 38, mass: 0.95 };
const SCREEN_VARIANTS = {
  initial: ({ dir, pres }) =>
    pres === 'modal' && dir > 0
      ? { y: '100%', x: 0, opacity: 1, scale: 1, zIndex: 3 }
      : dir > 0
        ? { x: '100%', y: 0, opacity: 1, scale: 1, zIndex: 2 }
        : dir < 0
          ? { x: '-26%', y: 0, opacity: 1, scale: 1, zIndex: 1, filter: 'brightness(0.85)' }
          : { opacity: 0, scale: 0.985, x: 0, y: 0, zIndex: 2 },
  animate: { x: 0, y: 0, opacity: 1, scale: 1, filter: 'brightness(1)', transition: spring },
  exit: ({ dir, pres }) =>
    pres === 'modal' && dir < 0
      ? { y: '100%', zIndex: 3, transition: spring }
      : dir > 0
        ? { x: '-26%', zIndex: 1, filter: 'brightness(0.85)', transition: spring }
        : dir < 0
          ? { x: '100%', zIndex: 2, transition: spring }
          : { opacity: 0, zIndex: 1, transition: { duration: 0.18 } },
};

let keySeq = 0;
const newKey = () => `s${++keySeq}`;

export const AppPlayer = forwardRef(function AppPlayer(
  { spec, device = 'iphone', frame = true, mode = 'play', selectedBlock, onSelectBlock, screenId: controlledScreen, onScreenChange, className = '', style, reducedMotion = false, autopilot = false },
  ref
) {
  const byId = useMemo(() => new Map(spec.screens.map((s) => [s.id, s])), [spec]);
  const routes = useMemo(() => computeRoutes(spec), [spec]);
  const tabSet = useMemo(() => new Set(spec.tabs.map((t) => t.screen)), [spec]);
  const { vars, palette } = useMemo(() => themeVars(spec.theme), [spec.theme]);
  useEffect(() => ensureFonts(spec.theme), [spec.theme]);

  const d = DEVICES[device] || DEVICES.iphone;
  const fullscreen = !frame;
  const safeTop = fullscreen ? 0 : d.safeTop;
  const safeBottom = fullscreen ? 0 : d.safeBottom;

  const startId = byId.has(controlledScreen) ? controlledScreen : byId.has(spec.initial) ? spec.initial : spec.screens[0].id;
  const [stack, setStack] = useState(() => [{ key: newKey(), id: startId, params: {} }]);
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const [nav, setNav] = useState({ dir: 0, pres: 'push' });
  const [statusLight, setStatusLight] = useState(palette.dark);
  const [cart, setCart] = useState([]);
  const cartTouched = useRef(false);
  const [favs, setFavs] = useState(() => new Set());
  const [order, setOrder] = useState(null);
  const [booking, setBooking] = useState(null);
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [flyers, setFlyers] = useState([]);
  const [story, setStory] = useState(null);
  const [box, setBox] = useState(null);
  const [finger, setFinger] = useState(null);
  const rootRef = useRef(null);
  const scrollRefHolder = useRef(null);
  const toastTimer = useRef();
  const bannerTimer = useRef();

  // spec changée (studio) : on garde l'écran courant s'il existe encore
  useEffect(() => {
    setStack((s) => {
      const top = s[s.length - 1];
      const keep = s.filter((e) => byId.has(e.id));
      if (keep.length && keep[keep.length - 1].id === top.id) return keep;
      return [{ key: newKey(), id: byId.has(top?.id) ? top.id : startId, params: {} }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  // écran piloté par le studio
  useEffect(() => {
    if (!controlledScreen || !byId.has(controlledScreen)) return;
    const top = stackRef.current[stackRef.current.length - 1];
    if (top.id === controlledScreen) return;
    setNav({ dir: 0, pres: 'push' });
    setStack([{ key: newKey(), id: controlledScreen, params: {} }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledScreen]);

  const top = stack[stack.length - 1];
  useEffect(() => {
    onScreenChange?.(top.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top.id]);

  // ───────── Retours visuels ─────────
  const showToast = useCallback((message, icon) => {
    clearTimeout(toastTimer.current);
    setToast({ id: uid('t'), message, icon });
    toastTimer.current = setTimeout(() => setToast(null), 2300);
  }, []);
  const notify = useCallback((b) => {
    clearTimeout(bannerTimer.current);
    setBanner({ id: uid('b'), ...b });
    bannerTimer.current = setTimeout(() => setBanner(null), 3800);
  }, []);
  useEffect(() => () => (clearTimeout(toastTimer.current), clearTimeout(bannerTimer.current)), []);

  // ───────── Navigation ─────────
  const homeId = routes.home && byId.has(routes.home) ? routes.home : startId;
  const navigate = useCallback(
    (to, params = {}, opts = {}) => {
      if (!byId.has(to)) return showToast('Bientôt disponible ✨', 'sparkles');
      setSheet((sh) => (sh && !opts.keepSheet ? null : sh));
      setStory(null);
      setBox(null);
      const s = stackRef.current;
      const cur = s[s.length - 1];
      if (tabSet.has(to) && !opts.push) {
        if (cur.id === to && s.length === 1) {
          scrollRefHolder.current?.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
          return;
        }
        setNav({ dir: 0, pres: 'push' });
        setStack([{ key: newKey(), id: to, params }]);
        return;
      }
      if (cur.id === to && JSON.stringify(cur.params) === JSON.stringify(params)) return;
      const pres = opts.presentation || byId.get(to).presentation || 'push';
      // après un paiement réussi : pas de retour vers le paiement
      if (to === routes.success || byId.get(to).blocks[0]?.type === 'success') {
        setNav({ dir: pres === 'fade' ? 0 : 1, pres: 'push' });
        setStack([{ key: newKey(), id: homeId, params: {} }, { key: newKey(), id: to, params, pres: 'push' }].filter((e, i, a) => !(i === 0 && a[1].id === homeId)));
        return;
      }
      setNav({ dir: pres === 'fade' ? 0 : 1, pres });
      setStack((st) => [...st, { key: newKey(), id: to, params, pres }].slice(-12));
    },
    [byId, tabSet, routes.success, homeId, showToast]
  );

  const back = useCallback(() => {
    const s = stackRef.current;
    if (sheet && !sheet.locked) return setSheet(null);
    if (s.length > 1) {
      setNav({ dir: -1, pres: s[s.length - 1].pres || 'push' });
      setStack(s.slice(0, -1));
    } else if (s[0].id !== homeId) {
      setNav({ dir: -1, pres: 'push' });
      setStack([{ key: newKey(), id: homeId, params: {} }]);
    }
  }, [homeId, sheet]);

  const goHome = useCallback(() => {
    setSheet(null);
    setNav({ dir: 0, pres: 'push' });
    setStack([{ key: newKey(), id: homeId, params: {} }]);
  }, [homeId]);

  // ───────── Panier ─────────
  const cartCount = cart.reduce((n, it) => n + it.qty, 0);
  const cartTotal = cart.reduce((n, it) => n + (it.price || 0) * it.qty, 0);

  const flyToCart = useCallback((el, image) => {
    const root = rootRef.current;
    if (!root || !el) return;
    const target = root.querySelector('[data-cart-target="true"]');
    if (!target) return;
    const rr = root.getBoundingClientRect();
    const scale = rr.width / root.offsetWidth || 1;
    const a = el.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const pos = (r) => ({ x: (r.left + r.width / 2 - rr.left) / scale, y: (r.top + r.height / 2 - rr.top) / scale });
    setFlyers((f) => [...f, { id: uid('f'), from: pos(a), to: pos(b), image }]);
  }, []);

  const addToCart = useCallback(
    (item, { qty = 1, options = {}, el, silent = false } = {}) => {
      if (!item) return;
      cartTouched.current = true;
      const key = `${item.id || item.title}|${JSON.stringify(options)}`;
      setCart((c) => {
        const i = c.findIndex((x) => x.key === key);
        if (i >= 0) {
          const n = [...c];
          n[i] = { ...n[i], qty: Math.min(99, n[i].qty + qty) };
          return n;
        }
        return [...c, { key, id: item.id, title: item.title, subtitle: item.subtitle, price: item.price || 0, image: item.image, qty, options }];
      });
      if (el) flyToCart(el, item.image);
      if (!silent) showToast(`${item.title.length > 22 ? item.title.slice(0, 21) + '…' : item.title} ajouté ✓`, 'shopping-bag');
    },
    [flyToCart, showToast]
  );
  const setQty = useCallback((key, qty) => {
    cartTouched.current = true;
    setCart((c) => (qty <= 0 ? c.filter((x) => x.key !== key) : c.map((x) => (x.key === key ? { ...x, qty } : x))));
  }, []);
  const prefillCart = useCallback((items) => {
    if (cartTouched.current || !items?.length) return;
    cartTouched.current = true;
    setCart(items.map((it) => ({ key: `${it.id}|{}`, id: it.id, title: it.title, subtitle: it.subtitle, price: it.price || 0, image: it.image, qty: it.qty || 1, options: {} })));
  }, []);
  const clearCart = useCallback(() => {
    cartTouched.current = true;
    setCart([]);
  }, []);

  const toggleFav = useCallback(
    (id, title) => {
      setFavs((f) => {
        const n = new Set(f);
        if (n.has(id)) n.delete(id);
        else {
          n.add(id);
          showToast(`${title ? title.slice(0, 20) : 'Article'} ajouté aux favoris`, 'heart');
        }
        return n;
      });
    },
    [showToast]
  );

  // ───────── Exécution d'une action ─────────
  const run = useCallback(
    (action, ctx = {}) => {
      if (mode === 'edit' || mode === 'thumb') return;
      const item = ctx.item;
      if (!action) {
        // action par défaut d'un élément : ouvrir la fiche détail, sinon ajouter au panier
        if (item && routes.detail && top.id !== routes.detail) return navigate(routes.detail, { item });
        if (item && item.price && routes.cart) return addToCart(item, { el: ctx.el });
        if (item) return showToast(item.title, 'sparkles');
        return;
      }
      switch (action.type) {
        case 'navigate':
          return navigate(action.to, item ? { item } : ctx.params || {});
        case 'tab':
          return navigate(action.to);
        case 'modal':
          return navigate(action.to, item ? { item } : {}, { presentation: 'modal', push: true });
        case 'back':
          return back();
        case 'home':
        case 'reset':
          return goHome();
        case 'toast':
          return showToast(action.message || 'OK');
        case 'addToCart':
          return item ? addToCart(item, { el: ctx.el, qty: ctx.qty || 1, options: ctx.options }) : showToast('Ajouté ✓');
        case 'like':
          return item ? toggleFav(item.id, item.title) : showToast('Ajouté aux favoris', 'heart');
        case 'share':
          if (navigator.share && mode === 'play') navigator.share({ title: spec.meta.name, url: location.href }).catch(() => {});
          else showToast('Lien de partage copié', 'share-2');
          return;
        case 'call':
          return showToast(`Appel vers ${action.phone || 'le service client'}…`, 'phone');
        case 'whatsapp': {
          const digits = String(action.phone || '').replace(/\D/g, '');
          if (digits && mode === 'play') window.open(`https://wa.me/${digits}${action.message ? '?text=' + encodeURIComponent(action.message) : ''}`, '_blank', 'noopener');
          else showToast('Ouverture de WhatsApp…', 'message-circle');
          return;
        }
        case 'link':
          if (mode === 'play' && action.url) window.open(action.url, '_blank', 'noopener');
          else showToast('Lien externe', 'globe');
          return;
        default:
      }
    },
    [mode, routes, top.id, navigate, back, goHome, showToast, addToCart, toggleFav, spec.meta.name]
  );

  // ───────── Doigt de démonstration (visites guidées & vidéos) ─────────
  const tapAt = useCallback(async (selector, { index = 0, hold = 380 } = {}) => {
    const root = rootRef.current;
    if (!root) return false;
    const els = [...root.querySelectorAll(selector)].filter((e) => e.offsetParent !== null || e.getClientRects().length);
    const el = els[index] || els[0];
    if (!el) return false;
    // fait défiler uniquement l'écran du téléphone (jamais la page qui l'entoure)
    const sc = el.closest('[data-screen-scroll]');
    if (sc) {
      const er = el.getBoundingClientRect();
      const cr = sc.getBoundingClientRect();
      const k = cr.height / sc.clientHeight || 1;
      if (er.top < cr.top + 90 * k || er.bottom > cr.bottom - 110 * k) {
        sc.scrollTo({ top: sc.scrollTop + (er.top - cr.top) / k - sc.clientHeight / 2.6, behavior: 'smooth' });
        await wait(520);
      }
    }
    await wait(160);
    const rr = root.getBoundingClientRect();
    const scale = rr.width / root.offsetWidth || 1;
    const r = el.getBoundingClientRect();
    setFinger({ x: (r.left + r.width / 2 - rr.left) / scale, y: (r.top + r.height / 2 - rr.top) / scale, tap: 0 });
    await wait(hold);
    setFinger((f) => f && { ...f, tap: 1 });
    await wait(120);
    el.click();
    await wait(220);
    setFinger(null);
    return true;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      root: () => rootRef.current,
      navigate,
      back,
      home: goHome,
      tap: tapAt,
      current: () => stackRef.current[stackRef.current.length - 1].id,
      scrollBy: (y) => scrollRefHolder.current?.current?.scrollBy({ top: y, behavior: 'smooth' }),
      scrollTo: (y) => scrollRefHolder.current?.current?.scrollTo({ top: y, behavior: 'smooth' }),
      reset: () => {
        setCart([]);
        cartTouched.current = false;
        setOrder(null);
        setSheet(null);
        setNav({ dir: 0, pres: 'push' });
        setStack([{ key: newKey(), id: startId, params: {} }]);
      },
    }),
    [navigate, back, goHome, tapAt, startId]
  );

  const userAvatar = useMemo(() => pickPortrait(spec.user?.name || 'Awa Diop'), [spec.user?.name]);
  const floatingTabs = spec.theme.style === 'glass' || spec.theme.style === 'soft';
  const tabVisible = stack.length === 1 && tabSet.has(top.id);

  const rt = {
    spec,
    palette,
    routes,
    mode,
    device,
    fullscreen,
    safeTop,
    safeBottom,
    currency: spec.meta.currency || 'FCFA',
    fmt: (n, compact = true) => formatMoney(n, spec.meta.currency || 'FCFA', compact),
    autopilot,
    run,
    navigate,
    back,
    home: goHome,
    toast: showToast,
    notify,
    openSheet: (s) => setSheet({ id: uid('sh'), ...s }),
    closeSheet: () => setSheet(null),
    cart,
    cartCount,
    cartTotal,
    addToCart,
    setQty,
    prefillCart,
    clearCart,
    favs,
    toggleFav,
    order,
    setOrder,
    booking,
    setBooking,
    openStory: (items, index) => setStory({ items, index }),
    openLightbox: (b) => setBox(b),
    selectedBlock,
    onSelectBlock,
    setStatusLight,
    registerScroll: (r) => (scrollRefHolder.current = r),
    userAvatar,
    floatingTabs,
    stackDepth: stack.length,
    currentScreen: top.id,
  };

  const W = fullscreen ? '100%' : d.w;
  const H = fullscreen ? '100%' : d.h;
  const app = (
    <div
      ref={rootRef}
      className={`app-root relative overflow-hidden ${mode === 'edit' ? 'edit-mode' : ''}`}
      data-style={spec.theme.style}
      data-theme={spec.theme.mode}
      data-heading={FONTS[spec.theme.headingFont] === 'serif' ? 'serif' : 'sans'}
      style={{ ...vars, width: W, height: H }}
    >
      <AnimatePresence initial={false} custom={nav}>
        <motion.div key={top.key} custom={nav} variants={SCREEN_VARIANTS} initial="initial" animate="animate" exit="exit" className="absolute inset-0" style={{ boxShadow: nav.dir > 0 ? '-12px 0 40px rgba(0,0,0,0.18)' : undefined }}>
          <Screen entry={top} screen={byId.get(top.id)} isTop canBack={stack.length > 1 || (!tabSet.has(top.id) && top.id !== homeId && top.id !== spec.initial)} isTabRoot={stack.length === 1 && tabSet.has(top.id)} />
        </motion.div>
      </AnimatePresence>
      <TabBar tabs={spec.tabs} active={top.id} onSelect={(id) => run({ type: 'tab', to: id })} visible={tabVisible} cartScreen={routes.cart} cartCount={cartCount} floating={floatingTabs} safeBottom={safeBottom || 8} />
      <Flyers flyers={flyers} onDone={(id) => setFlyers((f) => f.filter((x) => x.id !== id))} />
      <Sheet sheet={sheet} onClose={() => setSheet(null)} safeBottom={safeBottom} />
      <StoryViewer story={story} onClose={() => setStory(null)} />
      <Lightbox box={box} onClose={() => setBox(null)} />
      <Toast toast={toast} safeTop={safeTop || 12} />
      <Banner banner={banner} safeTop={safeTop || 50} onClose={() => setBanner(null)} />
      <Finger finger={finger} />
      {!fullscreen && <StatusBar light={statusLight && !sheet && !story && !box ? true : !!(story || box)} device={device} />}
      {!fullscreen && <HomeIndicator light={statusLight && !tabVisible} device={device} />}
    </div>
  );

  return (
    <RtCtx.Provider value={rt}>
      <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
        <div className={className} style={style}>
          {fullscreen ? app : <DeviceFrame device={device}>{app}</DeviceFrame>}
        </div>
      </MotionConfig>
    </RtCtx.Provider>
  );
});

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ───────── Mise à l'échelle automatique du téléphone ─────────
export function FitPhone({ children, device = 'iphone', max = 1, pad = 24, className = '', style }) {
  const d = DEVICES[device] || DEVICES.iphone;
  const W = d.w + d.bezel * 2;
  const H = d.h + d.bezel * 2;
  const box = useRef(null);
  const [scale, setScale] = useState(0.7);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setScale(Math.max(0.2, Math.min(max, (r.width - pad * 2) / W, (r.height - pad * 2) / H)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H, max, pad]);
  return (
    <div ref={box} className={`relative flex items-center justify-center ${className}`} style={style}>
      <div style={{ width: W * scale, height: H * scale }}>
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  );
}
