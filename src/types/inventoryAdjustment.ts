export const ADJUSTMENT_TYPES = ["INGRESO", "SALIDA"] as const;

export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

export interface InventoryAdjustmentDetail {
  id: number;
  productId: number;
  codeProduct: string;
  productName: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
}

export interface InventoryAdjustment {
  id: number;
  userId: number;
  userName: string;
  adjustmentType: AdjustmentType;
  reason: string | null;
  createdAt: string;
  details: InventoryAdjustmentDetail[];
}

export interface NewInventoryAdjustmentDetail {
  productId: number;
  quantity: number;
}

export interface NewInventoryAdjustment {
  userId: number;
  adjustmentType: AdjustmentType;
  reason: string;
  details: NewInventoryAdjustmentDetail[];
}
