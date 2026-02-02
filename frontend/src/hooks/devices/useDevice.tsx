'use client';
export const dynamic = 'force-dynamic';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { sendCommand } from '@/services/traccar/sendCommand';
import { asignDeviceToUser, asignDriver } from '@/services/traccar/fetchDevices';
import { Drivers, Device } from '@/types/traccar';

type BackendError = {
  message: string;
};

type SelectedDevice = {
  id: number;
  name: string;
};

export function useDevice() {
  const asignDevice = async (devices: Device[]) => {
    console.log(devices);

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

  return { asignDevice, asignDriverToDevice, openDevice };
}
