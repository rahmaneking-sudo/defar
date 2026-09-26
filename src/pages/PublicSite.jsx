// Site publié : /s/nom (ou nom.defar.sn). Affichage « app » sur téléphone,
// affichage « site web » sur ordinateur. Formulaires réels (mode live).
import { useEffect, useMemo, useState } from 'react';
import { AppPlayer } from '../engine/Player.jsx';
import { themeVars } from '../engine/theme.js';
import { normalizeSpec } from '../../shared/normalize.js';
import { useRoute, Link } from '../router.jsx';
import { Logo } from '../ui/kit.jsx';
import { BRAND } from '../config.js';
import { getPublicSite, submitForm, siteFromHost, SITES_DOMAIN } from '../lib/cloud.js';
import { TRIAL } from '../../shared/plans.js';

function useWide() {
  const q = '(min-width: 900px)';
  const [w, setW] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setW(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return w;
}

function setMeta(name, content, attr = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
function setFavicon(letter, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color}"/><text x="32" y="43" font-family="Arial,sans-serif" font-size="34" font-weight="800" text-anchor="middle" fill="#fff">${letter}</text></svg>`;
  let link = document.head.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function PublicSite() {
  const { path } = useRoute();
  const slug = (siteFromHost() || decodeURIComponent(path.split('/')[2] || '')).toLowerCase();
  const [state, setState] = useState({ loading: true });
  const wide = useWide();

  useEffect(() => {
    let off = false;
    setState({ loading: true });
    getPublicSite(slug)
      .then((r) => {
        if (off) return;
        if (!r?.spec) return setState({ missing: true });
        setState({ site: r, spec: normalizeSpec(r.spec).spec });
      })
      .catch(() => !off && setState({ error: true }));
    return () => {
      off = true;
    };
  }, [slug]);

  const spec = state.spec;
  const site = state.site;
  useEffect(() => {
    if (!spec) return;
    document.title = spec.meta.tagline ? `${spec.meta.name} — ${spec.meta.tagline}` : spec.meta.name;
    setMeta('description', spec.meta.tagline || spec.meta.name);
    setMeta('theme-color', themeVars(spec.theme).palette.bg);
    setFavicon(String(spec.meta.name || '?').trim()[0]?.toUpperCase() || '?', spec.theme.primary);
  }, [spec]);

  const live = useMemo(
    () =>
      site && {
        slug: site.slug,
        whatsapp: site.whatsapp || '',
        badge: TRIAL,
        badgeUrl: `${siteFromHost() ? `https://${SITES_DOMAIN}` : location.origin}/?ref=${site.slug}`,
        submit: (kind, data) => submitForm(site.slug, kind, data),
      },
    [site]
  );

  if (state.loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f6f5f2]">
        <div className="w-9 h-9 rounded-full border-2 border-black/10 border-t-black/60 animate-spin" />
      </div>
    );
  }
  if (!spec) {
    return (
      <div className="min-h-[100dvh] bg-ink text-sand flex flex-col items-center justify-center gap-6 p-8 text-center">
        <Logo />
        <h1 className="font-display text-[40px] leading-none">{state.error ? 'Connexion impossible' : 'Site introuvable'}</h1>
        <p className="text-sand/75 max-w-sm">{state.error ? 'Vérifie ta connexion Internet puis recharge la page.' : 'Ce site n\'existe pas ou n\'est plus en ligne.'}</p>
        {state.error ? (
          <button type="button" onClick={() => location.reload()} className="h-11 px-5 rounded-xl bg-sand text-ink font-semibold">
            Recharger
          </button>
        ) : (
          <Link to="/" className="h-11 px-5 rounded-xl bg-sand text-ink font-semibold flex items-center">
            Crée ton site avec {BRAND.name}
          </Link>
        )}
      </div>
    );
  }
  const { palette } = themeVars(spec.theme);
  return (
    <div style={{ position: 'fixed', inset: 0, paddingTop: wide ? 0 : 'env(safe-area-inset-top)', paddingBottom: wide ? 0 : 'env(safe-area-inset-bottom)', background: palette.bg }} data-public-site={site.slug}>
      <AppPlayer spec={spec} frame={false} web={wide} live={live} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
