// Panneaux de gauche du studio : IA, Écrans & blocs, Style.
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudio } from './store.js';
import { I, IconBtn, Button, Field, inputCls, Segmented, Modal, Menu, MenuItem, useToast } from '../ui/kit.jsx';
import { BLOCKS, PALETTES, FONT_PAIRS, STYLES } from '../../shared/constants.js';
import { normalizeSpec } from '../../shared/normalize.js';
import { buildPalette } from '../../shared/color.js';
import { deepClone, uid, slugify } from '../../shared/utils.js';
import { BLOCK_PRESETS, SCREEN_PRESETS } from './presets.js';
import { applyLocalInstruction } from './localEdit.js';
import { generateSpec } from '../lib/specs.js';
import { cloudEnabled, useAuth } from '../lib/cloud.js';
import { COSTS } from '../../shared/plans.js';

// ───────────────────────── IA ─────────────────────────
const SUGGESTIONS = ['Passe en mode sombre', 'Rends le design plus luxueux', 'Ajoute un écran de fidélité avec des points', 'Ajoute la livraison à Thiès et Mbour', 'Mets une vidéo en fond sur l\'accueil', 'Ajoute un écran de messagerie avec le support', 'Change la couleur principale en vert', 'Ajoute des avis clients sur l\'accueil'];

