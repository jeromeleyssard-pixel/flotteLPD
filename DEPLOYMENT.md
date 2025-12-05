# LPD Fleet Manager - Guide de Déploiement

## 🚀 Vue d'ensemble

LPD Fleet Manager est une application Next.js pour la gestion de flotte de véhicules avec Supabase comme backend. L'application utilise une authentification simplifiée via localStorage (pas de connexion requise).

## 📋 Prérequis

- Node.js 18+ 
- Compte Supabase avec projet configuré
- Accès admin au projet Supabase

## 🔧 Configuration Supabase

### 1. Désactiver RLS (Row Level Security)
Exécutez ces requêtes SQL dans l'éditeur Supabase :

```sql
ALTER TABLE fleet.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleet.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleet.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleet.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE fleet.maintenance DISABLE ROW LEVEL SECURITY;
```

### 2. Configurer CORS
Dans Supabase Dashboard → Settings → API → CORS origins, ajoutez :
- URL de production (ex: `https://votre-app.vercel.app`)
- `http://localhost:3000` (pour développement)

## 🌐 Déploiement (Vercel recommandé)

### 1. Connecter le dépôt GitHub
```bash
git push origin master
```
- Connectez votre dépôt à Vercel
- Importez le projet

### 2. Variables d'environnement
Dans Vercel → Settings → Environment Variables, ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

### 3. Déployer
Cliquez sur "Deploy" dans Vercel. Le déploiement prend 2-3 minutes.

## 👥 Utilisation pour les collègues

### Première utilisation
1. Accédez à l'URL de l'application
2. Remplissez le formulaire d'accueil (nom, prénom, département)
3. Lisez et validez le message de prévention sécurité
4. Accédez au dashboard personnalisé

### Données persistantes
- Les informations utilisateur sont stockées localement
- Les données de flotte sont synchronisées avec Supabase
- Pas de mot de passe à gérer

## 🐛 Dépannage

### CORS bloqué
- Vérifiez que l'URL de production est ajoutée dans Supabase CORS
- Attendez 1-2 minutes après la configuration CORS

### Données ne se chargent pas
- Vérifiez les variables d'environnement dans Vercel
- Assurez-vous que RLS est désactivé sur toutes les tables
- Vérifiez les permissions du projet Supabase

### Formulaire d'accueil reste visible
- Normal si localStorage est vidé
- Les utilisateurs peuvent remplir le formulaire à nouveau

## 📞 Support

Pour toute question technique :
- Vérifier ce guide de déploiement
- Consulter les logs Vercel
- Vérifier la configuration Supabase

---

**Version :** 1.0 (No-Auth)  
**Dernière mise à jour :** Décembre 2024
