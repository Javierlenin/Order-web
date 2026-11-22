import { Navigate, Outlet } from "react-router";
import { getSession } from "../services/authSession";

export const RequireAuth = () => {
  if (!getSession()) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};
