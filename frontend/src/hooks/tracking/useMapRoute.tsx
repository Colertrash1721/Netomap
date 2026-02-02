'use client'

import { asignConcurrent, postConcurrent } from "@/services/routes/concurrent";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function useMapRoute() {
  const router = useRouter();
  const handleSubmit = async (
    latStart: number,
    lonStart: number,
    latEnd: number,
    lonEnd: number
  ) => {
    // Guardar ruta
    const saveRoute = await Swal.fire({
      title: 'Guardar ruta',
      text: '¿Desea guardar esta ruta como concurrente?',
      icon: 'info',
      showConfirmButton: true,
      showDenyButton: true,
      showCancelButton: true
    });

    if (saveRoute.isConfirmed) {
      const { value: routeName } = await Swal.fire({
        title: 'Ingrese el nombre',
        input: 'text',
        inputPlaceholder: 'Nombre de la ruta',
        showCancelButton: true,
        showConfirmButton: true
      });

      if (!routeName) return;

      const response = await postConcurrent({ routeName, latStart, lonStart, latEnd, lonEnd });
      if (!response) {
        await Swal.fire({
          title: 'Error',
          text: 'Hubo un error guardando la ruta',
          icon: 'error'
        });
      }
    }

    // Asignar ruta
    const asignRoute = await Swal.fire({
      title: 'Asignar ruta',
      text: '¿Desea asignar esta ruta a un dispositivo?',
      icon: 'info',
      showConfirmButton: true,
      showDenyButton: true,
      showCancelButton: true
    });

    if (asignRoute.isConfirmed) {
      const { value: deviceName } = await Swal.fire({
        title: 'Nombre del dispositivo',
        input: 'text',
        inputPlaceholder: '8044500474',
        showCancelButton: true,
        showConfirmButton: true
      });

      if (!deviceName) return;

      const ruteName = `Desde ${latStart},${lonStart} hasta ${latEnd},${lonEnd}`

      const response = await asignConcurrent({ rute_name: ruteName, deviceName, latStart, lonStart, latEnd, lonEnd });
      if (!response) {
        await Swal.fire({
          title: 'Error',
          text: 'Hubo un error asignando el dispositivo',
          icon: 'error'
        });
      }

      return await Swal.fire({
        title: 'Logrado',
        text: 'Ruta asignada correctamente al dispositivo',
        icon: 'success'
      })
    }
    if (typeof window !== 'undefined') {
      window.location.replace('/tracking_view');
    }
  };

  return { handleSubmit };
}
