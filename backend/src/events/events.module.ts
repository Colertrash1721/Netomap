import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { DevicesModule } from 'src/devices/devices.module';
import { RoutesModule } from 'src/routes/routes.module';
import { TraccarModule } from 'src/traccar/traccar.module';
import { GeofenceModule } from 'src/geofence/geofence.module';

@Module({
  imports: [
    DevicesModule,
    RoutesModule,
    forwardRef(() => TraccarModule),
    GeofenceModule
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}