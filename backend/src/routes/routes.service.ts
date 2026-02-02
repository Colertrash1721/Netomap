import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Routes } from './entities/route.entity';
import { Repository } from 'typeorm';
import { Concurrent } from './entities/concurrent.entity';
import { CreateConcurrentDto } from './dto/create-concurrent.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { Places } from './entities/places.entity';

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
      const foundDevice = await this.routeRepository.findOne({
        where: {
          device_Name: createRouteDto.device_Name,
        },
      });

      if (foundDevice) {
        // Si ya existe, actualizar campos
        foundDevice.rute_Name = createRouteDto.rute_Name;
        foundDevice.Startlatitud = createRouteDto.Startlatitud;
        foundDevice.Startlongitud = createRouteDto.Startlongitud;
        foundDevice.Endlatitud = createRouteDto.Endlatitud;
        foundDevice.Endlongitud = createRouteDto.Endlongitud;
        // Puedes actualizar también fecha si quieres
        return await this.routeRepository.save(foundDevice);
      }

      // Si no existe, crear nueva
      const newDevice = this.routeRepository.create(createRouteDto);
      const savedDevice = await this.routeRepository.save(newDevice);

      return savedDevice;
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
