import { useState } from 'react';
import { motion } from 'motion/react';
import { useRt, useScreen } from '../context.js';
import { Icon, Img, SectionHead, Btn } from '../ui.jsx';

export function Search({ block }) {
  const rt = useRt();
  const scr = useScreen();
  const [focus, setFocus] = useState(false);
  const openFilters = () =>
    rt.openSheet({
      title: 'Filtres',
      render: (close) => <FilterSheet close={close} />,
    });
  return (
    <div className="px-5 flex gap-2.5">
      <motion.label
        animate={{ boxShadow: focus ? '0 0 0 2px var(--app-primary)' : '0 0 0 1px var(--app-border)' }}
        className="flex-1 flex items-center gap-2.5 h-[50px] px-4 bg-app-surface"
        style={{ borderRadius: 'min(var(--app-radius), 999px)' }}
      >
        <Icon name="search" size={19} className="text-app-muted shrink-0" />
        <input
          value={scr.query}
          onChange={(e) => scr.setQuery(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && block.action) rt.run(block.action);
          }}
          placeholder={block.placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-app-muted"
          readOnly={rt.mode !== 'play' && rt.mode !== 'capture'}
        />
        {scr.query && (
          <button type="button" onClick={() => scr.setQuery('')} className="text-app-muted">
            <Icon name="x" size={17} />
          </button>
        )}
      </motion.label>
      {block.filter && (
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={openFilters} className="w-[50px] h-[50px] shrink-0 flex items-center justify-center" style={{ borderRadius: 'min(var(--app-radius), 999px)', background: 'var(--app-primary)', color: 'var(--app-on-primary)' }} aria-label="Filtres">
          <Icon name="sliders-horizontal" size={20} />
        </motion.button>
      )}
    </div>
  );
}

function FilterSheet({ close }) {
  const rt = useRt();
  const [sort, setSort] = useState(0);
  const [price, setPrice] = useState(60);
  const sorts = ['Populaires', 'Prix croissant', 'Mieux notés', 'Plus proches'];
  return (
    <div className="px-5 pb-4 pt-2">
      <p className="text-[13px] font-semibold text-app-muted mb-2">Trier par</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {sorts.map((s, i) => (
          <button key={s} type="button" onClick={() => setSort(i)} className="h-9 px-4 rounded-full text-[13.5px] font-semibold" style={{ background: i === sort ? 'var(--app-primary)' : 'var(--app-surface)', color: i === sort ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
            {s}
          </button>
        ))}
      </div>
      <p className="text-[13px] font-semibold text-app-muted mb-2">Budget max · {rt.fmt(price * 500)}</p>
      <input type="range" min="2" max="100" value={price} onChange={(e) => setPrice(+e.target.value)} className="w-full mb-6" style={{ accentColor: 'var(--app-primary)' }} />
      <Btn
        full
        onClick={() => {
          close();
          rt.toast('Filtres appliqués', 'sliders-horizontal');
        }}
      >
        Afficher les résultats
      </Btn>
    </div>
  );
}

export function Chips({ block }) {
  const [sel, setSel] = useState(block.selected || 0);
  return (
    <div className="hscroll gap-2 px-5 pb-0.5">
      {block.items.map((c, i) => (
        <motion.button key={i} type="button" whileTap={{ scale: 0.94 }} onClick={() => setSel(i)} className="relative shrink-0 h-10 px-4 flex items-center gap-1.5 text-[14px] font-semibold" style={{ borderRadius: 999, color: i === sel ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
          {i === sel ? <motion.span className="absolute inset-0 rounded-full" style={{ background: 'var(--app-primary)' }} initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 32 }} /> : <span className="absolute inset-0 rounded-full bg-app-surface" />}
          {c.icon && <Icon name={c.icon} size={16} className="relative" />}
          <span className="relative whitespace-nowrap">{c.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function Segmented({ block }) {
  const [sel, setSel] = useState(0);
  return (
    <div className="px-5">
      <div className="relative flex p-1 bg-app-surface" style={{ borderRadius: 'min(var(--app-radius), 999px)' }}>
        <span aria-hidden="true" className="absolute top-1 bottom-1 left-1 bg-app-elevated pointer-events-none" style={{ width: `calc((100% - 8px) / ${block.items.length || 1})`, transform: `translateX(${sel * 100}%)`, transition: 'transform .42s cubic-bezier(.2,.9,.25,1.1)', borderRadius: 'min(calc(var(--app-radius) - 4px), 999px)', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }} />
        {block.items.map((label, i) => (
          <button key={i} type="button" onClick={() => setSel(i)} className="relative flex-1 h-10 text-[14px] font-semibold" style={{ color: i === sel ? 'var(--app-text)' : 'var(--app-muted)', transition: 'color .2s' }}>
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Categories({ block }) {
  const rt = useRt();
  const cols = block.columns || 4;
  if (block.style === 'image') {
    return (
      <div>
        <SectionHead pad eyebrow={block.eyebrow} title={block.title} onAction={block.action ? () => rt.run(block.action) : null} />
        <div className="hscroll gap-3 px-5">
          {block.items.map((c, i) => (
            <motion.button key={i} type="button" whileTap={{ scale: 0.95 }} onClick={() => rt.run(c.action || { type: 'toast', message: c.label })} className="relative shrink-0 overflow-hidden text-left" style={{ width: 118, height: 130, borderRadius: 'var(--app-radius)' }}>
              <Img src={c.image} w={320} className="absolute inset-0" />
              <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)' }} />
              <span className="absolute left-3 bottom-2.5 right-2 text-white text-[13.5px] font-bold leading-tight">{c.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} onAction={block.action ? () => rt.run(block.action) : null} />
      <div className="grid gap-y-4 gap-x-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {block.items.map((c, i) => (
          <motion.button key={i} type="button" whileTap={{ scale: 0.9 }} onClick={() => rt.run(c.action || { type: 'toast', message: c.label })} className="flex flex-col items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <span
              className="w-[60px] h-[60px] flex items-center justify-center"
              style={{
                borderRadius: 'min(var(--app-radius), 22px)',
                background: c.color ? `color-mix(in srgb, ${c.color} 16%, var(--app-bg))` : i % 2 ? 'var(--app-accent-soft)' : 'var(--app-primary-soft)',
                color: c.color || (i % 2 ? 'var(--app-accent)' : 'var(--app-primary-ink)'),
              }}
            >
              <Icon name={c.icon} size={26} />
            </span>
            <span className="text-[12px] font-semibold text-center leading-tight line-clamp-2">{c.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function Actions({ block }) {
  const rt = useRt();
  return (
    <div className="px-5">
      <SectionHead eyebrow={block.eyebrow} title={block.title} />
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${block.columns || 4}, 1fr)` }}>
        {block.items.map((a, i) => (
          <motion.button key={i} type="button" whileTap={{ scale: 0.9 }} onClick={() => rt.run(a.action || { type: 'toast', message: a.label })} className="flex flex-col items-center gap-2">
            <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: i === 0 ? 'var(--app-primary)' : 'var(--app-surface)', color: i === 0 ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
              <Icon name={a.icon} size={22} />
            </span>
            <span className="text-[12px] font-semibold text-center leading-tight">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
