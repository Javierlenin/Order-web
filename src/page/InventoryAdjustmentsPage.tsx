import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "./ReportsPage.css";
import "./InventoryAdjustmentsPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { SearchBar } from "../components/SearchBar";
import { getSession } from "../services/authSession";
import { createInventoryAdjustment, getInventoryAdjustments } from "../services/inventoryAdjustmentService";
import { getProducts } from "../services/productService";
import { getUsers } from "../services/userService";
import {
  ADJUSTMENT_TYPES,
  type AdjustmentType,
  type InventoryAdjustment,
} from "../types/inventoryAdjustment";
import type { Product } from "../types/product";
import type { User } from "../types/user";

const TYPE_LABEL: Record<AdjustmentType, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
};

interface DraftLine {
  key: number;
  productId: string;
  quantity: string;
}

const formatDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("es");
};

const emptyLine = (key: number): DraftLine => ({ key, productId: "", quantity: "" });

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

export const InventoryAdjustmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("INGRESO");
  const [userId, setUserId] = useState(() => {
    const sessionUserId = getSession()?.user.id;
    return sessionUserId ? String(sessionUserId) : "";
  });
  const [reason, setReason] = useState("");
  const [registeredAtLabel, setRegisteredAtLabel] = useState(() => formatDateTime(new Date()));
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(1)]);
  const [nextKey, setNextKey] = useState(2);

  const loadAdjustments = async () => {
    setAdjustments(await getInventoryAdjustments());
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadAdjustments();
        setListError("");
      } catch (error) {
        setListError(error instanceof Error ? error.message : "No se logró cargar los ajustes. Intente de nuevo más tarde");
      } finally {
        setIsListLoading(false);
      }

      try {
        const [userList, productList] = await Promise.all([getUsers(), getProducts()]);
        setUsers(userList);
        setProducts(productList);
        setCatalogError("");
      } catch (error) {
        setCatalogError(
          error instanceof Error ? error.message : "No se logró cargar usuarios y productos. Intente de nuevo más tarde",
        );
      } finally {
        setIsCatalogLoading(false);
      }
    };

    load();
  }, []);

  const productsById = new Map(products.map((product) => [String(product.id), product]));
  const selectedProductIds = new Set(lines.map((line) => line.productId).filter(Boolean));

  const lineExceedsStock = (line: DraftLine): boolean => {
    if (adjustmentType !== "SALIDA") {
      return false;
    }

    const product = productsById.get(line.productId);
    const quantity = Number(line.quantity);
    return product !== undefined && isPositiveInteger(quantity) && quantity > product.stock;
  };

  const hasStockError = lines.some(lineExceedsStock);

  const updateLine = (key: number, patch: Partial<DraftLine>) => {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    setLines((current) => [...current, emptyLine(nextKey)]);
    setNextKey((current) => current + 1);
  };

  const removeLine = (key: number) => {
    setLines((current) => current.filter((line) => line.key !== key));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (hasStockError) {
      setFormError("El ajuste dejaría el stock en negativo");
      return;
    }

    const details = lines.map((line) => ({
      productId: Number(line.productId),
      quantity: Number(line.quantity),
    }));

    if (details.some((detail) => !isPositiveInteger(detail.productId) || !isPositiveInteger(detail.quantity))) {
      setFormError("Seleccione un producto y una cantidad entera mayor que cero en cada línea");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createInventoryAdjustment({
        userId: Number(userId),
        adjustmentType,
        reason: reason.trim(),
        details,
      });
      setSuccessMessage(`Ajuste registrado el ${formatDateTime(created.createdAt)}.`);
      setReason("");
      setLines([emptyLine(nextKey)]);
      setNextKey((current) => current + 1);
      setRegisteredAtLabel(formatDateTime(new Date()));
      setAdjustments((current) => [created, ...current.filter((adjustment) => adjustment.id !== created.id)]);
      try {
        setProducts(await getProducts());
      } catch (error) {
        setFormError(
          error instanceof Error
            ? `El ajuste se registró, pero no se actualizó el stock en pantalla. ${error.message}`
            : "El ajuste se registró, pero no se actualizó el stock en pantalla.",
        );
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se logró registrar el ajuste. Intente de nuevo más tarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredAdjustments = adjustments.filter((adjustment) => {
    const productText = adjustment.details.map((detail) => `${detail.codeProduct} ${detail.productName}`).join(" ");
    return `${adjustment.reason ?? ""} ${adjustment.userName} ${TYPE_LABEL[adjustment.adjustmentType]} ${productText}`
      .toLowerCase()
      .includes(normalizedTerm);
  });

  const renderAdjustments = () => {
    if (isListLoading) {
      return <p className="users-page-status">Cargando ajustes....</p>;
    }

    if (listError) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {listError}
        </p>
      );
    }

    if (filteredAdjustments.length === 0) {
      return (
        <p className="users-page-empty">
          {adjustments.length === 0 ? "No hay ajustes de inventario." : "No se encontraron ajustes con ese término."}
        </p>
      );
    }

    return (
      <div className="user-list">
        {filteredAdjustments.map((adjustment) => (
          <article key={adjustment.id} className="user-card">
            <p className="user-card-email">{formatDateTime(adjustment.createdAt)}</p>
            <h3 className="user-card-name">{TYPE_LABEL[adjustment.adjustmentType]}</h3>
            <p className="user-card-email">{adjustment.reason || "Sin motivo"}</p>
            <ul className="adjustment-detail-list">
              {adjustment.details.map((detail) => (
                <li key={detail.id}>
                  {detail.codeProduct} · {detail.productName}: {detail.quantity} ({detail.stockBefore} → {detail.stockAfter})
                </li>
              ))}
            </ul>
            <div className="user-card-footer">
              <span className="user-card-role">{adjustment.userName}</span>
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
          <h2 className="users-page-title">Ajustes de inventario</h2>
          {!isListLoading && !listError && (
            <p className="users-page-count">
              {filteredAdjustments.length}
              {filteredAdjustments.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
      </div>

      {isCatalogLoading ? (
        <p className="users-page-status">Cargando productos....</p>
      ) : catalogError ? (
        <p className="users-page-status users-page-error" role="alert">
          {catalogError}
        </p>
      ) : (
        <form className="adjustment-form" onSubmit={handleSubmit}>
          <div className="reports-filters">
            <label className="reports-field">
              Tipo de ajuste
              <select
                name="adjustmentType"
                value={adjustmentType}
                onChange={(event) => setAdjustmentType(event.target.value as AdjustmentType)}
                required
              >
                {ADJUSTMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="reports-field">
              Usuario responsable
              <select name="userId" value={userId} onChange={(event) => setUserId(event.target.value)} required>
                <option value="">Seleccione</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                    {user.status ? "" : " (inactivo)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="reports-field">
              Fecha y hora
              <input type="text" name="registeredAt" value={registeredAtLabel} readOnly aria-readonly="true" />
            </label>
            <label className="reports-field">
              Motivo
              <input
                type="text"
                name="reason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="adjustment-lines">
            {lines.map((line) => {
              const product = productsById.get(line.productId);
              const exceedsStock = lineExceedsStock(line);
              const options = products.filter(
                (item) => String(item.id) === line.productId || !selectedProductIds.has(String(item.id)),
              );

              return (
                <div key={line.key} className="adjustment-line">
                  <label className="reports-field">
                    Producto
                    <select
                      name={`product-${line.key}`}
                      value={line.productId}
                      onChange={(event) => updateLine(line.key, { productId: event.target.value })}
                      required
                    >
                      <option value="">Seleccione</option>
                      {options.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.codeProduct} · {item.name}
                          {item.status ? "" : " (inactivo)"}
                        </option>
                      ))}
                    </select>
                    {product && (
                      <span className={exceedsStock ? "adjustment-stock adjustment-stock-error" : "adjustment-stock"}>
                        {exceedsStock ? `Stock insuficiente. Disponible: ${product.stock}` : `Stock actual: ${product.stock}`}
                      </span>
                    )}
                  </label>
                  <label className="reports-field">
                    Cantidad
                    <input
                      type="number"
                      name={`quantity-${line.key}`}
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                      required
                    />
                  </label>
                  {lines.length > 1 ? (
                    <button type="button" className="adjustment-remove" onClick={() => removeLine(line.key)}>
                      Quitar
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>

          {formError && (
            <p className="users-page-status users-page-error" role="alert">
              {formError}
            </p>
          )}
          {successMessage && <p className="users-page-status">{successMessage}</p>}

          <div className="adjustment-actions">
            <button
              type="button"
              className="adjustment-secondary"
              onClick={addLine}
              disabled={products.length === 0 || lines.length >= products.length}
            >
              Agregar producto
            </button>
            <button className="reports-submit" type="submit" disabled={isSubmitting || hasStockError || products.length === 0}>
              {isSubmitting ? "Registrando..." : "Registrar ajuste"}
            </button>
          </div>
        </form>
      )}

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por motivo, usuario o producto"
        label="Buscar ajustes"
      />
      {renderAdjustments()}
    </section>
  );
};
