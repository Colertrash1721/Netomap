import { forwardRef,Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { AuthModule } from 'src/auth/auth.module';
import { RoutesModule } from 'src/routes/routes.module';
import { TraccarModule } from 'src/traccar/traccar.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drivers } from 'src/driver/entities/driver.entity';
import { Positions } from 'src/libs/databases/position.entity'; 

@Module({
  imports: [
    forwardRef(() => TraccarModule),
    forwardRef(() => AuthModule),
    RoutesModule,
    TypeOrmModule.forFeature([Drivers, Positions])
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService]
})
export class DevicesModule {}
