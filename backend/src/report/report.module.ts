import { forwardRef, Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Events } from 'src/traccar/entities/events.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutesModule } from 'src/routes/routes.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Events]),
    forwardRef(() => RoutesModule),
    MailModule
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
