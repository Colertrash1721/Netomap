import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drivers } from './entities/driver.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Drivers]), AuthModule
  ],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
