// Un écran : en-tête (4 styles), zone défilante de blocs, pied collant.
import { Component, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { ScreenCtx, useRt } from './context.js';
import { BLOCK_COMPONENTS } from './blocks/index.js';
import { Avatar, Icon, RoundIcon, Money } from './ui.jsx';
import { LiveFooter } from './live.jsx';

// Écrans « formulaire » affichés dans une colonne plus étroite sur ordinateur
const NARROW = new Set(['detail', 'cart', 'checkout', 'success', 'booking', 'auth', 'form', 'profile', 'settings', 'chat', 'ticket', 'tracking', 'plans', 'balance']);

class Boundary extends Component {
  constructor(p) {
    super(p);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.warn('[Défar] bloc ignoré :', this.props.name, err?.message);
  }
  render() {
    if (this.state.err) return this.props.fallback ?? null;
    return this.props.children;
  }
}

const GAPS = { hero: 22, search: 14, chips: 18, segmented: 18, spacer: 0, stories: 18, onboarding: 0 };

function BlockFrame({ block, index }) {
  const rt = useRt();
  const scr = useContext(ScreenCtx);
  const C = BLOCK_COMPONENTS[block.type];
  if (!C) return null;
  const edit = rt.mode === 'edit';
  const selected = edit && rt.selectedBlock === block.id;
  const noAnim = index === 0 || block.type === 'hero' || rt.mode === 'thumb';
  return (
    <motion.section
      data-block={block.type}
      data-block-id={block.id}
      className="edit-outline relative"
      data-selected={selected ? 'true' : 'false'}
      style={{ marginBottom: GAPS[block.type] ?? 26 }}
      initial={noAnim ? false : { opacity: 0, y: 22 }}
      whileInView={noAnim ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, root: scr.scrollRef, amount: 0.08 }}
      transition={{ type: 'spring', stiffness: 240, damping: 30, delay: Math.min(index, 5) * 0.045 }}
      onClickCapture={
        edit
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              rt.onSelectBlock?.(block.id);
            }
          : undefined
      }
    >
      {edit && selected && (
        <span className="absolute -top-0 left-2 z-40 px-2 py-0.5 rounded-b-md text-[10px] font-bold text-white" style={{ background: '#ff6a3d' }}>
          {block.type}
        </span>
      )}
      <Boundary name={block.type}>
        <C block={block} index={index} />
      </Boundary>
    </motion.section>
  );
}

