export const ORDER_STATUSES = [
  "PENDIENTE",
  "CONFIRMADO",
  "EN_PREPARACION",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDIENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export interface OrderDetail {
  id: number;
  productId: number;
  codeProduct: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: number;
  customerId: number;
  customerName: string;
  userId: number;
  userName: string;
  orderDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  details: OrderDetail[];
}

export interface NewOrderDetail {
  productId: number;
  quantity: number;
}

export interface NewOrder {
  customerId: number;
  userId: number;
  notes: string | null;
  details: NewOrderDetail[];
}

export interface OrderCustomer {
  id: number;
  identification: string;
  name: string;
  status: boolean;
}

export interface OrderProduct {
  id: number;
  codeProduct: string;
  name: string;
  price: number;
  stock: number;
  status: boolean;
}
