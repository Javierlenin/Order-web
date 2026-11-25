import type { Role } from "../types/role";
import { apiClient } from "./apiClient";

export const getRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get<Role[]>("/roles");
  return response.data;
};

export interface CreateRolePayload {
  name: string;
  description: string;
  status: boolean;
}

export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  const response = await apiClient.post<Role>("/roles", payload);
  return response.data;
};
