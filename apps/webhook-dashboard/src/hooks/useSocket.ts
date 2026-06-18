import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Shared Socket.IO hook — connects to the webhook-server
 * for real-time delivery and log updates. Reconnects automatically
 * whenever the stored access token changes (login, refresh, logout),
 * via the 'wh_auth_changed' window event dispatched by AuthContext.
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [authTick, setAuthTick] = useState(0); // bumped on login/register/logout

  useEffect(() => {
    function handleAuthChange() {
      setAuthTick((n) => n + 1);
    }
    window.addEventListener('wh_auth_changed', handleAuthChange);
    return () => window.removeEventListener('wh_auth_changed', handleAuthChange);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('wh_access');

    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authTick]); // re-run only when auth actually changes, not on every render

  return socketRef;
}