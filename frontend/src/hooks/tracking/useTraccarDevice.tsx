// src/hooks/useTraccarSocket.ts
'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position, Event } from '@/types/traccar';

type UseTraccarSocketProps = {
  setPositions: React.Dispatch<React.SetStateAction<Position[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setGatewayData: React.Dispatch<React.SetStateAction<any>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  setLoginStatus: React.Dispatch<React.SetStateAction<string>>;
};


type TraccarGatewayPayload = {
  positions?: Position[];
  events?: Event[];
  [k: string]: any;
};

// Normaliza números y mantiene campos previos si llegan valores no válidos
function mergePosition(prev: Position | undefined, incoming: Position): Position {
  const lat = Number(incoming.latitude);
  const lon = Number(incoming.longitude);

  return {
    ...(prev || ({} as Position)),
    ...incoming,
    latitude: Number.isFinite(lat) ? lat : prev?.latitude,
    longitude: Number.isFinite(lon) ? lon : prev?.longitude,
  };
}

export function useTraccarSocket({
  setPositions,
  setEvents,
  setGatewayData,
  setMessage,
  setLoginStatus,
}: UseTraccarSocketProps) {
  useEffect(() => {
    let socket: Socket | null = null;

    const connectSocket = () => {
      socket = io('https://admin.netotrack.com:82', {
        path: '/socket.io',
        transports: ['websocket'],
        // Puedes ajustar reconnection si lo necesitas
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on('connect', () => {
        console.log('✅ Conectado al Gateway');
        setLoginStatus('Conectado al Gateway');
      });

      socket.on('traccarEvent', (payload: TraccarGatewayPayload) => {
        // --- POSITIONS ---
        const incomingPositions = payload?.positions;
        if (incomingPositions && incomingPositions.length) {
          // Mezclamos por deviceId (no por id de posición)
          setPositions((prev) => {
            const byDevice = new Map<number, Position>();
            // copia inmutable de las previas
            for (const p of prev) {
              if (p.deviceId != null) byDevice.set(p.deviceId, { ...p });
            }
            // mezcla de las nuevas
            for (const np of incomingPositions) {
              if (np.deviceId == null) continue;
              const prevP = byDevice.get(np.deviceId);
              const merged = mergePosition(prevP, np);
              byDevice.set(np.deviceId, merged);
            }
            return Array.from(byDevice.values());
          });
        }

        // --- EVENTS ---
        const incomingEvents = payload?.events;
        if (incomingEvents && incomingEvents.length) {
          setEvents((prev) => {
            const byDevice = new Map<number, Event>();
            for (const e of prev) if (e.deviceId != null) byDevice.set(e.deviceId, { ...e });
            for (const ne of incomingEvents) if (ne.deviceId != null) byDevice.set(ne.deviceId, { ...ne });
            return Array.from(byDevice.values());
          });
          console.log('🚨 Events:', incomingEvents);
        }

        setGatewayData(payload);
      });

      socket.on('messageToClient', (msg: any) => {
        console.log('💬 MessageToClient:', msg);
        setMessage(String(msg));
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Desconectado del Gateway:', reason);
        setLoginStatus('Desconectado del Gateway');
      });

      socket.on('connect_error', (err) => {
        console.warn('⚠️ Error de conexión con Gateway:', err?.message || err);
      });
    };

    connectSocket();

    return () => {
      try {
        socket?.disconnect();
        console.log('🔒 Socket.IO cerrado');
      } catch (e) {
        console.warn('No se pudo cerrar el socket limpiamente:', e);
      }
    };
  }, [setPositions, setEvents, setGatewayData, setMessage, setLoginStatus]);
}
