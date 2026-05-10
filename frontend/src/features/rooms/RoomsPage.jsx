import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRoomAmenity,
  createRoom,
  createRoomAccommodationType,
  createRoomType,
  deleteRoom,
  fetchReservations,
  fetchRoomMetadata,
  fetchRooms,
  updateRoom,
  updateRoomStatus
} from "../../services/api";
import { RoomFormModal } from "./RoomFormModal.jsx";
import { RoomQuickActionsModal } from "./RoomQuickActionsModal.jsx";

const viewOptions = [
  { value: "cards", label: "Cards detalhados" },
  { value: "map", label: "Mapa visual" }
];

const filterOptions = [
  { value: "all", label: "Todos" },
  { value: "livre", label: "Livres" },
  { value: "ocupado", label: "Ocupados" },
  { value: "reservado", label: "Reservados" },
  { value: "limpeza", label: "Limpeza" },
  { value: "manutencao", label: "Manutencao" },
  { value: "bloqueado", label: "Bloqueados" }
];

const statusLabels = {
  livre: "Livre",
  ocupado: "Ocupado",
  reservado: "Reservado",
  limpeza: "Limpeza",
  manutencao: "Manutencao",
  bloqueado: "Bloqueado"
};

const routeDefaults = {
  all: "all",
  ocupado: "ocupado",
  livre: "livre",
  limpeza: "limpeza",
  manutencao: "manutencao"
};

function normalizeRoomRecord(room) {
  return {
    ...room,
    comodidades: room.comodidades || [],
    descricao: room.descricao || room.observacoes || ""
  };
}

function getRouteFilter(statusFilter) {
  return routeDefaults[statusFilter || "all"] || "all";
}

function formatRoomApiError(error, fallbackMessage) {
  if (error?.status === 403) {
    return "Usuario sem permissao para alterar acomodacoes.";
  }

  if (error?.status === 400 && Array.isArray(error?.details) && error.details.length) {
    const firstIssue = error.details[0];
    const fieldName = Array.isArray(firstIssue?.path) ? firstIssue.path.join(".") : "";
    return fieldName
      ? `Revise o campo ${fieldName}: ${firstIssue.message || "valor invalido"}.`
      : firstIssue.message || fallbackMessage;
  }

  return error?.message || fallbackMessage;
}

