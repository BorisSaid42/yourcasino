import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { AuthGuard } from './auth/jwt/guards/auth.guard';
import { JWTService } from './auth/jwt/jwt.service';
import { ConfigService } from './config/config.service';
import { MaintenanceService } from './maintenance/maintenance.service';
import { MaintenanceGuard } from './maintenance/guard/maintenance.guard';
import { UserService } from './user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const uploadsDir = './uploads/avatars';
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const configService = app.get(ConfigService);

  app.enableVersioning({ type: VersioningType.URI });
  // global settings
  app.setGlobalPrefix('/api');
  app.useGlobalPipes(new ValidationPipe(configService.geValidationPipeConfig()));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'excludeAll',
    }),
  );
  app.useGlobalGuards(new MaintenanceGuard(app.get(MaintenanceService)));
  app.useGlobalGuards(new AuthGuard(app.get(Reflector), app.get(JWTService), app.get(UserService)));

  // CORS: allow only the configured front-end origin(s). Comma-separate
  // multiple origins in CORS_ORIGINS (e.g. "https://yourcasino.com,https://www.yourcasino.com").
  // Falls back to APP_URL when CORS_ORIGINS is unset.
  const corsOrigins = (process.env.CORS_ORIGINS ?? configService.getAppUrl())
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.enableShutdownHooks();

  await app.listen(configService.getServerPort());
  Logger.log(`API Gateway started on port ${configService.getServerPort()}`);
}
void bootstrap();
