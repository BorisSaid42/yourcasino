import { Controller, Get, Query } from '@nestjs/common';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { UserTransactionService } from './user-transaction.service';

@Controller({
  path: '/transaction',
  version: '1',
})
export class UserTransactionController {
  constructor(private readonly userTransactionService: UserTransactionService) {}

  @Get('/history')
  async getDepositHistory(
    @CurrentCredentials() credentials: Credentials,
    @Query('type') type: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    if (type !== 'deposit' && type !== 'withdraw') {
      return;
    }
    const data = await this.userTransactionService.getUserTransactionHistory(credentials.user, type, page, limit);
    return data;
  }

  // @Post('/cancel')
  // async cancelWithdrawal(@CurrentCredentials() credentials: Credentials, @Body('transactionId') transactionId: string) {
  //   await this.userTransactionService.cancelUserWithdrawal(credentials.user, transactionId);
  //   return { message: 'Withdrawal request cancelled successfully' };
  // }
}
