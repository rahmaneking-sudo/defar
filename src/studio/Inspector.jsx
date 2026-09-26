// Inspecteur : édition précise de n'importe quel bloc (formulaire généré automatiquement).
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudio } from './store.js';
import { I, IconBtn, Field, Switch, inputCls, Button, Modal, Segmented } from '../ui/kit.jsx';
import { MediaPicker } from './MediaPicker.jsx';
import { PROP_LABELS, ENUMS, STYLE_ENUMS, BLOCK_ENUMS, FIELD_TYPES } from './presets.js';
import { BLOCKS, ICONS, PAY_METHODS } from '../../shared/constants.js';
import { imageSrc, videoSources } from '../../shared/media.js';
import { isObj, deepClone, uid } from '../../shared/utils.js';
import { ICON_MAP } from '../engine/icon-map.js';

const SKIP = new Set(['type', 'id', 'neutral']);
const LONG = new Set(['text', 'description', 'subtitle', 'a', 'terms']);

function setIn(obj, path, value) {
  const root = deepClone(obj);
  let cur = root;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
  const last = path[path.length - 1];
  if (value === undefined) {
    if (Array.isArray(cur)) cur.splice(last, 1);
    else delete cur[last];
  } else cur[last] = value;
  return root;
}

const NULL_DEFAULTS = {
  cta: () => ({ label: 'Découvrir', action: null }),
  secondary: () => ({ label: 'En savoir plus', action: null }),
  vendor: () => ({ name: 'Nom du vendeur', subtitle: 'Vendeur vérifié', avatar: '' }),
  service: () => ({ title: 'Prestation', price: 10000, duration: '1 h', image: '' }),
  media: () => ({ kind: 'image', src: '' }),
  submit: () => ({ label: 'Envoyer', action: null }),
};

