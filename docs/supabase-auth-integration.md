# Intégration Supabase Auth avec Next.js

## Étape 1 : Configuration des variables d'environnement

Dans `.env.local`, ajoutez vos clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Étape 2 : Installation des dépendances

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## Étape 3 : Configuration du client Supabase

Créez `src/lib/supabaseClient.ts` :

```typescript
import { createBrowserClient } from '@supabase/supabase-js';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## Étape 4 : Configuration du provider d'authentification

Créez `src/components/auth/AuthProvider.tsx` :

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Étape 5 : Protection des routes

Créez `src/components/auth/AuthGate.tsx` :

```typescript
'use client';

import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
```

## Étape 6 : Formulaire de connexion

Créez `src/components/auth/LoginForm.tsx` :

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="space-y-4">
        <h2>Connexion</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
```

## Étape 7 : Intégration dans l'application

Modifiez `src/app/layout.tsx` :

```typescript
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

Modifiez `src/app/page.tsx` :

```typescript
import { AuthGate } from '@/components/auth/AuthGate';
import { DashboardRoot } from '@/components/dashboard/DashboardRoot';

export default function Home() {
  return (
    <AuthGate>
      <DashboardRoot />
    </AuthGate>
  );
}
```

## Étape 8 : Récupération des données utilisateur

Modifiez votre `SessionContext` pour utiliser l'utilisateur Supabase :

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import type { User as FleetUser } from '@/lib/types';

interface SessionContextType {
  sessionUser: FleetUser | null;
  users: FleetUser[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, signOut } = useAuth();
  const [sessionUser, setSessionUser] = useState<FleetUser | null>(null);
  const [users, setUsers] = useState<FleetUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      // Récupérer les données de l'utilisateur depuis fleet.users
      fetchFleetUsers();
    } else {
      setSessionUser(null);
      setUsers([]);
      setLoading(false);
    }
  }, [authUser]);

  const fetchFleetUsers = async () => {
    const { data, error } = await supabase
      .from('fleet.users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      const fleetUsers = data.map(mapUser);
      setUsers(fleetUsers);
      
      // Trouver l'utilisateur correspondant à l'utilisateur authentifié
      const currentUser = fleetUsers.find(u => u.email === authUser?.email);
      setSessionUser(currentUser || null);
    }
    setLoading(false);
  };

  return (
    <SessionContext.Provider value={{
      sessionUser,
      users,
      loading,
      signOut
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
```

## Étape 9 : Test de l'intégration

1. Créez un utilisateur dans Supabase Auth
2. Ajoutez l'utilisateur correspondant dans `fleet.users`
3. Testez la connexion
4. Vérifiez que les claims JWT (`role`, `department_id`) sont bien inclus

## Étape 10 : Déploiement

Pour le déploiement, ajoutez les variables d'environnement dans votre plateforme d'hébergement (Vercel, Netlify, etc.).

## Notes importantes

- Les claims JWT personnalisés sont configurés via les Auth Hooks (voir documentation séparée)
- Les politiques RLS utilisent `auth.role()` et `auth.jwt()->>'department_id'`
- L'état de session est automatiquement géré par Supabase
- Le logout est géré par `supabase.auth.signOut()`
