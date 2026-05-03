import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config as dotenvConfig } from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as assert from 'node:assert/strict';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { createDbConfig } from '../db/config/database.config';

@Injectable()
export class ConfigService {
  constructor() {
    dotenvExpand.expand(
      dotenvConfig({
        path: process.env.NODE_ENV === 'test' ? '.env.testing' : '.env',
      }),
    );
  }
  public isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging';
  }

  public getServerPort(): number {
    assert(
      typeof process.env.SERVER_PORT !== 'undefined' && !Number.isNaN(+process.env.SERVER_PORT),
      `Invalid env value: SERVER_PORT=${process.env.SERVER_PORT}`,
    );

    return +process.env.SERVER_PORT;
  }

  public getAppUrl(): string {
    assert(!!process.env.APP_URL, `Invalid env value: APP_URL=${process.env.APP_URL}`);

    return process.env.APP_URL;
  }

  public getJwtSecretKey(): string {
    assert(!!process.env.JWT_SECRET_KEY, `Invalid env value: JWT_SECRET_KEY=${process.env.JWT_SECRET_KEY}`);

    return process.env.JWT_SECRET_KEY;
  }

  public getCoingeckoApiUrl(): string {
    assert(!!process.env.COINGECKO_API_URL, `Invalid env value: COINGECKO_API_URL=${process.env.COINGECKO_API_URL}`);

    return process.env.COINGECKO_API_URL;
  }

  public getRandomOrgApiUrl(): string {
    assert(!!process.env.RANDOM_ORG_API_URL, `Invalid env value: RANDOM_ORG_API_URL=${process.env.RANDOM_ORG_API_URL}`);

    return process.env.RANDOM_ORG_API_URL;
  }

  public getRandomOrgApiKey(): string {
    assert(!!process.env.RANDOM_ORG_KEY, `Invalid env value: RANDOM_ORG_KEY=${process.env.RANDOM_ORG_KEY}`);

    return process.env.RANDOM_ORG_KEY;
  }

  public isFireblocksSandbox(): boolean {
    return process.env.FIREBLOCKS_MODE === 'sandbox';
  }

  public getFireblocksWebhookSecret(): string {
    assert(
      !!process.env.FIREBLOCKS_WEBHOOK_SECRET,
      `Invalid env value: FIREBLOCKS_WEBHOOK_SECRET=${process.env.FIREBLOCKS_WEBHOOK_SECRET}`,
    );

    return process.env.FIREBLOCKS_WEBHOOK_SECRET;
  }

  public getFireblocksApiKey(): string {
    assert(!!process.env.FIREBLOCKS_API_KEY, `Invalid env value: FIREBLOCKS_API_KEY=${process.env.FIREBLOCKS_API_KEY}`);

    return process.env.FIREBLOCKS_API_KEY;
  }

  public getFireblocksBaseUrl(): string {
    assert(
      !!process.env.FIREBLOCKS_BASE_URL,
      `Invalid env value: FIREBLOCKS_BASE_URL=${process.env.FIREBLOCKS_BASE_URL}`,
    );

    return process.env.FIREBLOCKS_BASE_URL;
  }

  public getFireblocksSecretPath(): string {
    assert(
      !!process.env.FIREBLOCKS_SECRET_PATH,
      `Invalid env value: FIREBLOCKS_SECRET_PATH=${process.env.FIREBLOCKS_SECRET_PATH}`,
    );

    return process.env.FIREBLOCKS_SECRET_PATH;
  }

  public getGoogleClientId(): string {
    assert(!!process.env.GOOGLE_CLIENT_ID, `Invalid env value: GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID}`);

    return process.env.GOOGLE_CLIENT_ID;
  }

  public getGoogleClientSecret(): string {
    assert(
      !!process.env.GOOGLE_CLIENT_SECRET,
      `Invalid env value: GOOGLE_CLIENT_SECRET=${process.env.GOOGLE_CLIENT_SECRET}`,
    );

    return process.env.GOOGLE_CLIENT_SECRET;
  }

  public getGoogleCallbackUrl(): string {
    assert(
      !!process.env.GOOGLE_CALLBACK_URL,
      `Invalid env value: GOOGLE_CALLBACK_URL=${process.env.GOOGLE_CALLBACK_URL}`,
    );

    return process.env.GOOGLE_CALLBACK_URL;
  }

  public getDatabaseConfig(): TypeOrmModuleOptions {
    return createDbConfig();
  }

  public getRedisConfig(): RedisModuleOptions {
    assert(!!process.env.REDIS_URL, `Invalid env value: REDIS_URL=${process.env.REDIS_URL}`);

    return {
      type: 'single', // what to do with this?
      url: process.env.REDIS_URL,
    };
  }

  public getSaltRounds(): number {
    if (!process.env.SALT_ROUNDS) return 10;

    return +process.env.SALT_ROUNDS;
  }

  public geValidationPipeConfig() {
    return {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    };
  }

  getMailTransporterConfig(): SMTPTransport.Options {
    return {
      host: process.env.MAIL_SERVICE_HOST,
      port: +(process.env.MAIL_SERVICE_PORT || 2525),
      auth: {
        user: process.env.MAIL_SERVICE_USER,
        pass: process.env.MAIL_SERVICE_PASSWORD,
      },
    };
  }

  getEmailSender(): string {
    return process.env.EMAIL_SENDER || 'yourcasino';
  }

  getContactEmail(): string {
    return process.env.CONTACT_EMAIL || 'no-reply@yourcasino.com';
  }

  getDailyForgetPasswordLimit(): number {
    return +(process.env.DAILY_RESET_PASSWORD_LIMIT || 3);
  }

  public getIntercomSecretKey(): string | undefined {
    return process.env.INTERCOM_SECRET_KEY;
  }

  public getTelegramNotificationsEnabled(): boolean {
    return process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true';
  }

  public getTelegramBotToken(): string | undefined {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  public getTelegramChatId(): string | undefined {
    return process.env.TELEGRAM_CHAT_ID;
  }

  public getBlackjackNumOfDecks(): number {
    return +(process.env.BLACKJACK_NUMBER_OF_DECKS || 1);
  }
}
