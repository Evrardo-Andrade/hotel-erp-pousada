import http from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { setupSocket } from "./config/socket.js";

const server = http.createServer(app);

setupSocket(server, env.appUrl);

server.listen(env.port, () => {
  console.log(`Hotel ERP API executando na porta ${env.port}`);
});
