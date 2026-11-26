import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import type { RegisterAccount } from "../types/auth";
import "./AuthForm.css";

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  alternateText: string;
  alternateLinkText: string;
  alternateTo: string;
  collectProfile?: boolean;
  onSubmit: (account: RegisterAccount) => Promise<void>;
}

export const AuthForm = ({
  title,
  description,
  submitLabel,
  alternateText,
  alternateLinkText,
  alternateTo,
  collectProfile = false,
  onSubmit,
}: AuthFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        status,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo completar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-form-title">{title}</h1>
        <p className="auth-form-description">{description}</p>
        {collectProfile && (
          <label className="auth-field">
            Nombre
            <input
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={150}
              required
            />
          </label>
        )}
        <label className="auth-field">
          Correo
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={150}
            required
          />
        </label>
        <label className="auth-field">
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete={alternateTo === "/signin" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>
        {collectProfile && (
          <label className="auth-field">
            Estado
            <select value={status ? "true" : "false"} onChange={(event) => setStatus(event.target.value === "true")}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
        )}
        {errorMessage && (
          <p className="auth-form-error" role="alert">
            {errorMessage}
          </p>
        )}
        <button className="auth-form-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : submitLabel}
        </button>
        <p className="auth-form-alternate">
          {alternateText} <Link to={alternateTo}>{alternateLinkText}</Link>
        </p>
      </form>
    </section>
  );
};
