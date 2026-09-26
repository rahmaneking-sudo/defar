# Défar — « Décris ton app. Elle prend vie. »

*Défar* veut dire « construire » en wolof.

La plateforme tape une idée d'application en français, en wolof ou en anglais. Elle livre en quelques secondes une **maquette d'app mobile animée, cliquable et vendable**. Le paiement Wave, Orange Money, Mixx by Yas et carte est intégré.

Elle se compose de quatre parties :

1. **Le moteur de maquettes**
   - Rend des applications complètes : écrans, parcours, transitions natives, vidéos, motion design et confettis.
   - Propose 50 blocs, dont 6 blocs « signature » : éditorial, lookbook, bento, bandeau défilant, équipe et citation.
   - Chaque métier a sa propre direction artistique.
2. **La génération par idée**
   - L'IA (Claude, OpenAI ou Gemini) décrit l'app en JSON, jamais en code.
   - Un normaliseur répare tout ce qu'elle pourrait mal faire.
   - Si l'IA ne répond pas, 18 modèles par métier prennent le relais : **zéro écran cassé**.
3. **Le checkout** : pages de paiement mobile money pour le Sénégal, liens de paiement signés, QR codes, reçus, webhooks et simulateur de test.
4. **Les comptes et les sites en ligne** (avec Supabase) :
   - inscription et connexion ;
   - crédits : 5 pour une création par l'IA, 1 pour une modification ;
   - espace client : mes sites, messages reçus, crédits, compte ;
   - bouton **Publier** : le site est en ligne sur téléphone **et** sur ordinateur ;
   - commandes, réservations et messages réels, envoyés au vendeur (espace + WhatsApp) ;
   - avis des testeurs et page **Admin**.

---

## 1. Démarrer en local

Prérequis : Node.js 20.19 ou plus récent.

```bash
npm install
npm run dev          # http://localhost:5173
```

Sans aucune clé, tout fonctionne en **mode démo** :
- les modèles par métier remplacent l'IA ;
- le simulateur remplace les opérateurs de paiement.

Pour tester l'IA ou les paiements en local, copie `.env.example` en `.env.local` et remplis les clés voulues.

## 2. Déployer sur Vercel

1. Crée un dépôt GitHub avec ce dossier, ou utilise `npx vercel` depuis le dossier.
2. Sur vercel.com, clique sur **Add New → Project**, puis importe le dépôt. Vite est détecté automatiquement, et `vercel.json` contient déjà le bon réglage.
3. Va dans **Settings → Environment Variables**, ajoute les variables utiles (voir `.env.example`), puis **Redeploy**.

Pour un nom de domaine, va dans **Settings → Domains**. Mets ensuite `PUBLIC_URL=https://ton-domaine.sn`.

Les fonctions serveur sont dans `/api`. Elles gardent toutes les clés côté serveur, et aucune n'est jamais envoyée au navigateur.

## 3. Variables d'environnement

| Variable | À quoi ça sert |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Active les comptes, les crédits, la publication et l'espace client. Voir **GUIDE-SUPABASE.md**. |
| `VITE_SITES_DOMAIN` | (facultatif) Sites des clients en sous-domaine : `nom.defar.sn`. |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` | Au moins une pour des maquettes sur mesure. Si une IA tombe, la suivante prend le relais. |
| `AI_PROVIDER`, `*_MODEL`, `OPENAI_BASE_URL` | Choisir l'ordre et les modèles (facultatif). |
| `PEXELS_API_KEY` | Photos et vidéos choisies précisément pour chaque maquette. Sinon, la bibliothèque intégrée est utilisée. |
| `ACCESS_CODE` | Sans Supabase : code demandé avant chaque génération IA. Avec Supabase, ce sont le compte et les crédits qui protègent l'IA. |
| `RATE_LIMIT_PER_HOUR` | Nombre de générations par heure et par visiteur (30 par défaut). |
| `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`, `WAVE_SIGNING_SECRET` | Encaissement Wave direct. |
| `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`, `PAYDUNYA_MODE` | Orange Money, Mixx by Yas et carte via PayDunya. |
| `ADMIN_PASSWORD` | Protège la création de liens de paiement et les **signe** : le montant devient infalsifiable. |
| `MERCHANT_NAME` | Nom affiché sur le checkout et les reçus. |
| `ORDER_WEBHOOK_URL` | Reçoit chaque paiement confirmé (Make, Zapier, Google Sheets…). |
| `PUBLIC_URL`, `ALLOWED_ORIGINS` | Adresse du site et domaines autorisés. |

## 4. Encaisser pour de vrai

La page **`/paiements`** affiche l'état de la configuration et crée les liens de paiement (WhatsApp, QR code). Elle rappelle aussi les adresses de webhook à déclarer.

**Wave (API Checkout)**
1. Dans le portail Wave Business, va dans la section Développeurs.
2. Crée une clé API avec l'accès « Checkout » et mets-la dans `WAVE_API_KEY`.
3. Déclare le webhook `https://ton-site/api/pay/webhook-wave` et copie son secret dans `WAVE_WEBHOOK_SECRET`.

