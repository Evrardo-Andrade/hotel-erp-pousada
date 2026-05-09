import { useEffect, useState } from "react";
import { RoomClassificationFormModal } from "./RoomClassificationFormModal.jsx";

export function RoomClassificationPage({
  title,
  description,
  entityLabel,
  fetchItems,
  createItem,
  updateItem,
  toggleItem,
  deleteItem
}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await fetchItems(true);
      setItems(data || []);
    } catch (error) {
      setErrorMessage(error.message || `Nao foi possivel carregar ${entityLabel}.`);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setSelectedItem(null);
    setErrorMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setSelectedItem(item);
    setErrorMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setSelectedItem(null);
    setErrorMessage("");
  }

  async function handleSubmit(payload) {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (selectedItem) {
        const updated = await updateItem(selectedItem.id, payload);
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback({ type: "success", message: `${entityLabel} atualizado com sucesso.` });
      } else {
        const created = await createItem(payload);
        setItems((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        setFeedback({ type: "success", message: `${entityLabel} criado com sucesso.` });
      }

      closeModal();
    } catch (error) {
      setErrorMessage(error.message || `Nao foi possivel salvar ${entityLabel}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(item) {
    try {
      const updated = await toggleItem(item.id, !item.ativo);
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setFeedback({
        type: "success",
        message: updated.ativo ? `${entityLabel} reativado.` : `${entityLabel} inativado.`
      });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || `Nao foi possivel alterar ${entityLabel}.` });
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Deseja excluir ${entityLabel.toLowerCase()} "${item.nome}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteItem(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setFeedback({ type: "success", message: `${entityLabel} excluido com sucesso.` });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || `Nao foi possivel excluir ${entityLabel}.` });
    }
  }

  return (
    <section className="page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="primary-button" onClick={openCreateModal}>
            Novo
          </button>
        </div>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}
        {errorMessage && !isModalOpen ? <div className="form-feedback error">{errorMessage}</div> : null}

        {isLoading ? (
          <div className="empty-state">Carregando classificacoes...</div>
        ) : items.length ? (
          <div className="classification-grid">
            {items.map((item) => (
              <div key={item.id} className="classification-card">
                <div className="classification-card-header">
                  <strong>{item.nome}</strong>
                  <span className={`status-pill ${item.ativo ? "status-livre" : "status-bloqueado"}`}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p>{item.descricao || "Sem descricao cadastrada."}</p>
                <div className="room-card-actions">
                  <button type="button" className="ghost-button" onClick={() => openEditModal(item)}>
                    Editar
                  </button>
                  <button type="button" className="secondary-button" onClick={() => handleToggle(item)}>
                    {item.ativo ? "Inativar" : "Ativar"}
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(item)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum cadastro encontrado.</div>
        )}
      </article>

      <RoomClassificationFormModal
        isOpen={isModalOpen}
        title={selectedItem ? `Editar ${entityLabel}` : `Novo ${entityLabel}`}
        item={selectedItem}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </section>
  );
}
