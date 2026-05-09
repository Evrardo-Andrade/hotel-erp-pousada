import { useEffect, useState } from "react";
import {
  createSeller,
  createSystemUser,
  deleteSeller,
  deleteSystemUser,
  fetchSellers,
  fetchSystemUsers,
  updateSeller,
  updateSystemUser
} from "../../services/api";

const initialUserForm = {
  nome: "",
  usuario: "",
  perfil: "recepcao",
  ativo: true
};

const initialSellerForm = {
  nome: "",
  apelido: "",
  tipo: "garcom",
  ativo: true
};

export function PeoplePage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [sellerForm, setSellerForm] = useState(initialSellerForm);
  const [editingUserId, setEditingUserId] = useState("");
  const [editingSellerId, setEditingSellerId] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    try {
      setIsLoading(true);
      const [usersData, sellersData] = await Promise.all([fetchSystemUsers(), fetchSellers()]);
      setUsers(usersData || []);
      setSellers(sellersData || []);
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel carregar os cadastros de pessoas." });
    } finally {
      setIsLoading(false);
    }
  }

  function resetUserForm() {
    setUserForm(initialUserForm);
    setEditingUserId("");
  }

  function resetSellerForm() {
    setSellerForm(initialSellerForm);
    setEditingSellerId("");
  }

  async function handleUserSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      if (editingUserId) {
        await updateSystemUser(editingUserId, userForm);
        setFeedback({ type: "success", message: "Usuario do sistema atualizado." });
      } else {
        await createSystemUser(userForm);
        setFeedback({ type: "success", message: "Usuario do sistema cadastrado." });
      }

      resetUserForm();
      await loadPeople();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel salvar o usuario do sistema." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSellerSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      if (editingSellerId) {
        await updateSeller(editingSellerId, sellerForm);
        setFeedback({ type: "success", message: "Vendedor atualizado." });
      } else {
        await createSeller(sellerForm);
        setFeedback({ type: "success", message: "Vendedor cadastrado." });
      }

      resetSellerForm();
      await loadPeople();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel salvar o vendedor." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm("Deseja remover este usuario do sistema?")) {
      return;
    }

    try {
      await deleteSystemUser(id);
      if (editingUserId === id) {
        resetUserForm();
      }
      setFeedback({ type: "success", message: "Usuario removido." });
      await loadPeople();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel remover o usuario." });
    }
  }

  async function handleDeleteSeller(id) {
    if (!window.confirm("Deseja remover este vendedor?")) {
      return;
    }

    try {
      await deleteSeller(id);
      if (editingSellerId === id) {
        resetSellerForm();
      }
      setFeedback({ type: "success", message: "Vendedor removido." });
      await loadPeople();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel remover o vendedor." });
    }
  }

  if (isLoading) {
    return <div className="empty-state">Carregando cadastros de pessoas...</div>;
  }

  return (
    <section className="page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Pessoas</h2>
            <p>Cadastros de usuarios do sistema e vendedores para atendimento no PDV.</p>
          </div>
          <div className="people-tabs" role="tablist" aria-label="Cadastros de pessoas">
            <button type="button" className={`ghost-button ${activeTab === "users" ? "is-active" : ""}`} onClick={() => setActiveTab("users")}>
              Usuarios do sistema
            </button>
            <button type="button" className={`ghost-button ${activeTab === "sellers" ? "is-active" : ""}`} onClick={() => setActiveTab("sellers")}>
              Vendedores
            </button>
          </div>
        </div>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}

        {activeTab === "users" ? (
          <div className="people-layout">
            <form className="room-form-section" onSubmit={handleUserSubmit}>
              <div className="room-form-section-head">
                <h3>{editingUserId ? "Editar usuario" : "Novo usuario do sistema"}</h3>
                <p>Utilizado para operador/usuario responsavel no PDV e nos comprovantes.</p>
              </div>
              <div className="room-form-grid">
                <label className="field">
                  <span>Nome</span>
                  <input type="text" value={userForm.nome} onChange={(event) => setUserForm((current) => ({ ...current, nome: event.target.value }))} required />
                </label>
                <label className="field">
                  <span>Usuario</span>
                  <input type="text" value={userForm.usuario} onChange={(event) => setUserForm((current) => ({ ...current, usuario: event.target.value }))} required />
                </label>
                <label className="field">
                  <span>Perfil</span>
                  <select value={userForm.perfil} onChange={(event) => setUserForm((current) => ({ ...current, perfil: event.target.value }))}>
                    <option value="recepcao">Recepcao</option>
                    <option value="caixa">Caixa</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="checkbox-line">
                  <input type="checkbox" checked={userForm.ativo} onChange={(event) => setUserForm((current) => ({ ...current, ativo: event.target.checked }))} />
                  <span>Usuario ativo</span>
                </label>
              </div>
              <div className="room-form-actions">
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {editingUserId ? "Salvar alteracoes" : "Cadastrar usuario"}
                </button>
                <button type="button" className="ghost-button" onClick={resetUserForm}>
                  Limpar
                </button>
              </div>
            </form>

            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Usuarios cadastrados</h3>
                <p>Selecione um registro para editar ou remover.</p>
              </div>
              <div className="table-like">
                {users.map((user) => (
                  <div key={user.id} className="table-row people-row">
                    <div>
                      <strong>{user.nome}</strong>
                      <span>{user.usuario}</span>
                    </div>
                    <div className="people-row-meta">
                      <span className="status-pill">{user.perfil}</span>
                      <span className={`status-pill ${user.ativo ? "status-hospedado" : "status-cancelada"}`}>{user.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                    <div className="room-card-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setEditingUserId(user.id);
                          setUserForm({
                            nome: user.nome || "",
                            usuario: user.usuario || "",
                            perfil: user.perfil || "recepcao",
                            ativo: Boolean(user.ativo)
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="danger-button" onClick={() => handleDeleteUser(user.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="people-layout">
            <form className="room-form-section" onSubmit={handleSellerSubmit}>
              <div className="room-form-section-head">
                <h3>{editingSellerId ? "Editar vendedor" : "Novo vendedor / garcom"}</h3>
                <p>Usado no atendimento da venda e na impressao gerencial do pedido.</p>
              </div>
              <div className="room-form-grid">
                <label className="field">
                  <span>Nome</span>
                  <input type="text" value={sellerForm.nome} onChange={(event) => setSellerForm((current) => ({ ...current, nome: event.target.value }))} required />
                </label>
                <label className="field">
                  <span>Apelido</span>
                  <input type="text" value={sellerForm.apelido} onChange={(event) => setSellerForm((current) => ({ ...current, apelido: event.target.value }))} placeholder="Opcional" />
                </label>
                <label className="field">
                  <span>Tipo</span>
                  <select value={sellerForm.tipo} onChange={(event) => setSellerForm((current) => ({ ...current, tipo: event.target.value }))}>
                    <option value="garcom">Garcom</option>
                    <option value="atendente">Atendente</option>
                    <option value="recepcionista">Recepcionista</option>
                  </select>
                </label>
                <label className="checkbox-line">
                  <input type="checkbox" checked={sellerForm.ativo} onChange={(event) => setSellerForm((current) => ({ ...current, ativo: event.target.checked }))} />
                  <span>Vendedor ativo</span>
                </label>
              </div>
              <div className="room-form-actions">
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {editingSellerId ? "Salvar alteracoes" : "Cadastrar vendedor"}
                </button>
                <button type="button" className="ghost-button" onClick={resetSellerForm}>
                  Limpar
                </button>
              </div>
            </form>

            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Vendedores cadastrados</h3>
                <p>Atendentes e garcons disponiveis para a operacao.</p>
              </div>
              <div className="table-like">
                {sellers.map((seller) => (
                  <div key={seller.id} className="table-row people-row">
                    <div>
                      <strong>{seller.nome}</strong>
                      <span>{seller.apelido || seller.tipo}</span>
                    </div>
                    <div className="people-row-meta">
                      <span className="status-pill">{seller.tipo}</span>
                      <span className={`status-pill ${seller.ativo ? "status-hospedado" : "status-cancelada"}`}>{seller.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                    <div className="room-card-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setEditingSellerId(seller.id);
                          setSellerForm({
                            nome: seller.nome || "",
                            apelido: seller.apelido || "",
                            tipo: seller.tipo || "garcom",
                            ativo: Boolean(seller.ativo)
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="danger-button" onClick={() => handleDeleteSeller(seller.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </article>
    </section>
  );
}
