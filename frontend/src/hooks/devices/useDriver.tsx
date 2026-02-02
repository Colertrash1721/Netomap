'use client'
import { asignDriverToUser } from "@/services/traccar/fetchDevices";
import { Drivers } from "@/types/traccar";
import { AxiosError } from "axios";
import Swal from "sweetalert2";

export function useDriver() {
  type BackendError = {
    message: string;
  };

  const asignDriver = async (drivers: Drivers[]) => {
    console.log("Clickeado para asignar un conductor");

    const options = drivers.map((driver) => `<option value="${driver.id}">${driver.name}</option>`).join('');
    const { value: selectedDriverId, isConfirmed } = await Swal.fire({
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
    if (isConfirmed && selectedDriverId) {
      const selectedDevice = drivers.find(d => d.id?.toString() === selectedDriverId);
      const selectedDeviceName = selectedDevice?.name;
      if (selectedDeviceName) {
        try {
          await asignDriverToUser(selectedDriverId)
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
  }

  return { asignDriver }
}
