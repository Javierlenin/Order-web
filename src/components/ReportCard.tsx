import type { StockMovement, StockMovementType } from "../types/report";
import "./UserCard.css";

interface ReportCardProps {
  movement: StockMovement;
}

const TYPE_LABEL: Record<StockMovementType, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  DEVOLUCION: "Devolución",
};

export const ReportCard = ({ movement }: ReportCardProps) => {
  const occurredAt = new Date(movement.occurredAt).toLocaleString("es");

  return (
    <article className="user-card">
      <p className="user-card-email">{occurredAt}</p>
      <h3 className="user-card-name">{TYPE_LABEL[movement.type]}</h3>
      <div className="user-card-footer">
        <span className="user-card-role">{movement.quantity}</span>
        <span className="user-card-status">
          {movement.stockBefore} → {movement.stockAfter}
        </span>
      </div>
      <p className="user-card-email">{movement.userName}</p>
    </article>
  );
};