export function RoomsPage({
  statusFilter = "all",
  pageTitle = "Visao geral das acomodacoes",
  pageDescription = "Gestao operacional das acomodacoes, status e cadastro.",
  autoOpenCreate = false
}) {
  const navigate = useNavigate();
  const hasAutoOpened = useRef(false);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [metadata, setMetadata] = useState({
    tiposAcomodacao: [],
    tiposQuarto: [],
    comodidades: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedMapRoom, setSelectedMapRoom] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState(getRouteFilter(statusFilter));
  const [viewMode, setViewMode] = useState(() => window.localStorage.getItem("hotel-erp-rooms-view") || "cards");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setQuickFilter(getRouteFilter(statusFilter));
  }, [statusFilter]);

  useEffect(() => {
    window.localStorage.setItem("hotel-erp-rooms-view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (autoOpenCreate && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      openCreateModal();
    }
  }, [autoOpenCreate]);

  async function loadData() {
    try {
      setIsLoading(true);
      setPageError("");

      const [roomData, metadataData, reservationData] = await Promise.all([
        fetchRooms(),
        fetchRoomMetadata(),
        fetchReservations()
      ]);

      setRooms((roomData || []).map(normalizeRoomRecord));
      setMetadata(metadataData || { tiposAcomodacao: [], tiposQuarto: [], comodidades: [] });
      setReservations(reservationData || []);
    } catch (error) {
      setPageError(error.message || "Nao foi possivel carregar os quartos.");
    } finally {
      setIsLoading(false);
    }
  }

  const reservationByRoom = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const map = new Map();

    for (const reservation of reservations || []) {
      const roomId = reservation.quarto_id || reservation.room_id;
      if (!roomId) {
        continue;
      }

      const isActiveStay = ["checkin_realizado", "hospedado"].includes(reservation.status);
      const isFutureReservation = ["pre_reserva", "pendente", "confirmada"].includes(reservation.status) && reservation.data_checkin >= today;

      if (!isActiveStay && !isFutureReservation) {
        continue;
      }

      if (!map.has(roomId)) {
        map.set(roomId, {
          guestName: reservation.hospede_nome || reservation.guest_name || "",
          reservationCode: reservation.codigo_reserva || reservation.code || "",
          future: isFutureReservation,
          active: isActiveStay
        });
      }
    }

    return map;
  }, [reservations]);

  const enhancedRooms = useMemo(() => {
    return rooms.map((room) => {
      const reservationInfo = reservationByRoom.get(room.id);
      const displayStatus =
        room.status === "livre" && reservationInfo?.future
          ? "reservado"
          : room.status;

      return {
        ...room,
        displayStatus,
        displayStatusLabel: statusLabels[displayStatus] || room.status,
        guestName: reservationInfo?.guestName || "",
        reservationCode: reservationInfo?.reservationCode || ""
      };
    });
  }, [rooms, reservationByRoom]);

  const statusSummary = useMemo(() => {
    return enhancedRooms.reduce((summary, room) => {
      summary[room.displayStatus] = (summary[room.displayStatus] || 0) + 1;
      return summary;
    }, {});
  }, [enhancedRooms]);

  const filteredRooms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return enhancedRooms.filter((room) => {
      const matchesRoute = quickFilter === "all" ? true : room.displayStatus === quickFilter;
      const matchesSearch = !term || [
        room.numero,
        room.tipo_acomodacao,
        room.tipo_quarto,
        room.guestName
      ].some((value) => String(value || "").toLowerCase().includes(term));

      return matchesRoute && matchesSearch;
    });
  }, [enhancedRooms, quickFilter, searchTerm]);

  function mergeSortedItems(collection, record) {
    return [...collection.filter((item) => item.id !== record.id), record]
      .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedRoom(null);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(room) {
    setModalMode("edit");
    setSelectedRoom(room);
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal(force = false) {
    if (isSubmitting && !force) {
      return;
    }

    setIsModalOpen(false);
    setSelectedRoom(null);
    setFormError("");

    if (autoOpenCreate) {
      navigate("/rooms");
    }
  }

  async function handleSubmit(payload) {
    try {
      setIsSubmitting(true);
      setFormError("");

      if (modalMode === "edit" && selectedRoom) {
        const updatedRoom = normalizeRoomRecord(await updateRoom(selectedRoom.id, payload));
        setRooms((current) => current.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)));
        setFeedback({ type: "success", message: `Quarto ${updatedRoom.numero} atualizado com sucesso.` });
      } else {
        const newRoom = normalizeRoomRecord(await createRoom(payload));
        setRooms((current) => [newRoom, ...current]);
        setFeedback({ type: "success", message: `Quarto ${newRoom.numero} criado com sucesso.` });
      }

      closeModal(true);
    } catch (error) {
      setFormError(formatRoomApiError(error, "Nao foi possivel salvar a acomodacao."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(room) {
    const confirmed = window.confirm(`Deseja excluir o quarto ${room.numero}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingRoomId(room.id);
      await deleteRoom(room.id);
      setRooms((current) => current.filter((item) => item.id !== room.id));
      setFeedback({ type: "success", message: `Quarto ${room.numero} removido com sucesso.` });
    } catch (error) {
      setFeedback({ type: "error", message: formatRoomApiError(error, "Nao foi possivel excluir a acomodacao.") });
    } finally {
      setDeletingRoomId(null);
    }
  }

  async function handleStatusChange(room, status) {
    try {
      const updated = normalizeRoomRecord(await updateRoomStatus(room.id, status));
      setRooms((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback({ type: "success", message: `Quarto ${updated.numero} atualizado para ${statusLabels[status] || status}.` });
    } catch (error) {
      setFeedback({ type: "error", message: formatRoomApiError(error, "Nao foi possivel atualizar o status da acomodacao.") });
    }
  }

  async function handleCreateAmenity(name) {
    const amenity = await createRoomAmenity({ nome: name });
    setMetadata((current) => ({
      ...current,
      comodidades: mergeSortedItems(current.comodidades || [], amenity)
    }));
    return amenity;
  }

  async function handleCreateAccommodationType(payload) {
    const type = await createRoomAccommodationType(payload);
    setMetadata((current) => ({
      ...current,
      tiposAcomodacao: mergeSortedItems(current.tiposAcomodacao || [], type)
    }));
    return type;
  }

  async function handleCreateRoomType(payload) {
    const type = await createRoomType(payload);
    setMetadata((current) => ({
      ...current,
      tiposQuarto: mergeSortedItems(current.tiposQuarto || [], type)
    }));
    return type;
  }

  function navigateToReservations() {
    navigate("/reservations");
  }

  function navigateToPos() {
    navigate("/pos");
  }

  return (
    <section className="page-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>{pageTitle}</h2>
            <p>{pageDescription}</p>
          </div>
          <div className="room-card-actions">
            <button type="button" className="primary-button" onClick={openCreateModal}>
              Novo Quarto
            </button>
          </div>
        </div>

        <div className="rooms-control-bar">
          <div className="view-switcher">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={viewMode === option.value ? "primary-button" : "ghost-button"}
                onClick={() => setViewMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="field rooms-search-field">
            <span>Busca rapida</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Numero, tipo ou hospede atual"
            />
          </label>
        </div>

        <div className="rooms-filter-strip">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={quickFilter === option.value ? "primary-button" : "ghost-button"}
              onClick={() => setQuickFilter(option.value)}
            >
              {option.label}
              <span className="filter-count">{statusSummary[option.value] || 0}</span>
            </button>
          ))}
        </div>

        <div className="rooms-summary-strip">
          <span className="status-pill">Total exibido: {filteredRooms.length}</span>
          <span className="status-pill">Visao: {viewMode === "map" ? "Mapa visual" : "Cards detalhados"}</span>
        </div>

        {feedback ? <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div> : null}
        {pageError ? <div className="form-feedback error">{pageError}</div> : null}

        {isLoading ? (
          <div className="empty-state">Carregando quartos...</div>
        ) : viewMode === "map" && filteredRooms.length ? (
          <div className="room-map-grid">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`room-map-tile status-${room.displayStatus}`}
                onClick={() => setSelectedMapRoom(room)}
              >
                <span className="room-map-icon">{room.displayStatus === "ocupado" ? "BED" : "DOOR"}</span>
                <strong>{room.numero}</strong>
                <small>{room.displayStatusLabel}</small>
                <small>{room.tipo_quarto}</small>
                {room.guestName ? <span className="room-map-meta">{room.guestName}</span> : null}
              </button>
            ))}
          </div>
        ) : viewMode === "map" ? (
          <div className="empty-state">Nenhum quarto encontrado para este filtro.</div>
        ) : filteredRooms.length ? (
          <div className="room-grid">
            {filteredRooms.map((room) => (
              <div key={room.id} className={`room-card room-card-detailed status-${room.displayStatus}`}>
                <header className="room-card-header">
                  <div>
                    <strong>Quarto {room.numero}</strong>
                    <span className={`status-pill status-${room.displayStatus}`}>{room.displayStatusLabel}</span>
                  </div>
                  <select
                    className="inline-status-select"
                    value={room.status}
                    onChange={(event) => handleStatusChange(room, event.target.value)}
                  >
                    <option value="livre">Livre</option>
                    <option value="ocupado">Ocupado</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="manutencao">Manutencao</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </header>
                <p>{room.tipo_acomodacao}</p>
                <small>{room.tipo_quarto}</small>
                <small>Capacidade: {room.capacidade} hospedes</small>
                <small>{room.andar !== null && room.andar !== undefined ? `Andar: ${room.andar}` : "Sem andar informado"}</small>
                {room.guestName ? <small>Hospede atual: {room.guestName}</small> : null}
                {room.descricao ? (
                  <div className="room-description">{room.descricao}</div>
                ) : (
                  <div className="room-description muted">Sem descricao cadastrada.</div>
                )}
                <div className="room-amenities">
                  {(room.comodidades || []).length ? (
                    room.comodidades.map((amenity) => (
                      <span key={amenity.id} className="amenity-badge">
                        {amenity.nome}
                      </span>
                    ))
                  ) : (
                    <span className="amenity-badge empty">Sem comodidades informadas</span>
                  )}
                </div>
                <div className="room-card-actions">
                  <button type="button" className="ghost-button" onClick={() => openEditModal(room)}>
                    Editar
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setSelectedMapRoom(room)}>
                    Acoes rapidas
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDelete(room)}
                    disabled={deletingRoomId === room.id}
                  >
                    {deletingRoomId === room.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum quarto encontrado para este filtro.</div>
        )}
      </article>

      <RoomFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        room={selectedRoom}
        metadata={metadata}
        onCreateAmenity={handleCreateAmenity}
        onCreateAccommodationType={handleCreateAccommodationType}
        onCreateRoomType={handleCreateRoomType}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={formError}
      />

      <RoomQuickActionsModal
        room={selectedMapRoom}
        onClose={() => setSelectedMapRoom(null)}
        onEdit={openEditModal}
        onStatusChange={handleStatusChange}
        onNavigateReservations={navigateToReservations}
        onNavigatePos={navigateToPos}
      />
    </section>
  );
}
