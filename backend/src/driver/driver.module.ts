import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drivers } from './entities/driver.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Drivers]),
  ],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
