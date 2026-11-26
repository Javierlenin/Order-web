import { PencilIcon, TrashBinIcon } from "../assets/icons";
import "./UserCard.css";

interface CardActionsProps {
  label: string;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const CardActions = ({ label, busy = false, onEdit, onDelete }: CardActionsProps) => (
  <div className="user-card-actions">
    <button type="button" className="user-card-action" aria-label={`Editar ${label}`} onClick={onEdit} disabled={busy}>
      <PencilIcon />
    </button>
    <button
      type="button"
      className="user-card-action user-card-action-danger"
      aria-label={`Eliminar ${label}`}
      onClick={onDelete}
      disabled={busy}
    >
      <TrashBinIcon />
    </button>
  </div>
);
