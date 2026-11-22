import type { StockMovement } from "../types/report";
import { ReportCard } from "./ReportCard";
import "./UserList.css";

interface ReportListProps {
  movements: StockMovement[];
}

export const ReportList = ({ movements }: ReportListProps) => {
  return (
    <div className="user-list">
      {movements.map((movement) => (
        <ReportCard key={`${movement.origin}-${movement.id}`} movement={movement} />
      ))}
    </div>
  );
};
