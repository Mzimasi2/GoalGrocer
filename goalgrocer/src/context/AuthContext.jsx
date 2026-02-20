import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { ensureDb, ensureUserProfileForAuth, updateUserProfile } from "../services/db";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    ensureDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      try {
        const profile = await ensureUserProfileForAuth(firebaseUser);
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function register({ fullName, email, password }) {
    const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);

    if (fullName?.trim()) {
      await updateProfile(credentials.user, { displayName: fullName.trim() });
    }

    await ensureUserProfileForAuth({
      ...credentials.user,
      displayName: fullName?.trim() || credentials.user.displayName,
    });
  }

  async function logout() {
    await signOut(auth);
  }

  function savePreferences({ savedGoal, savedBudget, fullName }) {
    if (!user) return;
    const updated = updateUserProfile(user.id, { savedGoal, savedBudget, fullName });
    if (updated) setUser(updated);
  }

  const value = {
    user,
    authReady,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    savePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
