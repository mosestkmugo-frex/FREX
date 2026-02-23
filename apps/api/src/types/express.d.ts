import type { Server as SocketServer } from 'socket.io';

declare global {
  namespace Express {
    interface Application {
      get(name: 'io'): SocketServer;
    }
  }
}

export {};
