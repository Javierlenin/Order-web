import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import "./UsersPage.css";
import { SearchBar } from "../components/SearchBar";
import { UserList } from "../components/UserList";
import type { User } from "../types/user";
import { clearSession } from "../services/authSession";
import { createUser, deleteUser, getUsers, updateUser } from "../services/userService";
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
  const [actionError, setActionError] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [loadedUsers, loadedRoles] = await Promise.all([getUsers(), getRoles()]);
        setUsers(loadedUsers);
        setRoles(loadedRoles);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se logró cargar los usuarios. Intente de nuevo más tarde",
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
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRoleId("");
    setStatus(true);
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const openCreate = () => {
    resetForm();
    openModal();
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRoleId(String(user.roleId));
    setStatus(user.status);
    setFormError("");
    setActionError("");
    openModal();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      roleId: Number(roleId),
      status,
    };

    try {
      if (editingUser) {
        const updatedUser = await updateUser(editingUser.id, payload);
        setUsers((currentUsers) => currentUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      } else {
        const createdUser = await createUser(payload);
        setUsers((currentUsers) => [createdUser, ...currentUsers]);
      }
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar el usuario.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Eliminar el usuario ${user.name}?`)) {
      return;
    }

    setActionError("");
    setDeletingId(user.id);

    try {
      await deleteUser(user.id);
      setUsers((currentUsers) => currentUsers.filter((current) => current.id !== user.id));
      if (editingUser?.id === user.id) {
        handleClose();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se logró eliminar el usuario");
    } finally {
      setDeletingId(null);
    }
  };

  const visibleRoles = roles.filter((role) => role.status || String(role.id) === roleId);

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
    return (
      <UserList
        users={filteredUsers}
        deletingId={deletingId}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    );
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
          <button type="button" className="users-page-new" onClick={openCreate}>
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
      {actionError && (
        <p className="users-page-error" role="alert">
          {actionError}
        </p>
      )}
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleSubmit}>
          <h3 className="record-form-title">{editingUser ? "Editar usuario" : "Nuevo usuario"}</h3>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
          </label>
          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          {editingUser && <p className="user-card-email">La contraseña se reemplaza al guardar.</p>}
          <label>
            Rol
            <select value={roleId} onChange={(event) => setRoleId(event.target.value)} required>
              <option value="">Seleccione un rol</option>
              {visibleRoles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={status ? "true" : "false"} onChange={(event) => setStatus(event.target.value === "true")}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
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
