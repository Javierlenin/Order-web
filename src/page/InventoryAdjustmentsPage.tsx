import axios from "axios";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import "./UsersPage.css";
import "./OrdersPage.css";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/ui/modal";
import { clearSession, getSession } from "../services/authSession";
import {
  createInventoryAdjustment,
  deleteInventoryAdjustment,
  getInventoryAdjustments,
} from "../services/inventoryAdjustmentService";
import { getProducts } from "../services/productService";
import { getUsers } from "../services/userService";
import {
  ADJUSTMENT_TYPES,
  type AdjustmentType,
  type InventoryAdjustment,
  type NewInventoryAdjustment,
} from "../types/inventoryAdjustment";
import type { Product } from "../types/product";
import type { User } from "../types/user";

const TYPE_LABEL: Record<AdjustmentType, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" });
};

const parseQuantity = (value: string): number | null => {
  if (!/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const quantity = Number(value);
  return Number.isSafeInteger(quantity) ? quantity : null;
};

const isUnauthorized = (error: unknown): boolean => error instanceof Error && error.message === "No autorizado";

interface DraftLine {
  key: number;
  productId: string;
  quantity: string;
}

interface AdjustmentForm {
  adjustmentType: AdjustmentType;
  userId: string;
  reason: string;
  lines: DraftLine[];
}

const buildAdjustment = (form: AdjustmentForm): NewInventoryAdjustment | string => {
  const userId = Number(form.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return "Seleccione el usuario responsable";
  }

  const reason = form.reason.trim();
  if (!reason) {
    return "El motivo del ajuste es obligatorio";
  }

  if (reason.length > 500) {
    return "El motivo del ajuste no puede superar 500 caracteres";
  }

  if (form.lines.length === 0) {
    return "Debe registrar al menos un producto";
  }

  const productIds = new Set<number>();
  const details: NewInventoryAdjustment["details"] = [];

  for (const line of form.lines) {
    const productId = Number(line.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return "Seleccione el producto de cada línea";
    }

    const quantity = parseQuantity(line.quantity);
    if (quantity === null) {
      return "La cantidad del producto debe ser un entero mayor que cero";
    }

    if (productIds.has(productId)) {
      return "El producto no puede repetirse en el ajuste";
    }

    productIds.add(productId);
    details.push({ productId, quantity });
  }

  return {
    userId,
    adjustmentType: form.adjustmentType,
    reason,
    details,
  };
};

export const InventoryAdjustmentsPage = () => {
  const navigate = useNavigate();
  const nextKey = useRef(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<AdjustmentForm | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewing, setViewing] = useState<InventoryAdjustment | null>(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const createLine = (productId = "", quantity = "1"): DraftLine => ({
    key: nextKey.current++,
    productId,
    quantity,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [nextAdjustments, nextUsers, nextProducts] = await Promise.all([
          getInventoryAdjustments(),
          getUsers().catch((error: unknown) => {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
              throw new Error("No autorizado");
            }

            throw new Error("No se logró cargar los usuarios. Intente de nuevo más tarde");
          }),
          getProducts(),
        ]);
        setAdjustments(nextAdjustments);
        setUsers(nextUsers);
        setProducts(nextProducts);
      } catch (error) {
        if (isUnauthorized(error)) {
          clearSession();
          navigate("/signin", { replace: true });
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "No se logró cargar los ajustes. Intente de nuevo más tarde",
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [navigate]);

  const activeUsers = users.filter((user) => user.status);
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredAdjustments = adjustments.filter((adjustment) => {
    const productText = adjustment.details.map((detail) => `${detail.codeProduct} ${detail.productName}`).join(" ");
    return `${adjustment.reason ?? ""} ${adjustment.userName} ${TYPE_LABEL[adjustment.adjustmentType]} ${productText}`
      .toLowerCase()
      .includes(normalizedTerm);
  });

  const openCreate = async () => {
    setFormError("");
    const sessionUserId = getSession()?.user.id;

    try {
      setProducts(await getProducts());
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession();
        navigate("/signin", { replace: true });
        return;
      }

      setFormError(
        error instanceof Error ? error.message : "No se logró cargar los productos. Intente de nuevo más tarde",
      );
    }

    setForm({
      adjustmentType: "INGRESO",
      userId: activeUsers.some((user) => user.id === sessionUserId) ? String(sessionUserId) : "",
      reason: "",
      lines: [createLine()],
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) {
      return;
    }

    const payload = buildAdjustment(form);
    if (typeof payload === "string") {
      setFormError(payload);
      return;
    }

    if (payload.adjustmentType === "SALIDA") {
      const shortage = payload.details.find((detail) => {
        const product = products.find((item) => item.id === detail.productId);
        return product !== undefined && detail.quantity > product.stock;
      });

      if (shortage) {
        const product = products.find((item) => item.id === shortage.productId);
        setFormError(
          product
            ? `El ajuste dejaría el stock en negativo. Disponible de ${product.codeProduct}: ${product.stock}`
            : "El ajuste dejaría el stock en negativo",
        );
        return;
      }
    }

    setFormError("");
    setActionError("");
    setIsSaving(true);

    try {
      await createInventoryAdjustment(payload);
      const [nextAdjustments, nextProducts] = await Promise.all([getInventoryAdjustments(), getProducts()]);
      setAdjustments(nextAdjustments);
      setProducts(nextProducts);
      setForm(null);
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession();
        navigate("/signin", { replace: true });
        return;
      }

      setFormError(error instanceof Error ? error.message : "No se logró registrar el ajuste. Intente de nuevo más tarde");
    } finally {
      setIsSaving(false);
    }
  };

  const removeAdjustment = async (adjustment: InventoryAdjustment) => {
    if (!window.confirm(`¿Eliminar el ajuste ${adjustment.id}? Se revertirá su efecto sobre el stock.`)) {
      return;
    }

    setActionError("");
    setDeletingId(adjustment.id);

    try {
      await deleteInventoryAdjustment(adjustment.id);
      const [nextAdjustments, nextProducts] = await Promise.all([getInventoryAdjustments(), getProducts()]);
      setAdjustments(nextAdjustments);
      setProducts(nextProducts);
      if (viewing?.id === adjustment.id) {
        setViewing(null);
      }
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession();
        navigate("/signin", { replace: true });
        return;
      }

      const message = error instanceof Error ? error.message : "No se logró eliminar el ajuste. Intente de nuevo más tarde";
      setActionError(`Ajuste ${adjustment.id}: ${message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const renderAdjustments = () => {
    if (isLoading) {
      return <p className="users-page-status">Cargando ajustes....</p>;
    }

    if (errorMessage) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {errorMessage}
        </p>
      );
    }

    if (filteredAdjustments.length === 0) {
      return (
        <p className="users-page-empty">
          {normalizedTerm ? "No se encontraron ajustes con ese término." : "No hay ajustes registrados."}
        </p>
      );
    }

    return (
      <div className="orders-scroll">
        <table className="orders-list">
          <thead>
            <tr>
              <th>Ajuste</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Responsable</th>
              <th>Motivo</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdjustments.map((adjustment) => (
              <tr key={adjustment.id}>
                <td>{adjustment.id}</td>
                <td>{formatDate(adjustment.createdAt)}</td>
                <td>{TYPE_LABEL[adjustment.adjustmentType]}</td>
                <td>{adjustment.userName}</td>
                <td className="orders-reason">{adjustment.reason || "—"}</td>
                <td>
                  <div className="orders-options">
                    <button type="button" className="orders-secondary" onClick={() => setViewing(adjustment)}>
                      Ver
                    </button>
                    <button
                      type="button"
                      className="orders-danger"
                      onClick={() => removeAdjustment(adjustment)}
                      disabled={deletingId === adjustment.id}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="users-page">
      <div className="users-page-header">
        <div className="users-page-heading">
          <h2 className="users-page-title">Ajustes de inventario</h2>
          {!isLoading && !errorMessage && (
            <p className="users-page-count">
              {filteredAdjustments.length}
              {filteredAdjustments.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
        <button
          type="button"
          className="orders-primary"
          onClick={openCreate}
          disabled={isLoading || Boolean(errorMessage) || form !== null}
        >
          Nuevo ajuste
        </button>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por motivo, responsable o producto"
        label="Buscar ajustes"
      />

      {form && (
        <form className="orders-form" onSubmit={handleSubmit}>
          <h3>Nuevo ajuste</h3>
          <div className="orders-grid">
            <label className="orders-field">
              Tipo de ajuste
              <select
                value={form.adjustmentType}
                onChange={(event) => setForm({ ...form, adjustmentType: event.target.value as AdjustmentType })}
                required
              >
                {ADJUSTMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="orders-field">
              Usuario responsable
              <select
                value={form.userId}
                onChange={(event) => setForm({ ...form, userId: event.target.value })}
                required
              >
                <option value="">Seleccione</option>
                {users
                  .filter((user) => user.status || String(user.id) === form.userId)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                      {user.status ? "" : " (inactivo)"}
                    </option>
                  ))}
              </select>
            </label>
            <label className="orders-field">
              Fecha y hora
              <input readOnly value="Se asigna al guardar" />
            </label>
            <label className="orders-field orders-field-wide">
              Motivo
              <textarea
                maxLength={500}
                rows={3}
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                required
              />
            </label>
          </div>

          <div className="orders-scroll">
            <table className="orders-lines">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line) => {
                  const product = products.find((item) => item.id === Number(line.productId));
                  const quantity = parseQuantity(line.quantity);
                  const shortage =
                    form.adjustmentType === "SALIDA" && product !== undefined && quantity !== null && quantity > product.stock;
                  const taken = new Set(
                    form.lines.filter((item) => item.key !== line.key && item.productId).map((item) => item.productId),
                  );

                  return (
                    <tr key={line.key}>
                      <td>
                        <select
                          aria-label="Producto"
                          value={line.productId}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              lines: form.lines.map((item) =>
                                item.key === line.key ? { ...item, productId: event.target.value } : item,
                              ),
                            })
                          }
                          required
                        >
                          <option value="">Seleccione</option>
                          {products.map((item) => (
                            <option key={item.id} value={item.id} disabled={taken.has(String(item.id))}>
                              {item.codeProduct} · {item.name}
                              {item.status ? "" : " (inactivo)"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label="Cantidad"
                          inputMode="numeric"
                          value={line.quantity}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              lines: form.lines.map((item) =>
                                item.key === line.key ? { ...item, quantity: event.target.value } : item,
                              ),
                            })
                          }
                          required
                        />
                      </td>
                      <td className={shortage ? "orders-shortage" : undefined}>{product ? product.stock : "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="orders-ghost"
                          onClick={() => setForm({ ...form, lines: form.lines.filter((item) => item.key !== line.key) })}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="orders-actions">
            <button
              type="button"
              className="orders-secondary"
              onClick={() => setForm({ ...form, lines: [...form.lines, createLine()] })}
              disabled={products.length === 0 || form.lines.length >= products.length}
            >
              Agregar producto
            </button>
          </div>
          <p className="orders-notes">
            Un ingreso suma la cantidad al stock y una salida la resta. El servidor rechaza el ajuste si el stock quedaría en negativo.
          </p>
          {formError && (
            <p className="users-page-status users-page-error" role="alert">
              {formError}
            </p>
          )}
          <div className="orders-actions">
            <button type="submit" className="orders-primary" disabled={isSaving || products.length === 0}>
              {isSaving ? "Guardando..." : "Guardar ajuste"}
            </button>
            <button type="button" className="orders-secondary" onClick={() => setForm(null)} disabled={isSaving}>
              Cerrar
            </button>
          </div>
        </form>
      )}

      {actionError && (
        <p className="users-page-status users-page-error" role="alert">
          {actionError}
        </p>
      )}

      {renderAdjustments()}

      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} className="adjustment-view-modal">
        {viewing && (
          <div className="adjustment-view">
            <h3>Ajuste {viewing.id}</h3>
            <div className="adjustment-view-meta">
              <span>Fecha {formatDate(viewing.createdAt)}</span>
              <span>Tipo {TYPE_LABEL[viewing.adjustmentType]}</span>
              <span>Responsable {viewing.userName}</span>
              <span>Motivo {viewing.reason || "Sin motivo"}</span>
            </div>
            <div className="orders-scroll">
              <table className="orders-lines">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Stock anterior</th>
                    <th>Stock resultante</th>
                  </tr>
                </thead>
                <tbody>
                  {viewing.details.map((detail) => (
                    <tr key={detail.id}>
                      <td>
                        {detail.codeProduct} · {detail.productName}
                      </td>
                      <td>{detail.quantity}</td>
                      <td>{detail.stockBefore}</td>
                      <td>{detail.stockAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};
