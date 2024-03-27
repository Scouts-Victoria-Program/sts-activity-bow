import { Socket, io } from "socket.io-client";
import { MessageData, SocketServerRoomToken } from "~/server/types/webSocket";

let socket: Socket | null = null;

export const useSocketServer = () => {
  if (!socket) {
    socket = io(`http://localhost:3000`, {
      auth: {
        token: SocketServerRoomToken,
      },
    });
    // Connection opened
    socket.on("connect", () => {
      console.log("[server-client][connection]: connection successful");
    });
    socket.on("disconnected", () => {
      console.log("[server-client][connection]: disconnected");
    });
  }

  return {
    socket,
    sendMessage<T extends MessageData>(ev: T["type"], message: T) {
      console.log(`[server-client][${ev}]: ${JSON.stringify(message)}`);

      socket?.emit(ev, message);
    },
  };
};
