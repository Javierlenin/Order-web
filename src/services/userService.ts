import type { User } from "../types/user";
import { apiClient } from "./apiClient";

export const getUsers = async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>("/users");
    return response.data;
};
