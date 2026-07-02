'use client'
import { useCallback, useEffect, useState } from 'react';
import { fetchDevices, fetchDrivers, fetchAssignedDrivers, fetchPositions, fetchdifferentDevices, fetchdifferentDrivers, fetchDriverByUserId, fetchAssignedDevices, fetchAllUsers } from '@/services/traccar/fetchDevices';
import { Device } from '@/types/traccar';
import { Driver } from '@/types/driver';

export function useTrackingDevice() {
  const rol = localStorage.getItem("rol");
  const [devices, setDevices] = useState<any[]>([]);
  const [differentDevices, setDifferentDevices] = useState<Device[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [d, dr, a, p, dd, u] = await Promise.all([
        rol === 'true' ? fetchDevices() : fetchAssignedDevices(),
        rol === 'true' ? fetchDrivers() :  fetchDriverByUserId(parseInt(localStorage.getItem("userId") || "0")),
        fetchAssignedDrivers(),
        fetchPositions(),
        fetchdifferentDevices(),
        fetchAllUsers()
      ]);
      setDevices(d);
      setDrivers(dr);
      setAssigned(a);
      setPositions(p);
      setUsers(u);
      setDifferentDevices(dd.differentDevices);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(); 
  }, [load]);

  return { devices, differentDevices, drivers, assigned, positions, loading, error, users, refreshDrivers: load };
}