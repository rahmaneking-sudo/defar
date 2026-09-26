// Enregistrement automatique des projets dans le compte (en plus de la copie locale).
import { create } from 'zustand';
import { cloudEnabled, useAuth, saveSite } from '../lib/cloud.js';

export const useSync = create(() => ({ status: 'idle', error: '' })); // idle | local | saving | saved | error

let timer = null;
let pending = null;
let inflight = null;

export function scheduleCloudSave(project, delay = 1200) {
  if (!cloudEnabled || !useAuth.getState().user) {
    useSync.setState({ status: 'local' });
    return;
  }
  pending = project;
  clearTimeout(timer);
  useSync.setState({ status: 'saving', error: '' });
  timer = setTimeout(() => flushCloudSave(), delay);
}

// Envoie tout de suite ce qui attend (avant de publier, en quittant la page…)
export async function flushCloudSave() {
  clearTimeout(timer);
  if (inflight) await inflight.catch(() => {});
  if (!pending) return null;
  const p = pending;
  pending = null;
  inflight = saveSite(p)
    .then((id) => {
      if (!pending) useSync.setState({ status: 'saved', error: '' });
      return id;
    })
    .catch((e) => {
      pending = pending || p;
      useSync.setState({ status: 'error', error: e.message || 'Enregistrement impossible' });
      clearTimeout(timer);
      timer = setTimeout(() => flushCloudSave(), 6000); // nouvel essai automatique
      throw e;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export const hasPendingSave = () => !!pending || !!inflight;

if (typeof window !== 'undefined') {
  const flush = () => hasPendingSave() && flushCloudSave().catch(() => {});
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
}
