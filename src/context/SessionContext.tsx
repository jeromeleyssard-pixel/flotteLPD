"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/lib/types";
import { fetchUsers } from "@/lib/api/fleet";

type SessionContextValue = {
  sessionUser?: User;
  setSessionUser: (user?: User) => void;
  hasAcknowledgedSafety: boolean;
  acknowledgeSafety: () => void;
  users: User[];
  reloadUsers: () => Promise<void>;
  usersLoading: boolean;
  welcomeInfo?: {
    firstName: string;
    lastName: string;
    departmentId: string;
  };
  setWelcomeInfo: (info?: { firstName: string; lastName: string; departmentId: string }) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const SAFETY_ACK_PREFIX = "lpd.session.safety.";
const WELCOME_INFO_KEY = "lpd.session.welcomeInfo";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUserState] = useState<User>();
  const [hasAcknowledgedSafety, setHasAcknowledgedSafety] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [welcomeInfo, setWelcomeInfoState] = useState<{
    firstName: string;
    lastName: string;
    departmentId: string;
  } | undefined>();

  // Charger les informations d'accueil depuis localStorage au démarrage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(WELCOME_INFO_KEY);
      if (stored) {
        try {
          setWelcomeInfoState(JSON.parse(stored));
        } catch (error) {
          console.error("Erreur lors du chargement des infos d'accueil:", error);
        }
      }
    }
  }, []);

  // Charger les utilisateurs au démarrage et pour recharger
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const fetched = await fetchUsers();
      setUsers(fetched);
    } catch (error) {
      console.error("Unable to fetch users", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Charger les utilisateurs au démarrage
  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !welcomeInfo) return;
    const safetyKey = `${SAFETY_ACK_PREFIX}${welcomeInfo.firstName}-${welcomeInfo.lastName}`;
    const acknowledged = window.localStorage.getItem(safetyKey) === "true";
    setHasAcknowledgedSafety(acknowledged);
  }, [welcomeInfo]);

  const setSessionUser = (user?: User) => {
    setSessionUserState(user);
  };

  const setWelcomeInfo = (info?: { firstName: string; lastName: string; departmentId: string }) => {
    setWelcomeInfoState(info);
    if (typeof window !== "undefined") {
      if (info) {
        window.localStorage.setItem(WELCOME_INFO_KEY, JSON.stringify(info));
      } else {
        window.localStorage.removeItem(WELCOME_INFO_KEY);
      }
    }
  };

  const acknowledgeSafety = () => {
    if (!welcomeInfo || typeof window === "undefined") return;
    const safetyKey = `${SAFETY_ACK_PREFIX}${welcomeInfo.firstName}-${welcomeInfo.lastName}`;
    window.localStorage.setItem(safetyKey, "true");
    setHasAcknowledgedSafety(true);
  };

  const value = useMemo<SessionContextValue>(
    () => ({
      sessionUser,
      setSessionUser,
      hasAcknowledgedSafety,
      acknowledgeSafety,
      users,
      reloadUsers: loadUsers,
      usersLoading,
      welcomeInfo,
      setWelcomeInfo,
    }),
    [sessionUser, hasAcknowledgedSafety, users, usersLoading, welcomeInfo],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
