import axios from "axios";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import "./UsersPage.css";
import "./OrdersPage.css";
import { SearchBar } from "../components/SearchBar";
import { clearSession, getSession } from "../services/authSession";
import {
  changeOrderStatus,
  createOrder,
  deleteOrder,
  getOrderCustomers,
  getOrderProducts,
  getOrders,
  updateOrder,
} from "../services/orderService";
import { getUsers } from "../services/userService";
import {
  ORDER_TRANSITIONS,
  type NewOrder,
  type Order,
  type OrderCustomer,
  type OrderProduct,
  type OrderStatus,
} from "../types/order";
import type { User } from "../types/user";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const ACTION_LABEL: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmar",
  EN_PREPARACION: "Pasar a preparación",
  ENVIADO: "Marcar enviado",
  ENTREGADO: "Marcar entregado",
  CANCELADO: "Cancelar",
};

const money = (value: number): string =>
  value.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" });
};

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const parseQuantity = (value: string): number | null => {
  if (!/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const quantity = Number(value);
  return Number.isSafeInteger(quantity) ? quantity : null;
};

const returnsStock = (status: OrderStatus): boolean =>
  status === "CONFIRMADO" || status === "EN_PREPARACION" || status === "ENVIADO";

const isUnauthorized = (error: unknown): boolean => error instanceof Error && error.message === "No autorizado";

interface DraftLine {
  key: number;
  productId: string;
  quantity: string;
}

interface OrderForm {
  orderId: number | null;
  orderNumber: number | null;
  orderDate: string | null;
  customerId: string;
  userId: string;
  notes: string;
  lines: DraftLine[];
}

const buildOrder = (form: OrderForm, products: OrderProduct[]): NewOrder | string => {
  const customerId = Number(form.customerId);
  const userId = Number(form.userId);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return "Seleccione un cliente";
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return "Seleccione el usuario responsable";
  }

  const notes = form.notes.trim();
  if (notes.length > 500) {
    return "Las notas del pedido no pueden superar 500 caracteres";
  }

  if (form.lines.length === 0) {
    return "Debe registrar al menos un producto";
  }

  const productIds = new Set<number>();
  const details: NewOrder["details"] = [];

  for (const line of form.lines) {
    const productId = Number(line.productId);
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return "Seleccione el producto de cada línea";
    }

    if (!product.status) {
      return "El producto indicado no está activo";
    }

    const quantity = parseQuantity(line.quantity);
    if (quantity === null) {
      return "La cantidad del producto debe ser un entero mayor que cero";
    }

    if (productIds.has(productId)) {
      return "El producto no puede repetirse en el pedido";
    }

    if (quantity > product.stock) {
      return "No hay existencias suficientes para confirmar el pedido";
    }

    productIds.add(productId);
    details.push({ productId, quantity });
  }

  return { customerId, userId, notes: notes || null, details };
};

const lineAmount = (line: DraftLine, products: OrderProduct[]): number | null => {
  const product = products.find((item) => item.id === Number(line.productId));
  const quantity = parseQuantity(line.quantity);

  if (!product || quantity === null) {
    return null;
  }

  return roundMoney(roundMoney(product.price) * quantity);
};

