import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mail } from './entities/mail';
import { MailController } from './mail.controller';

@Module({
  imports: [
    ConfigModule, // para poder inyectar ConfigService aquí
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host: cfg.get<string>('SMTP_HOST', 'smtp.office365.com'),
          port: cfg.get<number>('SMTP_PORT', 587),
          secure: false,          // STARTTLS en 587
          requireTLS: true,
          auth: {
            user: cfg.get<string>('SMTP_USER'),
            pass: cfg.get<string>('SMTP_PASS'),
          },
          pool: true, 
          maxConnections: 5,
          maxMessages: 100,
        },
        defaults: {
          from: cfg.get<string>('SMTP_FROM') // ej: NetoTrack <info@netotrack.com>
            ?? `"NetoTrack" <${cfg.get('SMTP_USER')}>`,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Mail]),
  ],
  providers: [MailService],
  controllers: [MailController],
  exports: [MailService],
})
export class MailModule { }
