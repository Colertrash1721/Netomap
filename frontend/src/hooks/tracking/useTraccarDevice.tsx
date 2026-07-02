// src/hooks/useTraccarSocket.ts
'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position, Event } from '@/types/traccar';
import { useQueryClient } from '@tanstack/react-query';

type UseTraccarSocketProps = {
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setGatewayData: React.Dispatch<React.SetStateAction<any>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  setLoginStatus: React.Dispatch<React.SetStateAction<string>>;
  onOutOfRoute?: (data: any) => void;
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

function upsertPositionByDeviceId(
  prev: Position[] | undefined,
  incoming: Position[]
): Position[] {
  const byDevice = new Map<number, Position>();
  for (const p of (Array.isArray(prev) ? prev : [])) {
    if (p?.deviceId != null) byDevice.set(p.deviceId, { ...p });
  }

  for (const np of (Array.isArray(incoming) ? incoming : [])) {
    if (np?.deviceId == null) continue;
    const prevP = byDevice.get(np.deviceId);
    byDevice.set(np.deviceId, mergePosition(prevP, np));
  }

  return Array.from(byDevice.values());
}

export function useTraccarSocket({
  setEvents,
  setGatewayData,
  setMessage,
  setLoginStatus,
  onOutOfRoute,
}: UseTraccarSocketProps) {
  const queryClient = useQueryClient();
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
        setLoginStatus('Conectado al Gateway');
      });

      socket.on('traccarEvent', (payload: TraccarGatewayPayload) => {
        // --- POSITIONS ---
        const incomingPositions = payload?.positions;
        if (incomingPositions?.length) {
          queryClient.setQueryData<Position[]>(
            ['traccar', 'positions'],
            (prev) => upsertPositionByDeviceId(prev!, incomingPositions)
          );
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
        }

        setGatewayData(payload);
      });

      socket.on('outOfRoute', (data: any) => {
        setMessage(`Dispositivo fuera de ruta: ${data?.deviceName || 'ID ' + data?.deviceId}`);
      });

      socket.on('messageToClient', (msg: any) => {
        setMessage(String(msg));
      });

      socket.on('disconnect', (reason) => {
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
      } catch (e) {
        console.warn('No se pudo cerrar el socket limpiamente:', e);
      }
    };
  }, [setEvents, setGatewayData, setMessage, setLoginStatus, onOutOfRoute]);
}
