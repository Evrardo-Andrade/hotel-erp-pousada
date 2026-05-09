function buildDays(total = 14) {
  return Array.from({ length: total }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      weekDay: date.toLocaleDateString("pt-BR", { weekday: "short" })
    };
  });
}

function getCellStatus(room, dayKey, reservations) {
  if (room.status === "manutencao") {
    return { status: "manutencao", reservation: null };
  }

  const reservation = reservations.find((item) => {
    if (item.quarto_id !== room.id) {
      return false;
    }

    return item.data_checkin <= dayKey && item.data_checkout >= dayKey;
  });

  if (!reservation) {
    return { status: "disponivel", reservation: null };
  }

  if (reservation.status === "hospedado" || reservation.status === "checkin_realizado") {
    return { status: "hospedado", reservation };
  }

  if (reservation.status === "confirmada" || reservation.status === "pendente" || reservation.status === "pre_reserva") {
    return { status: "reservado", reservation };
  }

  return { status: "bloqueado", reservation };
}

export function ReservationCalendar({ rooms, reservations, onReservationClick }) {
  const days = buildDays();

  return (
    <article className="panel reservation-calendar-panel">
      <div className="panel-heading">
        <div>
          <h2>Calendario operacional</h2>
          <p>Ocupacao, check-ins, check-outs e disponibilidade por quarto</p>
        </div>
      </div>

      <div className="calendar-shell">
        <div className="calendar-header sticky-room">Quarto</div>
        {days.map((day) => (
          <div key={day.key} className="calendar-header">
            <strong>{day.label}</strong>
            <small>{day.weekDay}</small>
          </div>
        ))}

        {rooms.map((room) => (
          <Fragment key={room.id}>
            <div key={`${room.id}-label`} className="calendar-room sticky-room">
              <strong>{room.numero}</strong>
              <small>{room.tipo_quarto}</small>
            </div>
            {days.map((day) => {
              const cell = getCellStatus(room, day.key, reservations);
              return (
                <button
                  key={`${room.id}-${day.key}`}
                  type="button"
                  className={`calendar-cell calendar-${cell.status}`}
                  onClick={() => cell.reservation && onReservationClick(cell.reservation)}
                >
                  {cell.reservation ? cell.reservation.hospede_nome.split(" ")[0] : ""}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="calendar-legend">
        <span className="legend-pill disponivel">Disponivel</span>
        <span className="legend-pill reservado">Reservado</span>
        <span className="legend-pill hospedado">Hospedado</span>
        <span className="legend-pill manutencao">Manutencao</span>
        <span className="legend-pill bloqueado">Bloqueado</span>
      </div>
    </article>
  );
}
import { Fragment } from "react";
