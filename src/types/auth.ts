export interface LoginCredentials {
  email: string;
  password: string;
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
