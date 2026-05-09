import { Server } from "socket.io";

let io;

export function setupSocket(server, appUrl) {
  io = new Server(server, {
    cors: {
      origin: appUrl,
      methods: ["GET", "POST", "PATCH", "DELETE"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("guest:subscribe", (guestId) => {
      socket.join(`guest:${guestId}`);
    });

    socket.on("hotel:subscribe", () => {
      socket.join("hotel:operations");
    });
  });

  return io;
}

export function getSocket() {
  return io;
}
