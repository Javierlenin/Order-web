import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import "./UsersPage.css";
import { SearchBar } from "../components/SearchBar";
import { UserList } from "../components/UserList";
import type { User } from "../types/user";
import { clearSession } from "../services/authSession";
import { createUser, getUsers } from "../services/userService";
import { getRoles } from "../services/roleService";
import type { Role } from "../types/role";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";

export const UsersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [loadedUsers, loadedRoles] = await Promise.all([getUsers(), getRoles()]);
        setUsers(loadedUsers);
        setRoles(loadedRoles);
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

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRoleId("");
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      const createdUser = await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        roleId: Number(roleId),
        status: true,
      });
      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el usuario.");
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="users-page-actions">
          <button type="button" className="users-page-new" onClick={openModal}>
            Nuevo usuario
          </button>
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
      </div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleCreateUser}>
          <h3 className="record-form-title">Nuevo usuario</h3>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          <label>
            Rol
            <select value={roleId} onChange={(event) => setRoleId(event.target.value)} required>
              <option value="">Seleccione un rol</option>
              {roles.filter((role) => role.status).map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </label>
          {formError && <p className="users-page-error" role="alert">{formError}</p>}
          <div className="record-form-actions">
            <button type="button" className="users-page-logout" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="users-page-new" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
