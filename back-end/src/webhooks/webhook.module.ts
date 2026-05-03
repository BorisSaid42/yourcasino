import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { FireblocksWebhookController } from './fireblocks.webhook';
import { FireblocksModule } from '../fireblocks/fireblocks.module';
import { UserModule } from '../user/user.module';
import { UserTransactionModule } from '../transaction/user-transaction.module';

@Module({
  imports: [ConfigModule, FireblocksModule, UserModule, UserTransactionModule],
  controllers: [FireblocksWebhookController],
})
export class WebhooksModule {}
