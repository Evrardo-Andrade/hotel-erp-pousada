import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  createGuest,
  deleteGuest,
  deleteGuestDocument,
  downloadGuestDocument,
  fetchGuest,
  fetchGuestDocuments,
  fetchGuests,
  updateGuest,
  uploadGuestDocument,
  viewGuestDocument
} from "../../services/api";
import { GuestFormModal } from "./GuestFormModal.jsx";

const draftStorageKey = "guest-complete-draft";

export function GuestsPage() {
  const location = useLocation();
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadGuests();
  }, []);

  useEffect(() => {
    const draft = window.sessionStorage.getItem(draftStorageKey);
    const shouldOpenCreate = location.search.includes("mode=create");

    if (!draft && !shouldOpenCreate) {
      return;
    }

    try {
      const parsedDraft = draft ? JSON.parse(draft) : {};
      setSelectedGuest({
        ...parsedDraft,
        nome: parsedDraft.nome || "",
        cpf: parsedDraft.cpf || "",
        telefone: parsedDraft.telefone || "",
        email: parsedDraft.email || "",
        cidade: parsedDraft.cidade || "",
        uf: parsedDraft.uf || ""
      });
      setModalMode("create");
      setDocuments([]);
      setIsModalOpen(true);
      window.sessionStorage.removeItem(draftStorageKey);
    } catch (_error) {
      window.sessionStorage.removeItem(draftStorageKey);
    }
  }, [location.search]);

  async function loadGuests() {
    try {
      setIsLoading(true);
      const data = await fetchGuests();
      setGuests(data || []);
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel carregar os hospedes." });
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedGuest(null);
    setDocuments([]);
    setErrorMessage("");
    setIsModalOpen(true);
  }

  async function openEditModal(guestId) {
    try {
      setIsLoading(true);
      const [guest, guestDocuments] = await Promise.all([
        fetchGuest(guestId),
        fetchGuestDocuments(guestId)
      ]);
      setSelectedGuest(guest);
      setDocuments(guestDocuments || []);
      setModalMode("edit");
      setErrorMessage("");
      setIsModalOpen(true);
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel abrir o hospede." });
    } finally {
      setIsLoading(false);
    }
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
    setSelectedGuest(null);
    setDocuments([]);
    setErrorMessage("");
  }

  async function handleSubmit(payload) {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const hasDocument = Boolean(payload.cpf || payload.numero_documento);
      if (!payload.nome) {
        throw new Error("Nome do hospede e obrigatorio.");
      }
      if (!hasDocument) {
        throw new Error("Informe pelo menos um documento do hospede.");
      }
      if (payload.email && !String(payload.email).includes("@")) {
        throw new Error("Informe um e-mail valido.");
      }
      if (payload.data_nascimento && Number.isNaN(new Date(payload.data_nascimento).getTime())) {
        throw new Error("Data de nascimento invalida.");
      }

      const age = payload.data_nascimento ? new Date().getFullYear() - new Date(payload.data_nascimento).getFullYear() : null;
      const isMinor = age !== null && age < 18;
      if (isMinor && (!payload.responsavel_legal_nome || !payload.responsavel_legal_cpf || !payload.responsavel_legal_telefone)) {
        throw new Error("Hospede menor de idade exige responsavel legal completo.");
      }

      if (modalMode === "edit" && selectedGuest?.id) {
        const updated = await updateGuest(selectedGuest.id, payload);
        setGuests((current) => current.map((item) => item.id === updated.id ? updated : item));
        setSelectedGuest(updated);
        setFeedback({ type: "success", message: `Hospede ${updated.nome} atualizado com sucesso.` });
      } else {
        const created = await createGuest(payload);
        setGuests((current) => [created, ...current]);
        setSelectedGuest(created);
        setModalMode("edit");
        setFeedback({ type: "success", message: `Hospede ${created.nome} cadastrado com sucesso.` });
      }
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar o hospede.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteGuest(guest) {
    if (!window.confirm(`Deseja remover o hospede ${guest.nome}?`)) {
      return;
    }

    try {
      await deleteGuest(guest.id);
      setGuests((current) => current.filter((item) => item.id !== guest.id));
      setFeedback({ type: "success", message: "Hospede removido com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel remover o hospede." });
    }
  }

  async function handleUploadDocument(payload) {
    if (!selectedGuest?.id) {
      return;
    }

    try {
      const created = await uploadGuestDocument(selectedGuest.id, payload);
      setDocuments((current) => [created, ...current]);
      const updatedGuest = await fetchGuest(selectedGuest.id);
      setSelectedGuest(updatedGuest);
      setGuests((current) => current.map((item) => item.id === updatedGuest.id ? updatedGuest : item));
      setFeedback({ type: "success", message: "Documento anexado com sucesso." });
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel anexar o documento.");
    }
  }

  async function handleViewDocument(guestDocument) {
    try {
      setErrorMessage("");
      const result = await viewGuestDocument(selectedGuest.id, guestDocument.id);
      window.open(result.content_url, "_blank");
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel visualizar o documento." });
    }
  }

  async function handleDownloadDocument(guestDocument) {
    try {
      setErrorMessage("");
      const result = await downloadGuestDocument(selectedGuest.id, guestDocument.id);
      const anchor = window.document.createElement("a");
      anchor.href = result.content_url;
      anchor.download = result.filename || guestDocument.original_filename || "documento";
      anchor.rel = "noopener";
      anchor.click();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel baixar o documento." });
    }
  }

  async function handleDeleteDocument(document) {
    if (!selectedGuest?.id) {
      return;
    }
    if (!window.confirm("Deseja remover este documento?")) {
      return;
    }

    try {
      await deleteGuestDocument(selectedGuest.id, document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      const updatedGuest = await fetchGuest(selectedGuest.id);
      setSelectedGuest(updatedGuest);
      setGuests((current) => current.map((item) => item.id === updatedGuest.id ? updatedGuest : item));
      setFeedback({ type: "success", message: "Documento removido com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel remover o documento." });
    }
  }

  return (
    <section className="page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Hospedes</h2>
            <p>Cadastro completo, controle documental, LGPD e dados de check-in.</p>
          </div>
          <div className="room-card-actions">
            <button type="button" className="primary-button" onClick={openCreateModal}>
              Novo Hospede
            </button>
          </div>
        </div>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}

        {isLoading ? (
          <div className="empty-state">Carregando hospedes...</div>
        ) : (
          <div className="table-like">
            {guests.map((guest) => (
              <div key={guest.id} className="table-row guest-row-card">
                <div>
                  <strong>{guest.nome}</strong>
                  <span>{guest.tipo_documento || "Documento"} • {guest.numero_documento || guest.cpf || "Nao informado"}</span>
                  <small>{guest.cidade || "Cidade nao informada"}/{guest.uf || "--"} • {guest.telefone || "Sem telefone"}</small>
                </div>
                <div className="guest-badge-row">
                  {guest.badges?.cadastro_completo ? <span className="status-pill status-hospedado">cadastro completo</span> : null}
                  {guest.badges?.documento_pendente ? <span className="status-pill status-pendente">documento pendente</span> : null}
                  {guest.badges?.documento_conferido ? <span className="status-pill status-confirmada">documento conferido</span> : null}
                  {guest.badges?.menor_idade ? <span className="status-pill status-cancelada">menor de idade</span> : null}
                  {guest.badges?.lgpd_pendente ? <span className="status-pill status-pre_reserva">LGPD pendente</span> : null}
                </div>
                <div className="room-card-actions">
                  <button type="button" className="ghost-button" onClick={() => openEditModal(guest.id)}>Editar</button>
                  <button type="button" className="danger-button" onClick={() => handleDeleteGuest(guest)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <GuestFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        guest={selectedGuest}
        documents={documents}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onUploadDocument={handleUploadDocument}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onDeleteDocument={handleDeleteDocument}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </section>
  );
}
