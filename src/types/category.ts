export interface Category {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewCategory {
  name: string;
  description: string | null;
  status: boolean;
}
