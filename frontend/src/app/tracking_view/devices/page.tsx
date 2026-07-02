'use client';
export const dynamic = 'force-dynamic';
import Image from "next/image";
import InfoCards from "@/components/sections/infoCards";

// CUSTOM HOOKS
import { useTrackingDevice } from "@/hooks/devices/useTrackingDevices";
import { useDevice } from "@/hooks/devices/useDevice";

export default function Page() {
  const { devices, drivers, differentDevices, assigned, positions, users,loading, error } = useTrackingDevice();
  const { asignDevice, asignDriverToDevice, asignUserToDevice } = useDevice();


  if (loading) return <p>Cargando...</p>;
  console.log(devices);
  
  if (error) return <p>Error: {error}</p>;

  return (

    
    <InfoCards
      title="Dispositivos"
      description="Estos son los dispositivos que tienes asignados"
      buttonText="Asignar dispositivo"
      buttonOnclick={() => asignDevice(differentDevices)}
      headers={['Imagen', 'Nombre', 'Latitud', 'Longitud', 'Conductor', 'Usuario asignado']}
      data={devices}
      renderRow={(device) => {
        const pos = positions.find((p) => p.deviceId === device.idDevice);
        const assignedDriver = assigned.find((a) => a.deviceId === device.idDevice);
        return (
          <>
            <td className="p-4 center">
              <Image
                src="/assets/locker.jpeg"
                alt="Locker"
                width={80}
                height={80}
                className="object-cover rounded-md"
              />
            </td>
            <td className="p-4 center">{device.name}</td>
            <td className="p-4 center">{pos?.latitude ?? '-'}</td>
            <td className="p-4 center">{pos?.longitude ?? '-'}</td>
            <td className="p-4 center">
              {assignedDriver?.drivers?.map((d: { name: string }) => d.name).join(', ') || 'No asignado'}
              <i
                className="bx bx-pencil bg-black text-white p-2 rounded-lg cursor-pointer"
                onClick={() => asignDriverToDevice(device.name, drivers ?? [])}
              ></i>
            </td>
            <td className="p-4 center">{users.find(u => u.id == device.idUser)?.name || 'No asignado'} <i
              className="bx bx-pencil bg-black text-white p-2 rounded-lg cursor-pointer"
              onClick={() => asignUserToDevice(device.name)}
            ></i></td>
          </>
        );
      }}
    />

  );
}
