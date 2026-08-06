import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(URL, {
  // autoConnect is false so we can manually attach the JWT auth token before connecting
  autoConnect: false,
  withCredentials: true,
});
