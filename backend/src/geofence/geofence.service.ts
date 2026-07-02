import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';
import { Geofences } from './entity/geofences.entity';
import { Repository } from 'typeorm';

type LonLat = { lon: number; lat: number };

@Injectable()
export class GeofenceService {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Geofences) private geofenceRepository: Repository<Geofences>,
  ) {}

  private readonly traccarApiUrl = process.env.My_Ip;
  private readonly traccarUser = process.env.TRACCAR_USER;
  private readonly traccarPass = process.env.TRACCAR_PASS;

  private buildAuthHeaders(email: string, password: string) {
    return {
      Authorization: this.authService.authHeader(email, password),
      'Content-Type': 'application/json',
    };
  }

  async getGeofences() {
    try {
      const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!);
      const response = await axios.get(`${this.traccarApiUrl}/geofences`, { headers });
      return response.data;
    } catch (error) {
      throw new HttpException('Error obteniendo todos los dispositivos', HttpStatus.UNAUTHORIZED);
    }
  }

  detectTypeFromTraccar(geofence: any): 'Polygon' | 'Circle' | 'LineString' {
    const s = String(geofence?.area ?? '').trim().toUpperCase();

    if (s.startsWith('POLYGON')) return 'Polygon';
    if (s.startsWith('CIRCLE')) return 'Circle';
    if (s.startsWith('LINESTRING')) return 'LineString';

    throw new HttpException('Unknown geofence type', HttpStatus.BAD_REQUEST);
  }

  async asignGeofenceFromTraccarToDB(): Promise<Geofences[]> {
    const geofencesFromTraccar = await this.getGeofences();

    if (!Array.isArray(geofencesFromTraccar)) {
      throw new HttpException('Traccar response is not an array', HttpStatus.BAD_GATEWAY);
    }

    const saved: Geofences[] = [];

    for (const geofence of geofencesFromTraccar) {
      const type = this.detectTypeFromTraccar(geofence);

      const newGeofence = this.geofenceRepository.create({
        name: geofence.name,
        type,
        geometry: geofence.area, // WKT / Traccar area string
      });

      const savedGeofence = await this.geofenceRepository.save(newGeofence);
      saved.push(savedGeofence);
    }

    return saved;
  }


  async isInsideAnyGeofence(lat: number, lon: number): Promise<boolean> {
    const geofences = await this.geofenceRepository.find();
    for (const g of geofences) {
      if (this.isPointInsideGeofence({ lat, lon }, g)) return true;
    }
    return false;
  }

  async findContainingGeofence(lat: number, lon: number): Promise<Geofences | null> {
    const geofences = await this.geofenceRepository.find();
    for (const g of geofences) {
      if (this.isPointInsideGeofence({ lat, lon }, g)) return g;
    }
    return null;
  }

  private isPointInsideGeofence(point: LonLat, geofence: Geofences): boolean {
    const wkt = String(geofence.geometry ?? '').trim();

    if (!wkt) return false;

    const upper = wkt.toUpperCase();

    // CIRCLE (lon lat, radiusMeters)
    if (upper.startsWith('CIRCLE')) {
      const circle = this.parseCircleWkt(wkt);
      if (!circle) return false;
      const d = this.haversineMeters(point, circle.center);
      return d <= circle.radiusMeters;
    }

    // POLYGON ((lon lat, lon lat, ...))
    if (upper.startsWith('POLYGON')) {
      const polygon = this.parsePolygonWkt(wkt);
      if (!polygon || polygon.length < 3) return false;
      return this.pointInPolygon(point, polygon);
    }

    return false;
  }

  // ---------- Parsers ----------

  private parseCircleWkt(wkt: string): { center: LonLat; radiusMeters: number } | null {
    const m = wkt.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i);
    if (!m) return null;

    const lon = Number(m[1]);
    const lat = Number(m[2]);
    const radiusMeters = Number(m[3]);

    if (![lon, lat, radiusMeters].every((n) => Number.isFinite(n))) return null;
    return { center: { lon, lat }, radiusMeters };
  }

  private parsePolygonWkt(wkt: string): LonLat[] | null {

    const m = wkt.match(/POLYGON\s*\(\(\s*(.+?)\s*\)\)/i);
    if (!m) return null;

    const coordsText = m[1]; // "lon lat, lon lat, ..."
    const pairs = coordsText.split(',').map((s) => s.trim()).filter(Boolean);

    const points: LonLat[] = [];
    for (const p of pairs) {
      const [lonStr, latStr] = p.split(/\s+/);
      const lon = Number(lonStr);
      const lat = Number(latStr);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      points.push({ lon, lat });
    }

    if (points.length >= 2) {
      const first = points[0];
      const last = points[points.length - 1];
      if (first.lon === last.lon && first.lat === last.lat) {
        points.pop();
      }
    }

    return points;
  }

  private pointInPolygon(point: LonLat, polygon: LonLat[]): boolean {
    // Ray casting
    const x = point.lon;
    const y = point.lat;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lon, yi = polygon[i].lat;
      const xj = polygon[j].lon, yj = polygon[j].lat;

      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  private haversineMeters(a: LonLat, b: LonLat): number {
    const R = 6371000; // Earth radius meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);

    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(s));
  }
}