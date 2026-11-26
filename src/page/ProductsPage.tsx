import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { CardActions } from "../components/CardActions";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";
import { getCategories } from "../services/categoryService";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../services/productService";
import type { Category } from "../types/category";
import type { Product } from "../types/product";

const money = (value: number): string =>
  value.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parsePrice = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const price = Number(normalized);
  if (price <= 0 || price > 9999999999.99) {
    return null;
  }

  return price;
};

const formatPrice = (value: number): string => value.toFixed(2);

export const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [codeProduct, setCodeProduct] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [loadedProducts, loadedCategories] = await Promise.all([getProducts(), getCategories()]);
        setProducts(loadedProducts);
        setCategories(loadedCategories);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se logró cargar los productos. Intente de nuevo más tarde",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const selectedCategoryId = Number(categoryId);
  const categoryOptions = categories.filter((category) => category.status || category.id === selectedCategoryId);
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) =>
    `${product.codeProduct} ${product.name} ${product.categoryName} ${product.description ?? ""}`
      .toLowerCase()
      .includes(normalizedTerm),
  );

  const resetForm = () => {
    setEditingProduct(null);
    setCategoryId("");
    setCodeProduct("");
    setName("");
    setDescription("");
    setPrice("");
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

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setCategoryId(String(product.categoryId));
    setCodeProduct(product.codeProduct);
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(formatPrice(product.price));
    setStatus(product.status);
    setFormError("");
    setActionError("");
    openModal();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedCategoryId = Number(categoryId);
    const trimmedCode = codeProduct.trim();
    const trimmedName = name.trim();
    const parsedPrice = parsePrice(price);

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      setFormError("La categoría del producto no es válida");
      return;
    }

    if (!trimmedCode) {
      setFormError("El código del producto es obligatorio");
      return;
    }

    if (!trimmedName) {
      setFormError("El nombre del producto es obligatorio");
      return;
    }

    if (parsedPrice === null) {
      setFormError("El precio debe ser mayor que cero y tener como máximo dos decimales");
      return;
    }

    setFormError("");
    setIsSaving(true);

    const payload = {
      categoryId: parsedCategoryId,
      codeProduct: trimmedCode,
      name: trimmedName,
      description: description.trim() || null,
      price: parsedPrice,
      status,
    };

    try {
      if (editingProduct) {
        const updatedProduct = await updateProduct(editingProduct.id, payload);
        setProducts((currentProducts) =>
          currentProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
        );
      } else {
        const createdProduct = await createProduct(payload);
        setProducts((currentProducts) => [createdProduct, ...currentProducts]);
      }
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se logró guardar el producto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar el producto ${product.name}?`)) {
      return;
    }

    setActionError("");
    setDeletingId(product.id);

    try {
      await deleteProduct(product.id);
      setProducts((currentProducts) => currentProducts.filter((current) => current.id !== product.id));
      if (editingProduct?.id === product.id) {
        handleClose();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se logró eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="users-page-status">Cargando productos....</p>;
    }

    if (errorMessage) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {errorMessage}
        </p>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <p className="users-page-empty">
          {normalizedTerm ? "No se encontraron productos con ese término." : "No hay productos registrados."}
        </p>
      );
    }

    return (
      <div className="user-list">
        {filteredProducts.map((product) => (
          <article key={product.id} className="user-card">
            <h3 className="user-card-name">{product.name}</h3>
            <p className="user-card-email">
              {product.codeProduct} · {product.categoryName}
            </p>
            <p className="user-card-email">{product.description || "Sin descripción"}</p>
            <p className="user-card-email">
              Precio {money(product.price)} · Stock {product.stock}
            </p>
            <div className="user-card-footer">
              <span className="user-card-status">{product.status ? "Activo" : "Inactivo"}</span>
              <CardActions
                label={product.name}
                busy={deletingId === product.id}
                onEdit={() => openEdit(product)}
                onDelete={() => handleDelete(product)}
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
          <h2 className="users-page-title">Productos</h2>
          {!isLoading && !errorMessage && (
            <p className="users-page-count">
              {filteredProducts.length}
              {filteredProducts.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
        <button type="button" className="users-page-new" onClick={openCreate} disabled={isLoading || Boolean(errorMessage)}>
          Nuevo producto
        </button>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por código, nombre o categoría"
        label="Buscar productos"
      />
      {actionError && (
        <p className="users-page-error" role="alert">
          {actionError}
        </p>
      )}
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleSubmit}>
          <h3 className="record-form-title">{editingProduct ? "Editar producto" : "Nuevo producto"}</h3>
          <label>
            Categoría
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required autoFocus>
              <option value="">Seleccione</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {categoryOptions.length === 0 && (
            <p className="users-page-empty">Registre una categoría activa antes de crear el producto.</p>
          )}
          <label>
            Código
            <input
              value={codeProduct}
              onChange={(event) => setCodeProduct(event.target.value)}
              maxLength={50}
              required
            />
          </label>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={150} required />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
            />
          </label>
          <label>
            Precio
            <input
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <label>
            Estado
            <select value={status ? "true" : "false"} onChange={(event) => setStatus(event.target.value === "true")}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
          {!editingProduct && (
            <p className="user-card-email">El stock inicial es cero. Las existencias se cargan en Ajustes.</p>
          )}
          {formError && (
            <p className="users-page-error" role="alert">
              {formError}
            </p>
          )}
          <div className="record-form-actions">
            <button type="button" className="users-page-logout" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="users-page-new" disabled={isSaving || categoryOptions.length === 0}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
