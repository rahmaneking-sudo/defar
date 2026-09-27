// /connexion : créer un compte, se connecter, mot de passe oublié.
// /nouveau-mot-de-passe : arrivée depuis le lien reçu par e-mail.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo, I, Button } from '../../ui/kit.jsx';
import { Link, go, useRoute } from '../../router.jsx';
import { cloudEnabled, useAuth, signIn, signUp, sendPasswordReset, updatePassword, frError, googleEnabled, signInWithGoogle } from '../../lib/cloud.js';
import { WELCOME_CREDITS, TRIAL } from '../../../shared/plans.js';

const field = 'w-full h-12 rounded-2xl bg-white/[0.05] border border-white/10 px-4 text-[15px] text-sand placeholder:text-dune/60 outline-none focus:border-sunset/70 focus:bg-white/[0.07] transition-colors';

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/espace');

function Shell({ children }) {
  return (
    <div className="min-h-[100dvh] bg-ink text-sand grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12">
        <img src="/media/hero-poster.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(11,10,16,0.35),rgba(11,10,16,0.92)_70%)]" />
        <div className="absolute -bottom-40 -left-24 w-[520px] h-[520px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, #ff5a4d 0%, transparent 65%)' }} />
        <Link to="/" className="relative">
          <Logo />
        </Link>
        <div className="relative max-w-md">
          <p className="text-[12px] uppercase tracking-[0.22em] text-sand/60">Ton site en ligne</p>
          <h2 className="font-display text-[54px] leading-[0.98] mt-4">
            Décris ton activité. <em className="text-sunset">On construit</em> le reste.
          </h2>
          <ul className="mt-8 space-y-3 text-[15px] text-sand/85">
            {[
              ['sparkles', `${WELCOME_CREDITS} crédits offerts à l'inscription`],
              ['globe', 'Ton site publié en quelques minutes'],
              ['message-circle', 'Commandes et réservations reçues sur WhatsApp'],
              ['smartphone', 'Parfait sur téléphone comme sur ordinateur'],
            ].map(([ic, t]) => (
              <li key={t} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center">
                  <I n={ic} s={16} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[12.5px] text-sand/45">« Défar » veut dire construire, en wolof.</p>
      </aside>
      <main className="relative flex flex-col px-5 sm:px-10 py-6 lg:py-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="lg:hidden">
            <Logo size={28} />
          </Link>
          <Link to="/" className="text-[13px] text-dune hover:text-sand inline-flex items-center gap-1.5">
            <I n="arrow-left" s={15} /> Accueil
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}

function ErrorLine({ text }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 text-[13.5px] text-[#ffb3bf] bg-ember/10 border border-ember/30 rounded-2xl px-3.5 py-2.5" role="alert">
          <I n="circle-alert" s={16} className="mt-0.5 shrink-0" />
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function PasswordInput({ value, onChange, placeholder = 'Mot de passe', autoComplete = 'current-password', name = 'password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={`${field} pr-12`} required minLength={6} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-dune hover:text-sand flex items-center justify-center" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
        <I n={show ? 'eye-off' : 'eye'} s={17} />
      </button>
    </div>
  );
}

export default function AuthPage() {
  const { path, search } = useRoute();
  if (path === '/nouveau-mot-de-passe') return <NewPassword />;
  return <Connexion initial={search.get('mode') === 'inscription' ? 'signup' : 'login'} next={safeNext(search.get('next'))} />;
}

function Connexion({ initial, next }) {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const [mode, setMode] = useState(initial);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [google, setGoogle] = useState(false);
  const [gBusy, setGBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }));

  useEffect(() => {
    useAuth.getState().init();
    document.title = 'Connexion — Défar';
    googleEnabled().then(setGoogle);
    // retour de Google avec une erreur (fenêtre fermée, accès refusé…)
    const q = new URLSearchParams(location.hash.slice(1) + '&' + location.search.slice(1));
    if (q.get('error')) setErr(q.get('error') === 'access_denied' ? 'Connexion Google annulée.' : 'La connexion avec Google n\'a pas abouti. Réessaie ou utilise ton e-mail.');
  }, []);
  const withGoogle = async () => {
    setErr('');
    setGBusy(true);
    try {
      await signInWithGoogle(next);
    } catch (e2) {
      setErr(e2.message || frError(e2));
      setGBusy(false);
    }
  };
  useEffect(() => {
    if (ready && user && !done) go(next, { replace: true });
  }, [ready, user, next, done]);

  if (!cloudEnabled) {
    return (
      <Shell>
        <h1 className="font-display text-[42px] leading-none">Bientôt disponible</h1>
        <p className="text-dune mt-4 text-[15px] leading-relaxed">Les comptes s'ouvrent très bientôt. En attendant, tu peux déjà créer ta maquette : elle est enregistrée sur cet appareil.</p>
        <Button variant="accent" size="lg" className="w-full mt-8" iconRight="arrow-right" onClick={() => go('/studio')}>
          Ouvrir le studio
        </Button>
      </Shell>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (form.name.trim().length < 2) throw new Error('Indique ton nom.');
        const r = await signUp(form);
        if (r.needsConfirmation) setDone({ kind: 'confirm', email: form.email });
      } else if (mode === 'login') {
        await signIn(form);
      } else {
        await sendPasswordReset(form.email);
        setDone({ kind: 'reset', email: form.email });
      }
    } catch (e2) {
      setErr(e2.message || frError(e2));
    }
    setBusy(false);
  };

  if (done) {
    return (
      <Shell>
        <div className="w-14 h-14 rounded-2xl bg-baobab/15 text-baobab flex items-center justify-center">
          <I n="mail" s={26} />
        </div>
        <h1 className="font-display text-[40px] leading-none mt-6">Regarde tes e-mails</h1>
        <p className="text-dune mt-4 text-[15px] leading-relaxed">
          {done.kind === 'confirm' ? 'Nous avons envoyé un lien de confirmation à ' : 'Nous avons envoyé un lien pour choisir un nouveau mot de passe à '}
          <span className="text-sand">{done.email}</span>. Pense à vérifier les courriers indésirables.
        </p>
        <Button variant="outline" size="lg" className="w-full mt-8" onClick={() => (setDone(null), setMode('login'))}>
          Revenir à la connexion
        </Button>
      </Shell>
    );
  }

  const titles = {
    signup: ['Crée ton compte', TRIAL ? `Gratuit pendant la phase d'essai · ${WELCOME_CREDITS} crédits offerts` : `${WELCOME_CREDITS} crédits offerts`],
    login: ['Bon retour', 'Connecte-toi pour retrouver tes sites'],
    reset: ['Mot de passe oublié', 'Indique ton e-mail : tu recevras un lien pour en choisir un nouveau.'],
  };
  return (
    <Shell>
      {mode !== 'reset' && (
        <div className="relative flex p-1 rounded-2xl bg-white/[0.05] border border-white/[0.07] mb-8" role="tablist">
          {/* repère glissant en CSS : reste à sa place même quand la page change de hauteur */}
          <span aria-hidden="true" className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-sand pointer-events-none" style={{ transform: `translateX(${mode === 'login' ? 100 : 0}%)`, transition: 'transform .4s cubic-bezier(.2,.9,.25,1.1)' }} />
          {[
            ['signup', 'Créer un compte'],
            ['login', 'Se connecter'],
          ].map(([m, l]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => (setMode(m), setErr(''))} className={`relative flex-1 h-10 rounded-xl text-[14px] font-medium transition-colors ${mode === m ? 'text-ink' : 'text-sand/70 hover:text-sand'}`}>
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
      )}
      <h1 className="font-display text-[44px] leading-[0.95]">{titles[mode][0]}</h1>
      <p className="text-dune mt-3 text-[14.5px]">{titles[mode][1]}</p>
      {google && mode !== 'reset' && (
        <>
          <button type="button" onClick={withGoogle} disabled={gBusy} data-testid="auth-google" className="mt-7 w-full h-[52px] rounded-2xl bg-white text-[#1f1f1f] font-semibold text-[15px] inline-flex items-center justify-center gap-2.5 hover:bg-white/90 disabled:opacity-60 transition-colors">
            {gBusy ? <I n="loader-circle" s={18} className="animate-spin" /> : <I n="log-in" s={18} />}
            Continuer avec Google
          </button>
          <div className="flex items-center gap-3 mt-6 text-[12px] text-dune/80">
            <span className="h-px flex-1 bg-white/10" />
            ou avec ton e-mail
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}
      <form onSubmit={submit} className={`${google && mode !== 'reset' ? 'mt-5' : 'mt-7'} space-y-3`} noValidate>
        {mode === 'signup' && (
          <>
            <input name="name" value={form.name} onChange={set('name')} placeholder="Prénom et nom" autoComplete="name" className={field} required />
            <input name="phone" value={form.phone} onChange={set('phone')} placeholder="Numéro WhatsApp (facultatif)" autoComplete="tel" inputMode="tel" className={field} />
          </>
        )}
        <input name="email" type="email" value={form.email} onChange={set('email')} placeholder="Adresse e-mail" autoComplete="email" inputMode="email" className={field} required />
        {mode !== 'reset' && <PasswordInput value={form.password} onChange={set('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'Mot de passe (6 caractères minimum)' : 'Mot de passe'} />}
        {mode === 'login' && (
          <div className="flex justify-end">
            <button type="button" onClick={() => (setMode('reset'), setErr(''))} className="text-[13px] text-dune hover:text-sand underline-offset-4 hover:underline">
              Mot de passe oublié ?
            </button>
          </div>
        )}
        <ErrorLine text={err} />
        <Button type="submit" variant="accent" size="lg" className="w-full !h-[52px] mt-2" loading={busy} iconRight={busy ? undefined : 'arrow-right'} data-testid="auth-submit">
          {mode === 'signup' ? 'Créer mon compte' : mode === 'login' ? 'Me connecter' : 'Envoyer le lien'}
        </Button>
        {mode === 'reset' && (
          <button type="button" onClick={() => (setMode('login'), setErr(''))} className="w-full h-11 text-[14px] text-dune hover:text-sand">
            Revenir à la connexion
          </button>
        )}
      </form>
      {mode === 'signup' && <p className="text-[12px] text-dune/80 mt-6 leading-relaxed">Aucune carte bancaire demandée. Tes informations servent uniquement à ton compte Défar.</p>}
    </Shell>
  );
}

function NewPassword() {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    useAuth.getState().init();
    document.title = 'Nouveau mot de passe — Défar';
    const t = setTimeout(() => setExpired(true), 6000);
    return () => clearTimeout(t);
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw.length < 6) return setErr('Le mot de passe doit faire au moins 6 caractères.');
    setBusy(true);
    try {
      await updatePassword(pw);
      go('/espace', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    }
    setBusy(false);
  };
  if (!cloudEnabled || (ready && !user && expired)) {
    return (
      <Shell>
        <h1 className="font-display text-[40px] leading-none">Lien expiré</h1>
        <p className="text-dune mt-4 text-[15px]">Ce lien n'est plus valable. Demande-en un nouveau depuis la page de connexion.</p>
        <Button variant="accent" size="lg" className="w-full mt-8" onClick={() => go('/connexion')}>
          Revenir à la connexion
        </Button>
      </Shell>
    );
  }
  return (
    <Shell>
      <h1 className="font-display text-[44px] leading-[0.95]">Nouveau mot de passe</h1>
      <p className="text-dune mt-3 text-[14.5px]">{user ? `Pour le compte ${user.email}` : 'Vérification du lien…'}</p>
      <form onSubmit={submit} className="mt-7 space-y-3">
        <PasswordInput value={pw} onChange={setPw} autoComplete="new-password" placeholder="Nouveau mot de passe" name="new-password" />
        <ErrorLine text={err} />
        <Button type="submit" variant="accent" size="lg" className="w-full !h-[52px]" loading={busy} disabled={!user}>
          Enregistrer et continuer
        </Button>
      </form>
    </Shell>
  );
}
