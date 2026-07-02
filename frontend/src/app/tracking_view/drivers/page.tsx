'use client';
export const dynamic = 'force-dynamic';
import InfoCards from "@/components/sections/infoCards";
import { useTrackingDevice } from "@/hooks/devices/useTrackingDevices";
import { useDriver } from "@/hooks/devices/useDriver";

export default function Page() {
  const { drivers ,loading, error, refreshDrivers } = useTrackingDevice();
  const {createDriver} = useDriver();

  return (
    <InfoCards
      title="Conductores"
      description="Estos son los conductores que tienes asignados"
      buttonText="Agregar conductor"
      buttonOnclick={() => createDriver(refreshDrivers)}
      headers={['Nombre', 'Licencia', 'Cedula', 'Telefono', 'Email' ]}
      data={drivers}
      renderRow={(driver) => {
        return (
          <>
            <td className="p-4 center">{driver.name}</td>
            <td className="p-4 center">{driver.licenseNumber}</td>
            <td className="p-4 center">{driver.documentId ?? '-'}</td>
            <td className="p-4 center">{driver.phone ?? '-'}</td>
            <td className="p-4 center">{driver.email ?? '-'}</td>
          </>
        );
      }}
    />
  )
}
