export const STOCK_MOVEMENT_TYPES = ["INGRESO", "SALIDA", "DEVOLUCION"] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export interface StockReportQuery {
  from?: string;
  to?: string;
  type?: StockMovementType;
}

export interface StockProduct {
  id: number;
  codeProduct: string;
  name: string;
  stock: number;
}

export interface StockMovement {
  id: number;
  origin: "ADJUSTMENT" | "MOVEMENT";
  occurredAt: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  userId: number;
  userName: string;
  description: string;
}

export interface ProductStockReport {
  product: StockProduct;
  movements: StockMovement[];
}
