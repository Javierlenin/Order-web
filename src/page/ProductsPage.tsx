import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";
import { getCategories } from "../services/categoryService";
import { createProduct, getProducts } from "../services/productService";
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

export const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [codeProduct, setCodeProduct] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

  const activeCategories = categories.filter((category) => category.status);
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) =>
    `${product.codeProduct} ${product.name} ${product.categoryName} ${product.description ?? ""}`
      .toLowerCase()
      .includes(normalizedTerm),
  );

  const resetForm = () => {
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

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedCategoryId = Number(categoryId);
    const trimmedCode = codeProduct.trim();
    const trimmedName = name.trim();
    const parsedPrice = parsePrice(price);

    if (!Number.isInteger(selectedCategoryId) || selectedCategoryId <= 0) {
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

    try {
      const createdProduct = await createProduct({
        categoryId: selectedCategoryId,
        codeProduct: trimmedCode,
        name: trimmedName,
        description: description.trim() || null,
        price: parsedPrice,
        status,
      });
      setProducts((currentProducts) => [createdProduct, ...currentProducts]);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se logró registrar el producto");
    } finally {
      setIsSaving(false);
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
        <button type="button" className="users-page-new" onClick={openModal} disabled={isLoading || Boolean(errorMessage)}>
          Nuevo producto
        </button>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por código, nombre o categoría"
        label="Buscar productos"
      />
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleCreateProduct}>
          <h3 className="record-form-title">Nuevo producto</h3>
          <label>
            Categoría
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required autoFocus>
              <option value="">Seleccione</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {activeCategories.length === 0 && (
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
          <p className="user-card-email">El stock inicial es cero. Las existencias se cargan en Ajustes.</p>
          {formError && (
            <p className="users-page-error" role="alert">
              {formError}
            </p>
          )}
          <div className="record-form-actions">
            <button type="button" className="users-page-logout" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="users-page-new" disabled={isSaving || activeCategories.length === 0}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
