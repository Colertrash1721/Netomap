import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DevicesService } from 'src/devices/devices.service';
import { RoutesService } from 'src/routes/routes.service';
import { TraccarService } from 'src/traccar/traccar.service';
import { json } from 'stream/consumers';
import { throws } from 'assert';
import { PositionType } from 'src/types/positionType';
import { HttpException } from '@nestjs/common';
import { GeofenceService } from 'src/geofence/geofence.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly routesService: RoutesService,
    @Inject(forwardRef(() => TraccarService))
    private readonly traccarService: TraccarService,
    private readonly geofenceService: GeofenceService
  ) { }
  @WebSocketServer()
  server: Server;
  private offRouteCooldownMs = 30 * 60 * 1000;
  private offRouteLastSent = new Map<number, number>();

  private canSendOffRoute(deviceId: number) {
    const now = Date.now();
    const last = this.offRouteLastSent.get(deviceId) ?? 0;
    if (now - last < this.offRouteCooldownMs) return false;
    this.offRouteLastSent.set(deviceId, now);
    return true;
  }

  private readonly EVENT_TYPE_MAP: Record<string, number> = {
    geofenceEnter: 1,
    geofenceExit: 2,

    deviceOnline: 3,
    deviceOffline: 4,

    deviceMoving: 5,
    deviceStopped: 6,

    deviceOverspeed: 7,

    unlock: 8,
    lock: 9,

    cut: 10,
    alarm: 11,
  };

  private readonly UNKNOWN_EVENT_TYPE_ID = 0;

  handleConnection(client: Socket) {
    console.log(`✅ Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Cliente desconectado: ${client.id}`);
  }

  // Llamado desde el Controller
  async broadcastTraccarEvent(payload: any) {
    this.server.emit('traccarEvent', payload);

    // =========================
    // EVENTS
    // =========================
    if (payload.events && Array.isArray(payload.events) && payload.events.length > 0) {
      const eventObj = payload.events[0];

      this.server.emit('traccarEvent', payload);
      return await this.traccarService.createEvent({
        deviceId: eventObj.deviceId,
        eventTime: eventObj.eventTime,
        id: eventObj.id,
        type: eventObj.type,
        attributes: eventObj.attributes,
      });
    }

    // =========================
    // POSITIONS
    // =========================
    if (!payload.positions || !Array.isArray(payload.positions) || payload.positions.length === 0) {
      return;
    }

    const p = payload.positions[0];

    const deviceId = Number(p.deviceId);
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);

    // Prepara payload de posición (se guarda AL FINAL)
    const positionPayload: PositionType = {
      idPosition: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      speed: p.speed,
      batteryPercentage: p.attributes?.batteryLevel,
      course: p.course,
      deviceId: p.deviceId,
      serverTime: p.serverTime,
      deviceTime: p.deviceTime,
      accuracy: p.accuracy,
      satellites: p.attributes?.sat,
      blocked: false,
      creationDate: new Date(),
    };

    try {
      if (!Number.isFinite(deviceId) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('deviceId/lat/lng inválidos');
      }

      // 1) validar dispositivo
      const device = await this.devicesService.findDeviceById(deviceId);
      const deviceName = device?.name?.trim();

      if (!deviceName) {
        // no hay nombre => no podemos resolver ruta
        return await this.devicesService.createPosition(positionPayload);
      }

      // 2) validar si tiene ruta
      const route = await this.routesService.findRouteByDeviceName(deviceName);

      if (route?.routeGeometry) {
        // 3) si tiene ruta => verificar geozona
        const insideGeofence = await this.geofenceService.isInsideAnyGeofence(lat, lng);

        // 4) si NO está dentro de geozona => validar fuera de ruta
        if (!insideGeofence) {
          const threshold = Number(route.thresholdMeters ?? 100);

          const { onRoute } = await this.routesService.isDeviceOnAnyRoute({
            lat,
            lng,
            mainGeometry: route.routeGeometry,
            alternatives: route.routeAlternatives,
            thresholdMeters: Number.isFinite(threshold) ? threshold : 100,
          });

          if (!onRoute && this.canSendOffRoute(deviceId)) {
            const outPayload = {
              type: 'outOfRoute',
              deviceId,
              deviceName,
              position: { lat, lng },
              thresholdMeters: Number.isFinite(threshold) ? threshold : 100,
              serverTime: p.serverTime,
            };

            this.server.emit('outOfRoute', outPayload);
            this.server.emit('traccarEvent', { events: [outPayload] });
          }
        }
      }

      return await this.devicesService.createPosition(positionPayload);

    } catch (err: any) {
      console.error('Error procesando posición:', err?.message ?? err);
      return await this.devicesService.createPosition(positionPayload);
    }
  }

  private getEventTypeId(type: any): number {
    if (typeof type !== 'string') return this.UNKNOWN_EVENT_TYPE_ID;
    const key = type.trim();
    if (!key) return this.UNKNOWN_EVENT_TYPE_ID;
    return this.EVENT_TYPE_MAP[key] ?? this.UNKNOWN_EVENT_TYPE_ID;
  }

  private isKnownEventType(type: any): boolean {
    if (typeof type !== 'string') return false;
    const key = type.trim();
    return !!key && Object.prototype.hasOwnProperty.call(this.EVENT_TYPE_MAP, key);
  }
}