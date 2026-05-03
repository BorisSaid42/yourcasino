import { io } from 'socket.io-client';
import { notify } from '../../components/toast';
import { getCredentials } from './credentials';

export const sockets = io(`${import.meta.env.VITE_SOCKET_BASE_URL}`, {
  transports: ['websocket', 'polling'],
  auth: {
    token: `Bearer ${getCredentials()}`,
  },
});

export type SocketException<T = unknown> = {
  status: 'error';
  message: string;
  cause: {
    pattern: string;
    data: T;
  };
};

sockets.on('exception', (error: SocketException) => {
  notify('error', { content: error.message, title: 'Error' });
});

let timeout: NodeJS.Timeout | null = null;
let connectedAt: number | null = null;

sockets.on('connect', () => {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  } else if (connectedAt) {
    notify('success', { title: 'Success', content: "You're connected again" });
  }

  connectedAt = Date.now();
});

sockets.on('disconnect', () => {
  timeout = setTimeout(() => {
    notify('error', {
      content: "Your connection seems to be lost. Try reloading page if it doesn't reconnect in next couple of seconds",
      title: 'Connection Error',
    });
    timeout = null;
  }, 1000);
});

export function reloadSockets() {
  (sockets.auth as { token: string }).token = `Bearer ${getCredentials()}`;
  if (sockets.connected) {
    sockets.disconnect();
    sockets.connect();
  }
}
