import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import { TraccarService } from './traccar.service';

@Controller('traccar')
export class TraccarController {
  constructor(private readonly eventsGateway: EventsGateway,
    private readonly traccarService: TraccarService
  ) {}

  // Utilidad para “normalizar” el payload del forward (GET/POST)
  private normalizeForwardPayload(input: any) {
    // Ejemplos de formas que envía Traccar:
    // - GET: ?id=123&deviceId=45&type=alarm&... (todo string)
    // - POST JSON: { id, deviceId, type, attributes: { alarm: ... } }
    const id =
      Number(input.id ?? input.eventId ?? input.eventID) || undefined;
    const deviceId = Number(input.deviceId) || undefined;

    // El “tipo de evento” a veces viene como `type`, a veces dentro de `attributes.alarm`
    const alarm =
      input?.attributes?.alarm ??
      input?.type ??
      input?.eventType ??
      undefined;

    return {
      id,
      deviceId,
      attributes: { alarm },
    };
  }

  @Get('webhook')
  async handleForwardGet(@Query() query: any) {
    console.log('🌐 [GET] Forward recibido de Traccar:', query);

    // 1) emitir a WS
    this.eventsGateway.broadcastTraccarEvent(query);

    // 2) persistir
    const normalized = this.normalizeForwardPayload(query);
    await this.traccarService.createEvent(normalized as any);

    return { status: 'ok', via: 'GET forward' };
  }

  // Para notificaciones tipo Webhook
  @Post('webhook')
  async handleWebhookPost(@Body() payload: any) {
    console.log('🌐 [POST] Webhook recibido de Traccar:', payload);

    // 1) emitir a WS
    this.eventsGateway.broadcastTraccarEvent(payload);

    // 2) persistir
    if (Array.isArray(payload?.events)) {
      // Algunos forwards pueden agrupar varios eventos
      for (const e of payload.events) {
        const normalized = this.normalizeForwardPayload(e);
        await this.traccarService.createEvent(normalized as any);
      }
    } else {
      const normalized = this.normalizeForwardPayload(payload);
      await this.traccarService.createEvent(normalized as any);
    }

    return { status: 'ok', via: 'POST webhook' };
  }

  @Get('all')
  getAllEvents() {
    return this.traccarService.getAllEvents();
  }

  @Get('users')
  getUsersFromTraccar() {
    return this.traccarService.getUsersFromTraccar();
  }

  @Get('device/:deviceName')
  getEventsByDevice(@Param('deviceName') deviceName: string) {
    return this.traccarService.getEventsByDeviceName(deviceName);
  }
}
