import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraccarController } from './traccar.controller';
import { TraccarService } from './traccar.service';
import { Events } from './entities/events.entity';
import { DevicesModule } from 'src/devices/devices.module';
import { RoutesModule } from 'src/routes/routes.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    RoutesModule,
    forwardRef(() => DevicesModule),
    TypeOrmModule.forFeature([Events]),
    forwardRef(() => EventsModule),
  ],
  controllers: [TraccarController],
  providers: [TraccarService],
  exports: [TraccarService],
})
export class TraccarModule {}