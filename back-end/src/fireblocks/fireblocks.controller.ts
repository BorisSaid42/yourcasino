import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { HttpRateLimitInterceptor } from '../rate-limit/http.interceptor';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { WalletAsset } from '../user/user-wallet.entity';
import { UserWithdrawDTO } from './dto/user-withdraw.dto';
import { FireblocksService } from './fireblocks.service';
import { ServiceError } from '../common/service.error';

@Controller({
  path: 'fireblocks',
  version: '1',
})
export class FireblocksController {
  constructor(private readonly fireblocksService: FireblocksService) {}

  @Get('/assets')
  async getAvailableAssets() {
    return this.fireblocksService.getAllAssetPrices();
  }

  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('estimate:tx:fee', 3)
  @Get('/estimate-fee/:asset')
  async estimateTxFee(
    @Param('asset', new ParseEnumPipe(WalletAsset)) asset: WalletAsset,
    @CurrentCredentials() credentials: Credentials,
  ) {
    return this.fireblocksService.getFeeEstimation(credentials.user, asset);
  }

  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('balance:deposit', 0.2)
  @Get('/deposit/:asset')
  async getDepositAddress(
    @Param('asset', new ParseEnumPipe(WalletAsset)) asset: WalletAsset,
    @CurrentCredentials() credentials: Credentials,
  ) {
    return this.fireblocksService.getDepositAddress(credentials.user, asset);
  }

  @UseInterceptors(HttpRateLimitInterceptor)
  @RateLimit('balance:withdrawal', 5)
  @Post('/withdraw')
  async withdraw(@Body() payload: UserWithdrawDTO, @CurrentCredentials() credentials: Credentials) {
    try {
      return await this.fireblocksService.createWithdrawalRequest(credentials.user, payload);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
