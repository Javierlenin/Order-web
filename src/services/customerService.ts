import axios from "axios";
import type { Customer, NewCustomer } from "../types/customer";
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

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await apiClient.get<Customer[]>("/customers");
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró cargar los clientes. Intente de nuevo más tarde"));
  }
};

export const createCustomer = async (customer: NewCustomer): Promise<Customer> => {
  try {
    const response = await apiClient.post<Customer>("/customers", customer);
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, "No se logró registrar el cliente"));
  }
};
