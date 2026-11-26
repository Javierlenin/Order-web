import { useEffect, useState, type FormEvent } from "react";
import "./UsersPage.css";
import "../components/UserList.css";
import "../components/UserCard.css";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/ui/modal";
import { useModal } from "../components/hooks/useModal";
import { createCustomer, getCustomers } from "../services/customerService";
import type { Customer } from "../types/customer";

export const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [identification, setIdentification] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomers(await getCustomers());
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se logró cargar los clientes. Intente de nuevo más tarde",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) =>
    `${customer.identification} ${customer.name} ${customer.email ?? ""} ${customer.phone ?? ""} ${customer.address ?? ""}`
      .toLowerCase()
      .includes(normalizedTerm),
  );

  const resetForm = () => {
    setIdentification("");
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setStatus(true);
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleCreateCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedIdentification = identification.trim();
    const trimmedName = name.trim();

    if (!trimmedIdentification) {
      setFormError("La identificación es obligatoria");
      return;
    }

    if (!trimmedName) {
      setFormError("El nombre es obligatorio");
      return;
    }

    setFormError("");
    setIsSaving(true);

    try {
      const createdCustomer = await createCustomer({
        identification: trimmedIdentification,
        name: trimmedName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        status,
      });
      setCustomers((currentCustomers) => [createdCustomer, ...currentCustomers]);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se logró registrar el cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="users-page-status">Cargando clientes....</p>;
    }

    if (errorMessage) {
      return (
        <p className="users-page-status users-page-error" role="alert">
          {errorMessage}
        </p>
      );
    }

    if (filteredCustomers.length === 0) {
      return (
        <p className="users-page-empty">
          {normalizedTerm ? "No se encontraron clientes con ese término." : "No hay clientes registrados."}
        </p>
      );
    }

    return (
      <div className="user-list">
        {filteredCustomers.map((customer) => (
          <article key={customer.id} className="user-card">
            <h3 className="user-card-name">{customer.name}</h3>
            <p className="user-card-email">{customer.identification}</p>
            <p className="user-card-email">{customer.email || "Sin correo"}</p>
            <p className="user-card-email">{customer.phone || "Sin teléfono"}</p>
            <p className="user-card-email">{customer.address || "Sin dirección"}</p>
            <div className="user-card-footer">
              <span className="user-card-status">{customer.status ? "Activo" : "Inactivo"}</span>
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
          <h2 className="users-page-title">Clientes</h2>
          {!isLoading && !errorMessage && (
            <p className="users-page-count">
              {filteredCustomers.length}
              {filteredCustomers.length === 1 ? " resultado" : " resultados"}
            </p>
          )}
        </div>
        <button type="button" className="users-page-new" onClick={openModal}>
          Nuevo cliente
        </button>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por identificación, nombre o teléfono"
        label="Buscar clientes"
      />
      {renderContent()}
      <Modal isOpen={isOpen} onClose={handleClose} className="record-modal">
        <form className="record-form" onSubmit={handleCreateCustomer}>
          <h3 className="record-form-title">Nuevo cliente</h3>
          <label>
            Identificación
            <input
              value={identification}
              onChange={(event) => setIdentification(event.target.value)}
              maxLength={30}
              required
              autoFocus
            />
          </label>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={150} required />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={150}
            />
          </label>
          <label>
            Teléfono
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={30}
            />
          </label>
          <label>
            Dirección
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={300}
              rows={3}
            />
          </label>
          <label>
            Estado
            <select value={status ? "true" : "false"} onChange={(event) => setStatus(event.target.value === "true")}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
          {formError && (
            <p className="users-page-error" role="alert">
              {formError}
            </p>
          )}
          <div className="record-form-actions">
            <button type="button" className="users-page-logout" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="users-page-new" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
