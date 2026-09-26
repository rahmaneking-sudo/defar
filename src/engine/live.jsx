// ─────────────────────────────────────────────────────────────────────────────
// Mode « site en ligne » : quand une maquette est publiée, ses formulaires
// deviennent réels. Pas de faux paiement : commandes, réservations et messages
// sont envoyés au propriétaire (espace Défar + WhatsApp).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRt } from './context.js';
import { Btn, Icon, Money, Avatar } from './ui.jsx';
import { formatMoney } from '../../shared/utils.js';

export const digits = (s) => String(s || '').replace(/\D/g, '');
// Numéros d'exemple des modèles (à ne jamais appeler pour de vrai)
export function isDemoPhone(p) {
  const d = digits(p);
  return !d || /0{6}/.test(d) || /^(221)?338200000$/.test(d) || /^(221)?771234567$/.test(d);
}
export function intlPhone(p) {
  const d = digits(p).replace(/^00/, '');
  if (d.length === 9 && /^[37]/.test(d)) return '221' + d;
  return d;
}
export const prettyPhone = (p) => {
  const d = intlPhone(p);
  const local = d.startsWith('221') ? d.slice(3) : d;
  return local.length === 9 ? `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}` : p;
};
export function waLink(phone, text) {
  const d = intlPhone(phone);
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
export const ref = (kind) => `${kind === 'reservation' ? 'RDV' : kind === 'message' ? 'MSG' : 'CMD'}-${Math.floor(10000 + Math.random() * 89999)}`;

// Texte envoyé au vendeur sur WhatsApp
export function summaryText({ kind, siteName, data, currency }) {
  const L = [];
  const title = { commande: 'Nouvelle commande', reservation: 'Demande de réservation', abonnement: 'Demande d\'abonnement', message: 'Nouveau message', inscription: 'Nouvelle inscription' }[kind] || 'Nouveau message';
  L.push(`*${title}* — ${siteName}`);
  if (data.ref) L.push(`Réf. ${data.ref}`);
  if (Array.isArray(data.articles)) for (const a of data.articles) L.push(`• ${a.quantite || 1} × ${a.titre}${a.prix ? ` — ${formatMoney(a.prix, currency, false)}` : ''}`);
  if (data.service) L.push(`• ${data.service}${data.prix ? ` — ${formatMoney(data.prix, currency, false)}` : ''}`);
  if (data.date || data.creneau) L.push(`📅 ${[data.date, data.creneau].filter(Boolean).join(' à ')}${data.avec ? ` avec ${data.avec}` : ''}`);
  if (data.livraison) L.push(`Livraison : ${formatMoney(data.livraison, currency, false)}`);
  if (data.total) L.push(`Total : ${formatMoney(data.total, currency, false)}`);
  if (data.nom) L.push(`👤 ${data.nom}`);
  if (data.telephone) L.push(`📞 ${data.telephone}`);
  if (data.adresse) L.push(`📍 ${data.adresse}`);
  if (data.paiement) L.push(`💳 ${data.paiement}`);
  if (data.message) L.push(`💬 ${data.message}`);
  if (data.note) L.push(`📝 ${data.note}`);
  return L.join('\n');
}

const field = 'w-full h-[52px] px-4 bg-app-surface outline-none text-[15px] focus:ring-2';
const fieldStyle = { borderRadius: 'min(var(--app-radius), 18px)', '--tw-ring-color': 'var(--app-primary)' };

function Input({ label, ...p }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-semibold text-app-muted mb-1.5 ml-1">{label}</span>
      {p.rows ? <textarea {...p} className={`${field} h-auto py-3.5 resize-none`} style={fieldStyle} /> : <input {...p} className={field} style={fieldStyle} />}
    </label>
  );
}