export function AIPanel({ ai, onRegenerate, onNeedCode, onNeedLogin, onNeedCredits }) {
  const spec = useStudio((s) => s.spec);
  const idea = useStudio((s) => s.idea);
  const chat = useStudio((s) => s.chat);
  const pushChat = useStudio((s) => s.pushChat);
  const setSpec = useStudio((s) => s.setSpec);
  const setScreen = useStudio((s) => s.setScreen);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  const toast = useToast();
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' });
  }, [chat, busy]);

  const send = async (msg) => {
    const instruction = (msg ?? text).trim();
    if (!instruction || busy) return;
    setText('');
    pushChat({ role: 'user', text: instruction });
    // 1) modifications simples : instantanées, sans IA
    const local = applyLocalInstruction(spec, instruction);
    const simple = local && instruction.split(/\s+/).length <= 9 && !/ajoute|cree|crée|mets|remplace|écris|ecris|traduis/i.test(instruction.replace(/ajoute un écran|ajoute un ecran/i, ''));
    if (local && (simple || !ai?.ai)) {
      setSpec(normalizeSpec(local.spec).spec);
      if (local.newScreen) setScreen(local.newScreen);
      pushChat({ role: 'ai', text: `✓ ${local.applied.join(' · ')}` });
      return;
    }
    if (!ai?.ai) {
      pushChat({ role: 'ai', text: 'Cette modification a besoin de l\'IA. Ajoute une clé (Claude, OpenAI ou Gemini) dans Vercel — ou modifie le bloc directement en mode « Éditer » 👉', error: true });
      return;
    }
    if (cloudEnabled && !useAuth.getState().user) {
      pushChat({ role: 'ai', text: 'Connecte-toi pour utiliser l\'IA : c\'est gratuit pendant la phase d\'essai.', error: true });
      onNeedLogin?.();
      return;
    }
    setBusy(true);
    const t0 = Date.now();
    const r = await generateSpec({ mode: 'edit', spec, instruction, idea });
    setBusy(false);
    if (r.needsCode) {
      onNeedCode?.();
      pushChat({ role: 'ai', text: 'Code d\'accès requis pour utiliser l\'IA.', error: true });
      return;
    }
    if (r.needsLogin) {
      pushChat({ role: 'ai', text: r.message || 'Connecte-toi pour utiliser l\'IA.', error: true });
      onNeedLogin?.();
      return;
    }
    if (r.needsCredits) {
      pushChat({ role: 'ai', text: r.message || 'Tu n\'as plus assez de crédits.', error: true });
      onNeedCredits?.();
      return;
    }
    if (r.spec) {
      setSpec(r.spec);
      pushChat({ role: 'ai', text: `✓ C'est fait (${Math.round((Date.now() - t0) / 1000)} s)${r.cost ? ` · ${r.cost} crédit${r.cost > 1 ? 's' : ''}` : ''}. Tu peux annuler avec Ctrl+Z.` });
    } else {
      pushChat({ role: 'ai', text: r.error || 'L\'IA n\'a pas pu appliquer la modification. Ta maquette est intacte.', error: true });
      toast('Modification non appliquée', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-semibold">Assistant IA</p>
          <span className={`text-[11px] px-2 h-6 rounded-full flex items-center gap-1.5 ${ai?.ai ? 'bg-baobab/15 text-baobab' : 'bg-white/[0.06] text-dune'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ai?.ai ? 'bg-baobab' : 'bg-dune'}`} />
            {ai?.ai ? `IA active · ${ai.providers[0]}` : 'Mode modèle (sans IA)'}
          </span>
        </div>
        {idea && <p className="text-[12px] text-dune mt-2 line-clamp-3">« {idea} »</p>}
        {cloudEnabled && ai?.ai && <p className="text-[11.5px] text-dune/80 mt-2">Chaque modification par l'IA : {COSTS.edit} crédit · les changements simples (couleurs, mode sombre…) sont gratuits.</p>}
      </div>
      <div ref={box} className="flex-1 overflow-y-auto scroll-thin px-4 py-4 flex flex-col gap-2.5">
        {!chat.length && (
          <div className="text-[13px] text-dune leading-relaxed">
            <p>Demande une modification en langage naturel. Quelques idées :</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="text-left text-[12px] px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-sand/85">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[92%] px-3 py-2 rounded-2xl text-[13px] leading-snug ${m.role === 'user' ? 'self-end bg-sand text-ink rounded-br-md' : m.error ? 'self-start bg-ember/12 text-[#ffb3bf] rounded-bl-md' : 'self-start bg-white/[0.06] text-sand rounded-bl-md'}`}>
            {m.text}
          </motion.div>
        ))}
        {busy && (
          <div className="self-start px-3 py-2.5 rounded-2xl bg-white/[0.06] flex items-center gap-2 text-[12.5px] text-dune">
            <span className="flex gap-1">
              {[0, 1, 2].map((k) => (
                <span key={k} className="w-1.5 h-1.5 rounded-full bg-sand" style={{ animation: `typing 1s ${k * 0.15}s infinite` }} />
              ))}
            </span>
            L'IA redessine ta maquette…
          </div>
        )}
      </div>
      <div className="p-3 border-t border-white/[0.07]">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Ex : ajoute un écran de réservation…"
            className={`${inputCls} py-2.5 pr-12 resize-none`}
          />
          <button type="button" onClick={() => send()} disabled={!text.trim() || busy} className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-sunset text-white flex items-center justify-center disabled:opacity-30">
            <I n="arrow-up-right" s={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="ghost" icon="refresh-cw" onClick={onRegenerate} className="flex-1">
            Régénérer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Écrans & blocs ─────────────────────────
const firstIcon = (s) => BLOCKS[s.blocks[0]?.type]?.icon || 'smartphone';

export function ScreensPanel() {
  const spec = useStudio((s) => s.spec);
  const screenId = useStudio((s) => s.screenId);
  const selected = useStudio((s) => s.selected);
  const setScreen = useStudio((s) => s.setScreen);
  const select = useStudio((s) => s.select);
  const mutate = useStudio((s) => s.mutate);
  const setSpec = useStudio((s) => s.setSpec);
  const setMode = useStudio((s) => s.setMode);
  const [picker, setPicker] = useState(false);
  const screen = spec.screens.find((s) => s.id === screenId);

  const addScreen = (preset) => {
    const d = deepClone(spec);
    let id = preset.id;
    while (d.screens.some((s) => s.id === id)) id = `${preset.id}-${Math.floor(Math.random() * 900 + 100)}`;
    d.screens.push({ id, title: preset.label, header: { style: preset.header, title: preset.label }, blocks: preset.blocks() });
    setSpec(normalizeSpec(d).spec);
    setScreen(id);
  };
  const addBlock = (type) => {
    const d = deepClone(spec);
    const sc = d.screens.find((s) => s.id === screenId);
    const b = { ...BLOCK_PRESETS[type](), id: `${type}-${uid('b').slice(2, 7)}` };
    const at = selected ? sc.blocks.findIndex((x) => x.id === selected) + 1 : sc.blocks.length;
    sc.blocks.splice(at < 1 ? sc.blocks.length : at, 0, b);
    setSpec(normalizeSpec(d).spec);
    setMode('edit');
    select(b.id);
    setPicker(false);
  };
  const del = (id) => {
    if (spec.screens.length <= 1) return;
    mutate((d) => {
      d.screens = d.screens.filter((s) => s.id !== id);
      d.tabs = d.tabs.filter((t) => t.screen !== id);
      if (d.initial === id) d.initial = d.screens[0].id;
    });
  };
  const dup = (s) => {
    const d = deepClone(spec);
    const c = deepClone(s);
    c.id = `${s.id}-copie`;
    while (d.screens.some((x) => x.id === c.id)) c.id += '-2';
    c.title = `${s.title} (copie)`;
    d.screens.splice(d.screens.indexOf(d.screens.find((x) => x.id === s.id)) + 1, 0, c);
    setSpec(d);
    setScreen(c.id);
  };
  const move = (i, dir) =>
    mutate((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.screens.length) return;
      [d.screens[i], d.screens[j]] = [d.screens[j], d.screens[i]];
    });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[13.5px] font-semibold">Écrans ({spec.screens.length})</p>
        <Menu
          width={280}
          button={(toggle) => (
            <Button size="sm" variant="subtle" icon="plus" onClick={toggle}>
              Écran
            </Button>
          )}
        >
          <div className="max-h-[420px] overflow-y-auto scroll-thin">
            {SCREEN_PRESETS.map((p) => (
              <MenuItem key={p.id} icon={p.icon} onClick={() => addScreen(p)}>
                {p.label}
              </MenuItem>
            ))}
          </div>
        </Menu>
      </div>
      <div className="px-2 flex flex-col gap-0.5 max-h-[44%] overflow-y-auto scroll-thin">
        {spec.screens.map((s, i) => {
          const on = s.id === screenId;
          const tab = spec.tabs.some((t) => t.screen === s.id);
          return (
            <div key={s.id} className={`group flex items-center gap-2 pl-2 pr-1 h-10 rounded-xl cursor-pointer ${on ? 'bg-white/[0.09]' : 'hover:bg-white/[0.04]'}`} onClick={() => setScreen(s.id)}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${on ? 'bg-sunset text-white' : 'bg-white/[0.06] text-dune'}`}>
                <I n={firstIcon(s)} s={14} />
              </span>
              <span className="flex-1 min-w-0 text-[13px] truncate">{s.title}</span>
              {spec.initial === s.id && <I n="flag" s={13} className="text-gold" title="Démarrage" />}
              {tab && <span className="text-[10px] px-1.5 rounded bg-white/[0.07] text-dune">onglet</span>}
              <span className="hidden group-hover:flex" onClick={(e) => e.stopPropagation()}>
                <IconBtn icon="chevron-left" title="Monter" size={24} className="rotate-90" onClick={() => move(i, -1)} />
                <IconBtn icon="copy" title="Dupliquer" size={24} onClick={() => dup(s)} />
                <IconBtn icon="trash-2" title="Supprimer" size={24} onClick={() => del(s.id)} disabled={spec.screens.length <= 1} />
              </span>
            </div>
          );
        })}
      </div>
      <div className="mx-4 my-3 h-px bg-white/[0.07]" />
      <div className="px-4 pb-2 flex items-center justify-between">
        <p className="text-[13.5px] font-semibold truncate">Blocs · {screen?.title}</p>
        <Button size="sm" variant="accent" icon="plus" onClick={() => setPicker(true)}>
          Bloc
        </Button>
      </div>
      <div className="px-2 flex-1 overflow-y-auto scroll-thin pb-4">
        {screen?.blocks.map((b) => {
          const meta = BLOCKS[b.type] || { label: b.type, icon: 'layers' };
          const on = selected === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setMode('edit');
                select(b.id);
              }}
              className={`w-full flex items-center gap-2.5 px-2 h-10 rounded-xl text-left ${on ? 'bg-sunset/15 text-sand' : 'hover:bg-white/[0.04] text-sand/85'}`}
            >
              <I n={meta.icon} s={15} className={on ? 'text-sunset' : 'text-dune'} />
              <span className="text-[12.5px] font-medium shrink-0">{meta.label}</span>
              <span className="text-[11.5px] text-dune truncate">{b.title || b.label || b.name || ''}</span>
            </button>
          );
        })}
        {!screen?.blocks.length && <p className="text-[12.5px] text-dune px-2 py-4">Écran vide : ajoute un bloc.</p>}
      </div>
      <BlockPicker open={picker} onClose={() => setPicker(false)} onPick={addBlock} />
    </div>
  );
}

