// import { defineIOHandler } from "nuxt3-socket.io";
// https://github.com/wobsoriano/nuxt3-socket.io/issues/8
// Inlining the function definition has resolved the error.
import { Server } from "socket.io";
function defineIOHandler(cb: (io: Server) => void): (io: Server) => void {
  return cb;
}
// End inlined function definition.

import { SocketServerRoomToken } from "../types/webSocket";

export default defineIOHandler((io) => {
  io.on("connection", (socket) => {
    console.log(`[server][connection]`, socket.id, "connected");
    if (socket.handshake.auth.token === SocketServerRoomToken) {
      socket.join("server room");
      socket.onAny((eventName, ...args) => {
        console.log(`[server][${eventName}]`, JSON.stringify(args));
        io.to("client room").emit(eventName, ...args);
      });
    } else {
      socket.join("client room");
      socket.on("status", (data) => {
        console.log(`[server][status]`, JSON.stringify(data));

        socket.emit("status", { type: "status", message: data });
        socket
          .to("client room")
          .emit("status", { type: "status", message: data });
      });
    }
  });
});
