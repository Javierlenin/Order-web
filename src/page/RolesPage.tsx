import { useEffect, useState } from "react";
import "./UsersPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { SearchBar } from "../components/SearchBar";
import type { Role } from "../types/role";
import { getRoles } from "../services/roleService";

export const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRoles(await getRoles());
      } catch {
        setErrorMessage("No se logró cargar los roles. Intente de nuevo más tarde");
      } finally {
        setIsLoading(false);
      }
    };

    loadRoles();
  }, []);

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredRoles = roles.filter((role) =>
    `${role.name} ${role.description ?? ""}`.toLowerCase().includes(normalizedTerm),
  );

  const renderContent = () => {
    if (isLoading) {
      return <p className="users-page-status">Cargando roles....</p>;
    }

    if (errorMessage) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {errorMessage}
        </p>
      );
    }

    if (filteredRoles.length === 0) {
      return <p className="users-page-empty">No se encontraron roles con ese término.</p>;
    }

    return (
      <div className="user-list">
        {filteredRoles.map((role) => (
          <article key={role.id} className="user-card">
            <h3 className="user-card-name">{role.name}</h3>
            <p className="user-card-email">{role.description || "Sin descripción"}</p>
            <div className="user-card-footer">
              <span className="user-card-status">{role.status ? "Activo" : "Inactivo"}</span>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <section className="users-page">
      <div className="users-page-header">
        <div className="users-page-heading">
          <h2 className="users-page-title">Roles</h2>
          {!isLoading && !errorMessage && (
            <p className="users-page-count">
              {filteredRoles.length}
              {filteredRoles.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por nombre"
        label="Buscar roles"
      />
      {renderContent()}
    </section>
  );
};
