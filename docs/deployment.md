# Déploiement & Mise en production

Ce guide décrit la marche à suivre pour rendre l'application "LPD Fleet Manager" pleinement fonctionnelle avec Airtable (free tier) et une authentification NextAuth (email magic link). Tout est pensé pour rester dans des plans gratuits.

## 1. Pré-requis
- Compte Airtable (gratuit).  
- Compte Vercel (ou Netlify).  
- Un domaine ou sous-domaine optionnel.  
- Accès à un SMTP gratuit (p. ex. Resend, Brevo) pour les liens de connexion.

## 2. Structurer Airtable
1. Créer une base `LPD Fleet` avec les tables suivantes et leurs colonnes :
   - `departments` : `name`, `region`, `color`.  
   - `users` : `full_name`, `email`, `role` (Single select), `department` (Link to departments), `active` (checkbox).  
   - `vehicles` : `name`, `license_plate`, `model`, `year`, `department`, `current_km`, `ct_due_date`, `service_due_km`, `service_due_date`, `status` (Single select).  
   - `trips` : `vehicle` (link), `driver` (link), `department`, `start_datetime`, `end_datetime`, `start_km`, `end_km`, `fuel_start`, `fuel_end`, `cleanliness_start`, `cleanliness_end`, `incident_notes`, `photos` (Attachments).  
   - `maintenance_logs` : `vehicle`, `department`, `type`, `scheduled_date`, `performed_date`, `status`, `notes`.
2. Renseigner les 3 véhicules du Vaucluse et au moins un utilisateur admin.  
3. Créer un **Personal Access Token** Airtable (scopes `data.records:read` et `write` sur la base).  
4. Noter `AIRTABLE_BASE_ID` (disponible dans l'URL de la base) et les noms de tables.

## 3. Variables d’environnement
Créer un fichier `.env.local` (pour le dev) et configurer les secrets sur Vercel :
```
AIRTABLE_API_KEY=pat_xxx
AIRTABLE_BASE_ID=appxxx
AIRTABLE_DEPARTMENTS_TABLE=departments
AIRTABLE_USERS_TABLE=users
AIRTABLE_VEHICLES_TABLE=vehicles
AIRTABLE_TRIPS_TABLE=trips
AIRTABLE_MAINTENANCE_TABLE=maintenance_logs
NEXTAUTH_URL=https://votre-domaine.vercel.app
NEXTAUTH_SECRET=openssl rand -base64 32
EMAIL_SERVER=smtp://user:pass@smtp.provider.com:587
EMAIL_FROM=fleet@petitsdebrouillards.org
```

## 4. Brancher Airtable dans l’app
1. Créer `src/lib/airtable.ts` avec un client REST simple (fetch + headers).  
2. Définir des fonctions repository (`fetchVehicles`, `createTrip`, etc.) dans `src/lib/data/vehicles.ts`, `trips.ts`, etc.  
3. Remplacer les appels à `mockData` dans `Dashboard.tsx` par des hooks utilisant TanStack Query qui appellent les nouvelles API routes.  
4. Mettre en cache les requêtes avec `React Query` + `staleTime` raisonnable pour limiter les quotas Airtable.

## 5. Authentification NextAuth (Email)
1. Installer `next-auth` et un adaptateur Airtable custom (ou stocker les sessions en mémoire si usage restreint).  
2. Ajouter `/app/api/auth/[...nextauth]/route.ts` avec un provider `EmailProvider`.  
3. Dans `SessionContext`, remplacer la logique mock par `useSession` de NextAuth (mais conserver la bulle sécurité : elle peut lire/écrire dans `localStorage` comme aujourd’hui).  
4. Protéger les pages via `middleware.ts` : rediriger vers `/auth/signin` si l’utilisateur n’est pas connecté.

## 6. API Routes sécurisées
Créer des handlers dans `/app/api`:  
- `vehicles/route.ts` (`GET`, `PATCH`).  
- `trips/route.ts` (`GET`, `POST`, `PATCH`).  
- `maintenance/route.ts` (`GET`, `POST`).  
Chaque handler :
1. Lit l’utilisateur via `auth()`.  
2. Vérifie `role` + `departmentIds`.  
3. Traduit les données vers Airtable (format JSON).  
4. Renvoie des erreurs 403/422 si règle métier violée (ex: véhicule déjà réservé).

## 7. Service Worker & PWA
1. Ajouter `@ducanh2912/next-pwa` ou équivalent.  
2. Générer des icônes `icon-192.png` et `icon-512.png` (ex: via Figma).  
3. Configurer la mise en cache des assets + fallback offline (Dashboard lecture seule avec dernière synchro).  
4. Tester l’installation via Lighthouse et Chrome DevTools.

## 8. Tests & QA
- Tests unitaires (`vitest` ou `jest`) sur les utilitaires (validation check-in/out).  
- Tests e2e Playwright couvrant connexion, check-in, check-out, maintenance.  
- CI GitHub Actions : `npm run lint`, `npm run test`, `npm run build`.

## 9. Déploiement Vercel
1. `vercel link` puis `vercel env pull` pour synchroniser les secrets.  
2. `vercel --prod` une fois les tests passés.  
3. Activer "Password Protection" ou restreindre les domaines si bêta fermée.  
4. Configurer les webhooks Vercel pour invalider le cache lorsque les données Airtable changent (optionnel).

## 10. Passage en production
- Former les coordinateurs à l’usage (check-in/out) et au circuit de remontée des incidents.  
- Documenter la procédure en cas d’amende ou d’accident (modèle d’email).  
- Prévoir un export mensuel (API route `GET /api/trips/export?range=`) pour archivage.

En suivant ces étapes, l’application devient exploitable en situation réelle tout en respectant la contrainte "coût 0 €" sur les plans gratuits.
