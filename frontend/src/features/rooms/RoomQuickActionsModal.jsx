function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function RoomQuickActionsModal({
  room,
  onClose,
  onEdit,
  onStatusChange,
  onNavigateReservations,
  onNavigatePos
}) {
  if (!room) {
    return null;
  }

  const actionsByStatus = {
    livre: [
      { label: "Nova reserva", onClick: onNavigateReservations, tone: "primary-button" },
      { label: "Check-in rapido", onClick: onNavigateReservations, tone: "secondary-button" },
      { label: "Editar quarto", onClick: () => onEdit(room), tone: "ghost-button" },
      { label: "Bloquear quarto", onClick: () => onStatusChange(room, "bloqueado"), tone: "danger-button" }
    ],
    reservado: [
      { label: "Nova reserva", onClick: onNavigateReservations, tone: "primary-button" },
      { label: "Editar quarto", onClick: () => onEdit(room), tone: "ghost-button" },
      { label: "Bloquear quarto", onClick: () => onStatusChange(room, "bloqueado"), tone: "danger-button" }
    ],
    ocupado: [
      { label: "Ver hospedagem", onClick: onNavigateReservations, tone: "primary-button" },
      { label: "Lancar consumo", onClick: onNavigatePos, tone: "secondary-button" },
      { label: "Check-out", onClick: onNavigateReservations, tone: "ghost-button" },
      { label: "Editar quarto", onClick: () => onEdit(room), tone: "ghost-button" }
    ],
    limpeza: [
      { label: "Marcar como livre", onClick: () => onStatusChange(room, "livre"), tone: "primary-button" },
      { label: "Editar quarto", onClick: () => onEdit(room), tone: "ghost-button" }
    ],
    manutencao: [
      { label: "Finalizar manutencao", onClick: () => onStatusChange(room, "livre"), tone: "primary-button" },
      { label: "Editar quarto", onClick: () => onEdit(room), tone: "ghost-button" }
    ],
    bloqueado: [
      { label: "Liberar bloqueio", onClick: () => onStatusChange(room, "livre"), tone: "primary-button" },
      { label: "Editar quarto", onClick: () => onEdit(room), tone: "ghost-button" }
    ]
  };

  const actions = actionsByStatus[room.displayStatus] || actionsByStatus.livre;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card modal-card-compact" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading room-form-heading">
          <div>
            <h2>Quarto {room.numero}</h2>
            <p>{room.tipo_acomodacao} | {room.tipo_quarto}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="room-quick-summary">
          <span className={`status-pill status-${room.displayStatus}`}>{room.displayStatusLabel}</span>
          <span>Capacidade: {room.capacidade}</span>
          <span>Diaria: {formatCurrency(room.valor_diaria)}</span>
          <span>{room.guestName ? `Hospede: ${room.guestName}` : "Sem hospedagem ativa"}</span>
        </div>

        <div className="quick-actions-grid">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={action.tone}
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
