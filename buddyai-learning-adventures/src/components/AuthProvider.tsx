import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  initAuth,
  signup,
  login,
  logout as doLogout,
  getSession,
  getCurrentUser,
  updateProfile as updateUserProfile,
  type AuthSession,
  type User,
} from "@/lib/auth";
import { createSession as dbCreateSession, type ChatSession } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, grade: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => void;
  updateProfile: (updates: { name?: string; grade?: string }) => Promise<User>;
  createSession: (subject: string, topic: string | null) => ChatSession;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await initAuth();
      const currentUser = getCurrentUser();
      const currentSession = getSession();
      setUser(currentUser);
      setSession(currentSession);
      setLoading(false);
    }
    init();
  }, []);

  async function signUp(
    email: string,
    password: string,
    name: string,
    grade: string
  ) {
    const { user: newUser, session: newSession } = await signup(email, password, name, grade);
    setUser(newUser);
    setSession(newSession);
  }

  async function logIn(email: string, password: string) {
    const { user: loggedInUser, session: newSession } = await login(email, password);
    setUser(loggedInUser);
    setSession(newSession);
  }

  function logOut() {
    doLogout();
    setUser(null);
    setSession(null);
  }

  async function updateProfile(updates: { name?: string; grade?: string }) {
    if (!user) throw new Error("Not logged in");
    const updated = await updateUserProfile(user.id, updates);
    setUser(updated);
    return updated;
  }

  function createSession(subject: string, topic: string | null): ChatSession {
    if (!user) throw new Error("Not logged in");
    return dbCreateSession(user.id, subject, topic);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        logIn,
        logOut,
        updateProfile,
        createSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}