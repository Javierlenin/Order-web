import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./UsersPage.css";
import { SearchBar } from "../components/SearchBar";
import { UserList } from "../components/UserList";
import type { User } from "../types/user";
import { clearSession } from "../services/authSession";
import { getUsers } from "../services/userService";

export const UsersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsers(await getUsers());
      } catch {
        setErrorMessage(
          "No se logró cargar los usuarios. Intente de nuevo más tarde",
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email}`
      .toLowerCase()
      .includes(normalizedTerm),
  );

  const renderContent = () => {
    if (isLoading) {
        return <p className="users-page-status">Cargando usuarios....</p>
    }
    if (errorMessage) {
        return (
            <p className="users-page-status users-page-error" role="alert">
                {errorMessage}
            </p>
        );
    }
    if (filteredUsers.length === 0) {
        return <p className="users-page-empty">No se encontraron usuarios con ese término.</p>
    }
    return <UserList users={filteredUsers} />
  };

  return (
    <section className="users-page">
      <div className="users-page-header">
        <div className="users-page-heading">
          <h2 className="users-page-title">Usuarios</h2>
          {!isLoading && !errorMessage && (
            <p className="users-page-count">
              {filteredUsers.length}
              {filteredUsers.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
        <button
          type="button"
          className="users-page-logout"
          onClick={() => {
            clearSession();
            navigate("/signin", { replace: true });
          }}
        >
          Cerrar sesión
        </button>
      </div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
        {renderContent()}
    </section>
  );
};
