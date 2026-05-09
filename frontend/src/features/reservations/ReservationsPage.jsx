import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCombo,
  createGuest,
  createReservation,
  deleteCombo,
  deleteReservation,
  executeReservationCombo,
  fetchCombos,
  fetchReservationConsumption,
  fetchReservationMetadata,
  fetchReservations,
  updateCombo,
  updateReservation,
  updateReservationStatus
} from "../../services/api";
import { ReservationCalendar } from "./ReservationCalendar.jsx";
import { ReservationDrawer } from "./ReservationDrawer.jsx";
import { QuickGuestModal } from "./QuickGuestModal.jsx";
import { ComboDefinitionModal } from "./ComboDefinitionModal.jsx";

export function ReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [metadata, setMetadata] = useState({
    hospedes: [],
    quartos: [],
    produtos: [],
    combos: [],
    origensReserva: [],
    statusesReserva: [],
    statusesCombo: [],
    tiposAcomodacao: [],
    tiposQuarto: []
  });
  const [combos, setCombos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState("create");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestModalError, setGuestModalError] = useState("");
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [comboModalError, setComboModalError] = useState("");
  const [consumption, setConsumption] = useState(null);

  useEffect(() => {
    loadModule();
  }, []);

  const roomTypes = useMemo(() => {
    const unique = new Map();
    metadata.quartos.forEach((room) => {
      unique.set(room.tipo_quarto_id, { id: room.tipo_quarto_id, nome: room.tipo_quarto });
    });
    return Array.from(unique.values());
  }, [metadata.quartos]);

  const accommodationTypes = useMemo(() => {
    const unique = new Map();
    metadata.quartos.forEach((room) => {
      unique.set(room.tipo_acomodacao_id, { id: room.tipo_acomodacao_id, nome: room.tipo_acomodacao });
    });
    return Array.from(unique.values());
  }, [metadata.quartos]);

  async function loadModule() {
    try {
      setIsLoading(true);
      const [reservationData, metadataData, combosData] = await Promise.all([
        fetchReservations(),
        fetchReservationMetadata(),
        fetchCombos()
      ]);

      setReservations(reservationData || []);
      setCombos(combosData || []);
      setMetadata({
        ...(metadataData || {}),
        combos: combosData || metadataData?.combos || [],
        tiposAcomodacao: accommodationTypes,
        tiposQuarto: roomTypes
      });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Falha ao carregar modulo de reservas." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setMetadata((current) => ({
      ...current,
      tiposAcomodacao: accommodationTypes,
      tiposQuarto: roomTypes,
      combos
    }));
  }, [accommodationTypes, roomTypes, combos]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setSelectedReservation(null);
    setConsumption(null);
    setErrorMessage("");
    setIsDrawerOpen(true);
  }

  async function openViewDrawer(reservation) {
    setDrawerMode("view");
    setSelectedReservation(reservation);
    setErrorMessage("");
    setIsDrawerOpen(true);
    setConsumption(await fetchReservationConsumption(reservation.id).catch(() => null));
  }

  function openEditDrawer(reservation) {
    setDrawerMode("edit");
    setSelectedReservation(reservation);
    setConsumption(null);
    setErrorMessage("");
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    if (isSubmitting) {
      return;
    }

    setIsDrawerOpen(false);
    setSelectedReservation(null);
    setErrorMessage("");
  }

  async function handleReservationSubmit(payload) {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (drawerMode === "edit" && selectedReservation) {
        const updated = await updateReservation(selectedReservation.id, payload);
        setReservations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedReservation(updated);
        setFeedback({ type: "success", message: `Reserva ${updated.codigo_reserva} atualizada com sucesso.` });
      } else {
        const created = await createReservation(payload);
        setReservations((current) => [created, ...current]);
        setFeedback({ type: "success", message: `Reserva ${created.codigo_reserva} criada com sucesso.` });
      }

      closeDrawer();
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar a reserva.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(status) {
    if (!selectedReservation) {
      return;
    }

    try {
      const updated = await updateReservationStatus(selectedReservation.id, status);
      setReservations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedReservation(updated);
      setFeedback({ type: "success", message: `Status da reserva alterado para ${status}.` });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel atualizar o status." });
    }
  }

  async function handleDeleteReservation(reservation) {
    if (!window.confirm(`Deseja excluir a reserva ${reservation.codigo_reserva}?`)) {
      return;
    }

    try {
      await deleteReservation(reservation.id);
      setReservations((current) => current.filter((item) => item.id !== reservation.id));
      setFeedback({ type: "success", message: "Reserva removida com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel remover a reserva." });
    }
  }

  async function handleQuickGuest(payload) {
    try {
      setIsSubmitting(true);
      setGuestModalError("");
      const guest = await createGuest(payload);
      const updatedGuests = [...metadata.hospedes, guest];
      setMetadata((current) => ({ ...current, hospedes: updatedGuests }));
      setIsGuestModalOpen(false);
      setFeedback({ type: "success", message: `Hospede ${guest.nome} criado com sucesso.` });
    } catch (error) {
      setGuestModalError(error.message || "Nao foi possivel criar o hospede.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenCompleteGuest(payload) {
    window.sessionStorage.setItem("guest-complete-draft", JSON.stringify(payload || {}));
    navigate("/guests?mode=create");
  }

  async function handleComboSubmit(payload) {
    try {
      setIsSubmitting(true);
      setComboModalError("");
      if (selectedCombo) {
        const updated = await updateCombo(selectedCombo.id, payload);
        setCombos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback({ type: "success", message: `Combo ${updated.nome} atualizado com sucesso.` });
      } else {
        const created = await createCombo(payload);
        setCombos((current) => [created, ...current]);
        setFeedback({ type: "success", message: `Combo ${created.nome} criado com sucesso.` });
      }
      setIsComboModalOpen(false);
      setSelectedCombo(null);
    } catch (error) {
      setComboModalError(error.message || "Nao foi possivel salvar o combo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCombo(combo) {
    if (!window.confirm(`Deseja remover o combo ${combo.nome}?`)) {
      return;
    }

    try {
      await deleteCombo(combo.id);
      setCombos((current) => current.filter((item) => item.id !== combo.id));
      setFeedback({ type: "success", message: "Combo removido com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel remover o combo." });
    }
  }

  async function handleExecuteCombo(reservationComboItemId) {
    if (!selectedReservation) {
      return;
    }

    try {
      await executeReservationCombo(selectedReservation.id, reservationComboItemId);
      const updatedReservation = await fetchReservations().then((items) =>
        items.find((item) => item.id === selectedReservation.id)
      );
      setReservations((current) =>
        current.map((item) => (item.id === updatedReservation.id ? updatedReservation : item))
      );
      setSelectedReservation(updatedReservation);
      setConsumption(await fetchReservationConsumption(selectedReservation.id).catch(() => null));
      setFeedback({ type: "success", message: "Combo executado e estoque baixado." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Nao foi possivel executar o combo." });
    }
  }

  return (
    <section className="page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Reservas profissionais</h2>
            <p>Fluxo completo de hospedagem, pagamentos e experiencias</p>
          </div>
          <div className="room-card-actions">
            <button type="button" className="ghost-button" onClick={() => { setSelectedCombo(null); setIsComboModalOpen(true); }}>
              Novo Combo
            </button>
            <button type="button" className="primary-button" onClick={openCreateDrawer}>
              Nova Reserva
            </button>
          </div>
        </div>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}

        {isLoading ? (
          <div className="empty-state">Carregando reservas...</div>
        ) : (
          <div className="reservations-layout">
            <div className="stack-list">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="reservation-row-card">
                  <div className="reservation-row-main">
                    <div>
                      <strong>{reservation.codigo_reserva}</strong>
                      <p>{reservation.hospede_nome}</p>
                    </div>
                    <div className="reservation-meta-grid">
                      <span>Quarto {reservation.quarto_numero}</span>
                      <span>{reservation.data_checkin} ate {reservation.data_checkout}</span>
                      <span>{reservation.numero_diarias} diarias</span>
                      <span>R$ {Number(reservation.valor_total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="reservation-row-side">
                    <span className={`status-pill status-${reservation.status}`}>{reservation.status}</span>
                    <small>{reservation.status_pagamento}</small>
                    <div className="room-card-actions">
                      <button type="button" className="ghost-button" onClick={() => openViewDrawer(reservation)}>Detalhes</button>
                      <button type="button" className="ghost-button" onClick={() => openEditDrawer(reservation)}>Editar</button>
                      <button type="button" className="danger-button" onClick={() => handleDeleteReservation(reservation)}>Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <ReservationCalendar
              rooms={metadata.quartos}
              reservations={reservations}
              onReservationClick={openEditDrawer}
            />
          </div>
        )}
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Combos e experiencias</h2>
            <p>Cadastro e composicao operacional vinculada a produtos</p>
          </div>
        </div>

        <div className="table-like">
          {combos.map((combo) => (
            <div key={combo.id} className="table-row combo-row">
              <div>
                <strong>{combo.nome}</strong>
                <span>{combo.descricao}</span>
              </div>
              <div className="combo-row-meta">
                <span>R$ {Number(combo.preco).toFixed(2)}</span>
                <span>{combo.limite_por_dia}/dia</span>
                <small>{combo.ativo ? "ativo" : "inativo"}</small>
              </div>
              <div className="room-card-actions">
                <button type="button" className="ghost-button" onClick={() => { setSelectedCombo(combo); setIsComboModalOpen(true); }}>
                  Editar
                </button>
                <button type="button" className="danger-button" onClick={() => handleDeleteCombo(combo)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <ReservationDrawer
        isOpen={isDrawerOpen}
        mode={drawerMode}
        reservation={selectedReservation}
        metadata={metadata}
        reservations={reservations}
        onClose={closeDrawer}
        onSubmit={handleReservationSubmit}
        onQuickGuest={() => setIsGuestModalOpen(true)}
        onStatusChange={handleStatusChange}
        onExecuteCombo={handleExecuteCombo}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />

      <QuickGuestModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onSubmit={handleQuickGuest}
        onOpenComplete={handleOpenCompleteGuest}
        isSubmitting={isSubmitting}
        errorMessage={guestModalError}
      />

      <ComboDefinitionModal
        isOpen={isComboModalOpen}
        combo={selectedCombo}
        products={metadata.produtos}
        onClose={() => { setIsComboModalOpen(false); setSelectedCombo(null); }}
        onSubmit={handleComboSubmit}
        isSubmitting={isSubmitting}
        errorMessage={comboModalError}
      />

      {consumption && drawerMode === "view" ? (
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Consumo da reserva</h2>
              <p>Vendas, combos executados e movimentos de estoque</p>
            </div>
          </div>
          <pre className="config-preview">{JSON.stringify(consumption, null, 2)}</pre>
        </article>
      ) : null}
    </section>
  );
}
