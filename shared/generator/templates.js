// Modèles de secours par secteur : des apps complètes, crédibles et locales.
import { S, H, act, theme, onboardingScreen, authScreen, cartScreen, checkoutScreen, successScreen, chatScreen, profileScreen, trackingScreen, detailScreen } from './kit.js';

const BELL = { icon: 'bell', action: { type: 'toast', message: 'Aucune nouvelle notification' } };
const BAG = { icon: 'shopping-bag', action: 'panier' };

// ───────────────────────── Livraison de repas ─────────────────────────
function delivery(ctx) {
  const dishes = [
    { title: 'Thiéboudienne royal', subtitle: 'Riz au poisson, légumes frais', price: 3000, rating: 4.9, meta: '25 min', image: 'thieboudienne rice fish plate', badge: 'Top' },
    { title: 'Yassa poulet', subtitle: 'Oignons caramélisés, citron', price: 2500, rating: 4.8, meta: '20 min', image: 'yassa chicken rice' },
    { title: 'Mafé bœuf', subtitle: 'Sauce arachide maison', price: 2500, rating: 4.7, meta: '30 min', image: 'mafe stew bowl' },
    { title: 'Dibi mouton', subtitle: 'Grillé au feu de bois', price: 5000, oldPrice: 6000, rating: 4.9, meta: '35 min', image: 'dibi grilled meat skewers', badge: '-17%' },
    { title: 'Fataya × 6', subtitle: 'Poisson ou viande', price: 1500, rating: 4.6, meta: '15 min', image: 'fataya pastry street food' },
    { title: 'Bissap frais 1 L', subtitle: 'Fleurs d\'hibiscus, menthe', price: 1000, rating: 4.8, meta: '10 min', image: 'bissap hibiscus juice' },
  ];
  const restos = [
    { title: 'Chez Fatou', subtitle: 'Cuisine sénégalaise · Médina', rating: 4.9, meta: '20-30 min', image: 'african food restaurant woman', badge: 'Livraison offerte' },
    { title: 'Teranga Grill', subtitle: 'Grillades · Almadies', rating: 4.8, meta: '25-35 min', image: 'grilled meat barbecue chef' },
    { title: 'Burger Corniche', subtitle: 'Fast-food · Ouakam', rating: 4.6, meta: '15-25 min', image: 'burger fries fastfood' },
    { title: 'Pizza Ngor', subtitle: 'Pizzeria · Ngor', rating: 4.7, meta: '30-40 min', image: 'pizza italian' },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Tes plats préférés livrés en 30 min', category: 'delivery' },
    theme: theme(ctx, ['sunset', 'corail', 'kora', 'bissap'], ['audacieux', 'rond', 'moderne'], { style: 'soft', radius: 24 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Commandes', icon: 'package', screen: 'commandes' }, { label: 'Panier', icon: 'shopping-bag', screen: 'panier' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'onboarding',
    screens: [
      onboardingScreen(ctx, [
        { title: 'Le goût de la maison, *livré chez toi*', text: 'Les meilleures cuisines de Dakar, chaudes à ta porte en 30 minutes.', video: 'food cooking vegetables pan' },
        { title: 'Suis ton livreur *en direct*', text: 'De la marmite à ta porte, tu vois tout, minute par minute.', illustration: 'delivery' },
        { title: 'Paie en un geste avec *Wave*', text: 'Wave, Orange Money ou Mixx : rapide, sécurisé, sans monnaie.', illustration: 'payment' },
      ]),
      authScreen(ctx),
      S('accueil', 'Accueil', [
        { type: 'search', placeholder: 'Plat, restaurant, envie…' },
        { type: 'promo', eyebrow: 'Cette semaine', title: '-20 % sur ta *1ʳᵉ commande*', subtitle: 'Avec le code ci-dessous', code: 'LIVR20', tone: 'gradient', media: { image: 'jollof rice african food plate' } },
        { type: 'chips', items: ['Tout', 'Sénégalais', 'Grillades', 'Fast-food', 'Boissons', 'Desserts'] },
        { type: 'showcase', eyebrow: 'Les chefs du moment', title: 'Restaurants *à la une*', items: restos },
        { type: 'marquee', items: ['Thiéboudienne', 'Yassa', 'Mafé', 'Dibi', 'Fataya', 'Bissap'], tone: 'primary', tilt: true },
        { type: 'products', eyebrow: 'Prêts en 25 min', title: 'Les plats *du jour*', items: dishes },
        { type: 'bento', eyebrow: 'Pourquoi nous', title: 'Chaud, rapide, *fiable*', items: [{ kind: 'image', title: 'Nos livreurs', text: 'Casque, sac isotherme, sourire', image: 'delivery rider motorbike city', tall: true }, { kind: 'stat', title: 'Minutes en moyenne', value: 28, icon: 'timer' }, { kind: 'stat', title: 'Note des clients', value: 4.9, suffix: '/5', icon: 'star' }, { kind: 'text', title: 'Suivi *en direct*, de la cuisine à ta porte', span: 2, action: 'suivi' }] },
        { type: 'quote', text: 'Mon thiéboudienne arrive encore fumant, *comme chez maman*.', author: 'Aminata Ba', role: 'Cliente depuis 2024', rating: 5 },
      ], { header: H('greeting', `Bonjour ${ctx.person(0).split(' ')[0]} 👋`, `${ctx.quartier(0)}, Dakar`, [BELL, BAG]) }),
      detailScreen(ctx, { title: 'Thiéboudienne royal', subtitle: 'Chez Fatou · Médina', price: 3000, rating: 4.9, reviews: 312, media: { image: 'thieboudienne rice fish plate' }, description: 'Le plat national préparé comme à la maison : riz cassé parfumé, thiof frais, légumes du marché et sauce tomate mijotée pendant des heures.', options: [{ name: 'Taille', values: ['Normal', 'Grande (+500 F)'] }, { name: 'Piment', values: ['Doux', 'Moyen', 'Fort'] }], features: [{ icon: 'clock', label: 'Prêt en 25 min' }, { icon: 'flame', label: 'Fait maison' }, { icon: 'truck', label: 'Livraison 1 000 F' }, { icon: 'leaf', label: 'Produits frais' }] }),
      cartScreen(ctx, { fee: 1000 }),
      checkoutScreen(ctx),
      successScreen(ctx, { title: 'Commande confirmée !', subtitle: 'Chez Fatou prépare ta commande. Ton livreur part dans quelques minutes.' }),
      trackingScreen(ctx),
      S('commandes', 'Commandes', [
        { type: 'segmented', items: ['En cours', 'Terminées'] },
        { type: 'list', style: 'card', items: [{ title: 'Chez Fatou', subtitle: 'Thiéboudienne × 2 · En route', image: 'thieboudienne rice fish', value: '7 000 F', action: 'suivi' }, { title: 'Teranga Grill', subtitle: 'Dibi mouton · Livrée hier', image: 'dibi grilled meat', value: '5 000 F' }, { title: 'Burger Corniche', subtitle: 'Menu double · Livrée lundi', image: 'burger fastfood', value: '4 500 F' }] },
      ], { header: H('large', 'Mes commandes') }),
      profileScreen(ctx, { badge: 'Client Gold', stats: [{ label: 'Commandes', value: '48' }, { label: 'Points', value: '1 240' }, { label: 'Favoris', value: '12' }] }),
      chatScreen(ctx, { quick: ['Où est ma commande ?', 'Changer d\'adresse', 'Ajouter un plat'] }),
    ],
  };
}

// ───────────────────────── Restaurant ─────────────────────────
function restaurant(ctx) {
  const menu = [
    { title: 'Yassa poulet', subtitle: 'Poulet mariné, oignons, riz blanc', price: 3500, image: 'yassa chicken rice plate', rating: 4.9, badge: 'Signature' },
    { title: 'Thiéboudienne', subtitle: 'Le plat national', price: 4000, image: 'thieboudienne rice fish plate', rating: 4.9 },
    { title: 'Brochettes dibi', subtitle: 'Mouton, moutarde, oignons', price: 5500, image: 'dibi skewers grilled meat', rating: 4.8 },
    { title: 'Salade teranga', subtitle: 'Avocat, mangue, crevettes', price: 3000, image: 'salad bowl healthy', rating: 4.6 },
    { title: 'Thiakry', subtitle: 'Dessert au mil et lait caillé', price: 1500, image: 'dessert bowl yogurt', rating: 4.7 },
    { title: 'Jus de bouye', subtitle: 'Pain de singe, vanille', price: 1000, image: 'bouye juice glass', rating: 4.8 },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Réserve ta table ou commande en un geste', category: 'restaurant' },
    theme: theme(ctx, ['or', 'or', 'sable', 'kora'], ['elegant', 'luxe', 'elegant'], { style: 'editorial', radius: 18 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Menu', icon: 'utensils', screen: 'menu' }, { label: 'Réserver', icon: 'calendar-days', screen: 'reservation' }, { label: 'Panier', icon: 'shopping-bag', screen: 'panier' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Accueil', [
        { type: 'hero', badge: 'Ouvert · ferme à 23 h', eyebrow: ctx.quartier(1), title: 'La braise, *le partage*', subtitle: 'Grillades au feu de bois et saveurs du marché, servies sous les étoiles.', chips: [{ icon: 'star', label: '4,9 · 842 avis' }, { icon: 'clock', label: 'Table en 10 min' }], media: { video: 'restaurant chef grill cooking' }, height: 'full', buttons: [{ label: 'Réserver', action: 'reservation', icon: 'calendar-days' }, { label: 'La carte', action: 'menu' }] },
        { type: 'marquee', items: ['Dibi', 'Yassa', 'Thiéboudienne', 'Thiakry', 'Bissap'], tone: 'primary', tilt: true },
        { type: 'editorial', number: '01', eyebrow: 'Le chef', title: 'Quinze ans de braise, *une seule obsession* : le goût.', text: 'Chaque matin, le chef choisit ses viandes et ses poissons au marché Kermel. Le reste, c\'est du temps et du feu.', author: { name: ctx.person(3), role: 'Chef & fondateur' } },
        { type: 'showcase', eyebrow: 'La carte', title: 'Les *signatures*', action: 'menu', items: menu.slice(0, 4).map((m, i) => ({ ...m, meta: ['Au feu de bois', 'Recette de famille', 'Pêche du jour', 'Fraîcheur'][i] })) },
        { type: 'bento', eyebrow: 'L\'adresse', title: 'Une soirée *complète*', items: [{ kind: 'image', title: 'La terrasse', text: 'Vue sur l\'océan', image: 'restaurant terrace evening lights', tall: true }, { kind: 'stat', title: 'Couverts servis', value: 12400, suffix: '+', icon: 'utensils' }, { kind: 'feature', title: 'Live kora', text: 'Chaque vendredi soir', icon: 'music' }, { kind: 'text', title: 'Réserve, *on s\'occupe du reste*', text: 'Ta table est prête à ton arrivée.', span: 2, action: 'reservation' }] },
        { type: 'team', eyebrow: 'En cuisine', title: 'La *brigade*', items: [{ name: ctx.person(3), role: 'Chef', rating: 4.9 }, { name: ctx.person(4), role: 'Pâtissière', rating: 4.8 }, { name: ctx.person(5), role: 'Grilladin', rating: 5 }] },
        { type: 'quote', text: 'Le meilleur dibi de Dakar, *sans discussion*.', author: 'Aminata Ba', role: 'Cliente fidèle', rating: 5 },
        { type: 'contact', phone: '+221 33 820 00 00', address: `Rue 12, ${ctx.quartier(1)}, Dakar`, hours: 'Tous les jours · 12 h – 23 h' },
      ], { header: H('transparent', ctx.name, '', [BAG]) }),
      S('menu', 'Menu', [{ type: 'chips', items: ['Plats', 'Grillades', 'Entrées', 'Desserts', 'Boissons'] }, { type: 'products', columns: 1, items: menu.map((m, i) => ({ ...m, meta: ['Signature', 'Classique', 'Au feu de bois', 'Fraîcheur', 'Douceur', 'Maison'][i] })) }], { header: H('large', 'La carte', '', [BAG]) }),
      detailScreen(ctx, { title: 'Yassa poulet', price: 3500, rating: 4.9, reviews: 214, media: { image: 'yassa chicken rice plate' }, description: 'Poulet fermier mariné 12 heures au citron vert et à la moutarde, confit d\'oignons, riz parfumé.', options: [{ name: 'Accompagnement', values: ['Riz blanc', 'Frites', 'Attiéké'] }], features: [{ icon: 'flame', label: 'Épicé doux' }, { icon: 'clock', label: '20 min' }] }),
      S('reservation', 'Réserver', [{ type: 'booking', title: 'Réserve ta table', slots: ['12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'], cta: { label: 'Réserver', action: { type: 'toast', message: 'Table réservée ✓ Confirmation par SMS' } } }, { type: 'notice', icon: 'info', title: 'Groupe de plus de 8 ?', text: 'Appelle-nous pour privatiser la terrasse.', tone: 'info' }], { header: H('large', 'Réservation') }),
      cartScreen(ctx, { fee: 1500 }),
      checkoutScreen(ctx),
      successScreen(ctx, { title: 'Bon appétit !', subtitle: 'Ta commande est en cuisine. Livraison estimée : 35 min.' }),
      trackingScreen(ctx),
    ],
  };
}

// ───────────────────────── Beauté / coiffure ─────────────────────────
function beauty(ctx) {
  const services = [
    { title: 'Box braids', subtitle: 'Tresses longues · 4 h', price: 20000, image: 'box braids hair woman', rating: 4.9, meta: '4 h', badge: 'Tendance' },
    { title: 'Nattes collées', subtitle: 'Cornrows créatives · 2 h', price: 8000, image: 'cornrows braids woman', rating: 4.8, meta: '2 h' },
    { title: 'Coupe + barbe', subtitle: 'Dégradé, contours · 45 min', price: 4000, image: 'barber haircut man', rating: 4.9, meta: '45 min' },
    { title: 'Soin visage éclat', subtitle: 'Karité & hibiscus · 1 h', price: 12000, image: 'skincare cream woman', rating: 4.7, meta: '1 h' },
    { title: 'Maquillage soirée', subtitle: 'Mariage, baptême · 1 h 30', price: 15000, image: 'makeup beauty woman', rating: 4.8, meta: '1 h 30' },
    { title: 'Manucure gel', subtitle: 'Pose + déco · 1 h', price: 7000, image: 'cosmetics makeup pink', rating: 4.6, meta: '1 h' },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Ton salon réservé en 30 secondes', category: 'beauty' },
    theme: theme(ctx, ['sable', 'bissap', 'sable', 'nuit'], ['editorial', 'classique', 'elegant'], { style: 'glass', radius: 24 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Services', icon: 'scissors', screen: 'services' }, { label: 'RDV', icon: 'calendar-days', screen: 'rendez-vous' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'onboarding',
    screens: [
      onboardingScreen(ctx, [
        { title: 'Sublime-toi, *on s\'occupe du reste*', text: 'Les meilleures stylistes de Dakar, réservées en un geste.', video: 'hair salon hairdresser woman' },
        { title: 'Ton créneau, *sans attendre*', text: 'Fini l\'attente au salon : arrive à l\'heure, repars rayonnante.', illustration: 'booking' },
        { title: 'Ta place garantie *par Wave*', text: 'Un petit acompte sécurisé et ton rendez-vous est bloqué.', illustration: 'payment' },
      ], 'accueil'),
      S('accueil', 'Accueil', [
        { type: 'hero', badge: 'Nouveau · Soins karité', eyebrow: ctx.quartier(3), title: 'Ta beauté, *notre art*', subtitle: 'Tresses, soins et maquillage par des expertes qui prennent leur temps.', chips: [{ icon: 'star', label: '4,9 · 516 avis' }, { icon: 'calendar-days', label: 'Créneau dès demain' }], media: { video: 'beauty makeup mirror woman' }, height: 'full', buttons: [{ label: 'Réserver', action: 'services', icon: 'calendar-days' }, { label: 'Nos soins', action: 'services' }] },
        { type: 'stories', items: [{ name: 'Avant/Après', image: 'braids hairstyle woman' }, { name: 'Mariage', image: 'makeup artist bride' }, { name: 'Barber', image: 'barber haircut' }, { name: 'Soins', image: 'skincare spa woman' }, { name: 'Ongles', image: 'cosmetics pink' }] },
        { type: 'showcase', eyebrow: 'Prestations', title: 'Les *signatures* du salon', action: 'services', items: services.slice(0, 4).map((x) => ({ ...x, action: 'detail' })) },
        { type: 'marquee', items: ['Box braids', 'Nattes collées', 'Soins karité', 'Make-up', 'Barber'], tone: 'plain', style: 'outline' },
        { type: 'team', eyebrow: 'Le salon', title: 'Nos *expertes*', items: [{ name: 'Awa Ndiaye', role: 'Tresses · 12 ans', rating: 4.9 }, { name: 'Fatou Sow', role: 'Soins visage', rating: 4.8 }, { name: 'Ndeye Fall', role: 'Make-up mariage', rating: 5 }] },
        { type: 'editorial', tone: 'surface', eyebrow: 'Le rituel', title: 'Arrive à l\'heure, *repars rayonnante*.', text: 'Thé offert, playlist douce, produits naturels au karité et à l\'hibiscus : ton moment rien qu\'à toi.', cta: { label: 'Choisir un soin', action: 'services' } },
        { type: 'promo', eyebrow: 'Mardi & mercredi', title: '-15 % sur *les tresses*', subtitle: 'Réserve en semaine, profite du tarif doux.', tone: 'gradient', cta: { label: 'J\'en profite', action: 'services' } },
        { type: 'quote', text: 'Mes box braids ont tenu six semaines, *parfaites du premier au dernier jour*.', author: 'Mariama Diallo', role: 'Cliente VIP', rating: 5 },
      ], { header: H('transparent', ctx.name, '', [BELL]) }),
      S('services', 'Services', [{ type: 'search', placeholder: 'Tresses, soin, coupe…', filter: false }, { type: 'chips', items: ['Tout', 'Tresses', 'Coupe', 'Soins', 'Make-up'] }, { type: 'products', columns: 1, cart: false, items: services.map((s) => ({ ...s, action: 'detail' })) }], { header: H('large', 'Nos prestations') }),
      detailScreen(ctx, { title: 'Box braids', subtitle: 'Par Awa, styliste senior', price: 20000, rating: 4.9, reviews: 188, media: { video: 'hair salon hairdresser woman' }, description: 'Tresses longues et légères, mèches premium incluses. Durée moyenne : 4 heures. Pense à venir cheveux lavés et démêlés.', options: [{ name: 'Longueur', values: ['Épaules', 'Mi-dos', 'Taille'] }, { name: 'Couleur', values: ['Noir', 'Châtain', 'Blond', 'Ombré'] }], quantity: false, cta: { label: 'Choisir un créneau', action: 'reservation' }, features: [{ icon: 'clock', label: '4 heures' }, { icon: 'gem', label: 'Mèches incluses' }, { icon: 'shield-check', label: 'Satisfaite ou retouche' }, { icon: 'wallet', label: 'Acompte 5 000 F' }] }),
      S('reservation', 'Réservation', [{ type: 'booking', title: 'Quand viens-tu ?', staff: [{ name: 'Awa', role: 'Tresses' }, { name: 'Fatou', role: 'Soins' }, { name: 'Ndeye', role: 'Make-up' }], cta: { label: 'Confirmer', action: 'paiement' } }], { header: H('compact', 'Réservation') }),
      checkoutScreen(ctx, { title: 'Acompte', methods: ['wave', 'orange_money', 'free_money', 'card'] }),
      successScreen(ctx, { title: 'Rendez-vous confirmé !', subtitle: 'On t\'envoie un rappel la veille par SMS. À très vite ✨', buttons: [{ label: 'Voir mes rendez-vous', action: 'rendez-vous' }, { label: 'Accueil', action: 'home' }] }),
      S('rendez-vous', 'Rendez-vous', [
        { type: 'countdown', title: 'Prochain rendez-vous', label: 'Box braids avec Awa commence dans', hours: 26 },
        { type: 'timeline', title: 'Historique', items: [{ title: 'Box braids', subtitle: 'Avec Awa · 20 000 F', time: 'demain 10:30', done: false, icon: 'calendar-days' }, { title: 'Soin visage éclat', subtitle: 'Avec Fatou · 12 000 F', time: '12 sept.', done: true }, { title: 'Nattes collées', subtitle: 'Avec Awa · 8 000 F', time: '28 août', done: true }] },
      ], { header: H('large', 'Mes rendez-vous') }),
      profileScreen(ctx, { badge: 'Cliente VIP', stats: [{ label: 'Visites', value: '23' }, { label: 'Points', value: '860' }, { label: 'Avis', value: '9' }] }),
    ],
  };
}

// ───────────────────────── Mode / boutique ─────────────────────────
function fashion(ctx) {
  const items = [
    { title: 'Robe wax Soleil', subtitle: 'Coton hollandais', price: 18000, oldPrice: 22000, image: 'african woman dress wax print', rating: 4.8, badge: 'Nouveau' },
    { title: 'Ensemble pagne', subtitle: 'Fait main à Dakar', price: 25000, image: 'african fashion woman colorful dress', rating: 4.9 },
    { title: 'Chemise wax homme', subtitle: 'Coupe ajustée', price: 12000, image: 'men suit jacket floral wax', rating: 4.7 },
    { title: 'Tissu wax 6 yards', subtitle: 'Motifs exclusifs', price: 15000, image: 'wax fabric african textiles pagne', rating: 4.8 },
    { title: 'Sac cuir Ndar', subtitle: 'Cuir tanné local', price: 16000, image: 'handbag brown leather', rating: 4.6 },
    { title: 'Sneakers Teranga', subtitle: 'Édition limitée', price: 28000, oldPrice: 32000, image: 'sneakers shoes white', rating: 4.7, badge: '-12%' },
  ];
  return {
    meta: { name: ctx.name, tagline: 'La mode africaine qui te ressemble', category: 'fashion' },
    theme: theme(ctx, ['sable', 'or', 'bissap', 'sable'], ['editorial', 'luxe', 'classique'], { style: 'editorial', radius: 12 }),
    tabs: [{ label: 'Boutique', icon: 'store', screen: 'accueil' }, { label: 'Favoris', icon: 'heart', screen: 'favoris' }, { label: 'Panier', icon: 'shopping-bag', screen: 'panier' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Boutique', [
        { type: 'hero', eyebrow: 'Collection Teranga · automne', title: 'Porte ton *héritage*', subtitle: 'Wax, bazin et pagne tissé, coupés et cousus à la main à Dakar.', chips: [{ icon: 'scissors', label: 'Fait main' }, { icon: 'truck', label: 'Livré en 24 h' }], media: { video: 'fashion model dress woman' }, height: 'full', overlay: 'dark', buttons: [{ label: 'Découvrir', action: 'catalogue' }] },
        { type: 'marquee', items: ['Wax hollandais', 'Bazin riche', 'Pagne tissé', 'Fait à Dakar'], tone: 'plain', style: 'outline' },
        { type: 'showcase', eyebrow: 'Lookbook', title: 'La collection *Teranga*', action: 'catalogue', items: items.slice(0, 4).map((x, i) => ({ ...x, meta: ['Pièce unique', 'Best-seller', 'Homme', 'Au mètre'][i] })) },
        { type: 'categories', style: 'image', title: 'Par univers', items: [{ label: 'Robes', image: 'african fashion woman dress', action: 'catalogue' }, { label: 'Tissus wax', image: 'wax fabric pagne', action: 'catalogue' }, { label: 'Homme', image: 'men suit wax jacket', action: 'catalogue' }, { label: 'Accessoires', image: 'handbag leather', action: 'catalogue' }] },
        { type: 'editorial', tone: 'dark', eyebrow: 'L\'atelier', title: 'Chaque pièce est *coupée à la main*, jamais en série.', text: 'Nos six tailleurs de la Médina travaillent le wax comme on travaille la soie : lentement, précisément.', author: { name: `Atelier ${ctx.name}`, role: 'Médina, Dakar' } },
        { type: 'products', eyebrow: 'Nouveautés', title: 'Fraîchement *cousu*', action: 'catalogue', items: items.slice(0, 4) },
        { type: 'video', title: 'Dans l\'atelier', subtitle: 'Des ciseaux au défilé, suis la création d\'une robe.', media: { video: 'sewing tailor couture atelier' }, duration: '0:45' },
        { type: 'promo', title: 'Livraison offerte *dès 30 000 F*', subtitle: 'Partout à Dakar, sous 24 h.', tone: 'dark', cta: { label: 'Shopper', action: 'catalogue' } },
      ], { header: H('transparent', ctx.name, '', [{ icon: 'search', action: 'catalogue' }, BAG]) }),
      S('catalogue', 'Catalogue', [{ type: 'search', placeholder: 'Robe, wax, sneakers…' }, { type: 'chips', items: ['Tout', 'Femme', 'Homme', 'Tissus', 'Sacs', 'Chaussures'] }, { type: 'products', items }], { header: H('compact', 'Catalogue', '', [BAG]) }),
      detailScreen(ctx, { title: 'Robe wax Soleil', subtitle: `Atelier ${ctx.name}`, price: 18000, oldPrice: 22000, rating: 4.8, reviews: 96, media: { image: 'african woman dress wax print' }, images: ['african fashion woman colorful dress', 'wax fabric pattern'], description: 'Robe longue en wax 100 % coton, coupe évasée, poches invisibles. Taille normalement. Lavage à 30 °C.', options: [{ name: 'Taille', values: ['S', 'M', 'L', 'XL'] }, { name: 'Couleur', values: ['Terracotta', 'Indigo', 'Or'] }], features: [{ icon: 'truck', label: 'Livré en 24 h' }, { icon: 'repeat', label: 'Échange 7 jours' }, { icon: 'scissors', label: 'Fait main' }, { icon: 'shield-check', label: 'Paiement sécurisé' }], vendor: { name: `Atelier ${ctx.name}`, subtitle: 'Créatrice vérifiée · 4,9★' } }),
      S('favoris', 'Favoris', [{ type: 'products', items: items.slice(1, 5) }], { header: H('large', 'Mes favoris') }),
      cartScreen(ctx, { fee: 2000 }),
      checkoutScreen(ctx),
      successScreen(ctx, { title: 'Merci pour ta commande !', subtitle: 'Ton colis est en préparation. Livraison sous 24 h à Dakar.' }),
      trackingScreen(ctx, { title: 'Ton colis arrive' }),
      profileScreen(ctx, { stats: [{ label: 'Commandes', value: '12' }, { label: 'Favoris', value: '34' }, { label: 'Points', value: '540' }] }),
    ],
  };
}

// ───────────────────────── E-commerce générique / tech ─────────────────────────
function shop(ctx) {
  const items = [
    { title: 'Smartphone Nova X', subtitle: '128 Go · Double SIM', price: 145000, oldPrice: 165000, image: 'smartphone android phone', rating: 4.7, badge: 'Promo' },
    { title: 'Écouteurs sans fil', subtitle: 'Autonomie 30 h', price: 18000, image: 'smartphone earbuds', rating: 4.6 },
    { title: 'Montre connectée', subtitle: 'Suivi sport & sommeil', price: 35000, image: 'smartwatch watch', rating: 4.5 },
    { title: 'Sneakers Street', subtitle: 'Confort absolu', price: 25000, image: 'sneakers shoes', rating: 4.8 },
    { title: 'Sac en cuir', subtitle: 'Artisanat local', price: 16000, image: 'handbag leather', rating: 4.7 },
    { title: 'Coffret beauté', subtitle: 'Karité & huiles', price: 12000, image: 'cosmetics skincare products', rating: 4.8 },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Tout ce qu\'il te faut, livré chez toi', category: 'shop' },
    theme: theme(ctx, ['indigo', 'nuit', 'ocean', 'indigo'], ['tech', 'moderne', 'audacieux'], { style: 'soft', radius: 22 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Explorer', icon: 'search', screen: 'explorer' }, { label: 'Panier', icon: 'shopping-bag', screen: 'panier' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Accueil', [
        { type: 'search', placeholder: 'Rechercher un produit' },
        { type: 'promo', eyebrow: 'Flash deal', title: 'Jusqu\'à -30 % *ce week-end*', subtitle: 'Paiement Wave ou Orange Money accepté', tone: 'gradient', media: { image: 'smartphone android phone' }, cta: { label: 'Voir', action: 'explorer' } },
        { type: 'countdown', label: 'Fin des promos dans', hours: 9 },
        { type: 'categories', items: [{ label: 'Téléphones', icon: 'smartphone' }, { label: 'Mode', icon: 'shirt' }, { label: 'Beauté', icon: 'sparkles' }, { label: 'Maison', icon: 'sofa' }] },
        { type: 'showcase', eyebrow: 'Sélection', title: 'Les *coups de cœur*', action: 'explorer', items: items.slice(0, 4).map((x, i) => ({ ...x, meta: ['Top ventes', 'Nouveau', 'Sport', 'Street'][i] })) },
        { type: 'bento', eyebrow: 'Nos promesses', title: 'Acheter, *sans stress*', items: [{ kind: 'image', title: 'Garantie 1 an', text: 'Échange sans discussion', image: 'smartphone earbuds gadgets', tall: true }, { kind: 'stat', title: 'Livrés en 24 h', value: 24, suffix: ' h', icon: 'truck' }, { kind: 'feature', title: 'Paie en 3×', text: 'Wave ou Orange Money', icon: 'wallet' }, { kind: 'text', title: 'Retour *gratuit* sous 7 jours', span: 2 }] },
        { type: 'products', eyebrow: 'Tendances', title: 'Meilleures *ventes*', action: 'explorer', items: items.slice(0, 4) },
      ], { header: H('greeting', `Salut ${ctx.person(1).split(' ')[0]} 👋`, `Livraison · ${ctx.quartier(4)}`, [BELL, BAG]) }),
      S('explorer', 'Explorer', [{ type: 'search', placeholder: 'Rechercher' }, { type: 'chips', items: ['Tout', 'Tech', 'Mode', 'Beauté', 'Maison'] }, { type: 'products', items }], { header: H('large', 'Explorer', '', [BAG]) }),
      detailScreen(ctx, { title: 'Smartphone Nova X', price: 145000, oldPrice: 165000, rating: 4.7, reviews: 204, media: { image: 'smartphone android phone' }, description: 'Écran 6,7", 128 Go, triple caméra 50 MP, batterie 5 000 mAh. Garantie 12 mois, livré avec chargeur rapide.', options: [{ name: 'Couleur', values: ['Noir', 'Bleu', 'Argent'] }, { name: 'Stockage', values: ['128 Go', '256 Go'] }], features: [{ icon: 'shield-check', label: 'Garantie 1 an' }, { icon: 'truck', label: 'Livré en 24 h' }, { icon: 'repeat', label: 'Retour 7 j' }, { icon: 'wallet', label: 'Paiement en 3×' }] }),
      cartScreen(ctx, { fee: 2000 }),
      checkoutScreen(ctx),
      successScreen(ctx),
      trackingScreen(ctx, { title: 'Ton colis arrive' }),
      profileScreen(ctx),
    ],
  };
}

// ───────────────────────── Épicerie / marché ─────────────────────────
function grocery(ctx) {
  const items = [
    { title: 'Panier légumes', subtitle: 'Tomates, oignons, carottes · 5 kg', price: 6500, image: 'vegetables fresh grocery', rating: 4.8, badge: 'Du jour' },
    { title: 'Mangues Kent', subtitle: 'Le kilo', price: 1500, image: 'market fruits fresh', rating: 4.9 },
    { title: 'Oranges de Casamance', subtitle: 'Le filet de 3 kg', price: 2500, image: 'oranges fruits market', rating: 4.7 },
    { title: 'Riz parfumé 25 kg', subtitle: 'Sac', price: 16500, image: 'grocery store supermarket', rating: 4.6 },
    { title: 'Jus de bissap 1 L', subtitle: 'Artisanal', price: 1000, image: 'bissap hibiscus juice', rating: 4.8 },
    { title: 'Poisson frais (thiof)', subtitle: 'Le kilo · Soumbédioune', price: 4500, image: 'fish market fresh', rating: 4.7 },
  ];
  const base = shop(ctx);
  base.meta = { name: ctx.name, tagline: 'Le marché frais livré en 1 heure', category: 'grocery' };
  base.theme = theme(ctx, ['menthe', 'baobab', 'menthe'], ['rond', 'doux', 'audacieux'], { style: 'soft', radius: 24 });
  base.screens[0] = S('accueil', 'Accueil', [
    { type: 'search', placeholder: 'Légumes, fruits, poisson…' },
    { type: 'hero', badge: 'Arrivage de 6 h', title: 'Du marché à ta cuisine *en 1 heure*', subtitle: 'Sélectionné chaque matin à Castors et Sandaga.', media: { video: 'market fruit woman choosing' }, height: 'medium', buttons: [{ label: 'Faire mes courses', action: 'explorer' }] },
    { type: 'categories', items: [{ label: 'Légumes', icon: 'carrot' }, { label: 'Fruits', icon: 'apple' }, { label: 'Poisson', icon: 'fish' }, { label: 'Épicerie', icon: 'shopping-basket' }] },
    { type: 'marquee', items: ['Mangues Kent', 'Thiof frais', 'Oranges de Casamance', 'Bissap', 'Gombo'], tone: 'primary', size: 'sm' },
    { type: 'products', eyebrow: 'Récolté ce matin', title: 'Frais *du jour*', items: items.slice(0, 4) },
    { type: 'bento', eyebrow: 'Le circuit court', title: 'Des producteurs, *pas des entrepôts*', items: [{ kind: 'image', title: 'Nos maraîchers', text: 'Niayes & Casamance', image: 'farmer vegetables market woman', tall: true }, { kind: 'stat', title: 'Producteurs partenaires', value: 64, icon: 'sprout' }, { kind: 'stat', title: 'Minutes de livraison', value: 55, icon: 'truck' }, { kind: 'feature', title: 'Livraison offerte dès 15 000 F', text: 'Dakar et Rufisque', icon: 'gift', span: 2 }] },
  ], { header: H('greeting', `Bonjour ${ctx.person(2).split(' ')[0]} 👋`, `${ctx.quartier(5)}, Dakar`, [BELL, BAG]) });
  base.screens[1] = S('explorer', 'Rayons', [{ type: 'search', placeholder: 'Rechercher' }, { type: 'chips', items: ['Tout', 'Légumes', 'Fruits', 'Poisson', 'Épicerie'] }, { type: 'products', items }], { header: H('large', 'Rayons', '', [BAG]) });
  base.screens[2] = detailScreen(ctx, { title: 'Panier légumes', price: 6500, rating: 4.8, reviews: 88, media: { image: 'vegetables fresh grocery' }, description: 'Tomates, oignons, carottes, aubergines, piment et chou : tout ce qu\'il faut pour un bon thiéboudienne pour 6 personnes.', options: [{ name: 'Taille', values: ['5 kg', '10 kg'] }], features: [{ icon: 'leaf', label: 'Récolté ce matin' }, { icon: 'truck', label: 'Livré en 1 h' }] });
  return base;
}

// ───────────────────────── Santé ─────────────────────────
function health(ctx) {
  const doctors = [
    { title: 'Dr Aminata Ba', subtitle: 'Généraliste · 12 ans d\'exp.', price: 10000, rating: 4.9, meta: 'Dispo aujourd\'hui', image: 'doctor woman white coat stethoscope african' },
    { title: 'Dr Ousmane Gueye', subtitle: 'Pédiatre', price: 15000, rating: 4.8, meta: 'Demain', image: 'doctor man smiling scrubs african' },
    { title: 'Dr Khady Faye', subtitle: 'Gynécologue', price: 20000, rating: 4.9, meta: 'Dispo aujourd\'hui', image: 'doctor stethoscope lab coat' },
    { title: 'Dr Modou Mbaye', subtitle: 'Dentiste', price: 12000, rating: 4.7, meta: 'Lundi', image: 'dentist health child' },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Ton médecin, sans file d\'attente', category: 'health' },
    theme: theme(ctx, ['ocean', 'menthe', 'ocean'], ['elegant', 'moderne', 'classique'], { style: 'soft', radius: 24 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'RDV', icon: 'calendar-days', screen: 'rendez-vous' }, { label: 'Messages', icon: 'message-circle', screen: 'messages' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Accueil', [
        { type: 'hero', badge: 'Téléconsultation · 7 h – minuit', eyebrow: `Clinique ${ctx.quartier(2)}`, title: 'Ta santé, *entre de bonnes mains*', subtitle: 'Rendez-vous en 10 minutes, en cabinet ou en vidéo, avec des médecins qui prennent le temps.', chips: [{ icon: 'star', label: '4,9 · 2 300 patients' }, { icon: 'shield-check', label: 'Dossier chiffré' }], media: { video: 'doctor patient clinic consultation' }, height: 'full', buttons: [{ label: 'Prendre RDV', action: 'reservation', icon: 'calendar-days' }, { label: 'Nos médecins', action: 'detail' }] },
        { type: 'categories', eyebrow: 'Spécialités', title: 'De quoi as-tu *besoin* ?', items: [{ label: 'Généraliste', icon: 'stethoscope' }, { label: 'Pédiatrie', icon: 'baby' }, { label: 'Dentaire', icon: 'smile' }, { label: 'Pharmacie', icon: 'pill' }, { label: 'Cardio', icon: 'heart-pulse' }, { label: 'Labo', icon: 'syringe' }, { label: 'Yeux', icon: 'eye' }, { label: 'Urgences', icon: 'hospital' }] },
        { type: 'team', eyebrow: 'L\'équipe', title: 'Nos *médecins*', items: doctors.map((d) => ({ name: d.title, role: d.subtitle.split(' · ')[0], rating: d.rating, action: 'detail' })) },
        { type: 'bento', eyebrow: 'La clinique', title: 'Soigner, *simplement*', items: [{ kind: 'image', title: 'Plateau technique', text: 'Radio, labo, échographie', image: 'modern clinic hospital interior', tall: true }, { kind: 'stat', title: 'Patients suivis', value: 12000, suffix: '+', icon: 'users' }, { kind: 'stat', title: 'Minutes d\'attente', value: 10, icon: 'timer' }, { kind: 'feature', title: 'Données de santé protégées', text: 'Chiffrées, visibles par tes seuls médecins', icon: 'shield-check', span: 2 }] },
        { type: 'list', eyebrow: 'Aujourd\'hui', title: 'Médecins *disponibles*', style: 'card', items: doctors.map((d) => ({ ...d, action: 'detail', value: `${d.price / 1000}k F` })) },
        { type: 'quote', text: 'Rendez-vous pris le matin, consultation le midi. *Enfin une clinique qui respecte mon temps.*', author: 'Mariama Diallo', role: 'Patiente', rating: 5 },
      ], { header: H('transparent', ctx.name, '', [BELL]) }),
      detailScreen(ctx, { title: 'Dr Aminata Ba', subtitle: 'Médecin généraliste · Clinique ' + ctx.quartier(2), price: 10000, rating: 4.9, reviews: 431, media: { image: 'doctor woman white coat stethoscope african' }, description: 'Diplômée de l\'UCAD, 12 ans d\'expérience. Consultations en cabinet et en vidéo, suivi des maladies chroniques, bilans de santé.', quantity: false, cta: { label: 'Prendre rendez-vous', action: 'reservation' }, features: [{ icon: 'languages', label: 'Français, wolof' }, { icon: 'video', label: 'Téléconsultation' }, { icon: 'map-pin', label: ctx.quartier(2) }, { icon: 'clock', label: 'Réponse < 1 h' }] }),
      S('reservation', 'Rendez-vous', [{ type: 'booking', title: 'Choisis ton créneau', slots: ['08:30', '09:00', '09:30', '10:00', '11:00', '15:00', '15:30', '16:00', '17:00', '18:00'], cta: { label: 'Confirmer', action: 'paiement' } }], { header: H('compact', 'Rendez-vous') }),
      checkoutScreen(ctx, { title: 'Consultation', methods: ['wave', 'orange_money', 'free_money', 'card'] }),
      successScreen(ctx, { title: 'Rendez-vous confirmé', subtitle: 'Tu recevras le lien de consultation 15 minutes avant. Prépare tes ordonnances.', buttons: [{ label: 'Mes rendez-vous', action: 'rendez-vous' }, { label: 'Accueil', action: 'home' }] }),
      S('rendez-vous', 'Rendez-vous', [
        { type: 'segmented', items: ['À venir', 'Passés'] },
        { type: 'timeline', items: [{ title: 'Dr Aminata Ba', subtitle: 'Téléconsultation', time: 'demain 09:30', done: false, icon: 'video' }, { title: 'Analyses sanguines', subtitle: 'Labo Pasteur', time: '14 sept.', done: true }, { title: 'Dr Modou Mbaye', subtitle: 'Détartrage', time: '2 sept.', done: true }] },
        { type: 'progress', title: 'Objectif pas quotidiens', value: 7240, max: 10000, unit: 'pas', label: 'Encore 2 760 pas !' },
      ], { header: H('large', 'Mes rendez-vous') }),
      chatScreen(ctx, { name: 'Dr Aminata Ba', messages: [{ from: 'them', text: 'Bonjour, comment allez-vous depuis notre dernière consultation ?' }, { from: 'me', text: 'Beaucoup mieux, merci docteur ! La fièvre est partie.' }], replies: ['Parfait, continuez le traitement jusqu\'à la fin.', 'N\'hésitez pas à me recontacter si besoin.'], quick: ['Renouveler mon ordonnance', 'Prendre RDV'] }),
      profileScreen(ctx, { stats: [{ label: 'Consultations', value: '14' }, { label: 'Ordonnances', value: '6' }, { label: 'Groupe', value: 'O+' }] }),
    ],
  };
}

