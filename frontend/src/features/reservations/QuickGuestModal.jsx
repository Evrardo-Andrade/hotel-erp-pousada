import { useState } from "react";

const initialGuest = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  cidade: "",
  uf: ""
};

export function QuickGuestModal({ isOpen, onClose, onSubmit, onOpenComplete, isSubmitting, errorMessage }) {
  const [form, setForm] = useState(initialGuest);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
    setForm(initialGuest);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card compact-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading room-form-heading">
          <div>
            <h2>Novo Hospede</h2>
            <p>Cadastro rapido sem sair da reserva</p>
          </div>
        </div>

        <form className="room-form" onSubmit={handleSubmit}>
          <div className="room-form-grid">
            <label className="field">
              <span>Nome</span>
              <input name="nome" value={form.nome} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Documento</span>
              <input name="cpf" value={form.cpf} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Telefone</span>
              <input name="telefone" value={form.telefone} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Cidade</span>
              <input name="cidade" value={form.cidade} onChange={handleChange} />
            </label>
            <label className="field">
              <span>UF</span>
              <input name="uf" value={form.uf} onChange={handleChange} maxLength="2" />
            </label>
          </div>

          {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

          <div className="room-form-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => onOpenComplete?.(form)}
              disabled={isSubmitting}
            >
              Cadastro completo
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Hospede"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
