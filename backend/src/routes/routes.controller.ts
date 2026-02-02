import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateConcurrentDto } from './dto/create-concurrent.dto';
import { CreateRouteDto } from './dto/create-route.dto';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}
  
  @Post()
  createRoute(@Body() createRouteDto: CreateRouteDto) {
    console.log(createRouteDto);
    
    return this.routesService.createRoute(createRouteDto);
  }

  @Get()
  getAllRoutes() {
    return this.routesService.findAllRoutes();
  }
  
  @Get('concurrent')
  getConcurrentRoute(){
    return this.routesService.findAllConcurrentRoutesNames();
  }
  
  @Get(':deviceName')
  getRouteByDeviceName(@Param('deviceName') deviceName: string) {
    return this.routesService.findRouteByDeviceName(deviceName);
  }


  @Put(':deviceName')
  deleteRouteByDeviceName(@Param('deviceName') deviceName: string) {
    return this.routesService.deleteRouteByDeviceName(deviceName);
  }

  @Post('concurrent')
  createConcurrent(@Body() createConcurrentDto: CreateConcurrentDto) {
    return this.routesService.createConcurrentRoute(createConcurrentDto);
  }

  @Delete('concurrent/:routeName')
  async deleteConcurrentRoute(@Param('routeName') routeName: string) {
    return await this.routesService.deleteConcurrentRouteByName(routeName);
  }

}
