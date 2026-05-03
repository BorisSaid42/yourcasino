import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { RandomOrgService } from './random-org.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [RandomOrgService],
  exports: [RandomOrgService],
})
export class RandomOrgModule {}
