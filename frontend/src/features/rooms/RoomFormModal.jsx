import { useEffect, useMemo, useState } from "react";
import { AmenitySelector } from "./AmenitySelector.jsx";
import { RoomClassificationFormModal } from "./RoomClassificationFormModal.jsx";

const AMENITIES_HEADER = "Comodidades:";
const AMENITY_PREFIX = "- ";

const initialForm = {
  numero: "",
  tipo_acomodacao_id: "",
  tipo_quarto_id: "",
  capacidade: 1,
  andar: "",
  status: "livre",
  descricao: "",
  manual_descricao: "",
  comodidade_ids: []
};

function extractManualDescription(description) {
  const lines = String(description || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const manualLines = [];
  let insideManagedBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!insideManagedBlock && trimmedLine === AMENITIES_HEADER) {
      insideManagedBlock = true;
      continue;
    }

    if (insideManagedBlock) {
      if (!trimmedLine || trimmedLine.startsWith(AMENITY_PREFIX)) {
        continue;
      }

      insideManagedBlock = false;
    }

    manualLines.push(line);
  }

  return manualLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildDescription(manualDescription, selectedAmenities) {
  const manual = extractManualDescription(manualDescription);
  const amenityNames = Array.from(
    new Set(
      selectedAmenities
        .map((amenity) => amenity?.nome?.trim())
        .filter(Boolean)
    )
  );

  if (!amenityNames.length) {
    return manual;
  }

  const amenityBlock = `${AMENITIES_HEADER}\n${amenityNames.map((name) => `${AMENITY_PREFIX}${name}`).join("\n")}`;

  if (!manual) {
    return amenityBlock;
  }

  return `${manual}\n\n${amenityBlock}`;
}

function normalizeRoom(room) {
  if (!room) {
    return initialForm;
  }

  const manualDescription = extractManualDescription(room.descricao || "");

  return {
    numero: room.numero || "",
    tipo_acomodacao_id: room.tipo_acomodacao_id || "",
    tipo_quarto_id: room.tipo_quarto_id || "",
    capacidade: room.capacidade || 1,
    andar: room.andar ?? "",
    status: room.status || "livre",
    descricao: buildDescription(manualDescription, room.comodidades || []),
    manual_descricao: manualDescription,
    comodidade_ids: room.comodidades?.map((item) => item.id) || []
  };
}

