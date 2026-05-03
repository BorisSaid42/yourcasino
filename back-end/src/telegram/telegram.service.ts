import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '../config/config.service';

export interface WithdrawNotificationData {
  userId: string;
  userName?: string;
  amount: number;
  amountUsd: number;
  asset: string;
  destinationAddress: string;
  transactionId: string;
  feeUsd: number;
  fee: number;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly sendTimeoutMs = 5000;
  private bot: TelegramBot | null = null;
  private chatId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.chatId = this.configService.getTelegramChatId();
    const botToken = this.configService.getTelegramBotToken();
    if (botToken && this.chatId) {
      try {
        this.bot = new TelegramBot(botToken, { polling: false });
        this.logger.log('Telegram bot initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Telegram bot:', error);
      }
    } else {
      if (this.configService.getTelegramNotificationsEnabled()) {
        this.logger.log('Telegram notifications disabled');
      } else {
        this.logger.warn('Telegram bot not initialized: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      }
    }
  }

  private withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    return Promise.race<T>([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Telegram ${label} timed out after ${this.sendTimeoutMs}ms`)),
          this.sendTimeoutMs,
        ),
      ),
    ]);
  }

  async sendWithdrawNotification(data: WithdrawNotificationData): Promise<void> {
    if (!this.chatId || !this.bot) {
      this.logger.debug('Telegram notifications disabled, skipping');
      return;
    }

    try {
      const message = this.formatWithdrawMessage(data);
      await this.withTimeout(
        this.bot.sendMessage(this.chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        'sendWithdrawNotification',
      );
      this.logger.log(`Withdraw notification sent for transaction ${data.transactionId}`);
    } catch (error) {
      this.logger.error('Failed to send Telegram notification:', error);
    }
  }

  private formatWithdrawMessage(data: WithdrawNotificationData): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    const timestamp = `${hours}:${minutes} ${month}/${day}/${year}`;

    const userInfo = data.userName
      ? `<b>User:</b> ${data.userId} (${data.userName})`
      : `<b>User ID:</b> ${data.userId}`;

    return `
        <b>New Withdraw Request</b>

        ${userInfo}
        <b>Amount:</b> ${data.amount.toFixed(8)} ${data.asset} (~$${data.amountUsd.toFixed(2)} USD)
        <b>Fee:</b> ${data.fee.toFixed(8)} ${data.asset} (~$${data.feeUsd.toFixed(2)} USD)
        <b>Destination:</b> <code>${data.destinationAddress}</code>
        <b>Transaction ID:</b> <code>${data.transactionId}</code>
        <b>Time:</b> ${timestamp}
            `.trim();
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.chatId || !this.bot) {
      this.logger.debug('Telegram notifications disabled, skipping');
      return;
    }

    try {
      await this.withTimeout(this.bot.sendMessage(this.chatId, message, { parse_mode: 'HTML' }), 'sendMessage');
      this.logger.log('Custom message sent to Telegram');
    } catch (error) {
      this.logger.error('Failed to send Telegram message:', error);
    }
  }
}
