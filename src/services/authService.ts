import axios from "axios";
import type { AuthSession, LoginCredentials, RegisterAccount } from "../types/auth";
import { apiClient } from "./apiClient";
import { saveSession } from "./authSession";

const readApiError = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
};

const requestSession = async (
  path: string,
  body: LoginCredentials | RegisterAccount,
  fallback: string,
): Promise<AuthSession> => {
  try {
    const response = await apiClient.post<AuthSession>(path, body);
    saveSession(response.data);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, fallback));
  }
};

export const login = (credentials: LoginCredentials): Promise<AuthSession> =>
  requestSession("/auth/login", credentials, "No se pudo iniciar sesión");

export const register = (account: RegisterAccount): Promise<AuthSession> =>
  requestSession("/auth/register", account, "No se pudo registrar el usuario");
