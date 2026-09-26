// Éléments de compte partagés : pastille de crédits, menu du compte,
// fenêtre « plus de crédits » et fenêtre « donner mon avis ».
import { useState } from 'react';
import { motion } from 'motion/react';
import { I, Menu, MenuItem, Modal, Button } from './kit.jsx';
import { Link, go } from '../router.jsx';
import { BRAND } from '../config.js';
import { cloudEnabled, useAuth, signOut, sendFeedback } from '../lib/cloud.js';
import { TRIAL, TOPUP, COSTS } from '../../shared/plans.js';

export const loginUrl = (next = location.pathname + location.search, signup = true) => `/connexion?${signup ? 'mode=inscription&' : ''}next=${encodeURIComponent(next)}`;

export function initials(name, email) {
  const src = (name || email || '?').trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase();
}

export function CreditsPill({ compact = false }) {
  const profile = useAuth((s) => s.profile);
  if (!profile) return null;
  const low = profile.credits < COSTS.create;
  return (
    <Link to="/espace?tab=credits" title="Mes crédits" className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border text-[13px] font-semibold tabular-nums ${low ? 'border-ember/40 bg-ember/10 text-[#ffb3bf]' : 'border-white/10 bg-white/[0.04] text-sand hover:bg-white/[0.08]'}`} data-testid="credits-pill">
      <I n="coins" s={15} className={low ? '' : 'text-gold'} />
      {profile.credits}
      {!compact && <span className="font-normal text-dune">crédits</span>}
    </Link>
  );
}

export function AccountMenu({ onFeedback }) {
  const user = useAuth((s) => s.user);
  const profile = useAuth((s) => s.profile);
  if (!cloudEnabled) return null;
  if (!user)
    return (
      <Link to={loginUrl(undefined, false)} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl text-[13px] font-medium text-sand/85 hover:text-sand hover:bg-white/[0.06]">
        <I n="user" s={16} /> Connexion
      </Link>
    );
  return (
    <Menu
      width={250}
      button={(toggle) => (
        <button type="button" onClick={toggle} className="w-9 h-9 rounded-full text-[12.5px] font-bold text-white flex items-center justify-center bg-[linear-gradient(135deg,#ff7a3d,#c8367c)] ring-2 ring-white/10 hover:ring-white/25" aria-label="Mon compte" data-testid="account-menu">
          {initials(profile?.full_name, user.email)}
        </button>
      )}
    >
      <div className="px-3 pt-2 pb-2.5 border-b border-white/[0.07] mb-1">
        <p className="text-[13.5px] font-semibold truncate">{profile?.full_name || 'Mon compte'}</p>
        <p className="text-[12px] text-dune truncate">{user.email}</p>
      </div>
      <MenuItem icon="layout-grid" onClick={() => go('/espace')}>
        Mes sites
      </MenuItem>
      <MenuItem icon="message-circle" onClick={() => go('/espace?tab=messages')}>
        Messages reçus
      </MenuItem>
      <MenuItem icon="coins" onClick={() => go('/espace?tab=credits')}>
        Crédits : {profile?.credits ?? '…'}
      </MenuItem>
      {onFeedback && (
        <MenuItem icon="star" onClick={onFeedback}>
          Donner mon avis
        </MenuItem>
      )}
      {profile?.is_admin && (
        <MenuItem icon="shield-check" onClick={() => go('/admin')}>
          Administration
        </MenuItem>
      )}
      <MenuItem icon="log-out" danger onClick={async () => (await signOut(), go('/'))}>
        Se déconnecter
      </MenuItem>
    </Menu>
  );
}

export function CreditsModal({ open, onClose, need }) {
  const profile = useAuth((s) => s.profile);
  const msg = `Bonjour, je teste ${BRAND.name} (${profile?.email || ''}) et j'aimerais recevoir plus de crédits.`;
  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div className="p-7">
        <div className="w-14 h-14 rounded-2xl bg-gold/15 text-gold flex items-center justify-center">
          <I n="coins" s={26} />
        </div>
        <h2 className="font-display text-[36px] leading-none mt-5">Plus assez de crédits</h2>
        <p className="text-dune text-[14.5px] mt-3 leading-relaxed">
          Il te reste <span className="text-sand font-semibold">{profile?.credits ?? 0} crédit{(profile?.credits ?? 0) > 1 ? 's' : ''}</span>
          {need ? ` et cette action en demande ${need}.` : '.'}{' '}
          {TRIAL ? 'Pendant la phase d\'essai, les crédits sont offerts : demande-nous en sur WhatsApp.' : `Recharge ${TOPUP.credits} crédits pour ${TOPUP.price.toLocaleString('fr-FR')} F, ou choisis un forfait.`}
        </p>
        <p className="text-[13px] text-dune mt-3">En attendant, tu peux toujours partir d'un modèle et modifier ton site toi-même : c'est gratuit.</p>
        <div className="mt-6 flex flex-col gap-2">
          <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="h-12 rounded-2xl inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-white bg-[#25D366] hover:brightness-110">
            <I n="message-circle" s={18} /> {TRIAL ? 'Demander des crédits' : 'Recharger par WhatsApp'}
          </a>
          <Button variant="ghost" size="lg" onClick={() => (onClose(), go('/tarifs'))}>
            Voir les forfaits
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function FeedbackModal({ open, onClose }) {
  const user = useAuth((s) => s.user);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const close = () => {
    onClose();
    setTimeout(() => (setDone(false), setRating(0), setMessage(''), setErr('')), 300);
  };
  const submit = async () => {
    setErr('');
    if (!rating && message.trim().length < 3) return setErr('Donne une note ou écris quelques mots.');
    setBusy(true);
    try {
      await sendFeedback({ rating, message, email: user ? '' : email });
      setDone(true);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };
  const labels = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Génial !'];
  return (
    <Modal open={open} onClose={close} width={460}>
      <div className="p-7">
        {done ? (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="w-16 h-16 mx-auto rounded-2xl bg-baobab/15 text-baobab flex items-center justify-center">
              <I n="heart" s={28} />
            </motion.div>
            <h2 className="font-display text-[36px] leading-none mt-5">Merci !</h2>
            <p className="text-dune text-[14.5px] mt-3">Ton avis nous aide à améliorer {BRAND.name} pour tout le monde.</p>
            <Button variant="subtle" size="lg" className="mt-6 w-full" onClick={close}>
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-[36px] leading-none">Ton avis compte</h2>
            <p className="text-dune text-[14.5px] mt-3">Qu'est-ce qui t'a plu ? Qu'est-ce qui manque ou ne marche pas ?</p>
            <div className="mt-6 flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} className="p-1" aria-label={`${n} étoile${n > 1 ? 's' : ''}`}>
                  <motion.span animate={{ scale: (hover || rating) >= n ? 1.08 : 1 }} className="inline-flex">
                    <I n="star" s={30} className={(hover || rating) >= n ? 'text-gold' : 'text-white/20'} fill={(hover || rating) >= n ? 'currentColor' : 'none'} />
                  </motion.span>
                </button>
              ))}
              <span className="ml-2 text-[13.5px] text-dune">{labels[hover || rating]}</span>
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Ton message (facultatif)" className="mt-4 w-full rounded-2xl bg-white/[0.05] border border-white/10 p-4 text-[14.5px] text-sand placeholder:text-dune/60 outline-none focus:border-sunset/70 resize-none" data-testid="feedback-message" />
            {!user && <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Ton e-mail, si tu veux une réponse (facultatif)" className="mt-2 w-full h-12 rounded-2xl bg-white/[0.05] border border-white/10 px-4 text-[14.5px] text-sand placeholder:text-dune/60 outline-none focus:border-sunset/70" />}
            {err && <p className="mt-3 text-[13.5px] text-[#ffb3bf]">{err}</p>}
            <Button variant="accent" size="lg" className="w-full mt-5" loading={busy} onClick={submit} data-testid="feedback-submit">
              Envoyer mon avis
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

// Bouton flottant « Ton avis » (pages du compte et studio)
export function FeedbackButton({ className = '' }) {
  const [open, setOpen] = useState(false);
  if (!cloudEnabled) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12.5px] font-medium bg-white/[0.06] border border-white/10 text-sand/85 hover:text-sand hover:bg-white/[0.1] ${className}`} data-testid="feedback-button">
        <I n="star" s={14} className="text-gold" /> Ton avis
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
