import { BadRequestException, Controller, Get, Post } from '@nestjs/common';
import { CurrentCredentials } from '../auth/decorators/current-credentials.decorator';
import { Credentials } from '../auth/dto/jwt-credentials.dto';
import { ServiceError } from '../common/service.error';
import { UserDTO } from './dto/user.dto';
import { UserBalanceLogService } from './user-balance-log.service';
import { UserService } from './user.service';

@Controller({
  path: '/user',
  version: '1',
})
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly balanceLogService: UserBalanceLogService,
  ) {}

  @Get('/')
  async getUserData(@CurrentCredentials() credentials: Credentials) {
    try {
      const user = await this.userService.findById(credentials.user);

      let intercomHash: string | undefined;
      try {
        intercomHash = this.userService.generateIntercomHash(user.id);
      } catch (e) {
        console.warn('Intercom hash generation failed:', e instanceof ServiceError ? e.message : 'Unknown error');
      }

      return new UserDTO(user, intercomHash);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }

      throw e;
    }
  }

  @Get('/profile/stats')
  async getProfileStats(@CurrentCredentials() credentials: Credentials) {
    try {
      return this.userService.getProfileStats(credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }

      throw e;
    }
  }

  @Post('/profile/reset-stats')
  async resetProfileStats(@CurrentCredentials() credentials: Credentials) {
    try {
      return this.userService.resetUserStats(credentials.user);
    } catch (e) {
      if (e instanceof ServiceError) {
        throw new BadRequestException(e.message);
      }

      throw e;
    }
  }
}