function label(key) {
  return PROP_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function kindOf(key, val, blockType) {
  if (key === 'type' && blockType === '_field') return 'fieldtype';
  if (SKIP.has(key)) return null;
  if (/action$/i.test(key)) return 'action';
  if (key === 'media') return 'media';
  if ((key === 'image' || key === 'avatar' || key === 'poster') && (typeof val === 'string' || val == null)) return 'image';
  if (key === 'images') return 'images';
  if (key === 'icon') return 'icon';
  if (key === 'methods') return 'methods';
  if (key === 'style' && STYLE_ENUMS[blockType]) return 'enum';
  if (BLOCK_ENUMS[blockType]?.[key] && typeof val === 'string') return 'enum';
  if (ENUMS[key] && typeof val === 'string') return 'enum';
  if (val === null || val === undefined) return NULL_DEFAULTS[key] ? 'null' : null;
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') return LONG.has(key) || val.length > 70 ? 'textarea' : 'text';
  if (Array.isArray(val)) {
    if (val.every((x) => typeof x === 'number')) return 'numbers';
    if (val.every((x) => typeof x === 'string')) return 'tags';
    return 'list';
  }
  if (isObj(val)) return 'object';
  return null;
}

export function PropEditor({ value, onChange, blockType, depth = 0 }) {
  const entries = Object.entries(value || {});
  return (
    <div className="flex flex-col gap-3.5">
      {entries.map(([key, val]) => {
        const kind = kindOf(key, val, blockType);
        if (!kind) return null;
        const set = (v) => onChange([key], v);
        return <Prop key={key} k={key} kind={kind} val={val} set={set} onChange={(p, v) => onChange([key, ...p], v)} blockType={blockType} depth={depth} />;
      })}
    </div>
  );
}

function Prop({ k, kind, val, set, onChange, blockType, depth }) {
  switch (kind) {
    case 'text':
      return (
        <Field label={label(k)} hint={k === 'title' && depth === 0 && !String(val).includes('*') ? 'Astuce : *un mot* entre astérisques = italique de marque' : undefined}>
          <input value={val} onChange={(e) => set(e.target.value)} className={`${inputCls} h-9`} />
        </Field>
      );
    case 'textarea':
      return (
        <Field label={label(k)} hint={k === 'title' && depth === 0 && !String(val).includes('*') ? 'Astuce : *un mot* entre astérisques = italique de marque' : undefined}>
          <textarea value={val} onChange={(e) => set(e.target.value)} rows={3} className={`${inputCls} py-2 resize-y min-h-[72px]`} />
        </Field>
      );
    case 'number':
      return (
        <Field label={label(k)}>
          <input type="number" value={Number.isFinite(val) ? val : 0} onChange={(e) => set(e.target.value === '' ? 0 : Number(e.target.value))} className={`${inputCls} h-9`} />
        </Field>
      );
    case 'bool':
      return (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-sand/85">{label(k)}</span>
          <Switch on={val} onChange={set} />
        </div>
      );
    case 'enum': {
      const base = BLOCK_ENUMS[blockType]?.[k] || (k === 'style' && STYLE_ENUMS[blockType] ? STYLE_ENUMS[blockType] : ENUMS[k]) || [];
      const opts = base.includes(val) ? base : [val, ...base];
      return (
        <Field label={label(k)}>
          <select value={val} onChange={(e) => set(e.target.value)} className={`${inputCls} h-9`}>
            {opts.map((o) => (
              <option key={o} value={o} className="bg-ink-2">
                {o}
              </option>
            ))}
          </select>
        </Field>
      );
    }
    case 'fieldtype':
      return (
        <Field label="Type de champ">
          <select value={val} onChange={(e) => set(e.target.value)} className={`${inputCls} h-9`}>
            {FIELD_TYPES.map((o) => (
              <option key={o} value={o} className="bg-ink-2">
                {o}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'tags':
      return (
        <Field label={label(k)} hint="Sépare les valeurs par des virgules">
          <TagsInput value={val} onChange={set} />
        </Field>
      );
    case 'numbers':
      return (
        <Field label={label(k)} hint="Nombres séparés par des virgules">
          <TagsInput value={val.map(String)} onChange={(arr) => set(arr.map(Number).filter(Number.isFinite))} />
        </Field>
      );
    case 'image':
      return <ImageField label={label(k)} value={val || ''} onChange={set} face={k === 'avatar'} />;
    case 'images':
      return (
        <Field label={label(k)}>
          <div className="grid grid-cols-3 gap-2">
            {val.map((src, i) => (
              <ImageTile key={i} value={src} onChange={(v) => onChange([i], v)} onRemove={() => onChange([i], undefined)} />
            ))}
            <AddImageTile onPick={(ref) => set([...val, ref])} />
          </div>
        </Field>
      );
    case 'media':
      return <MediaField value={val} onChange={set} />;
    case 'icon':
      return <IconField value={val} onChange={set} />;
    case 'action':
      return <ActionField label={label(k)} value={val} onChange={set} />;
    case 'methods':
      return (
        <Field label={label(k)}>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PAY_METHODS).map(([id, m]) => {
              const on = val.includes(id);
              return (
                <button key={id} type="button" onClick={() => set(on ? val.filter((x) => x !== id) : [...val, id])} className={`h-8 px-3 rounded-lg text-[12px] font-medium border ${on ? 'border-sunset/70 bg-sunset/15 text-sand' : 'border-white/10 text-dune'}`}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </Field>
      );
    case 'null':
      return (
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-dune">{label(k)}</span>
          <Button size="sm" variant="subtle" icon="plus" onClick={() => set(NULL_DEFAULTS[k]())}>
            Ajouter
          </Button>
        </div>
      );
    case 'object':
      return (
        <Group title={label(k)} onRemove={NULL_DEFAULTS[k] ? () => set(null) : undefined}>
          <PropEditor value={val} onChange={onChange} blockType={blockType} depth={depth + 1} />
        </Group>
      );
    case 'list':
      return <ListField label={label(k)} value={val} onChange={onChange} set={set} blockType={k === 'fields' ? '_field' : blockType} depth={depth} />;
    default:
      return null;
  }
}

function Group({ title, children, onRemove }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-center justify-between px-3 h-9">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-[12px] font-semibold text-sand/85">
          <I n={open ? 'chevron-right' : 'chevron-right'} s={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
          {title}
        </button>
        {onRemove && <IconBtn icon="trash-2" title="Retirer" onClick={onRemove} size={26} />}
      </div>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function TagsInput({ value, onChange }) {
  const [text, setText] = useState(value.join(', '));
  return <input value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onChange(text.split(',').map((s) => s.trim()).filter(Boolean))} className={`${inputCls} h-9`} />;
}

const summary = (it, i) => it?.title || it?.label || it?.name || it?.q || it?.author || it?.text?.slice?.(0, 30) || `Élément ${i + 1}`;

function ListField({ label: lbl, value, onChange, set, blockType, depth }) {
  const [open, setOpen] = useState(-1);
  const move = (i, d) => {
    const a = [...value];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    set(a);
    setOpen(j);
  };
  const add = () => {
    const base = value.length ? deepClone(value[value.length - 1]) : { title: 'Nouvel élément' };
    if (base.id) base.id = uid('it');
    if (base.title) base.title = `${base.title} (copie)`;
    else if (base.label) base.label = `${base.label} (copie)`;
    set([...value, base]);
    setOpen(value.length);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11.5px] font-medium text-dune tracking-wide">
          {lbl} <span className="text-dune/60">({value.length})</span>
        </span>
        <Button size="sm" variant="ghost" icon="plus" onClick={add}>
          Ajouter
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        {value.map((it, i) => (
          <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 pl-2 pr-1 h-10">
              {typeof it?.image === 'string' && imageSrc(it.image, 80) ? <img src={imageSrc(it.image, 80)} alt="" className="w-7 h-7 rounded-md object-cover" /> : <span className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-[11px] text-dune">{i + 1}</span>}
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="flex-1 min-w-0 text-left text-[12.5px] truncate text-sand/90">
                {summary(it, i)}
              </button>
              <IconBtn icon="chevron-left" title="Monter" onClick={() => move(i, -1)} size={26} className="rotate-90" />
              <IconBtn icon="chevron-right" title="Descendre" onClick={() => move(i, 1)} size={26} className="rotate-90" />
              <IconBtn icon="trash-2" title="Supprimer" onClick={() => onChange([i], undefined)} size={26} />
            </div>
            <AnimatePresence initial={false}>
              {open === i && isObj(it) && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-3 pt-1 border-t border-white/[0.06]">
                    <PropEditor value={it} onChange={(p, v) => onChange([i, ...p], v)} blockType={blockType} depth={depth + 1} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function thumbOf(ref) {
  const v = videoSources(ref);
  if (ref && String(ref).startsWith('mx:')) return v?.poster;
  return imageSrc(ref, 200);
}

function ImageField({ label: lbl, value, onChange, face }) {
  const [open, setOpen] = useState(false);
  const t = thumbOf(value);
  return (
    <Field label={lbl}>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => setOpen(true)} className={`relative w-14 h-14 ${face ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-white/5 border border-white/10 shrink-0`}>
          {t ? <img src={t} alt="" className="w-full h-full object-cover" /> : <I n="image" s={18} className="absolute inset-0 m-auto text-dune" />}
        </button>
        <div className="flex gap-1.5">
          <Button size="sm" variant="subtle" onClick={() => setOpen(true)}>
            Choisir
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              Retirer
            </Button>
          )}
        </div>
      </div>
      {open && <MediaPicker open onClose={() => setOpen(false)} allowVideo={false} onPick={(ref) => (onChange(ref), setOpen(false))} />}
    </Field>
  );
}

function ImageTile({ value, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
  const t = thumbOf(value);
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 group">
      <button type="button" onClick={() => setOpen(true)} className="absolute inset-0">
        {t && <img src={t} alt="" className="w-full h-full object-cover" />}
      </button>
      <button type="button" onClick={onRemove} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center">
        <I n="x" s={12} />
      </button>
      {open && <MediaPicker open onClose={() => setOpen(false)} allowVideo={false} onPick={(ref) => (onChange(ref), setOpen(false))} />}
    </div>
  );
}
function AddImageTile({ onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="aspect-square rounded-lg border border-dashed border-white/15 text-dune hover:text-sand hover:border-white/30 flex items-center justify-center">
        <I n="plus" s={18} />
      </button>
      {open && <MediaPicker open onClose={() => setOpen(false)} allowVideo={false} onPick={(ref) => (onPick(ref), setOpen(false))} />}
    </>
  );
}

function MediaField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const v = value || { kind: 'image', src: '' };
  const t = thumbOf(v.src);
  return (
    <Field label="Média (photo ou vidéo)">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => setOpen(true)} className="relative w-20 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
          {t ? <img src={t} alt="" className="w-full h-full object-cover" /> : <I n="image" s={18} className="absolute inset-0 m-auto text-dune" />}
          {v.kind === 'video' && (
            <span className="absolute left-1 bottom-1 px-1.5 h-5 rounded-md bg-black/60 text-white text-[10px] flex items-center gap-1">
              <I n="play" s={10} /> vidéo
            </span>
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <Button size="sm" variant="subtle" onClick={() => setOpen(true)}>
            Changer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
            Retirer
          </Button>
        </div>
      </div>
      {open && <MediaPicker open kind={v.kind} onClose={() => setOpen(false)} onPick={(ref, kind) => (onChange({ kind, src: ref }), setOpen(false))} />}
    </Field>
  );
}

function IconField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const C = typeof value === 'string' && !value.startsWith('emoji:') ? ICON_MAP[value] : null;
  const list = useMemo(() => ICONS.filter((n) => !q || n.includes(q.toLowerCase())), [q]);
  return (
    <Field label="Icône">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          {C ? <C size={18} /> : <span>{String(value || '').replace('emoji:', '') || '?'}</span>}
        </button>
        <span className="text-[12px] text-dune truncate">{value}</span>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Choisir une icône" width={620}>
        <div className="p-4">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (anglais) : cart, heart, map…" className={`${inputCls} h-10 mb-3`} />
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
            {list.map((n) => {
              const Ic = ICON_MAP[n];
              return (
                <button key={n} type="button" title={n} onClick={() => (onChange(n), setOpen(false))} className={`aspect-square rounded-lg flex items-center justify-center hover:bg-white/10 ${n === value ? 'bg-sunset/20 text-sunset' : 'text-sand/80'}`}>
                  <Ic size={19} />
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </Field>
  );
}

const ACTION_TYPES = [
  ['none', 'Aucune'],
  ['navigate', 'Ouvrir un écran'],
  ['back', 'Retour'],
  ['home', 'Accueil'],
  ['toast', 'Afficher un message'],
  ['addToCart', 'Ajouter au panier'],
  ['like', 'Favori'],
  ['share', 'Partager'],
  ['whatsapp', 'WhatsApp'],
  ['call', 'Appeler'],
  ['link', 'Lien web'],
];

function ActionField({ label: lbl, value, onChange }) {
  const screens = useStudio((s) => s.spec.screens);
  const t = value?.type || 'none';
  const setType = (type) => {
    if (type === 'none') return onChange(null);
    if (type === 'navigate') return onChange({ type, to: value?.to || screens[0]?.id });
    if (type === 'toast') return onChange({ type, message: 'Bientôt disponible' });
    if (type === 'whatsapp' || type === 'call') return onChange({ type, phone: '221770000000' });
    if (type === 'link') return onChange({ type, url: 'https://' });
    return onChange({ type });
  };
  return (
    <Field label={lbl}>
      <div className="flex flex-col gap-1.5">
        <select value={t} onChange={(e) => setType(e.target.value)} className={`${inputCls} h-9`}>
          {ACTION_TYPES.map(([v, l]) => (
            <option key={v} value={v} className="bg-ink-2">
              {l}
            </option>
          ))}
        </select>
        {t === 'navigate' && (
          <select value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className={`${inputCls} h-9`}>
            {screens.map((s) => (
              <option key={s.id} value={s.id} className="bg-ink-2">
                → {s.title}
              </option>
            ))}
          </select>
        )}
        {t === 'toast' && <input value={value.message || ''} onChange={(e) => onChange({ ...value, message: e.target.value })} className={`${inputCls} h-9`} placeholder="Message" />}
        {(t === 'whatsapp' || t === 'call') && <input value={value.phone || ''} onChange={(e) => onChange({ ...value, phone: e.target.value })} className={`${inputCls} h-9`} placeholder="221770000000" />}
        {t === 'link' && <input value={value.url || ''} onChange={(e) => onChange({ ...value, url: e.target.value })} className={`${inputCls} h-9`} placeholder="https://…" />}
      </div>
    </Field>
  );
}

// ───────── Panneau principal ─────────
export function Inspector({ onClose }) {
  const spec = useStudio((s) => s.spec);
  const screenId = useStudio((s) => s.screenId);
  const selected = useStudio((s) => s.selected);
  const updateBlock = useStudio((s) => s.updateBlock);
  const mutate = useStudio((s) => s.mutate);
  const select = useStudio((s) => s.select);
  const [json, setJson] = useState(false);
  const screen = spec.screens.find((s) => s.id === screenId);
  const block = screen?.blocks.find((b) => b.id === selected);
  if (!screen) return null;
  if (!block) return <ScreenSettings screen={screen} />;
  const meta = BLOCKS[block.type] || { label: block.type, icon: 'layers' };
  const idx = screen.blocks.indexOf(block);
  const move = (d) =>
    mutate((dr) => {
      const sc = dr.screens.find((x) => x.id === screenId);
      const j = idx + d;
      if (j < 0 || j >= sc.blocks.length) return;
      [sc.blocks[idx], sc.blocks[j]] = [sc.blocks[j], sc.blocks[idx]];
    });
  const dup = () =>
    mutate((dr) => {
      const sc = dr.screens.find((x) => x.id === screenId);
      const c = deepClone(block);
      c.id = `${block.type}-${uid('b').slice(2, 7)}`;
      sc.blocks.splice(idx + 1, 0, c);
    });
  const del = () => {
    mutate((dr) => {
      const sc = dr.screens.find((x) => x.id === screenId);
      sc.blocks.splice(idx, 1);
    });
    select(null);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-white/[0.07] shrink-0">
        <span className="w-8 h-8 rounded-lg bg-sunset/15 text-sunset flex items-center justify-center">
          <I n={meta.icon} s={16} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold truncate">{meta.label}</p>
          <p className="text-[11px] text-dune">Bloc {idx + 1} / {screen.blocks.length}</p>
        </div>
        <IconBtn icon="chevron-left" title="Monter" onClick={() => move(-1)} className="rotate-90" size={30} />
        <IconBtn icon="chevron-right" title="Descendre" onClick={() => move(1)} className="rotate-90" size={30} />
        <IconBtn icon="copy" title="Dupliquer" onClick={dup} size={30} />
        <IconBtn icon="trash-2" title="Supprimer" onClick={del} size={30} />
        <IconBtn icon="x" title="Fermer" onClick={() => (select(null), onClose?.())} size={30} />
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-4">
        <Segmented value={json ? 'json' : 'form'} onChange={(v) => setJson(v === 'json')} options={[{ value: 'form', label: 'Réglages' }, { value: 'json', label: 'JSON' }]} className="mb-4" />
        {json ? (
          <JsonEditor block={block} onApply={(b) => updateBlock(screenId, block.id, () => ({ ...b, id: block.id, type: block.type }), { group: false })} />
        ) : (
          <PropEditor value={block} blockType={block.type} onChange={(path, v) => updateBlock(screenId, block.id, (b) => setIn(b, path, v))} />
        )}
      </div>
    </div>
  );
}

function JsonEditor({ block, onApply }) {
  const [text, setText] = useState(JSON.stringify(block, null, 2));
  const [err, setErr] = useState('');
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className={`${inputCls} font-mono text-[11.5px] py-2 h-[420px]`} />
      {err && <p className="text-[12px] text-ember mt-1">{err}</p>}
      <Button
        className="mt-2 w-full"
        variant="subtle"
        onClick={() => {
          try {
            onApply(JSON.parse(text));
            setErr('');
          } catch (e) {
            setErr('JSON invalide : ' + e.message);
          }
        }}
      >
        Appliquer
      </Button>
    </div>
  );
}

function ScreenSettings({ screen }) {
  const spec = useStudio((s) => s.spec);
  const mutate = useStudio((s) => s.mutate);
  const upd = (fn) => mutate((d) => fn(d.screens.find((x) => x.id === screen.id), d), { group: true });
  const inTabs = spec.tabs.some((t) => t.screen === screen.id);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-white/[0.07] shrink-0">
        <span className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
          <I n="smartphone" s={16} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold truncate">Écran « {screen.title} »</p>
          <p className="text-[11px] text-dune">Clique un bloc dans le téléphone pour le modifier</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-4 flex flex-col gap-3.5">
        <Field label="Nom de l'écran">
          <input value={screen.title} onChange={(e) => upd((s) => void (s.title = e.target.value))} className={`${inputCls} h-9`} />
        </Field>
        <Field label="En-tête">
          <select value={screen.header.style} onChange={(e) => upd((s) => void (s.header.style = e.target.value))} className={`${inputCls} h-9`}>
            {[
              ['large', 'Grand titre'],
              ['compact', 'Compact avec retour'],
              ['greeting', 'Salutation (avatar)'],
              ['transparent', 'Transparent sur image'],
              ['none', 'Aucun'],
            ].map(([v, l]) => (
              <option key={v} value={v} className="bg-ink-2">
                {l}
              </option>
            ))}
          </select>
        </Field>
        {screen.header.style !== 'none' && (
          <>
            <Field label="Titre affiché">
              <input value={screen.header.title} onChange={(e) => upd((s) => void (s.header.title = e.target.value))} className={`${inputCls} h-9`} />
            </Field>
            <Field label="Sous-titre">
              <input value={screen.header.subtitle || ''} onChange={(e) => upd((s) => void (s.header.subtitle = e.target.value))} className={`${inputCls} h-9`} />
            </Field>
          </>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-sand/85">Fond gris doux</span>
          <Switch on={screen.background === 'surface'} onChange={(v) => upd((s) => void (s.background = v ? 'surface' : 'default'))} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-sand/85">Dans la barre d'onglets</span>
          <Switch
            on={inTabs}
            onChange={(v) =>
              mutate((d) => {
                if (v && !d.tabs.some((t) => t.screen === screen.id)) d.tabs.push({ label: screen.title.slice(0, 14), icon: 'circle-check', screen: screen.id });
                if (!v) d.tabs = d.tabs.filter((t) => t.screen !== screen.id);
                if (d.tabs.length > 5) d.tabs = d.tabs.slice(0, 5);
              })
            }
          />
        </div>
        {inTabs && (
          <Field label="Icône de l'onglet">
            <IconField value={spec.tabs.find((t) => t.screen === screen.id)?.icon} onChange={(ic) => mutate((d) => void (d.tabs.find((t) => t.screen === screen.id).icon = ic))} />
          </Field>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-sand/85">Bouton collant en bas</span>
          <Switch on={!!screen.footer} onChange={(v) => upd((s) => void (s.footer = v ? { label: 'Continuer', action: null, sublabel: '', price: null } : null))} />
        </div>
        {screen.footer && (
          <Group title="Bouton collant">
            <PropEditor value={screen.footer} blockType="footer" onChange={(path, v) => upd((s) => void (s.footer = setIn(s.footer, path, v)))} />
          </Group>
        )}
        <Button variant={spec.initial === screen.id ? 'subtle' : 'outline'} icon="flag" disabled={spec.initial === screen.id} onClick={() => mutate((d) => void (d.initial = screen.id))}>
          {spec.initial === screen.id ? 'Écran de démarrage' : 'Démarrer l\'app ici'}
        </Button>
      </div>
    </div>
  );
}
