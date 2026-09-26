import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRt, useScreen } from '../context.js';
import { Avatar, Btn, Icon, Media, MotionBg, Toggle, Rich } from '../ui.jsx';
import { Illustration, CATEGORY_ILLU } from '../illustrations.jsx';
import { Words } from './media.jsx';
import { LiveChat, digits } from '../live.jsx';

// ───────────────────────── Onboarding plein écran ─────────────────────────
export function Onboarding({ block }) {
  const rt = useRt();
  const [i, setI] = useState(0);
  const slides = block.slides;
  const s = slides[Math.min(i, slides.length - 1)];
  const last = i >= slides.length - 1;
  const next = () => (last ? rt.run(block.action || { type: 'home' }) : setI(i + 1));
  const hasMedia = !!s.media?.src;
  const illu = s.illustration || (!hasMedia ? CATEGORY_ILLU[rt.spec.meta.category] || 'success' : null);
  return (
    <motion.div className="absolute inset-0 overflow-hidden" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18} onDragEnd={(_, info) => {
      if (info.offset.x < -60 && !last) setI(i + 1);
      if (info.offset.x > 60 && i > 0) setI(i - 1);
    }}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          {hasMedia ? (
            <>
              <Media media={s.media} w={1100} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,6,10,0.94) 0%, rgba(6,6,10,0.55) 38%, rgba(6,6,10,0.05) 65%, rgba(6,6,10,0.35) 100%)' }} />
            </>
          ) : (
            <div className="absolute inset-0 bg-app-bg">
              <div className="absolute inset-x-0 top-0 h-[62%] overflow-hidden" style={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
                <MotionBg intensity={0.55} />
              </div>
              <div className="absolute inset-x-0 flex justify-center" style={{ top: rt.safeTop + 70 }}>
                <div className="p-6 rounded-[40px] bg-app-bg/85 backdrop-blur" style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.4)' }}>
                  <Illustration name={illu} size={230} />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {block.skip && !last && (
        <button type="button" onClick={() => rt.run(block.action || { type: 'home' })} className="absolute right-5 z-10 h-9 px-4 rounded-full text-[13px] font-semibold" style={{ top: rt.safeTop + 6, background: hasMedia ? 'rgba(255,255,255,0.16)' : 'var(--app-surface)', color: hasMedia ? '#fff' : 'var(--app-text)', backdropFilter: 'blur(10px)' }}>
          Passer
        </button>
      )}
      <div className="absolute inset-x-0 bottom-0 px-6" style={{ paddingBottom: rt.safeBottom + 26, color: hasMedia ? '#fff' : 'var(--app-text)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            {i === 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-[16px]" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>
                  {rt.spec.meta.name[0]}
                </span>
                <span className="font-bold text-[16px]">{rt.spec.meta.name}</span>
              </div>
            )}
            <Words text={s.title} className="app-heading text-[32px] font-extrabold leading-[1.05]" />
            {s.text && <p className="text-[15px] leading-relaxed mt-3" style={{ opacity: 0.8 }}>{s.text}</p>}
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-between mt-7">
          <div className="flex gap-1.5">
            {slides.map((_, k) => (
              <motion.span key={k} className="h-2 rounded-full" animate={{ width: k === i ? 26 : 8, opacity: k === i ? 1 : 0.35 }} style={{ background: hasMedia ? '#fff' : 'var(--app-primary)' }} />
            ))}
          </div>
          <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={next} data-tour="onboarding-next" className="h-14 flex items-center justify-center gap-2 font-bold text-[15px]" animate={{ width: last ? 170 : 56 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} style={{ borderRadius: 999, background: 'var(--app-primary)', color: 'var(--app-on-primary)', boxShadow: '0 14px 30px -12px var(--app-primary)' }}>
            {last ? (
              <>
                {block.cta} <Icon name="arrow-right" size={18} />
              </>
            ) : (
              <Icon name="arrow-right" size={22} />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ───────────────────────── Connexion par téléphone + OTP ─────────────────────────
export function Auth({ block }) {
  const rt = useRt();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('77 123 45 67');
  const [otp, setOtp] = useState('');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (f, ms) => timers.current.push(setTimeout(f, ms));
  useEffect(() => {
    if (step !== 'otp') return;
    later(() => rt.toast('SMS reçu : code 4821', 'message-circle'), 900);
    '4821'.split('').forEach((d, i) => later(() => setOtp((o) => o + d), 1400 + i * 220));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  useEffect(() => {
    if (otp.length === 4) later(() => setStep('verified'), 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);
  useEffect(() => {
    if (step === 'verified') later(() => rt.run(block.action || { type: 'home' }), 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  return (
    <div className="relative px-6 flex flex-col" style={{ paddingTop: rt.safeTop + 36, minHeight: 700 }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="w-16 h-16 rounded-[20px] flex items-center justify-center font-extrabold text-[26px] relative overflow-hidden" style={{ color: 'var(--app-on-primary)', boxShadow: '0 16px 30px -14px var(--app-primary)' }}>
        <MotionBg grain={false} />
        <span className="relative">{rt.spec.meta.name[0]}</span>
      </motion.div>
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div key="phone" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <Words as="h1" text={block.title} className="app-heading text-[30px] font-extrabold leading-tight mt-7" />
            <p className="text-[15px] text-app-muted mt-2">{block.subtitle}</p>
            {block.method === 'email' ? (
              <div className="flex flex-col gap-3 mt-7">
                <input defaultValue="awa.diop@gmail.com" className="h-14 px-4 bg-app-surface outline-none text-[15.5px]" style={{ borderRadius: 'min(var(--app-radius), 18px)' }} />
                <input type="password" defaultValue="motdepasse" className="h-14 px-4 bg-app-surface outline-none text-[15.5px]" style={{ borderRadius: 'min(var(--app-radius), 18px)' }} />
              </div>
            ) : (
              <div className="flex items-center h-[58px] bg-app-surface mt-7 overflow-hidden" style={{ borderRadius: 'min(var(--app-radius), 18px)' }}>
                <span className="h-full px-4 flex items-center gap-1.5 font-semibold border-r border-app-border">🇸🇳 +221</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="flex-1 min-w-0 h-full px-4 bg-transparent outline-none text-[17px] font-semibold tracking-wide" />
              </div>
            )}
            <Btn full size="lg" className="mt-4" onClick={() => (block.method === 'email' ? setStep('verified') : setStep('otp'))}>
              <span data-tour="auth-continue">{block.method === 'email' ? 'Se connecter' : 'Recevoir le code'}</span>
            </Btn>
            {block.social && (
              <>
                <div className="flex items-center gap-3 my-6 text-[12.5px] text-app-muted">
                  <span className="flex-1 h-px bg-app-border" /> ou <span className="flex-1 h-px bg-app-border" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <Btn full variant="outline" icon="globe" onClick={() => setStep('verified')}>
                    Continuer avec Google
                  </Btn>
                  <Btn full variant="outline" icon="smartphone" onClick={() => setStep('verified')}>
                    Continuer avec Apple
                  </Btn>
                </div>
              </>
            )}
            <p className="text-[11.5px] text-app-muted text-center mt-6 leading-relaxed">{block.terms || 'En continuant, tu acceptes les conditions d\'utilisation et la politique de confidentialité.'}</p>
          </motion.div>
        ) : (
          <motion.div key="otp" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <h1 className="app-heading text-[28px] font-extrabold leading-tight mt-7">Code de vérification</h1>
            <p className="text-[15px] text-app-muted mt-2">Envoyé par SMS au +221 {phone}</p>
            <div className="flex gap-3 mt-7">
              {[0, 1, 2, 3].map((k) => (
                <motion.div key={k} animate={{ scale: otp.length === k + 1 ? [1, 1.08, 1] : 1, boxShadow: otp.length === k ? '0 0 0 2px var(--app-primary)' : '0 0 0 1px var(--app-border)' }} className="flex-1 h-16 flex items-center justify-center app-heading text-[26px] font-bold bg-app-surface" style={{ borderRadius: 'min(var(--app-radius), 18px)' }}>
                  {otp[k] || ''}
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[14px] font-semibold min-h-[24px]" style={{ color: step === 'verified' ? 'var(--app-success)' : 'var(--app-muted)' }}>
              {step === 'verified' ? (
                <>
                  <Icon name="circle-check" size={18} /> Numéro vérifié
                </>
              ) : (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-flex">
                    <Icon name="refresh-cw" size={16} />
                  </motion.span>
                  Lecture automatique du SMS…
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────── Profil ─────────────────────────
export function Profile({ block }) {
  const rt = useRt();
  return (
    <div className="px-5">
      <div className="relative overflow-hidden p-5 pt-6 text-center" style={{ borderRadius: 'var(--app-radius-lg)' }}>
        <MotionBg intensity={0.35} />
        <div className="absolute inset-0 bg-app-bg/55" />
        <div className="relative flex flex-col items-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <Avatar src={block.avatar || rt.userAvatar} name={block.name} size={92} ring />
          </motion.div>
          <p className="app-heading text-[22px] font-extrabold mt-3">{block.name}</p>
          <p className="text-[13.5px] text-app-muted">{block.subtitle}</p>
          {block.badge && (
            <span className="inline-flex items-center gap-1 h-7 px-3 mt-2.5 rounded-full text-[12px] font-bold" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>
              <Icon name="crown" size={13} /> {block.badge}
            </span>
          )}
        </div>
      </div>
      {block.stats?.length > 0 && (
        <div className="app-card grid mt-3 py-3" style={{ gridTemplateColumns: `repeat(${block.stats.length}, 1fr)` }}>
          {block.stats.map((s, i) => (
            <div key={i} className={`text-center ${i ? 'border-l border-app-border' : ''}`}>
              <p className="app-heading text-[20px] font-extrabold">{s.value}</p>
              <p className="text-[12px] text-app-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Réglages / menu ─────────────────────────
export function Settings({ block }) {
  const rt = useRt();
  const [toggles, setToggles] = useState({});
  return (
    <div className="px-5 flex flex-col gap-5">
      {block.groups.map((g, gi) => (
        <div key={gi}>
          {g.title && <p className="text-[12.5px] font-semibold text-app-muted uppercase tracking-wide mb-2 ml-1">{g.title}</p>}
          <div className="app-card overflow-hidden">
            {g.items.map((it, i) => {
              const key = `${gi}-${i}`;
              const on = toggles[key] ?? it.toggle;
              return (
                <motion.div key={i} whileTap={it.toggle === undefined ? { scale: 0.985 } : undefined} onClick={() => (it.toggle !== undefined ? setToggles({ ...toggles, [key]: !on }) : rt.run(it.action || (it.danger ? { type: 'toast', message: 'Déconnecté' } : { type: 'toast', message: it.label })))} className="relative flex items-center gap-3 px-4 py-3 cursor-pointer">
                  <span className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: it.danger ? 'color-mix(in srgb, var(--app-danger) 12%, transparent)' : i % 3 === 0 ? 'var(--app-primary-soft)' : i % 3 === 1 ? 'var(--app-accent-soft)' : 'var(--app-surface)', color: it.danger ? 'var(--app-danger)' : i % 3 === 0 ? 'var(--app-primary-ink)' : i % 3 === 1 ? 'var(--app-accent)' : 'var(--app-text)' }}>
                    <Icon name={it.icon} size={18} />
                  </span>
                  <span className="flex-1 font-semibold text-[15px]" style={{ color: it.danger ? 'var(--app-danger)' : undefined }}>{it.label}</span>
                  {it.badge && <span className="h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }}>{it.badge}</span>}
                  {it.value && <span className="text-[13.5px] text-app-muted">{it.value}</span>}
                  {it.toggle !== undefined ? <Toggle on={on} onChange={(v) => setToggles({ ...toggles, [key]: v })} /> : !it.danger && <Icon name="chevron-right" size={17} className="text-app-muted" />}
                  {i < g.items.length - 1 && <span className="absolute bottom-0 right-0 left-[64px] h-px bg-app-border" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── Messagerie ─────────────────────────
const DEFAULT_REPLIES = ['Avec plaisir ! 😊', 'C\'est noté, je m\'en occupe tout de suite.', 'Tu peux payer par Wave ou Orange Money à la réception.', 'Merci pour ta confiance 🙏'];
export function Chat({ block }) {
  const rt = useRt();
  if (rt.live) return <LiveChat block={block} />;
  return <DemoChat block={block} />;
}

function DemoChat({ block }) {
  const rt = useRt();
  const [msgs, setMsgs] = useState(() => (block.messages.length ? block.messages : [{ from: 'them', text: `Bonjour 👋 Bienvenue chez ${rt.spec.meta.name} ! Comment puis-je t'aider ?`, time: '09:41' }]));
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const n = useRef(0);
  const box = useRef(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);
  const now = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const send = (t) => {
    const v = (t ?? text).trim();
    if (!v) return;
    setMsgs((m) => [...m, { from: 'me', text: v, time: now() }]);
    setText('');
    setTyping(true);
    const replies = block.replies.length ? block.replies : DEFAULT_REPLIES;
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: 'them', text: replies[n.current++ % replies.length], time: now() }]);
    }, 1300);
  };
  const c = block.contact;
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-3 px-5 pb-3 border-b border-app-border">
        <Avatar src={c.avatar} name={c.name} size={42} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] truncate">{c.name}</p>
          <p className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--app-success)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--app-success)' }} /> {typing ? 'écrit…' : c.status}
          </p>
        </div>
        <button type="button" onClick={() => rt.run({ type: 'call', phone: c.name })} className="w-10 h-10 rounded-full bg-app-surface flex items-center justify-center">
          <Icon name="phone" size={18} />
        </button>
      </div>
      <div ref={box} className="app-scroll flex-1 min-h-0 px-4 py-4 flex flex-col gap-2">
        <p className="text-center text-[11.5px] text-app-muted mb-1">Aujourd'hui</p>
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }} className={`max-w-[78%] px-3.5 py-2.5 text-[14.5px] leading-snug ${m.from === 'me' ? 'self-end' : 'self-start'}`} style={{ borderRadius: 20, borderBottomRightRadius: m.from === 'me' ? 6 : 20, borderBottomLeftRadius: m.from === 'me' ? 20 : 6, background: m.from === 'me' ? 'var(--app-primary)' : 'var(--app-surface)', color: m.from === 'me' ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
            {m.text}
            {m.time && <span className="block text-[10.5px] mt-1 opacity-60 text-right">{m.time}</span>}
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="self-start px-4 py-3.5 rounded-[20px] bg-app-surface flex gap-1">
              {[0, 1, 2].map((k) => (
                <span key={k} className="w-2 h-2 rounded-full bg-app-muted" style={{ animation: `typing 1s ${k * 0.15}s infinite` }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {block.quick.length > 0 && (
        <div className="hscroll gap-2 px-4 pb-2">
          {block.quick.map((q, i) => (
            <button key={i} type="button" onClick={() => send(q)} className="shrink-0 h-9 px-3.5 rounded-full text-[13px] font-semibold" style={{ background: 'var(--app-primary-soft)', color: 'var(--app-primary-ink)' }}>
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-3 pt-2 border-t border-app-border" style={{ paddingBottom: rt.safeBottom + 10 }}>
        <button type="button" className="w-10 h-10 rounded-full bg-app-surface flex items-center justify-center shrink-0" onClick={() => rt.toast('Pièce jointe', 'camera')}>
          <Icon name="plus" size={19} />
        </button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={block.placeholder} className="flex-1 min-w-0 h-11 px-4 rounded-full bg-app-surface outline-none text-[15px]" />
        <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => send()} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }} data-tour="chat-send">
          <Icon name={text ? 'send' : 'mic'} size={19} />
        </motion.button>
      </div>
    </div>
  );
}

// ───────────────────────── Formulaire ─────────────────────────
export function Form({ block }) {
  const rt = useRt();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const formRef = useRef(null);
  const live = !!rt.live;
  // Site en ligne : les valeurs d'exemple deviennent de simples indications
  const val = (f) => (live ? undefined : f.value);
  const ph = (f) => (live ? f.placeholder || f.value || '' : f.placeholder);
  const submit = async () => {
    if (!live) {
      setSent(true);
      rt.run(block.submit?.action || { type: 'toast', message: 'Envoyé avec succès ✓' });
      setTimeout(() => setSent(false), 1600);
      return;
    }
    setErr('');
    const champs = {};
    const data = {};
    const els = formRef.current?.querySelectorAll('[data-field]') || [];
    els.forEach((el) => {
      const f = block.fields[Number(el.dataset.field)];
      const v = String(el.value || '').trim().slice(0, 1000);
      if (!f || !v) return;
      champs[f.label] = v;
      if (f.type === 'phone' || /t[ée]l|phone|whatsapp|num[ée]ro/i.test(f.label)) data.telephone ??= v;
      else if (f.type === 'email' || /e-?mail/i.test(f.label)) data.email ??= v;
      else if (f.type === 'textarea' || /message|demande|question/i.test(f.label)) data.message ??= v;
      else if (/nom|name|pr[ée]nom/i.test(f.label)) data.nom ??= v;
    });
    if (!Object.keys(champs).length) return setErr('Remplis le formulaire avant d\'envoyer.');
    const phoneField = block.fields.find((f) => f.type === 'phone');
    if (phoneField && data.telephone && digits(data.telephone).length < 8) return setErr('Numéro de téléphone invalide.');
    setBusy(true);
    try {
      const kind = /inscri|adh[ée]|rejoin|abonne/i.test(`${block.title} ${block.submit?.label || ''}`) ? 'inscription' : 'message';
      await rt.live.submit(kind, { ...data, champs });
      formRef.current?.querySelectorAll('[data-field]').forEach((el) => (el.tagName === 'SELECT' ? null : (el.value = '')));
      setSent(true);
      const a = block.submit?.action;
      if (a && ['navigate', 'tab', 'modal', 'home'].includes(a.type)) rt.run(a);
      else rt.toast('Envoyé ✓ On te répond très vite', 'circle-check');
      setTimeout(() => setSent(false), 2400);
    } catch (e) {
      setErr(e.message || 'Envoi impossible, réessaie.');
    }
    setBusy(false);
  };
  return (
    <div className="px-5">
      {block.title && <h2 className="app-heading text-[22px] font-bold"><Rich text={block.title} /></h2>}
      {block.subtitle && <p className="text-[14px] text-app-muted mt-1">{block.subtitle}</p>}
      <div ref={formRef} className="flex flex-col gap-3 mt-4">
        {block.fields.map((f, i) => (
          <label key={i} className="block">
            <span className="block text-[12.5px] font-semibold text-app-muted mb-1.5 ml-1">{f.label}</span>
            {f.type === 'textarea' ? (
              <textarea data-field={i} defaultValue={val(f)} placeholder={ph(f)} rows={4} className="w-full p-4 bg-app-surface outline-none text-[15px] resize-none focus:ring-2" style={{ borderRadius: 'min(var(--app-radius), 18px)', '--tw-ring-color': 'var(--app-primary)' }} />
            ) : f.type === 'select' ? (
              <select data-field={i} defaultValue={f.value || f.options[0]} className="w-full h-[52px] px-4 bg-app-surface outline-none text-[15px] appearance-none" style={{ borderRadius: 'min(var(--app-radius), 18px)', color: 'var(--app-text)' }}>
                {(f.options.length ? f.options : ['Option 1', 'Option 2']).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : f.type === 'phone' ? (
              <div className="flex items-center h-[52px] bg-app-surface overflow-hidden" style={{ borderRadius: 'min(var(--app-radius), 18px)' }}>
                <span className="h-full px-3.5 flex items-center gap-1 text-[14.5px] font-semibold border-r border-app-border">🇸🇳 +221</span>
                <input data-field={i} defaultValue={val(f)} placeholder={ph(f) || '77 123 45 67'} inputMode="tel" className="flex-1 min-w-0 h-full px-3.5 bg-transparent outline-none text-[15px]" />
              </div>
            ) : (
              <input data-field={i} type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : f.type === 'password' ? 'password' : 'text'} defaultValue={val(f)} placeholder={ph(f)} className="w-full h-[52px] px-4 bg-app-surface outline-none text-[15px]" style={{ borderRadius: 'min(var(--app-radius), 18px)', colorScheme: rt.palette.dark ? 'dark' : 'light' }} />
            )}
          </label>
        ))}
      </div>
      {err && (
        <p className="text-[13px] mt-3 font-medium" style={{ color: 'var(--app-danger)' }} role="alert">
          {err}
        </p>
      )}
      <Btn full size="lg" className="mt-5" onClick={submit} style={{ opacity: busy ? 0.7 : 1 }}>
        <span className="flex items-center gap-2" data-tour="form-submit" data-live="form-submit">
          {busy ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : sent ? <Icon name="check" size={18} /> : null}
          {block.submit?.label || 'Envoyer'}
        </span>
      </Btn>
    </div>
  );
}
