import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthUser = {
  id: string;
  email: string;
  profile: {
    name: string | null;
    language: string | null;
  } | null;
  hasMfaEnabled: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  setupMfa: () => Promise<MfaSetupResponse>;
  verifyMfa: (token: string) => Promise<void>;
  disableMfa: () => Promise<void>;
  updateProfile: (profile: { name: string; language: string }) => Promise<void>;
};

type LoginPayload = {
  email: string;
  password: string;
  mfaToken?: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  language?: string;
};

type MfaSetupResponse = {
  otpauthUrl: string;
  qrDataUrl: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = body?.error ?? res.statusText;
    throw new Error(message);
  }

  return body;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthSuccess = useCallback((data: any) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (data?.mfaRequired) {
        throw new Error("MFA_REQUIRED");
      }

      handleAuthSuccess(data);
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await fetchJson("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      handleAuthSuccess(data);
    },
    [handleAuthSuccess]
  );

  const refresh = useCallback(async () => {
    const data = await fetchJson("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    handleAuthSuccess(data);
  }, [handleAuthSuccess]);

  const logout = useCallback(async () => {
    try {
      await fetchJson("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const requestPasswordReset = useCallback(async (email: string) => {
    await fetchJson("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await fetchJson("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token, password }),
    });
  }, []);

  const setupMfa = useCallback(async (): Promise<MfaSetupResponse> => {
    return fetchJson("/api/auth/mfa/setup", {
      method: "POST",
      credentials: "include",
      headers: authHeaders(accessToken),
    });
  }, [accessToken]);

  const verifyMfa = useCallback(
    async (token: string) => {
      await fetchJson("/api/auth/mfa/verify", {
        method: "POST",
        credentials: "include",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      await refresh();
    },
    [accessToken, refresh]
  );

  const disableMfa = useCallback(async () => {
    await fetchJson("/api/auth/mfa/disable", {
      method: "POST",
      credentials: "include",
      headers: authHeaders(accessToken),
    });
    await refresh();
  }, [accessToken, refresh]);

  const updateProfile = useCallback(
    async ({ name, language }: { name: string; language: string }) => {
      const data = await fetchJson("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, language }),
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                name: data.profile?.name ?? "",
                language: data.profile?.language ?? "en",
              },
            }
          : prev
      );
    },
    [accessToken]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await refresh();
      } catch {
        clearSession();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [refresh, clearSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      refresh,
      requestPasswordReset,
      resetPassword,
      setupMfa,
      verifyMfa,
      disableMfa,
      updateProfile,
    }),
    [
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      refresh,
      requestPasswordReset,
      resetPassword,
      setupMfa,
      verifyMfa,
      disableMfa,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

function authHeaders(accessToken: string | null) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
}