// ───────── Formulaire de commande / réservation (remplace le faux paiement) ─────────
export function LiveOrderForm({ block = {}, onDone, sheet = false }) {
  const rt = useRt();
  const draft = rt.order?.status === 'draft' ? rt.order : null;
  const booking = rt.booking?.service?.title ? rt.booking : null;
  const cart = rt.cart;
  const kind = cart.length ? 'commande' : booking && !draft ? 'reservation' : draft?.lines?.[0]?.title?.startsWith('Offre') ? 'abonnement' : 'commande';
  const articles = useMemo(() => {
    if (cart.length) return cart.map((i) => ({ titre: i.title, quantite: i.qty, prix: i.price * i.qty }));
    if (draft?.lines?.length) return draft.lines.map((l) => ({ titre: l.title, quantite: l.qty || 1, prix: l.price }));
    return [];
  }, [cart, draft]);
  const fee = cart.length ? draft?.fee || 0 : 0;
  const total = cart.length ? rt.cartTotal + fee - (draft?.discount || 0) : draft?.total || (booking?.service?.price ?? 0);
  const methods = (block.methods?.length ? block.methods : ['wave', 'orange_money', 'cash']).filter((m) => m !== 'card');
  const METHOD_LABEL = { wave: 'Wave', orange_money: 'Orange Money', free_money: 'Mixx by Yas', cash: kind === 'reservation' ? 'Sur place' : 'À la livraison' };
  const [f, setF] = useState({ nom: '', telephone: '', adresse: '', note: '', paiement: methods.includes('cash') ? 'cash' : methods[0] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const merchant = rt.spec.meta.name;
  const empty = kind === 'commande' && !articles.length;

  const submit = async () => {
    setErr('');
    if (f.nom.trim().length < 2) return setErr('Indique ton nom.');
    if (digits(f.telephone).length < 8) return setErr('Indique un numéro de téléphone valide.');
    if (empty) return setErr('Ton panier est vide.');
    const r = ref(kind);
    const data = {
      ref: r,
      nom: f.nom.trim().slice(0, 80),
      telephone: f.telephone.trim().slice(0, 30),
      ...(kind === 'commande' && f.adresse.trim() ? { adresse: f.adresse.trim().slice(0, 200) } : {}),
      ...(articles.length ? { articles: articles.slice(0, 40) } : {}),
      ...(booking && kind === 'reservation' ? { service: booking.service.title, date: booking.dateLabel, creneau: booking.slot, ...(booking.staff ? { avec: booking.staff } : {}), ...(booking.service.price ? { prix: booking.service.price } : {}) } : {}),
      ...(fee > 0 ? { livraison: fee } : {}),
      ...(total > 0 ? { total, devise: rt.currency } : {}),
      paiement: METHOD_LABEL[f.paiement] || f.paiement,
      ...(f.note.trim() ? { note: f.note.trim().slice(0, 600) } : {}),
    };
    setBusy(true);
    try {
      await rt.live.submit(kind, data);
      const text = summaryText({ kind, siteName: merchant, data, currency: rt.currency });
      rt.setOrder({ status: 'sent', kind, ref: r, total, lines: articles.map((a) => ({ title: a.titre, qty: a.quantite, price: a.prix })), phone: data.telephone, name: data.nom, text, date: new Date() });
      rt.clearCart();
      onDone?.();
      if (rt.routes.success) rt.navigate(rt.routes.success);
      else rt.toast(kind === 'reservation' ? 'Demande de réservation envoyée ✓' : 'Commande envoyée ✓', 'circle-check');
    } catch (e) {
      setErr(e.message || 'Envoi impossible. Vérifie ta connexion et réessaie.');
    }
    setBusy(false);
  };

  return (
    <div className={sheet ? 'px-5 pb-4' : 'px-5'}>
      {!sheet && (
        <div className="relative overflow-hidden p-5" style={{ borderRadius: 'var(--app-radius-lg)', background: 'linear-gradient(145deg, var(--app-primary), color-mix(in srgb, var(--app-accent) 55%, var(--app-primary)))', color: 'var(--app-on-primary)' }}>
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <p className="relative text-[13px] font-semibold opacity-85">{kind === 'reservation' ? 'Ta réservation' : kind === 'abonnement' ? 'Ton offre' : 'Ta commande'}</p>
          {total > 0 && (
            <p className="relative app-heading text-[34px] font-extrabold leading-tight mt-1 tabular-nums">
              <Money value={total} currency={rt.currency} />
            </p>
          )}
          <p className="relative text-[12.5px] opacity-85 mt-1 flex items-center gap-1.5">
            <Icon name="shield-check" size={14} /> Aucun paiement en ligne : {merchant} te contacte pour confirmer
          </p>
        </div>
      )}
      {(articles.length > 0 || booking) && (
        <div className="app-card p-4 mt-3 flex flex-col gap-2 text-[14px]">
          {articles.map((a, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                <span className="text-app-muted">{a.quantite} ×</span> {a.titre}
              </span>
              {a.prix > 0 && <Money value={a.prix} currency={rt.currency} className="font-semibold shrink-0" />}
            </div>
          ))}
          {fee > 0 && (
            <div className="flex justify-between gap-3 text-app-muted">
              <span>Livraison</span>
              <Money value={fee} currency={rt.currency} className="shrink-0" />
            </div>
          )}
          {booking && !articles.length && (
            <div className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="block font-semibold truncate">{booking.service.title}</span>
                <span className="block text-[12.5px] text-app-muted">{[booking.dateLabel, booking.slot, booking.staff && `avec ${booking.staff}`].filter(Boolean).join(' · ')}</span>
              </span>
              {booking.service.price > 0 && <Money value={booking.service.price} currency={rt.currency} className="font-semibold shrink-0" />}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 mt-5">
        <Input label="Ton nom" value={f.nom} onChange={set('nom')} placeholder="Prénom et nom" autoComplete="name" data-live="nom" />
        <Input label="Ton numéro (WhatsApp de préférence)" value={f.telephone} onChange={set('telephone')} placeholder="77 123 45 67" inputMode="tel" autoComplete="tel" data-live="telephone" />
        {kind === 'commande' && <Input label="Adresse de livraison (facultatif)" value={f.adresse} onChange={set('adresse')} placeholder="Quartier, rue, point de repère" autoComplete="street-address" />}
        {total > 0 && methods.length > 1 && (
          <div>
            <span className="block text-[12.5px] font-semibold text-app-muted mb-1.5 ml-1">Comment veux-tu payer ?</span>
            <div className="flex flex-wrap gap-2">
              {methods.map((m) => (
                <button key={m} type="button" onClick={() => setF((x) => ({ ...x, paiement: m }))} className="h-10 px-3.5 text-[13.5px] font-semibold" style={{ borderRadius: 999, background: f.paiement === m ? 'var(--app-primary)' : 'var(--app-surface)', color: f.paiement === m ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
                  {METHOD_LABEL[m] || m}
                </button>
              ))}
            </div>
          </div>
        )}
        <Input label="Un message pour le vendeur (facultatif)" value={f.note} onChange={set('note')} placeholder="Précisions, horaires…" rows={3} />
      </div>
      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[13px] mt-3 font-medium" style={{ color: 'var(--app-danger)' }} role="alert">
            {err}
          </motion.p>
        )}
      </AnimatePresence>
      <Btn full size="lg" className="mt-5" onClick={submit} style={{ boxShadow: '0 16px 30px -14px var(--app-primary)', opacity: busy ? 0.7 : 1 }}>
        <span className="flex items-center gap-2" data-live="submit">
          {busy ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Icon name="send" size={17} />}
          {kind === 'reservation' ? 'Envoyer ma réservation' : kind === 'abonnement' ? 'Envoyer ma demande' : 'Envoyer ma commande'}
        </span>
      </Btn>
      <p className="text-center text-[11.5px] text-app-muted mt-3">Tes coordonnées sont transmises uniquement à {merchant}.</p>
    </div>
  );
}

// ───────── Confirmation après envoi ─────────
export function LiveSuccessExtra() {
  const rt = useRt();
  const o = rt.order;
  if (!o || o.status !== 'sent' || !rt.live?.whatsapp) return null;
  return (
    <a href={waLink(rt.live.whatsapp, o.text)} target="_blank" rel="noreferrer" className="w-full h-[54px] flex items-center justify-center gap-2 font-semibold text-[15.5px] text-white" style={{ borderRadius: 'min(var(--app-radius), 999px)', background: '#25D366' }} data-live="whatsapp-confirm">
      <Icon name="message-circle" size={19} /> Envoyer aussi sur WhatsApp
    </a>
  );
}

// ───────── Messagerie réelle : le visiteur écrit, laisse son numéro, le vendeur reçoit ─────────
export function LiveChat({ block }) {
  const rt = useRt();
  const name = rt.spec.meta.name;
  const c = block.contact || {};
  const [msgs, setMsgs] = useState(() => [{ from: 'them', text: `Bonjour 👋 Bienvenue chez ${name} ! Écris-nous ton message, on te répond très vite.` }]);
  const [text, setText] = useState('');
  const [pending, setPending] = useState([]);
  const [ask, setAsk] = useState(false);
  const [who, setWho] = useState({ nom: '', telephone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, ask]);
  const say = (from, t) => setMsgs((m) => [...m, { from, text: t }]);
  const send = (t) => {
    const v = (t ?? text).trim();
    if (!v) return;
    setText('');
    say('me', v);
    if (who.sent) return deliver([v], who);
    setPending((p) => [...p, v]);
    if (!ask) setTimeout(() => (say('them', 'Merci ! Pour qu\'on puisse te répondre, laisse ton prénom et ton numéro WhatsApp 🙂'), setAsk(true)), 500);
  };
  const deliver = async (lines, person) => {
    setBusy(true);
    try {
      await rt.live.submit('message', { nom: person.nom.trim(), telephone: person.telephone.trim(), message: lines.join('\n') });
      setWho({ ...person, sent: true });
      setPending([]);
      setAsk(false);
      say('them', `C'est envoyé ✓ Merci ${person.nom.trim().split(' ')[0]} ! On te répond très vite sur WhatsApp.`);
    } catch (e) {
      setErr(e.message || 'Envoi impossible, réessaie.');
    }
    setBusy(false);
  };
  const confirm = () => {
    setErr('');
    if (who.nom.trim().length < 2) return setErr('Indique ton prénom.');
    if (digits(who.telephone).length < 8) return setErr('Numéro invalide.');
    deliver(pending, who);
  };
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-3 px-5 pb-3 border-b border-app-border">
        <Avatar src={c.avatar} name={c.name || name} size={42} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] truncate">{c.name || name}</p>
          <p className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--app-success)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--app-success)' }} /> Répond en général dans l'heure
          </p>
        </div>
        {rt.live?.whatsapp && (
          <a href={waLink(rt.live.whatsapp)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: '#25D366' }} aria-label="WhatsApp">
            <Icon name="message-circle" size={18} />
          </a>
        )}
      </div>
      <div ref={box} className="app-scroll flex-1 min-h-0 px-4 py-4 flex flex-col gap-2">
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`max-w-[80%] px-3.5 py-2.5 text-[14.5px] leading-snug ${m.from === 'me' ? 'self-end' : 'self-start'}`} style={{ borderRadius: 20, borderBottomRightRadius: m.from === 'me' ? 6 : 20, borderBottomLeftRadius: m.from === 'me' ? 20 : 6, background: m.from === 'me' ? 'var(--app-primary)' : 'var(--app-surface)', color: m.from === 'me' ? 'var(--app-on-primary)' : 'var(--app-text)' }}>
            {m.text}
          </motion.div>
        ))}
        {ask && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="app-card p-3.5 flex flex-col gap-2 mt-1">
            <input value={who.nom} onChange={(e) => setWho({ ...who, nom: e.target.value })} placeholder="Ton prénom" className="h-11 px-3.5 rounded-xl bg-app-surface outline-none text-[14.5px]" data-live="chat-nom" />
            <input value={who.telephone} onChange={(e) => setWho({ ...who, telephone: e.target.value })} placeholder="Ton numéro WhatsApp" inputMode="tel" className="h-11 px-3.5 rounded-xl bg-app-surface outline-none text-[14.5px]" data-live="chat-telephone" />
            {err && <p className="text-[12.5px]" style={{ color: 'var(--app-danger)' }}>{err}</p>}
            <Btn full onClick={confirm}>
              <span data-live="chat-confirm">{busy ? 'Envoi…' : 'Envoyer mon message'}</span>
            </Btn>
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-2 px-3 pt-2 border-t border-app-border" style={{ paddingBottom: rt.safeBottom + 10 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={block.placeholder || 'Écris ton message…'} className="flex-1 min-w-0 h-11 px-4 rounded-full bg-app-surface outline-none text-[15px]" data-live="chat-input" />
        <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => send()} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--app-primary)', color: 'var(--app-on-primary)' }} aria-label="Envoyer">
          <Icon name="send" size={19} />
        </motion.button>
      </div>
    </div>
  );
}

