import {
  createRoomType,
  deleteRoomType,
  fetchRoomTypes,
  toggleRoomType,
  updateRoomType
} from "../../services/api";
import { RoomClassificationPage } from "./RoomClassificationPage.jsx";

export function RoomTypesPage() {
  return (
    <RoomClassificationPage
      title="Tipos de quarto"
      description="Gerencie padroes de quarto, categorias e disponibilidade para novos cadastros."
      entityLabel="Tipo de quarto"
      fetchItems={fetchRoomTypes}
      createItem={createRoomType}
      updateItem={updateRoomType}
      toggleItem={toggleRoomType}
      deleteItem={deleteRoomType}
    />
  );
}
