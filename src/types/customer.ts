export interface Customer {
  id: number;
  identification: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewCustomer {
  identification: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: boolean;
}
