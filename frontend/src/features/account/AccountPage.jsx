import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../app/auth.jsx";

const profileInitialState = {
  nome: "",
  email: "",
  confirmEmail: ""
};

const passwordInitialState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

export function AccountPage() {
  const location = useLocation();
  const { user, updateProfile, changeOwnPassword } = useAuth();
  const [profileForm, setProfileForm] = useState(profileInitialState);
  const [passwordForm, setPasswordForm] = useState(passwordInitialState);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    setProfileForm({
      nome: user?.nome || "",
      email: user?.email || "",
      confirmEmail: user?.email || ""
    });
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    setActiveSection(section === "password" ? "password" : "profile");
  }, [location.search]);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileFeedback(null);
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordFeedback(null);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!profileForm.nome.trim()) {
      setProfileFeedback({ type: "error", message: "Informe seu nome." });
      return;
    }

    if (!profileForm.email.trim()) {
      setProfileFeedback({ type: "error", message: "Informe seu e-mail." });
      return;
    }

    if (profileForm.email.trim().toLowerCase() !== profileForm.confirmEmail.trim().toLowerCase()) {
      setProfileFeedback({ type: "error", message: "A confirmacao do e-mail nao confere." });
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedUser = await updateProfile({
        nome: profileForm.nome.trim(),
        email: profileForm.email.trim().toLowerCase()
      });
      setProfileForm({
        nome: updatedUser.nome,
        email: updatedUser.email,
        confirmEmail: updatedUser.email
      });
      setProfileFeedback({ type: "success", message: "Dados da conta atualizados com sucesso." });
    } catch (error) {
      setProfileFeedback({ type: "error", message: error.message || "Nao foi possivel atualizar seus dados." });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    if (!passwordForm.currentPassword) {
      setPasswordFeedback({ type: "error", message: "Informe a senha atual." });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "A nova senha deve ter no minimo 8 caracteres." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: "error", message: "A confirmacao da nova senha nao confere." });
      return;
    }

    try {
      setIsSavingPassword(true);
      await changeOwnPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm(passwordInitialState);
      setPasswordFeedback({ type: "success", message: "Senha alterada com sucesso." });
    } catch (error) {
      setPasswordFeedback({ type: "error", message: error.message || "Nao foi possivel alterar a senha." });
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <section className="page-grid account-page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Minha conta</h2>
            <p>Gerencie seus dados de acesso e mantenha o perfil do usuario atualizado.</p>
          </div>
        </div>

        <div className="account-summary-card">
          <div className="user-avatar large">{String(user?.nome || user?.email || "U").slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user?.nome || "Usuario"}</strong>
            <p>{user?.email || "Sem e-mail"}</p>
            <span className="status-pill">{user?.role || "admin"}</span>
          </div>
        </div>

        <div className="account-tabs">
          <button
            type="button"
            className={activeSection === "profile" ? "primary-button" : "ghost-button"}
            onClick={() => setActiveSection("profile")}
          >
            Minha conta
          </button>
          <button
            type="button"
            className={activeSection === "password" ? "primary-button" : "ghost-button"}
            onClick={() => setActiveSection("password")}
          >
            Alterar senha
          </button>
        </div>
      </article>

      <article className={`panel ${activeSection === "profile" ? "" : "is-muted-panel"}`}>
        <div className="panel-heading">
          <div>
            <h2>Dados do perfil</h2>
            <p>Altere nome e e-mail do usuario logado.</p>
          </div>
        </div>

        {profileFeedback ? <div className={`form-feedback ${profileFeedback.type}`}>{profileFeedback.message}</div> : null}

        <form className="room-form" onSubmit={handleSaveProfile}>
          <div className="room-form-grid">
            <label className="field span-two">
              <span>Nome atual</span>
              <input
                name="nome"
                value={profileForm.nome}
                onChange={handleProfileChange}
                required
              />
            </label>

            <label className="field">
              <span>Novo e-mail</span>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
              />
            </label>

            <label className="field">
              <span>Confirmacao do e-mail</span>
              <input
                type="email"
                name="confirmEmail"
                value={profileForm.confirmEmail}
                onChange={handleProfileChange}
                required
              />
            </label>
          </div>

          <div className="room-form-actions">
            <button type="submit" className="primary-button" disabled={isSavingProfile}>
              {isSavingProfile ? "Salvando..." : "Salvar dados"}
            </button>
          </div>
        </form>
      </article>

      <article className={`panel ${activeSection === "password" ? "" : "is-muted-panel"}`}>
        <div className="panel-heading">
          <div>
            <h2>Alterar senha</h2>
            <p>Confirme a senha atual para definir uma nova senha segura.</p>
          </div>
        </div>

        {passwordFeedback ? <div className={`form-feedback ${passwordFeedback.type}`}>{passwordFeedback.message}</div> : null}

        <form className="room-form" onSubmit={handleChangePassword}>
          <div className="room-form-grid">
            <label className="field">
              <span>Senha atual</span>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>

            <label className="field">
              <span>Nova senha</span>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                minLength="8"
                required
              />
            </label>

            <label className="field">
              <span>Confirmar nova senha</span>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                minLength="8"
                required
              />
            </label>
          </div>

          <div className="room-form-actions">
            <button type="submit" className="primary-button" disabled={isSavingPassword}>
              {isSavingPassword ? "Atualizando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
