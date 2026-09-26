// ─────────────────────────────────────────────────────────────────────────────
// STUDIO : génération par IA, aperçu interactif, édition précise, export.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStudio } from './store.js';
import { AIPanel, ScreensPanel, StylePanel } from './panels.jsx';
import { Inspector } from './Inspector.jsx';
import { GenerateOverlay } from './GenerateOverlay.jsx';
import { copyShareLink, downloadHtml, downloadClientPack, downloadJson } from './export.js';
import { AppPlayer, FitPhone, FitDesktop } from '../engine/Player.jsx';
import { ToastProvider, useToast, Logo, I, IconBtn, Button, Menu, MenuItem, Segmented, Modal, inputCls } from '../ui/kit.jsx';
import { useRoute, go, Link } from '../router.jsx';
import { generateSpec, aiStatus, localSpec, listProjects, getProject, deleteProject, setAccessCode, shareUrl } from '../lib/specs.js';
import { EXAMPLES, CATEGORY_INFO } from '../config.js';
import { TEMPLATES } from '../../shared/generator/templates.js';
import { cloudEnabled, useAuth, getSite, listSites, deleteSite, newId, publicSiteUrl, slugify as slugifyName } from '../lib/cloud.js';
import { useSync, flushCloudSave } from './sync.js';
import { PublishModal } from '../ui/PublishModal.jsx';
import { AccountMenu, CreditsPill, CreditsModal, FeedbackModal, loginUrl } from '../ui/account.jsx';
import { COSTS } from '../../shared/plans.js';

function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

export default function Studio() {
  return (
    <ToastProvider>
      <StudioInner />
    </ToastProvider>
  );
}

