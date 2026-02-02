// ItemList.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useDevice } from '@/hooks/devices/useDevice'

type props = {
  deviceName?: string;
  owner?: string;
  driver?: string;
  latitude?: number | string;
  longitude?: number | string;
  status?: string;
  charge?: number | string;
  event?: string;
  unit?: string;
  port?: string;
  destiny?: string;
  onDelete?: (deviceName: string) => void;
}

export default function ItemList({ deviceName, owner, driver, latitude, longitude, status, charge, event, unit, port, destiny, onDelete }: props) {
  const [eventText, seteventText] = useState("");
  const { openDevice } = useDevice();

  const getLocation = () => {
    const lon = longitude ? String(longitude) : "";
    const lat = latitude ? String(latitude) : "";
    window.localStorage.setItem("longitude", lon)
    window.localStorage.setItem("latitude", lat)
  }

  useEffect(() => {
    if (event === "unlock") seteventText("Desbloqueado")
    else if (event === "lock") seteventText("Bloqueado")
    else if (event === "powerCut") seteventText("Cortado")
    else seteventText("")
  }, [event]);

  return (
    <article className='flex flex-col gap-2 p-2 bg-white rounded-lg shadow-md mb-2'>
      <header className='flex items-center justify-between mb-2'>
        <div className="flex flex-row gap-2 text-3xl">
          <button className={`group ${event === "powerCut" ? 'bg-red-500' : event ? 'bg-amber-300' : 'bg-blue-300'} p-2 pl-4 pr-4 rounded btn-glow transition-all`} onClick={getLocation}>
            <i className="bx bx-trip text-white group-hover:text-glow"></i>
          </button>
          <button className={`group ${event === "powerCut" ? 'bg-red-500' : event ? 'bg-amber-300' : 'bg-blue-300'} p-2 pl-4 pr-4 rounded btn-glow transition-all `} onClick={() => openDevice(deviceName)}>
            <i className="bx bx-lock-open text-white group-hover:text-glow"></i>
          </button>
        </div>
        <h2 className='text-xl font-semibold'>{deviceName}</h2>
      </header>
      <section className='flex items-center justify-between'>
        <p>Empresa:</p>
        <p>{owner}</p>
      </section>
      <section className='flex items-center justify-between'>
        <p>Conductor:</p>
        <p>{driver}</p>
      </section>
      <section className='flex items-center justify-between'>
        <section className="flex flex-col gap-2">
          <p>{unit ? "Unidad" : "Latitud"}:</p>
          <p>{port ? "Salida" : "Longitud"}:</p>
          {destiny && "Destino"}
        </section>
        <section className="flex flex-col gap-2">
          <p>{unit || latitude}</p>
          <p>{port || longitude}</p>
          {destiny && destiny}
        </section>
      </section>
      <section className='flex items-center justify-between'>
        <p>Eventos:</p>
        <p>{eventText || event || "N/A"}</p>
      </section>
      <section className='flex items-center justify-between'>
        <p>Estado: {status}</p>
        <p>
          Carga: {charge}
          <i
            className='bx bx-trash text-2xl cursor-pointer ml-2 hover:text-red-500 transition-colors'
            onClick={() => {
              if (deviceName && onDelete) onDelete(deviceName);
            }}
          ></i>
        </p>
      </section>
    </article>
  )
}
