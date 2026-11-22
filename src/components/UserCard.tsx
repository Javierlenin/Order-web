import { ADMIN_ROLE, type User } from "../types/user";
import "./UserCard.css";

interface UserCardProps {
    user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  return (
    <article className="user-card">
        <p className="user-card-email">{user.email}</p>
        <h3 className="user-card-name">{user.name}</h3>
        <div className="user-card-footer">
            <span className="user-card-role">{ADMIN_ROLE}</span>
            <span className="user-card-status">{user.status ? "Activo" : "Inactivo"}</span>
        </div>
    </article>
  );
};
