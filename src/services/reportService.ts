import axios from "axios";
import type { ProductStockReport, StockReportQuery } from "../types/report";
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

export const getProductStockReport = async (
  productId: number,
  query: StockReportQuery = {},
): Promise<ProductStockReport> => {
  try {
    const response = await apiClient.get<ProductStockReport>(`/reports/stock/${productId}`, {
      params: {
        from: query.from || undefined,
        to: query.to || undefined,
        type: query.type || undefined,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró cargar el reporte. Intente de nuevo más tarde"));
  }
};
