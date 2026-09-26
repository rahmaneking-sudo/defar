// Surcouches : toast, notification push, feuille (bottom sheet), vol vers le panier,
// visionneuse de stories, visionneuse photo, doigt de démonstration.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, Img, Media } from './ui.jsx';

export function Toast({ toast, safeTop }) {
  return (
    <div className="absolute left-0 right-0 z-[90] flex justify-center pointer-events-none" style={{ top: safeTop + 6 }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            className="flex items-center gap-2 px-4 h-11 rounded-full text-[13.5px] font-semibold shadow-lg"
            style={{ background: 'color-mix(in srgb, var(--app-text) 92%, transparent)', color: 'var(--app-bg)', backdropFilter: 'blur(12px)' }}
          >
            <Icon name={toast.icon || 'circle-check'} size={17} />
            <span className="max-w-[260px] truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Bannière de notification façon iOS (ex : "Wave · Paiement reçu")
export function Banner({ banner, safeTop, onClose }) {
  return (
    <div className="absolute left-2 right-2 z-[95] pointer-events-none" style={{ top: Math.max(8, safeTop - 44) }}>
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.id}
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="pointer-events-auto flex items-start gap-3 p-3 rounded-[22px]"
            onClick={onClose}
            style={{ background: 'rgba(245,245,247,0.86)', color: '#101014', backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)', boxShadow: '0 12px 40px rgba(0,0,0,0.28)' }}
          >
            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center font-extrabold text-[13px] shrink-0" style={{ background: banner.color || 'var(--app-primary)', color: banner.ink || '#fff' }}>
              {banner.short || <Icon name={banner.icon || 'bell'} size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-semibold">{banner.title}</span>
                <span className="text-[11px] opacity-50">maintenant</span>
              </div>
              <p className="text-[13px] leading-snug opacity-80 mt-0.5">{banner.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Feuille modale du bas (glisser pour fermer)
export function Sheet({ sheet, onClose, safeBottom }) {
  return (
    <AnimatePresence>
      {sheet && (
        <motion.div key={sheet.id} className="absolute inset-0 z-[85]" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div className="absolute inset-0 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !sheet.locked && onClose()} />
          <motion.div
            className="app-sheet absolute left-0 right-0 bottom-0 bg-app-bg overflow-hidden"
            style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: safeBottom + 10, maxHeight: '88%' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag={sheet.locked ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (!sheet.locked && info.offset.y > 90) onClose();
            }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-app-surface2" />
            </div>
            {sheet.title && <h3 className="app-heading text-[19px] font-bold px-5 pt-2 pb-1">{sheet.title}</h3>}
            <div className="app-scroll" style={{ maxHeight: 640 }}>
              {typeof sheet.render === 'function' ? sheet.render(onClose) : sheet.content}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Petite image qui "vole" jusqu'au panier
export function Flyers({ flyers, onDone }) {
  return (
    <div className="absolute inset-0 z-[88] pointer-events-none">
      <AnimatePresence>
        {flyers.map((f) => (
          <motion.div
            key={f.id}
            className="absolute rounded-full overflow-hidden"
            style={{ left: 0, top: 0, width: 46, height: 46, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: '2px solid white' }}
            initial={{ x: f.from.x - 23, y: f.from.y - 23, scale: 1, opacity: 1 }}
            animate={{
              x: [f.from.x - 23, (f.from.x + f.to.x) / 2 - 23, f.to.x - 23],
              y: [f.from.y - 23, Math.min(f.from.y, f.to.y) - 110, f.to.y - 23],
              scale: [1, 1.1, 0.25],
              opacity: [1, 1, 0.6],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.45, 0, 0.2, 1] }}
            onAnimationComplete={() => onDone(f.id)}
          >
            {f.image ? <Img src={f.image} w={120} className="w-full h-full" eager /> : <div className="w-full h-full bg-app-primary" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Visionneuse de stories plein écran
export function StoryViewer({ story, onClose }) {
  const [i, setI] = useState(0);
  useEffect(() => setI(story?.index || 0), [story]);
  useEffect(() => {
    if (!story) return;
    const t = setTimeout(() => {
      if (i + 1 < story.items.length) setI(i + 1);
      else onClose();
    }, 4200);
    return () => clearTimeout(t);
  }, [story, i, onClose]);
  const it = story?.items?.[i];
  return (
    <AnimatePresence>
      {story && it && (
        <motion.div key="story" className="absolute inset-0 z-[92] bg-black" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.28 }}>
          <AnimatePresence mode="popLayout">
            <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Img src={it.image} w={900} className="absolute inset-0" kenburns eager />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
            </motion.div>
          </AnimatePresence>
          <div className="absolute left-3 right-3 flex gap-1" style={{ top: 58 }}>
            {story.items.map((_, k) => (
              <div key={k} className="h-[3px] flex-1 rounded-full bg-white/30 overflow-hidden">
                <motion.div className="h-full bg-white" initial={{ width: k < i ? '100%' : '0%' }} animate={{ width: k < i ? '100%' : k === i ? '100%' : '0%' }} transition={{ duration: k === i ? 4.2 : 0, ease: 'linear' }} />
              </div>
            ))}
          </div>
          <div className="absolute left-4 right-4 flex items-center justify-between text-white" style={{ top: 72 }}>
            <span className="font-semibold text-[14px]">{it.name}</span>
            <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center">
              <Icon name="x" size={24} />
            </button>
          </div>
          <div className="absolute inset-y-0 left-0 w-1/3" onClick={() => setI(Math.max(0, i - 1))} />
          <div className="absolute inset-y-0 right-0 w-2/3" onClick={() => (i + 1 < story.items.length ? setI(i + 1) : onClose())} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Lightbox({ box, onClose }) {
  return (
    <AnimatePresence>
      {box && (
        <motion.div key="lb" className="absolute inset-0 z-[92] bg-black/92 flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="relative w-full" style={{ aspectRatio: '4/5' }} initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            {box.media ? <Media media={box.media} /> : <Img src={box.image} w={1100} className="absolute inset-0" eager />}
          </motion.div>
          <button type="button" className="absolute right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center" style={{ top: 60 }}>
            <Icon name="x" size={22} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Doigt virtuel pour les démos automatiques
export function Finger({ finger }) {
  return (
    <AnimatePresence>
      {finger && (
        <motion.div
          key="finger"
          className="absolute z-[99] pointer-events-none"
          style={{ left: 0, top: 0 }}
          initial={{ x: finger.x - 22, y: finger.y + 60, opacity: 0 }}
          animate={{ x: finger.x - 22, y: finger.y - 22, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        >
          <motion.div
            key={finger.tap}
            className="w-11 h-11 rounded-full"
            style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 6px 20px rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 0.78, 1] }}
            transition={{ duration: 0.35 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