// ───────── Pied de page d'un site publié ─────────
export function LiveFooter() {
  const rt = useRt();
  const { spec, web, tabs } = rt;
  const live = rt.live || {};
  const year = new Date().getFullYear();
  if (!web) {
    return (
      <div className="px-5 pt-6 pb-2 text-center">
        <p className="text-[12px] text-app-muted">
          © {year} {spec.meta.name}
          {live.badge && (
            <>
              {' · '}
              <a href={live.badgeUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Créé avec Défar
              </a>
            </>
          )}
        </p>
      </div>
    );
  }
  return (
    <footer className="mt-10 border-t border-app-border" data-web-footer>
      <div className="max-w-[1160px] mx-auto px-6 py-12 grid md:grid-cols-[1.4fr_1fr_1fr] gap-10">
        <div>
          <p className="app-heading text-[22px] font-extrabold">{spec.meta.name}</p>
          {spec.meta.tagline && <p className="text-[14px] text-app-muted mt-2 max-w-sm leading-relaxed">{spec.meta.tagline}</p>}
        </div>
        {tabs.length > 1 && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-app-muted mb-3">Pages</p>
            <ul className="space-y-2 text-[14.5px]">
              {tabs.map((t) => (
                <li key={t.screen}>
                  <button type="button" onClick={() => rt.run({ type: 'tab', to: t.screen })} className="hover:underline underline-offset-4">
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {live.whatsapp && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-app-muted mb-3">Contact</p>
            <a href={waLink(live.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[14.5px] hover:underline underline-offset-4">
              <Icon name="message-circle" size={16} /> {prettyPhone(live.whatsapp)}
            </a>
          </div>
        )}
      </div>
      <div className="border-t border-app-border">
        <div className="max-w-[1160px] mx-auto px-6 h-14 flex items-center justify-between text-[12.5px] text-app-muted">
          <span>
            © {year} {spec.meta.name}
          </span>
          {live.badge && (
            <a href={live.badgeUrl} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
              Créé avec Défar
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

// Ouvre le formulaire de commande : écran de paiement s'il existe, sinon une feuille
export function openOrder(rt, kind = 'commande') {
  if (rt.routes.checkout) return rt.navigate(rt.routes.checkout);
  rt.openSheet({ title: kind === 'reservation' ? 'Confirmer ta réservation' : 'Finaliser ta commande', render: (close) => <LiveOrderForm sheet onDone={close} /> });
}
