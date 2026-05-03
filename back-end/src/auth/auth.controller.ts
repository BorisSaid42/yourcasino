import { Body, Controller, Get, Headers, Post, Put, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { ServiceError } from '../common/service.error';
import { HttpRateLimitInterceptor } from '../rate-limit/http.interceptor';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { AuthService } from './auth.service';
import { CurrentCredentials } from './decorators/current-credentials.decorator';
import { IsPublic } from './decorators/is-public.decorator';
import { ChangeForgottenPasswordDTO } from './dto/change-forgotten-password.dto';
import { Credentials, JWTCredentialsDTO } from './dto/jwt-credentials.dto';
import { LoginDTO } from './dto/login-request.dto';
import { SignupDTO } from './dto/signup-request.dto';
import { JWTService } from './jwt/jwt.service';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { VerificationDTO } from './dto/verification.dto';

@Controller({
  path: '/auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly jwtService: JWTService,
    private readonly authService: AuthService,
  ) {}

  @Get('/me')
  public me(@Headers('authorization') jwt: string): JWTCredentialsDTO {
    const user = this.jwtService.parseJwtToken(jwt);
    if (!user) {
      throw new UnauthorizedException();
    }

    return new JWTCredentialsDTO(user);
  }

  @IsPublic()
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:register:google', 3)
  @Post('/login/google')
  async googleLogin(@Body() body: { code: string }) {
    return this.authService.loginWithGoogle(body.code);
  }

  @IsPublic()
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:login:email', 3)
  @Post('/login')
  public async login(@Body() body: LoginDTO): Promise<JWTCredentialsDTO> {
    try {
      const userCredentials = await this.authService.login(body);
      return this.authService.signJWTCredentials(userCredentials);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new UnauthorizedException(e.message);
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  @IsPublic()
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:register:email', 3)
  @Post('/signup')
  public async signup(@Body() body: SignupDTO): Promise<void> {
    try {
      await this.authService.signup(body);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new UnauthorizedException(e.message);
      }
      throw new UnauthorizedException('Signup failed');
    }
  }

  @IsPublic()
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:password:forgot', 3)
  @Post('/reset/password')
  public async requestForgetPasswordLink(@Body('email') email: string): Promise<void> {
    await this.authService.requestForgetPasswordLink(email);
  }

  @IsPublic()
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:password:change', 3)
  @Post('/change/forgoten/password')
  public async changeForgottenPassword(@Body() forgotenPassword: ChangeForgottenPasswordDTO): Promise<boolean> {
    const changePasswordData = await this.authService.changeForgotenPassword(forgotenPassword);
    return changePasswordData;
  }

  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:username:change', 3)
  @Put('/change/username')
  public async changeUsername(
    @Body() payload: ChangeUsernameDto,
    @CurrentCredentials() credentials: Credentials,
  ): Promise<boolean> {
    const changeUsernameData = await this.authService.changeUsername(payload, credentials.user);
    return changeUsernameData;
  }

  @IsPublic()
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:email:verify', 3)
  @Post('/verify-email')
  public async verifyEmail(@Body() body: VerificationDTO): Promise<JWTCredentialsDTO> {
    try {
      const userCredentials = await this.authService.verifyEmail(body.userId, body.code);
      return this.authService.signJWTCredentials(userCredentials);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new UnauthorizedException(e.message);
      }
      throw new UnauthorizedException('Email verification failed');
    }
  }

  @IsPublic()
  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('auth:email:resend', 3)
  @Post('/resend-verification')
  public async resendVerificationEmail(@Body() body: { userId: string }): Promise<void> {
    await this.authService.resendVerificationEmail(body.userId);
  }
}
