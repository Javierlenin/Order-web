import { useState, type FormEvent } from "react";
import "./UsersPage.css";
import "./ReportsPage.css";
import "../components/UserCard.css";
import { ReportList } from "../components/ReportList";
import { getProductStockReport } from "../services/reportService";
import { STOCK_MOVEMENT_TYPES, type ProductStockReport, type StockMovementType } from "../types/report";

const TYPE_LABEL: Record<StockMovementType, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  DEVOLUCION: "Devolución",
};

export const ReportsPage = () => {
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<"" | StockMovementType>("");
  const [report, setReport] = useState<ProductStockReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      setReport(
        await getProductStockReport(Number(productId), {
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
          Producto
          <input
            type="number"
            min="1"
            name="productId"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            required
          />
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
        <button className="reports-submit" type="submit" disabled={isLoading}>
          Consultar
        </button>
      </form>
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
