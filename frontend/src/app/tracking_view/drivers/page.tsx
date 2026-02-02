'use client';
export const dynamic = 'force-dynamic';
import InfoCards from "@/components/sections/infoCards";
import { useTrackingDevice } from "@/hooks/devices/useTrackingDevices";
import { useDriver } from "@/hooks/devices/useDriver";

export default function Page() {
  const { drivers, differentDrivers,loading, error } = useTrackingDevice();
  const {asignDriver} = useDriver();

  return (
    <InfoCards
      title="Conductores"
      description="Estos son los conductores que tienes asignados"
      buttonText="Asignar conductor"
      buttonOnclick={() => asignDriver(differentDrivers)}
      headers={['Nombre', 'ID', 'Cedula', ]}
      data={drivers}
      renderRow={(driver) => {
        return (
          <>
            <td className="p-4 center">{driver.name}</td>
            <td className="p-4 center">{driver.id}</td>
            <td className="p-4 center">{driver.attributes?.cedula ?? '-'}</td>
          </>
        );
      }}
    />
  )
}
