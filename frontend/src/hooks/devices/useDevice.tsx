'use client';
export const dynamic = 'force-dynamic';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { sendCommand } from '@/services/traccar/sendCommand';
import { asignDeviceToUser, asignDriver, asignUsertoDeviceService, fetchAllUsers } from '@/services/traccar/fetchDevices';
import { Drivers, Device } from '@/types/traccar';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices, fetchPositions, fetchAssignedDevices, fetchAssignedDrivers, fetchDrivers, fetchDriverByUserId } from '@/services/traccar/fetchDevices';

type BackendError = {
  message: string;
};

type DevicesData = {
  devices: Device[];
  drivers: Drivers[];
  assignedDrivers: any[];
};

type SelectedDevice = {
  id: number;
  name: string;
};

export function useDevice() {
  const asignDevice = async (devices: Device[]) => {
    const options = devices.map((device) => `<option value="${device.id}">${device.name}</option>`).join('');
    const { value: selectedDeviceId, isConfirmed } = await Swal.fire({
      title: 'Asignar dispositivo',
      html: `
        <select id="device-select" class="swal2-input">
          <option value="" disabled selected>Selecciona un dispositivo</option>
          ${options}
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const select = document.getElementById('device-select') as HTMLSelectElement;
        return select?.value;
      }
    });
    if (isConfirmed && selectedDeviceId) {
      const selectedDevice = devices.find(d => d.id?.toString() === selectedDeviceId);
      const selectedDeviceName = selectedDevice?.name;
      if (selectedDeviceName) {
        try {
          await asignDeviceToUser(selectedDeviceId)
          Swal.fire({
            title: "Logrado",
            text: `Dispositivo ${selectedDeviceName} asignado correctamente`,
            icon: "success",
          });
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        } catch (error) {
          const err = error as AxiosError<BackendError>;
          Swal.fire({
            title: 'Error',
            text: err.response?.data?.message || 'Hubo un error en el proceso',
            icon: 'error'
          });
        }
      }
    }
  };

  const asignDriverToDevice = async (deviceName: string, conductores: Drivers[]) => {
    const options = conductores
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('');

    const { value: selectedDriverId, isConfirmed } = await Swal.fire({
      title: 'Asignar conductor',
      html: `
        <select id="driver-select" class="swal2-input">
          <option value="" disabled selected>Selecciona un conductor</option>
          ${options}
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const select = document.getElementById('driver-select') as HTMLSelectElement;
        return select?.value;
      }
    });

    if (isConfirmed && selectedDriverId) {
      const selectedDriver = conductores.find(c => c.id?.toString() === selectedDriverId);
      const driverName = selectedDriver?.name;

      if (driverName) {
        try {
          await asignDriver(driverName, deviceName);
          Swal.fire({
            title: "Logrado",
            text: "Conductor asignado correctamente",
            icon: "success",
          });
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        } catch (error) {
          const err = error as AxiosError<BackendError>;
          Swal.fire({
            title: 'Error',
            text: err.response?.data?.message || 'Hubo un error en el proceso',
            icon: 'error'
          });
        }
      }
    } else {
      console.log('Asignación cancelada o sin selección');
    }
  };

  const openDevice = async (deviceName: string | undefined) => {
    const result = await Swal.fire({
      title: 'Abrir dispositivo',
      text: '¿Seguro que quieres abrir el dispositivo?',
      showCancelButton: true,
      showConfirmButton: true,
      icon: 'question'
    });

    if (!result.isConfirmed) return;

    try {
      await sendCommand(deviceName);
      Swal.fire({
        title: "Logrado",
        text: "Dispositivo abierto correctamente",
        icon: "success"
      });
    } catch (error) {
      const err = error as AxiosError<BackendError>;
      Swal.fire({
        title: 'Error',
        text: "El dispositivo ya tiene una ruta asignada, por favor finalizar",
        icon: 'error'
      });
    }
  };

  const asignUserToDevice = async (deviceName: string) => {
    const users = await fetchAllUsers();
    const options = users.map((u: any) => `<option value="${u.id}">${u.name}</option>`).join('');
    const { value: selectedUserId, isConfirmed } = await Swal.fire({
      title: 'Asignar usuario',
      html: `
        <select id="user-select" class="swal2-input">
          <option value="" disabled selected>Selecciona un usuario</option>
          ${options}
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const select = document.getElementById('user-select') as HTMLSelectElement;
        return select?.value;
      }
    });

    if (isConfirmed && selectedUserId) {
      const selectedUser = users.find((u: any) => u.id?.toString() === selectedUserId);
      const userName = selectedUser?.name;

      if (userName) {
        try {
          await asignUsertoDeviceService(deviceName, selectedUserId);
          Swal.fire({
            title: "Logrado",
            text: "Usuario asignado correctamente",
            icon: "success",
          });
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        } catch (error) {
          const err = error as AxiosError<BackendError>;
          Swal.fire({
            title: 'Error',
            text: err.response?.data?.message || 'Hubo un error en el proceso',
            icon: 'error'
          });
        }
      }
    } else {
      console.log('Asignación cancelada o sin selección');
    }
  }

  return { asignDevice, asignDriverToDevice, openDevice, asignUserToDevice };
}

export function useDevicesQuery(rol: string | null, userId: number) {
  return useQuery<DevicesData>({
    queryKey: ['devicesData'],
    enabled: !!rol,
    queryFn: async () => {
      const [devices, drivers, assignedDrivers] = await Promise.all([
        rol === 'true' ? fetchDevices() : fetchAssignedDevices(),
        rol === 'true' ? fetchDrivers() : fetchDriverByUserId(userId),
        fetchAssignedDrivers(),
      ]);

      return {
        devices: devices ?? [],
        drivers: drivers ?? [],
        assignedDrivers: assignedDrivers ?? [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePositionQuery() {
  return useQuery({
    queryKey: ['positionsData'],
    queryFn: async () => {
      const positions = await fetchPositions();

      return positions;
    }
  })
}
