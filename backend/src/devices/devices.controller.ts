import { Controller, Get, Req, Post, Body } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Request } from 'express';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) { }

  /**
   * GET /devices
   * Obtiene todos los dispositivos de esta cuenta desde Traccar
   */
  @Get()
  getDevices(@Req() req: Request) {
    return this.devicesService.getDevicesFromTraccar(req)
  }

  /**
   * GET ALL/devices/BD
   * Obtiene todos los dispositivos de esta cuenta desde la base de datos, incluyendo los que no estan asignados a este usuario
   */
  @Get('all/BD')
  getAllDevicesFromDB(@Req() req: Request) {
    console.log("Llamando a todos los dispositivos");
    
    return this.devicesService.getAllDevicesFromBD(req);
  }

  /**
   * POST /devices/asignUserToDevice
   * Envia un comando para asignar el usuario al dispositivo y si ya hay otro asignado lo elimina
   */
  @Post('asignUserToDevice')
  asignUserToDevice(@Req() Req: Request,
    @Body() body: { deviceName: string, userId: number }) {
    const { deviceName, userId } = body;
    return this.devicesService.asignUserToDevice(Req, deviceName, userId)
  }
  
  /**
   * GET /devices/assigned/BD
   * Obtiene todos los dispositivos asignados a este usuario desde la base de datos
   */
  @Get('assigned/BD')
  getAssignedDevicesFromDB(@Req() req: Request) { 
    return this.devicesService.getDeviceByUserIdFromBD(req);
  }

  /**
   * GET /devices/sincronizeDB
   * Sincroniza la base de datos con los dispositivos de Traccar, eliminando los que no existan en Traccar y añadiendo los nuevos
   */
  @Get('sincronizeDB')
  sincronizeDB(@Req() req: Request) {
    return this.devicesService.sincronizeDeviceToDB();
  }

  /**
   * GET /devices/drivers
   * Obtiene todos los conductores de esta cuenta desde Traccar
   */
  @Get('drivers')
  getDrivers(@Req() req: Request) {
    return this.devicesService.getDriversFromTraccar(req);
  }

  /**
   * GET /devices/assigned-drivers
   * Obtiene los conductores asignados por dispositivo
   */
  @Get('assigned-drivers')

  getDeviceDrivers(@Req() req: Request) {
    return this.devicesService.getDeviceDriver(req);
  }

  /**
   *  GET /devices/positions
   *  Obtiene todas las posiciones de los dispositivos
   */
  @Get('positions')

  getPositions(@Req() Req: Request) {
    return this.devicesService.getPositionFromTraccar(Req);
  }

  /**
   *  GET /devices/different/devices
   *  Obtiene todos los dispositivos que no esten asignados a este usuario
   */
  @Get('different/devices')
  getDifferentDevices(@Req() Req: Request) {
    return this.devicesService.getDifferentDevices(Req)
  }

  /**
   * GET /devices/different/drivers
   * Obtiene todos los conductores que no estan asignados a este usuario
   */
  @Get('different/drivers')
  getDifferentDrivers(@Req() Req: Request) {
    return this.devicesService.getDifferentDrivers(Req)
  }

  /**
   * POST /devices/openCommand
   * Envia el comando de apertura al dispositivo
   */
  @Post('openCommand')
  sendOpenCommand(@Req() Req: Request,
    @Body() body: { deviceName: string }) {
    const { deviceName } = body;
    return this.devicesService.openDeviceByCommand(Req, deviceName)
  }

  /**
   * POST /devices/asignDriverToDevice
   * Envia un comando para asignar el conductor al dispositivo y si ya hay otro asignado lo elimina
   */
  @Post('asignDriverToDevice')
  asignDriverToDevice(@Req() Req: Request,
    @Body() body: { driverName: string, deviceName: string }) {
    const { driverName, deviceName } = body;
    return this.devicesService.asignDriverToDevice(Req, driverName, deviceName)
  }

  /**
   * POST /devices/asignDeviceToUser
   */
  @Post('asignDeviceToUser')
  asignDeviceToUser(@Req() Req: Request,
    @Body() body: { deviceId: number }) {
    const { deviceId } = body;
    return this.devicesService.asignDeviceToUser(Req, deviceId)
  }

  /**
   * POST /devices/asignDriverToUser
   */
  @Post('asignDriverToUser')
  asignDriverToUser(@Req() Req: Request,
    @Body() body: { driverId: number }) {
    const { driverId } = body;
    return this.devicesService.asignDriverToUser(Req, driverId)
  }
}
