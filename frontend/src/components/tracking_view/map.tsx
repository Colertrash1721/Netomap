import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { fetchDevices, fetchPositions } from "@/services/traccar/fetchDevices";
import { useTraccarSocket } from "@/hooks/tracking/useTraccarDevice";
import { Device, Position } from "@/types/traccar";
import { fetchAllRoutes } from "@/services/routes/fetchRoutes";
import { fetchGeofences } from "@/services/routes/fetchGeofences"; // ⬅️ NUEVO
import { isPointInAnyGeofence, TraccarGeofence } from "@/utils/geofences";   // ⬅️ NUEVO

import haversine from "haversine-distance";
import Swal from "sweetalert2";
import useSound from "use-sound";
import { postAutoReport } from "@/services/reports/postAutoReport";

// ICONOS personalizados
const truckIcon = new L.Icon({
  iconUrl: "/icons/truck.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
const startIcon = new L.Icon({
  iconUrl: "/icons/start.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
const endIcon = new L.Icon({
  iconUrl: "/icons/end.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const center: [number, number] = [18.4861, -69.9312];

// 🔄 Subcomponente para mover el mapa al punto seleccionado
function FlyToSelectedLocation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], 17); // Zoom pegado
    }
  }, [lat, lon, map]);

  return null;
}