function BlockPicker({ open, onClose, onPick }) {
  const groups = {};
  Object.entries(BLOCKS).forEach(([type, m]) => (groups[m.group] = groups[m.group] || []).push([type, m]));
  return (
    <Modal open={open} onClose={onClose} title="Ajouter un bloc" width={720}>
      <div className="p-5 flex flex-col gap-5">
        {Object.entries(groups).sort(([a], [b]) => (b === 'Signature') - (a === 'Signature')).map(([g, list]) => (
          <div key={g}>
            <p className="text-[11.5px] uppercase tracking-[0.14em] text-dune mb-2">{g}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {list.map(([type, m]) => (
                <button key={type} type="button" onClick={() => onPick(type)} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-sunset/60 hover:bg-white/[0.07] text-left">
                  <span className="w-8 h-8 rounded-lg bg-sunset/15 text-sunset flex items-center justify-center shrink-0">
                    <I n={m.icon} s={16} />
                  </span>
                  <span className="text-[12.5px] font-medium leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ───────────────────────── Style ─────────────────────────
export function StylePanel() {
  const spec = useStudio((s) => s.spec);
  const mutate = useStudio((s) => s.mutate);
  const th = spec.theme;
  const set = (patch, group = false) => mutate((d) => void Object.assign(d.theme, patch), { group });
  const pal = buildPalette(th);
  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 flex flex-col gap-5">
      <div>
        <p className="text-[13.5px] font-semibold mb-3">Identité</p>
        <div className="flex flex-col gap-3">
          <Field label="Nom de l'app">
            <input value={spec.meta.name} onChange={(e) => mutate((d) => void (d.meta.name = e.target.value), { group: true })} className={`${inputCls} h-9`} />
          </Field>
          <Field label="Slogan">
            <input value={spec.meta.tagline} onChange={(e) => mutate((d) => void (d.meta.tagline = e.target.value), { group: true })} className={`${inputCls} h-9`} />
          </Field>
        </div>
      </div>
      <div>
        <p className="text-[13.5px] font-semibold mb-3">Palette</p>
        <div className="grid grid-cols-4 gap-2">
          {PALETTES.map((p) => {
            const on = th.primary?.toLowerCase() === p.primary.toLowerCase();
            return (
              <button key={p.id} type="button" title={p.label} onClick={() => set({ primary: p.primary, accent: p.accent, mode: p.mode, background: p.background })} className={`group rounded-xl p-1.5 border ${on ? 'border-sunset' : 'border-white/[0.07] hover:border-white/20'}`}>
                <span className="flex h-9 rounded-lg overflow-hidden" style={{ background: p.mode === 'dark' ? '#111' : '#fff' }}>
                  <span className="flex-1" style={{ background: p.primary }} />
                  <span className="w-1/3" style={{ background: p.accent }} />
                </span>
                <span className="block text-[10.5px] text-dune mt-1 truncate">{p.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Principale">
            <ColorInput value={pal.primary} onChange={(v) => set({ primary: v }, true)} />
          </Field>
          <Field label="Accent">
            <ColorInput value={pal.accent} onChange={(v) => set({ accent: v }, true)} />
          </Field>
        </div>
        <Segmented
          className="mt-3"
          value={th.mode}
          onChange={(v) => set({ mode: v, background: undefined })}
          options={[
            { value: 'light', label: 'Clair', icon: 'sun' },
            { value: 'dark', label: 'Sombre', icon: 'moon' },
          ]}
        />
      </div>
      <div>
        <p className="text-[13.5px] font-semibold mb-3">Typographie</p>
        <div className="grid grid-cols-2 gap-2">
          {FONT_PAIRS.map((f) => {
            const on = th.headingFont === f.heading && th.font === f.body;
            return (
              <button key={f.id} type="button" onClick={() => set({ font: f.body, headingFont: f.heading })} className={`text-left p-2.5 rounded-xl border ${on ? 'border-sunset bg-sunset/10' : 'border-white/[0.07] hover:border-white/20'}`}>
                <FontPreview family={f.heading} />
                <span className="block text-[11px] text-dune mt-0.5">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-[13.5px] font-semibold mb-3">Style</p>
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map((s) => (
            <button key={s} type="button" onClick={() => set({ style: s })} className={`h-9 rounded-lg text-[12px] font-medium border ${th.style === s ? 'border-sunset bg-sunset/10' : 'border-white/[0.07] text-dune hover:text-sand'}`}>
              {{ soft: 'Doux', glass: 'Verre', bold: 'Audacieux', minimal: 'Minimal', editorial: 'Éditorial' }[s]}
            </button>
          ))}
        </div>
        <Field label={`Arrondis · ${th.radius}px`} className="mt-4">
          <input type="range" min="0" max="32" value={th.radius} onChange={(e) => set({ radius: Number(e.target.value) }, true)} className="w-full accent-[#ff6a3d]" />
        </Field>
      </div>
    </div>
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 h-9 px-2 rounded-xl bg-white/[0.04] border border-white/10">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded-md bg-transparent border-0 p-0 cursor-pointer" />
      <input value={value} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value)} className="flex-1 min-w-0 bg-transparent outline-none text-[12.5px] font-mono uppercase" />
    </div>
  );
}

function FontPreview({ family }) {
  useEffect(() => {
    const id = 'font-' + slugify(family);
    if (document.getElementById(id)) return;
    const l = document.createElement('link');
    l.id = id;
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@700&display=swap&text=AaBbÉé`;
    document.head.appendChild(l);
  }, [family]);
  return (
    <span className="block text-[20px] leading-none truncate" style={{ fontFamily: `'${family}', serif`, fontWeight: 700 }}>
      Aa Éé
    </span>
  );
}
