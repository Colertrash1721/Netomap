import { forwardRef, Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { GeofenceController } from './geofence.controller';
import { Geofences } from './entity/geofences.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [GeofenceController],
  providers: [GeofenceService],
  exports: [GeofenceService], // Export the service if needed in other modules
  imports: [TypeOrmModule.forFeature([Geofences]),
    forwardRef(() => AuthModule)],
})
export class GeofenceModule { }
