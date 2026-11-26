import axios from "axios";
import type { NewOrder, Order, OrderCustomer, OrderProduct, OrderStatus } from "../types/order";
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

const request = async <T>(action: () => Promise<{ data: T }>, fallback: string): Promise<T> => {
  try {
    const response = await action();
    return response.data;
  } catch (error) {
    throw new Error(readApiError(error, fallback));
  }
};

export const getOrders = (): Promise<Order[]> =>
  request(() => apiClient.get<Order[]>("/orders"), "No se logró cargar los pedidos. Intente de nuevo más tarde");

export const createOrder = (order: NewOrder): Promise<Order> =>
  request(() => apiClient.post<Order>("/orders", order), "No se logró registrar el pedido");

export const updateOrder = (id: number, order: NewOrder): Promise<Order> =>
  request(() => apiClient.put<Order>(`/orders/${id}`, order), "No se logró actualizar el pedido");

export const changeOrderStatus = (id: number, status: OrderStatus): Promise<Order> =>
  request(
    () => apiClient.patch<Order>(`/orders/${id}/status`, { status }),
    "No se logró cambiar el estado del pedido",
  );

export const deleteOrder = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/orders/${id}`);
  } catch (error) {
    throw new Error(readApiError(error, "No se logró eliminar el pedido"));
  }
};

export const getOrderCustomers = (): Promise<OrderCustomer[]> =>
  request(
    () => apiClient.get<OrderCustomer[]>("/customers"),
    "No se logró cargar los clientes. Intente de nuevo más tarde",
  );

export const getOrderProducts = (): Promise<OrderProduct[]> =>
  request(
    () => apiClient.get<OrderProduct[]>("/products"),
    "No se logró cargar los productos. Intente de nuevo más tarde",
  );
