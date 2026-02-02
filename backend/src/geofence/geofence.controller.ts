import { Controller, Get } from '@nestjs/common';
import { GeofenceService } from './geofence.service';

@Controller('geofence')
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  // Aquí puedes agregar métodos para manejar las rutas relacionadas con geofences
  // Ejemplo: obtener todas las geofences
  // GET /geofence
  @Get()
  async getAllGeofences() {
    return this.geofenceService.getGeofences();
  }
}
