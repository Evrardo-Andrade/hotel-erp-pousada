import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Validando acesso</h1>
          <p>Aguarde enquanto carregamos sua sessao.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