export default function ClientMap() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [routeLines, setRouteLines] = useState<[number, number][][]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [gatewayData, setGatewayData] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string>('');
  const [playAlarm] = useSound('/sound/outofRoute.mp3', { volume: 0.5 });
  const [email, setEmail] = useState('')

  // ⬇️ NUEVO: geocercas
  const [geofences, setGeofences] = useState<TraccarGeofence[]>([]);

  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLon, setSelectedLon] = useState<number | null>(null);

  useTraccarSocket({
    setPositions,
    setEvents,
    setGatewayData,
    setMessage,
    setLoginStatus,
  });

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

        // Mezcla inicial por deviceId (no reemplaza si ya hay socket corriendo)
        setPositions(prev => {
          const byDevice = new Map<number, Position>();
          for (const p of prev) if (p.deviceId != null) byDevice.set(p.deviceId, p);
          for (const p of pos) if (p.deviceId != null) byDevice.set(p.deviceId, p);
          return Array.from(byDevice.values());
        });

        // ⬇️ NUEVO: cargar geocercas
        try {
          const fences = await fetchGeofences();
          setGeofences(fences);
        } catch (ge) {
          console.error("Error cargando geocercas:", ge);
        }

        await loadRoutes(dev);
      } catch (e) {
        console.error("Error cargando datos:", e);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchRouteLines = async () => {
      if (!routes.length) return;

      const lines: [number, number][][] = [];

      for (const route of routes) {
        const origin = [parseFloat(route.Startlatitud), parseFloat(route.Startlongitud)];
        const destination = [parseFloat(route.Endlatitud), parseFloat(route.Endlongitud)];

        try {
          const resp = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&alternatives=true`
          );
          const data = await resp.json();

          if (data.routes) {
            data.routes.forEach((r: any) => {
              const coordinates: [number, number][] = r.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
              );
              lines.push(coordinates);
            });
          }
        } catch (err) {
          console.error("OSRM error:", err);
        }
      }

      setRouteLines(lines);
    };

    fetchRouteLines();
  }, [routes]);

  useEffect(() => {
    const distanceThreshold = 100; // metros

    const checkOutOfRoute = () => {
      if (!devices.length || !positions.length || !routeLines.length) return;

      devices.forEach((device) => {
        const pos = positions.find(p => p.deviceId === device.id);
        if (!pos) return;

        const lat = Number(pos.latitude);
        const lng = Number(pos.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        // ⬇️ NUEVO: primero validar geocerca (si está dentro de alguna, NO alertar fuera de ruta)
        if (geofences.length > 0 && isPointInAnyGeofence([lat, lng], geofences)) {
          return; // está en geocerca ⇒ salta “fuera de ruta”
        }

        const currentPos: [number, number] = [lat, lng];

        const route = routes.find(r => r.device_Name?.toLowerCase().trim() === device.name?.toLowerCase().trim());
        if (!route) return;

        const origin = [parseFloat(route.Startlatitud), parseFloat(route.Startlongitud)];
        const destination = [parseFloat(route.Endlatitud), parseFloat(route.Endlongitud)];

        const relatedLines = routeLines.filter(line => {
          if (line.length < 2) return false;
          const first = line[0];
          const sameStart = haversine(
            { latitude: first[0], longitude: first[1] },
            { latitude: origin[0], longitude: origin[1] }
          ) < 100;
          const sameEnd = haversine(
            { latitude: first[0], longitude: first[1] },
            { latitude: destination[0], longitude: destination[1] }
          ) < 100;
          return sameStart && sameEnd;
        });

        const isOnRoute = relatedLines.some(line =>
          line.some(point =>
            haversine(
              { latitude: point[0], longitude: point[1] },
              { latitude: currentPos[0], longitude: currentPos[1] }
            ) < distanceThreshold
          )
        );

        if (!isOnRoute) {
          if ((window as any)[`offRoute_${device.id}`]) return;

          Swal.fire({
            position: 'bottom-end',
            icon: 'warning',
            title: `Dispositivo fuera de ruta`,
            text: `El dispositivo ${device.name} se ha salido de la ruta.`,
            timer: 10000,
            timerProgressBar: true,
            showConfirmButton: false,
            backdrop: false
          });

          playAlarm();
          (window as any)[`offRoute_${device.id}`] = true;

          setTimeout(() => {
            delete (window as any)[`offRoute_${device.id}`];
          }, 60 * 1000 * 30);
        }
      });
    };

    const interval = setInterval(checkOutOfRoute, 15000);
    return () => clearInterval(interval);
  }, [devices, positions, routeLines, routes, playAlarm, geofences]); // ⬅️ añade geofences a deps

  useEffect(() => {
  const stored = localStorage.getItem("email") || ""; // fallback ""
  const normalized = stored.trim().toLowerCase();

  if (normalized === "corripio@gmail.com") {
    setEmail("doris.munoz@corripio.com.do");
  } else {
    setEmail(stored.trim()); // puede quedar "", pero nunca undefined
  }
  console.log(stored);
  
}, []);
  

  useEffect(() => {
    const handlePostAutoReport = async (rawDeviceName: string, email: string) => {
    try {
      await postAutoReport(rawDeviceName, email);
    } catch (e) {
      console.error('Fallo generando auto-report:', e);
    }
  };
    const distanceThreshold = 100;
    positions.forEach((pos) => {
      const device = devices.find(d => d.id === pos.deviceId);
      const unlock = events.some(ev => ev?.deviceId === pos.deviceId && ev?.attributes?.alarm === 'unlock');
      const deviceName = device?.name;
      if (!deviceName) return;

      const route = routes.find(r => r.device_Name?.toLowerCase().trim() === deviceName);
      if (!route) return;

      const lat = Number(pos.latitude);
      const lng = Number(pos.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      if (route.Endlatitud && route.Endlongitud) {
        const startPoint = {
          latitude: parseFloat(route.Endlatitud),
          longitude: parseFloat(route.Endlongitud),
        };

        const currentPos = {
          latitude: lat,
          longitude: lng,
        };

        const distance = haversine(startPoint, currentPos);
        if (distance <= 100 && unlock && !(window as any)[`unlockEnd_${pos.deviceId}`]) {
          Swal.fire({
            icon: 'success',
            title: `✅ El dispositivo ${deviceName} llegó a su ruta`,
            toast: true,
            position: 'bottom-end',
            timer: 4000,
            showConfirmButton: false
          });
          handlePostAutoReport(deviceName, email);
          (window as any)[`startReached_${pos.deviceId}`] = true;

          setTimeout(() => {
            delete (window as any)[`startReached_${pos.deviceId}`];
          }, 60 * 1000);


        }
      }
    });
  }, [positions, routes, devices, events]);

  // 👇 Mapa de posiciones por deviceId para acceso O(1)
  const positionsByDevice = useMemo(() => {
    const m = new Map<number, Position>();
    for (const p of positions) if (p.deviceId != null) m.set(p.deviceId, p);
    return m;
  }, [positions]);

  // 👇 Escucha cambios en localStorage y actualiza el punto seleccionado
  useEffect(() => {
    const checkStoredLocation = () => {
      const lat = localStorage.getItem("latitude");
      const lon = localStorage.getItem("longitude");

      if (lat && lon) {
        const nlat = parseFloat(lat);
        const nlon = parseFloat(lon);
        if (Number.isFinite(nlat) && Number.isFinite(nlon)) {
          setSelectedLat(nlat);
          setSelectedLon(nlon);
        }
      }
    };

    checkStoredLocation();
    const interval = setInterval(checkStoredLocation, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={10}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Dispositivos */}
      {devices.map(device => {
        const pos = positionsByDevice.get(device.id!);
        if (!pos) return null;

        const lat = Number(pos.latitude);
        const lng = Number(pos.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return (
          <Marker
            key={`${device.id}-${lat.toFixed(5)}-${lng.toFixed(5)}`} // fuerza remount cuando cambian coords
            position={[lat, lng] as [number, number]}
            icon={truckIcon}
          >
            <Popup>{`Device: ${device.name} (ID: ${device.id})`}</Popup>
          </Marker>
        );
      })}

      {/* Marcadores de inicio y fin */}
      {routes.map((route: any, idx: number) => {
        const start: [number, number] = [
          parseFloat(route.Startlatitud),
          parseFloat(route.Startlongitud),
        ];
        const end: [number, number] = [
          parseFloat(route.Endlatitud),
          parseFloat(route.Endlongitud),
        ];

        if (!start.every(Number.isFinite) || !end.every(Number.isFinite)) {
          return null;
        }

        return (
          <div key={`route-markers-${idx}`}>
            <Marker position={start} icon={startIcon}>
              <Popup>Inicio de ruta</Popup>
            </Marker>
            <Marker position={end} icon={endIcon}>
              <Popup>Fin de ruta</Popup>
            </Marker>
          </div>
        );
      })}

      {/* Líneas de rutas */}
      {routeLines.map((line, idx) => (
        <Polyline
          key={`line-${idx}`}
          positions={line}
          pathOptions={{
            color: idx % 2 === 0 ? "blue" : "red",
            dashArray: idx % 2 === 0 ? undefined : "8"
          }}
        />
      ))}

      {/* Punto seleccionado */}
      {selectedLat !== null && selectedLon !== null && (
        <FlyToSelectedLocation lat={selectedLat} lon={selectedLon} />
      )}
    </MapContainer>
  );
}