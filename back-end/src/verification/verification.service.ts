import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationEntity } from './verification.entity';
import { ConfigService } from 'src/config/config.service';
import { Between, Repository } from 'typeorm';
import { CodeVerificationType, VerificationDTO } from 'src/auth/dto/verification.dto';
import { MailService } from 'src/mail/mail.service';
import * as moment from 'moment';
import * as crypto from 'crypto';
import { ServiceError } from 'src/common/service.error';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationEntity) private readonly verificationRepository: Repository<VerificationEntity>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  public async verify(verificationData: VerificationDTO, type = CodeVerificationType.REGISTER) {
    const token = await this.verificationRepository.findOne({
      where: { code: verificationData.code, user: { id: verificationData.userId }, type },
      order: { createdAt: 'DESC' },
    });

    if (!token || token.used) {
      throw new HttpException('Verification data invalid', HttpStatus.BAD_REQUEST);
    }

    if (token.expireAt && token.expireAt.getTime() < Date.now()) {
      throw new ForbiddenException('Your token has expired');
    }

    await this.verificationRepository.update(token.id, { used: true });
  }

  public async requestForgetPasswordLink(userId: string, email: string): Promise<VerificationEntity> {
    const checkLimit = await this.verificationRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(moment().subtract(1, 'days').toDate(), moment().toDate()),
      },
    });
    if (checkLimit.length >= this.configService.getDailyForgetPasswordLimit()) {
      throw new ServiceError('Unable to reset password because of password reset limit.');
    }

    const verificationInfo = await this.createVerificationCode(userId, CodeVerificationType.RESET_PASSWORD);

    await this.mailService.sendForgetPasswordEmail(
      email,
      `${this.configService.getAppUrl()}/auth/forgot-password/new/${verificationInfo.userId}/${verificationInfo.code}`,
    );
    return verificationInfo;
  }

  public async createVerificationCode(userId: string, type: CodeVerificationType): Promise<VerificationEntity> {
    const random = crypto.randomBytes(64).toString('hex');

    const expireAt = moment().add(1, 'days').toDate();
    const verificationData = this.verificationRepository.create({
      code: random,
      user: { id: userId },
      used: false,
      expireAt: expireAt,
      type: type,
    });

    return this.verificationRepository.save(verificationData);
  }

  public async requestEmailVerification(userId: string, email: string): Promise<VerificationEntity> {
    const verificationInfo = await this.createVerificationCode(userId, CodeVerificationType.REGISTER);

    await this.mailService.sendEmailVerification(
      email,
      `${this.configService.getAppUrl()}/auth/verify-email/${verificationInfo.userId}/${verificationInfo.code}`,
    );
    return verificationInfo;
  }

  public async hasExistingVerificationCode(userId: string, type = CodeVerificationType.REGISTER): Promise<boolean> {
    const existingCode = await this.verificationRepository.findOne({
      where: { user: { id: userId }, type },
      order: { createdAt: 'DESC' },
    });

    return !!existingCode;
  }
}
