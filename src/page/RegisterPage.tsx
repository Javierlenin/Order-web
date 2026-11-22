import { Navigate, useNavigate } from "react-router";
import { AuthForm } from "../components/AuthForm";
import { register } from "../services/authService";
import { getSession } from "../services/authSession";
import type { LoginCredentials } from "../types/auth";

export const RegisterPage = () => {
  const navigate = useNavigate();

  if (getSession()) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (credentials: LoginCredentials) => {
    await register(credentials);
    navigate("/", { replace: true });
  };

  return (
    <AuthForm
      title="Registrar usuario"
      description="Crea una cuenta con tu correo y contraseña."
      submitLabel="Registrar"
      alternateText="¿Ya tienes cuenta?"
      alternateLinkText="Iniciar sesión"
      alternateTo="/signin"
      onSubmit={handleRegister}
    />
  );
};
