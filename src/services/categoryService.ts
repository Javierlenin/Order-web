import axios from "axios";
import type { Category, NewCategory } from "../types/category";
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

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró cargar las categorías. Intente de nuevo más tarde"));
  }
};

export const createCategory = async (category: NewCategory): Promise<Category> => {
  try {
    const response = await apiClient.post<Category>("/categories", category);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró registrar la categoría"));
  }
};
