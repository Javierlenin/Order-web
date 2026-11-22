import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { LoginPage } from "./page/LoginPage";
import { RegisterPage } from "./page/RegisterPage";
import NotFound from "./page/OtherPage/NotFound";
import AppLayout from "./components/layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { UsersPage } from "./page/UsersPage";
import { RolesPage } from "./page/RolesPage";
import { ModulePage } from "./page/ModulePage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Navigate to="/pedidos" replace />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/clientes" element={<ModulePage title="Clientes" />} />
              <Route path="/pedidos" element={<ModulePage title="Pedidos" />} />
              <Route path="/categorias" element={<ModulePage title="Categorías" />} />
              <Route path="/productos" element={<ModulePage title="Productos" />} />
              <Route path="/reportes" element={<ModulePage title="Reportes" />} />
            </Route>
          </Route>
          <Route path="/signin" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
