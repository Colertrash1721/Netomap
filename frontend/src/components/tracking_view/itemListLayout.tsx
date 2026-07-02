'use client'
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import ItemList from './itemList';
import useSound from 'use-sound';

import { fetchAssignedDrivers, fetchDevices, fetchDrivers, fetchPositions } from '@/services/traccar/fetchDevices';
import { Device, Event, Position } from '@/types/traccar';
import { useDevicesQuery, usePositionQuery } from '@/hooks/devices/useDevice'
import { useTraccarSocket } from '@/hooks/tracking/useTraccarDevice';
import { deleteRouteByDeviceName } from '@/services/routes/deleteRoute';

type props = {
  filter?: string;
};

export default function ItemListLayout({ filter }: props) {
  const [drivers, setDrivers] = useState([]);
  const rol = typeof window !== 'undefined' ? localStorage.getItem("rol") : null;
  const userId = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem("userId") || "0", 10)
    : 0;
  const { data, isLoading, error } = useDevicesQuery(rol, userId);

  const { data: positionsData } = usePositionQuery();
  const devices = data?.devices || [];
  const positions = positionsData || [];
  const assigned = data?.assignedDrivers || [];
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [gatewayData, setGatewayData] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string>('');
  const [playNotification] = useSound('/sound/notification.mp3', { volume: 0.5 });
  const [playAlarm] = useSound('/sound/alarma.mp3', { volume: 1 });



  useEffect(() => {
    const unlock = () => {
      playNotification(); // solo para desbloquear el audio
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);

  }, []);

  useTraccarSocket({
    setEvents,
    setGatewayData,
    setMessage,
    setLoginStatus,
  });

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
          const assignedDriver = assigned.find(a => a.deviceId === device.idDevice);
          const position = positions.find((p: any) => p.id === device.positionId || p.deviceId === device.idDevice);  
          const event = events.find(e => e.deviceId === device.idDevice);
          return (
            <ItemList
              key={device.idDevice}
              deviceName={device.name || "N/A"}
              driver={assignedDriver?.drivers?.map((d: any) => d.name).join(', ') || 'No asignado'}
              owner={localStorage.getItem("username")|| "No asignado"}
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
