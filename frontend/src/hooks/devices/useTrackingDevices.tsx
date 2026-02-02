'use client'
import { useEffect, useState } from 'react';
import { fetchDevices, fetchDrivers, fetchAssignedDrivers, fetchPositions, fetchdifferentDevices, fetchdifferentDrivers } from '@/services/traccar/fetchDevices';
import { Drivers, Device } from '@/types/traccar';

export function useTrackingDevice() {
  const [devices, setDevices] = useState<any[]>([]);
  const [differentDevices, setDifferentDevices] = useState<Device[]>([]);
  const [differentDrivers, setDifferentDrivers] = useState<Device[]>([]);
  const [drivers, setDrivers] = useState<Drivers[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, dr, a, p, dd, ddr] = await Promise.all([
          fetchDevices(),
          fetchDrivers(),
          fetchAssignedDrivers(),
          fetchPositions(),
          fetchdifferentDevices(),
          fetchdifferentDrivers(),
        ]);
        setDevices(d);
        setDrivers(dr);
        setAssigned(a);
        setPositions(p);
        setDifferentDevices(dd.differentDevices);
        setDifferentDrivers(ddr.differentDrivers)
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { devices, differentDevices, differentDrivers, drivers, assigned, positions, loading, error };
}
