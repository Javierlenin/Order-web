import type { User } from "../types/user";
import { UserCard } from "./UserCard";
import "./UserList.css";

interface UserListProps {
  users: User[];
  deletingId: number | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UserList = ({ users, deletingId, onEdit, onDelete }: UserListProps) => {
  return (
    <div className="user-list">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          busy={deletingId === user.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
