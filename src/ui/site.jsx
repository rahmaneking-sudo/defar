// En-tête et pied de page communs aux pages publiques (accueil, galerie, paiements).
import { useEffect, useState } from 'react';
import { Logo, I } from './kit.jsx';
import { Link } from '../router.jsx';
import { BRAND } from '../config.js';

const NAV = [
  { to: '/#demo', label: 'Démos' },
  { to: '/#metiers', label: 'Métiers' },
  { to: '/#paiement', label: 'Paiement' },
  { to: '/galerie', label: 'Galerie' },
];

export function SiteHeader({ active }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const onLanding = typeof location !== 'undefined' && location.pathname === '/';
  const item = (n, cls) =>
    onLanding && n.to.startsWith('/#') ? (
      <a key={n.to} href={n.to.slice(1)} className={cls} onClick={() => setOpen(false)}>
        {n.label}
      </a>
    ) : (
      <Link key={n.to} to={n.to} className={cls} onClick={() => setOpen(false)}>
        {n.label}
      </Link>
    );
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled || open ? 'bg-ink/80 backdrop-blur-xl border-b border-white/[0.06]' : ''}`}>
      <div className="max-w-7xl mx-auto h-16 px-5 flex items-center gap-8">
        <Link to="/" aria-label={`${BRAND.name} — accueil`}>
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[14px] text-sand/70">{NAV.map((n) => item(n, `hover:text-sand transition-colors ${active === n.to ? 'text-sand' : ''}`))}</nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/paiements" className={`hidden sm:inline-flex h-10 px-4 items-center rounded-xl text-[14px] hover:text-sand ${active === '/paiements' ? 'text-sand' : 'text-sand/80'}`}>
            Encaisser
          </Link>
          <Link to="/studio" className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-sand text-ink text-[14px] font-semibold hover:bg-white">
            Ouvrir le studio <I n="arrow-right" s={16} />
          </Link>
          <button type="button" aria-label="Menu" onClick={() => setOpen((o) => !o)} className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl text-sand/80 hover:bg-white/[0.06]">
            <I n={open ? 'x' : 'menu'} s={20} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden px-5 pb-5 flex flex-col gap-1 text-[16px]">
          {[...NAV, { to: '/paiements', label: 'Encaisser' }].map((n) => item(n, 'h-11 flex items-center px-3 rounded-xl text-sand/85 hover:bg-white/[0.05]'))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-5 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:items-center justify-between text-[13.5px] text-dune">
        <div className="flex items-center gap-4">
          <Logo size={26} />
          <span>« {BRAND.name} » : construire, en wolof.</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/studio" className="hover:text-sand">
            Studio
          </Link>
          <Link to="/galerie" className="hover:text-sand">
            Galerie
          </Link>
          <Link to="/paiements" className="hover:text-sand">
            Paiements
          </Link>
          <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-sand">
            WhatsApp
          </a>
        </div>
        <span>
          © {new Date().getFullYear()} {BRAND.name} · Dakar
        </span>
      </div>
    </footer>
  );
}

// Après une navigation vers « /#section », fait défiler jusqu'à la section.
export function useHashScroll() {
  useEffect(() => {
    const h = location.hash;
    if (!h || h.length < 2) return;
    const t = setTimeout(() => document.getElementById(decodeURIComponent(h.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => clearTimeout(t);
  }, []);
}
