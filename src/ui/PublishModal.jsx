// Fenêtre « Publier mon site » : adresse, numéro WhatsApp de réception, mise en ligne,
// puis lien, QR code et partage. Utilisée dans le studio et dans l'espace client.
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Modal, Button, I } from './kit.jsx';
import { publishSite, unpublishSite, slugAvailable, slugify, publicSiteUrl, normPhone, useAuth, SITES_DOMAIN, frError } from '../lib/cloud.js';

const box = 'w-full h-12 rounded-2xl bg-white/[0.05] border border-white/10 px-4 text-[15px] text-sand placeholder:text-dune/60 outline-none focus:border-sunset/70 transition-colors';

export function PublishModal({ open, onClose, site, beforePublish, onChange }) {
  const profile = useAuth((s) => s.profile);
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [check, setCheck] = useState({ state: 'idle' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const timer = useRef();

  useEffect(() => {
    if (!open || !site) return;
    setSlug(site.slug || slugify(site.name).slice(0, 30) || '');
    setPhone(site.settings?.whatsapp || normPhone(profile?.phone) || '');
    setErr('');
    setDone(site.published ? { slug: site.slug, again: true } : null);
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, site?.id]);

  // Vérification de l'adresse pendant la saisie
  useEffect(() => {
    if (!open || done) return;
    clearTimeout(timer.current);
    if (!slug) return setCheck({ state: 'idle' });
    if (!/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) return setCheck({ state: 'bad', text: '3 à 40 caractères : lettres, chiffres et tirets' });
    if (slug === site?.slug) return setCheck({ state: 'ok', text: 'C\'est ton adresse actuelle' });
    setCheck({ state: 'checking' });
    timer.current = setTimeout(async () => {
      try {
        const ok = await slugAvailable(slug, site?.id);
        setCheck(ok ? { state: 'ok', text: 'Adresse disponible' } : { state: 'bad', text: 'Déjà prise ou réservée' });
      } catch {
        setCheck({ state: 'idle' });
      }
    }, 380);
    return () => clearTimeout(timer.current);
  }, [slug, open, done, site?.id, site?.slug]);

  const url = done ? publicSiteUrl(done.slug) : '';
  useEffect(() => {
    if (!url) return setQr('');
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#0b0a10', light: '#ffffff' } }).then(setQr, () => setQr(''));
  }, [url]);

  const publish = async () => {
    setErr('');
    setBusy(true);
    try {
      const id = (await beforePublish?.()) || site.id;
      const s = await publishSite(id, slug, phone ? normPhone(phone) : '');
      setDone({ slug: s, first: !site.published });
      onChange?.({ ...site, id, slug: s, published: true, settings: { ...(site.settings || {}), whatsapp: normPhone(phone) } });
    } catch (e) {
      setErr(e.message || frError(e));
    }
    setBusy(false);
  };
  const unpublish = async () => {
    if (!confirm('Mettre ce site hors ligne ? Tu pourras le republier quand tu veux.')) return;
    setBusy(true);
    try {
      await unpublishSite(site.id);
      onChange?.({ ...site, published: false });
      onClose();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Adresse de ton site :', url);
    }
  };

  const prefix = SITES_DOMAIN ? null : `${location.host}/s/`;
  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div className="relative p-6 sm:p-7">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 w-9 h-9 rounded-xl text-dune hover:text-sand hover:bg-white/[0.06] flex items-center justify-center">
          <I n="x" s={18} />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="w-14 h-14 rounded-2xl bg-baobab/15 text-baobab flex items-center justify-center">
                <I n={done.again ? 'globe' : 'party-popper'} s={26} />
              </div>
              <h2 className="font-display text-[38px] leading-none mt-5">{done.again ? 'Ton site est en ligne' : 'Ton site est en ligne !'}</h2>
              <p className="text-dune text-[14.5px] mt-3">{done.again ? 'Tu as fait des changements ? Mets à jour la version en ligne en un clic.' : 'Partage-le à tes clients sur WhatsApp, Instagram ou TikTok.'}</p>
              <div className="mt-6 flex items-stretch gap-4">
                {qr && <img src={qr} alt="QR code du site" className="w-[108px] h-[108px] rounded-2xl bg-white p-1.5 shrink-0" />}
                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  <a href={url} target="_blank" rel="noreferrer" className="block truncate rounded-2xl bg-white/[0.05] border border-white/10 px-4 h-12 leading-[48px] text-[14.5px] text-sand hover:border-white/25" data-testid="published-url">
                    {url.replace(/^https?:\/\//, '')}
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="subtle" icon={copied ? 'check' : 'copy'} onClick={copy}>
                      {copied ? 'Copié' : 'Copier'}
                    </Button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Découvre mon site : ${url}`)}`} target="_blank" rel="noreferrer" className="h-10 rounded-xl inline-flex items-center justify-center gap-2 text-[14px] font-medium text-white bg-[#25D366] hover:brightness-110">
                      <I n="message-circle" s={17} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                {done.again ? (
                  <Button variant="accent" size="lg" className="flex-1" icon="refresh-cw" loading={busy} onClick={publish} data-testid="republish">
                    Mettre à jour le site
                  </Button>
                ) : (
                  <a href={url} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-2xl inline-flex items-center justify-center gap-2 text-[15px] font-semibold bg-sand text-ink hover:bg-white">
                    Voir mon site <I n="arrow-up-right" s={17} />
                  </a>
                )}
                {done.again && (
                  <Button variant="ghost" size="lg" onClick={() => setDone(null)}>
                    Changer l'adresse
                  </Button>
                )}
              </div>
              {err && <p className="mt-3 text-[13.5px] text-[#ffb3bf]">{err}</p>}
              {(done.again || site?.published) && (
                <button type="button" onClick={unpublish} className="mt-5 text-[13px] text-dune hover:text-[#ff9aa8] inline-flex items-center gap-1.5">
                  <I n="eye-off" s={14} /> Mettre hors ligne
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-[12px] uppercase tracking-[0.2em] text-sunset">Publication</p>
              <h2 className="font-display text-[38px] leading-none mt-3">Mets ton site en ligne</h2>
              <p className="text-dune text-[14.5px] mt-3">Il sera visible par tout le monde, sur téléphone comme sur ordinateur.</p>
              <label className="block mt-6">
                <span className="block text-[12.5px] text-dune mb-2">Adresse de ton site</span>
                <div className={`flex items-center rounded-2xl bg-white/[0.05] border ${check.state === 'bad' ? 'border-ember/60' : check.state === 'ok' ? 'border-baobab/50' : 'border-white/10'} focus-within:border-sunset/70 overflow-hidden`}>
                  {prefix && <span className="pl-4 text-[14.5px] text-dune whitespace-nowrap">{prefix}</span>}
                  <input value={slug} onChange={(e) => setSlug(slugify(e.target.value.replace(/\s/g, '-')) + (e.target.value.endsWith('-') ? '-' : ''))} className="flex-1 min-w-0 h-12 bg-transparent px-1 text-[15px] text-sand outline-none" style={{ paddingLeft: prefix ? 2 : 16 }} placeholder="mon-salon" aria-label="Adresse du site" data-testid="slug-input" />
                  {SITES_DOMAIN && <span className="pr-4 text-[14.5px] text-dune whitespace-nowrap">.{SITES_DOMAIN}</span>}
                </div>
                <span className={`flex items-center gap-1.5 text-[12.5px] mt-2 min-h-[18px] ${check.state === 'bad' ? 'text-[#ff9aa8]' : check.state === 'ok' ? 'text-baobab' : 'text-dune'}`}>
                  {check.state === 'checking' && <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                  {check.state === 'ok' && <I n="check" s={14} />}
                  {check.state === 'checking' ? 'Vérification…' : check.text || ''}
                </span>
              </label>
              <label className="block mt-3">
                <span className="block text-[12.5px] text-dune mb-2">Ton numéro WhatsApp (pour recevoir commandes et réservations)</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="77 123 45 67" className={box} data-testid="publish-phone" />
              </label>
              {err && <p className="mt-4 text-[13.5px] text-[#ffb3bf] bg-ember/10 border border-ember/30 rounded-2xl px-3.5 py-2.5">{err}</p>}
              <Button variant="accent" size="lg" className="w-full !h-[52px] mt-6" icon="globe" loading={busy} disabled={check.state === 'bad' || check.state === 'checking' || !slug} onClick={publish} data-testid="publish-submit">
                {site?.published ? 'Mettre à jour le site' : 'Publier mon site'}
              </Button>
              <p className="text-[12px] text-dune/80 mt-3 text-center">Gratuit pendant la phase d'essai. Tu peux le modifier ou le retirer à tout moment.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
