import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Shared Socket.IO hook — connects to the webhook-server
 * for real-time delivery and log updates.
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('wh_access');

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}
