'use client';
import { useEffect } from "react";
import { useTrackingDevice } from "@/hooks/devices/useTrackingDevices";
import useReport from "@/hooks/reports/useReport";
import ImageInput from "@/components/ui/imageInput";
import { fetchRouteByDeviceName } from "@/services/routes/fetchRoutes";
import { fetchEventFromDeviceName } from "@/services/events/fetchEvents";

export default function Page() {
  const { devices, assigned } = useTrackingDevice();
  const {
    formData,
    files,
    handleChange,
    handleSubmit,
  } = useReport();

  useEffect(() => {
    const loadDataFromDevice = async () => {
      const selectedDevice = devices.find((d: any) => d.id == formData.device);
      if (!selectedDevice) return;

      const deviceName = selectedDevice.name;
      const driver = assigned.find((a: any) => a.deviceId === selectedDevice.id);

      try {
        const [assignedDriver, routesRes, eventsRes] = await Promise.all([
          Promise.resolve(driver),
          fetchRouteByDeviceName(deviceName),
          fetchEventFromDeviceName(deviceName),
        ]);
        
        const salida = routesRes?.creationDate?.split("T")[0] || "";
        const unlockEvent = eventsRes?.find((e: any) => e.eventType === "unlock");
        const llegada = unlockEvent?.eventDate?.split("T")[0] || "";
        const apertura = unlockEvent?.eventDate?.split("T")[0] || "";
        const conductor = assignedDriver?.drivers[0]?.name || "";
        const today = new Date().toISOString().split("T")[0];

        handleChange({ target: { name: "salida", value: salida } } as any);
        handleChange({ target: { name: "llegada", value: llegada } } as any);
        handleChange({ target: { name: "apertura", value: apertura } } as any);
        handleChange({ target: { name: "conductor", value: conductor } } as any);
        handleChange({ target: { name: "reporte", value: today } } as any);

      } catch (error) {
        console.error("Error cargando datos del dispositivo:", error);
      }
    };

    if (formData.device) {
      loadDataFromDevice();
    }
  }, [formData.device]);

  return (
    <main className="text-black dark:text-white flex flex-col h-screen w-full justify-center gap-4 items-center">
      <section className="w-[90%] h-[80%] grid grid-rows-[20%_80%] gap-4 bg-white shadow-md rounded-md overflow-hidden">
        <header className="bg-brand-blue w-full p-6 flex justify-center text-white text-2xl">
          <div className="w-4/5 flex flex-col justify-center">
            <div className="flex justify-center gap-2 items-center text-3xl">
              <i className="bx bxs-file text-5xl"></i>
              <h1>Reporte del recorrido del precinto electrónico</h1>
            </div>
            <div className="flex justify-center items-center text-xl">
              Por favor ingresar los datos necesarios para generar el reporte
            </div>
          </div>
        </header>

        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="flex gap-4 flex-col">
            {/* Fila 1 */}
            <div className="flex flex-row justify-around w-full items-end">
              <div className="w-[40%]">
                <select
                  name="device"
                  value={formData.device}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black"
                  required
                >
                  <option value="">Seleccione el dispositivo</option>
                  {devices?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-[40%]">
                <label>Fecha de salida:</label>
                <input
                  type="date"
                  name="salida"
                  value={formData.salida}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black"
                  required
                />
              </div>
            </div>

            {/* Fila 2 */}
            <div className="flex flex-row justify-around w-full items-end">
              <div className="w-[40%]">
                <label>Conductor:</label>
                <input
                  type="text"
                  name="conductor"
                  value={formData.conductor}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black outline-none"
                  placeholder="Nombre del conductor"
                  required
                />
              </div>
              <div className="w-[40%]">
                <label>Fecha de llegada:</label>
                <input
                  type="date"
                  name="llegada"
                  value={formData.llegada}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black"
                  required
                />
              </div>
            </div>

            {/* Fila 3 */}
            <div className="flex flex-row justify-around w-full items-end">
              <div className="w-[40%]">
                <label>Unidad de transporte:</label>
                <input
                  type="text"
                  name="unidad"
                  value={formData.unidad}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black outline-none"
                  placeholder="Unidad de transporte"
                  required
                />
              </div>
              <div className="w-[40%]">
                <label>Fecha de apertura:</label>
                <input
                  type="date"
                  name="apertura"
                  value={formData.apertura}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black"
                  required
                />
              </div>
            </div>

            {/* Fila 4 */}
            <div className="flex flex-row justify-around w-full items-end">
              <div className="w-[40%]">
                <label>Responsable de instalación:</label>
                <input
                  type="text"
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black outline-none"
                  placeholder="Nombre del responsable"
                  required
                />
              </div>
              <div className="w-[40%]">
                <label>Fecha de reporte:</label>
                <input
                  type="date"
                  name="reporte"
                  value={formData.reporte}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black"
                  required
                />
              </div>
            </div>

            {/* Fila 5 */}
            <div className="flex flex-row justify-around w-full items-end">
              <div className="w-[40%]">
                <label>Detalles del viaje:</label>
                <input
                  type="text"
                  name="detalles"
                  value={formData.detalles}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black outline-none"
                  placeholder="Observaciones del viaje"
                />
              </div>
              <div className="w-[40%]">
                <label>Recepcionista:</label>
                <input
                  type="text"
                  name="recepcionista"
                  value={formData.recepcionista}
                  onChange={handleChange}
                  className="w-full h-10 border border-white border-b-black"
                  placeholder="Nombre del recepcionista"
                  required
                />
              </div>
            </div>

            {/* Fila 6: Cédula y aperturaImages
            <div className="flex flex-row justify-around w-full items-start">
              <div className="w-[40%]">
                <label className="block mb-2">Cédula del conductor:</label>
                <ImageInput name="driver" multi={false} />
              </div>
              <div className="w-[40%]">
                <label className="block mb-2">Imagen de apertura:</label>
                <ImageInput name="opening" multi />
              </div>
            </div> 
            
            ESTOS DATOS NO SE ENVIAN, CUALQUIER PERSONA QUE LO TOPE BUENA SUERTE
            
            */}

            {/* Botón */}
            <div className="flex justify-center w-full items-center">
              <button
                type="submit"
                className="bg-brand-blue p-2 w-1/2 h-10 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Generar informe
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}