export function RoomFormModal({
  isOpen,
  mode,
  room,
  metadata,
  onClose,
  onSubmit,
  onCreateAmenity,
  onCreateAccommodationType,
  onCreateRoomType,
  isSubmitting,
  errorMessage
}) {
  const [form, setForm] = useState(initialForm);
  const [isCreatingAmenity, setIsCreatingAmenity] = useState(false);
  const [quickModalType, setQuickModalType] = useState("");
  const [quickModalError, setQuickModalError] = useState("");
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  const selectedAmenities = useMemo(() => {
    return (form.comodidade_ids || [])
      .map((amenityId) =>
        (metadata.comodidades || []).find((amenity) => amenity.id === amenityId)
      )
      .filter(Boolean);
  }, [form.comodidade_ids, metadata.comodidades]);

  useEffect(() => {
    if (isOpen) {
      setForm(normalizeRoom(room));
      setIsCreatingAmenity(false);
      setQuickModalType("");
      setQuickModalError("");
      setIsQuickSubmitting(false);
    }
  }, [isOpen, room]);

  if (!isOpen) {
    return null;
  }

  function updateDescription(nextValues) {
    const { selectedAmenities: nextSelectedAmenities, ...rest } = nextValues;
    return {
      ...rest,
      descricao: buildDescription(rest.manual_descricao, nextSelectedAmenities)
    };
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "descricao") {
      setForm((current) => {
        const manualDescription = extractManualDescription(value);
        return {
          ...current,
          manual_descricao: manualDescription,
          descricao: buildDescription(manualDescription, selectedAmenities)
        };
      });
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      capacidade: Number(form.capacidade),
      andar: form.andar === "" ? null : Number(form.andar),
      descricao: form.descricao.trim() || null
    });
  }

  function handleAmenityToggle(amenityId) {
    setForm((current) => {
      const nextIds = current.comodidade_ids.includes(amenityId)
        ? current.comodidade_ids.filter((item) => item !== amenityId)
        : [...current.comodidade_ids, amenityId];
      const nextAmenities = nextIds
        .map((id) => (metadata.comodidades || []).find((item) => item.id === id))
        .filter(Boolean);

      return updateDescription({
        ...current,
        comodidade_ids: nextIds,
        selectedAmenities: nextAmenities
      });
    });
  }

  async function handleCreateAmenity(name) {
    try {
      setIsCreatingAmenity(true);
      const amenity = await onCreateAmenity(name);

      setForm((current) => {
        const nextIds = current.comodidade_ids.includes(amenity.id)
          ? current.comodidade_ids
          : [...current.comodidade_ids, amenity.id];
        const nextAmenities = nextIds
          .map((id) => {
            if (id === amenity.id) {
              return amenity;
            }

            return (metadata.comodidades || []).find((item) => item.id === id);
          })
          .filter(Boolean);

        return updateDescription({
          ...current,
          comodidade_ids: nextIds,
          selectedAmenities: nextAmenities
        });
      });

      return amenity;
    } finally {
      setIsCreatingAmenity(false);
    }
  }

  const title = mode === "edit" ? "Editar Quarto" : "Novo Quarto";

  async function handleQuickTypeSubmit(payload) {
    try {
      setIsQuickSubmitting(true);
      setQuickModalError("");

      if (quickModalType === "accommodation") {
        const created = await onCreateAccommodationType(payload);
        setForm((current) => ({ ...current, tipo_acomodacao_id: created.id }));
      }

      if (quickModalType === "room") {
        const created = await onCreateRoomType(payload);
        setForm((current) => ({ ...current, tipo_quarto_id: created.id }));
      }

      setQuickModalType("");
    } catch (error) {
      setQuickModalError(error.message || "Nao foi possivel criar a classificacao.");
    } finally {
      setIsQuickSubmitting(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop" role="presentation" onClick={onClose}>
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-form-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="panel-heading room-form-heading">
            <div>
              <h2 id="room-form-title">{title}</h2>
              <p>Preencha os dados operacionais do quarto.</p>
            </div>
            <button type="button" className="ghost-button" onClick={onClose}>
              Fechar
            </button>
          </div>

          <form className="room-form" onSubmit={handleSubmit}>
            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Informacoes basicas</h3>
                <p>Dados usados no dia a dia da operacao.</p>
              </div>
              <div className="room-form-grid">
                <label className="field">
                  <span>Numero</span>
                  <input
                    name="numero"
                    type="text"
                    value={form.numero}
                    onChange={handleChange}
                    placeholder="Ex.: 103"
                    required
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select name="status" value={form.status} onChange={handleChange} required>
                    <option value="livre">Livre</option>
                    <option value="ocupado">Ocupado</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="manutencao">Manutencao</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </label>

                <label className="field">
                  <span>Capacidade</span>
                  <input
                    name="capacidade"
                    type="number"
                    min="1"
                    value={form.capacidade}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="field">
                  <span>Andar</span>
                  <input
                    name="andar"
                    type="number"
                    value={form.andar}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </section>

            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Classificacao</h3>
                <p>Organize acomodacao e padrao do quarto.</p>
              </div>
              <div className="room-form-grid">
                <div className="field field-with-action">
                  <span>Tipo de acomodacao</span>
                  <div className="field-inline">
                    <select
                      name="tipo_acomodacao_id"
                      value={form.tipo_acomodacao_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {metadata.tiposAcomodacao.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}{item.ativo === false ? " (inativo)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ghost-button compact"
                      onClick={() => setQuickModalType("accommodation")}
                    >
                      + Novo
                    </button>
                  </div>
                </div>

                <div className="field field-with-action">
                  <span>Tipo de quarto</span>
                  <div className="field-inline">
                    <select
                      name="tipo_quarto_id"
                      value={form.tipo_quarto_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {metadata.tiposQuarto.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}{item.ativo === false ? " (inativo)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ghost-button compact"
                      onClick={() => setQuickModalType("room")}
                    >
                      + Novo
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Comodidades</h3>
                <p>Selecione rapidamente o que o quarto oferece e mantenha a descricao sincronizada.</p>
              </div>
              <AmenitySelector
                amenities={metadata.comodidades || []}
                selectedIds={form.comodidade_ids}
                onToggle={handleAmenityToggle}
                onCreateAmenity={handleCreateAmenity}
                disabled={isSubmitting}
                isCreating={isCreatingAmenity}
              />
            </section>

            <section className="room-form-section">
              <div className="room-form-section-head">
                <h3>Descricao</h3>
                <p>Campo opcional para detalhes operacionais e comerciais. O bloco de comodidades e atualizado automaticamente.</p>
              </div>
              <label className="field">
                <span>Descricao do quarto</span>
                <textarea
                  name="descricao"
                  rows="7"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Ex.: Suite premium com varanda e vista para piscina."
                />
              </label>
            </section>

            {errorMessage ? <div className="form-feedback error">{errorMessage}</div> : null}

            <div className="room-form-actions">
              <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : mode === "edit" ? "Salvar Alteracoes" : "Salvar Quarto"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <RoomClassificationFormModal
        isOpen={Boolean(quickModalType)}
        title={quickModalType === "accommodation" ? "Novo Tipo de Acomodacao" : "Novo Tipo de Quarto"}
        item={null}
        onClose={() => {
          if (!isQuickSubmitting) {
            setQuickModalType("");
            setQuickModalError("");
          }
        }}
        onSubmit={handleQuickTypeSubmit}
        isSubmitting={isQuickSubmitting}
        errorMessage={quickModalError}
        compact
      />
    </>
  );
}
