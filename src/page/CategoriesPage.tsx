import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";
import { createCategory, getCategories } from "../services/categoryService";
import type { Category } from "../types/category";

export const CategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategories(await getCategories());
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se logró cargar las categorías. Intente de nuevo más tarde",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.description ?? ""}`.toLowerCase().includes(normalizedTerm),
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus(true);
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("El nombre de la categoría es obligatorio");
      return;
    }

    setFormError("");
    setIsSaving(true);

    try {
      const createdCategory = await createCategory({
        name: trimmedName,
        description: description.trim() || null,
        status,
      });
      setCategories((currentCategories) => [createdCategory, ...currentCategories]);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se logró registrar la categoría");
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="users-page-status">Cargando categorías....</p>;
    }

    if (errorMessage) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {errorMessage}
        </p>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <p className="users-page-empty">
          {normalizedTerm ? "No se encontraron categorías con ese término." : "No hay categorías registradas."}
        </p>
      );
    }

    return (
      <div className="user-list">
        {filteredCategories.map((category) => (
          <article key={category.id} className="user-card">
            <h3 className="user-card-name">{category.name}</h3>
            <p className="user-card-email">{category.description || "Sin descripción"}</p>
            <div className="user-card-footer">
              <span className="user-card-status">{category.status ? "Activo" : "Inactivo"}</span>
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
          <h2 className="users-page-title">Categorías</h2>
          {!isLoading && !errorMessage && (
            <p className="users-page-count">
              {filteredCategories.length}
              {filteredCategories.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
        <button type="button" className="users-page-new" onClick={openModal}>
          Nueva categoría
        </button>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por nombre"
        label="Buscar categorías"
      />
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleCreateCategory}>
          <h3 className="record-form-title">Nueva categoría</h3>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required autoFocus />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={250}
              rows={3}
            />
          </label>
          <label>
            Estado
            <select value={status ? "true" : "false"} onChange={(event) => setStatus(event.target.value === "true")}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
          {formError && (
            <p className="users-page-error" role="alert">
              {formError}
            </p>
          )}
          <div className="record-form-actions">
            <button type="button" className="users-page-logout" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="users-page-new" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
