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
import { AppPlayer, FitPhone } from '../engine/Player.jsx';
import { ToastProvider, useToast, Logo, I, IconBtn, Button, Menu, MenuItem, Segmented, Modal, inputCls } from '../ui/kit.jsx';
import { useRoute, go, Link } from '../router.jsx';
import { generateSpec, aiStatus, localSpec, listProjects, getProject, deleteProject, setAccessCode, shareUrl } from '../lib/specs.js';
import { EXAMPLES, CATEGORY_INFO } from '../config.js';
import { TEMPLATES } from '../../shared/generator/templates.js';
import { uid } from '../../shared/utils.js';

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
  const toast = useToast();
  const [gen, setGen] = useState(null);
  const [ai, setAi] = useState(null);
  const [askCode, setAskCode] = useState(null);
  const [start, setStart] = useState(false);
  const booted = useRef(false);

  useEffect(() => {
    aiStatus().then(setAi);
  }, []);

  const generate = useCallback(
    async (idea) => {
      setStart(false);
      setGen({ idea, done: false });
      const r = await generateSpec({ idea });
      if (r.needsCode) {
        setGen(null);
        setAskCode(() => () => generate(idea));
        return;
      }
      setGen({ idea, done: true, result: r });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const finishGen = () => {
    const r = gen?.result;
    if (r?.spec) {
      const id = uid('p');
      load({ id, idea: gen.idea, spec: r.spec });
      history.replaceState({}, '', `/studio?id=${id}`);
      if (r.fallback) toast(r.warning || 'Maquette créée à partir d\'un modèle', 'info');
      else toast(`Maquette générée en ${Math.round((r.ms || 0) / 1000)} s`);
    }
    setGen(null);
  };

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const idea = search.get('idea');
    const tpl = search.get('tpl');
    const id = search.get('id');
    if (idea) return void generate(idea);
    if (tpl && TEMPLATES[tpl]) {
      const s = localSpec(CATEGORY_INFO[tpl]?.idea || `app ${tpl}`, { category: tpl });
      const pid = uid('p');
      load({ id: pid, idea: s.meta.tagline, spec: s });
      history.replaceState({}, '', `/studio?id=${pid}`);
      return;
    }
    const p = id ? getProject(id) : null;
    if (p) return void load({ id: p.id, idea: p.idea, spec: p.spec });
    setStart(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col bg-ink text-sand overflow-hidden">
      {spec && !start ? <Workspace ai={ai} onRegenerate={() => generate(useStudio.getState().idea || spec.meta.tagline)} onNew={() => setStart(true)} onNeedCode={() => setAskCode(() => () => {})} /> : start ? <StartScreen onGenerate={generate} onOpen={(p) => (load(p), setStart(false), history.replaceState({}, '', `/studio?id=${p.id}`))} onTemplate={(cat) => { const s = localSpec(CATEGORY_INFO[cat]?.idea || `app ${cat}`, { category: cat }); const pid = uid('p'); load({ id: pid, idea: s.meta.tagline, spec: s }); setStart(false); history.replaceState({}, '', `/studio?id=${pid}`); }} /> : null}
      <AnimatePresence>{gen && <GenerateOverlay key="gen" idea={gen.idea} done={gen.done} onFinished={finishGen} />}</AnimatePresence>
      <AccessCodeModal open={!!askCode} onClose={() => setAskCode(null)} onSubmit={(code) => { setAccessCode(code); const retry = askCode; setAskCode(null); retry?.(); aiStatus().then(setAi); }} />
    </div>
  );
}

// ───────────────────────── Espace de travail ─────────────────────────
function Workspace({ ai, onRegenerate, onNew, onNeedCode }) {
  const desktop = useMedia('(min-width: 1024px)');
  const wide = useMedia('(min-width: 1320px)');
  const spec = useStudio((s) => s.spec);
  const screenId = useStudio((s) => s.screenId);
  const selected = useStudio((s) => s.selected);
  const mode = useStudio((s) => s.mode);
  const device = useStudio((s) => s.device);
  const panel = useStudio((s) => s.panel);
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
    ai: <AIPanel ai={ai} onRegenerate={onRegenerate} onNeedCode={onNeedCode} />,
    screens: <ScreensPanel />,
    style: <StylePanel />,
  };

  return (
    <>
      <TopBar onNew={onNew} compact={!desktop} />
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
          <div className={`absolute left-1/2 -translate-x-1/2 ${desktop ? 'bottom-4' : 'bottom-[76px]'} flex items-center gap-2 p-1.5 rounded-2xl bg-ink-3/90 backdrop-blur border border-white/10 shadow-xl`}>
            <Segmented value={mode} onChange={(v) => st().setMode(v)} options={[{ value: 'edit', label: 'Éditer', icon: 'pencil' }, { value: 'play', label: 'Tester', icon: 'play' }]} className="w-[210px]" />
            <IconBtn icon={device === 'iphone' ? 'smartphone' : 'tv'} title={device === 'iphone' ? 'Passer en Android' : 'Passer en iPhone'} onClick={() => st().setDevice(device === 'iphone' ? 'android' : 'iphone')} />
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
function TopBar({ onNew, compact }) {
  const spec = useStudio((s) => s.spec);
  const past = useStudio((s) => s.past.length);
  const future = useStudio((s) => s.future.length);
  const st = useStudio.getState;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
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
  return (
    <header className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-white/[0.07] bg-ink-2">
      <Link to="/" className="shrink-0 mr-1">
        <Logo word={!compact} size={28} />
      </Link>
      {!compact && <span className="w-px h-6 bg-white/10 mx-1" />}
      <input value={spec.meta.name} onChange={(e) => st().mutate((d) => void (d.meta.name = e.target.value), { group: true })} className="min-w-0 w-[160px] md:w-[220px] bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.06] rounded-lg px-2 h-9 outline-none text-[14px] font-semibold" aria-label="Nom du projet" />
      <IconBtn icon="arrow-left" title="Annuler (Ctrl+Z)" onClick={() => st().undo()} disabled={!past} className="rotate-[20deg]" />
      <IconBtn icon="arrow-right" title="Rétablir (Ctrl+Maj+Z)" onClick={() => st().redo()} disabled={!future} className="-rotate-[20deg]" />
      <div className="flex-1" />
      {!compact && (
        <Button variant="ghost" size="sm" icon="plus" onClick={onNew}>
          Nouveau
        </Button>
      )}
      <Button variant="outline" size="sm" icon="play" onClick={() => window.open(shareUrl(spec), '_blank', 'noopener')}>
        {!compact && 'Présenter'}
      </Button>
      <Button variant="subtle" size="sm" icon="share-2" onClick={share}>
        {!compact && 'Partager'}
      </Button>
      <Menu
        width={300}
        button={(toggle) => (
          <Button variant="accent" size="sm" icon="download" onClick={toggle} loading={busy}>
            {!compact && 'Exporter'}
          </Button>
        )}
      >
        <MenuItem icon="package" sub="index.html + maquette.json + mode d'emploi" onClick={() => run(downloadClientPack, 'Pack client téléchargé')}>
          Pack client (.zip)
        </MenuItem>
        <MenuItem icon="globe" sub="Un seul fichier, s'ouvre partout" onClick={() => run(downloadHtml, 'Fichier HTML téléchargé')}>
          Maquette HTML autonome
        </MenuItem>
        <MenuItem icon="file-text" sub="Pour les développeurs" onClick={() => run(async (s) => downloadJson(s), 'JSON téléchargé')}>
          Spécification JSON
        </MenuItem>
        <MenuItem icon="copy" sub="Lien /p#… à partager" onClick={share}>
          Copier le lien de présentation
        </MenuItem>
        <MenuItem icon="hand-coins" sub="Lien Wave, Orange Money, Mixx à envoyer au client" onClick={() => window.open(`/paiements?d=${encodeURIComponent(`Acompte maquette ${spec.meta.name}`.slice(0, 120))}`, '_blank', 'noopener')}>
          Demander un acompte
        </MenuItem>
      </Menu>
    </header>
  );
}

// ───────────────────────── Écran de départ ─────────────────────────
const CAT_LABELS = Object.fromEntries(Object.entries(CATEGORY_INFO).map(([k, v]) => [k, v.label]));

function StartScreen({ onGenerate, onOpen, onTemplate }) {
  const [idea, setIdea] = useState('');
  const [projects, setProjects] = useState(listProjects);
  return (
    <div className="flex-1 overflow-y-auto scroll-thin">
      <header className="h-14 flex items-center px-4 border-b border-white/[0.07]">
        <Link to="/">
          <Logo size={28} />
        </Link>
      </header>
      <div className="max-w-4xl mx-auto px-5 py-12">
        <h1 className="font-display text-[46px] md:text-[60px] leading-[0.98]">
          Quelle app on <em className="text-sunset">construit</em> aujourd'hui ?
        </h1>
        <div className="mt-8 rounded-3xl p-[1.5px] bg-[linear-gradient(135deg,rgba(255,138,61,0.7),rgba(216,64,122,0.5),rgba(255,255,255,0.08))]">
          <div className="rounded-[22px] bg-ink-2 p-4">
            <textarea autoFocus value={idea} onChange={(e) => setIdea(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && idea.trim().length > 3 && onGenerate(idea.trim())} rows={4} placeholder="Décris ton idée : ton activité, tes clients, ce que l'app doit faire (réservation, livraison, paiement Wave…)" className="w-full bg-transparent outline-none resize-none text-[17px] leading-relaxed placeholder:text-dune/60" />
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="text-[12px] text-dune">Français, wolof ou anglais · Ctrl+Entrée</span>
              <Button variant="accent" size="lg" icon="wand-sparkles" disabled={idea.trim().length < 4} onClick={() => onGenerate(idea.trim())}>
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
        {projects.length > 0 && (
          <section className="mt-14">
            <h2 className="text-[13px] uppercase tracking-[0.16em] text-dune mb-4">Mes maquettes</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((p) => (
                <div key={p.id} className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 hover:border-white/20 cursor-pointer" onClick={() => onOpen(p)}>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: p.spec?.theme?.primary || '#ff6a3d', color: '#fff' }}>
                      {(p.name || '?')[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-[12px] text-dune">{p.spec?.screens?.length || 0} écrans · {new Date(p.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <button type="button" title="Supprimer" onClick={(e) => { e.stopPropagation(); deleteProject(p.id); setProjects(listProjects()); }} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-dune hover:text-ember">
                    <I n="trash-2" s={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="mt-14">
          <h2 className="text-[13px] uppercase tracking-[0.16em] text-dune mb-4">Partir d'un modèle</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.keys(TEMPLATES).map((cat) => (
              <button key={cat} type="button" onClick={() => onTemplate(cat)} className="h-11 rounded-xl border border-white/[0.08] text-[12.5px] text-sand/85 hover:border-sunset/60 hover:text-sand">
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
