import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import WebSocket, { WebSocket as WS } from 'ws';
import { Request } from 'express';

import { EventsGateway } from '../events/events.gateway';
import { Repository } from 'typeorm';
import { Inject, forwardRef } from '@nestjs/common';
import { events } from 'src/types/events';

import { InjectRepository } from '@nestjs/typeorm';
import { Events } from './entities/events.entity';

import { DevicesService } from 'src/devices/devices.service';
import { RoutesService } from 'src/routes/routes.service';
import { device } from 'src/types/device';
import axios from 'axios';

@Injectable()
export class TraccarService {
  private ws: WS | null = null;
  private readonly traccarApiUrl = process.env.My_Ip || 'http://128.85.27.70:8082';
  private readonly TRACCAR_PASS = process.env.TRACCAR_PASS;
  private readonly TRACCAR_USER = process.env.TRACCAR_USER;
  private readonly TRACCAR_AUTH_TOKEN = process.env.My_Token;

  constructor(
     @Inject(forwardRef(() => EventsGateway))
  private readonly eventsGateway: EventsGateway,
    @InjectRepository(Events) private eventRepository: Repository<Events>,
    private readonly deviceService: DevicesService,
    private readonly routeService: RoutesService,
  ) { }

  authHeader(username: string, password: string): string {
    const authHeader = 'Basic ' + btoa(`${username}:${password}`);

    return authHeader;
  }

  public getHeaders(username?: string, password?: string) {
    if (username && password) {
      const header = this.authHeader(username, password);
      return {
        Authorization: `${header}`,
        'Content-Type': 'application/json',
      };
    }

    return {
      Authorization: `Bearer ${this.TRACCAR_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  async openTraccarWS(jsessionId: string) {
    // ✅ Corrige protocolo
    const wsProtocol = this.traccarApiUrl.startsWith('https') ? 'wss' : 'ws';
    const cleanHost = this.traccarApiUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${cleanHost}/socket`;

    console.log(`🌐 Abriendo WS a: ${wsUrl}`);

    this.ws = new WebSocket(wsUrl, {
      headers: {
        Cookie: jsessionId,
      },
    });

    this.ws.on('open', () => {
      console.log('✅ WS Traccar abierto');
    });

    this.ws.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (!payload || typeof payload !== 'object') {
          console.error('❌ Payload WS no es un objeto válido:', data);
          return;
        }
        // Reemitir a todos los clientes Socket.IO
        this.eventsGateway.broadcastTraccarEvent(payload);
      } catch (err) {
        console.error('❌ Error parseando payload WS:', err);
      }
    });

    this.ws.on('close', () => {
      console.log('🔒 WS Traccar cerrado');
    });

    this.ws.on('error', (err) => {
      console.error('❌ WS Error', err);
    });
  }

  // traccar.service.ts (fragmento)
  async createEvent(event: events) {
    try {
      console.log("Intentando reiniciar evento");

      if (!event?.id) {
        console.warn('⚠️ Evento sin `id` válido, ignorando:', event);
        return;
      }
      console.log(event.id);

      if (!event?.deviceId) {
        console.warn('⚠️ Evento sin `deviceId`, ignorando:', event);
        return;
      }

      const device = await this.deviceService.findDeviceById(event.deviceId);
      if (!device) {
        console.warn(`⚠️ No existe deviceId=${event.deviceId} en Devices, ignorando`);
        return;
      }

      const deviceName = device.name;
      const route = await this.routeService.findRouteByDeviceName(deviceName).catch(() => null);
      console.log(route);

      if (route && route.idRute) {
        const toSave = this.eventRepository.create({
          idEvent: event.id,
          idRoute: route.idRute,   // puede ser null
          deviceName,
          eventType: event.attributes?.alarm ?? null, // puede ser null
        });
        await this.eventRepository.upsert(toSave, ['idEvent']);

        console.log(`✅ Evento persistido (idEvent=${event.id}, device=${deviceName})`);
        return true;
      }
      const toSave = this.eventRepository.create({
        idEvent: event.id,
        idRoute: 0,
        deviceName,
        eventType: event.attributes?.alarm ?? null, // puede ser null
      });
      console.log(toSave);


      // Evita error por duplicado PK: usa upsert por idEvent
      await this.eventRepository.upsert(toSave, ['idEvent']);

      console.log(`✅ Evento persistido (idEvent=${event.id}, device=${deviceName})`);
      return true;
    } catch (err: any) {
      console.error('❌ Error en createEvent:', err?.message || err, { event });
    }
  }

  async getEventById(id: number) {
    try {
      return await this.eventRepository.findOne({ where: { idEvent: id } })

    } catch (error) {
      console.error(`❌ Error al obtener eventos del dispositivo ${id}:`, error);
      throw new HttpException('Error al obtener eventos por dispositivo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async getAllEvents() {
    try {
      return await this.eventRepository.find();
    } catch (error) {
      console.error('❌ Error al obtener todos los eventos:', error);
      throw new HttpException('Error al obtener eventos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getEventsByDeviceName(deviceName: string) {
    try {
      return await this.eventRepository.find({
        where: { deviceName },
      });
    } catch (error) {
      console.error(`❌ Error al obtener eventos del dispositivo ${deviceName}:`, error);
      throw new HttpException('Error al obtener eventos por dispositivo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteEventsByDeviceName(deviceName: string) {
    try {
      const deleteResult = await this.eventRepository.delete({ deviceName });
      return {
        message: `Eventos eliminados para el dispositivo "${deviceName}"`,
        affected: deleteResult.affected || 0,
      };
    } catch (error) {
      console.error(`❌ Error al eliminar eventos del dispositivo ${deviceName}:`, error);
      throw new HttpException('Error al eliminar eventos por dispositivo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async asignDriverIntegrationToDriverById(driverId: number, integrationId: number) {
    const headers = this.getHeaders(this.TRACCAR_USER!, this.TRACCAR_PASS!);

    // Obtener todos los drivers y buscar el que corresponde
    const { data: drivers } = await axios.get<any[]>(
      `${this.traccarApiUrl}/drivers`,
      { headers },
    );

    const driver = drivers.find((d: any) => d.id === driverId);

    if (!driver) {
      throw new HttpException('Driver no encontrado en Traccar', HttpStatus.NOT_FOUND);
    }

    console.log('Actualizando integrationId del driver:', driver.id, integrationId);

    const updated = {
      ...driver,
      attributes: {
        ...(driver.attributes || {}),
        integrationId,
      },
    };

    await axios.put(
      `${this.traccarApiUrl}/drivers/${driver.id}`,
      updated,
      { headers },
    );

    return updated;
  }

  async asignEventIntegrationToEventById(idEvent: number, eventIntegrationId: number) {
    if (!Number.isFinite(idEvent) || idEvent <= 0) {
      throw new HttpException('idEvent inválido', HttpStatus.BAD_REQUEST);
    }

    if (!Number.isFinite(eventIntegrationId) || eventIntegrationId <= 0) {
      throw new HttpException('eventIntegrationId inválido', HttpStatus.BAD_REQUEST);
    }

    const result = await this.eventRepository.update(
      { idEvent },
      { eventIntegrationId },
    );

    if (!result.affected) {
      throw new HttpException(
        `Evento no encontrado (idEvent=${idEvent})`,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      message: '✅ eventIntegrationId asignado correctamente',
      idEvent,
      eventIntegrationId,
    };
  }
}
