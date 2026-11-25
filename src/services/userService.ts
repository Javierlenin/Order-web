import type { User } from "../types/user";
import { apiClient } from "./apiClient";

export const getUsers = async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>("/users");
    return response.data;
};

export interface CreateUserPayload {
  roleId: number;
  name: string;
  email: string;
  password: string;
  status: boolean;
}

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const response = await apiClient.post<User>("/users", payload);
  return response.data;
};
