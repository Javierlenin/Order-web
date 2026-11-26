import { Navigate, useNavigate } from "react-router";
import { AuthForm } from "../components/AuthForm";
import { login } from "../services/authService";
import { getSession } from "../services/authSession";
import type { RegisterAccount } from "../types/auth";

export const LoginPage = () => {
  const navigate = useNavigate();

  if (getSession()) {
    return <Navigate to="/pedidos" replace />;
  }

  const handleLogin = async ({ email, password }: RegisterAccount) => {
    await login({ email, password });
    navigate("/pedidos", { replace: true });
  };

  return (
    <AuthForm
      title="Iniciar sesión"
      description="Ingresa tu correo y contraseña."
      submitLabel="Ingresar"
      alternateText="¿No tienes cuenta?"
      alternateLinkText="Registrar usuario"
      alternateTo="/signup"
      onSubmit={handleLogin}
    />
  );
};