export function Screen({ entry, screen, isTop, canBack, isTabRoot }) {
  const rt = useRt();
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState(null);
  const blocks = screen.blocks || [];
  const first = blocks[0];
  const isOnboarding = first?.type === 'onboarding';
  const hasChat = blocks.some((b) => b.type === 'chat');
  const heroFirst = first?.type === 'hero';
  const detailFirst = first?.type === 'detail';
  let hs = screen.header?.style || 'compact';
  if (isOnboarding) hs = 'none';
  const overlay = hs !== 'none' && (hs === 'transparent' || heroFirst || detailFirst);
  const safeTop = rt.safeTop;
  const safeBottom = rt.safeBottom;
  const web = rt.web;
  const tabVisible = !web && isTabRoot && rt.tabs.length > 1;
  const hasDetail = blocks.some((b) => b.type === 'detail');
  const hasFooter = !!screen.footer || hasDetail;
  const narrow = NARROW.has(first?.type) || blocks.some((b) => NARROW.has(b.type) && b.type !== 'plans');

  let padTop = 0;
  if (web) padTop = heroFirst ? 0 : rt.navH + 28;
  else if (!overlay) {
    if (hs === 'none') padTop = heroFirst || first?.type === 'auth' ? 0 : safeTop + 8;
    else if (hs === 'large') padTop = safeTop + 46;
    else if (hs === 'greeting') padTop = safeTop + 8;
    else padTop = safeTop + 52;
  }
  const padBottom = web ? (hasFooter ? 118 : 0) : tabVisible ? (rt.floatingTabs ? 104 : 78) + safeBottom : hasFooter ? 118 + safeBottom : 30 + safeBottom;
  const showFooter = (rt.live || web) && !hasChat && rt.mode !== 'thumb';
  const webTitle = web && !heroFirst ? (hs === 'greeting' ? null : rt.live && blocks.some((b) => b.type === 'checkout') ? 'Ta commande' : screen.header?.title || (hs !== 'none' ? screen.title : '')) : null;

  // couleur de la barre d'état (claire au-dessus d'une image)
  const threshold = heroFirst ? 250 : detailFirst ? 300 : 40;
  useMotionValueEvent(scrollY, 'change', (y) => {
    if (!isTop || web) return;
    rt.setStatusLight(rt.palette.dark || (overlay && y < threshold - 20));
  });
  useEffect(() => {
    if (isTop) rt.setStatusLight(rt.palette.dark || overlay || (isOnboarding && true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop, overlay, isOnboarding, rt.palette.dark]);

  useEffect(() => {
    if (isTop) rt.registerScroll(scrollRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

  const ctx = useMemo(
    () => ({ screen, params: entry.params || {}, scrollRef, scrollY, query, setQuery, detail, setDetail, isTop, padBottom, overlay }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screen, entry, query, detail, isTop, padBottom, overlay]
  );

  if (isOnboarding) {
    const C = BLOCK_COMPONENTS.onboarding;
    return (
      <ScreenCtx.Provider value={ctx}>
        <div className="absolute inset-0 bg-app-bg">
          <Boundary name="onboarding">
            <C block={first} index={0} />
          </Boundary>
        </div>
      </ScreenCtx.Provider>
    );
  }

  return (
    <ScreenCtx.Provider value={ctx}>
      <div className={`absolute inset-0 ${screen.background === 'surface' ? 'bg-app-surface' : 'bg-app-bg'}`}>
        {hs !== 'none' && !web && <TopBar screen={screen} hs={hs} overlay={overlay} canBack={canBack} scrollY={scrollY} threshold={threshold} safeTop={safeTop} />}
        {hasChat ? (
          <div className="absolute inset-0 flex flex-col" style={{ paddingTop: web ? rt.navH + 16 : padTop, paddingBottom: tabVisible ? (rt.floatingTabs ? 70 : 58) : 0 }} data-web-chat={web ? 'true' : undefined}>
            {web && canBack && <WebBack title={screen.header?.title || screen.title} />}
            {blocks
              .filter((b) => b.type === 'chat')
              .slice(0, 1)
              .map((b) => {
                const C = BLOCK_COMPONENTS.chat;
                return (
                  <Boundary key={b.id} name="chat">
                    <C block={b} index={0} />
                  </Boundary>
                );
              })}
          </div>
        ) : (
          <div ref={scrollRef} className="app-scroll absolute inset-0" style={{ paddingTop: padTop, paddingBottom: padBottom }} data-screen-scroll data-narrow={web && narrow ? 'true' : undefined}>
            {web ? (
              <>
                {canBack && !heroFirst && <WebBack title={webTitle && !isTabRoot ? webTitle : ''} />}
                {hs === 'greeting' && <Greeting header={screen.header} />}
                {webTitle && isTabRoot && <LargeTitle title={webTitle} subtitle={screen.header?.subtitle} />}
              </>
            ) : (
              <>
                {hs === 'large' && !overlay && <LargeTitle title={screen.header.title || screen.title} subtitle={screen.header.subtitle} />}
                {hs === 'greeting' && !overlay && <Greeting header={screen.header} />}
              </>
            )}
            {blocks.map((b, i) => (
              <BlockFrame key={b.id} block={b} index={i} />
            ))}
            {showFooter && <LiveFooter />}
          </div>
        )}
        {screen.footer ? (
          <FooterBar label={screen.footer.label} sublabel={screen.footer.sublabel} price={screen.footer.price} onClick={() => rt.run(screen.footer.action, { screen })} safeBottom={safeBottom} />
        ) : hasDetail && detail ? (
          <FooterBar label={detail.label} price={detail.total} onClick={detail.onAction} safeBottom={safeBottom} tour="detail-cta" />
        ) : null}
      </div>
    </ScreenCtx.Provider>
  );
}

function WebBack({ title }) {
  const rt = useRt();
  return (
    <div className="px-5 pb-5 flex items-center gap-3" data-web-back>
      <button type="button" onClick={rt.back} className="h-10 pl-2.5 pr-4 rounded-full inline-flex items-center gap-1.5 text-[14px] font-semibold bg-app-surface">
        <Icon name="chevron-left" size={18} /> Retour
      </button>
      {title && <h1 className="app-heading text-[26px] font-extrabold truncate">{title}</h1>}
    </div>
  );
}

function LargeTitle({ title, subtitle }) {
  const rt = useRt();
  return (
    <div className={rt.web ? 'px-5 pt-2 pb-8' : 'px-5 pt-1 pb-4'} data-web-title>
      <h1 className="app-heading font-extrabold leading-[1.06]" style={{ fontSize: rt.web ? 44 : 31 }}>{title}</h1>
      {subtitle && <p className="text-[14px] text-app-muted mt-1.5">{subtitle}</p>}
    </div>
  );
}

function HeaderActions({ actions, glass }) {
  const rt = useRt();
  return (
    <div className="flex items-center gap-2">
      {(actions || []).map((a, i) => {
        const toCart = a.action && (a.action.to === rt.routes.cart || a.icon === 'shopping-bag' || a.icon === 'shopping-cart');
        const badge = toCart ? rt.cartCount || null : a.badge || null;
        return <RoundIcon key={i} icon={a.icon} glass={glass} badge={badge} dataCart={toCart} onClick={() => rt.run(a.action || (toCart && rt.routes.cart ? { type: 'navigate', to: rt.routes.cart } : { type: 'toast', message: 'Aucune nouvelle notification' }))} />;
      })}
    </div>
  );
}

function Greeting({ header }) {
  const rt = useRt();
  const sub = header.subtitle;
  const isLoc = sub && /dakar|thi[eè]s|plateau|almadies|m[ée]dina|parcelles|pikine|gu[ée]diawaye|rufisque|saint|mbour|ziguinchor|kaolack|touba|\d{2,}/i.test(sub);
  // Site en ligne : pas de faux utilisateur (« Bonjour Awa »)
  const personal = /^(bonjour|salut|hello|hi|salam|bonsoir|coucou|nanga def)\b/i.test(header.title || '');
  const title = rt.live && personal ? `Bienvenue chez ${rt.spec.meta.name}` : header.title;
  return (
    <div className="px-5 pt-1 pb-5 flex items-center gap-3" data-web-title>
      {rt.live ? (
        <span className="w-[46px] h-[46px] rounded-full flex items-center justify-center font-extrabold text-[18px] shrink-0" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>
          {String(rt.spec.meta.name || '?').trim()[0]?.toUpperCase()}
        </span>
      ) : (
        <Avatar src={rt.userAvatar} name={rt.spec.user?.name || 'Awa'} size={46} ring />
      )}
      <div className="flex-1 min-w-0">
        {sub && (
          <p className="text-[12.5px] text-app-muted flex items-center gap-1 truncate">
            {isLoc && <Icon name="map-pin" size={13} style={{ color: 'var(--app-primary-ink)' }} />}
            {sub}
          </p>
        )}
        <h1 className="app-heading text-[20px] font-bold leading-tight truncate">{title}</h1>
      </div>
      <HeaderActions actions={header.actions} />
    </div>
  );
}

function TopBar({ screen, hs, overlay, canBack, scrollY, threshold, safeTop }) {
  const rt = useRt();
  const solidFrom = hs === 'compact' && !overlay ? 0 : 1;
  const bg = useTransform(scrollY, [threshold - 50, threshold], [solidFrom === 0 ? 1 : 0, 1]);
  const titleO = useTransform(scrollY, [threshold - 15, threshold + 15], [hs === 'compact' && !overlay ? 1 : 0, 1]);
  const border = useTransform(scrollY, [threshold, threshold + 30], [0, 1]);
  const showActions = hs !== 'greeting';
  const liveCheckout = rt.live && screen.blocks?.some((b) => b.type === 'checkout');
  const title = hs === 'greeting' ? rt.spec.meta.name : liveCheckout ? 'Ta commande' : screen.header.title || screen.title;
  return (
    <div className="absolute top-0 left-0 right-0 z-[40]" style={{ height: safeTop + 48 }}>
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: bg,
          background: 'color-mix(in srgb, var(--app-bg) 86%, transparent)',
          backdropFilter: 'blur(22px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.8)',
        }}
      />
      <motion.div className="absolute left-0 right-0 bottom-0 h-px bg-app-border" style={{ opacity: border }} />
      <div className="absolute left-0 right-0 bottom-0 h-12 flex items-center justify-between px-3.5 gap-2">
        <div className="w-[88px] flex">{canBack && <RoundIcon icon="chevron-left" glass={overlay} onClick={rt.back} size={38} />}</div>
        <motion.span className="flex-1 text-center font-semibold text-[16px] truncate app-heading" style={{ opacity: titleO }}>
          {title}
        </motion.span>
        <div className="w-[88px] flex justify-end">{showActions && <HeaderActions actions={screen.header.actions} glass={overlay} />}</div>
      </div>
    </div>
  );
}

function FooterBar({ label, sublabel, price, onClick, safeBottom, tour }) {
  const rt = useRt();
  return (
    <motion.div
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36, delay: 0.1 }}
      className="app-footerbar absolute left-0 right-0 bottom-0 z-[45] px-4 pt-6"
      style={{ paddingBottom: safeBottom + 8, background: 'linear-gradient(to top, var(--app-bg) 62%, color-mix(in srgb, var(--app-bg) 0%, transparent))' }}
    >
      {sublabel && <p className="text-center text-[12px] text-app-muted mb-2">{sublabel}</p>}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        data-tour={tour || 'footer-cta'}
        className="w-full h-[56px] flex items-center justify-between px-5 font-semibold text-[16px] shadow-lg"
        style={{ borderRadius: 'min(var(--app-radius), 999px)', background: 'var(--app-primary)', color: 'var(--app-on-primary)', boxShadow: '0 12px 28px -10px var(--app-primary)' }}
      >
        <span className="truncate">{label}</span>
        {Number.isFinite(price) && price > 0 ? (
          <span className="flex items-center gap-2 shrink-0">
            <span className="w-px h-5 opacity-30" style={{ background: 'currentColor' }} />
            <Money value={price} currency={rt.currency} compact />
          </span>
        ) : (
          <Icon name="arrow-right" size={20} />
        )}
      </motion.button>
    </motion.div>
  );
}
