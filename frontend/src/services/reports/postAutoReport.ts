import axios from "axios";

export async function postAutoReport(deviceName: string, email: string) {
  console.log('DeviceName a enviar:', deviceName);

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/report/auto-generate`,
    { deviceName, email },                       // ✅ enviar JSON con la propiedad
    { responseType: 'blob' }              // ✅ recibir PDF como blob
  );

  // Abrir PDF en nueva pestaña (opcional)
  console.log('Response data type:', typeof response.data);
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);

  return true;
}