function StudioInner() {
  const { search } = useRoute();
  const spec = useStudio((s) => s.spec);
  const load = useStudio((s) => s.load);
  const authReady = useAuth((s) => s.ready);
  const toast = useToast();
  const [gen, setGen] = useState(null);
  const [ai, setAi] = useState(null);
  const [askCode, setAskCode] = useState(null);
  const [credits, setCredits] = useState(null);
  const [start, setStart] = useState(false);
  const [opening, setOpening] = useState(false);
  const booted = useRef(false);

  useEffect(() => {
    aiStatus().then(setAi);
    useAuth.getState().init();
  }, []);

  const openLogin = useCallback((next) => go(loginUrl(next || location.pathname + location.search)), []);

  const generate = useCallback(
    async (idea) => {
      // Avec les comptes : il faut être connecté pour utiliser l'IA (crédits)
      if (cloudEnabled && !useAuth.getState().user) return openLogin(`/studio?idea=${encodeURIComponent(idea)}`);
      setStart(false);
      setGen({ idea, done: false });
      const r = await generateSpec({ idea });
      if (r.needsCode) {
        setGen(null);
        setAskCode(() => () => generate(idea));
        return;
      }
      if (r.needsLogin) {
        setGen(null);
        return openLogin(`/studio?idea=${encodeURIComponent(idea)}`);
      }
      if (r.needsCredits) {
        setGen(null);
        setStart(!useStudio.getState().spec);
        setCredits({ need: r.cost || COSTS.create });
        return;
      }
      setGen({ idea, done: true, result: r });
    },
    [openLogin]
  );

  const finishGen = () => {
    const r = gen?.result;
    if (r?.spec) {
      const id = load({ id: newId(), idea: gen.idea, spec: r.spec });
      history.replaceState({}, '', `/studio?id=${id}`);
      if (r.fallback) toast(r.warning || 'Maquette créée à partir d\'un modèle', 'info');
      else toast(`Maquette générée en ${Math.round((r.ms || 0) / 1000)} s${r.cost ? ` · ${r.cost} crédits` : ''}`);
    }
    setGen(null);
  };

  const fromTemplate = useCallback(
    (cat) => {
      const s = localSpec(CATEGORY_INFO[cat]?.idea || `app ${cat}`, { category: cat });
      const id = load({ id: newId(), idea: s.meta.tagline, spec: s });
      setStart(false);
      history.replaceState({}, '', `/studio?id=${id}`);
    },
    [load]
  );

  // Ouvre un projet : d'abord dans le compte, sinon sur cet appareil
  const openProject = useCallback(
    async (id) => {
      setOpening(true);
      try {
        if (cloudEnabled && useAuth.getState().user) {
          const row = await getSite(id).catch(() => null);
          if (row) {
            load({ id: row.id, idea: row.idea, spec: row.spec, site: { slug: row.slug, published: row.published, settings: row.settings }, persist: false });
            setStart(false);
            history.replaceState({}, '', `/studio?id=${row.id}`);
            return true;
          }
        }
        const p = getProject(id);
        if (p) {
          const nid = load({ id: p.id, idea: p.idea, spec: p.spec });
          setStart(false);
          history.replaceState({}, '', `/studio?id=${nid}`);
          return true;
        }
        return false;
      } finally {
        setOpening(false);
      }
    },
    [load]
  );

  useEffect(() => {
    if (booted.current || (cloudEnabled && !authReady)) return;
    booted.current = true;
    const idea = search.get('idea');
    const tpl = search.get('tpl');
    const id = search.get('id');
    if (idea) return void generate(idea);
    if (tpl && TEMPLATES[tpl]) return void fromTemplate(tpl);
    if (id)
      openProject(id).then((ok) => {
        if (!ok) {
          toast('Projet introuvable sur cet appareil', 'error');
          setStart(true);
        }
      });
    else setStart(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  return (
    <div className="h-[100dvh] flex flex-col bg-ink text-sand overflow-hidden">
      {spec && !start ? (
        <Workspace ai={ai} onRegenerate={() => generate(useStudio.getState().idea || spec.meta.tagline)} onNew={() => setStart(true)} onNeedCode={() => setAskCode(() => () => {})} onNeedLogin={() => openLogin()} onNeedCredits={(need) => setCredits({ need })} />
      ) : start ? (
        <StartScreen onGenerate={generate} onOpen={openProject} onTemplate={fromTemplate} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-sunset animate-spin" />
        </div>
      )}
      {opening && (
        <div className="fixed inset-0 z-[150] bg-ink/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-sunset animate-spin" />
        </div>
      )}
      <AnimatePresence>{gen && <GenerateOverlay key="gen" idea={gen.idea} done={gen.done} onFinished={finishGen} />}</AnimatePresence>
      <AccessCodeModal open={!!askCode} onClose={() => setAskCode(null)} onSubmit={(code) => { setAccessCode(code); const retry = askCode; setAskCode(null); retry?.(); aiStatus().then(setAi); }} />
      <CreditsModal open={!!credits} need={credits?.need} onClose={() => setCredits(null)} />
    </div>
  );
}

// ───────────────────────── Espace de travail ─────────────────────────
function Workspace({ ai, onRegenerate, onNew, onNeedCode, onNeedLogin, onNeedCredits }) {
  const desktop = useMedia('(min-width: 1024px)');
  const wide = useMedia('(min-width: 1320px)');
  const spec = useStudio((s) => s.spec);
  const screenId = useStudio((s) => s.screenId);
  const selected = useStudio((s) => s.selected);
  const mode = useStudio((s) => s.mode);
  const device = useStudio((s) => s.device);
  const panel = useStudio((s) => s.panel);
  const site = useStudio((s) => s.site);
  const st = useStudio.getState;
  const [mobilePanel, setMobilePanel] = useState(null);
  const player = useRef(null);

  // raccourcis clavier
  useEffect(() => {
    const k = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        e.shiftKey ? st().redo() : st().undo();
      } else if (mod && e.key.toLowerCase() === 'y' && !typing) {
        e.preventDefault();
        st().redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && st().selected) {
        e.preventDefault();
        st().mutate((d) => {
          const sc = d.screens.find((x) => x.id === st().screenId);
          sc.blocks = sc.blocks.filter((b) => b.id !== st().selected);
        });
        st().select(null);
      } else if (e.key === 'Escape' && !typing) st().select(null);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [st]);

  const panels = {
    ai: <AIPanel ai={ai} onRegenerate={onRegenerate} onNeedCode={onNeedCode} onNeedLogin={onNeedLogin} onNeedCredits={() => onNeedCredits(COSTS.edit)} />,
    screens: <ScreensPanel />,
    style: <StylePanel />,
  };

  return (
    <>
      <TopBar onNew={onNew} compact={!desktop} onNeedLogin={onNeedLogin} />
      <div className="flex-1 min-h-0 flex">
        {desktop && (
          <aside className="w-[330px] shrink-0 border-r border-white/[0.07] flex bg-ink-2">
            <nav className="w-[58px] shrink-0 border-r border-white/[0.06] flex flex-col items-center gap-1 py-3">
              {[
                ['ai', 'wand-sparkles', 'IA'],
                ['screens', 'layers', 'Écrans'],
                ['style', 'palette', 'Style'],
              ].map(([id, icon, label]) => (
                <button key={id} type="button" onClick={() => st().setPanel(id)} className={`w-11 py-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-medium ${panel === id ? 'bg-white/[0.09] text-sand' : 'text-dune hover:text-sand'}`}>
                  <I n={icon} s={19} />
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex-1 min-w-0">{panels[panel]}</div>
          </aside>
        )}
        <main className="relative flex-1 min-w-0 flex flex-col" style={{ backgroundImage: 'radial-gradient(rgba(244,236,223,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
          {device === 'desktop' ? (
            <FitDesktop className="flex-1 min-h-0" pad={desktop ? 28 : 12} url={site?.published && site.slug ? publicSiteUrl(site.slug).replace(/^https?:\/\//, '') : `${location.host}/s/${spec.meta.name ? slugifyName(spec.meta.name) : 'mon-site'}`}>
              <AppPlayer
                ref={player}
                spec={spec}
                frame={false}
                web
                mode={mode}
                screenId={screenId}
                selectedBlock={selected}
                onSelectBlock={(id) => st().select(id)}
                onScreenChange={(id) => id !== st().screenId && useStudio.setState({ screenId: id })}
                style={{ width: '100%', height: '100%' }}
              />
            </FitDesktop>
          ) : (
            <FitPhone device={device} className="flex-1 min-h-0" pad={desktop ? 28 : 12}>
              <AppPlayer
                ref={player}
                spec={spec}
                device={device}
                mode={mode}
                screenId={screenId}
                selectedBlock={selected}
                onSelectBlock={(id) => st().select(id)}
                onScreenChange={(id) => id !== st().screenId && useStudio.setState({ screenId: id })}
              />
            </FitPhone>
          )}
          <div className={`absolute left-1/2 -translate-x-1/2 ${desktop ? 'bottom-4' : 'bottom-[76px]'} flex items-center gap-2 p-1.5 rounded-2xl bg-ink-3/90 backdrop-blur border border-white/10 shadow-xl`}>
            <Segmented value={mode} onChange={(v) => st().setMode(v)} options={[{ value: 'edit', label: 'Éditer', icon: 'pencil' }, { value: 'play', label: 'Tester', icon: 'play' }]} className="w-[210px]" />
            <IconBtn icon="smartphone" active={device !== 'desktop'} title={device === 'iphone' ? 'Téléphone (iPhone) · cliquer pour Android' : device === 'android' ? 'Téléphone (Android) · cliquer pour iPhone' : 'Aperçu téléphone'} onClick={() => st().setDevice(device === 'desktop' ? 'iphone' : device === 'iphone' ? 'android' : 'iphone')} />
            <IconBtn icon="laptop" active={device === 'desktop'} title="Aperçu ordinateur" onClick={() => st().setDevice('desktop')} />
            <IconBtn icon="refresh-cw" title="Recommencer le parcours" onClick={() => player.current?.reset()} />
          </div>
        </main>
        {desktop && (wide || selected) && (
          <aside className={`${wide ? 'relative' : 'absolute right-0 top-14 bottom-0 z-40 shadow-2xl'} w-[340px] shrink-0 border-l border-white/[0.07] bg-ink-2`}>
            <Inspector />
          </aside>
        )}
      </div>
      {!desktop && (
        <>
          <nav className="h-16 shrink-0 border-t border-white/[0.07] bg-ink-2 grid grid-cols-4">
            {[
              [null, 'smartphone', 'Aperçu'],
              ['ai', 'wand-sparkles', 'IA'],
              ['screens', 'layers', 'Écrans'],
              ['style', 'palette', 'Style'],
            ].map(([id, icon, label]) => (
              <button key={label} type="button" onClick={() => setMobilePanel(id)} className={`flex flex-col items-center justify-center gap-1 text-[11px] ${mobilePanel === id ? 'text-sand' : 'text-dune'}`}>
                <I n={icon} s={20} />
                {label}
              </button>
            ))}
          </nav>
          <AnimatePresence>
            {(mobilePanel || (selected && mode === 'edit')) && (
              <motion.div key="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }} className="fixed left-0 right-0 bottom-16 z-50 h-[62dvh] bg-ink-2 border-t border-white/10 rounded-t-3xl overflow-hidden shadow-2xl">
                <div className="flex justify-end px-2 pt-2 absolute right-0 top-0 z-10">
                  <IconBtn icon="x" title="Fermer" onClick={() => (setMobilePanel(null), st().select(null))} />
                </div>
                {selected && mode === 'edit' ? <Inspector onClose={() => st().select(null)} /> : panels[mobilePanel]}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}

// ───────────────────────── Barre du haut ─────────────────────────
function SaveStatus() {
  const status = useSync((s) => s.status);
  const user = useAuth((s) => s.user);
  if (!cloudEnabled) return null;
  if (!user)
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-dune" title="Crée un compte pour enregistrer ce projet en ligne">
        <I n="smartphone" s={14} /> Sur cet appareil
      </span>
    );
  const map = {
    saving: ['loader-circle', 'Enregistrement…', 'text-dune', 'animate-spin'],
    saved: ['circle-check', 'Enregistré', 'text-baobab', ''],
    error: ['circle-alert', 'Non enregistré', 'text-[#ff9aa8]', ''],
    idle: ['circle-check', 'Enregistré', 'text-dune', ''],
    local: ['circle-check', 'Enregistré', 'text-dune', ''],
  };
  const [icon, label, cls, spin] = map[status] || map.idle;
  return (
    <span className={`hidden md:inline-flex items-center gap-1.5 text-[12px] ${cls}`} data-testid="save-status" data-status={status}>
      <I n={icon} s={14} className={spin} /> {label}
    </span>
  );
}

function TopBar({ onNew, compact, onNeedLogin }) {
  const spec = useStudio((s) => s.spec);
  const past = useStudio((s) => s.past.length);
  const future = useStudio((s) => s.future.length);
  const site = useStudio((s) => s.site);
  const projectId = useStudio((s) => s.projectId);
  const user = useAuth((s) => s.user);
  const st = useStudio.getState;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const share = async () => {
    const r = await copyShareLink(spec);
    toast(r.copied ? 'Lien copié : envoie-le par WhatsApp !' : 'Lien prêt (copie manuelle)');
    if (!r.copied) window.prompt('Lien de la maquette :', r.url);
  };
  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn(spec);
      toast(ok);
    } catch (e) {
      toast(e.message || 'Export impossible', 'error');
    }
    setBusy(false);
  };
  const publish = () => {
    if (!user) return onNeedLogin?.();
    setPublishing(true);
  };
  return (
    <header className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-white/[0.07] bg-ink-2">
      <Link to={user ? '/espace' : '/'} className="shrink-0 mr-1" title={user ? 'Mon espace' : 'Accueil'}>
        <Logo word={!compact} size={28} />
      </Link>
      {!compact && <span className="w-px h-6 bg-white/10 mx-1" />}
      <input value={spec.meta.name} onChange={(e) => st().mutate((d) => void (d.meta.name = e.target.value), { group: true })} className="min-w-0 w-[120px] md:w-[200px] bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.06] rounded-lg px-2 h-9 outline-none text-[14px] font-semibold" aria-label="Nom du projet" />
      <IconBtn icon="arrow-left" title="Annuler (Ctrl+Z)" onClick={() => st().undo()} disabled={!past} className="rotate-[20deg]" />
      <IconBtn icon="arrow-right" title="Rétablir (Ctrl+Maj+Z)" onClick={() => st().redo()} disabled={!future} className="-rotate-[20deg]" />
      <SaveStatus />
      <div className="flex-1" />
      {!compact && <CreditsPill compact />}
      {!compact && (
        <Button variant="ghost" size="sm" icon="plus" onClick={onNew}>
          Nouveau
        </Button>
      )}
      <Button variant="outline" size="sm" icon="play" onClick={() => window.open(shareUrl(spec), '_blank', 'noopener')} title="Présenter la maquette">
        {!compact && 'Présenter'}
      </Button>
      <Menu
        width={300}
        button={(toggle) => (
          <Button variant="subtle" size="sm" icon="download" onClick={toggle} loading={busy} title="Partager et exporter">
            {!compact && 'Exporter'}
          </Button>
        )}
      >
        <MenuItem icon="copy" sub="Lien /p#… à envoyer par WhatsApp" onClick={share}>
          Copier le lien de la maquette
        </MenuItem>
        <MenuItem icon="package" sub="index.html + maquette.json + mode d'emploi" onClick={() => run(downloadClientPack, 'Pack client téléchargé')}>
          Pack client (.zip)
        </MenuItem>
        <MenuItem icon="globe" sub="Un seul fichier, s'ouvre partout" onClick={() => run(downloadHtml, 'Fichier HTML téléchargé')}>
          Maquette HTML autonome
        </MenuItem>
        <MenuItem icon="file-text" sub="Pour les développeurs" onClick={() => run(async (s) => downloadJson(s), 'JSON téléchargé')}>
          Spécification JSON
        </MenuItem>
        <MenuItem icon="hand-coins" sub="Lien Wave, Orange Money, Mixx à envoyer au client" onClick={() => window.open(`/paiements?d=${encodeURIComponent(`Acompte maquette ${spec.meta.name}`.slice(0, 120))}`, '_blank', 'noopener')}>
          Demander un acompte
        </MenuItem>
      </Menu>
      {cloudEnabled && (
        <Button variant="accent" size="sm" icon={site?.published ? 'refresh-cw' : 'globe'} onClick={publish} data-testid="studio-publish">
          {compact ? (site?.published ? 'Mettre à jour' : 'Publier') : site?.published ? 'Mettre à jour le site' : 'Publier'}
        </Button>
      )}
      {!compact && <AccountMenu onFeedback={() => setFeedback(true)} />}
      {cloudEnabled && user && (
        <PublishModal
          open={publishing}
          onClose={() => setPublishing(false)}
          site={{ id: projectId, name: spec.meta.name, ...(site || {}) }}
          beforePublish={async () => {
            st().persist(true);
            await flushCloudSave();
            return st().projectId;
          }}
          onChange={(next) => st().setSite({ slug: next.slug, published: next.published, settings: next.settings })}
        />
      )}
      <FeedbackModal open={feedback} onClose={() => setFeedback(false)} />
    </header>
  );
}

// ───────────────────────── Écran de départ ─────────────────────────
const CAT_LABELS = Object.fromEntries(Object.entries(CATEGORY_INFO).map(([k, v]) => [k, v.label]));

function ProjectCard({ p, onOpen, onDelete }) {
  const color = p.color || p.spec?.theme?.primary || '#ff6a3d';
  const cover = p.cover;
  const date = new Date(p.updated_at || p.updatedAt || Date.now());
  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden hover:border-white/20 cursor-pointer" onClick={() => onOpen(p.id)} data-testid="project-card">
      <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, #15131c)` }}>
        {cover && <img src={cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        {p.published && (
          <span className="absolute left-3 top-3 px-2 h-6 rounded-full text-[11px] font-semibold bg-baobab/90 text-ink flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ink" /> En ligne
          </span>
        )}
      </div>
      <div className="p-3.5">
        <p className="font-semibold truncate">{p.name}</p>
        <p className="text-[12px] text-dune">{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{p.slug && p.published ? ` · /${p.slug}` : ''}</p>
      </div>
      {onDelete && (
        <button type="button" title="Supprimer" onClick={(e) => (e.stopPropagation(), onDelete(p))} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-ink/70 backdrop-blur opacity-0 group-hover:opacity-100 focus:opacity-100 text-sand/80 hover:text-ember flex items-center justify-center">
          <I n="trash-2" s={15} />
        </button>
      )}
    </div>
  );
}

function StartScreen({ onGenerate, onOpen, onTemplate }) {
  const [idea, setIdea] = useState('');
  const user = useAuth((s) => s.user);
  const [local, setLocal] = useState(() => listProjects(cloudEnabled ? null : undefined));
  const [cloudSites, setCloudSites] = useState(null);
  const [feedback, setFeedback] = useState(false);
  useEffect(() => {
    if (!user) return setCloudSites(null);
    listSites().then(setCloudSites, () => setCloudSites([]));
  }, [user]);
  const delLocal = (p) => {
    if (!confirm(`Supprimer « ${p.name} » de cet appareil ?`)) return;
    deleteProject(p.id);
    setLocal(listProjects(cloudEnabled ? null : undefined));
  };
  const delCloud = async (p) => {
    if (!confirm(`Supprimer définitivement « ${p.name} »${p.published ? ' ? Le site sera aussi retiré d\'Internet' : ''} ?`)) return;
    try {
      await deleteSite(p.id);
      deleteProject(p.id);
      setCloudSites((l) => l.filter((x) => x.id !== p.id));
    } catch (e) {
      alert(e.message);
    }
  };
  const cloudIds = new Set((cloudSites || []).map((x) => x.id));
  const localOnly = local.filter((p) => !cloudIds.has(p.id));
  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-white/[0.07]">
        <Link to={user ? '/espace' : '/'}>
          <Logo size={28} />
        </Link>
        <div className="flex-1" />
        <CreditsPill />
        <AccountMenu onFeedback={() => setFeedback(true)} />
      </header>
      <div className="max-w-4xl mx-auto px-5 py-12">
        <h1 className="font-display text-[46px] md:text-[60px] leading-[0.98]">
          Quelle app on <em className="text-sunset">construit</em> aujourd'hui ?
        </h1>
        <div className="mt-8 rounded-3xl p-[1.5px] bg-[linear-gradient(135deg,rgba(255,138,61,0.7),rgba(216,64,122,0.5),rgba(255,255,255,0.08))]">
          <div className="rounded-[22px] bg-ink-2 p-4">
            <textarea autoFocus value={idea} onChange={(e) => setIdea(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && idea.trim().length > 3 && onGenerate(idea.trim())} rows={4} placeholder="Décris ton idée : ton activité, tes clients, ce que l'app doit faire (réservation, livraison, paiement Wave…)" className="w-full bg-transparent outline-none resize-none text-[17px] leading-relaxed placeholder:text-dune/60" data-testid="idea-input" />
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="text-[12px] text-dune">{cloudEnabled ? (user ? `Français, wolof ou anglais · ${COSTS.create} crédits` : 'Compte gratuit requis pour l\'IA') : 'Français, wolof ou anglais · Ctrl+Entrée'}</span>
              <Button variant="accent" size="lg" icon="wand-sparkles" disabled={idea.trim().length < 4} onClick={() => onGenerate(idea.trim())} data-testid="generate">
                Générer
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {EXAMPLES.map((e) => (
            <button key={e.label} type="button" onClick={() => setIdea(e.idea)} className="text-[12.5px] px-3 h-8 rounded-full border border-white/10 text-sand/80 hover:border-white/25 hover:text-sand">
              {e.label}
            </button>
          ))}
        </div>
        {cloudEnabled && !user && (
          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sunset/15 text-sunset flex items-center justify-center shrink-0">
              <I n="sparkles" s={19} />
            </span>
            <p className="flex-1 text-[14px] text-sand/85">Crée ton compte gratuit pour générer avec l'IA, enregistrer tes sites et les publier.</p>
            <Link to={loginUrl('/studio')} className="h-10 px-4 rounded-xl bg-sand text-ink text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-white">
              Créer mon compte
            </Link>
          </div>
        )}
        {user && cloudSites && cloudSites.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-[13px] uppercase tracking-[0.16em] text-dune">Mes sites</h2>
              <Link to="/espace" className="text-[13px] text-dune hover:text-sand">
                Tout voir
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {cloudSites.slice(0, 9).map((p) => (
                <ProjectCard key={p.id} p={p} onOpen={onOpen} onDelete={delCloud} />
              ))}
            </div>
          </section>
        )}
        {localOnly.length > 0 && (
          <section className="mt-14">
            <h2 className="text-[13px] uppercase tracking-[0.16em] text-dune mb-1">{user ? 'Sur cet appareil' : 'Mes maquettes'}</h2>
            {user && <p className="text-[12.5px] text-dune/80 mb-4">Ouvre un projet pour l'enregistrer dans ton compte.</p>}
            <div className={`grid grid-cols-2 lg:grid-cols-3 gap-3 ${user ? '' : 'mt-4'}`}>
              {localOnly.map((p) => (
                <ProjectCard key={p.id} p={{ ...p, cover: '', color: p.spec?.theme?.primary }} onOpen={onOpen} onDelete={delLocal} />
              ))}
            </div>
          </section>
        )}
        <section className="mt-14">
          <h2 className="text-[13px] uppercase tracking-[0.16em] text-dune mb-4">Partir d'un modèle {cloudEnabled && <span className="normal-case tracking-normal text-baobab ml-1">· gratuit</span>}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.keys(TEMPLATES).map((cat) => (
              <button key={cat} type="button" onClick={() => onTemplate(cat)} className="h-11 rounded-xl border border-white/[0.08] text-[12.5px] text-sand/85 hover:border-sunset/60 hover:text-sand" data-testid={`tpl-${cat}`}>
                {CAT_LABELS[cat]}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-dune mt-4">
            Tu veux d'abord les voir en action ?{' '}
            <Link to="/galerie" className="text-sand underline underline-offset-4">
              Ouvre la galerie
            </Link>
          </p>
        </section>
      </div>
      <FeedbackModal open={feedback} onClose={() => setFeedback(false)} />
    </div>
  );
}

function AccessCodeModal({ open, onClose, onSubmit }) {
  const [code, setCode] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Code d'accès" width={420}>
      <div className="p-5">
        <p className="text-[13.5px] text-dune">Ce studio est protégé pour préserver les crédits d'IA. Entre le code fourni par l'administrateur.</p>
        <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSubmit(code)} className={`${inputCls} h-11 mt-4`} placeholder="Code" />
        <Button variant="accent" className="w-full mt-3" onClick={() => onSubmit(code)}>
          Valider
        </Button>
      </div>
    </Modal>
  );
}
