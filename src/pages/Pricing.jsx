// /tarifs : forfaits, crédits, recharge. Pendant la phase d'essai, tout est gratuit.
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { SiteHeader, SiteFooter } from '../ui/site.jsx';
import { I, Pattern } from '../ui/kit.jsx';
import { Link } from '../router.jsx';
import { BRAND } from '../config.js';
import { PLANS, COSTS, TOPUP, TRIAL, WELCOME_CREDITS } from '../../shared/plans.js';
import { storedUser } from '../lib/cloud.js';

const fcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ')} F`;
const wa = (text) => `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;

const FAQ = [
  ['C\'est quoi, un crédit ?', `Les crédits servent à utiliser l'IA : créer une app coûte ${COSTS.create} crédits, une modification demandée à l'IA coûte ${COSTS.edit} crédit. Partir d'un modèle, modifier toi-même les textes et les photos, ou publier ton site ne coûte rien.`],
  ['Comment je paie ?', 'Par Wave, Orange Money, Mixx by Yas ou carte bancaire, directement depuis ton espace. Pas besoin de carte : un téléphone suffit.'],
  ['Est-ce que mon forfait se renouvelle tout seul ?', 'Non. Le mobile money ne prélève pas automatiquement : tu paies 30 jours d\'avance, et on te rappelle quand il faut renouveler. Tu restes libre.'],
  ['Que devient mon site si j\'arrête ?', 'Ton site reste enregistré dans ton compte. Il est simplement mis hors ligne jusqu\'à ta prochaine recharge, et tu retrouves tout à l\'identique.'],
  ['Mes clients peuvent vraiment commander ?', 'Oui. Les commandes, réservations et messages envoyés depuis ton site arrivent dans ton espace Défar, et ton client peut aussi te les envoyer directement sur WhatsApp.'],
];

