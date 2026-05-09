import { useEffect, useState } from "react";

const initialForm = {
  nome: "",
  descricao: "",
  ativo: true
};

export function RoomClassificationFormModal({
  isOpen,
  title,
  item,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  compact = false
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
      setForm({
        nome: item?.nome || "",
        descricao: item?.descricao || "",
        ativo: item?.ativo ?? true
      });
    }
  }, [isOpen, item]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      ativo: form.ativo
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal-card ${compact ? "modal-card-compact" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading room-form-heading">
          <div>
            <h2>{title}</h2>
            <p>Cadastre ou ajuste a classificacao operacional.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>
            Fechar
          </button>
        </div>

        <form className="room-form" onSubmit={handleSubmit}>
          <section className="room-form-section">
            <div className="room-form-grid">
              <label className="field">
                <span>Nome</span>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex.: Suite, Master, Bangalo"
                  required
                />
              </label>

              <label className="field span-two">
                <span>Descricao</span>
                <textarea
                  name="descricao"
                  rows="4"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Descricao opcional para a equipe."
                />
              </label>

              <label className="field field-checkbox">
                <input
                  name="ativo"
                  type="checkbox"
                  checked={form.ativo}
                  onChange={handleChange}
                />
                <span>Tipo ativo para novos cadastros</span>
              </label>
            </div>
          </section>

          {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

          <div className="room-form-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
