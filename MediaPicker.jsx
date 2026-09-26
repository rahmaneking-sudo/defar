// Bibliothèque de médias : photos (Unsplash) et vidéos (Mixkit) libres de droits.
import { useMemo, useState } from 'react';
import { Modal, I, Segmented, inputCls, Button } from '../ui/kit.jsx';
import { IMAGES, VIDEOS, unsplashUrl, mixkitPoster } from '../../shared/media-library.js';
import { tokens } from '../../shared/media.js';

export function MediaPicker({ open, onClose, onPick, kind: initialKind = 'image', allowVideo = true, query = '' }) {
  const [kind, setKind] = useState(initialKind);
  const [q, setQ] = useState(query);
  const [url, setUrl] = useState('');
  const results = useMemo(() => {
    const qt = tokens(q);
    const list = kind === 'video' ? VIDEOS.map((v) => ({ ref: `mx:${v[0]}#${v[1]}`, thumb: mixkitPoster(v[0], v[1]), tags: v[2] })) : IMAGES.map((v) => ({ ref: `u:${v[0]}`, thumb: unsplashUrl(v[0], 300), tags: v[1] }));
    if (!qt.length) return list.slice(0, 60);
    return list
      .map((e) => ({ e, s: qt.reduce((n, t) => n + (e.tags.split(' ').some((x) => x.startsWith(t)) ? 1 : 0), 0) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 60)
      .map((x) => x.e);
  }, [q, kind]);
  return (
    <Modal open={open} onClose={onClose} width={860} title="Bibliothèque de médias">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {allowVideo && <Segmented value={kind} onChange={setKind} options={[{ value: 'image', label: 'Photos', icon: 'image' }, { value: 'video', label: 'Vidéos', icon: 'film' }]} className="sm:w-64" />}
          <div className="relative flex-1">
            <I n="search" s={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dune" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex : thiéboudienne, tresses, moto, marché, plage…" className={`${inputCls} h-10 pl-9`} />
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 mt-4">
          {results.map((r) => (
            <button key={r.ref} type="button" onClick={() => onPick(r.ref, kind)} className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-sunset/70" title={r.tags}>
              <img src={r.thumb} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => (e.currentTarget.style.opacity = 0)} />
              {kind === 'video' && (
                <span className="absolute left-2 bottom-2 w-7 h-7 rounded-full bg-black/55 flex items-center justify-center text-white">
                  <I n="play" s={13} />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 p-1.5 text-[10px] text-white/0 group-hover:text-white/90 bg-gradient-to-t from-black/70 to-transparent truncate text-left">{r.tags}</span>
            </button>
          ))}
          {!results.length && <p className="col-span-full text-center text-dune py-10 text-[14px]">Aucun résultat. Essaie un autre mot (en français ou en anglais).</p>}
        </div>
        <div className="mt-5 pt-5 border-t border-white/[0.07]">
          <p className="text-[12px] text-dune mb-2">Ou colle l'adresse d'une image / vidéo (.mp4) hébergée en ligne :</p>
          <div className="flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={`${inputCls} h-10`} />
            <Button variant="subtle" onClick={() => /^https?:\/\//.test(url) && onPick(url.trim(), /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image')}>
              Utiliser
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
