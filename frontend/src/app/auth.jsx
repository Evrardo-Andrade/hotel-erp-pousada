import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  changePassword,
  clearStoredAuthSession,
  fetchCurrentUser,
  getStoredAuthSession,
  loginRequest,
  logoutRequest,
  registerUser,
  setStoredAuthSession,
  updateCurrentUserProfile
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    bootstrapAuth();

    function handleAuthExpired() {
      clearStoredAuthSession();
      setUser(null);
      setToken("");
    }

    window.addEventListener("hotel-erp-auth-expired", handleAuthExpired);
    return () => window.removeEventListener("hotel-erp-auth-expired", handleAuthExpired);
  }, []);

  async function bootstrapAuth() {
    const session = getStoredAuthSession();

    if (!session?.token) {
      setIsLoadingAuth(false);
      return;
    }

    try {
      setToken(session.token);
      const result = await fetchCurrentUser();
      const currentUser = result?.user || session.user;
      setUser(currentUser || null);
      setStoredAuthSession({ token: session.token, user: currentUser }, null);
    } catch (_error) {
      clearStoredAuthSession();
      setUser(null);
      setToken("");
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function login(credentials) {
    const session = await loginRequest({
      email: credentials.email,
      password: credentials.password
    });

    setStoredAuthSession(session, credentials.remember);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch (_error) {
      // noop
    } finally {
      clearStoredAuthSession();
      setUser(null);
      setToken("");
    }
  }

  async function refreshCurrentUser() {
    const result = await fetchCurrentUser();
    const currentUser = result?.user || null;
    const session = getStoredAuthSession();
    if (session?.token && currentUser) {
      setStoredAuthSession({ token: session.token, user: currentUser }, null);
    }
    setUser(currentUser);
    return currentUser;
  }

  async function updateProfile(payload) {
    const result = await updateCurrentUserProfile(payload);
    const nextUser = result?.user || null;
    const session = getStoredAuthSession();

    if (session?.token && nextUser) {
      setStoredAuthSession({ token: session.token, user: nextUser }, null);
    }

    setUser(nextUser);
    return nextUser;
  }

  async function changeOwnPassword(payload) {
    return changePassword(payload);
  }

  const value = useMemo(() => ({
    user,
    token,
    isLoadingAuth,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    updateProfile,
    changeOwnPassword,
    getCurrentUser: refreshCurrentUser,
    registerUser,
    changePassword: changeOwnPassword
  }), [user, token, isLoadingAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
