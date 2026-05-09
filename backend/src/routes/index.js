import { Router } from "express";
import { authRoutes } from "../modules/auth/auth-routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard-routes.js";
import { roomsRoutes } from "../modules/rooms/rooms-routes.js";
import { roomAmenitiesRoutes } from "../modules/rooms/room-amenities-routes.js";
import { roomAccommodationTypesRoutes } from "../modules/rooms/room-accommodation-types-routes.js";
import { roomTypesRoutes } from "../modules/rooms/room-types-routes.js";
import { reservationsRoutes } from "../modules/reservations/reservations-routes.js";
import { combosRoutes } from "../modules/reservations/combos-routes.js";
import { guestsRoutes } from "../modules/guests/guests-routes.js";
import { checkinRoutes } from "../modules/checkin/checkin-routes.js";
import { productsRoutes } from "../modules/products/products-routes.js";
import { posRoutes } from "../modules/pos/pos-routes.js";
import { ordersRoutes } from "../modules/orders/orders-routes.js";
import { financeRoutes } from "../modules/finance/finance-routes.js";
import { settingsRoutes } from "../modules/settings/settings-routes.js";
import { fiscalRoutes } from "../modules/fiscal/fiscal-routes.js";
import { logsRoutes } from "../modules/logs/logs-routes.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/health", (request, response) => {
  response.json({ ok: true, service: "hotel-erp-api" });
});

router.use("/auth", authRoutes);
router.use(authenticate);
router.use("/dashboard", dashboardRoutes);
router.use("/rooms", roomsRoutes);
router.use("/room-amenities", roomAmenitiesRoutes);
router.use("/room-accommodation-types", roomAccommodationTypesRoutes);
router.use("/room-types", roomTypesRoutes);
router.use("/reservations", reservationsRoutes);
router.use("/combos", combosRoutes);
router.use("/guests", guestsRoutes);
router.use("/stay", checkinRoutes);
router.use("/products", productsRoutes);
router.use("/pos", posRoutes);
router.use("/orders", ordersRoutes);
router.use("/finance", financeRoutes);
router.use("/settings", settingsRoutes);
router.use("/fiscal", fiscalRoutes);
router.use("/logs", logsRoutes);

export { router };
