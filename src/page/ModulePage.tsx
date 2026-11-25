import { useState, type FormEvent } from "react";
import "./UsersPage.css";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";

interface ModulePageProps {
  title: string;
}

export const ModulePage = ({ title }: ModulePageProps) => {
  const [records, setRecords] = useState<string[]>([]);
  const [name, setName] = useState("");
  const { isOpen, openModal, closeModal } = useModal();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setRecords((currentRecords) => [trimmedName, ...currentRecords]);
    setName("");
    closeModal();
  };

  return (
    <section className="users-page">
      <div className="users-page-header">
        <h2 className="users-page-title">{title}</h2>
        <button type="button" className="users-page-new" onClick={openModal}>
          Nuevo registro
        </button>
      </div>
      {records.length === 0 ? (
        <p className="users-page-empty">No hay registros agregados.</p>
      ) : (
        <div className="module-record-list">
          {records.map((record, index) => (
            <article className="module-record-card" key={`${record}-${index}`}>
              <h3>{record}</h3>
              <p>{title}</p>
            </article>
          ))}
        </div>
      )}
      <Modal isOpen={isOpen} onClose={closeModal} className="record-modal">
        <form className="record-form" onSubmit={handleSubmit}>
          <h3 className="record-form-title">Nuevo registro de {title.toLowerCase()}</h3>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
          </label>
          <div className="record-form-actions">
            <button type="button" className="users-page-logout" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="users-page-new">Guardar</button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
