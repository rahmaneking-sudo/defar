// Forfaits, crédits et coûts — partagés entre le site et le serveur.
// Les crédits de bienvenue et les limites de sites sont aussi dans supabase/schema.sql.

// Phase d'essai : aucun paiement, les crédits sont offerts.
export const TRIAL = true;

// Ce que coûte chaque action en crédits
export const COSTS = {
  create: 5, // générer une app avec l'IA
  edit: 1, // modifier avec l'IA
  template: 0, // partir d'un modèle
  publish: 0, // publier (inclus dans le forfait)
};

export const WELCOME_CREDITS = 50;

export const PLANS = [
  {
    id: 'gratuit',
    name: 'Découverte',
    price: 0,
    credits: 10,
    sites: 1,
    blurb: 'Pour essayer Défar sans engagement.',
    features: ['10 crédits offerts', '1 site en ligne', 'Tous les modèles par métier', 'Logo « Créé avec Défar »'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 5000,
    credits: 60,
    sites: 3,
    blurb: 'Pour lancer ton activité en ligne.',
    features: ['60 crédits par mois', '3 sites en ligne', 'Commandes et réservations sur WhatsApp', 'Tes propres photos'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 15000,
    credits: 250,
    sites: 10,
    highlight: true,
    blurb: 'Pour les commerçants et freelances actifs.',
    features: ['250 crédits par mois', '10 sites en ligne', 'Sans le logo Défar', 'Export ZIP et fichier HTML', 'Assistance WhatsApp prioritaire'],
  },
  {
    id: 'agence',
    name: 'Agence',
    price: 35000,
    credits: 800,
    sites: 50,
    blurb: 'Pour créer des sites pour tes clients.',
    features: ['800 crédits par mois', '50 sites en ligne', 'Liens de paiement pour tes clients', 'Tout le forfait Pro'],
  },
];

export const TOPUP = { price: 5000, credits: 50 };

export const PLAN_LABELS = { essai: 'Essai', gratuit: 'Découverte', starter: 'Starter', pro: 'Pro', agence: 'Agence' };

// Sites publiés autorisés (même règle que plan_site_limit dans schema.sql)
export const PLAN_SITE_LIMIT = { gratuit: 1, essai: 3, starter: 3, pro: 10, agence: 50 };
