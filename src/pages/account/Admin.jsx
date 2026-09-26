// /admin : tableau de bord de Défar (réservé aux comptes administrateurs).
import { useCallback, useEffect, useState } from 'react';
import { Logo, I, Button, ToastProvider, useToast } from '../../ui/kit.jsx';
import { Link, go, useRoute } from '../../router.jsx';
import { BRAND } from '../../config.js';
import { cloudEnabled, useAuth, adminStats, adminUsers, adminSites, adminGrant, adminSetPlan, adminFeedback, publicSiteUrl, normPhone, getClient } from '../../lib/cloud.js';
import { AccountMenu, loginUrl } from '../../ui/account.jsx';
import { PLAN_LABELS } from '../../../shared/plans.js';

const TABS = [
  ['apercu', 'Vue d\'ensemble', 'chart-bar'],
  ['comptes', 'Comptes', 'users'],
  ['sites', 'Sites', 'globe'],
  ['avis', 'Avis', 'star'],
];
const d = (x) => (x ? new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—');

export default function Admin() {
  return (
    <ToastProvider>
      <AdminInner />
    </ToastProvider>
  );
}

function AdminInner() {
  const { search } = useRoute();
  const tab = TABS.some((t) => t[0] === search.get('tab')) ? search.get('tab') : 'apercu';
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const profile = useAuth((s) => s.profile);
  useEffect(() => {
    document.title = `Administration — ${BRAND.name}`;
    useAuth.getState().init();
  }, []);
  useEffect(() => {
    if (cloudEnabled && ready && !user) go(loginUrl('/admin', false), { replace: true });
  }, [ready, user]);

  if (!cloudEnabled || (ready && user && profile && !profile.is_admin)) {
    return (
      <div className="min-h-[100dvh] bg-ink text-sand flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Logo />
        <p className="text-sand/80 max-w-sm">{cloudEnabled ? 'Cette page est réservée à l\'administrateur de Défar.' : 'Branche la base de données (Supabase) pour activer l\'administration.'}</p>
        <Link to="/" className="h-11 px-5 rounded-xl bg-sand text-ink font-semibold flex items-center">
          Retour à l'accueil
        </Link>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-ink flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-sunset animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-[100dvh] bg-ink text-sand">
      <header className="sticky top-0 z-40 bg-ink/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-5 flex items-center gap-3">
          <Link to="/">
            <Logo size={28} />
          </Link>
          <span className="px-2 h-6 rounded-md bg-sunset/15 text-sunset text-[11px] font-bold uppercase tracking-[0.12em] flex items-center">Admin</span>
          <div className="flex-1" />
          <Link to="/espace" className="text-[13.5px] text-dune hover:text-sand hidden sm:inline">
            Mon espace
          </Link>
          <AccountMenu />
        </div>
        <nav className="max-w-7xl mx-auto flex gap-1 px-3 sm:px-5 pb-2 overflow-x-auto no-scrollbar">
          {TABS.map(([id, l, ic]) => (
            <button key={id} type="button" onClick={() => go(`/admin${id === 'apercu' ? '' : `?tab=${id}`}`, { replace: true })} className={`shrink-0 h-9 px-3.5 rounded-full text-[13.5px] inline-flex items-center gap-1.5 ${tab === id ? 'bg-sand text-ink font-semibold' : 'text-sand/70 hover:text-sand'}`}>
              <I n={ic} s={15} />
              {l}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-5 py-8">
        {tab === 'apercu' && <Overview />}
        {tab === 'comptes' && <Users />}
        {tab === 'sites' && <Sites />}
        {tab === 'avis' && <Feedback />}
      </main>
    </div>
  );
}

function Overview() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    adminStats().then(setS, (e) => setErr(e.message));
  }, []);
  if (err) return <p className="text-[#ff9aa8]">{err}</p>;
  const tiles = [
    ['Comptes', s?.users, 'users', s ? `+${s.users_7d} cette semaine` : ''],
    ['Actifs (7 jours)', s?.active_7d, 'activity'],
    ['Sites créés', s?.sites, 'layout-grid'],
    ['Sites en ligne', s?.published, 'globe'],
    ['Messages reçus', s?.submissions, 'message-circle', 'commandes, réservations…'],
    ['Avis', s?.feedback, 'star', s?.rating ? `note moyenne ${s.rating}/5` : ''],
    ['Crédits utilisés', s?.credits_spent, 'coins'],
  ];
  return (
    <div>
      <h1 className="font-display text-[48px] leading-none">Vue d'ensemble</h1>
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(([l, v, ic, hint]) => (
          <div key={l} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-dune text-[12.5px]">
              <I n={ic} s={15} />
              {l}
            </div>
            <p className="font-display text-[44px] leading-none mt-3 tabular-nums">{v ?? '…'}</p>
            {hint && <p className="text-[12px] text-dune/80 mt-1.5">{hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Users() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const load = useCallback((query) => adminUsers(query).then(setList, (e) => toast(e.message, 'error')), [toast]);
  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);
  const grant = async (u) => {
    const v = window.prompt(`Combien de crédits ajouter à ${u.email} ? (nombre négatif pour retirer)`, '50');
    const n = Number(v);
    if (!v || !Number.isFinite(n) || n === 0) return;
    try {
      const credits = await adminGrant(u.id, Math.round(n), 'Crédits offerts par Défar');
      setList((l) => l.map((x) => (x.id === u.id ? { ...x, credits } : x)));
      toast(`${u.email} : ${credits} crédits`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const plan = async (u, p) => {
    try {
      await adminSetPlan(u.id, p);
      setList((l) => l.map((x) => (x.id === u.id ? { ...x, plan: p } : x)));
      toast('Forfait modifié');
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <h1 className="font-display text-[48px] leading-none">Comptes {list && <span className="text-dune text-[28px]">{list.length}</span>}</h1>
        <div className="relative md:w-80">
          <I n="search" s={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dune" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail ou téléphone" className="w-full h-11 rounded-xl bg-white/[0.05] border border-white/10 pl-10 pr-3 text-[14px] outline-none focus:border-sunset/60" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {!list
          ? [0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />)
          : list.map((u) => (
              <div key={u.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {u.full_name || '—'} {u.is_admin && <span className="ml-1 text-[10.5px] px-1.5 py-0.5 rounded bg-sunset/20 text-sunset align-middle">ADMIN</span>}
                  </p>
                  <p className="text-[13px] text-dune truncate">
                    {u.email}
                    {u.phone && (
                      <>
                        {' · '}
                        <a href={`https://wa.me/${normPhone(u.phone)}`} target="_blank" rel="noreferrer" className="hover:text-sand">
                          {u.phone}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="text-[12px] text-dune/80 mt-0.5">
                    Inscrit le {d(u.created_at)} · vu le {d(u.last_seen_at)} · {u.sites} site{u.sites > 1 ? 's' : ''} dont {u.published} en ligne
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-9 px-3 rounded-xl bg-white/[0.05] text-[13.5px] font-semibold inline-flex items-center gap-1.5 tabular-nums">
                    <I n="coins" s={15} className="text-gold" /> {u.credits}
                  </span>
                  <Button variant="subtle" size="sm" className="!h-9" icon="plus" onClick={() => grant(u)}>
                    Crédits
                  </Button>
                  <select value={u.plan} onChange={(e) => plan(u, e.target.value)} className="h-9 rounded-xl bg-white/[0.05] border border-white/10 px-2 text-[13px] outline-none">
                    {Object.entries(PLAN_LABELS).map(([k, l]) => (
                      <option key={k} value={k} className="bg-ink-2">
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

function Sites() {
  const [list, setList] = useState(null);
  useEffect(() => {
    adminSites().then(setList, () => setList([]));
  }, []);
  return (
    <div>
      <h1 className="font-display text-[48px] leading-none">Sites {list && <span className="text-dune text-[28px]">{list.length}</span>}</h1>
      <div className="mt-6 space-y-2">
        {!list
          ? [0, 1].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />)
          : list.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.name}</p>
                  <p className="text-[12.5px] text-dune truncate">
                    {s.owner_email} · modifié le {d(s.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-dune">
                  <span>{s.views} vues</span>
                  <span>{s.submissions} messages</span>
                  {s.published ? (
                    <a href={publicSiteUrl(s.slug)} target="_blank" rel="noreferrer" className="h-8 px-3 rounded-lg bg-baobab/15 text-baobab font-medium inline-flex items-center gap-1">
                      /{s.slug} <I n="arrow-up-right" s={14} />
                    </a>
                  ) : (
                    <span className="h-8 px-3 rounded-lg bg-white/[0.05] inline-flex items-center">Brouillon</span>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

function Feedback() {
  const toast = useToast();
  const [list, setList] = useState(null);
  useEffect(() => {
    adminFeedback().then(setList, () => setList([]));
  }, []);
  const remove = async (f) => {
    if (!confirm('Supprimer cet avis ?')) return;
    const sb = await getClient();
    const { error } = await sb.from('feedback').delete().eq('id', f.id);
    if (error) return toast('Suppression impossible', 'error');
    setList((l) => l.filter((x) => x.id !== f.id));
  };
  const avg = list?.filter((f) => f.rating).reduce((a, f, _, arr) => a + f.rating / arr.length, 0);
  return (
    <div>
      <h1 className="font-display text-[48px] leading-none">
        Avis {list && <span className="text-dune text-[28px]">{list.length}</span>}
      </h1>
      {avg > 0 && <p className="text-dune mt-2">Note moyenne : <span className="text-sand font-semibold">{avg.toFixed(1)}/5</span></p>}
      <div className="mt-6 grid md:grid-cols-2 gap-3">
        {!list
          ? [0, 1].map((i) => <div key={i} className="h-28 rounded-2xl bg-white/[0.03] animate-pulse" />)
          : list.length === 0
            ? <p className="text-dune">Aucun avis pour l'instant.</p>
            : list.map((f) => (
                <div key={f.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <I key={n} n="star" s={16} className={n <= (f.rating || 0) ? 'text-gold' : 'text-white/15'} fill={n <= (f.rating || 0) ? 'currentColor' : 'none'} />
                      ))}
                    </span>
                    <button type="button" onClick={() => remove(f)} className="text-dune hover:text-ember" aria-label="Supprimer">
                      <I n="trash-2" s={15} />
                    </button>
                  </div>
                  {f.message && <p className="mt-3 text-[14.5px] text-sand/90 whitespace-pre-line">{f.message}</p>}
                  <p className="mt-3 text-[12px] text-dune">
                    {d(f.created_at)} · page {f.page || '/'}
                    {f.email ? ` · ${f.email}` : f.user_id ? ' · compte connecté' : ' · visiteur'}
                  </p>
                </div>
              ))}
      </div>
    </div>
  );
}
