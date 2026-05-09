import {
  createRoomAccommodationType,
  deleteRoomAccommodationType,
  fetchRoomAccommodationTypes,
  toggleRoomAccommodationType,
  updateRoomAccommodationType
} from "../../services/api";
import { RoomClassificationPage } from "./RoomClassificationPage.jsx";

export function RoomAccommodationTypesPage() {
  return (
    <RoomClassificationPage
      title="Tipos de acomodacao"
      description="Cadastre, ative e organize as acomodacoes usadas pelo Hotel ERP."
      entityLabel="Tipo de acomodacao"
      fetchItems={fetchRoomAccommodationTypes}
      createItem={createRoomAccommodationType}
      updateItem={updateRoomAccommodationType}
      toggleItem={toggleRoomAccommodationType}
      deleteItem={deleteRoomAccommodationType}
    />
  );
}
