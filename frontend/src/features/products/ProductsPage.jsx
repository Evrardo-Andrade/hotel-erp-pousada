import { useEffect, useState } from "react";
import {
  createProduct,
  deleteProductImage,
  fetchProducts,
  updateProduct,
  uploadProductImage
} from "../../services/api";
import { ProductFormModal } from "./ProductFormModal.jsx";

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setIsLoading(true);
      const data = await fetchProducts();
      setProducts(data || []);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedProduct(null);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setModalMode("edit");
    setSelectedProduct(product);
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(payload, imageFile) {
    try {
      setIsSubmitting(true);
      setFormError("");

      if (modalMode === "edit" && selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, payload);
        let finalProduct = updated;

        if (imageFile) {
          finalProduct = await uploadProductImage(selectedProduct.id, imageFile);
        }

        setProducts((current) => current.map((item) => item.id === finalProduct.id ? finalProduct : item));
        setFeedback({ type: "success", message: `Produto ${finalProduct.nome} atualizado.` });
      } else {
        const created = await createProduct(payload);
        let finalProduct = created;

        if (imageFile) {
          finalProduct = await uploadProductImage(created.id, imageFile);
        }

        setProducts((current) => [finalProduct, ...current]);
        setFeedback({ type: "success", message: `Produto ${finalProduct.nome} criado.` });
      }

      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      setFormError(error.message || "Nao foi possivel salvar o produto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteImage(productId) {
    try {
      setIsSubmitting(true);
      await deleteProductImage(productId);
      const updatedProduct = { ...selectedProduct, image_url: null, image_filename: null };
      setProducts((current) => current.map((item) => item.id === productId ? updatedProduct : item));
      setSelectedProduct(updatedProduct);
      setFeedback({ type: "success", message: "Imagem removida com sucesso." });
    } catch (error) {
      setFormError(error.message || "Nao foi possivel remover a imagem.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Produtos e estoque</h2>
            <p>Controle de cadastro, codigos, imagens e disponibilidade.</p>
          </div>
          <button type="button" className="primary-button" onClick={openCreateModal}>
            Novo Produto
          </button>
        </div>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}

        {isLoading ? (
          <div className="empty-state">Carregando produtos...</div>
        ) : (
          <div className="table-like">
            {products.map((product) => (
              <div key={product.id} className="table-row product-table-row">
                <div className="product-row-main">
                  <div className="product-thumb">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.nome} />
                    ) : (
                      <div className="product-thumb-empty">Sem imagem</div>
                    )}
                  </div>
                  <div>
                    <strong>{product.nome}</strong>
                    <span>{product.categoria}</span>
                    <small>
                      Cod. interno: {product.internal_code || "nao informado"} • Barras: {product.codigo_barras || "nao informado"}
                    </small>
                  </div>
                </div>
                <span>{product.tipo_produto}</span>
                <span>{Number(product.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                <small>Estoque: {product.quantidade_atual}</small>
                <button type="button" className="ghost-button" onClick={() => openEditModal(product)}>
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </article>

      <ProductFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        onDeleteImage={handleDeleteImage}
        isSubmitting={isSubmitting}
        errorMessage={formError}
      />
    </section>
  );
}
