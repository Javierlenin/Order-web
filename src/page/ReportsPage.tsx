import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "./ReportsPage.css";
import "../components/UserCard.css";
import { ReportList } from "../components/ReportList";
import { getProducts } from "../services/productService";
import { getProductStockReport } from "../services/reportService";
import type { Product } from "../types/product";
import { STOCK_MOVEMENT_TYPES, type ProductStockReport, type StockMovementType } from "../types/report";

const TYPE_LABEL: Record<StockMovementType, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  DEVOLUCION: "Devolución",
};

export const ReportsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<"" | StockMovementType>("");
  const [report, setReport] = useState<ProductStockReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProducts(await getProducts());
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se logró cargar los productos. Intente de nuevo más tarde",
        );
      } finally {
        setProductsLoaded(true);
      }
    };

    loadProducts();
  }, []);

  const normalizedQuery = productQuery.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matches = `${product.codeProduct} ${product.name}`.toLowerCase().includes(normalizedQuery);
    return matches || String(product.id) === productId;
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedProductId = Number(productId);

    if (!Number.isInteger(selectedProductId) || selectedProductId <= 0) {
      setReport(null);
      setErrorMessage("Seleccione un producto");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      setReport(
        await getProductStockReport(selectedProductId, {
          from: from || undefined,
          to: to || undefined,
          type: type || undefined,
        }),
      );
    } catch (error) {
      setReport(null);
      setErrorMessage(
        error instanceof Error ? error.message : "No se logró cargar el reporte. Intente de nuevo más tarde",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="users-page-status">Cargando reporte....</p>;
    }

    if (errorMessage) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {errorMessage}
        </p>
      );
    }

    if (!report) {
      return null;
    }

    if (report.movements.length === 0) {
      return <p className="users-page-empty">No se encontraron movimientos.</p>;
    }

    return <ReportList movements={report.movements} />;
  };

  return (
    <section className="users-page">
      <div className="users-page-header">
        <h2 className="users-page-title">Reportes</h2>
      </div>
      <form className="reports-filters" onSubmit={handleSubmit}>
        <label className="reports-field">
          Buscar producto
          <input
            type="search"
            name="productQuery"
            value={productQuery}
            onChange={(event) => setProductQuery(event.target.value)}
            placeholder="Código o nombre"
          />
        </label>
        <label className="reports-field">
          Producto
          <select
            name="productId"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            required
          >
            <option value="">Seleccione</option>
            {visibleProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.codeProduct} · {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="reports-field">
          Desde
          <input type="date" name="from" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="reports-field">
          Hasta
          <input type="date" name="to" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label className="reports-field">
          Tipo
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as "" | StockMovementType)}
          >
            <option value="">Todos</option>
            {STOCK_MOVEMENT_TYPES.map((movementType) => (
              <option key={movementType} value={movementType}>
                {TYPE_LABEL[movementType]}
              </option>
            ))}
          </select>
        </label>
        <button className="reports-submit" type="submit" disabled={isLoading || products.length === 0}>
          Consultar
        </button>
      </form>
      {productsLoaded && products.length === 0 && !errorMessage && (
        <p className="users-page-empty">No hay productos registrados.</p>
      )}
      {report && !errorMessage && (
        <div className="reports-product">
          <h3 className="user-card-name">
            {report.product.codeProduct} · {report.product.name}
          </h3>
          <p className="users-page-count">Stock {report.product.stock}</p>
        </div>
      )}
      {renderContent()}
    </section>
  );
};
