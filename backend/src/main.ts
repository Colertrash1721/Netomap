import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // O especifica tus dominios ['http://tufrontend.com']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  const PORT = process.env.PORT ?? 3000;
  const HOST = process.env.HOST ?? '0.0.0.0'; // usar 0.0.0.0 para que escuche en todas las interfaces

  await app.listen(PORT, HOST);
  console.log(`🚀 Backend corriendo en http://${HOST}:${PORT}/api`);
  
}
bootstrap();
