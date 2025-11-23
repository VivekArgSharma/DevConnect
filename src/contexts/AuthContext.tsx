import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient, Session, User } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface AuthContextType {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: any | null;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // -------------------------
  // 1. INITIAL SESSION LOAD
  // -------------------------
  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();

      if (!ignore) {
        setSession(activeSession || null);
        setUser(activeSession?.user || null);
        setAccessToken(activeSession?.access_token || null);
      }

      setLoading(false);
    }

    loadSession();

    return () => {
      ignore = true;
    };
  }, []);

  // ----------------------------------------------------------
  // 2. LISTEN FOR LOGIN / LOGOUT / TOKEN REFRESH EVENTS
  // ----------------------------------------------------------
  useEffect(() => {
    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((event, session) => {
      // event examples: "SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED"
      setSession(session || null);
      setUser(session?.user || null);
      setAccessToken(session?.access_token || null);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        syncProfile(session);
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ----------------------------------------------------------
  // 3. SYNC PROFILE WITH BACKEND WHEN SESSION CHANGES
  // ----------------------------------------------------------
  async function syncProfile(session: Session | null) {
    if (!session?.access_token || !session.user) return;

    try {
      const { user } = session;

      // send info to backend
      await fetch(`${API_URL}/api/me/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: user.user_metadata.full_name,
          avatar_url: user.user_metadata.avatar_url,
        }),
      });

      setProfile({
        full_name: user.user_metadata.full_name,
        avatar_url: user.user_metadata.avatar_url,
      });
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  }

  // ----------------------------------------------------------
  // 4. SIGN-IN WITH GOOGLE (CORRECT SUPABASE v2 FLOW)
  // ----------------------------------------------------------
  async function signInWithGoogle() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) console.error("Google login error:", error);

    setLoading(false);
  }

  // ----------------------------------------------------------
  // 5. SIGN OUT
  // ----------------------------------------------------------
  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        user,
        profile,
        accessToken,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
