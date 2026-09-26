// État du studio : projet, spec, historique (annuler/rétablir), sélection.
import { create } from 'zustand';
import { normalizeSpec } from '../../shared/normalize.js';
import { deepClone, uid } from '../../shared/utils.js';
import { saveProject } from '../lib/specs.js';

const MAX_HISTORY = 60;
let saveTimer = null;

export const useStudio = create((set, get) => ({
  projectId: null,
  idea: '',
  spec: null,
  past: [],
  future: [],
  lastCommit: 0,
  screenId: null,
  selected: null,
  mode: 'edit',
  device: 'iphone',
  panel: 'ai',
  chat: [],

  load({ id, idea, spec }) {
    set({ projectId: id || uid('p'), idea: idea || '', spec, past: [], future: [], screenId: spec?.initial || spec?.screens?.[0]?.id, selected: null, chat: [] });
    get().persist(true);
  },

  // Remplace la spec (avec entrée dans l'historique). group=true regroupe les frappes rapides.
  setSpec(next, { group = false, normalize = false } = {}) {
    const s = get();
    if (!s.spec) return;
    const value = normalize ? normalizeSpec(next).spec : next;
    const now = Date.now();
    const push = !group || now - s.lastCommit > 900;
    set({
      spec: value,
      past: push ? [...s.past, s.spec].slice(-MAX_HISTORY) : s.past,
      future: [],
      lastCommit: now,
    });
    // l'écran courant doit toujours exister
    if (!value.screens.some((x) => x.id === get().screenId)) set({ screenId: value.initial || value.screens[0]?.id });
    get().persist();
  },

  mutate(fn, opts = {}) {
    const draft = deepClone(get().spec);
    const r = fn(draft);
    get().setSpec(r || draft, opts);
  },

  updateBlock(screenId, blockId, fn, opts = { group: true }) {
    get().mutate((d) => {
      const sc = d.screens.find((x) => x.id === screenId);
      const i = sc?.blocks.findIndex((b) => b.id === blockId);
      if (sc && i >= 0) sc.blocks[i] = fn(sc.blocks[i]) || sc.blocks[i];
    }, opts);
  },

  undo() {
    const s = get();
    if (!s.past.length) return;
    set({ spec: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.spec, ...s.future].slice(0, MAX_HISTORY), lastCommit: 0, selected: null });
    get().persist();
  },
  redo() {
    const s = get();
    if (!s.future.length) return;
    set({ spec: s.future[0], future: s.future.slice(1), past: [...s.past, s.spec].slice(-MAX_HISTORY), lastCommit: 0, selected: null });
    get().persist();
  },

  select(blockId) {
    set({ selected: blockId });
  },
  setScreen(id) {
    set({ screenId: id, selected: null });
  },
  setMode(mode) {
    set({ mode, selected: mode === 'play' ? null : get().selected });
  },
  setDevice(device) {
    set({ device });
  },
  setPanel(panel) {
    set({ panel });
  },
  pushChat(msg) {
    set({ chat: [...get().chat, { id: uid('m'), ...msg }].slice(-40) });
  },

  persist(now = false) {
    clearTimeout(saveTimer);
    const run = () => {
      const s = get();
      if (s.spec) saveProject({ id: s.projectId, idea: s.idea, spec: s.spec });
    };
    if (now) run();
    else saveTimer = setTimeout(run, 700);
  },
}));