**PayDunya (Orange Money, Mixx by Yas, carte)**
1. Crée un compte marchand, puis une application dans « Intégrez notre API ».
2. Copie les trois clés.
3. Commence avec `PAYDUNYA_MODE=test`, puis passe à `live` une fois ton compte validé.
4. Les notifications de paiement (IPN) arrivent sur `/api/pay/webhook-paydunya`. La vérification se fait par hash SHA-512 de la clé principale.

Voici le parcours du client :
1. Il ouvre `/pay?a=15000&d=Acompte…&s=…`.
2. Il choisit son moyen de paiement et valide chez l'opérateur.
3. Il revient sur `/pay/retour`, qui **vérifie le statut auprès de l'opérateur** avant d'afficher le reçu. Ce reçu est imprimable en PDF et partageable sur WhatsApp.

> ⚠️ Un paiement n'est réussi que lorsque l'opérateur le confirme (vérification serveur ou webhook signé). Ne te fie jamais à une capture d'écran envoyée par un client : vérifie dans ton espace Wave ou PayDunya, ou dans tes notifications de commande.

Tant qu'aucune clé n'est configurée, un **simulateur** clairement marqué « TEST » remplace les opérateurs. Il permet de montrer le parcours complet sans argent réel. Le bouton « Essayer le checkout » de l'accueil reste toujours en simulation.

## 5. Comptes, crédits et sites en ligne

Suis **GUIDE-SUPABASE.md** : il faut compter 15 minutes, un copier-coller et deux variables dans Vercel.

- **`/connexion`** : créer un compte (50 crédits offerts), se connecter, mot de passe oublié.
- **`/espace`** :
  - **Mes sites** : modifier, publier, voir, supprimer.
  - **Messages** : commandes, réservations et messages, avec un bouton « Répondre sur WhatsApp ».
  - **Crédits** : solde et historique.
  - **Compte** : nom, numéro, mot de passe.
