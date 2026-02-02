// src/utils/geofences.ts
import haversine from "haversine-distance";

export type WktShape =
  | { type: "POLYGON"; coordinates: [number, number][][] } // [[ [lat,lon], ... ]] (puede haber hoyos, aquí usamos solo outer ring)
  | { type: "CIRCLE"; center: [number, number]; radiusMeters: number }
  | { type: "LINESTRING"; coordinates: [number, number][]; toleranceMeters?: number };

export type TraccarGeofence = {
  id: number;
  name: string;
  attributes?: { [k: string]: any };
  area: string; // WKT
};

// --- Parser WKT muy básico para POLYGON / CIRCLE / LINESTRING ---

export function parseWkt(area: string, attributes?: Record<string, any>): WktShape | null {
  const s = area.trim();

  if (s.startsWith("POLYGON")) {
    // POLYGON ((lat lon, lat lon, ...))
    const match = s.match(/POLYGON\s*\(\(\s*(.+)\s*\)\)/i);
    if (!match) return null;
    const ringStr = match[1]; // "lat lon, lat lon, ..."
    const coords = ringStr
      .split(",")
      .map(p => p.trim().split(/\s+/).map(Number))
      .map(([lat, lon]) => [lat, lon] as [number, number]);
    return { type: "POLYGON", coordinates: [coords] };
  }

  if (s.startsWith("CIRCLE")) {
    // CIRCLE (lat lon, radiusMeters)
    const match = s.match(/CIRCLE\s*\(\s*([0-9\.\-]+)\s+([0-9\.\-]+)\s*,\s*([0-9\.\-]+)\s*\)/i);
    if (!match) return null;
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    const radius = Number(match[3]);
    return { type: "CIRCLE", center: [lat, lon], radiusMeters: radius };
  }

  if (s.startsWith("LINESTRING")) {
    // LINESTRING (lat lon, lat lon, ...)
    const match = s.match(/LINESTRING\s*\(\s*(.+)\s*\)/i);
    if (!match) return null;
    const lineStr = match[1];
    const coords = lineStr
      .split(",")
      .map(p => p.trim().split(/\s+/).map(Number))
      .map(([lat, lon]) => [lat, lon] as [number, number]);
    const tol =
      typeof attributes?.polylineDistance === "number"
        ? Number(attributes.polylineDistance)
        : // default 100m si no viene
          100;
    return { type: "LINESTRING", coordinates: coords, toleranceMeters: tol };
  }

  return null;
}

// --- Geometría ---

// 1) Punto en polígono (ray casting). coords: [[lat,lon], ...] anillo exterior
export function pointInPolygon(
  point: [number, number],
  polygonRing: [number, number][]
): boolean {
  let inside = false;
  const [y, x] = point; // y=lat, x=lon
  for (let i = 0, j = polygonRing.length - 1; i < polygonRing.length; j = i++) {
    const [yi, xi] = polygonRing[i];
    const [yj, xj] = polygonRing[j];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

// 2) Punto en círculo
export function pointInCircle(
  point: [number, number],
  center: [number, number],
  radiusMeters: number
): boolean {
  const d = haversine(
    { latitude: point[0], longitude: point[1] },
    { latitude: center[0], longitude: center[1] }
  );
  return d <= radiusMeters;
}

// 3) Distancia de punto a segmento en metros (aprox plana; suficiente para tolerancias pequeñas)
function metersPerDegree(lat: number) {
  const latRad = (lat * Math.PI) / 180;
  const mPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
  const mPerDegLon = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);
  return { mPerDegLat, mPerDegLon };
}

function toXYMeters(lat: number, lon: number, lat0: number) {
  const { mPerDegLat, mPerDegLon } = metersPerDegree(lat0);
  return {
    x: lon * mPerDegLon,
    y: lat * mPerDegLat,
  };
}

function pointToSegmentDistanceMeters(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  // Convertimos a un plano local usando lat media como referencia
  const lat0 = (a[0] + b[0] + p[0]) / 3;
  const P = toXYMeters(p[0], p[1], lat0);
  const A = toXYMeters(a[0], a[1], lat0);
  const B = toXYMeters(b[0], b[1], lat0);

  const ABx = B.x - A.x;
  const ABy = B.y - A.y;
  const APx = P.x - A.x;
  const APy = P.y - A.y;

  const ab2 = ABx * ABx + ABy * ABy;
  let t = ab2 === 0 ? 0 : (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));

  const Cx = A.x + ABx * t;
  const Cy = A.y + ABy * t;

  const dx = P.x - Cx;
  const dy = P.y - Cy;

  return Math.sqrt(dx * dx + dy * dy);
}

// 4) Punto cerca de una polilínea (con tolerancia en metros)
export function pointNearLine(
  point: [number, number],
  line: [number, number][],
  toleranceMeters: number
): boolean {
  if (line.length < 2) return false;
  for (let i = 0; i < line.length - 1; i++) {
    const d = pointToSegmentDistanceMeters(point, line[i], line[i + 1]);
    if (d <= toleranceMeters) return true;
  }
  return false;
}

// --- API pública: ¿punto dentro de la geocerca? ---
export function isPointInGeofence(
  point: [number, number],
  fence: TraccarGeofence
): boolean {
  const parsed = parseWkt(fence.area, fence.attributes);
  if (!parsed) return false;

  if (parsed.type === "POLYGON") {
    const ring = parsed.coordinates[0];
    return pointInPolygon(point, ring);
  }
  if (parsed.type === "CIRCLE") {
    return pointInCircle(point, parsed.center, parsed.radiusMeters);
  }
  if (parsed.type === "LINESTRING") {
    return pointNearLine(point, parsed.coordinates, parsed.toleranceMeters ?? 100);
  }
  return false;
}

export function isPointInAnyGeofence(
  point: [number, number],
  fences: TraccarGeofence[]
): boolean {
  for (const f of fences) {
    if (isPointInGeofence(point, f)) return true;
  }
  return false;
}
