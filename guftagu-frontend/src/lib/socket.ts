import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

console.log('[Socket] Using URL:', SOCKET_URL);

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
  }
  return socket;
};

export const connectSocket = (token?: string): Socket => {
  const socket = getSocket();
  
  if (!socket.connected) {
    socket.connect();
    
    if (token) {
      socket.emit('authenticate', { token });
    }
  }
  
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
  }
};

export default getSocket;
