// socket.js - wrapper for socket.io client
import { io } from "socket.io-client";

let socket = null;

export function createSocket(token, serverUrl) {
  if (socket) return socket;
  socket = io(serverUrl, {
    auth: { token },
    transports: ["websocket"]
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
