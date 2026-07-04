"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const metadata = session.user.user_metadata as { imie?: string } | undefined;
  const email = session.user.email ?? "";
  return {
    id: session.user.id,
    name: metadata?.imie || email.split("@")[0] || "Użytkownik",
    email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applyUser = (next: AuthUser | null) => {
      setUser((prev) => {
        if (prev === next) return prev;
        if (prev && next && prev.email === next.email && prev.name === next.name) {
          return prev;
        }
        return next;
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      applyUser(toUser(data.session));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      applyUser(toUser(session));
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, signOut }), [user, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