- **`/tarifs`** : forfaits en FCFA, marqués « phase d'essai ». Les montants sont dans `shared/plans.js`.
- **`/admin`** (réservé à l'administrateur) :
  - chiffres, comptes, sites et avis ;
  - ajout de crédits et changement de forfait.
- **`/s/nom-du-site`** : le site publié.
  - Sur téléphone, il s'affiche comme une app.
  - Sur ordinateur, comme un vrai site web : menu en haut, contenu centré, pied de page.
  - Aucun faux paiement : les commandes et réservations sont envoyées au vendeur.
  - Les écrans de compte d'exemple sont masqués.
- **Aperçus WhatsApp** : un lien de site partagé affiche le nom, la description et la photo du site (fonction `/api/og`).

Les crédits sont vérifiés et dépensés **côté serveur** (`/api/generate`), avec le jeton de la personne connectée :
- 5 crédits pour créer avec l'IA, 1 pour modifier ;
- gratuit si l'IA échoue et qu'un modèle prend le relais.

Toutes les règles d'accès sont dans `supabase/schema.sql` : chacun ne voit que ses sites et ses messages, et personne ne peut se donner des crédits.

## 6. Le studio (`/studio`)

- **Créer** : décris l'idée, ou pars d'un des 18 modèles (voir aussi `/galerie`). Avec les comptes, l'IA demande d'être connecté ; les modèles restent gratuits.
- **Aperçu** : téléphone (iPhone ou Android) ou **ordinateur** (bouton écran portable).
- **Modifier** : clique sur un bloc pour éditer textes, photos, vidéos, prix, couleurs, actions et écrans. Tu peux aussi demander à l'IA (« passe le thème en vert », « ajoute un écran de réservation »). Annuler et rétablir : Ctrl+Z et Ctrl+Maj+Z.
- **Mise en valeur** : entoure un ou deux mots d'astérisques dans un titre (`Ta beauté, *notre art*`). Ils s'affichent en italique élégant, dans la couleur de la marque.
- **Exporter** :
  - lien de présentation `/p#…` : la maquette tient entièrement dans le lien ;
  - fichier HTML autonome : s'ouvre sans Internet, sauf pour les photos ;
  - pack client `.zip` avec mode d'emploi ;
  - spécification JSON pour un développeur.
- **Demander un acompte** : dans le menu Exporter, ouvre `/paiements` avec la description préremplie.

- **Publier** : choisis l'adresse et ton numéro WhatsApp. Ensuite, « Mettre à jour le site » publie tes modifications : le brouillon et la version en ligne sont séparés.
- **Tes photos** : dans la bibliothèque de médias, « Importer une photo ». Elle est réduite automatiquement, puis stockée dans Supabase.

Sans compte, les projets sont enregistrés dans le navigateur (24 derniers). Avec un compte, ils sont enregistrés automatiquement en ligne et retrouvés sur tous tes appareils.

## 7. Vendre des maquettes : le parcours conseillé

1. Pendant l'échange WhatsApp avec ton client, génère la maquette à partir de son idée. Ajuste-la (nom, couleurs, prix, photos).
2. Envoie le **lien de présentation** : il l'ouvre en plein écran sur son téléphone, comme une vraie app.
3. Crée un **lien de paiement** pour l'acompte sur `/paiements` et envoie-le.
4. À la confirmation, livre le **pack client .zip**. Il contient la maquette, la spécification et un mode d'emploi pour son développeur.

> Une maquette Défar est un **prototype** : parcours, design et démonstration. Ce n'est pas une application publiée sur les stores avec une vraie base de données. Présente-la comme telle à tes clients.

## 8. Personnaliser la plateforme

- **Nom, WhatsApp, e-mail** : `src/config.js`. Change `BRAND.name` pour renommer tout le site. **Mets ton vrai numéro dans `BRAND.whatsapp`** : c'est lui qui reçoit les demandes de crédits.
- **Forfaits, prix et coûts en crédits** : `shared/plans.js`. Les crédits de bienvenue et les limites de sites sont aussi dans `supabase/schema.sql`.
- **Idées d'exemple et métiers de la galerie** : `src/config.js` (`EXAMPLES`, `CATEGORY_INFO`).
- **Modèles par métier** : `shared/generator/templates.js`.
- **Vidéos de l'accueil** : `public/media/hero.*` (boucle de fond) et `public/media/film.*` (film de 26 s). Tu peux les remplacer par les tiennes en gardant les mêmes noms. Formats : MP4 H.264 et WebM, 1920×1080 ou 1600×900, sans son.

Les vidéos fournies sont rendues image par image à partir de vrais écrans du moteur. Pour les regénérer après une modification des modèles, lance le serveur de dev puis :
  ```bash
  npm run film:assets   # capture les écrans
  npm run film:hero     # boucle de fond (20 s)
  npm run film:promo    # film de présentation (26 s)
  ```
  Ces commandes nécessitent Playwright (`npm i -D playwright`) et ffmpeg.

## 9. Qualité

```bash
npm test          # 38 tests : normaliseur, modèles, paiements, API, repli IA
                  # + base de données : règles d'accès, crédits, publication, formulaires, admin, photos
                  #   (contre un faux Supabase local : tools/mock-supabase)
npm run qa        # (serveur de dev lancé) ouvre les 18 modèles, clique partout, paie, 0 erreur exigée
```

## 10. Structure

```
api/                  fonctions serveur Vercel (IA + crédits, paiements, webhooks, aperçus /api/og)
supabase/schema.sql   base de données : tables, règles d'accès, fonctions (à coller dans Supabase)
shared/               cœur commun navigateur + serveur : normaliseur, prompt IA, modèles, médias, couleurs
src/engine/           moteur de rendu des maquettes (Player, écrans, 50 blocs, overlays)
src/studio/           éditeur (génération, inspecteur, écrans, style, export)
src/pages/            accueil, galerie, tarifs, site publié /s, lecteur /p, paiements
src/pages/account/    connexion, espace client, administration
src/lib/cloud.js      comptes et données en ligne (supabase-js chargé à la demande)
public/export/        lecteur autonome utilisé pour l'export HTML
public/media/         vidéos de l'accueil
tools/                QA automatisée, rendu des vidéos, faux Supabase pour les tests
tests/                tests automatisés
```
