'use client'
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import ItemList from './itemList';
import useSound from 'use-sound';

import { fetchAssignedDrivers, fetchDevices, fetchDrivers, fetchPositions } from '@/services/traccar/fetchDevices';
import { AssignedDriver, Device, Event, Position } from '@/types/traccar';
import { useTraccarSocket } from '@/hooks/tracking/useTraccarDevice';
import { deleteRouteByDeviceName } from '@/services/routes/deleteRoute';

type props = {
  filter?: string;
};

export default function ItemListLayout({ filter }: props) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [drivers, setDrivers] = useState([]);
  const [assigned, setAssigned] = useState<AssignedDriver[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [gatewayData, setGatewayData] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string>('');
  const [playNotification] = useSound('/sound/notification.mp3', { volume: 0.5 });
  const [playAlarm] = useSound('/sound/alarma.mp3', { volume: 1 });

  const loadAll = async () => {
    const [d, dr, a, p] = await Promise.all([
      fetchDevices(),
      fetchDrivers(),
      fetchAssignedDrivers(),
      fetchPositions(),
    ]);
    setDevices(d);
    setDrivers(dr);
    setAssigned(a);
    setPositions(p);
    setLoading(false);
  };

  useEffect(() => {
    const unlock = () => {
      playNotification(); // solo para desbloquear el audio
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
    
  }, []);

  useTraccarSocket({
    setPositions,
    setEvents,
    setGatewayData,
    setMessage,
    setLoginStatus,
  });

  useEffect(() => {
    setInterval(() => {
      loadAll();
    }, 5 * 1000);
  }, []);

  useEffect(() => {
    events.forEach((event) => {
      const eventId = event.id;
      if ((window as any)[`timeout_${eventId}`]) return;
      devices.map(device => {
        if (event.deviceId === device.id) {
          let message = event.attributes?.message || '';
          message = message
            .replace(/unlock/gi, 'desbloqueado')
            .replace(/lock/gi, 'bloqueado')
            .replace(/Power Cut/gi, 'Cortado');

          if (message.includes('Cortado')) {
            playAlarm()
          } else {
            playNotification()
          }

          Swal.fire({
            position: 'bottom',
            text: `Alerta dispositivo ${message}`,
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            backdrop: false,
            showClass: {
              popup: 'animate__animated animate__fadeInUp animate__faster'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutDown animate__faster'
            }
          });

          const timeoutId = setTimeout(() => {
            setEvents((prev) => prev.filter((e) => e.id !== eventId));
            delete (window as any)[`timeout_${eventId}`];
          }, 2 * 60 * 1000);

          (window as any)[`timeout_${eventId}`] = timeoutId;
          return;
        }

      })
      return;
    });
  }, [events]);

  const handleDeleteRoute = async (deviceName: string) => {
    const confirmResult = await Swal.fire({
      title: `¿Eliminar ruta de "${deviceName}"?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await deleteRouteByDeviceName(deviceName);
      Swal.fire({
        icon: 'success',
        title: '¡Ruta eliminada!',
        text: `La ruta del dispositivo "${deviceName}" fue eliminada con éxito.`,
        timer: 2000,
        showConfirmButton: false
      });
      await loadAll(); // 🔄 refresca todos los datos
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'No se pudo eliminar la ruta',
      });
    }
  };

  return (
    devices.length > 0 || drivers.length > 0 || assigned.length > 0 ? (      
      devices
        .filter(device =>
          device.name?.toLowerCase().includes(filter?.toLowerCase() || "")
        ).sort((a, b) => {
          const hasEventA = events.some(e => e.deviceId === a.id);
          const hasEventB = events.some(e => e.deviceId === b.id);
          return Number(hasEventB) - Number(hasEventA);
        })
        .map(device => {
          const assignedDriver = assigned.find(a => a.deviceId === device.id);
          const position = positions.find(p => p.id === device.positionId || p.deviceId === device.id);
          const event = events.find(e => e.deviceId === device.id);
          return (
            <ItemList
              key={device.id}
              deviceName={device.name || "N/A"}
              driver={assignedDriver?.drivers?.map(d => d.name).join(', ') || 'No asignado'}
              owner={device.attributes?.attributes?.Empresa || "No asignado"}
              status={device.status}
              charge={`${position?.attributes?.batteryLevel}%` || "N/A"}
              latitude={position?.latitude || "N/A"}
              longitude={position?.longitude || "N/A"}
              event={event?.attributes?.alarm}
              port={device.attributes?.attributes?.Puerto}
              unit={device.attributes?.attributes?.Unidad}
              destiny={device.attributes?.attributes?.Destino}
              onDelete={handleDeleteRoute}
            />
          );
        })
    ) : null
  );
}