// ───────────────────────── Éducation ─────────────────────────
function education(ctx) {
  const courses = [
    { title: 'Maths — Bac S', subtitle: '32 leçons · Prof. Sarr', price: 5000, rating: 4.9, meta: '12 h', image: 'student notes math education', badge: 'Populaire' },
    { title: 'Anglais conversation', subtitle: '20 leçons · Mariama D.', price: 4000, rating: 4.8, meta: '8 h', image: 'students classroom learning' },
    { title: 'Code & web', subtitle: '40 leçons · Cheikh F.', price: 10000, rating: 4.9, meta: '20 h', image: 'students laptops coding bootcamp' },
    { title: 'Physique-chimie', subtitle: '28 leçons · Prof. Ndour', price: 5000, rating: 4.7, meta: '10 h', image: 'student studying book' },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Apprends avec les meilleurs profs du Sénégal', category: 'education' },
    theme: theme(ctx, ['indigo', 'ocean', 'baobab', 'indigo'], ['audacieux', 'rond', 'audacieux'], { style: 'soft', radius: 24 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Cours', icon: 'book-open', screen: 'cours' }, { label: 'Progrès', icon: 'chart-line', screen: 'progres' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'onboarding',
    screens: [
      onboardingScreen(ctx, [
        { title: 'Réussis ton examen, *à ton rythme*', text: 'Des cours vidéo clairs, en français et en wolof, par les meilleurs profs du pays.', video: 'education students classroom' },
        { title: 'Des quiz qui *font progresser*', text: 'Entraîne-toi cinq minutes par jour et regarde ta courbe monter.', illustration: 'learning' },
      ], 'accueil'),
      S('accueil', 'Accueil', [
        { type: 'progress', style: 'bar', title: 'Maths — Bac S', value: 21, max: 32, unit: 'leçons', label: 'Continue : Les suites numériques' },
        { type: 'hero', badge: 'Nouveau', title: 'Prépa Bac 2027, *mention en vue*', subtitle: 'Annales corrigées et coaching en direct chaque samedi.', media: { video: 'education students university walking' }, height: 'medium', buttons: [{ label: 'Voir le programme', action: 'detail' }] },
        { type: 'marquee', items: ['Maths', 'Anglais', 'Code', 'Physique', 'Philo', 'Wolof'], tone: 'primary', tilt: true },
        { type: 'showcase', eyebrow: 'Les plus suivis', title: 'Cours *populaires*', action: 'cours', items: courses.map((c) => ({ ...c, action: 'detail' })) },
        { type: 'bento', eyebrow: 'Cette semaine', title: 'Tu *progresses*', items: [{ kind: 'stat', title: 'Minutes d\'étude', value: 245, icon: 'timer', span: 2 }, { kind: 'stat', title: 'Quiz réussis', value: 12, icon: 'trophy' }, { kind: 'feature', title: 'Série de 7 jours', text: 'Continue demain !', icon: 'flame' }] },
        { type: 'quote', text: 'Grâce aux annales corrigées, j\'ai eu *16 en maths au Bac*.', author: 'Ibrahima Sarr', role: 'Bachelier 2026, Thiès', rating: 5 },
      ], { header: H('greeting', `Salut ${ctx.person(4).split(' ')[0]} 📚`, 'Prêt(e) pour ta leçon du jour ?', [BELL]) }),
      S('cours', 'Cours', [{ type: 'search', placeholder: 'Matière, professeur…' }, { type: 'products', columns: 1, cart: false, items: courses.map((c) => ({ ...c, action: 'detail' })) }], { header: H('large', 'Catalogue') }),
      detailScreen(ctx, { title: 'Maths — Bac S', subtitle: 'Prof. Ibrahima Sarr · Lycée Blaise Diagne', price: 5000, rating: 4.9, reviews: 1204, media: { video: 'student notes math education' }, description: '32 leçons vidéo, 120 exercices corrigés et 10 annales du Bac. Accès illimité pendant un an, téléchargeable hors connexion.', quantity: false, cta: { label: 'S\'abonner', action: 'offres' }, features: [{ icon: 'circle-play', label: '32 vidéos' }, { icon: 'download', label: 'Hors ligne' }, { icon: 'award', label: 'Certificat' }, { icon: 'message-circle', label: 'Questions au prof' }] }),
      S('offres', 'Offres', [{ type: 'plans', title: 'Choisis ta formule', subtitle: 'Sans engagement, paiement mobile.', items: [{ name: 'Mensuel', price: 5000, period: '/mois', features: ['Tous les cours', 'Quiz illimités'] }, { name: 'Trimestre Bac', price: 12000, period: '/3 mois', highlight: true, features: ['Tous les cours', 'Coaching live', 'Annales corrigées'] }, { name: 'Annuel', price: 40000, period: '/an', features: ['Tout inclus', '2 mois offerts'] }] }], { header: H('compact', 'Abonnement') }),
      checkoutScreen(ctx, { title: 'Abonnement', methods: ['wave', 'orange_money', 'free_money', 'card'] }),
      successScreen(ctx, { title: 'Bienvenue dans la classe !', subtitle: 'Ton accès est activé. Première leçon disponible maintenant.', buttons: [{ label: 'Commencer', action: 'cours' }] }),
      S('progres', 'Progrès', [
        { type: 'chart', title: 'Temps d\'étude', value: '4 h 05', change: '+18 %', period: '7 derniers jours', chartType: 'bar', series: [30, 45, 20, 60, 35, 25, 30], labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] },
        { type: 'progress', title: 'Objectif du mois', value: 14, max: 20, unit: 'heures' },
        { type: 'list', title: 'Badges', items: [{ title: 'Série de 7 jours', subtitle: 'Obtenu hier', icon: 'flame' }, { title: 'As des suites', subtitle: '10 quiz parfaits', icon: 'trophy' }] },
      ], { header: H('large', 'Mes progrès') }),
      profileScreen(ctx, { badge: 'Élève assidu', stats: [{ label: 'Leçons', value: '86' }, { label: 'Quiz', value: '42' }, { label: 'Série', value: '7 j' }] }),
    ],
  };
}

// ───────────────────────── Sport ─────────────────────────
function fitness(ctx) {
  return {
    meta: { name: ctx.name, tagline: 'Ton coach dans la poche', category: 'fitness' },
    theme: theme(ctx, ['lagon', 'nuit', 'lagon'], ['futuriste', 'audacieux', 'futuriste'], { style: 'glass', radius: 22 }),
    tabs: [{ label: 'Aujourd\'hui', icon: 'flame', screen: 'accueil' }, { label: 'Programmes', icon: 'dumbbell', screen: 'programmes' }, { label: 'Stats', icon: 'chart-line', screen: 'stats' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Aujourd\'hui', [
        { type: 'hero', badge: 'Séance du jour', title: 'Full body *explosif*', subtitle: 'Huit exercices, quatre tours, zéro excuse.', chips: [{ icon: 'timer', label: '35 min' }, { icon: 'flame', label: '420 kcal' }, { icon: 'dumbbell', label: 'Sans matériel' }], media: { video: 'fitness gym battle ropes' }, height: 'full', buttons: [{ label: 'Démarrer', action: 'detail', icon: 'play' }] },
        { type: 'marquee', items: ['Force', 'Cardio', 'Mobilité', 'Lutte', 'Running Corniche'], tone: 'primary', tilt: true },
        { type: 'stats', eyebrow: 'Ta semaine', title: 'Tu *brûles* tout', items: [{ label: 'Calories', value: 1840, suffix: ' kcal', icon: 'flame', trend: '+12%' }, { label: 'Séances', value: 5, icon: 'dumbbell', trend: '+2' }, { label: 'Minutes', value: 212, icon: 'timer', trend: '+8%' }, { label: 'Poids', value: 74, suffix: ' kg', icon: 'scale', trend: '-1,2' }] },
        { type: 'showcase', eyebrow: 'Programmes', title: 'Choisis ton *défi*', action: 'programmes', items: [{ title: 'Perte de poids', subtitle: '3 séances par semaine', meta: '4 semaines', image: 'fitness woman box jump', price: 15000, rating: 4.9, action: 'detail' }, { title: 'Prise de masse', subtitle: 'Force & nutrition', meta: '8 semaines', image: 'gym man dumbbell', price: 20000, rating: 4.8, action: 'detail' }, { title: 'Cardio lutte', subtitle: 'Comme les champions', meta: '6 semaines', image: 'fitness gym rope', price: 15000, action: 'detail' }, { title: 'Running Corniche', subtitle: 'Du 5 au 10 km', meta: '5 semaines', image: 'runner city running', price: 10000, action: 'detail' }] },
        { type: 'team', eyebrow: 'Les coachs', title: 'Entraîne-toi avec *les meilleurs*', items: [{ name: 'Babacar Cissé', role: 'Force & lutte', rating: 4.9 }, { name: 'Ndeye Seck', role: 'Cardio & danse', rating: 4.9 }, { name: 'Pape Diouf', role: 'Running', rating: 4.8 }] },
        { type: 'progress', title: 'Objectif hebdo', value: 5, max: 6, unit: 'séances', label: 'Plus qu\'une séance !' },
      ], { header: H('transparent', 'Aujourd\'hui', '', [BELL]) }),
      S('programmes', 'Programmes', [{ type: 'chips', items: ['Tout', 'Force', 'Cardio', 'Souplesse'] }, { type: 'products', columns: 1, cart: false, items: [{ title: 'Perte de poids', subtitle: '4 semaines · 3×/sem.', price: 15000, image: 'fitness woman box jump', rating: 4.9, action: 'detail' }, { title: 'Prise de masse', subtitle: '8 semaines · 4×/sem.', price: 20000, image: 'gym man dumbbell', rating: 4.8, action: 'detail' }, { title: 'Cardio lutte', subtitle: '6 semaines', price: 15000, image: 'fitness gym rope', rating: 4.7, action: 'detail' }] }], { header: H('large', 'Programmes') }),
      detailScreen(ctx, { title: 'Full body explosif', subtitle: 'Coach Babacar · Niveau intermédiaire', price: 15000, rating: 4.9, reviews: 780, media: { video: 'fitness pushups dumbbells workout' }, description: '8 exercices, 4 tours. Échauffement guidé, minuteur vocal et récupération active. Idéal à la maison ou sur la plage.', quantity: false, cta: { label: 'Débloquer le programme', action: 'offres' }, features: [{ icon: 'timer', label: '35 min' }, { icon: 'flame', label: '420 kcal' }, { icon: 'dumbbell', label: 'Sans matériel' }, { icon: 'headphones', label: 'Coach audio' }] }),
      S('offres', 'Offres', [{ type: 'plans', title: 'Deviens membre', items: [{ name: 'Essentiel', price: 7500, period: '/mois', features: ['Séances illimitées', 'Suivi des progrès'] }, { name: 'Coaching', price: 15000, period: '/mois', highlight: true, features: ['Programme perso', 'Coach WhatsApp', 'Plan nutrition'] }] }], { header: H('compact', 'Abonnement') }),
      checkoutScreen(ctx, { title: 'Abonnement', methods: ['wave', 'orange_money', 'free_money', 'card'] }),
      successScreen(ctx, { title: 'Let\'s go ! 💪', subtitle: 'Ton programme est débloqué. Première séance aujourd\'hui.' }),
      S('stats', 'Stats', [{ type: 'chart', title: 'Calories brûlées', value: '1 840 kcal', change: '+12 %', period: 'Cette semaine', series: [220, 310, 180, 400, 260, 330, 140], labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] }, { type: 'stats', items: [{ label: 'Record squat', value: 90, suffix: ' kg', icon: 'trophy' }, { label: 'Série', value: 12, suffix: ' j', icon: 'flame' }] }], { header: H('large', 'Statistiques') }),
      profileScreen(ctx, { badge: 'Athlète', stats: [{ label: 'Séances', value: '64' }, { label: 'Heures', value: '41' }, { label: 'Série', value: '12 j' }] }),
    ],
  };
}

