import { useEffect, useMemo, useState } from "react";

const initialForm = {
  nome: "",
  categoria: "",
  preco: "0",
  codigoBarras: "",
  codigoInterno: "",
  estoqueInicial: "0",
  tipoProduto: "consumo",
  permiteCombo: false
};

function normalizeProduct(product) {
  if (!product) {
    return initialForm;
  }

  return {
    nome: product.nome || "",
    categoria: product.categoria || "",
    preco: String(product.preco ?? 0),
    codigoBarras: product.codigo_barras || "",
    codigoInterno: product.internal_code || "",
    estoqueInicial: String(product.quantidade_atual ?? 0),
    tipoProduto: product.tipo_produto || "consumo",
    permiteCombo: Boolean(product.permite_combo)
  };
}

export function ProductFormModal({
  isOpen,
  mode,
  product,
  onClose,
  onSubmit,
  onDeleteImage,
  isSubmitting,
  errorMessage
}) {
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const previewUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }

    return product?.image_url || null;
  }, [imageFile, product]);

  useEffect(() => {
    if (isOpen) {
      setForm(normalizeProduct(product));
      setImageFile(null);
    }
  }, [isOpen, product]);

  useEffect(() => {
    return () => {
      if (imageFile && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [imageFile, previewUrl]);

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

  async function handleSubmit(event) {
    event.preventDefault();

    await onSubmit({
      ...form,
      preco: Number(form.preco || 0),
      estoqueInicial: Number(form.estoqueInicial || 0)
    }, imageFile);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card large-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading room-form-heading">
          <div>
            <h2>{mode === "edit" ? "Editar Produto" : "Novo Produto"}</h2>
            <p>Cadastro com foto, codigos e estoque inicial.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <form className="room-form" onSubmit={handleSubmit}>
          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Informacoes basicas</h3>
              <p>Nome, categoria, codigos e valor comercial.</p>
            </div>
            <div className="room-form-grid">
              <label className="field span-two">
                <span>Nome</span>
                <input name="nome" type="text" value={form.nome} onChange={handleChange} required />
              </label>
              <label className="field">
                <span>Categoria</span>
                <input name="categoria" type="text" value={form.categoria} onChange={handleChange} required />
              </label>
              <label className="field">
                <span>Tipo produto</span>
                <select name="tipoProduto" value={form.tipoProduto} onChange={handleChange}>
                  <option value="consumo">Consumo</option>
                  <option value="insumo">Insumo</option>
                  <option value="experiencia">Experiencia</option>
                  <option value="servico">Servico</option>
                  <option value="locacao">Locacao</option>
                </select>
              </label>
              <label className="field">
                <span>Preco</span>
                <input name="preco" type="number" min="0" step="0.01" value={form.preco} onChange={handleChange} required />
              </label>
              <label className="field">
                <span>Estoque</span>
                <input name="estoqueInicial" type="number" min="0" step="0.01" value={form.estoqueInicial} onChange={handleChange} />
              </label>
              <label className="field">
                <span>Codigo interno</span>
                <input name="codigoInterno" type="text" value={form.codigoInterno} onChange={handleChange} />
              </label>
              <label className="field">
                <span>Codigo de barras</span>
                <input name="codigoBarras" type="text" value={form.codigoBarras} onChange={handleChange} />
              </label>
              <label className="checkbox-line span-two">
                <input name="permiteCombo" type="checkbox" checked={form.permiteCombo} onChange={handleChange} />
                <span>Permitir uso em combos e experiencias</span>
              </label>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Imagem do produto</h3>
              <p>Upload com preview para refletir no PDV e na busca inteligente.</p>
            </div>
            <div className="product-image-layout">
              <div className="product-image-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt={form.nome || "Preview do produto"} />
                ) : (
                  <div className="product-image-empty">Sem imagem</div>
                )}
              </div>
              <div className="stack-list">
                <label className="field">
                  <span>Arquivo</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  />
                </label>
                {imageFile ? (
                  <div className="inline-action-field">
                    <span className="inline-label">Arquivo selecionado</span>
                    <strong>{imageFile.name}</strong>
                    <small>A imagem sera enviada junto com o botao salvar.</small>
                  </div>
                ) : null}
                {mode === "edit" ? (
                  <div className="room-card-actions">
                    <button
                      type="button"
                      className="danger-button"
                      disabled={!product?.image_url || isSubmitting}
                      onClick={() => onDeleteImage(product.id)}
                    >
                      Remover imagem
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

          <div className="room-form-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : mode === "edit" ? "Salvar produto" : "Criar produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
