import type { Role } from "../types/role";
import { apiClient } from "./apiClient";

export const getRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get<Role[]>("/roles");
  return response.data;
};
