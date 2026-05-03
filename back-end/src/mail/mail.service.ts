import { Injectable, Logger } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-require-imports
import mjml2html = require('mjml');

import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { ConfigService } from 'src/config/config.service';
import { emailChangePassword, emailVerification } from './mail.template';
import { ServiceError } from '../common/service.error';

@Injectable()
export class MailService {
  transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.transporter = nodemailer.createTransport(this.configService.getMailTransporterConfig());
  }

  private async sendMail(mailOptions: Mail.Options) {
    try {
      await this.transporter.sendMail({
        ...mailOptions,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  public createMailOptions(to: string, subject?: string): Mail.Options {
    return {
      from: `"${this.configService.getEmailSender()}" <${this.configService.getContactEmail()}`,
      to,
      subject,
    };
  }
  public async sendForgetPasswordEmail(email: string, url: string) {
    const mailOptions = this.createMailOptions(email);
    const template = emailChangePassword(url, this.configService.getAppUrl());

    const { html, errors } = mjml2html(template);

    if (errors.length) {
      console.error('MJML compilation errors:', errors);
      throw new ServiceError('Failed to compile MJML template.');
    }
    await this.sendMail({
      ...mailOptions,
      html: html,
      subject: 'Change Password Request',
    });
  }

  public async sendEmailVerification(email: string, url: string) {
    const mailOptions = this.createMailOptions(email);
    const template = emailVerification(url, this.configService.getAppUrl());

    const { html, errors } = mjml2html(template);

    if (errors.length) {
      console.error('MJML compilation errors:', errors);
      throw new ServiceError('Failed to compile MJML template.');
    }
    await this.sendMail({
      ...mailOptions,
      html: html,
      subject: 'Verify Your Email - Yourcasino',
    });
  }
}
