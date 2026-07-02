'use client'
import { createDriverService } from "@/services/driver/createDriver";
import { AxiosError } from "axios";
import Swal from "sweetalert2";

export function useDriver() {
  type BackendError = {
    message: string;
  };

  const createDriver = async(refreshDrivers: () => void) => {
    try{
      const { value } = await Swal.fire<{ name: string; documentId: string }>({
        title: 'Crear nuevo conductor',
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
          '<input id="swal-input2" class="swal2-input" placeholder="Cédula">' + 
          '<input id="swal-input3" class="swal2-input" placeholder="Teléfono">' +
          '<input id="swal-input4" class="swal2-input" placeholder="Numero de licencia">' +
          '<input id="swal-input5" class="swal2-input" placeholder="Email">',
        focusConfirm: false,
        preConfirm: async () => {
          const name = (document.getElementById('swal-input1') as HTMLInputElement).value;
          const documentId = (document.getElementById('swal-input2') as HTMLInputElement).value;
          const phone = (document.getElementById('swal-input3') as HTMLInputElement).value;
          const licenseNumber = (document.getElementById('swal-input4') as HTMLInputElement).value;
          const email = (document.getElementById('swal-input5') as HTMLInputElement).value;
          if (!name || !documentId || !phone || !email || !licenseNumber) {
            Swal.showValidationMessage('Por favor ingresa todos los campos');
            return;
          }
          const response = await createDriverService({ name, documentId, phone, licenseNumber, email, userId: parseInt(localStorage.getItem("userId") || "0") });
          Swal.fire('Éxito', 'Conductor creado exitosamente', 'success');
          console.log(response);
          refreshDrivers();
          return { name, documentId, phone, licenseNumber, email };
        }
      });
    } catch (error) {
      const axiosError = error as AxiosError<BackendError>;
      const errorMessage = axiosError.response?.data.message || 'Error al crear el conductor';
      Swal.fire('Error', errorMessage, 'error');
    }
  }
  return { createDriver };
}