export default function Pricing() {
  const logged = !!storedUser();
  useEffect(() => {
    document.title = `Tarifs — ${BRAND.name}`;
  }, []);
  const start = logged ? '/studio' : '/connexion?mode=inscription&next=/studio';
  return (
    <div className="min-h-full bg-ink text-sand">
      <SiteHeader active="/tarifs" />
      <section className="relative pt-36 pb-16 px-5 overflow-hidden">
        <Pattern opacity={0.035} />
        <div className="absolute left-1/2 -translate-x-1/2 -top-40 w-[900px] h-[520px] rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(closest-side, #ff5a4d, transparent)' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[12px] uppercase tracking-[0.24em] text-sand/60">Tarifs</p>
          <h1 className="font-display text-[52px] md:text-[76px] leading-[0.95] mt-4">
            Simple, en <em className="text-sunset">francs CFA</em>.
          </h1>
          <p className="text-sand/70 text-[17px] mt-5 max-w-xl mx-auto leading-relaxed">Des crédits pour créer avec l'IA, des forfaits pour mettre tes sites en ligne. Paiement par Wave ou Orange Money.</p>
          {TRIAL && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 rounded-3xl sm:rounded-full border border-baobab/40 bg-baobab/10 px-5 py-3 text-left">
              <span className="inline-flex items-center gap-2 text-baobab text-[13px] font-semibold uppercase tracking-[0.12em]">
                <span className="w-2 h-2 rounded-full bg-baobab animate-pulse" /> Phase d'essai
              </span>
              <span className="text-[14.5px] text-sand/90">Tout est gratuit pour l'instant : {WELCOME_CREDITS} crédits offerts à l'inscription.</span>
            </motion.div>
          )}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.06 }}
              className={`relative rounded-[28px] p-6 flex flex-col ${p.highlight ? 'bg-[linear-gradient(160deg,#2a1a22,#15131c_55%)] border border-sunset/50 shadow-[0_30px_80px_-40px_rgba(255,90,77,0.7)]' : 'bg-white/[0.03] border border-white/[0.08]'}`}
            >
              {p.highlight && <span className="absolute -top-3 left-6 px-3 h-6 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] text-white bg-[linear-gradient(135deg,#ff7a3d,#ff4d5e_55%,#c8367c)] flex items-center">Le plus choisi</span>}
              <h2 className="text-[15px] font-semibold">{p.name}</h2>
              <p className="text-[13px] text-dune mt-1 min-h-[38px]">{p.blurb}</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-[46px] leading-none">{p.price ? fcfa(p.price) : 'Gratuit'}</span>
                {p.price > 0 && <span className="text-[13px] text-dune">/ mois</span>}
              </p>
              <ul className="mt-6 space-y-2.5 text-[14px] text-sand/85 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <I n="check" s={16} className={`mt-0.5 shrink-0 ${p.highlight ? 'text-sunset' : 'text-baobab'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              {p.price === 0 || TRIAL ? (
                <Link to={start} className={`mt-7 h-11 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold ${p.highlight ? 'bg-sand text-ink hover:bg-white' : 'bg-white/[0.07] hover:bg-white/[0.12]'}`}>
                  {TRIAL && p.price ? 'Essayer gratuitement' : 'Commencer'} <I n="arrow-right" s={16} />
                </Link>
              ) : (
                <a href={wa(`Bonjour, je veux le forfait ${p.name} de ${BRAND.name}.`)} target="_blank" rel="noreferrer" className="mt-7 h-11 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold bg-white/[0.07] hover:bg-white/[0.12]">
                  Choisir {p.name}
                </a>
              )}
              <p className="text-[11.5px] text-dune text-center mt-2.5">{p.price ? (TRIAL ? 'Paiement disponible après la phase d\'essai' : 'Wave, Orange Money ou carte') : 'Sans engagement, sans carte'}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-4">
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-7">
            <h2 className="font-display text-[34px] leading-none">Ce que coûte chaque action</h2>
            <div className="mt-6 divide-y divide-white/[0.06]">
              {[
                ['wand-sparkles', 'Créer une app avec l\'IA', `${COSTS.create} crédits`],
                ['pencil', 'Modifier avec l\'IA (« passe en vert », « ajoute un écran »…)', `${COSTS.edit} crédit`],
                ['layout-grid', 'Partir d\'un modèle par métier', 'Gratuit'],
                ['sliders-horizontal', 'Modifier toi-même textes, photos, prix', 'Gratuit'],
                ['globe', 'Publier ton site et le mettre à jour', 'Inclus'],
                ['message-circle', 'Recevoir commandes et réservations', 'Inclus'],
              ].map(([ic, l, v]) => (
                <div key={l} className="flex items-center gap-4 py-3.5">
                  <span className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                    <I n={ic} s={17} />
                  </span>
                  <span className="flex-1 text-[14.5px] text-sand/85">{l}</span>
                  <span className={`text-[14px] font-semibold ${/Gratuit|Inclus/.test(v) ? 'text-baobab' : ''}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] p-7 border border-white/[0.08] bg-[linear-gradient(150deg,#1d1a25,#121118)] flex flex-col">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-40" style={{ background: 'radial-gradient(closest-side, #f2b544, transparent)' }} />
            <p className="relative text-[12px] uppercase tracking-[0.2em] text-gold">Recharge</p>
            <h2 className="relative font-display text-[40px] leading-none mt-3">
              {TOPUP.credits} crédits
              <br />
              <span className="text-sand/60">pour {fcfa(TOPUP.price)}</span>
            </h2>
            <p className="relative text-[14px] text-sand/75 mt-4 leading-relaxed flex-1">Tu as besoin de plus ? Recharge à tout moment, sans changer de forfait. Les crédits achetés n'expirent pas.</p>
            <div className="relative mt-6 flex items-center gap-2 text-[12.5px] text-dune">
              {['Wave', 'Orange Money', 'Mixx by Yas', 'Carte'].map((m) => (
                <span key={m} className="px-2.5 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[40px] leading-none text-center">Questions fréquentes</h2>
          <div className="mt-8 space-y-2.5">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 open:bg-white/[0.04]">
                <summary className="list-none cursor-pointer h-14 flex items-center justify-between gap-4 text-[15px] font-medium">
                  {q}
                  <I n="plus" s={18} className="shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="pb-5 -mt-1 text-[14.5px] text-sand/75 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to={start} className="inline-flex h-12 px-6 items-center gap-2 rounded-2xl text-white text-[15px] font-semibold bg-[linear-gradient(135deg,#ff7a3d,#ff4d5e_55%,#c8367c)] shadow-[0_14px_40px_-14px_rgba(255,77,94,0.9)] hover:brightness-110">
              Créer mon site gratuitement <I n="arrow-right" s={17} />
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
