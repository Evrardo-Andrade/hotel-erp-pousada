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
      title="Categorias de quarto"
      description="Gerencie categorias comerciais e operacionais usadas no cadastro das acomodacoes."
      entityLabel="Categoria de quarto"
      fetchItems={fetchRoomTypes}
      createItem={createRoomType}
      updateItem={updateRoomType}
      toggleItem={toggleRoomType}
      deleteItem={deleteRoomType}
    />
  );
}
