# Brancher la base de données (Supabase) — 15 minutes

Ce guide active :
- les comptes ;
- les crédits ;
- l'espace client ;
- la publication des sites ;
- les commandes et réservations reçues ;
- les avis des testeurs ;
- la page Admin.

Tout se fait depuis le navigateur, même sur téléphone.

---

## 1. Créer le projet Supabase

1. Va sur **supabase.com**, puis clique sur **Start your project**.
2. Connecte-toi avec ton compte **GitHub**. C'est le plus simple.
3. Clique sur **New project** et remplis :
   - **Name** : `defar`
   - **Database Password** : clique sur *Generate a password*, puis **garde-le précieusement**.
   - **Region** : **West EU (Paris)**, la plus proche de Dakar.
   - **Plan** : Free, pour la phase d'essai.
4. Clique sur **Create new project**, puis attends 1 à 2 minutes.

## 2. Créer les tables (un copier-coller)

1. Dans ton dépôt GitHub, ouvre le fichier **`supabase/schema.sql`**.
2. Clique sur **Raw**, puis sélectionne tout le texte et copie-le.
3. Dans Supabase, ouvre le menu de gauche, puis **SQL Editor** → **New query**.
4. Colle le texte, puis clique sur **Run**. Le message **Success** doit s'afficher.

> Tu peux relancer ce script sans danger : il ne supprime rien.

## 3. Deux réglages de connexion

1. Va dans **Authentication** → **Sign In / Providers** (ou **Providers**) → **Email**.
2. **Désactive « Confirm email »**, puis enregistre.
   - Ainsi, les testeurs peuvent se connecter tout de suite, sans attendre d'e-mail.
   - L'envoi d'e-mails gratuit de Supabase est très limité : quelques e-mails par heure.
3. Va dans **Authentication** → **URL Configuration** et remplis :
   - **Site URL** : l'adresse de ton site, `https://defar-ten.vercel.app`.
   - **Redirect URLs** : ajoute `https://defar-ten.vercel.app/**`.

## 4. Copier les deux clés dans Vercel

1. Dans Supabase, va dans **Project Settings** → **API** (ou **API Keys**). Copie :
   - le **Project URL**, du type `https://abcd1234.supabase.co` ;
   - la clé publique : **anon public** ou **publishable**.
2. Dans Vercel, ouvre ton projet, puis **Settings** → **Environment Variables**. Ajoute ces deux variables :

   | Nom | Valeur |
   |---|---|
   | `VITE_SUPABASE_URL` | le Project URL |
   | `VITE_SUPABASE_ANON_KEY` | la clé publique |

3. Va dans **Deployments**, clique sur **⋯** à côté du dernier déploiement, puis sur **Redeploy**.

> Ces deux valeurs ne sont pas secrètes : ce sont les règles du fichier `schema.sql` qui protègent les données.
> **Ne mets jamais la clé « service_role » ou « secret » dans Vercel ni sur GitHub.** Défar n'en a pas besoin.

## 5. Devenir administrateur

1. Sur ton site, crée ton compte (**Connexion** → **Créer un compte**).
2. Dans Supabase, ouvre **SQL Editor** → **New query**, puis colle cette ligne avec **ton** e-mail :

   ```sql
   update public.profiles set is_admin = true where email = 'ton-email@exemple.com';
   ```

3. Clique sur **Run**, puis recharge ton site. Le menu de ton compte affiche maintenant **Administration**.

La page `/admin` te permet de :
- voir les chiffres, les comptes, les sites et les avis ;
- ajouter des crédits à un testeur ;
- changer le forfait d'un compte.

## 6. Vérifier que tout marche

1. **Crée un compte** : tu dois avoir 50 crédits.
2. **Génère une app** dans le studio : 5 crédits sont dépensés.
3. Clique sur **Publier** : ton site est en ligne à l'adresse `…/s/ton-site`.
4. Ouvre ce lien sur un **autre téléphone**, puis passe une commande ou une réservation.
5. Dans **Mon espace → Messages**, la commande apparaît avec un bouton **Répondre sur WhatsApp**.

---

### À savoir avant de faire payer

- **Supabase gratuit** : 500 Mo de base de données et 1 Go de photos. Le projet est mis en pause après 1 semaine sans visite. Passe à l'offre **Pro** (25 $ par mois) avant d'avoir de vrais clients.
- **Vercel gratuit (Hobby)** : réservé à un usage non commercial. Passe à l'offre **Pro** avant de vendre.
- **Adresses du type `salon-awa.defar.sn`** : il faut un nom de domaine. Dans Vercel, va dans **Settings → Domains**, ajoute `defar.sn` et `*.defar.sn`. Mets ensuite `VITE_SITES_DOMAIN=defar.sn` dans les variables, puis redéploie. Sans ça, les sites sont à l'adresse `ton-site.vercel.app/s/nom`, qui marche très bien.
