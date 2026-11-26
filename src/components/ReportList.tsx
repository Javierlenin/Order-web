import type { StockMovement, StockMovementType } from "../types/report";

interface ReportListProps {
  movements: StockMovement[];
}

const TYPE_LABEL: Record<StockMovementType, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  DEVOLUCION: "Devolución",
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es");
};

export const ReportList = ({ movements }: ReportListProps) => {
  return (
    <div className="reports-scroll">
      <table className="reports-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Stock anterior</th>
            <th>Stock resultante</th>
            <th>Responsable</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={`${movement.origin}-${movement.id}`}>
              <td>{formatDate(movement.occurredAt)}</td>
              <td>{TYPE_LABEL[movement.type]}</td>
              <td>{movement.quantity}</td>
              <td>{movement.stockBefore}</td>
              <td>{movement.stockAfter}</td>
              <td>{movement.userName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
