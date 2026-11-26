import { Navigate, useNavigate } from "react-router";
import { AuthForm } from "../components/AuthForm";
import { register } from "../services/authService";
import { getSession } from "../services/authSession";
import type { RegisterAccount } from "../types/auth";

export const RegisterPage = () => {
  const navigate = useNavigate();

  if (getSession()) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (account: RegisterAccount) => {
    await register(account);
    navigate("/", { replace: true });
  };

  return (
    <AuthForm
      title="Registrar usuario"
      description="Crea tu cuenta. El rol Admin se asigna automáticamente."
      submitLabel="Registrar"
      collectProfile
      alternateText="¿Ya tienes cuenta?"
      alternateLinkText="Iniciar sesión"
      alternateTo="/signin"
      onSubmit={handleRegister}
    />
  );
};
