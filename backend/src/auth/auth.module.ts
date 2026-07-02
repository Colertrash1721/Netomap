import { forwardRef,Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TraccarModule } from 'src/traccar/traccar.module';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET || "tx7aAfV16FT7JPbIn4XP2gXKcrjALgH6PHtWmfTu_0M",
  }), forwardRef(() => TraccarModule)],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
