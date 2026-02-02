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
  ) { }
  @WebSocketServer()
  server: Server;

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
    console.log('🚀 Broadcasting a clientes WebSocket:', payload);
    this.server.emit('traccarEvent', payload);
    // ... dentro de broadcastTraccarEvent
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

    if (payload.positions) {
      
      const positionPayload: PositionType = {
        idPosition: payload.positions[0].id,
        latitude: payload.positions[0].latitude,
        longitude: payload.positions[0].longitude,
        speed: payload.positions[0].speed,
        batteryPercentage: payload.positions[0].attributes.batteryLevel,
        course: payload.positions[0].course,
        deviceId: payload.positions[0].deviceId,
        serverTime: payload.positions[0].serverTime,
        deviceTime: payload.positions[0].deviceTime,
        accuracy: payload.positions[0].accuracy,
        satellites: payload.positions[0].attributes.sat,
        blocked: false,
        creationDate: new Date(Date.now()),
      }
      const position = await this.devicesService.createPosition(positionPayload);
      return position;
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