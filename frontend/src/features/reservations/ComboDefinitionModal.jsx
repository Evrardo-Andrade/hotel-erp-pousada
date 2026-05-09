import { useEffect, useState } from "react";

const initialCombo = {
  nome: "",
  descricao: "",
  preco: 0,
  duracao_minutos: 60,
  ativo: true,
  limite_por_dia: 1,
  observacoes: "",
  itens: []
};

export function ComboDefinitionModal({ isOpen, combo, products, onClose, onSubmit, isSubmitting, errorMessage }) {
  const [form, setForm] = useState(initialCombo);

  useEffect(() => {
    if (isOpen) {
      setForm(combo || initialCombo);
    }
  }, [isOpen, combo]);

  if (!isOpen) {
    return null;
  }

  const comboProducts = products.filter((item) => item.permite_combo);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      itens: [...current.itens, { produto_id: "", quantidade: 1 }]
    }));
  }

  function updateItem(index, field, value) {
    setForm((current) => ({
      ...current,
      itens: current.itens.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  }

  function removeItem(index) {
    setForm((current) => ({
      ...current,
      itens: current.itens.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      preco: Number(form.preco),
      duracao_minutos: Number(form.duracao_minutos),
      limite_por_dia: Number(form.limite_por_dia),
      itens: form.itens.map((item) => ({
        ...item,
        quantidade: Number(item.quantidade)
      }))
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card large-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading room-form-heading">
          <div>
            <h2>{combo ? "Editar Combo" : "Novo Combo"}</h2>
            <p>Monte experiencias da pousada com itens vinculados ao estoque</p>
          </div>
        </div>

        <form className="room-form" onSubmit={handleSubmit}>
          <div className="room-form-grid">
            <label className="field">
              <span>Nome</span>
              <input name="nome" value={form.nome} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Preco</span>
              <input name="preco" type="number" min="0" step="0.01" value={form.preco} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Duracao (min)</span>
              <input name="duracao_minutos" type="number" min="1" value={form.duracao_minutos} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Limite por dia</span>
              <input name="limite_por_dia" type="number" min="1" value={form.limite_por_dia} onChange={handleChange} required />
            </label>
          </div>

          <label className="field">
            <span>Descricao</span>
            <textarea name="descricao" rows="3" value={form.descricao} onChange={handleChange} />
          </label>

          <label className="checkbox-line">
            <input name="ativo" type="checkbox" checked={form.ativo} onChange={handleChange} />
            <span>Combo ativo</span>
          </label>

          <label className="field">
            <span>Observacoes</span>
            <textarea name="observacoes" rows="3" value={form.observacoes} onChange={handleChange} />
          </label>

          <div className="panel-heading subheading-inline">
            <div>
              <h3>Itens consumidos</h3>
              <p>Produtos que serao baixados ao concluir o combo</p>
            </div>
            <button type="button" className="ghost-button" onClick={addItem}>
              Adicionar Item
            </button>
          </div>

          <div className="combo-items-list">
            {form.itens.map((item, index) => (
              <div key={`${item.produto_id}-${index}`} className="combo-item-row">
                <select value={item.produto_id} onChange={(event) => updateItem(index, "produto_id", event.target.value)} required>
                  <option value="">Selecione um produto</option>
                  {comboProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nome}
                    </option>
                  ))}
                </select>
                <input type="number" min="0.01" step="0.01" value={item.quantidade} onChange={(event) => updateItem(index, "quantidade", event.target.value)} required />
                <button type="button" className="danger-button" onClick={() => removeItem(index)}>
                  Remover
                </button>
              </div>
            ))}
          </div>

          {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

          <div className="room-form-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Combo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
