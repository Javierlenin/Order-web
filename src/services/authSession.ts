import type { AuthSession } from "../types/auth";

const SESSION_KEY = "order-auth-session";

const isAuthSession = (value: unknown): value is AuthSession => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const session = value as AuthSession;
  return typeof session.token === "string" && session.token.length > 0 && typeof session.user?.email === "string";
};

export const getSession = (): AuthSession | null => {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(raw);
    return isAuthSession(session) ? session : null;
  } catch {
    return null;
  }
};

export const saveSession = (session: AuthSession): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};
