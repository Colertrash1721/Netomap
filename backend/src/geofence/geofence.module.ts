import { Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { GeofenceController } from './geofence.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [GeofenceController],
  providers: [GeofenceService],
  exports: [GeofenceService], // Export the service if needed in other modules
  imports: [AuthModule], 
})
export class GeofenceModule {}
