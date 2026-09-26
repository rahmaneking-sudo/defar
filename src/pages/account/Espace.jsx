// /espace : l'espace client — mes sites, messages reçus, crédits, compte.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo, I, Button, Menu, MenuItem, ToastProvider, useToast } from '../../ui/kit.jsx';
import { Link, go, useRoute } from '../../router.jsx';
import { BRAND } from '../../config.js';
import { cloudEnabled, useAuth, listSites, deleteSite, listSubmissions, setSubmissionStatus, deleteSubmission, listCreditEvents, updateProfile, updatePassword, signOut, publicSiteUrl, normPhone } from '../../lib/cloud.js';
import { deleteProject } from '../../lib/specs.js';
import { PublishModal } from '../../ui/PublishModal.jsx';
import { AccountMenu, CreditsPill, FeedbackModal, loginUrl } from '../../ui/account.jsx';
import { TRIAL, COSTS, PLAN_LABELS, PLAN_SITE_LIMIT, WELCOME_CREDITS } from '../../../shared/plans.js';
import { formatMoney } from '../../../shared/utils.js';

const TABS = [
  { id: 'sites', label: 'Mes sites', icon: 'layout-grid' },
  { id: 'messages', label: 'Messages', icon: 'message-circle' },
  { id: 'credits', label: 'Crédits', icon: 'coins' },
  { id: 'compte', label: 'Compte', icon: 'user' },
];

export default function Espace() {
  return (
    <ToastProvider>
      <EspaceInner />
    </ToastProvider>
  );
}

function EspaceInner() {
  const { search } = useRoute();
  const tab = TABS.some((t) => t.id === search.get('tab')) ? search.get('tab') : 'sites';
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const profile = useAuth((s) => s.profile);
  const [sites, setSites] = useState(null);
  const [subs, setSubs] = useState(null);
  const [feedback, setFeedback] = useState(false);

  useEffect(() => {
    document.title = `Mon espace — ${BRAND.name}`;
    useAuth.getState().init();
  }, []);
  useEffect(() => {
    if (cloudEnabled && ready && !user) go(loginUrl('/espace', false), { replace: true });
  }, [ready, user]);

  const reload = useCallback(async () => {
    const [a, b] = await Promise.allSettled([listSites(), listSubmissions()]);
    setSites(a.status === 'fulfilled' ? a.value : []);
    setSubs(b.status === 'fulfilled' ? b.value : []);
    useAuth.getState().refreshProfile();
  }, []);
  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  const unread = (subs || []).filter((s) => s.status === 'nouveau').length;
  const setTab = (id) => go(`/espace${id === 'sites' ? '' : `?tab=${id}`}`, { replace: true });

  if (!cloudEnabled) {
    return (
      <div className="min-h-[100dvh] bg-ink text-sand flex flex-col items-center justify-center gap-5 p-8 text-center">
        <Logo />
        <p className="text-sand/80 max-w-sm">Les comptes arrivent bientôt. En attendant, tes maquettes sont enregistrées sur cet appareil.</p>
        <Link to="/studio" className="h-11 px-5 rounded-xl bg-sand text-ink font-semibold flex items-center">
          Ouvrir le studio
        </Link>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-ink flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-sunset animate-spin" />
      </div>
    );
  }

  const first = (profile?.full_name || '').split(' ')[0];
  return (
    <div className="min-h-[100dvh] bg-ink text-sand">
      <header className="sticky top-0 z-40 bg-ink/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-5 flex items-center gap-3">
          <Link to="/" aria-label="Accueil">
            <Logo size={28} />
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`relative h-10 px-3.5 rounded-xl text-[14px] inline-flex items-center gap-2 ${tab === t.id ? 'text-sand bg-white/[0.07]' : 'text-sand/65 hover:text-sand'}`} data-testid={`tab-${t.id}`}>
                {t.label}
                {t.id === 'messages' && unread > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-sunset text-white text-[11px] font-bold flex items-center justify-center">{unread}</span>}
              </button>
            ))}
          </nav>
          <div className="flex-1" />
          <CreditsPill compact />
          <Button variant="accent" size="sm" icon="plus" onClick={() => go('/studio')} className="hidden sm:inline-flex" data-testid="new-site">
            Nouveau site
          </Button>
          <AccountMenu onFeedback={() => setFeedback(true)} />
        </div>
        <nav className="md:hidden flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`shrink-0 h-9 px-3.5 rounded-full text-[13.5px] inline-flex items-center gap-1.5 ${tab === t.id ? 'bg-sand text-ink font-semibold' : 'text-sand/70 bg-white/[0.05]'}`}>
              <I n={t.icon} s={15} />
              {t.label}
              {t.id === 'messages' && unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-sunset text-white text-[10.5px] font-bold flex items-center justify-center">{unread}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-5 pt-8 pb-24">
        {tab === 'sites' && <SitesTab first={first} sites={sites} setSites={setSites} subs={subs} onFeedback={() => setFeedback(true)} onGoMessages={() => setTab('messages')} />}
        {tab === 'messages' && <MessagesTab subs={subs} setSubs={setSubs} sites={sites} />}
        {tab === 'credits' && <CreditsTab />}
        {tab === 'compte' && <AccountTab />}
      </main>
      <button type="button" onClick={() => go('/studio')} className="sm:hidden fixed right-4 bottom-5 z-30 h-14 px-5 rounded-full text-white text-[15px] font-semibold inline-flex items-center gap-2 bg-[linear-gradient(135deg,#ff7a3d,#ff4d5e_55%,#c8367c)] shadow-[0_14px_40px_-10px_rgba(255,77,94,0.9)]">
        <I n="plus" s={19} /> Nouveau site
      </button>
      <FeedbackModal open={feedback} onClose={() => setFeedback(false)} />
    </div>
  );
}

