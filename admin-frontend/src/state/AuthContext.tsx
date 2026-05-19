import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../services/api";
import { Role, UserSession } from "../types";

interface AuthContextValue {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserSession>;
  register: (payload: Record<string, unknown>) => Promise<UserSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthApiResponse {
  userId: string;
  fullName: string;
  email: string;
  roles: Role[];
  token: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) {
      return;
    }
    api
      .get<AuthApiResponse>("/auth/me")
      .then((response) => setUser(toSession(response)))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  async function acceptAuthResponse(response: AuthApiResponse) {
    tokenStore.set(response.token);
    const session = toSession(response);
    setUser(session);
    return session;
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => acceptAuthResponse(await api.post<AuthApiResponse>("/auth/login", { email, password })),
      register: async (payload) => acceptAuthResponse(await api.post<AuthApiResponse>("/auth/register", payload)),
      logout: () => {
        api.post("/auth/logout", {}).catch(() => undefined);
        tokenStore.clear();
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function toSession(response: AuthApiResponse): UserSession {
  const primaryRole = response.roles[0] ?? "CUSTOMER";
  return {
    id: response.userId,
    name: response.fullName,
    email: response.email,
    role: primaryRole,
    roles: response.roles,
    profileComplete: primaryRole !== "CUSTOMER",
    token: response.token
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
