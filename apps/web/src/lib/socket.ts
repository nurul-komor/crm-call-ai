import { io, type Socket } from 'socket.io-client';

import { useAuthStore } from './authStore';

let _socket: Socket | undefined;

export function socket(): Socket {
  if (_socket) return _socket;
  _socket = io({
    path: '/socket.io',
    transports: ['websocket'],
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    autoConnect: true,
  });
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = undefined;
}