export const OrdersPage = () => {
  const navigate = useNavigate();
  const nextKey = useRef(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<OrderCustomer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<OrderForm | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusOrderId, setStatusOrderId] = useState<number | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  const createLine = (productId = "", quantity = "1"): DraftLine => ({
    key: nextKey.current++,
    productId,
    quantity,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [nextOrders, nextCustomers, nextUsers, nextProducts] = await Promise.all([
          getOrders(),
          getOrderCustomers(),
          getUsers().catch((error: unknown) => {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
              throw new Error("No autorizado");
            }

            throw new Error("No se logró cargar los usuarios. Intente de nuevo más tarde");
          }),
          getOrderProducts(),
        ]);
        setOrders(nextOrders);
        setCustomers(nextCustomers);
        setUsers(nextUsers);
        setProducts(nextProducts);
      } catch (error) {
        if (isUnauthorized(error)) {
          clearSession();
          navigate("/signin", { replace: true });
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "No se logró cargar los pedidos. Intente de nuevo más tarde",
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [navigate]);

  const activeUsers = users.filter((user) => user.status);
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredOrders = orders.filter((order) =>
    `${order.orderNumber} ${order.customerName} ${order.userName} ${STATUS_LABEL[order.status]}`
      .toLowerCase()
      .includes(normalizedTerm),
  );

  const openCreate = () => {
    const sessionUserId = getSession()?.user.id;
    setFormError("");
    setForm({
      orderId: null,
      orderNumber: null,
      orderDate: null,
      customerId: "",
      userId: activeUsers.some((user) => user.id === sessionUserId) ? String(sessionUserId) : "",
      notes: "",
      lines: [createLine()],
    });
  };

  const openEdit = (order: Order) => {
    setFormError("");
    setForm({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      customerId: String(order.customerId),
      userId: String(order.userId),
      notes: order.notes ?? "",
      lines: order.details.map((detail) => createLine(String(detail.productId), String(detail.quantity))),
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) {
      return;
    }

    setFormError("");
    setIsSaving(true);
    try {
      const latestProducts = await getOrderProducts();
      setProducts(latestProducts);
      const payload = buildOrder(form, latestProducts);
      if (typeof payload === "string") {
        setFormError(payload);
        return;
      }

      if (form.orderId === null) {
        await createOrder(payload);
      } else {
        await updateOrder(form.orderId, payload);
      }
      setOrders(await getOrders());
      setForm(null);
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession();
        navigate("/signin", { replace: true });
        return;
      }

      setFormError(error instanceof Error ? error.message : "No se logró registrar el pedido");
    } finally {
      setIsSaving(false);
    }
  };

  const applyStatus = async (order: Order, status: OrderStatus) => {
    const question =
      status === "CONFIRMADO"
        ? `¿Confirmar el pedido ${order.orderNumber}? Se validarán las existencias y se descontará el stock.`
        : status === "CANCELADO"
          ? returnsStock(order.status)
            ? `¿Cancelar el pedido ${order.orderNumber}? Se devolverá el stock descontado.`
            : `¿Cancelar el pedido ${order.orderNumber}? El stock no cambia porque todavía no se ha descontado.`
          : `¿Pasar el pedido ${order.orderNumber} a ${STATUS_LABEL[status]}?`;

    if (!window.confirm(question)) {
      return;
    }

    setStatusError("");
    setStatusOrderId(order.id);

    try {
      if (status === "CONFIRMADO") {
        const latestProducts = await getOrderProducts();
        setProducts(latestProducts);
        const missing = order.details.find((detail) => !latestProducts.some((product) => product.id === detail.productId));
        const inactive = order.details.find((detail) => {
          const product = latestProducts.find((item) => item.id === detail.productId);
          return product !== undefined && !product.status;
        });
        const shortage = order.details.find((detail) => {
          const product = latestProducts.find((item) => item.id === detail.productId);
          return product !== undefined && detail.quantity > product.stock;
        });

        if (missing) {
          setStatusError(`Pedido ${order.orderNumber}: El producto indicado no existe`);
          return;
        }

        if (inactive) {
          setStatusError(`Pedido ${order.orderNumber}: El producto indicado no está activo`);
          return;
        }

        if (shortage) {
          setStatusError(`Pedido ${order.orderNumber}: No hay existencias suficientes para confirmar el pedido`);
          return;
        }
      }

      await changeOrderStatus(order.id, status);
      const [nextOrders, nextProducts] = await Promise.all([getOrders(), getOrderProducts()]);
      setOrders(nextOrders);
      setProducts(nextProducts);
      if (form?.orderId === order.id) {
        setForm(null);
      }
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession();
        navigate("/signin", { replace: true });
        return;
      }

      const message = error instanceof Error ? error.message : "No se logró cambiar el estado del pedido";
      setStatusError(`Pedido ${order.orderNumber}: ${message}`);
    } finally {
      setStatusOrderId(null);
    }
  };

  const removeOrder = async (order: Order) => {
    if (!window.confirm(`¿Eliminar el pedido ${order.orderNumber}?`)) {
      return;
    }

    setStatusError("");
    setDeletingOrderId(order.id);

    try {
      await deleteOrder(order.id);
      setOrders(await getOrders());
      if (form?.orderId === order.id) {
        setForm(null);
      }
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession();
        navigate("/signin", { replace: true });
        return;
      }

      const message = error instanceof Error ? error.message : "No se logró eliminar el pedido";
      setStatusError(`Pedido ${order.orderNumber}: ${message}`);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const previewTotal = form
    ? roundMoney(form.lines.reduce((sum, line) => sum + (lineAmount(line, products) ?? 0), 0))
    : 0;

  const renderOrders = () => {
    if (isLoading) {
      return <p className="users-page-status">Cargando pedidos....</p>;
    }

    if (errorMessage) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {errorMessage}
        </p>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <p className="users-page-empty">
          {normalizedTerm ? "No se encontraron pedidos con ese término." : "No hay pedidos registrados."}
        </p>
      );
    }

    return (
      <div className="orders-scroll">
        <table className="orders-list">
          <thead>
            <tr>
              <th>Número pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const rowBusy = statusOrderId === order.id || deletingOrderId === order.id;
              const nextStatuses = ORDER_TRANSITIONS[order.status];

              return (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>{order.customerName}</td>
                  <td>{money(order.total)}</td>
                  <td>
                    <div className="orders-options">
                      <button
                        type="button"
                        className="orders-secondary"
                        onClick={() => {
                          if (order.status !== "PENDIENTE") {
                            setStatusError(`Pedido ${order.orderNumber}: Solo se puede editar un pedido pendiente`);
                            return;
                          }

                          openEdit(order);
                        }}
                        disabled={rowBusy}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="orders-danger"
                        onClick={() => removeOrder(order)}
                        disabled={rowBusy}
                      >
                        Eliminar
                      </button>
                      <select
                        aria-label={`Cambiar estado del pedido ${order.orderNumber}`}
                        value=""
                        onChange={(event) => {
                          const nextStatus = event.target.value as OrderStatus;
                          if (nextStatus) {
                            void applyStatus(order, nextStatus);
                          }
                        }}
                        disabled={rowBusy || nextStatuses.length === 0}
                      >
                        <option value="">{nextStatuses.length === 0 ? "Sin cambios" : "Estado"}</option>
                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            {ACTION_LABEL[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="users-page">
      <div className="users-page-header">
        <div className="users-page-heading">
          <h2 className="users-page-title">Pedidos</h2>
          {!isLoading && !errorMessage && (
            <p className="users-page-count">
              {filteredOrders.length}
              {filteredOrders.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
        <button type="button" className="orders-primary" onClick={openCreate} disabled={isLoading || Boolean(errorMessage) || form !== null}>
          Nuevo pedido
        </button>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por número, cliente o responsable" label="Buscar pedidos" />

      {form && (
        <form className="orders-form" onSubmit={handleSubmit}>
          <h3>{form.orderId === null ? "Nuevo pedido" : `Editar pedido ${form.orderNumber}`}</h3>
          <div className="orders-grid">
            <label className="orders-field">
              Número de pedido
              <input readOnly value={form.orderNumber === null ? "Se asigna al guardar" : String(form.orderNumber)} />
            </label>
            <label className="orders-field">
              Fecha del pedido
              <input readOnly value={form.orderDate === null ? "Se asigna al guardar" : formatDate(form.orderDate)} />
            </label>
            <label className="orders-field">
              Cliente
              <select
                value={form.customerId}
                onChange={(event) => setForm({ ...form, customerId: event.target.value })}
                required
              >
                <option value="">Seleccione</option>
                {customers
                  .filter((customer) => customer.status || String(customer.id) === form.customerId)
                  .map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.identification} · {customer.name}
                      {customer.status ? "" : " (inactivo)"}
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
            <label className="orders-field orders-field-wide">
              Notas
              <textarea
                maxLength={500}
                rows={3}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </label>
          </div>

          <div className="orders-scroll">
            <table className="orders-lines">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line) => {
                  const product = products.find((item) => item.id === Number(line.productId));
                  const quantity = parseQuantity(line.quantity);
                  const amount = lineAmount(line, products);
                  const shortage = product !== undefined && quantity !== null && quantity > product.stock;
                  const taken = new Set(
                    form.lines.filter((item) => item.key !== line.key && item.productId).map((item) => item.productId),
                  );

                  return (
                    <tr key={line.key}>
                      <td>
                        <select
                          aria-label="Producto"
                          value={line.productId}
                          onChange={(event) => setForm({
                            ...form,
                            lines: form.lines.map((item) =>
                              item.key === line.key ? { ...item, productId: event.target.value } : item,
                            ),
                          })}
                          required
                        >
                          <option value="">Seleccione</option>
                          {products
                            .filter((item) => item.status || String(item.id) === line.productId)
                            .map((item) => (
                              <option key={item.id} value={item.id} disabled={taken.has(String(item.id))}>
                                {item.codeProduct} · {item.name} · Stock {item.stock}
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
                          onChange={(event) => setForm({
                            ...form,
                            lines: form.lines.map((item) =>
                              item.key === line.key ? { ...item, quantity: event.target.value } : item,
                            ),
                          })}
                          required
                        />
                      </td>
                      <td>{product ? money(product.price) : "—"}</td>
                      <td className={shortage ? "orders-shortage" : undefined}>{product ? product.stock : "—"}</td>
                      <td>{amount === null ? "—" : money(amount)}</td>
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
            <button type="button" className="orders-secondary" onClick={() => setForm({ ...form, lines: [...form.lines, createLine()] })}>
              Agregar producto
            </button>
          </div>
          <div className="orders-totals">
            <span>Subtotal {money(previewTotal)}</span>
            <span>Total {money(previewTotal)}</span>
          </div>
          <p className="orders-notes">
            El precio sale del catálogo. Al guardar, el servidor recalcula subtotales y total. La cantidad no puede superar el stock; al confirmar, el servidor vuelve a validar existencias y descuenta el stock.
          </p>
          {formError && (
            <p className="users-page-status users-page-error" role="alert">
              {formError}
            </p>
          )}
          <div className="orders-actions">
            <button type="submit" className="orders-primary" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar pedido"}
            </button>
            <button type="button" className="orders-secondary" onClick={() => setForm(null)} disabled={isSaving}>
              Cerrar
            </button>
          </div>
        </form>
      )}

      {statusError && (
        <p className="users-page-status users-page-error" role="alert">
          {statusError}
        </p>
      )}
      {renderOrders()}
    </section>
  );
};
