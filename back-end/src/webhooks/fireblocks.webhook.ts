import { TransferPeerPathType } from '@fireblocks/ts-sdk';
import { Controller, Headers, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import { createVerify } from 'crypto';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { ServiceError } from '../common/service.error';
import { ConfigService } from '../config/config.service';
import { FireblocksService } from '../fireblocks/fireblocks.service';
import { TransactionStatus } from '../transaction/user-transaction.entity';
import { UserTransactionService } from '../transaction/user-transaction.service';
import { UserService } from '../user/user.service';
import { FireblocksAsset, FireblocksTransactionWebhookV2 } from './types/fireblocks-transaction.type';

const MIN_DEPOSIT_USD = 5;

@Controller({ path: '/webhook/fireblocks', version: '1' })
export class FireblocksWebhookController {
  public readonly FIREBLOCKS_WEBHOOK_PUBLIC_KEY: string;
  private readonly logger = new Logger(FireblocksWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly fireblocksService: FireblocksService,
    private readonly userTransactionService: UserTransactionService,
  ) {
    const mode = this.configService.isFireblocksSandbox() ? 'sandbox' : 'prod';

    const keyFileMap: Record<string, string> = {
      sandbox: 'fireblocks_sandbox.public.key',
      prod: 'fireblocks_prod.public.key',
    };

    const fileName = keyFileMap[mode];

    if (!fileName) {
      throw new ServiceError(`Unknown FIREBLOCKS_MODE: ${mode}`);
    }

    const keyPath = path.resolve(__dirname, '../../keys', fileName);
    try {
      this.FIREBLOCKS_WEBHOOK_PUBLIC_KEY = fs.readFileSync(keyPath, 'utf-8');
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new ServiceError(`Failed to load Fireblocks public key from ${keyPath}: ${err.message}`);
    }
  }

  private verifySignature(rawBody: Buffer | string, signature: string): boolean {
    const verifier = createVerify('RSA-SHA512');

    const bodyToVerify = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(JSON.stringify(rawBody));

    verifier.update(bodyToVerify);
    verifier.end();

    return verifier.verify(this.FIREBLOCKS_WEBHOOK_PUBLIC_KEY, Buffer.from(signature, 'base64'));
  }

  private async resolveDepositUserId(payload: FireblocksTransactionWebhookV2): Promise<string | null> {
    const vaultId = payload.data.destination?.id;
    if (vaultId) {
      const userId = await this.userService.findUserIdByVaultId(vaultId);
      if (userId) return userId;
    }

    // Fallback to the legacy `user_<UUID>` vault-name convention. Kept so historical
    // vaults missing from user_wallets can still be reconciled.
    const name = payload.data.destination?.name ?? '';
    const fromName = name.split('user_')[1];
    return fromName ?? null;
  }

  @IsPublic()
  @Post('/v2')
  async handleWebhookV2(
    @Req() req: Request & { rawBody?: Buffer },
    @Res() res: Response,
    @Headers('fireblocks-signature') signature: string,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      this.logger.warn(`Webhook rejected: missing rawBody or signature (IP: ${ip})`);
      return res.status(HttpStatus.BAD_REQUEST).send('Missing rawBody or signature');
    }

    const isValid = this.verifySignature(rawBody, signature);

    if (!isValid) {
      this.logger.error(`Webhook rejected: invalid signature (IP: ${ip})`);
      return res.status(HttpStatus.UNAUTHORIZED).send('Invalid signature');
    }

    const payload = req.body as unknown as FireblocksTransactionWebhookV2;

    if (payload.eventType !== 'transaction.created' && payload.eventType !== 'transaction.status.updated') {
      return res.status(HttpStatus.OK).send('OK');
    }

    const assetId = payload.data.assetId;

    if (
      !Object.values(FireblocksAsset).includes(assetId as FireblocksAsset) &&
      !this.configService.isFireblocksSandbox()
    ) {
      this.logger.warn(`Unsupported asset, ignoring: ${assetId}`);
      return res.status(HttpStatus.OK).send('OK');
    }

    try {
      const isWithdrawal = (payload.data.note ?? '').startsWith('User withdrawal') || !!payload.data.externalTxId;

      if (isWithdrawal) {
        Logger.log(
          `Received WITHDRAW webhook (IP: ${ip}) amount=$${payload.data.amountUSD} externalTxId=${payload.data.externalTxId} txHash=${payload.data.txHash}`,
        );
        await this.fireblocksService.processWithdrawTransaction(payload);
        return res.status(HttpStatus.OK).send('OK');
      }

      // Deposit branch.
      if (
        payload.data.source?.type !== TransferPeerPathType.ExternalWallet &&
        payload.data.source?.type !== TransferPeerPathType.Unknown
      ) {
        return res.status(HttpStatus.OK).send('OK');
      }

      if (payload.data.destination?.type !== TransferPeerPathType.VaultAccount) {
        return res.status(HttpStatus.OK).send('OK');
      }

      const userId = await this.resolveDepositUserId(payload);
      if (!userId) {
        this.logger.warn(
          `Deposit webhook: cannot resolve user (vaultId=${payload.data.destination?.id}, name=${payload.data.destination?.name})`,
        );
        return res.status(HttpStatus.OK).send('OK');
      }

      // Sub-minimum deposits: persist a record so the user/operator have an audit trail
      // (the funds have already landed in the user's vault but we won't credit balance).
      if (payload.data.amountUSD < MIN_DEPOSIT_USD) {
        Logger.warn(
          `Deposit below minimum: amount=$${payload.data.amountUSD} userId=${userId} txHash=${payload.data.txHash}`,
        );
        try {
          const existing = await this.userTransactionService.getTransactionByExternalId(payload.data.id);
          if (!existing) {
            await this.userTransactionService.createTransaction({
              status: TransactionStatus.FAILED,
              amount: payload.data.amount,
              amountUsd: payload.data.amountUSD,
              fee: 0,
              networkFee: payload.data.networkFee,
              userId,
              asset: payload.data.assetId === 'USDT_ERC20' ? 'USDT' : payload.data.assetId,
              type: 'deposit',
              destinationAddress: payload.data.destinationAddress,
              senderAddress: payload.data.sourceAddress,
              transactionHash: payload.data.txHash,
              transactionId: payload.data.id,
              externalStatus: payload.data.status,
              externalSubStatus: `Below minimum deposit ($${MIN_DEPOSIT_USD})`,
            });
          }
        } catch (persistErr) {
          this.logger.error('Failed to persist sub-minimum deposit record', persistErr);
        }
        return res.status(HttpStatus.OK).send('OK');
      }

      // Verify the user actually exists before processing.
      try {
        await this.userService.findById(userId);
      } catch {
        this.logger.warn(`Deposit webhook: user ${userId} not found`);
        return res.status(HttpStatus.OK).send('OK');
      }

      Logger.log(
        `Received DEPOSIT webhook amount=$${payload.data.amountUSD} userId=${userId} vaultId=${payload.data.destination?.id} txHash=${payload.data.txHash}`,
      );
      await this.fireblocksService.processDepositTransaction(userId, payload);
      return res.status(HttpStatus.OK).send('OK');
    } catch (err) {
      // Real processing failure — return 5xx so Fireblocks retries.
      this.logger.error('Webhook handler error', err instanceof Error ? err.stack : String(err));
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Processing error');
    }
  }
}