// ───────────────────────── Transport ─────────────────────────
function transport(ctx) {
  return {
    meta: { name: ctx.name, tagline: 'Ta course en 3 minutes, partout à Dakar', category: 'transport' },
    theme: theme(ctx, ['or', 'nuit', 'lagon', 'indigo'], ['tech', 'moderne', 'futuriste'], { style: 'glass' }),
    tabs: [{ label: 'Course', icon: 'car', screen: 'accueil' }, { label: 'Trajets', icon: 'route', screen: 'trajets' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Course', [
        { type: 'map', height: 300, pins: [{ label: 'Toi' }, { label: '3 min' }, { label: '5 min' }], caption: `${ctx.quartier(0)}, Dakar` },
        { type: 'search', placeholder: 'Où allons-nous ?', filter: false, action: 'options' },
        { type: 'list', eyebrow: 'Récents', title: 'On y *retourne* ?', items: [{ title: 'Aéroport AIBD', subtitle: 'Diass', icon: 'plane', action: 'options' }, { title: 'Plateau', subtitle: 'Place de l\'Indépendance', icon: 'building-2', action: 'options' }, { title: 'Almadies', subtitle: 'Route de Ngor', icon: 'waves', action: 'options' }] },
        { type: 'bento', eyebrow: 'Choisis ton style', title: 'Une course *pour chaque trajet*', items: [{ kind: 'feature', title: 'Moto', text: '2 min · dès 1 500 F', icon: 'bike', action: 'options' }, { kind: 'feature', title: 'Confort', text: '4 min · climatisé', icon: 'car', action: 'options' }, { kind: 'stat', title: 'Chauffeurs en ligne', value: 342, icon: 'users', span: 2 }] },
        { type: 'promo', title: '-50 % sur ta *1ʳᵉ course*', subtitle: 'Code valable 7 jours', code: 'DEM50', tone: 'dark' },
      ], { header: H('greeting', `Bonsoir ${ctx.person(1).split(' ')[0]}`, 'Où vas-tu ?', [BELL]) }),
      S('options', 'Choisis ta course', [
        { type: 'map', height: 230, route: true },
        { type: 'products', columns: 1, cart: false, items: [{ title: 'Moto', subtitle: '2 min · Rapide dans les bouchons', price: 1500, image: 'motorcycle rider road', action: 'paiement', badge: 'Éco' }, { title: 'Confort', subtitle: '4 min · Berline climatisée', price: 3500, image: 'car night road', action: 'paiement' }, { title: 'Van', subtitle: '7 min · Jusqu\'à 6 personnes', price: 5500, image: 'taxi car city', action: 'paiement' }] },
      ], { header: H('compact', 'Choisis ta course') }),
      checkoutScreen(ctx, { title: 'Paiement de la course', methods: ['wave', 'orange_money', 'cash', 'card'] }),
      successScreen(ctx, { title: 'Chauffeur en approche', subtitle: 'Moussa arrive dans 4 minutes à bord d\'une Toyota grise.', buttons: [{ label: 'Suivre la course', action: 'suivi' }] }),
      trackingScreen(ctx, { title: 'Ton chauffeur arrive', courier: { name: ctx.person(1), vehicle: 'Toyota Corolla grise · DK 7788 C', rating: 4.9 } }),
      S('trajets', 'Trajets', [{ type: 'list', style: 'card', items: [{ title: 'Plateau → Almadies', subtitle: 'Hier · Confort', icon: 'car', value: '3 500 F' }, { title: 'Yoff → AIBD', subtitle: 'Lundi · Van', icon: 'plane', value: '12 000 F' }, { title: 'Médina → Point E', subtitle: 'Dimanche · Moto', icon: 'bike', value: '1 500 F' }] }], { header: H('large', 'Mes trajets') }),
      profileScreen(ctx, { stats: [{ label: 'Courses', value: '37' }, { label: 'Note', value: '4,9' }, { label: 'Économisé', value: '8k' }] }),
    ],
  };
}

