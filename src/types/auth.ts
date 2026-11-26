export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterAccount {
  name: string;
  email: string;
  password: string;
  status: boolean;
}

export interface AuthUser {
  id: number;
  roleId: number;
  roleName: string;
  name: string;
  email: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
