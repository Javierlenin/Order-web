export const ADMIN_ROLE = "Admin";

export interface User {
    id: number;
    roleId: number;
    name: string;
    email: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}
