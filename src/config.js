// Identité de la plateforme — change le nom ici pour renommer tout le site.
export const BRAND = {
  name: 'Défar',
  meaning: '« construire » en wolof',
  tagline: 'Décris ton app. Elle prend vie.',
  whatsapp: '221777185723', // numéro WhatsApp de Défar (format international sans +)
  email: 'contact@exemple.sn',
};

// Les 18 modèles par métier : libellé, promesse, famille et idée de départ.
export const CATEGORY_INFO = {
  delivery: { label: 'Livraison', blurb: 'Commande, suivi du livreur, paiement Wave', group: 'commerce', idea: 'Livraison de plats sénégalais à Dakar avec suivi du livreur' },
  restaurant: { label: 'Restaurant', blurb: 'Menu, réservation de table, livraison', group: 'commerce', idea: 'Restaurant de grillades et plats sénégalais à Dakar' },
  fashion: { label: 'Mode & wax', blurb: 'Catalogue, tailles, favoris, panier', group: 'commerce', idea: 'Boutique de robes et tissus wax cousus à Dakar' },
  shop: { label: 'Boutique', blurb: 'Vitrine, promos, panier, suivi', group: 'commerce', idea: 'Boutique en ligne d\'électronique et accessoires à Dakar' },
  grocery: { label: 'Épicerie', blurb: 'Produits frais, panier, livraison rapide', group: 'commerce', idea: 'Épicerie de produits frais livrés à domicile à Dakar' },
  beauty: { label: 'Beauté & coiffure', blurb: 'Prestations, créneaux, acompte mobile', group: 'services', idea: 'Salon de tresses et soins à Dakar avec réservation' },
  health: { label: 'Santé', blurb: 'Rendez-vous, téléconsultation, messages', group: 'services', idea: 'Clinique à Dakar avec prise de rendez-vous et téléconsultation' },
  services: { label: 'Services à domicile', blurb: 'Artisans vérifiés, réservation, suivi', group: 'services', idea: 'Plombiers, électriciens et ménage à domicile à Dakar' },
  education: { label: 'Éducation', blurb: 'Cours, offres, progression', group: 'services', idea: 'Cours de soutien scolaire et préparation au bac au Sénégal' },
  fitness: { label: 'Sport & coaching', blurb: 'Programmes, abonnements, statistiques', group: 'services', idea: 'Salle de sport et coaching à Dakar' },
  transport: { label: 'Transport', blurb: 'Course, prix estimé, chauffeur en direct', group: 'lieux', idea: 'VTC et moto-taxi à Dakar avec suivi du chauffeur' },
  travel: { label: 'Voyage', blurb: 'Séjours, réservation, favoris', group: 'lieux', idea: 'Réservation de séjours à Saly, au Sine-Saloum et en Casamance' },
  realestate: { label: 'Immobilier', blurb: 'Annonces, carte, visites', group: 'lieux', idea: 'Location d\'appartements et villas à Dakar' },
  events: { label: 'Événements', blurb: 'Programme, billets QR code', group: 'lieux', idea: 'Billetterie de concerts et soirées à Dakar' },
  finance: { label: 'Tontine & finance', blurb: 'Cotisations, tours, activité', group: 'communaute', idea: 'Tontine digitale entre amis avec cotisations Wave' },
  agriculture: { label: 'Agriculture', blurb: 'Marché, conseils, achats', group: 'communaute', idea: 'Conseils agricoles, météo et prix du marché pour producteurs' },
  social: { label: 'Communauté', blurb: 'Fil, découvertes, messages', group: 'communaute', idea: 'Réseau communautaire de la diaspora sénégalaise' },
  generic: { label: 'Sur mesure', blurb: 'Une base complète pour toute idée', group: 'communaute', idea: 'Application sur mesure pour une petite entreprise à Dakar' },
};
export const CATEGORY_GROUPS = [
  { id: 'all', label: 'Tous' },
  { id: 'commerce', label: 'Commerce' },
  { id: 'services', label: 'Services' },
  { id: 'lieux', label: 'Mobilité & sorties' },
  { id: 'communaute', label: 'Finance & communauté' },
];

// Idées d'exemple affichées sous la zone de saisie
export const EXAMPLES = [
  { label: 'Livraison de thiéboudienne', idea: 'Une app de livraison de plats sénégalais à Dakar (thiéboudienne, yassa, mafé) avec suivi du livreur et paiement Wave ou Orange Money' },
  { label: 'Salon de tresses', idea: 'Un salon de coiffure à Dakar spécialisé dans les tresses et nattes, avec réservation de créneau et acompte par Wave' },
  { label: 'Boutique de wax', idea: 'Une boutique en ligne de robes et tissus wax cousus à Dakar, avec panier, tailles et livraison en 24 h' },
  { label: 'Tontine digitale', idea: 'Une tontine digitale entre amis et collègues : cotisations mensuelles via Wave, tour de chaque membre, rappels automatiques' },
  { label: 'Clinique & téléconsultation', idea: 'Une clinique à Dakar avec prise de rendez-vous, téléconsultation vidéo et paiement de la consultation par Orange Money' },
  { label: 'Taxi à Dakar', idea: 'Une app de VTC et moto-taxi à Dakar avec estimation du prix, suivi du chauffeur en direct et paiement Wave' },
  { label: 'Conseils agricoles', idea: 'Une app pour les agriculteurs du bassin arachidier : météo, conseils en wolof, prix du marché et achat de semences' },
  { label: 'Billetterie de concerts', idea: 'Une billetterie pour les concerts et soirées à Dakar avec billets QR code et paiement mobile' },
];