// ───────────────────────── Immobilier ─────────────────────────
function realestate(ctx) {
  const props = [
    { title: 'Villa vue mer', subtitle: 'Almadies · 5 ch. · piscine', price: 1500000, meta: '/mois', image: 'villa pool luxury house', rating: 4.9, badge: 'Exclusif' },
    { title: 'Appartement F3', subtitle: 'Mermoz · 2 ch. · 95 m²', price: 450000, meta: '/mois', image: 'apartment interior living room', rating: 4.7 },
    { title: 'Studio meublé', subtitle: 'Point E · 35 m²', price: 250000, meta: '/mois', image: 'apartment couch interior', rating: 4.6 },
    { title: 'Duplex moderne', subtitle: 'Ngor · 4 ch.', price: 900000, meta: '/mois', image: 'house modern stone balconies', rating: 4.8 },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Trouve ta kër idéale à Dakar', category: 'realestate' },
    theme: theme(ctx, ['sable', 'or', 'sable', 'baobab'], ['luxe', 'elegant', 'classique'], { style: 'editorial', radius: 20 }),
    tabs: [{ label: 'Explorer', icon: 'search', screen: 'accueil' }, { label: 'Carte', icon: 'map', screen: 'carte' }, { label: 'Favoris', icon: 'heart', screen: 'favoris' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Explorer', [
        { type: 'hero', eyebrow: 'Dakar & Petite-Côte', title: 'Trouve ta *kër* idéale', subtitle: 'Villas, appartements et terrains vérifiés par nos agents, visites en 48 h.', chips: [{ icon: 'badge-check', label: 'Annonces vérifiées' }, { icon: 'key', label: 'Visite en 48 h' }], media: { video: 'house modern beach villa' }, height: 'full', buttons: [{ label: 'Explorer', action: 'carte', icon: 'map' }] },
        { type: 'chips', items: ['Tout', 'Location', 'Vente', 'Meublé', 'Terrain'] },
        { type: 'showcase', eyebrow: 'Collection privée', title: 'Biens *d\'exception*', items: props.map((p) => ({ ...p, action: 'detail' })) },
        { type: 'bento', eyebrow: 'Pourquoi nous', title: 'L\'immobilier *sans mauvaise surprise*', items: [{ kind: 'image', title: 'Visites guidées', text: 'Avec un agent certifié', image: 'apartment interior living room', tall: true }, { kind: 'stat', title: 'Biens disponibles', value: 320, icon: 'house' }, { kind: 'stat', title: 'Heures pour visiter', value: 48, suffix: ' h', icon: 'key' }, { kind: 'feature', title: 'Titres et papiers contrôlés', text: 'Par notre notaire partenaire', icon: 'shield-check', span: 2 }] },
        { type: 'products', eyebrow: 'Cette semaine', title: 'Nouvelles *annonces*', cart: false, items: props.map((p) => ({ ...p, action: 'detail' })) },
        { type: 'video', title: 'Visite virtuelle', subtitle: 'Découvre la villa des Almadies comme si tu y étais.', media: { video: 'house modern beach villa' } },
      ], { header: H('transparent', ctx.name, '', [BELL]) }),
      detailScreen(ctx, { title: 'Villa vue mer', subtitle: 'Almadies · 350 m² · 5 chambres', price: 1500000, rating: 4.9, reviews: 23, media: { video: 'house modern beach villa' }, images: ['villa pool luxury', 'apartment interior living room'], description: 'Villa contemporaine face à l\'océan : piscine à débordement, jardin tropical, groupe électrogène, gardiennage 24 h/24. Disponible immédiatement.', quantity: false, cta: { label: 'Réserver une visite', action: 'visite' }, features: [{ icon: 'bed', label: '5 chambres' }, { icon: 'bath', label: '4 salles de bain' }, { icon: 'waves', label: 'Piscine' }, { icon: 'shield-check', label: 'Gardien 24/7' }], vendor: { name: 'Ibrahima Sarr', subtitle: 'Agent certifié · répond en 10 min' } }),
      S('visite', 'Visite', [{ type: 'booking', title: 'Planifie ta visite', slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'], service: { title: 'Frais de visite accompagnée', price: 5000 }, cta: { label: 'Réserver', action: 'paiement' } }], { header: H('compact', 'Visite') }),
      checkoutScreen(ctx, { title: 'Frais de visite', methods: ['wave', 'orange_money', 'card'] }),
      successScreen(ctx, { title: 'Visite confirmée', subtitle: 'Ibrahima t\'attendra sur place. Adresse exacte envoyée par SMS.' }),
      S('carte', 'Carte', [{ type: 'map', height: 420, pins: [{ label: '1,5 M' }, { label: '450k' }, { label: '250k' }, { label: '900k' }] }, { type: 'carousel', style: 'compact', items: props }], { header: H('compact', 'Carte') }),
      S('favoris', 'Favoris', [{ type: 'products', cart: false, items: props.slice(0, 2).map((p) => ({ ...p, action: 'detail' })) }], { header: H('large', 'Favoris') }),
      profileScreen(ctx),
      chatScreen(ctx, { name: 'Ibrahima Sarr', quick: ['Le bien est-il dispo ?', 'Frais d\'agence ?'] }),
    ],
  };
}

// ───────────────────────── Événements / billetterie ─────────────────────────
function events(ctx) {
  const evts = [
    { title: 'Sabar Night Live', meta: 'Sam. 18 oct.', subtitle: 'Just 4 U · Dakar', price: 10000, image: 'concert stage lights audience', badge: 'Complet bientôt' },
    { title: 'Festival Afro Waves', meta: '25–26 oct.', subtitle: 'Place du Souvenir', price: 15000, image: 'concert crowd festival' },
    { title: 'Dakar Fashion Night', meta: 'Ven. 7 nov.', subtitle: 'King Fahd Palace', price: 25000, image: 'fashion model dress woman' },
    { title: 'Stand-up Teranga', meta: 'Jeu. 30 oct.', subtitle: 'Théâtre Sorano', price: 5000, image: 'event concert people party' },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Les meilleures sorties de Dakar', category: 'events' },
    theme: theme(ctx, ['nuit', 'bissap', 'or'], ['futuriste', 'audacieux', 'editorial'], { style: 'glass', mode: 'dark' }),
    tabs: [{ label: 'Découvrir', icon: 'sparkles', screen: 'accueil' }, { label: 'Billets', icon: 'ticket', screen: 'billet' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Découvrir', [
        { type: 'hero', badge: 'Ce samedi · 21 h', eyebrow: 'Just 4 U', title: 'Sabar *Night* Live', subtitle: 'La plus grande nuit mbalax de l\'année, jusqu\'au lever du soleil.', chips: [{ icon: 'ticket', label: 'Dès 10 000 F' }, { icon: 'flame', label: '92 % vendus' }], media: { video: 'event concert women jumping party' }, height: 'full', buttons: [{ label: 'Réserver', action: 'detail', icon: 'ticket' }] },
        { type: 'marquee', items: ['Mbalax', 'Afro', 'Hip-hop', 'Stand-up', 'Jazz', 'Sabar'], tone: 'accent', tilt: true },
        { type: 'chips', items: ['Tout', 'Concerts', 'Festivals', 'Soirées', 'Humour', 'Sport'] },
        { type: 'showcase', eyebrow: 'L\'agenda', title: 'À ne pas *manquer*', items: evts.map((e) => ({ ...e, action: 'detail' })) },
        { type: 'countdown', title: 'Afro Waves', label: 'Ouverture de la billetterie VIP dans', hours: 30 },
        { type: 'bento', eyebrow: 'Ta nuit', title: 'Sans file, *sans papier*', items: [{ kind: 'image', title: 'E-billet QR', text: 'Scanné en 1 seconde', image: 'concert crowd festival lights', tall: true }, { kind: 'stat', title: 'Fêtards ce mois', value: 18400, icon: 'users' }, { kind: 'feature', title: 'Revente sécurisée', text: 'Entre amis, sans arnaque', icon: 'shield-check' }] },
      ], { header: H('transparent', ctx.name, '', [BELL]) }),
      detailScreen(ctx, { title: 'Sabar Night Live', subtitle: 'Just 4 U · Sam. 18 oct. · 21 h', price: 10000, rating: 4.9, reviews: 640, media: { video: 'event dj music party' }, description: 'Une nuit de mbalax avec les meilleurs batteurs de sabar et invités surprises. Ouverture des portes à 21 h, fin à 4 h.', options: [{ name: 'Billet', values: ['Standard', 'VIP (+15 000 F)', 'Table (6 pers.)'] }], features: [{ icon: 'music', label: 'Live' }, { icon: 'clock', label: '21 h – 4 h' }, { icon: 'map-pin', label: 'Just 4 U' }, { icon: 'qr-code', label: 'e-billet' }] }),
      cartScreen(ctx, { fee: 500, feeLabel: 'Frais de service', cta: 'Payer mes billets' }),
      checkoutScreen(ctx, { methods: ['wave', 'orange_money', 'free_money', 'card'] }),
      successScreen(ctx, { title: 'Tes billets sont prêts 🎉', subtitle: 'Présente le QR code à l\'entrée. Bonne soirée !', buttons: [{ label: 'Voir mon billet', action: 'billet' }] }),
      S('billet', 'Billet', [{ type: 'ticket', title: 'Sabar Night Live', subtitle: 'Billet standard · 1 personne', date: 'Sam. 18 oct.', time: '21:00', place: 'Just 4 U, Dakar', seat: 'Fosse', holder: ctx.person(0) }], { header: H('large', 'Mes billets') }),
      profileScreen(ctx, { stats: [{ label: 'Événements', value: '18' }, { label: 'Billets', value: '26' }, { label: 'Amis', value: '54' }] }),
    ],
  };
}

// ───────────────────────── Finance / tontine ─────────────────────────
function finance(ctx) {
  return {
    meta: { name: ctx.name, tagline: 'Ta tontine digitale, simple et sûre', category: 'finance' },
    theme: theme(ctx, ['or', 'baobab', 'nuit', 'or'], ['tech', 'moderne', 'tech'], { style: 'glass', radius: 22 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Tontines', icon: 'hand-coins', screen: 'tontines' }, { label: 'Activité', icon: 'receipt', screen: 'activite' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'onboarding',
    screens: [
      onboardingScreen(ctx, [
        { title: 'La tontine, *version 2.0*', text: 'Cotise, suis et reçois ta part sans cahier ni retard.', video: 'money counting giving tontine' },
        { title: 'Tout est *transparent*', text: 'Chaque membre voit les cotisations en temps réel.', illustration: 'growth' },
        { title: 'Sécurisé *de bout en bout*', text: 'Paiements via Wave et Orange Money, données chiffrées.', illustration: 'security' },
      ]),
      authScreen(ctx),
      S('accueil', 'Accueil', [
        { type: 'balance', label: 'Épargne totale', amount: 385000, trend: '+25 000 ce mois', actions: [{ label: 'Cotiser', icon: 'plus', action: 'paiement' }, { label: 'Envoyer', icon: 'send' }, { label: 'Recevoir', icon: 'arrow-down-left' }, { label: 'Plus', icon: 'layout-grid' }] },
        { type: 'carousel', title: 'Mes tontines', style: 'compact', items: [{ title: 'Tontine Famille Ndiaye', subtitle: '12 membres · tour 7/12', price: 25000, image: 'people women friends african', action: 'tontines' }, { title: 'Collègues Sonatel', subtitle: '8 membres · tour 3/8', price: 50000, image: 'business team office african', action: 'tontines' }] },
        { type: 'chart', title: 'Évolution de ton épargne', value: '385 000 F', change: '+8 %', period: '6 mois', series: [180, 210, 240, 285, 320, 360, 385], labels: ['avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.'] },
        { type: 'bento', eyebrow: 'Ton profil', title: 'Membre *de confiance*', items: [{ kind: 'stat', title: 'Ponctualité', value: 100, suffix: ' %', icon: 'badge-check' }, { kind: 'stat', title: 'Tours reçus', value: 3, icon: 'hand-coins' }, { kind: 'text', title: 'Zéro cahier, *zéro dispute*', text: 'Tout est tracé, chaque membre voit tout.', span: 2 }] },
        { type: 'list', eyebrow: 'Historique', title: 'Dernières *opérations*', action: 'activite', items: [{ title: 'Cotisation Famille Ndiaye', subtitle: 'Wave · aujourd\'hui', amount: -25000, icon: 'hand-coins' }, { title: 'Part reçue — Collègues', subtitle: 'Orange Money · 12 sept.', amount: 400000, icon: 'arrow-down-left' }, { title: 'Cotisation Collègues', subtitle: 'Wave · 1 sept.', amount: -50000, icon: 'hand-coins' }] },
      ], { header: H('greeting', `Salam ${ctx.person(0).split(' ')[0]}`, 'Ton argent travaille pour toi', [BELL]) }),
      S('tontines', 'Tontine', [
        { type: 'progress', title: 'Tontine Famille Ndiaye', value: 175000, max: 300000, unit: 'F', label: 'Prochain bénéficiaire : Fatou' },
        { type: 'countdown', title: 'Prochaine cotisation', label: '25 000 F à verser dans', hours: 52 },
        { type: 'list', title: 'Membres', items: [{ title: 'Fatou Sow', subtitle: 'À jour · reçoit au tour 8', avatar: '', value: '✓' }, { title: 'Moussa Ndiaye', subtitle: 'À jour', avatar: '', value: '✓' }, { title: 'Aminata Ba', subtitle: 'En retard de 2 jours', avatar: '', value: '⏳' }, { title: 'Cheikh Fall', subtitle: 'À jour', avatar: '', value: '✓' }] },
        { type: 'button', label: 'Cotiser 25 000 F', icon: 'hand-coins', action: 'paiement' },
      ], { header: H('large', 'Famille Ndiaye', '12 membres · 25 000 F / mois') }),
      checkoutScreen(ctx, { title: 'Cotisation', methods: ['wave', 'orange_money', 'free_money'] }),
      successScreen(ctx, { title: 'Cotisation reçue ✓', subtitle: 'Tous les membres ont été notifiés. Merci pour ta ponctualité !' }),
      S('activite', 'Activité', [{ type: 'segmented', items: ['Tout', 'Cotisations', 'Reçus'] }, { type: 'list', items: [{ title: 'Cotisation Famille Ndiaye', subtitle: 'Wave · aujourd\'hui', amount: -25000, icon: 'hand-coins' }, { title: 'Part reçue — Collègues', subtitle: 'Orange Money · 12 sept.', amount: 400000, icon: 'arrow-down-left' }, { title: 'Cotisation Collègues', subtitle: 'Wave · 1 sept.', amount: -50000, icon: 'hand-coins' }, { title: 'Cotisation Famille Ndiaye', subtitle: 'Wave · 28 août', amount: -25000, icon: 'hand-coins' }] }], { header: H('large', 'Activité') }),
      profileScreen(ctx, { badge: 'Membre fiable', stats: [{ label: 'Tontines', value: '2' }, { label: 'Ponctualité', value: '100%' }, { label: 'Ancienneté', value: '2 ans' }] }),
    ],
  };
}

// ───────────────────────── Agriculture ─────────────────────────
function agriculture(ctx) {
  return {
    meta: { name: ctx.name, tagline: 'Conseils, météo et marché pour les producteurs', category: 'agriculture' },
    theme: theme(ctx, ['baobab', 'sable', 'baobab'], ['audacieux', 'rond', 'moderne'], { style: 'soft', radius: 22 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Marché', icon: 'store', screen: 'marche' }, { label: 'Expert', icon: 'message-circle', screen: 'messages' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Accueil', [
        { type: 'hero', badge: 'Kaolack · 31 °C · pluie demain', title: 'Bonne période pour *semer l\'arachide*', subtitle: '28 mm de pluie attendus d\'ici jeudi. Prépare tes semences.', chips: [{ icon: 'cloud-rain', label: '28 mm' }, { icon: 'wind', label: 'Vent faible' }], media: { video: 'farm crops irrigation aerial field' }, height: 'tall' },
        { type: 'marquee', items: ['Arachide 285 F/kg', 'Mil 210 F/kg', 'Maïs 190 F/kg', 'Oignon 350 F/kg', 'Niébé 400 F/kg'], tone: 'dark', size: 'sm' },
        { type: 'actions', items: [{ label: 'Météo', icon: 'cloud-rain' }, { label: 'Conseils', icon: 'sprout', action: 'messages' }, { label: 'Prix', icon: 'chart-line', action: 'marche' }, { label: 'Crédit', icon: 'hand-coins' }] },
        { type: 'chart', eyebrow: 'Marché de Kaolack', title: 'Prix de l\'arachide (F/kg)', value: '285 F', change: '+6 %', period: '30 jours', series: [250, 255, 262, 270, 268, 279, 285], labels: [] },
        { type: 'editorial', tone: 'surface', number: '02', eyebrow: 'Conseil de la semaine', title: 'Traite tes semences *avant le semis*.', text: '2 g de produit par kilo de graines protègent tes plants des insectes pendant les trois premières semaines.', author: { name: 'Conseiller Diouf', role: 'Agronome · ANCAR' }, cta: { label: 'Poser une question', action: 'messages' } },
        { type: 'feed', items: [{ author: 'Conseiller Diouf', text: 'Traitez vos semences contre les insectes avant le semis : 2 g de produit par kg de graines.', time: 'il y a 3 h', media: { image: 'farmer crops field african' }, tag: 'Conseil' }] },
      ], { header: H('greeting', `Salam ${ctx.person(9).split(' ')[0]}`, 'Kaolack', [BELL]) }),
      S('marche', 'Marché', [{ type: 'search', placeholder: 'Semences, engrais, matériel…' }, { type: 'products', items: [{ title: 'Semences arachide', subtitle: 'Sac 25 kg · certifiées', price: 15000, image: 'grain harvest hands', rating: 4.8 }, { title: 'Engrais NPK', subtitle: 'Sac 50 kg', price: 17500, image: 'farm greenhouse plants', rating: 4.6 }, { title: 'Semences mil', subtitle: 'Sac 10 kg', price: 6000, image: 'millet grain harvest', rating: 4.7 }, { title: 'Pulvérisateur 16 L', subtitle: 'Manuel', price: 22000, image: 'farm gardening gloves plant', rating: 4.5 }] }], { header: H('large', 'Marché agricole', '', [BAG]) }),
      detailScreen(ctx, { title: 'Semences arachide', subtitle: 'Variété 55-437 · certifiées ISRA', price: 15000, rating: 4.8, reviews: 56, media: { image: 'grain harvest hands' }, description: 'Semences certifiées, taux de germination supérieur à 90 %. Cycle de 90 jours, adaptées au bassin arachidier.', features: [{ icon: 'badge-check', label: 'Certifiées' }, { icon: 'truck', label: 'Livré au village' }] }),
      cartScreen(ctx, { fee: 3000 }),
      checkoutScreen(ctx, { methods: ['wave', 'orange_money', 'free_money', 'cash'] }),
      successScreen(ctx, { title: 'Commande confirmée', subtitle: 'Livraison à Kaolack sous 48 h. Le livreur t\'appellera.' }),
      chatScreen(ctx, { name: 'Conseiller Diouf', title: 'Expert', messages: [{ from: 'them', text: 'Salam ! Envoie-moi une photo de tes plants et je te conseille.' }], quick: ['Mes feuilles jaunissent', 'Quand récolter ?', 'Quel engrais ?'] }),
      profileScreen(ctx, { stats: [{ label: 'Hectares', value: '4' }, { label: 'Récoltes', value: '3' }, { label: 'Membres GIE', value: '28' }] }),
    ],
  };
}

// ───────────────────────── Services à domicile ─────────────────────────
function services(ctx) {
  const pros = [
    { title: 'Plomberie', subtitle: 'Fuite, installation · dès 10 000 F', price: 10000, image: 'service home repair tools', rating: 4.8, meta: '30 min' },
    { title: 'Ménage 3 h', subtitle: 'Appartement jusqu\'à F4', price: 8000, image: 'cleaning house woman', rating: 4.9, meta: 'Aujourd\'hui' },
    { title: 'Électricité', subtitle: 'Dépannage, installation', price: 12000, image: 'service repair', rating: 4.7, meta: '1 h' },
    { title: 'Climatisation', subtitle: 'Entretien, recharge gaz', price: 15000, image: 'cleaning service home', rating: 4.8, meta: 'Demain' },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Des pros vérifiés chez toi en 1 heure', category: 'services' },
    theme: theme(ctx, ['ocean', 'indigo', 'kora', 'ocean'], ['audacieux', 'moderne', 'rond'], { style: 'soft', radius: 22 }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Missions', icon: 'clipboard-list', screen: 'missions' }, { label: 'Messages', icon: 'message-circle', screen: 'messages' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Accueil', [
        { type: 'search', placeholder: 'De quoi as-tu besoin ?' },
        { type: 'categories', items: [{ label: 'Plomberie', icon: 'wrench' }, { label: 'Ménage', icon: 'spray-can' }, { label: 'Électricité', icon: 'zap' }, { label: 'Peinture', icon: 'paintbrush' }, { label: 'Clim', icon: 'wind' }, { label: 'Jardin', icon: 'sprout' }, { label: 'Déménag.', icon: 'truck' }, { label: 'Pressing', icon: 'shirt' }] },
        { type: 'hero', badge: '38 pros disponibles', title: 'Ta maison *entre de bonnes mains*', subtitle: 'Artisans vérifiés, prix fixés à l\'avance, paiement après intervention.', media: { video: 'cleaning house woman home service' }, height: 'medium', buttons: [{ label: 'Réserver', action: 'reservation' }] },
        { type: 'team', eyebrow: 'Les mieux notés', title: 'Nos *pros* du moment', items: [{ name: 'Khady Faye', role: 'Ménage · 230 missions', rating: 4.9, action: 'detail' }, { name: 'Pape Diouf', role: 'Plomberie', rating: 4.8, action: 'detail' }, { name: 'Assane Sarr', role: 'Électricité', rating: 4.9, action: 'detail' }] },
        { type: 'products', eyebrow: 'Prix fixés', title: 'Services *populaires*', cart: false, items: pros.map((p) => ({ ...p, action: 'detail' })) },
        { type: 'bento', eyebrow: 'Notre promesse', title: 'Zéro *mauvaise surprise*', items: [{ kind: 'feature', title: 'Pros vérifiés', text: 'Identité et diplômes contrôlés', icon: 'badge-check' }, { kind: 'feature', title: 'Garantie 30 jours', text: 'On revient gratuitement', icon: 'shield-check' }, { kind: 'stat', title: 'Missions réussies', value: 9800, suffix: '+', icon: 'circle-check', span: 2 }] },
      ], { header: H('greeting', `Bonjour ${ctx.person(6).split(' ')[0]}`, `${ctx.quartier(6)}, Dakar`, [BELL]) }),
      detailScreen(ctx, { title: 'Ménage 3 h', subtitle: 'Par Khady · 4,9★ · 230 missions', price: 8000, rating: 4.9, reviews: 230, media: { video: 'cleaning house woman home service' }, description: 'Nettoyage complet : sols, cuisine, salle de bain, poussière. Produits fournis. Supplément de 2 000 F par heure au-delà.', quantity: false, cta: { label: 'Réserver', action: 'reservation' }, features: [{ icon: 'clock', label: '3 heures' }, { icon: 'spray-can', label: 'Produits inclus' }, { icon: 'shield-check', label: 'Assuré' }, { icon: 'badge-check', label: 'Vérifiée' }] }),
      S('reservation', 'Réservation', [{ type: 'booking', title: 'Quand ?', staff: [{ name: 'Khady', role: 'Ménage' }, { name: 'Pape', role: 'Plomberie' }, { name: 'Assane', role: 'Électricité' }], cta: { label: 'Continuer', action: 'paiement' } }], { header: H('compact', 'Réservation') }),
      checkoutScreen(ctx, { methods: ['wave', 'orange_money', 'cash'] }),
      successScreen(ctx, { title: 'Mission confirmée', subtitle: 'Khady arrivera à l\'heure prévue. Tu peux la suivre en direct.', buttons: [{ label: 'Suivre l\'intervenante', action: 'suivi' }] }),
      trackingScreen(ctx, { title: 'Khady est en route', courier: { name: 'Khady Faye', vehicle: 'Ménage 3 h · Arrivée prévue', rating: 4.9 } }),
      S('missions', 'Missions', [{ type: 'timeline', items: [{ title: 'Ménage 3 h', subtitle: 'Khady · en route', time: 'Aujourd\'hui 14:00', done: false }, { title: 'Réparation fuite', subtitle: 'Pape · terminé', time: '10 sept.', done: true }] }], { header: H('large', 'Mes missions') }),
      chatScreen(ctx, { name: 'Khady Faye', quick: ['Je suis au 3ᵉ étage', 'Merci !'] }),
      profileScreen(ctx),
    ],
  };
}

// ───────────────────────── Voyage / hôtel ─────────────────────────
function travel(ctx) {
  const stays = [
    { title: 'Lodge des Almadies', subtitle: 'Dakar · vue océan', price: 65000, meta: '/nuit', image: 'hotel room bed', rating: 4.9, badge: 'Coup de cœur' },
    { title: 'Résidence Saly Plage', subtitle: 'Saly · piscine', price: 45000, meta: '/nuit', image: 'resort pool sea travel', rating: 4.7 },
    { title: 'Campement Cap Skirring', subtitle: 'Casamance · bungalow', price: 30000, meta: '/nuit', image: 'beach hut palm trees resort', rating: 4.8 },
    { title: 'Écolodge du Sine', subtitle: 'Sine-Saloum · pirogue', price: 38000, meta: '/nuit', image: 'beach trees water travel', rating: 4.8 },
  ];
  return {
    meta: { name: ctx.name, tagline: 'Réserve ton escapade au Sénégal', category: 'travel' },
    theme: theme(ctx, ['ocean', 'lagon', 'sable', 'ocean'], ['editorial', 'elegant', 'luxe'], { style: 'glass', radius: 24 }),
    tabs: [{ label: 'Explorer', icon: 'search', screen: 'accueil' }, { label: 'Voyages', icon: 'luggage', screen: 'voyages' }, { label: 'Favoris', icon: 'heart', screen: 'favoris' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Explorer', [
        { type: 'hero', badge: 'Saison sèche · 29 °C', eyebrow: 'Teranga', title: 'Le Sénégal *comme jamais*', subtitle: 'Plages, îles, bolongs et safaris : des séjours authentiques, réservés en un geste.', chips: [{ icon: 'star', label: '4,9 · 3 200 voyageurs' }, { icon: 'plane', label: 'Navette offerte' }], media: { video: 'travel beach sunset palm' }, height: 'full', buttons: [{ label: 'Explorer', action: 'detail' }] },
        { type: 'chips', items: ['Tout', 'Plage', 'Nature', 'Culture', 'Aventure'] },
        { type: 'showcase', eyebrow: 'Séjours', title: 'Les escapades *préférées*', items: stays.map((x) => ({ ...x, action: 'detail' })) },
        { type: 'editorial', number: '01', eyebrow: 'Carnet de route', title: 'Du lac Rose au Sine-Saloum, *la teranga partout*.', text: 'Nos hôtes locaux t\'accueillent comme un membre de la famille : pirogue au coucher du soleil, dîner au campement, nuit sous les étoiles.', image: 'senegal sunset baobab', caption: 'Sine-Saloum · 18 h 42' },
        { type: 'gallery', eyebrow: 'Inspirations', title: 'Envie *d\'ailleurs*', layout: 'strip', images: ['beach aerial coast', 'senegal boat pirogue beach', 'senegal sunset baobab', 'dakar boats pirogues'] },
        { type: 'quote', text: 'Trois jours au Sine-Saloum et *l\'impression d\'être parti un mois*.', author: 'Khady Faye', role: 'Voyageuse', rating: 5 },
      ], { header: H('transparent', ctx.name, '', [BELL]) }),
      detailScreen(ctx, { title: 'Lodge des Almadies', subtitle: 'Dakar · chambre deluxe vue océan', price: 65000, rating: 4.9, reviews: 318, media: { video: 'hotel room luxury' }, images: ['hotel room bed', 'resort pool sea'], description: 'Chambre de 40 m² avec terrasse privée face à l\'Atlantique, petit-déjeuner local inclus, navette aéroport offerte dès 3 nuits.', options: [{ name: 'Chambre', values: ['Deluxe', 'Suite (+30 000 F)'] }], cta: { label: 'Choisir les dates', action: 'reservation' }, quantity: false, features: [{ icon: 'wifi', label: 'Wi-Fi fibre' }, { icon: 'waves', label: 'Piscine' }, { icon: 'coffee', label: 'Petit-déj.' }, { icon: 'car', label: 'Navette' }] }),
      S('reservation', 'Dates', [{ type: 'booking', title: 'Date d\'arrivée', slots: ['12:00', '14:00', '16:00', '18:00'], cta: { label: 'Réserver', action: 'paiement' } }], { header: H('compact', 'Réservation') }),
      checkoutScreen(ctx, { methods: ['wave', 'orange_money', 'card'] }),
      successScreen(ctx, { title: 'Séjour réservé 🌴', subtitle: 'Ton voucher t\'a été envoyé par e-mail et WhatsApp.', buttons: [{ label: 'Voir mon voucher', action: 'voyages' }] }),
      S('voyages', 'Voyages', [{ type: 'ticket', title: 'Lodge des Almadies', subtitle: 'Chambre deluxe · 2 nuits', date: '24 – 26 oct.', time: '14:00', place: 'Almadies, Dakar', holder: ctx.person(0) }], { header: H('large', 'Mes voyages') }),
      S('favoris', 'Favoris', [{ type: 'carousel', style: 'wide', items: stays.slice(1) }], { header: H('large', 'Favoris') }),
      profileScreen(ctx),
    ],
  };
}

// ───────────────────────── Réseau social / communauté ─────────────────────────
function social(ctx) {
  return {
    meta: { name: ctx.name, tagline: 'Ta communauté, ta teranga', category: 'social' },
    theme: theme(ctx, ['nuit', 'corail', 'nuit'], ['audacieux', 'futuriste', 'audacieux'], { style: 'soft', radius: 24 }),
    tabs: [{ label: 'Fil', icon: 'home', screen: 'accueil' }, { label: 'Découvrir', icon: 'search', screen: 'decouvrir' }, { label: 'Messages', icon: 'message-circle', screen: 'messages' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'accueil',
    screens: [
      S('accueil', 'Fil', [
        { type: 'stories', items: [{ name: 'Awa', image: 'african woman smiling' }, { name: 'Moussa', image: 'man smiling portrait' }, { name: 'Fatou', image: 'fashion african woman' }, { name: 'Cheikh', image: 'man portrait' }, { name: 'Khady', image: 'woman braids' }] },
        { type: 'feed', items: [{ author: 'Awa Diop', text: 'Coucher de soleil aux Almadies ce soir 🌅 Qui vient la prochaine fois ?', media: { image: 'senegal sunset beach' }, time: 'il y a 1 h' }, { author: 'Moussa Ndiaye', text: 'Match de navétanes ce dimanche, on compte sur vous ⚽', media: { video: 'football soccer match' }, time: 'il y a 3 h' }, { author: 'Fatou Sow', text: 'Nouvelle collection wax dispo dans ma boutique ✨', media: { image: 'wax fabric pagne' }, time: 'hier' }] },
      ], { header: H('large', ctx.name, '', [BELL, { icon: 'send', action: 'messages' }]) }),
      S('decouvrir', 'Découvrir', [{ type: 'search', placeholder: 'Personnes, groupes, sujets' }, { type: 'gallery', layout: 'masonry', images: ['dakar city street', 'african food feast', 'concert crowd', 'fashion african woman', 'football fans', 'senegal boats'] }], { header: H('large', 'Découvrir') }),
      chatScreen(ctx, { name: 'Awa Diop', messages: [{ from: 'them', text: 'Tu viens au concert samedi ? 🎶' }, { from: 'me', text: 'Bien sûr ! On se retrouve à 21 h ?' }], replies: ['Parfait, à samedi !', 'J\'ai pris les billets 🎟️'] }),
      profileScreen(ctx, { stats: [{ label: 'Publications', value: '128' }, { label: 'Abonnés', value: '2,4k' }, { label: 'Abonnements', value: '312' }] }),
    ],
  };
}

// ───────────────────────── Générique ─────────────────────────
function generic(ctx) {
  const idea = ctx.idea.length > 80 ? ctx.idea.slice(0, 78) + '…' : ctx.idea;
  return {
    meta: { name: ctx.name, tagline: idea || 'Ton idée, en application', category: 'generic' },
    theme: theme(ctx, ['sunset', 'indigo', 'baobab', 'nuit', 'corail'], ['moderne', 'audacieux', 'elegant'], { style: 'soft' }),
    tabs: [{ label: 'Accueil', icon: 'home', screen: 'accueil' }, { label: 'Services', icon: 'layout-grid', screen: 'services' }, { label: 'Messages', icon: 'message-circle', screen: 'messages' }, { label: 'Profil', icon: 'user', screen: 'profil' }],
    initial: 'onboarding',
    screens: [
      onboardingScreen(ctx, [
        { title: `Bienvenue sur *${ctx.name}*`, text: idea, video: 'business team laptop people african' },
        { title: 'Simple, rapide, *local*', text: 'Pensé pour le Sénégal, en français et en wolof.', illustration: 'success' },
        { title: 'Paie *comme tu veux*', text: 'Wave, Orange Money, Mixx by Yas ou carte.', illustration: 'payment' },
      ], 'accueil'),
      S('accueil', 'Accueil', [
        { type: 'hero', badge: 'Nouveau à Dakar', title: `${ctx.name}, *simplement*`, subtitle: idea, media: { video: 'business people african team' }, height: 'medium', buttons: [{ label: 'Commencer', action: 'services' }] },
        { type: 'actions', items: [{ label: 'Réserver', icon: 'calendar-days', action: 'reservation' }, { label: 'Payer', icon: 'wallet', action: 'offres' }, { label: 'Aide', icon: 'headset', action: 'messages' }, { label: 'Partager', icon: 'share-2', action: 'share' }] },
        { type: 'marquee', items: ['Rapide', 'Fiable', 'Local', 'Wave & Orange Money'], tone: 'primary', size: 'sm' },
        { type: 'bento', eyebrow: 'Pourquoi nous', title: 'Pensé pour *toi*', items: [{ kind: 'image', title: 'Une équipe locale', text: 'À Dakar, pour Dakar', image: 'business people african team office', tall: true }, { kind: 'stat', title: 'Clients satisfaits', value: 2400, suffix: '+', icon: 'smile' }, { kind: 'feature', title: 'Support WhatsApp', text: '7 j/7', icon: 'headset' }, { kind: 'text', title: 'Paiement *100 % sécurisé*', text: 'Wave, Orange Money, Mixx ou carte.', span: 2 }] },
        { type: 'quote', text: 'Service impeccable, *je recommande à 100 %*.', author: ctx.person(2), role: 'Client', rating: 5 },
      ], { header: H('greeting', `Bonjour ${ctx.person(0).split(' ')[0]} 👋`, 'Dakar', [BELL]) }),
      S('services', 'Services', [{ type: 'search', placeholder: 'Rechercher' }, { type: 'products', columns: 1, cart: false, items: [{ title: 'Formule découverte', subtitle: 'Idéal pour commencer', price: 5000, image: 'business laptop people', action: 'detail' }, { title: 'Formule pro', subtitle: 'Pour les entreprises', price: 25000, image: 'business team meeting office', action: 'detail', badge: 'Populaire' }, { title: 'Accompagnement', subtitle: 'Sur mesure', price: 50000, image: 'business women meeting', action: 'detail' }] }], { header: H('large', 'Nos services') }),
      detailScreen(ctx, { title: 'Formule pro', subtitle: ctx.name, price: 25000, rating: 4.8, reviews: 96, media: { image: 'business team meeting office' }, description: 'Tout ce qu\'il faut pour démarrer vite : accompagnement, suivi et support prioritaire.', quantity: false, cta: { label: 'Réserver', action: 'reservation' }, features: [{ icon: 'check', label: 'Suivi dédié' }, { icon: 'headset', label: 'Support 7j/7' }] }),
      S('reservation', 'Réservation', [{ type: 'booking', cta: { label: 'Continuer', action: 'paiement' } }], { header: H('compact', 'Réservation') }),
      S('offres', 'Offres', [{ type: 'plans', title: 'Nos offres', items: [{ name: 'Découverte', price: 5000, period: '/mois', features: ['Accès de base'] }, { name: 'Pro', price: 25000, period: '/mois', highlight: true, features: ['Tout inclus', 'Support prioritaire'] }] }], { header: H('compact', 'Offres') }),
      checkoutScreen(ctx),
      successScreen(ctx),
      chatScreen(ctx),
      profileScreen(ctx),
    ],
  };
}

export const TEMPLATES = { delivery, restaurant, beauty, fashion, shop, grocery, health, education, fitness, transport, realestate, events, finance, agriculture, services, travel, social, generic };
