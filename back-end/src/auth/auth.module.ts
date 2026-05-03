import { Module } from '@nestjs/common';
import { RateLimitModule } from 'src/rate-limit/rate-limit.module';
import { AuthController } from './auth.controller';
import { JWTModule } from './jwt/jwt.module';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { VerificationModule } from 'src/verification/verification.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [JWTModule, RateLimitModule, UserModule, VerificationModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
