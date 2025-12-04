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
import { users } from "@/lib/mockData";

type SessionContextValue = {
  sessionUser?: User;
  setSessionUser: (user?: User) => void;
  hasAcknowledgedSafety: boolean;
  acknowledgeSafety: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const SESSION_STORAGE_KEY = "lpd.session.userId";
const SAFETY_ACK_PREFIX = "lpd.session.safety.";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUserState] = useState<User>();
  const [hasAcknowledgedSafety, setHasAcknowledgedSafety] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedUserId) return;
    const foundUser = users.find((user) => user.id === storedUserId);
    if (foundUser) {
      setSessionUserState(foundUser);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionUser) {
      setHasAcknowledgedSafety(false);
      return;
    }
    const safetyKey = `${SAFETY_ACK_PREFIX}${sessionUser.id}`;
    const acknowledged = window.localStorage.getItem(safetyKey) === "true";
    setHasAcknowledgedSafety(acknowledged);
  }, [sessionUser]);

  const setSessionUser = (user?: User) => {
    if (typeof window !== "undefined") {
      if (user) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, user.id);
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    setSessionUserState(user);
  };

  const acknowledgeSafety = () => {
    if (!sessionUser || typeof window === "undefined") return;
    const safetyKey = `${SAFETY_ACK_PREFIX}${sessionUser.id}`;
    window.localStorage.setItem(safetyKey, "true");
    setHasAcknowledgedSafety(true);
  };

  const value = useMemo<SessionContextValue>(
    () => ({
      sessionUser,
      setSessionUser,
      hasAcknowledgedSafety,
      acknowledgeSafety,
    }),
    [sessionUser, hasAcknowledgedSafety],
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
