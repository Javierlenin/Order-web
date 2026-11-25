import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { SearchBar } from "../components/SearchBar";
import type { Role } from "../types/role";
import { createRole, getRoles } from "../services/roleService";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";

export const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

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

  const resetForm = () => {
    setName("");
    setDescription("");
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      const createdRole = await createRole({
        name: name.trim(),
        description: description.trim(),
        status: true,
      });
      setRoles((currentRoles) => [createdRole, ...currentRoles]);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el rol.");
    } finally {
      setIsSaving(false);
    }
  };

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
        <button type="button" className="users-page-new" onClick={openModal}>
          Nuevo rol
        </button>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por nombre"
        label="Buscar roles"
      />
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleCreateRole}>
          <h3 className="record-form-title">Nuevo rol</h3>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Descripción
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
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
