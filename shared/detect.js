// Détection du secteur d'une idée d'app (FR / EN / wolof courant).
import { deaccent } from './utils.js';

const RULES = [
  ['delivery', /livr|delivery|coursier|colis|yobbu|yobal|commande de repas|food delivery|glovo|uber ?eats|jakarta/],
  ['restaurant', /restau|resto|dibiterie|fast.?food|traiteur|thieb|ceebu|yassa|mafe|pizzeria|burger|menu du jour|plats?\b|dibi|patisserie|boulangerie|cafe\b|coffee|dibiterie/],
  ['beauty', /coiff|salon|tresse|natte|barb|beaute|beauty|maquill|onglerie|ongles|spa\b|esthet|cosmet|soin du visage|makeup|perruque|meche/],
  ['fashion', /mode\b|wax|pagne|couture|tailleur|vetement|habit|robe|boubou|bazin|fashion|pret.a.porter|chaussure|sneaker|basket|sac a main|bijou|montre/],
  ['grocery', /epicerie|supermarche|courses|grocery|marche\b|legume|fruits|produits frais|boutique de quartier/],
  ['shop', /boutique|e.?commerce|vente en ligne|magasin|shop|store|marketplace|produit|catalogue|electronique|telephone/],
  ['health', /sante|health|medecin|docteur|clinique|hopital|pharma|consultation|patient|rendez.vous medical|dentiste|ordonnance|teleconsult|infirm|labo/],
  ['education', /ecole|school|cours|formation|education|etudiant|eleve|apprendre|learning|academy|academie|quiz|examen|bac\b|universit|tutorat|soutien scolaire|jang/],
  ['fitness', /sport|fitness|gym|muscu|salle de sport|coach sportif|yoga|running|course a pied|football|lutte|entrainement|workout/],
  ['transport', /taxi|vtc|chauffeur|covoiturage|transport|trajet|course en voiture|yango|heetch|bus\b|car rapide|ndiaga|location de voiture|moto.taxi/],
  ['realestate', /immobili|appartement|maison|villa|logement|location|terrain|agence immo|colocation|chambre a louer|bail\b|kër|ker\b/],
  ['events', /evenement|event|concert|billet|ticket|soiree|festival|mariage|bapteme|tanebeer|gala|spectacle|conference|seminaire/],
  ['finance', /tontine|epargne|finance|banque|wallet|portefeuille|transfert|pret\b|microfinance|credit|cotisation|budget|xaalis|investi|assurance|money/],
  ['agriculture', /agri|agro|champ|recolte|paysan|agriculteur|eleveur|elevage|betail|semence|arachide|\bmil\b|irrigation|meteo agricole|beykat|ferme\b|cultur/],
  ['services', /plomb|electricien|menage|nettoyage|bricol|reparation|artisan|jardinage|demenagement|blanchisserie|pressing|lavage|climatisation|service a domicile|femme de menage/],
  ['travel', /hotel|voyage|tourism|touris|vacances|reservation de chambre|auberge|campement|excursion|billet d.avion|teranga|saly|cap skirring/],
  ['social', /reseau social|communaute|social|rencontre|chat entre|forum|partage de photos|influenceur|dating/],
];

export function detectCategory(text) {
  const t = deaccent(String(text || '').toLowerCase());
  let best = 'generic';
  let bestScore = 0;
  for (const [cat, re] of RULES) {
    const m = t.match(new RegExp(re.source, 'g'));
    const s = m ? m.length : 0;
    if (s > bestScore) {
      bestScore = s;
      best = cat;
    }
  }
  return best;
}

export const CATEGORIES = RULES.map((r) => r[0]).concat('generic');
