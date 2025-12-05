# 🚀 Guide Déploiement Vercel - LPD Fleet Manager

## 📋 Étape 1 - Préparation (5 minutes)

### 1.1 Créer compte Vercel
- Allez sur [vercel.com](https://vercel.com)
- Créez un compte gratuit avec GitHub
- Autorisez Vercel à accéder à vos dépôts GitHub

### 1.2 Vérifier le code
```bash
# Assurez-vous d'être sur la bonne branche
git checkout master
git pull origin master
```

---

## 🌐 Étape 2 - Déploiement Initial (10 minutes)

### 2.1 Importer le projet
1. Connectez-vous à Vercel
2. Cliquez sur **"Add New..."** → **"Project"**
3. Cherchez `flotteLPD` dans vos dépôts GitHub
4. Cliquez sur **"Import"**

### 2.2 Configuration automatique
Vercel détectera automatiquement :
- **Framework**: Next.js ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

### 2.3 Premier déploiement
1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes ⏳
3. Votre site sera disponible : `https://flotte-lpd.vercel.app`

---

## ⚙️ Étape 3 - Variables d'Environnement (5 minutes)

### 3.1 Copier les variables depuis .env.local
Ouvrez votre fichier `.env.local` local et copiez ces 3 variables :

```
NEXT_PUBLIC_SUPABASE_URL=https://cmsgownkadwvbejotohu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Ajouter dans Vercel
1. Dans Vercel → allez sur votre projet
2. Cliquez onglet **"Settings"** → **"Environment Variables"**
3. Ajoutez les 3 variables une par une :
   - **NEXT_PUBLIC_SUPABASE_URL** → votre URL Supabase
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY** → votre clé anon
   - **SUPABASE_SERVICE_ROLE_KEY** → votre clé service

### 3.3 Redéploiement automatique
Après avoir ajouté les variables, Vercel redéploiera automatiquement 🔄

---

## 🔧 Étape 4 - Configuration CORS Supabase (5 minutes)

### 4.1 Trouver l'URL Vercel
Votre URL Vercel est dans le dashboard Vercel, ex: `https://flotte-lpd.vercel.app`

### 4.2 Configurer CORS dans Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet `cmsgownkadwvbejotohu`
3. **Settings** → **API**
4. Dans **"CORS origins"**, ajoutez :
   - `https://flotte-lpd.vercel.app` (remplacez par votre URL)
   - `http://localhost:3000` (pour développement local)

### 4.3 Sauvegarder et attendre
- Cliquez **"Save"**
- Attendez 30-60 secondes pour la propagation ⏳

---

## ✅ Étape 5 - Test Final (5 minutes)

### 5.1 Tester l'application
1. Allez sur votre URL Vercel
2. Vous devriez voir le formulaire d'accueil
3. Remplissez : nom, prénom, sélectionnez un département
4. Validez le message de sécurité
5. Accédez au dashboard personnalisé ✅

### 5.2 Vérifier les fonctionnalités
- ✅ Formulaire d'accueil fonctionne
- ✅ Dashboard affiche "Bonjour [Prénom]"
- ✅ Les véhicules s'affichent
- ✅ Les actions (réserver, ajouter) fonctionnent

---

## 🎉 Déploiement Terminé !

### 📞 Pour vos collègues

**URL de l'application :** `https://flotte-lpd.vercel.app`

**Première utilisation :**
1. Remplir le formulaire d'accueil
2. Valider le message de sécurité
3. Utiliser l'application normalement

**Support :**
- En cas de problème CORS : attendre 1-2 minutes après configuration
- En cas de problème données : vérifier les variables d'environnement Vercel

---

## 🔄 Mises à jour futures

Pour mettre à jour l'application :
```bash
git push origin master
```
Vercel déploiera automatiquement les changements ! 🚀

---

**Temps total estimé : 30 minutes**  
**Difficulté : ⭐⭐☆☆☆ (Facile)**

---

*Guide créé pour LPD Fleet Manager - Décembre 2024*
