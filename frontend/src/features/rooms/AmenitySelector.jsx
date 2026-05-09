import { useMemo, useState } from "react";

export function AmenitySelector({
  amenities,
  selectedIds,
  onToggle,
  onCreateAmenity,
  disabled,
  isCreating = false
}) {
  const [draftAmenity, setDraftAmenity] = useState("");
  const [localError, setLocalError] = useState("");

  const selectedAmenities = useMemo(() => {
    return selectedIds
      .map((id) => amenities.find((amenity) => amenity.id === id))
      .filter(Boolean);
  }, [amenities, selectedIds]);

  async function submitNewAmenity() {
    const name = draftAmenity.trim();

    if (!name || disabled || isCreating) {
      return;
    }

    const alreadyExists = amenities.find(
      (amenity) => amenity.nome.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setDraftAmenity("");
      setLocalError("");

      if (!selectedIds.includes(alreadyExists.id)) {
        onToggle(alreadyExists.id);
      }

      return;
    }

    try {
      setLocalError("");
      await onCreateAmenity(name);
      setDraftAmenity("");
    } catch (error) {
      setLocalError(error.message || "Nao foi possivel adicionar a comodidade.");
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitNewAmenity();
      return;
    }

    if (event.key === "Backspace" && !draftAmenity && selectedAmenities.length) {
      event.preventDefault();
      onToggle(selectedAmenities[selectedAmenities.length - 1].id);
    }
  }

  return (
    <div className="amenity-selector-shell">
      <div className="amenity-selector" role="list" aria-label="Comodidades do quarto">
        {amenities.map((amenity) => {
          const isSelected = selectedIds.includes(amenity.id);

          return (
            <button
              key={amenity.id}
              type="button"
              className={isSelected ? "amenity-chip selected" : "amenity-chip"}
              onClick={() => onToggle(amenity.id)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              <span>{amenity.nome}</span>
              {isSelected ? (
                <span className="amenity-chip-remove" aria-hidden="true">
                  ×
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="amenity-input-row">
        <label className="amenity-input-card">
          <span className="amenity-input-prefix">+</span>
          <input
            type="text"
            value={draftAmenity}
            onChange={(event) => {
              setDraftAmenity(event.target.value);
              if (localError) {
                setLocalError("");
              }
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Digite nova comodidade..."
            disabled={disabled || isCreating}
          />
        </label>

        <button
          type="button"
          className="ghost-button"
          onClick={submitNewAmenity}
          disabled={disabled || isCreating || !draftAmenity.trim()}
        >
          {isCreating ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      <div className="amenity-selector-hint">
        <span>Enter adiciona a comodidade.</span>
        <span>Backspace remove a ultima selecionada quando o campo estiver vazio.</span>
      </div>

      {localError ? <div className="form-feedback error">{localError}</div> : null}
    </div>
  );
}
