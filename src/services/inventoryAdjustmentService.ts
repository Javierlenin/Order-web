import axios from "axios";
import type { InventoryAdjustment, NewInventoryAdjustment } from "../types/inventoryAdjustment";
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

export const getInventoryAdjustments = async (): Promise<InventoryAdjustment[]> => {
  try {
    const response = await apiClient.get<InventoryAdjustment[]>("/inventory-adjustments");
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró cargar los ajustes. Intente de nuevo más tarde"));
  }
};

export const createInventoryAdjustment = async (
  adjustment: NewInventoryAdjustment,
): Promise<InventoryAdjustment> => {
  try {
    const response = await apiClient.post<InventoryAdjustment>("/inventory-adjustments", adjustment);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró registrar el ajuste. Intente de nuevo más tarde"));
  }
};
