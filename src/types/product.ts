export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  codeProduct: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}
