import type { User } from "../types/user";
import { UserCard } from "./UserCard";
import "./UserList.css";

interface UserListProps {
    users: User[];
}

export const UserList = ({ users }: UserListProps) => {
  return (
    <div className="user-list">
        {users.map((user) => (
            <UserCard key={user.id} user={user} />
        ))}
    </div>
  )
}
