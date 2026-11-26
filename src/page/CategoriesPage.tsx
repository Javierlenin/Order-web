import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { CardActions } from "../components/CardActions";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../services/categoryService";
import type { Category } from "../types/category";

export const CategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
    setEditingCategory(null);
    setName("");
    setDescription("");
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

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setStatus(category.status);
    setFormError("");
    setActionError("");
    openModal();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("El nombre de la categoría es obligatorio");
      return;
    }

    setFormError("");
    setIsSaving(true);

    const payload = {
      name: trimmedName,
      description: description.trim() || null,
      status,
    };

    try {
      if (editingCategory) {
        const updatedCategory = await updateCategory(editingCategory.id, payload);
        setCategories((currentCategories) =>
          currentCategories.map((category) => (category.id === updatedCategory.id ? updatedCategory : category)),
        );
      } else {
        const createdCategory = await createCategory(payload);
        setCategories((currentCategories) => [createdCategory, ...currentCategories]);
      }
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se logró guardar la categoría");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`¿Eliminar la categoría ${category.name}?`)) {
      return;
    }

    setActionError("");
    setDeletingId(category.id);

    try {
      await deleteCategory(category.id);
      setCategories((currentCategories) => currentCategories.filter((current) => current.id !== category.id));
      if (editingCategory?.id === category.id) {
        handleClose();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se logró eliminar la categoría");
    } finally {
      setDeletingId(null);
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
              <CardActions
                label={category.name}
                busy={deletingId === category.id}
                onEdit={() => openEdit(category)}
                onDelete={() => handleDelete(category)}
              />
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
        <button type="button" className="users-page-new" onClick={openCreate}>
          Nueva categoría
        </button>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por nombre"
        label="Buscar categorías"
      />
      {actionError && (
        <p className="users-page-error" role="alert">
          {actionError}
        </p>
      )}
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleSubmit}>
          <h3 className="record-form-title">{editingCategory ? "Editar categoría" : "Nueva categoría"}</h3>
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
