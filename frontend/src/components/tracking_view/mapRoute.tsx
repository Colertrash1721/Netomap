"use client";

import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    Popup,
    useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { asignConcurrent, getAllConcurrentRoutes } from "@/services/routes/concurrent";
import { fetchDevices, fetchPositions } from "@/services/traccar/fetchDevices";
import { useTraccarSocket } from "@/hooks/tracking/useTraccarDevice";
import { Device, Position } from "@/types/traccar";
import { fetchAllRoutes } from "@/services/routes/fetchRoutes";
import { deleteConcurrent } from "@/services/routes/concurrent";
import useMapRoute from "@/hooks/tracking/useMapRoute";
import Swal from "sweetalert2";

// ICONOS personalizados
const truckIcon = new L.Icon({ iconUrl: "/icons/truck.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const startIcon = new L.Icon({ iconUrl: "/icons/start.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const endIcon = new L.Icon({ iconUrl: "/icons/end.png", iconSize: [32, 32], iconAnchor: [16, 32] });
const routePointIcon = new L.Icon({ iconUrl: "/icons/pin.png", iconSize: [32, 32], iconAnchor: [16, 32] });

const center: [number, number] = [18.4861, -69.9312];

export default function ClientRouteMap() {
    const { handleSubmit } = useMapRoute();
    const [devices, setDevices] = useState<Device[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [routeLines, setRouteLines] = useState<[number, number][][]>([]);
    const [concurrentRoutes, setConcurrentRoutes] = useState<any[]>([]);
    const [selectedConcurrentId, setSelectedConcurrentId] = useState<string | null>(null);


    const [events, setEvents] = useState<any[]>([]);
    const [gatewayData, setGatewayData] = useState<any>(null);
    const [message, setMessage] = useState<string>('');
    const [loginStatus, setLoginStatus] = useState<string>('');

    const [routePoints, setRoutePoints] = useState<[number, number][]>([]);

    // 👉 WS actualiza posiciones y eventos en tiempo real
    useTraccarSocket({ setPositions, setEvents, setGatewayData, setMessage, setLoginStatus });

    // 🚩 Cargar dispositivos y rutas
    useEffect(() => {
        const loadRoutes = async (deviceList: Device[]) => {
            try {
                const rou = await fetchAllRoutes();
                const deviceNames = new Set(deviceList.map(d => d.name?.toLowerCase().trim()));
                const filteredRoutes = rou.filter((route: any) =>
                    deviceNames.has(route.device_Name?.toLowerCase().trim())
                );
                setRoutes(filteredRoutes);
            } catch (error) {
                console.error("Error fetching routes:", error);
            }
        };

        const init = async () => {
            try {
                const dev = await fetchDevices();
                const pos = await fetchPositions();
                setDevices(dev);
                setPositions(pos);
                await loadRoutes(dev);
            } catch (e) {
                console.error("Error cargando datos:", e);
            }
        };

        init();
    }, []);

    // Cargar rutas concurrentes
    useEffect(() => {
        const loadConcurrentRoutes = async () => {
            try {
                const data = await getAllConcurrentRoutes();
                setConcurrentRoutes(data);
            } catch (e) {
                console.error("Error cargando rutas concurrentes:", e);
            }
        };
        loadConcurrentRoutes();
    }, []);


    // 🔗 Calcular líneas desde rutas existentes
    useEffect(() => {
        const fetchRouteLines = async () => {
            if (!routes.length) return;
            const lines: [number, number][][] = [];

            for (const route of routes) {
                const origin = [parseFloat(route.Startlatitud), parseFloat(route.Startlongitud)];
                const destination = [parseFloat(route.Endlatitud), parseFloat(route.Endlongitud)];

                try {
                    const resp = await fetch(
                        `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`
                    );
                    const data = await resp.json();

                    if (data.routes && data.routes[0]) {
                        const coordinates: [number, number][] = data.routes[0].geometry.coordinates.map(
                            ([lng, lat]: [number, number]) => [lat, lng]
                        );
                        lines.push(coordinates);
                    }
                } catch (err) {
                    console.error("OSRM error:", err);
                }
            }

            setRouteLines(lines);
        };

        fetchRouteLines();
    }, [routes]);

    const handleConcurrentSelect = async (routeId: string) => {
        console.log(routeId);


        setSelectedConcurrentId(routeId);

        const selectedRoute = concurrentRoutes.find((r) => r.routeName === routeId);
        if (!selectedRoute) return;

        const { value: deviceName } = await Swal.fire({
            title: 'Asignar ruta',
            input: 'text',
            inputLabel: 'Nombre del dispositivo',
            inputPlaceholder: 'Ej: 8044500474',
            showCancelButton: true,
            confirmButtonText: 'Asignar'
        });

        if (!deviceName) return;

        const response = await asignConcurrent({
            rute_name: routeId,
            deviceName,
            latStart: Number(selectedRoute.Startlatitud),
            lonStart: Number(selectedRoute.Startlongitud),
            latEnd: Number(selectedRoute.Endlatitud),
            lonEnd: Number(selectedRoute.Endlongitud)
        });

        if (!response) {
            await Swal.fire({
                title: 'Error',
                text: 'Hubo un error asignando el dispositivo',
                icon: 'error'
            });
        } else {
            await Swal.fire({
                title: 'Éxito',
                text: `Ruta asignada al dispositivo ${deviceName}`,
                icon: 'success'
            });
        }
    };

    const handleDeleteConcurrent = async (routeName: string) => {
        const confirm = await Swal.fire({
            title: "Borrar ruta",
            text: `¿Seguro que quieres eliminar la ruta "${routeName}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!confirm.isConfirmed) return;

        try {
            await deleteConcurrent(routeName);

            setConcurrentRoutes((prev) =>
                prev.filter((route) => route.routeName !== routeName)
            );

            Swal.fire("Eliminada", "La ruta fue eliminada correctamente", "success");
        } catch (error) {
            console.error("Error al eliminar la ruta:", error);
            Swal.fire("Error", "No se pudo eliminar la ruta", "error");
        }
    };


    // 👉 Manejar clics en el mapa
    function ClickHandler() {
        useMapEvents({
            click(e) {
                const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
                setRoutePoints(prev => {
                    if (prev.length < 2) return [...prev, newPoint];
                    return [newPoint]; // reinicia con nuevo punto si ya hay 2
                });
            }
        });
        return null;
    }

    // 👉 Establecer ruta
    const handleSetRoute = () => {
        if (routePoints.length < 2) {
            console.warn("Debes seleccionar dos puntos");
            return;
        }

        const [start, end] = routePoints;
        handleSubmit(start[0], start[1], end[0], end[1]);
    };

    return (
        <>
            <MapContainer
                center={center}
                zoom={10}
                scrollWheelZoom={true}
                style={{ width: "100%", height: "100%", zIndex: 0 }}
            >
                <ClickHandler />

                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {devices.map(device => {
                    const pos = positions.find(p => p.deviceId === device.id);
                    if (!pos) return null;

                    return (
                        <Marker
                            key={device.id}
                            position={[pos.latitude!, pos.longitude!]}
                            icon={truckIcon}
                        >
                            <Popup>{`Device: ${device.name} (ID: ${device.id})`}</Popup>
                        </Marker>
                    );
                })}

                {/* {routes.map((route: any, idx: number) => {
                    const start: [number, number] = [parseFloat(route.Startlatitud), parseFloat(route.Startlongitud)];
                    const end: [number, number] = [parseFloat(route.Endlatitud), parseFloat(route.Endlongitud)];
                    return (
                        <div key={`route-markers-${idx}`}>
                            <Marker position={start} icon={startIcon}><Popup>Inicio de ruta</Popup></Marker>
                            <Marker position={end} icon={endIcon}><Popup>Fin de ruta</Popup></Marker>
                        </div>
                    );
                })} */}

                {/* {routeLines.map((line, idx) => (
                    <Polyline key={`line-${idx}`} positions={line} pathOptions={{ color: "blue" }} />
                ))} */}

                {/* Marcadores manuales */}
                {routePoints.map((point, idx) => (
                    <Marker key={`manual-point-${idx}`} position={point} icon={startIcon}>
                        <Popup>{idx === 0 ? "Inicio personalizado" : "Fin personalizado"}</Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Botón flotante para establecer ruta */}
            <button
                onClick={handleSetRoute}
                className="fixed bottom-4 right-4 bg-brand-blue text-white px-6 py-3 rounded-full shadow-xl z-[9999] hover:bg-blue-700 transition"
            >
                Establecer ruta
            </button>

            {/* Select flotante para rutas concurrentes */}
            <div className="fixed bottom-20 right-4 bg-white p-3 rounded-lg shadow-lg z-[9999] w-72 max-h-96 overflow-y-auto">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Rutas concurrentes:
                </h2>
                <ul className="flex flex-col gap-2">
                    {concurrentRoutes.map((route: any) => (
                        <li
                            key={route.idRoute}
                            className="flex justify-between items-center border border-gray-200 rounded px-3 py-2 hover:bg-gray-100 transition"
                        >
                            <span className="text-sm text-black truncate w-[60%]">{route.routeName}</span>
                            <div className="flex gap-2">
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                    onClick={() => handleConcurrentSelect(route.routeName)}
                                >
                                    Asignar
                                </button>
                                <button
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                    onClick={() => handleDeleteConcurrent(route.routeName)}
                                >
                                    X
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

        </>
    );
}
