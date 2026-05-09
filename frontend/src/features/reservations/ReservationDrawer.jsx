import { useEffect, useMemo, useState } from "react";

const initialReservation = {
  hospede_id: "",
  documento: "",
  telefone: "",
  email: "",
  codigo_reserva: "",
  data_checkin: "",
  data_checkout: "",
  adultos: 1,
  criancas: 0,
  quantidade_hospedes: 1,
  observacoes: "",
  tipo_acomodacao_id: "",
  tipo_quarto_id: "",
  quarto_id: "",
  valor_diaria: 0,
  taxas_adicionais: 0,
  desconto: 0,
  forma_pagamento: "",
  status_pagamento: "pendente",
  valor_pago: 0,
  origem: "WhatsApp",
  observacoes_internas: "",
  preferencias_hospede: "",
  status: "pendente",
  combos: []
};

function normalizeReservation(reservation) {
  if (!reservation) {
    return initialReservation;
  }

  return {
    ...initialReservation,
    ...reservation,
    tipo_acomodacao_id: reservation.tipo_acomodacao_id || "",
    tipo_quarto_id: reservation.tipo_quarto_id || "",
    combos: reservation.combos || []
  };
}

function calculateNights(checkin, checkout) {
  if (!checkin || !checkout) {
    return 0;
  }

  const start = new Date(checkin);
  const end = new Date(checkout);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function ReservationDrawer({
  isOpen,
  mode,
  reservation,
  metadata,
  reservations,
  onClose,
  onSubmit,
  onQuickGuest,
  onStatusChange,
  onExecuteCombo,
  isSubmitting,
  errorMessage
}) {
  const [form, setForm] = useState(initialReservation);

  useEffect(() => {
    if (isOpen) {
      setForm(normalizeReservation(reservation));
    }
  }, [isOpen, reservation]);

  const nights = useMemo(
    () => calculateNights(form.data_checkin, form.data_checkout),
    [form.data_checkin, form.data_checkout]
  );

  const availableRooms = useMemo(() => {
    return metadata.quartos.filter((room) => {
      if (form.tipo_acomodacao_id && room.tipo_acomodacao_id !== form.tipo_acomodacao_id) {
        return false;
      }

      if (form.tipo_quarto_id && room.tipo_quarto_id !== form.tipo_quarto_id) {
        return false;
      }

      if (room.status === "manutencao") {
        return false;
      }

      const occupied = reservations.some((item) => {
        if (reservation?.id && item.id === reservation.id) {
          return false;
        }

        if (item.quarto_id !== room.id) {
          return false;
        }

        if (!["pre_reserva", "pendente", "confirmada", "checkin_realizado", "hospedado"].includes(item.status)) {
          return false;
        }

        return item.data_checkin <= form.data_checkout && item.data_checkout >= form.data_checkin;
      });

      return !occupied || room.id === form.quarto_id;
    });
  }, [form.tipo_acomodacao_id, form.tipo_quarto_id, form.data_checkin, form.data_checkout, form.quarto_id, metadata.quartos, reservation?.id, reservations]);

  const selectedGuest = metadata.hospedes.find((item) => item.id === form.hospede_id);
  const selectedRoom = metadata.quartos.find((item) => item.id === form.quarto_id);
  const comboDefinitions = metadata.combos || [];

  const computed = useMemo(() => {
    const subtotal = Number(form.valor_diaria || 0) * nights;
    const comboTotal = (form.combos || []).reduce((sum, combo) => sum + Number(combo.valor_total || 0), 0);
    const total = subtotal + Number(form.taxas_adicionais || 0) - Number(form.desconto || 0) + comboTotal;
    const amountPaid = Number(form.valor_pago || 0);

    return {
      subtotal,
      comboTotal,
      total,
      amountPaid,
      pending: total - amountPaid
    };
  }, [form, nights]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleGuestChange(guestId) {
    const guest = metadata.hospedes.find((item) => item.id === guestId);
    setForm((current) => ({
      ...current,
      hospede_id: guestId,
      documento: guest?.cpf || "",
      telefone: guest?.telefone || "",
      email: guest?.email || ""
    }));
  }

  function handleComboAdd(comboId) {
    const combo = comboDefinitions.find((item) => item.id === comboId);

    if (!combo) {
      return;
    }

    setForm((current) => ({
      ...current,
      combos: [
        ...current.combos,
        {
          id: `${comboId}-${Date.now()}`,
          combo_definition_id: combo.id,
          combo_nome: combo.nome,
          quantidade: 1,
          preco_unitario: combo.preco,
          valor_total: combo.preco,
          status: "contratado",
          data_agendada: "",
          observacoes: ""
        }
      ]
    }));
  }

  function updateCombo(index, field, value) {
    setForm((current) => ({
      ...current,
      combos: current.combos.map((combo, comboIndex) => {
        if (comboIndex !== index) {
          return combo;
        }

        const updated = { ...combo, [field]: value };
        updated.valor_total = Number(updated.quantidade || 0) * Number(updated.preco_unitario || 0);
        return updated;
      })
    }));
  }

  function removeCombo(index) {
    setForm((current) => ({
      ...current,
      combos: current.combos.filter((_, comboIndex) => comboIndex !== index)
    }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      adultos: Number(form.adultos),
      criancas: Number(form.criancas),
      quantidade_hospedes: Number(form.quantidade_hospedes || Number(form.adultos) + Number(form.criancas)),
      valor_diaria: Number(form.valor_diaria),
      taxas_adicionais: Number(form.taxas_adicionais),
      desconto: Number(form.desconto),
      valor_pago: Number(form.valor_pago),
      combos: form.combos.map((combo) => ({
        ...combo,
        quantidade: Number(combo.quantidade),
        preco_unitario: Number(combo.preco_unitario),
        valor_total: Number(combo.valor_total)
      }))
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="drawer-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading room-form-heading">
          <div>
            <h2>
              {mode === "create" ? "Nova Reserva" : mode === "edit" ? "Editar Reserva" : "Detalhes da Reserva"}
            </h2>
            <p>Fluxo operacional completo para hospedagem, pagamento e experiencias</p>
          </div>
          <div className="drawer-header-actions">
            {mode !== "create" ? (
              <>
                <button type="button" className="ghost-button" onClick={() => onStatusChange("confirmada")}>Confirmar</button>
                <button type="button" className="ghost-button" onClick={() => onStatusChange("checkin_realizado")}>Check-in</button>
                <button type="button" className="ghost-button" onClick={() => onStatusChange("checkout_realizado")}>Check-out</button>
                <button type="button" className="danger-button" onClick={() => onStatusChange("cancelada")}>Cancelar</button>
              </>
            ) : null}
            <button type="button" className="ghost-button" onClick={onClose}>Fechar</button>
          </div>
        </div>

        <form className="room-form" onSubmit={submit}>
          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Dados do hospede</h3>
              <p>Selecione o hospede principal ou cadastre rapidamente</p>
            </div>
            <div className="room-form-grid">
              <label className="field">
                <span>Hospede principal</span>
                <select value={form.hospede_id} onChange={(event) => handleGuestChange(event.target.value)} required disabled={mode === "view"}>
                  <option value="">Selecione</option>
                  {metadata.hospedes.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.nome}
                    </option>
                  ))}
                </select>
              </label>
              <div className="inline-action-field">
                <span className="inline-label">Cadastro rapido</span>
                <button type="button" className="ghost-button" onClick={onQuickGuest} disabled={mode === "view"}>
                  Novo Hospede
                </button>
              </div>
              <label className="field">
                <span>Documento</span>
                <input name="documento" value={form.documento} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Telefone</span>
                <input name="telefone" value={form.telefone} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={handleChange} disabled={mode === "view"} />
              </label>
              {selectedGuest ? (
                <div className="data-highlight">
                  <strong>{selectedGuest.nome}</strong>
                  <span>{selectedGuest.cpf}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Reserva</h3>
              <p>Datas, codigo, origem e composicao de hospedes</p>
            </div>
            <div className="room-form-grid">
              <label className="field">
                <span>Codigo da reserva</span>
                <input name="codigo_reserva" value={form.codigo_reserva} onChange={handleChange} disabled={mode === "view"} placeholder="Gerado automaticamente se vazio" />
              </label>
              <label className="field">
                <span>Origem</span>
                <select name="origem" value={form.origem} onChange={handleChange} disabled={mode === "view"}>
                  {metadata.origensReserva.map((origin) => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Check-in</span>
                <input name="data_checkin" type="date" value={form.data_checkin} onChange={handleChange} required disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Check-out</span>
                <input name="data_checkout" type="date" value={form.data_checkout} onChange={handleChange} required disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Adultos</span>
                <input name="adultos" type="number" min="0" value={form.adultos} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Criancas</span>
                <input name="criancas" type="number" min="0" value={form.criancas} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Quantidade de hospedes</span>
                <input name="quantidade_hospedes" type="number" min="1" value={form.quantidade_hospedes} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <div className="data-highlight">
                <strong>{nights} diarias</strong>
                <span>Status: {form.status}</span>
              </div>
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Acomodacao</h3>
              <p>Selecione a classificacao e um quarto disponivel</p>
            </div>
            <div className="room-form-grid">
              <label className="field">
                <span>Tipo acomodacao</span>
                <select name="tipo_acomodacao_id" value={form.tipo_acomodacao_id} onChange={handleChange} disabled={mode === "view"}>
                  <option value="">Todos</option>
                  {metadata.tiposAcomodacao.map((item) => (
                    <option key={item.id} value={item.id}>{item.nome}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tipo quarto</span>
                <select name="tipo_quarto_id" value={form.tipo_quarto_id} onChange={handleChange} disabled={mode === "view"}>
                  <option value="">Todos</option>
                  {metadata.tiposQuarto.map((item) => (
                    <option key={item.id} value={item.id}>{item.nome}</option>
                  ))}
                </select>
              </label>
              <label className="field span-two">
                <span>Quarto disponivel</span>
                <select name="quarto_id" value={form.quarto_id} onChange={handleChange} required disabled={mode === "view"}>
                  <option value="">Selecione</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Quarto {room.numero} - {room.tipo_acomodacao} / {room.tipo_quarto}
                    </option>
                  ))}
                </select>
              </label>
              {selectedRoom ? (
                <div className="data-highlight span-two">
                  <strong>Capacidade maxima: {selectedRoom.capacidade}</strong>
                  <span>Status operacional: {selectedRoom.status}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Pagamento</h3>
              <p>Valores da hospedagem, adicionais, descontos e saldo</p>
            </div>
            <div className="room-form-grid">
              <label className="field">
                <span>Valor diaria</span>
                <input name="valor_diaria" type="number" min="0" step="0.01" value={form.valor_diaria} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Taxas adicionais</span>
                <input name="taxas_adicionais" type="number" min="0" step="0.01" value={form.taxas_adicionais} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Desconto</span>
                <input name="desconto" type="number" min="0" step="0.01" value={form.desconto} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <label className="field">
                <span>Forma pagamento</span>
                <select name="forma_pagamento" value={form.forma_pagamento} onChange={handleChange} disabled={mode === "view"}>
                  <option value="">Selecione</option>
                  <option value="pix">Pix</option>
                  <option value="cartao">Cartao</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="faturado">Faturado</option>
                </select>
              </label>
              <label className="field">
                <span>Status pagamento</span>
                <select name="status_pagamento" value={form.status_pagamento} onChange={handleChange} disabled={mode === "view"}>
                  <option value="pendente">Pendente</option>
                  <option value="parcial">Parcial</option>
                  <option value="pago">Pago</option>
                </select>
              </label>
              <label className="field">
                <span>Valor pago</span>
                <input name="valor_pago" type="number" min="0" step="0.01" value={form.valor_pago} onChange={handleChange} disabled={mode === "view"} />
              </label>
              <div className="payment-summary span-two">
                <span>Hospedagem: R$ {computed.subtotal.toFixed(2)}</span>
                <span>Combos: R$ {computed.comboTotal.toFixed(2)}</span>
                <strong>Total: R$ {computed.total.toFixed(2)}</strong>
                <strong>Saldo pendente: R$ {computed.pending.toFixed(2)}</strong>
              </div>
            </div>
          </section>

          <section className="room-form-section">
            <div className="panel-heading subheading-inline">
              <div>
                <h3>Combos contratados</h3>
                <p>Agende experiencias e execute somente durante a hospedagem</p>
              </div>
              {mode !== "view" ? (
                <select onChange={(event) => event.target.value && handleComboAdd(event.target.value)} defaultValue="">
                  <option value="">Adicionar combo</option>
                  {comboDefinitions.map((combo) => (
                    <option key={combo.id} value={combo.id}>{combo.nome}</option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="combo-items-list">
              {(form.combos || []).map((combo, index) => (
                <div key={combo.id || `${combo.combo_definition_id}-${index}`} className="reservation-combo-card">
                  <div>
                    <strong>{combo.combo_nome}</strong>
                    <small>{combo.status}</small>
                  </div>
                  <div className="reservation-combo-grid">
                    <input type="number" min="1" value={combo.quantidade} onChange={(event) => updateCombo(index, "quantidade", event.target.value)} disabled={mode === "view"} />
                    <input type="number" min="0" step="0.01" value={combo.preco_unitario} onChange={(event) => updateCombo(index, "preco_unitario", event.target.value)} disabled={mode === "view"} />
                    <input type="datetime-local" value={combo.data_agendada ? combo.data_agendada.slice(0, 16) : ""} onChange={(event) => updateCombo(index, "data_agendada", event.target.value)} disabled={mode === "view"} />
                    <select value={combo.status} onChange={(event) => updateCombo(index, "status", event.target.value)} disabled={mode === "view"}>
                      {metadata.statusesCombo.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="reservation-combo-actions">
                    <small>Total: R$ {Number(combo.valor_total || 0).toFixed(2)}</small>
                    {mode !== "view" ? (
                      <button type="button" className="danger-button" onClick={() => removeCombo(index)}>Remover</button>
                    ) : null}
                    {mode !== "create" && combo.id ? (
                      <button type="button" className="ghost-button" onClick={() => onExecuteCombo(combo.id)} disabled={combo.status === "concluido"}>
                        {combo.status === "concluido" ? "Concluido" : "Executar"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="room-form-section">
            <div className="room-form-section-head">
              <h3>Observacoes</h3>
              <p>Registros comerciais e internos para a equipe</p>
            </div>
            <label className="field">
              <span>Observacoes da reserva</span>
              <textarea name="observacoes" rows="3" value={form.observacoes} onChange={handleChange} disabled={mode === "view"} />
            </label>
            <label className="field">
              <span>Observacoes internas</span>
              <textarea name="observacoes_internas" rows="3" value={form.observacoes_internas} onChange={handleChange} disabled={mode === "view"} />
            </label>
            <label className="field">
              <span>Preferencias do hospede</span>
              <textarea name="preferencias_hospede" rows="3" value={form.preferencias_hospede} onChange={handleChange} disabled={mode === "view"} />
            </label>
          </section>

          {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

          {mode !== "view" ? (
            <div className="room-form-actions">
              <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : mode === "edit" ? "Salvar Reserva" : "Criar Reserva"}
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
