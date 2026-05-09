import { getSocket } from "../config/socket.js";

export function broadcastRoomStatus(payload) {
  const io = getSocket();
  io?.to("hotel:operations").emit("rooms:updated", payload);
}

export function broadcastOrderStatus(payload) {
  const io = getSocket();
  io?.to("hotel:operations").emit("orders:updated", payload);
  io?.to(`guest:${payload.guestId}`).emit("guest:order-updated", payload);
}

export function broadcastGuestAccount(payload) {
  const io = getSocket();
  io?.to(`guest:${payload.guestId}`).emit("guest:account-updated", payload);
}
