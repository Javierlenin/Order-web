import axios from "axios";
import type { NewProduct, Product } from "../types/product";
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

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await apiClient.get<Product[]>("/products");
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró cargar los productos. Intente de nuevo más tarde"));
  }
};

export const createProduct = async (product: NewProduct): Promise<Product> => {
  try {
    const response = await apiClient.post<Product>("/products", product);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró registrar el producto"));
  }
};

export const updateProduct = async (id: number, product: NewProduct): Promise<Product> => {
  try {
    const response = await apiClient.put<Product>(`/products/${id}`, product);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró actualizar el producto"));
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/products/${id}`);
  } catch (error) {
    throw new Error(readApiError(error, "No se logró eliminar el producto"));
  }
};
