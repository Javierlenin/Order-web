import axios from "axios";
import type { AuthSession, LoginCredentials } from "../types/auth";
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

const requestSession = async (path: string, credentials: LoginCredentials, fallback: string): Promise<AuthSession> => {
  try {
    const response = await apiClient.post<AuthSession>(path, credentials);
    saveSession(response.data);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, fallback));
  }
};

export const login = (credentials: LoginCredentials): Promise<AuthSession> =>
  requestSession("/auth/login", credentials, "No se pudo iniciar sesión");

export const register = (credentials: LoginCredentials): Promise<AuthSession> =>
  requestSession("/auth/register", credentials, "No se pudo registrar el usuario");
