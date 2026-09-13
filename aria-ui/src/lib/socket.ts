import { io, Socket } from "socket.io-client";

// Create a singleton socket instance
let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_API_URL!, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socketInstance;
};

// Export the socket instance
export const socket = getSocket();
