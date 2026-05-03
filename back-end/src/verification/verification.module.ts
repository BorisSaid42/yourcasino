import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationEntity } from './verification.entity';
import { ConfigModule } from 'src/config/config.module';
import { VerificationService } from './verification.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationEntity]), ConfigModule, MailModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
