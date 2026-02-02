'use client';
export const dynamic = 'force-dynamic';
import Image from "next/image";
import InfoCards from "@/components/sections/infoCards";

// CUSTOM HOOKS
import { useTrackingDevice } from "@/hooks/devices/useTrackingDevices";
import { useDevice } from "@/hooks/devices/useDevice";

export default function Page() {
  const { devices, drivers, differentDevices, assigned, positions, loading, error } = useTrackingDevice();
  const { asignDevice, asignDriverToDevice } = useDevice();

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <InfoCards
      title="Dispositivos"
      description="Estos son los dispositivos que tienes asignados"
      buttonText="Asignar dispositivo"
      buttonOnclick={() => asignDevice(differentDevices)}
      headers={['Imagen', 'Nombre', 'ID', 'Latitud', 'Longitud', 'Conductor']}
      data={devices}
      renderRow={(device) => {
        const pos = positions.find((p) => p.deviceId === device.id);
        const assignedDriver = assigned.find((a) => a.deviceId === device.id);
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
            <td className="p-4 center">{device.id}</td>
            <td className="p-4 center">{pos?.latitude ?? '-'}</td>
            <td className="p-4 center">{pos?.longitude ?? '-'}</td>
            <td className="p-4 center">
              {assignedDriver?.drivers?.map((d: { name: string }) => d.name).join(', ') || 'No asignado'}
              <i
                className="bx bx-pencil bg-black text-white p-2 rounded-lg cursor-pointer"
                onClick={() => asignDriverToDevice(device.name, drivers ?? [])}
              ></i>
            </td>
          </>
        );
      }}
    />

  );
}
