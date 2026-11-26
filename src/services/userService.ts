import axios from "axios";
import type { User } from "../types/user";
import { apiClient } from "./apiClient";

const readApiError = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export interface CreateUserPayload {
  roleId: number;
  name: string;
  email: string;
  password: string;
  status: boolean;
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>("/users");
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró cargar los usuarios. Intente de nuevo más tarde"));
  }
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  try {
    const response = await apiClient.post<User>("/users", payload);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró registrar el usuario"));
  }
};

export const updateUser = async (id: number, payload: CreateUserPayload): Promise<User> => {
  try {
    const response = await apiClient.put<User>(`/users/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró actualizar el usuario"));
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/users/${id}`);
  } catch (error) {
    throw new Error(readApiError(error, "No se logró eliminar el usuario"));
  }
};
