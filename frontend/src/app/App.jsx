import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { Shell } from "../components/layout/Shell.jsx";
import { LoginPage } from "../features/auth/LoginPage.jsx";
import { DashboardPage } from "../features/dashboard/DashboardPage.jsx";
import { RoomsPage } from "../features/rooms/RoomsPage.jsx";
import { RoomAccommodationTypesPage } from "../features/rooms/RoomAccommodationTypesPage.jsx";
import { RoomTypesPage } from "../features/rooms/RoomTypesPage.jsx";
import { ReservationsPage } from "../features/reservations/ReservationsPage.jsx";
import { GuestsPage } from "../features/guests/GuestsPage.jsx";
import { PeoplePage } from "../features/people/PeoplePage.jsx";
import { ProductsPage } from "../features/products/ProductsPage.jsx";
import { PosPage } from "../features/pos/PosPage.jsx";
import { OrdersPage } from "../features/orders/OrdersPage.jsx";
import { FinancePage } from "../features/finance/FinancePage.jsx";
import { SettingsPage } from "../features/settings/SettingsPage.jsx";
import { GuestAppPage } from "../features/checkin/GuestAppPage.jsx";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="rooms/occupied" element={<RoomsPage statusFilter="ocupado" pageTitle="Quartos ocupados" pageDescription="Quartos atualmente em uso pela hospedagem." />} />
        <Route path="rooms/available" element={<RoomsPage statusFilter="livre" pageTitle="Quartos livres" pageDescription="Quartos prontos para reserva e check-in." />} />
        <Route path="rooms/cleaning" element={<RoomsPage statusFilter="limpeza" pageTitle="Quartos em limpeza" pageDescription="Acompanhamento da fila de governanca." />} />
        <Route path="rooms/maintenance" element={<RoomsPage statusFilter="manutencao" pageTitle="Quartos em manutencao" pageDescription="Unidades indisponiveis por manutencao ou bloqueio tecnico." />} />
        <Route path="rooms/new" element={<RoomsPage autoOpenCreate pageTitle="Cadastro de quartos" pageDescription="Novo cadastro com classificacoes dinamicas e comodidades." />} />
        <Route path="rooms/accommodation-types" element={<RoomAccommodationTypesPage />} />
        <Route path="rooms/room-types" element={<RoomTypesPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="guests" element={<GuestsPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/guest/:accountId" element={<GuestAppPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
