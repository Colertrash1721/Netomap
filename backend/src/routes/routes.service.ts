import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Routes } from './entities/route.entity';
import { Repository } from 'typeorm';
import { Concurrent } from './entities/concurrent.entity';
import { CreateConcurrentDto } from './dto/create-concurrent.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { Places } from './entities/places.entity';
import axios from 'axios';
import * as turf from '@turf/turf';

@Injectable()
export class RoutesService {
  constructor(@InjectRepository(Routes) private routeRepository: Repository<Routes>,
    @InjectRepository(Places) private placeRepository: Repository<Places>,
    @InjectRepository(Concurrent) private concurrentRepository: Repository<Concurrent>) { }

  async findAllRoutes() {
    return this.routeRepository.find();
  }

  async findRouteByDeviceName(deviceName: string) {
    const findRoute = await this.routeRepository.findOne({
      where: { device_Name: deviceName },
    });
    if (!findRoute) {
      return null;
    }
    return findRoute
  }

  async findPlaceByName(placeName: string) {
    return this.placeRepository.findOne({ where: { name: placeName } });
  }


  private async fetchOsrmRouteGeoJson(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startLng},${startLat};${endLng},${endLat}` +
      `?overview=full&geometries=geojson&alternatives=true`;

    const { data } = await axios.get(url, { timeout: 15000 });

    if (!data?.routes?.length) {
      throw new HttpException('OSRM no devolvió rutas', HttpStatus.BAD_GATEWAY);
    }

    // routes[0] = la mejor ruta (principal)
    const mainGeometry = data.routes[0].geometry; // {type:'LineString', coordinates:[...]}
    const alternatives = data.routes.map((r) => ({
      geometry: r.geometry,
      distance: r.distance,
      duration: r.duration,
      weight: r.weight,
    }));

    return { mainGeometry, alternatives };
  }

  async isDeviceOnRoute(params: {
    lat: number;
    lng: number;
    routeGeometry: any;     // GeoJSON LineString { type:'LineString', coordinates:[[lng,lat],...] }
    thresholdMeters: number;
  }) {
    const { lat, lng, routeGeometry, thresholdMeters } = params;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (!routeGeometry?.coordinates?.length) return false;

    // Punto actual del dispositivo (GeoJSON usa [lng, lat])
    const pt = turf.point([lng, lat]);

    // Línea de ruta (LineString)
    const line = turf.lineString(routeGeometry.coordinates);

    // Distancia mínima del punto a la línea (en metros)
    const distMeters = turf.pointToLineDistance(pt, line, { units: 'meters' });

    return distMeters <= thresholdMeters;
  }

  async isDeviceOnAnyRoute(params: {
    lat: number;
    lng: number;
    mainGeometry: any;
    alternatives?: any[];
    thresholdMeters: number;
  }) {
    const { lat, lng, mainGeometry, alternatives, thresholdMeters } = params;

    // 1) principal
    const onMain = await this.isDeviceOnRoute({
      lat,
      lng,
      routeGeometry: mainGeometry,
      thresholdMeters,
    });
    if (onMain) return { onRoute: true, distMeters: null, which: 'main' };

    // 2) alternativas (si existen)
    const alts = Array.isArray(alternatives) ? alternatives : [];
    for (let i = 0; i < alts.length; i++) {
      const geom = alts[i]?.geometry;
      if (!geom) continue;

      const onAlt = await this.isDeviceOnRoute({
        lat,
        lng,
        routeGeometry: geom,
        thresholdMeters,
      });
      if (onAlt) return { onRoute: true, distMeters: null, which: `alt_${i}` };
    }

    return { onRoute: false, distMeters: null, which: null };
  }

  async deleteRouteByDeviceName(deviceName: string) {
    const foundRoute = await this.routeRepository.findOne({
      where: {
        device_Name: deviceName,
      },
    });

    if (!foundRoute) {
      throw new HttpException(
        `No se encontró una ruta para el dispositivo "${deviceName}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.routeRepository.remove(foundRoute);

    return {
      message: `Ruta eliminada para el dispositivo "${deviceName}"`,
      data: foundRoute,
    };
  }

  async createConcurrentRoute(createConcurrent: CreateConcurrentDto) {
    try {
      const foundConcurrent = await this.concurrentRepository.findOne({
        where: [
          { routeName: createConcurrent.routeName }, // Buscar por nombre de ruta
          {
            Startlatitud: createConcurrent.Startlatitud,
            Startlongitud: createConcurrent.Startlongitud,
            Endlatitud: createConcurrent.Endlatitud,
            Endlongitud: createConcurrent.Endlongitud,
          }, // Buscar por coordenadas
        ],
      });
      if (foundConcurrent) {
        throw new HttpException(
          'La ruta o las coordenadas ya existen',
          HttpStatus.BAD_REQUEST,
        );
      }
      const newConcurrentRoute =
        this.concurrentRepository.create(createConcurrent);
      const savedRoute =
        await this.concurrentRepository.save(newConcurrentRoute);
      return savedRoute;
    } catch (error) {
      throw new HttpException(
        'Error creating device: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createRoute(createRouteDto: CreateRouteDto) {
    try {
      const startLat = Number(createRouteDto.Startlatitud);
      const startLng = Number(createRouteDto.Startlongitud);
      const endLat = Number(createRouteDto.Endlatitud);
      const endLng = Number(createRouteDto.Endlongitud);

      if (![startLat, startLng, endLat, endLng].every(Number.isFinite)) {
        throw new HttpException('Coordenadas inválidas', HttpStatus.BAD_REQUEST);
      }

      // ✅ 1) Llamar OSRM en el BACKEND
      const { mainGeometry, alternatives } = await this.fetchOsrmRouteGeoJson(
        startLat,
        startLng,
        endLat,
        endLng,
      );

      const foundDevice = await this.routeRepository.findOne({
        where: { device_Name: createRouteDto.device_Name },
      });

      if (foundDevice) {
        // ✅ update
        foundDevice.rute_Name = createRouteDto.rute_Name;
        foundDevice.Startlatitud = createRouteDto.Startlatitud;
        foundDevice.Startlongitud = createRouteDto.Startlongitud;
        foundDevice.Endlatitud = createRouteDto.Endlatitud;
        foundDevice.Endlongitud = createRouteDto.Endlongitud;

        // ✅ guarda la geometría calculada
        foundDevice.routeGeometry = mainGeometry;
        foundDevice.routeAlternatives = alternatives; // opcional
        foundDevice.thresholdMeters = foundDevice.thresholdMeters ?? 100;

        return await this.routeRepository.save(foundDevice);
      }

      // ✅ create
      const newDevice = this.routeRepository.create({
        ...createRouteDto,
        routeGeometry: mainGeometry,
        routeAlternatives: alternatives, // opcional
        thresholdMeters: 100,
      });

      return await this.routeRepository.save(newDevice);
    } catch (error) {
      throw new HttpException(
        'Error creating/updating route: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  async findAllConcurrentRoutesNames() {
    return await this.concurrentRepository.find();
  }

  async deleteConcurrentRouteByName(routeName: string) {
    const concurrentRoute = await this.concurrentRepository.findOne({
      where: { routeName },
    });

    if (!concurrentRoute) {
      throw new HttpException(
        `No se encontró una ruta concurrente con el nombre "${routeName}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.concurrentRepository.remove(concurrentRoute);

    return {
      message: `Ruta concurrente "${routeName}" eliminada correctamente`,
      data: concurrentRoute,
    };
  }
}
