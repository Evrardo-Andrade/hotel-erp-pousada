import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoadingAuth } = useAuth();
  const [form, setForm] = useState({
    email: "admin@erp.com",
    password: "Admin@123456",
    remember: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setErrorMessage("");
  }, [form.email, form.password, form.remember]);

  if (!isLoadingAuth && isAuthenticated) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await login(form);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel autenticar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">C7</div>
          <div>
            <strong>Hotel ERP</strong>
            <p>Login seguro para operacao da pousada</p>
          </div>
        </div>

        <div className="auth-copy">
          <h1>Entrar</h1>
          <p>Acesse o painel administrativo com seu usuario autorizado.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </label>

          <label className="field field-checkbox">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
            />
            <span>Lembrar login</span>
          </label>

          {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

          <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
