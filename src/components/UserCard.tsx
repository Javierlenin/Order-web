import { ADMIN_ROLE, type User } from "../types/user";
import { CardActions } from "./CardActions";
import "./UserCard.css";

interface UserCardProps {
  user: User;
  busy?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UserCard = ({ user, busy = false, onEdit, onDelete }: UserCardProps) => {
  return (
    <article className="user-card">
      <p className="user-card-email">{user.email}</p>
      <h3 className="user-card-name">{user.name}</h3>
      <div className="user-card-footer">
        <div className="user-card-meta">
          <span className="user-card-role">{ADMIN_ROLE}</span>
          <span className="user-card-status">{user.status ? "Activo" : "Inactivo"}</span>
        </div>
        <CardActions
          label={user.name}
          busy={busy}
          onEdit={() => onEdit(user)}
          onDelete={() => onDelete(user)}
        />
      </div>
    </article>
  );
};