// ───────────────────────── Mes sites ─────────────────────────
function Stat({ label, value, icon, hint }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-dune text-[12.5px]">
        <I n={icon} s={15} />
        {label}
      </div>
      <p className="font-display text-[34px] leading-none mt-3 tabular-nums">{value}</p>
      {hint && <p className="text-[11.5px] text-dune/80 mt-1.5">{hint}</p>}
    </div>
  );
}

function SitesTab({ first, sites, setSites, subs, onFeedback, onGoMessages }) {
  const profile = useAuth((s) => s.profile);
  const toast = useToast();
  const [publishing, setPublishing] = useState(null);
  const published = (sites || []).filter((s) => s.published);
  const views = (sites || []).reduce((n, s) => n + (s.views || 0), 0);
  const unread = (subs || []).filter((s) => s.status === 'nouveau').length;
  const limit = PLAN_SITE_LIMIT[profile?.plan || 'essai'] ?? 3;

  const remove = async (s) => {
    if (!confirm(`Supprimer définitivement « ${s.name} » ?${s.published ? ' Le site sera aussi retiré d\'Internet.' : ''}`)) return;
    try {
      await deleteSite(s.id);
      deleteProject(s.id);
      setSites((l) => l.filter((x) => x.id !== s.id));
      toast('Site supprimé');
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const copy = async (s) => {
    const url = publicSiteUrl(s.slug);
    try {
      await navigator.clipboard.writeText(url);
      toast('Lien copié');
    } catch {
      window.prompt('Adresse du site :', url);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[44px] md:text-[54px] leading-[0.95]">{first ? `Bonjour ${first}` : 'Mon espace'}</h1>
          <p className="text-dune mt-2 text-[15px]">Tes sites, tes messages et tes crédits, au même endroit.</p>
        </div>
      </div>

      {TRIAL && (
        <div className="mt-7 relative overflow-hidden rounded-3xl border border-baobab/30 bg-[linear-gradient(120deg,rgba(63,191,143,0.14),rgba(63,191,143,0.03))] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-11 h-11 rounded-2xl bg-baobab/20 text-baobab flex items-center justify-center shrink-0">
            <I n="sparkles" s={20} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-[15px]">Phase d'essai : tout est gratuit</p>
            <p className="text-[13.5px] text-sand/75 mt-0.5">Crée, publie et teste librement. Ton avis nous aide à préparer la version finale.</p>
          </div>
          <Button variant="subtle" icon="star" onClick={onFeedback}>
            Donner mon avis
          </Button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Sites" icon="layout-grid" value={sites ? sites.length : '…'} />
        <Stat label="En ligne" icon="globe" value={sites ? `${published.length}/${limit}` : '…'} hint={`Forfait ${PLAN_LABELS[profile?.plan] || 'Essai'}`} />
        <Stat label="Visites" icon="eye" value={sites ? views.toLocaleString('fr-FR') : '…'} />
        <button type="button" onClick={onGoMessages} className="text-left block w-full h-full [&>div]:h-full">
          <Stat label="Nouveaux messages" icon="message-circle" value={subs ? unread : '…'} hint={unread ? 'Voir les messages →' : undefined} />
        </button>
      </div>

      <h2 className="text-[13px] uppercase tracking-[0.16em] text-dune mt-12 mb-4">Mes sites</h2>
      {!sites ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[268px] rounded-3xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <EmptySites />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button type="button" onClick={() => go('/studio')} className="hidden sm:flex min-h-[268px] rounded-3xl border-2 border-dashed border-white/[0.1] hover:border-sunset/60 text-dune hover:text-sand flex-col items-center justify-center gap-3 transition-colors">
            <span className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center">
              <I n="plus" s={24} />
            </span>
            <span className="text-[15px] font-medium">Nouveau site</span>
            <span className="text-[12.5px] text-dune">Avec l'IA ou depuis un modèle</span>
          </button>
          {sites.map((s, i) => (
            <motion.article key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04 }} className="group rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden flex flex-col" data-testid="site-card">
              <button type="button" onClick={() => go(`/studio?id=${s.id}`)} className="relative h-40 overflow-hidden text-left" style={{ background: `linear-gradient(135deg, ${s.color || '#ff6a3d'}, #15131c)` }}>
                {s.cover && <img src={s.cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <span className={`absolute left-3.5 top-3.5 px-2.5 h-7 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 backdrop-blur ${s.published ? 'bg-baobab/90 text-ink' : 'bg-ink/60 text-sand/85 border border-white/15'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.published ? 'bg-ink' : 'bg-sand/60'}`} />
                  {s.published ? 'En ligne' : 'Brouillon'}
                </span>
                <span className="absolute left-4 bottom-3 right-4 font-semibold text-[17px] text-white truncate">{s.name}</span>
              </button>
              <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
                <p className="text-[12.5px] text-dune truncate">
                  {s.published ? (
                    <a href={publicSiteUrl(s.slug)} target="_blank" rel="noreferrer" className="hover:text-sand">
                      {publicSiteUrl(s.slug).replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    `Modifié le ${new Date(s.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                  )}
                </p>
                {s.published && <p className="text-[12px] text-dune/80 mt-1">{(s.views || 0).toLocaleString('fr-FR')} visite{s.views > 1 ? 's' : ''}</p>}
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <Button variant="subtle" size="sm" icon="pencil" onClick={() => go(`/studio?id=${s.id}`)} className="flex-1">
                    Modifier
                  </Button>
                  {s.published ? (
                    <a href={publicSiteUrl(s.slug)} target="_blank" rel="noreferrer" className="h-8 px-3 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] flex-1 justify-center">
                      <I n="arrow-up-right" s={15} /> Voir
                    </a>
                  ) : (
                    <Button variant="accent" size="sm" icon="globe" onClick={() => setPublishing(s)} className="flex-1">
                      Publier
                    </Button>
                  )}
                  <Menu
                    width={230}
                    button={(toggle) => (
                      <button type="button" onClick={toggle} className="w-8 h-8 rounded-lg text-sand/70 hover:text-sand hover:bg-white/[0.07] flex items-center justify-center" aria-label="Plus d'actions">
                        <I n="menu" s={16} />
                      </button>
                    )}
                  >
                    <MenuItem icon={s.published ? 'refresh-cw' : 'globe'} onClick={() => setPublishing(s)}>
                      {s.published ? 'Mettre à jour / adresse' : 'Publier'}
                    </MenuItem>
                    {s.published && (
                      <MenuItem icon="copy" onClick={() => copy(s)}>
                        Copier le lien
                      </MenuItem>
                    )}
                    <MenuItem icon="trash-2" danger onClick={() => remove(s)}>
                      Supprimer
                    </MenuItem>
                  </Menu>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
      <PublishModal open={!!publishing} site={publishing} onClose={() => setPublishing(null)} onChange={(next) => (setSites((l) => l.map((x) => (x.id === next.id ? { ...x, ...next } : x))), setPublishing((p) => (p ? { ...p, ...next } : p)))} />
    </div>
  );
}

function EmptySites() {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_top,rgba(255,106,61,0.12),transparent_60%)] px-6 py-14 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.06] flex items-center justify-center">
        <I n="wand-sparkles" s={28} className="text-sunset" />
      </div>
      <h3 className="font-display text-[34px] leading-none mt-6">Ton premier site t'attend</h3>
      <p className="text-dune mt-3 max-w-md mx-auto text-[14.5px]">Décris ton activité en une phrase : l'IA crée ton site complet. Ou pars d'un de nos 18 modèles par métier.</p>
      <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center">
        <Button variant="accent" size="lg" icon="wand-sparkles" onClick={() => go('/studio')}>
          Créer avec l'IA
        </Button>
        <Button variant="outline" size="lg" icon="layout-grid" onClick={() => go('/galerie')}>
          Voir les modèles
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── Messages ─────────────────────────
const KIND = {
  commande: { label: 'Commande', icon: 'shopping-bag', color: '#ff6a3d' },
  reservation: { label: 'Réservation', icon: 'calendar', color: '#37c6e8' },
  message: { label: 'Message', icon: 'message-circle', color: '#3fbf8f' },
  abonnement: { label: 'Abonnement', icon: 'crown', color: '#f2b544' },
  inscription: { label: 'Inscription', icon: 'user', color: '#d8407a' },
};
const LABELS = { ref: 'Référence', nom: 'Nom', telephone: 'Téléphone', email: 'E-mail', adresse: 'Adresse', service: 'Prestation', prix: 'Prix', date: 'Date', creneau: 'Heure', avec: 'Avec', personnes: 'Personnes', offre: 'Offre', livraison: 'Livraison', paiement: 'Paiement souhaité', message: 'Message', note: 'Note' };
const ORDER = ['nom', 'telephone', 'email', 'adresse', 'service', 'prix', 'offre', 'date', 'creneau', 'avec', 'personnes', 'livraison', 'paiement', 'ref', 'message', 'note'];
const MONEY_KEYS = new Set(['prix', 'livraison']);

function ago(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'à l\'instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function MessagesTab({ subs, setSubs, sites }) {
  const toast = useToast();
  const [filter, setFilter] = useState('tous');
  const names = useMemo(() => Object.fromEntries((sites || []).map((s) => [s.id, s.name])), [sites]);
  const list = (subs || []).filter((m) => (filter === 'tous' ? true : filter === 'nouveau' ? m.status === 'nouveau' : m.kind === filter));
  const counts = useMemo(() => {
    const c = { tous: (subs || []).length, nouveau: 0 };
    for (const m of subs || []) {
      c[m.kind] = (c[m.kind] || 0) + 1;
      if (m.status === 'nouveau') c.nouveau++;
    }
    return c;
  }, [subs]);

  // les nouveaux messages affichés passent en « lu » après quelques secondes
  useEffect(() => {
    const fresh = (subs || []).filter((m) => m.status === 'nouveau');
    if (!fresh.length) return;
    const t = setTimeout(() => {
      fresh.forEach((m) => setSubmissionStatus(m.id, 'lu').catch(() => {}));
      setSubs((l) => l.map((m) => (m.status === 'nouveau' ? { ...m, status: 'lu', fresh: true } : m)));
    }, 3500);
    return () => clearTimeout(t);
  }, [subs, setSubs]);

  const setStatus = async (m, status) => {
    try {
      await setSubmissionStatus(m.id, status);
      setSubs((l) => l.map((x) => (x.id === m.id ? { ...x, status } : x)));
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const remove = async (m) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await deleteSubmission(m.id);
      setSubs((l) => l.filter((x) => x.id !== m.id));
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <h1 className="font-display text-[44px] md:text-[54px] leading-[0.95]">Messages reçus</h1>
      <p className="text-dune mt-2 text-[15px]">Commandes, réservations et messages envoyés depuis tes sites.</p>
      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          ['tous', 'Tous'],
          ['nouveau', 'Nouveaux'],
          ['commande', 'Commandes'],
          ['reservation', 'Réservations'],
          ['message', 'Messages'],
        ].map(([id, l]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} className={`shrink-0 h-9 px-3.5 rounded-full text-[13.5px] inline-flex items-center gap-1.5 border ${filter === id ? 'bg-sand text-ink border-sand font-semibold' : 'border-white/10 text-sand/75 hover:text-sand'}`}>
            {l}
            {counts[id] > 0 && <span className={`text-[11.5px] ${filter === id ? 'text-ink/60' : 'text-dune'}`}>{counts[id]}</span>}
          </button>
        ))}
      </div>
      {!subs ? (
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 rounded-3xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-white/[0.08] px-6 py-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.05] flex items-center justify-center">
            <I n="message-circle" s={24} className="text-dune" />
          </div>
          <p className="font-semibold mt-5">Aucun message {filter !== 'tous' ? 'dans cette catégorie' : 'pour l\'instant'}</p>
          <p className="text-dune text-[14px] mt-2 max-w-sm mx-auto">Quand un visiteur commande, réserve ou t'écrit depuis ton site, tout arrive ici.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <AnimatePresence initial={false}>
            {list.map((m) => (
              <SubmissionCard key={m.id} m={m} site={names[m.site_id]} onStatus={setStatus} onDelete={remove} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ m, site, onStatus, onDelete }) {
  const k = KIND[m.kind] || KIND.message;
  const d = m.data || {};
  const phone = normPhone(d.telephone);
  const keys = [...ORDER.filter((x) => d[x] !== undefined && d[x] !== ''), ...Object.keys(d).filter((x) => !ORDER.includes(x) && !['articles', 'total', 'devise', 'champs'].includes(x))];
  const champs = d.champs && typeof d.champs === 'object' ? Object.entries(d.champs) : [];
  const money = (n) => formatMoney(Number(n) || 0, d.devise || 'FCFA');
  const reply = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Bonjour ${d.nom || ''}, merci pour votre ${k.label.toLowerCase()} sur ${site || 'notre site'} !`)}` : '';
  const done = m.status === 'traite';
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className={`rounded-3xl border p-5 ${m.status === 'nouveau' || m.fresh ? 'border-sunset/40 bg-sunset/[0.05]' : 'border-white/[0.08] bg-white/[0.02]'} ${done ? 'opacity-60' : ''}`} data-testid="submission">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${k.color}22`, color: k.color }}>
          <I n={k.icon} s={18} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] flex flex-wrap items-center gap-x-2">
            {k.label}
            {d.nom && <span className="font-normal text-sand/80">de {d.nom}</span>}
            {(m.status === 'nouveau' || m.fresh) && <span className="px-2 h-5 rounded-full bg-sunset text-white text-[10.5px] font-bold flex items-center">NOUVEAU</span>}
            {done && <span className="px-2 h-5 rounded-full bg-baobab/20 text-baobab text-[10.5px] font-bold flex items-center">TRAITÉ</span>}
          </p>
          <p className="text-[12.5px] text-dune">
            {site || 'Site supprimé'} · {ago(m.created_at)}
          </p>
        </div>
        {Number(d.total) > 0 && <p className="font-display text-[26px] leading-none shrink-0">{money(d.total)}</p>}
      </div>
      {Array.isArray(d.articles) && d.articles.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.05]">
          {d.articles.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
              <span className="truncate">
                <span className="text-dune">{a.quantite || 1} ×</span> {a.titre}
              </span>
              {Number(a.prix) > 0 && <span className="shrink-0 tabular-nums">{money(a.prix)}</span>}
            </div>
          ))}
        </div>
      )}
      <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
        {keys.map((key) => (
          <div key={key} className={`min-w-0 ${key === 'message' || key === 'note' || key === 'adresse' ? 'sm:col-span-2' : ''}`}>
            <dt className="text-[11.5px] uppercase tracking-[0.1em] text-dune">{LABELS[key] || key}</dt>
            <dd className="text-sand/90 break-words whitespace-pre-line">{MONEY_KEYS.has(key) ? money(d[key]) : typeof d[key] === 'object' ? JSON.stringify(d[key]) : String(d[key])}</dd>
          </div>
        ))}
        {champs.map(([label, v]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11.5px] uppercase tracking-[0.1em] text-dune">{label}</dt>
            <dd className="text-sand/90 break-words">{String(v)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {reply && (
          <a href={reply} target="_blank" rel="noreferrer" className="h-9 px-3.5 rounded-xl text-[13.5px] font-semibold inline-flex items-center gap-1.5 text-white bg-[#25D366] hover:brightness-110">
            <I n="message-circle" s={16} /> Répondre sur WhatsApp
          </a>
        )}
        {phone && (
          <a href={`tel:+${phone}`} className="h-9 px-3.5 rounded-xl text-[13.5px] inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1]">
            <I n="phone" s={15} /> Appeler
          </a>
        )}
        <Button variant="subtle" size="sm" className="!h-9" icon={done ? 'rotate-ccw' : 'check'} onClick={() => onStatus(m, done ? 'lu' : 'traite')}>
          {done ? 'Rouvrir' : 'Marquer comme traité'}
        </Button>
        <Button variant="ghost" size="sm" className="!h-9" icon="trash-2" onClick={() => onDelete(m)}>
          Supprimer
        </Button>
      </div>
    </motion.article>
  );
}

// ───────────────────────── Crédits ─────────────────────────
function CreditsTab() {
  const profile = useAuth((s) => s.profile);
  const [events, setEvents] = useState(null);
  useEffect(() => {
    listCreditEvents().then(setEvents, () => setEvents([]));
  }, [profile?.credits]);
  const msg = `Bonjour, je teste ${BRAND.name} (${profile?.email || ''}) et j'aimerais recevoir plus de crédits.`;
  return (
    <div>
      <h1 className="font-display text-[44px] md:text-[54px] leading-[0.95]">Mes crédits</h1>
      <div className="mt-7 grid lg:grid-cols-[1.1fr_1fr] gap-4">
        <div className="relative overflow-hidden rounded-3xl p-7 border border-white/[0.08] bg-[linear-gradient(150deg,#221b24,#131218)]">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-40" style={{ background: 'radial-gradient(closest-side, #f2b544, transparent)' }} />
          <p className="relative text-[12px] uppercase tracking-[0.2em] text-gold">Solde</p>
          <p className="relative font-display text-[84px] leading-none mt-3 tabular-nums" data-testid="credits-balance">
            {profile?.credits ?? '…'}
          </p>
          <p className="relative text-sand/70 mt-2">
            crédits · forfait <span className="text-sand">{PLAN_LABELS[profile?.plan] || 'Essai'}</span>
          </p>
          <div className="relative mt-7 flex flex-col sm:flex-row gap-2">
            <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="h-11 px-5 rounded-2xl inline-flex items-center justify-center gap-2 text-[14.5px] font-semibold text-white bg-[#25D366] hover:brightness-110">
              <I n="message-circle" s={17} /> {TRIAL ? 'Demander des crédits' : 'Recharger'}
            </a>
            <Link to="/tarifs" className="h-11 px-5 rounded-2xl inline-flex items-center justify-center gap-2 text-[14.5px] font-medium bg-white/[0.07] hover:bg-white/[0.12]">
              Voir les forfaits
            </Link>
          </div>
          {TRIAL && <p className="relative text-[12.5px] text-dune mt-4">Phase d'essai : {WELCOME_CREDITS} crédits offerts à l'inscription, et plus sur simple demande.</p>}
        </div>
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
          <p className="font-semibold">À quoi servent les crédits ?</p>
          <div className="mt-4 space-y-3 text-[14px]">
            {[
              ['wand-sparkles', 'Créer une app avec l\'IA', `${COSTS.create} crédits`],
              ['pencil', 'Modifier avec l\'IA', `${COSTS.edit} crédit`],
              ['layout-grid', 'Partir d\'un modèle', 'Gratuit'],
              ['globe', 'Publier et mettre à jour', 'Gratuit'],
            ].map(([ic, l, v]) => (
              <div key={l} className="flex items-center gap-3">
                <I n={ic} s={16} className="text-dune" />
                <span className="flex-1 text-sand/85">{l}</span>
                <span className={`font-semibold ${v === 'Gratuit' ? 'text-baobab' : ''}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h2 className="text-[13px] uppercase tracking-[0.16em] text-dune mt-12 mb-4">Historique</h2>
      <div className="rounded-3xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
        {!events ? (
          <div className="h-24 animate-pulse bg-white/[0.02]" />
        ) : events.length === 0 ? (
          <p className="p-6 text-dune text-[14px]">Aucune opération pour l'instant.</p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${e.delta > 0 ? 'bg-baobab/15 text-baobab' : 'bg-white/[0.05] text-dune'}`}>
                <I n={e.delta > 0 ? 'gift' : 'wand-sparkles'} s={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] truncate">{e.reason || (e.delta > 0 ? 'Crédits ajoutés' : 'Crédits utilisés')}</p>
                <p className="text-[12px] text-dune">{new Date(e.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className={`font-semibold tabular-nums ${e.delta > 0 ? 'text-baobab' : ''}`}>
                {e.delta > 0 ? '+' : ''}
                {e.delta}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Compte ─────────────────────────
function AccountTab() {
  const user = useAuth((s) => s.user);
  const profile = useAuth((s) => s.profile);
  const toast = useToast();
  const [f, setF] = useState({ full_name: '', phone: '' });
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => {
    if (profile) setF({ full_name: profile.full_name || '', phone: profile.phone || '' });
  }, [profile]);
  const box = 'w-full h-12 rounded-2xl bg-white/[0.05] border border-white/10 px-4 text-[15px] text-sand placeholder:text-dune/60 outline-none focus:border-sunset/70';
  const save = async () => {
    setBusy('profile');
    try {
      await updateProfile(f);
      toast('Informations enregistrées');
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy('');
  };
  const changePw = async () => {
    if (pw.length < 6) return toast('6 caractères minimum', 'error');
    setBusy('pw');
    try {
      await updatePassword(pw);
      setPw('');
      toast('Mot de passe modifié');
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy('');
  };
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-[44px] md:text-[54px] leading-[0.95]">Mon compte</h1>
      <section className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3">
        <p className="font-semibold mb-1">Mes informations</p>
        <label className="block">
          <span className="block text-[12.5px] text-dune mb-1.5">Prénom et nom</span>
          <input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className={box} />
        </label>
        <label className="block">
          <span className="block text-[12.5px] text-dune mb-1.5">Numéro WhatsApp</span>
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" placeholder="77 123 45 67" className={box} />
        </label>
        <label className="block">
          <span className="block text-[12.5px] text-dune mb-1.5">E-mail</span>
          <input value={user?.email || ''} disabled className={`${box} opacity-60`} />
        </label>
        <Button variant="primary" loading={busy === 'profile'} onClick={save}>
          Enregistrer
        </Button>
      </section>
      <section className="mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3">
        <p className="font-semibold mb-1">Mot de passe</p>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nouveau mot de passe" autoComplete="new-password" className={box} />
        <Button variant="subtle" loading={busy === 'pw'} onClick={changePw}>
          Changer le mot de passe
        </Button>
      </section>
      <section className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button variant="outline" size="lg" icon="log-out" onClick={async () => (await signOut(), go('/'))}>
          Se déconnecter
        </Button>
        <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite supprimer mon compte ${BRAND.name} (${user?.email}).`)}`} target="_blank" rel="noreferrer" className="h-12 px-5 rounded-2xl inline-flex items-center justify-center text-[14px] text-dune hover:text-[#ff9aa8]">
          Supprimer mon compte
        </a>
      </section>
    </div>
  );
}
