import { Body, Controller, Get, Post, Res, Req, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { TraccarService } from '../traccar/traccar.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly TraccarService: TraccarService
  ) { }
  
  @Post('login')
  async login(@Body() body: { email: string, password: string },
    @Res({ passthrough: true }) res: Response): Promise<any> {
    const { email, password } = body;
    const result = await this.authService.login(email, password, res);
     await this.TraccarService.openTraccarWS(result.sessionCookie);

    return {
      message: result.message,
      user: result.user,
      token: result.token,
    };
  }

  @Post('/logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.logout(req, res);
  }

  // auth.controller.ts
@Get('ping')
checkSession(@Req() req: Request) {
  try {
    const user = this.authService.getDataFromCookie(req);
    return { ok: true, user };
  } catch (error) {
    throw new HttpException('No session', HttpStatus.UNAUTHORIZED);
  }
}

}
