import {
  BasePath,
  Fireblocks,
  FireblocksError,
  FireblocksResponse,
  TransferPeerPathType,
  VaultAccount,
  VaultWalletAddress,
} from '@fireblocks/ts-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { readFileSync } from 'fs';
import { DataSource, Repository } from 'typeorm';
import { ServiceError } from '../common/service.error';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { TelegramService } from '../telegram/telegram.service';
import { TransactionStatus, UserTransaction } from '../transaction/user-transaction.entity';
import { UserTransactionService } from '../transaction/user-transaction.service';
import { BalanceLogType } from '../user/user-balance-log.entity';
import { WalletAsset } from '../user/user-wallet.entity';
import { UserService } from '../user/user.service';
import { FireblocksTransactionWebhookV2 } from '../webhooks/types/fireblocks-transaction.type';
import { AssetRateCache } from './asset-rate-cache.entity';
import { AssetPriceDTO } from './dto/asset-price.dto';
import { UserWithdrawDTO } from './dto/user-withdraw.dto';

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
  };
}

@Injectable()
export class FireblocksService {
  private readonly logger = new Logger(FireblocksService.name);
  private fireblocks: Fireblocks;

  constructor(
    @InjectRepository(AssetRateCache) private readonly assetRateCacheRepository: Repository<AssetRateCache>,
    private readonly userTransactionService: UserTransactionService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    private readonly telegramService: TelegramService,
  ) {
    this.fireblocks = new Fireblocks({
      apiKey: this.configService.getFireblocksApiKey(),
      basePath: this.configService.isFireblocksSandbox() ? BasePath.Sandbox : BasePath.US,
      secretKey: readFileSync(this.configService.getFireblocksSecretPath(), 'utf8'),
    });
  }

  async resendWebhookForTransaction(internalTxId: string) {
    try {
      const findTrx = await this.fireblocks.transactions.getTransaction({
        txId: internalTxId,
      });

      if (findTrx.data?.source?.type === 'UNKNOWN' || findTrx.data?.source?.type === 'EXTERNAL_WALLET') {
        this.logger.debug(`Skipping webhook resend for external transaction: ${internalTxId}`);
        return;
      }

      await this.fireblocks.webhooks.resendTransactionWebhooks({
        txId: internalTxId,
        resendTransactionWebhooksRequest: {
          resendCreated: true,
          resendStatusUpdated: true,
        },
      });

      this.logger.log(`Webhook resent: txId=${internalTxId}`);
    } catch (error) {
      this.logger.error(`Failed to resend webhook: ${internalTxId}`, error);
    }
  }

  private isCheckingApprovedWithdrawals = false;

  @Interval(5 * 60 * 1000)
  public async checkForApprovedWithdrawals() {
    // Defense in depth: even if @Interval ever fires concurrently, only one
    // tick at a time should walk the queue. The atomic claim below is the
    // real correctness guard.
    if (this.isCheckingApprovedWithdrawals) {
      this.logger.debug('checkForApprovedWithdrawals already running, skipping tick');
      return;
    }
    this.isCheckingApprovedWithdrawals = true;

    try {
      const approvedTransactions = await this.userTransactionService.checkForApprovedWithdrawRequests();

      if (approvedTransactions.length === 0) {
        return;
      }

      this.logger.log(`Found ${approvedTransactions.length} approved withdrawal(s) to process`);

      for (const transaction of approvedTransactions) {
        // Atomically claim APPROVED -> PROCESSING. If another worker beat us
        // to it (or status has changed), claim returns false and we skip.
        const claimed = await this.userTransactionService.claimApprovedForProcessing(transaction.id);
        if (!claimed) {
          this.logger.debug(`Withdrawal already claimed elsewhere: transactionId=${transaction.id}`);
          continue;
        }

        try {
          await this.processRequestedWithdrawal(transaction);
          this.logger.log(`Withdrawal processed: transactionId=${transaction.id}, userId=${transaction.userId}`);
        } catch (error) {
          this.logger.error(`Failed to process approved withdrawal: transactionId=${transaction.id}`, error);
          // processRequestedWithdrawal already refunds + marks FAILED on Fireblocks errors.
        }
      }
    } finally {
      this.isCheckingApprovedWithdrawals = false;
    }
  }

  @Interval(5 * 60 * 1000)
  public async checkForDeclinedWithdrawals() {
    const declinedTransactions = await this.userTransactionService.checkForDeclinedWithdrawRequests();

    if (declinedTransactions.length === 0) {
      return;
    }

    this.logger.log(`Processing ${declinedTransactions.length} declined withdrawal(s)`);

    for (const transaction of declinedTransactions) {
      try {
        await this.handleDeclinedWithdrawalRefund(transaction);
        this.logger.log(`Declined withdrawal refunded: transactionId=${transaction.id}, userId=${transaction.userId}`);
      } catch (error) {
        this.logger.error(`Failed to refund declined withdrawal: transactionId=${transaction.id}`, error);
      }
    }
  }

  async getAssetPrice(symbol: string): Promise<number> {
    let cache = await this.assetRateCacheRepository.findOne({ where: { symbol } });

    if (!cache) {
      throw new ServiceError(`Could not get ${symbol} rates at this moment`);
    }

    if (+cache.cachedAt < Date.now() - 5 * 60 * 1000) {
      const newRate = (await this.fetchAssetsRates([cache]))?.at(0);
      if (newRate) {
        await this.assetRateCacheRepository.update({ symbol: newRate.asset }, { rate: newRate.price });

        cache = await this.assetRateCacheRepository.findOne({ where: { symbol } });
      }
    }

    if (!cache) {
      throw new ServiceError(`Could not get ${symbol} rates at this moment`);
    }

    return Number(cache.rate);
  }

  async getAllAssetPrices(): Promise<AssetPriceDTO[]> {
    let assetsCache = await this.assetRateCacheRepository.find();

    const needsFetch = assetsCache.filter((asset) => !asset.rate || +asset.cachedAt < Date.now() - 5 * 60 * 1000);

    if (needsFetch.length > 0) {
      const newRates = await this.fetchAssetsRates(assetsCache);

      if (newRates && newRates.length > 0) {
        for (const rate of newRates) {
          await this.assetRateCacheRepository.update({ symbol: rate.asset }, { rate: rate.price });
        }

        assetsCache = await this.assetRateCacheRepository.find();
      }
    }

    if (!assetsCache) {
      throw new ServiceError(`Could not get assets rates at this moment`);
    }

    return assetsCache.map((asset) => new AssetPriceDTO(asset.symbol, Number(asset.rate)));
  }

  async fetchAssetsRates(assets: AssetRateCache[]): Promise<AssetPriceDTO[]> {
    const res = await axios.get<CoinGeckoPriceResponse>(this.configService.getCoingeckoApiUrl(), {
      params: {
        ids: assets.map((asset) => asset.assetName).join(','),
        vs_currencies: 'usd',
      },
    });

    const data = res.data;

    return assets.map((asset) => {
      const price = data[asset.assetName]?.usd ?? 0;

      if (!data[asset.assetName]) {
        this.logger.warn(`CoinGecko did not return data for asset: ${asset.assetName} (${asset.symbol})`);
      }

      return new AssetPriceDTO(asset.symbol, price);
    });
  }

  async getFeeEstimation(userId: string, asset: WalletAsset) {
    await this.userService.findById(userId);

    const mappedAsset = this.mapAsset(asset);

    const feeEstimate = await this.fireblocks.transactions.estimateNetworkFee({
      assetId: mappedAsset,
    });

    const medium = feeEstimate.data.medium;
    if (!medium) throw new ServiceError('Unable to fetch fee estimate');

    const gasLimits: Record<string, number> = {
      ETH: 25_000,
      USDT_ERC20: 90_000,
      BTC: 150,
      LTC: 150,
      SOL: 1,
    };

    let feeInNative = 0;
    let feeUi = '';

    const assetUsdPrice = await this.getAssetPrice('ETH');

    switch (mappedAsset) {
      case 'ETH':
        if (!medium.gasPrice) return;
        feeInNative = (parseFloat(medium.gasPrice) * gasLimits.ETH * assetUsdPrice) / 1e9;
        feeUi = feeInNative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        break;

      case 'USDT_ERC20':
        if (!medium.gasPrice) return;
        feeInNative = (parseFloat(medium.gasPrice) * gasLimits.USDT_ERC20 * assetUsdPrice) / 1e9;
        feeUi = feeInNative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        break;

      case 'BTC':
      case 'LTC': {
        const satPerVb = parseFloat(medium.feePerByte ?? '0');
        const vsize = gasLimits[mappedAsset];
        feeInNative = (satPerVb * vsize * assetUsdPrice) / 1e8;
        feeUi = feeInNative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
        break;
      }

      case 'SOL':
        feeInNative = (5000 / 1e9) * assetUsdPrice;
        feeUi = feeInNative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
        break;

      default:
        throw new ServiceError(`Unsupported asset: ${mappedAsset}`);
    }

    return feeUi;
  }

  async getDepositAddress(userId: string, asset: WalletAsset): Promise<string> {
    try {
      const userWallet = await this.userService.getUserWallet(userId, asset);

      if (userWallet) {
        return userWallet.address;
      }

      const userExistingWallet = await this.userService.getUserVault(userId);

      let vault: FireblocksResponse<VaultAccount>;
      let vaultAccountId: string;

      if (userExistingWallet && userExistingWallet.vaultId) {
        vault = await this.fireblocks.vaults.getVaultAccount({
          vaultAccountId: userExistingWallet.vaultId,
        });

        if (!vault.data?.id) {
          throw new ServiceError('Something went wrong');
        }
        vaultAccountId = vault.data.id;
      } else {
        try {
          vault = await this.fireblocks.vaults.createVaultAccount({
            createVaultAccountRequest: {
              name: `user_${userId}`,
              hiddenOnUI: true,
              autoFuel: false,
            },
          });

          if (!vault.data?.id) {
            throw new ServiceError('Something went wrong');
          }

          await this.fireblocks.vaults.unhideVaultAccount({
            vaultAccountId: vault.data?.id,
          });

          await this.fireblocks.vaults.setVaultAccountAutoFuel({
            setAutoFuelRequest: { autoFuel: true },
            vaultAccountId: vault.data?.id,
          });

          vaultAccountId = vault.data.id;
        } catch (createError) {
          if (
            createError instanceof FireblocksError &&
            createError.response?.statusCode === 400 &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            createError.response.data.code === 1026
          ) {
            vaultAccountId = await this.findExistingVaultByUser(userId);

            if (!vaultAccountId) {
              throw new ServiceError('Failed to create or recover vault account');
            }
          } else {
            throw createError;
          }
        }
      }

      if (!vaultAccountId) {
        throw new ServiceError('Deposit: Something went wrong.');
      }

      const depositAddress = await this.getOrCreateAssetAddress(vaultAccountId, asset);

      if (!depositAddress) {
        throw new ServiceError('Deposit: Failed to generate address.');
      }

      await this.userService.createWallet({
        userId,
        vaultId: vaultAccountId,
        address: depositAddress,
        asset,
      });

      return depositAddress;
    } catch (error) {
      this.logger.error(`Failed to get deposit address: userId=${userId}, asset=${asset}`, error);

      // Preserve user-friendly ServiceErrors thrown deeper in the call so the
      // user gets the actual reason ("vault create failed", "address generation
      // failed", etc.) instead of a useless generic message.
      if (error instanceof ServiceError) throw error;

      const reason = error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceError(`Failed to get deposit address: ${reason}`);
    }
  }

  private async getOrCreateAssetAddress(vaultAccountId: string, asset: WalletAsset): Promise<string | null> {
    const assetId = this.mapAsset(asset);

    try {
      await this.fireblocks.vaults.createVaultAccountAsset({
        vaultAccountId,
        assetId,
      });
    } catch (createAssetErr: unknown) {
      if (this.isFireblocksError(createAssetErr)) {
        const status = createAssetErr.response?.statusCode;
        if (!(status === 400 || status === 409)) {
          throw createAssetErr;
        }
      } else {
        throw createAssetErr;
      }
    }

    try {
      const addressesResp = await this.fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
        vaultAccountId,
        assetId,
      });

      const addressesFromData: VaultWalletAddress[] | undefined = addressesResp.data?.addresses;

      if (addressesFromData && addressesFromData.length > 0) {
        return addressesFromData[0].address ?? null;
      }

      try {
        const createAddrResp = await this.fireblocks.vaults.createVaultAccountAssetAddress({
          vaultAccountId,
          assetId,
          createAddressRequest: { description: `deposit_for_vault_${vaultAccountId}` },
        });

        const createdAddress = (createAddrResp.data as { address?: string } | undefined)?.address;
        if (createdAddress) return createdAddress;

        this.logger.error(`Failed to create asset address: vaultId=${vaultAccountId}, asset=${assetId}`);
        return null;
      } catch (createAddrErr: unknown) {
        if (this.isFireblocksError(createAddrErr)) {
          try {
            const recheckResp = await this.fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
              vaultAccountId,
              assetId,
            });

            const recheckAddresses: VaultWalletAddress[] | undefined = recheckResp.data?.addresses;

            if (recheckAddresses && recheckAddresses.length > 0) return recheckAddresses[0].address ?? null;
          } catch (recheckErr: unknown) {
            this.logger.error(`Failed to recheck addresses: vaultId=${vaultAccountId}, asset=${assetId}`, recheckErr);
          }
        }

        this.logger.error(
          `Failed to create or retrieve address: vaultId=${vaultAccountId}, asset=${assetId}`,
          createAddrErr,
        );
        return null;
      }
    } catch (addressesErr: unknown) {
      if (this.isFireblocksError(addressesErr)) {
        this.logger.error(
          `Fireblocks error fetching addresses: vaultId=${vaultAccountId}, asset=${assetId}, status=${addressesErr.response?.statusCode}`,
          addressesErr.response?.data,
        );
      } else {
        this.logger.error(`Failed to fetch addresses: vaultId=${vaultAccountId}, asset=${assetId}`, addressesErr);
      }
      return null;
    }
  }

  private isFireblocksError(e: unknown) {
    return e instanceof FireblocksError;
  }

  private async findExistingVaultByUser(userId: string): Promise<string> {
    try {
      // First, prefer the wallet table mapping — it's the source of truth for
      // which Fireblocks vault we created for this user.
      const local = await this.userService.getUserVault(userId);
      if (local?.vaultId) return local.vaultId;

      const expectedName = `user_${userId}`;
      const vaultsResponse = await this.fireblocks.vaults.getPagedVaultAccounts({
        namePrefix: expectedName,
      });

      const accounts = vaultsResponse.data.accounts ?? [];

      // Prefer an exact-match name; fall back to a single prefix match if
      // exactly one vault was returned (covers historical vaults whose name
      // got normalized by Fireblocks).
      const exact = accounts.find((vault) => vault.name === expectedName);
      if (exact?.id) return exact.id;

      if (accounts.length === 1 && accounts[0]?.id) {
        this.logger.warn(
          `Found a single vault matching prefix ${expectedName} but with name ${accounts[0].name} — using it`,
        );
        return accounts[0].id;
      }

      if (accounts.length > 1) {
        this.logger.error(`Multiple vaults matched prefix ${expectedName}; refusing to guess. Resolve manually.`);
      }

      return '';
    } catch (error) {
      this.logger.error(`Failed to find existing vault: userId=${userId}`, error);
      return '';
    }
  }

  async processWithdrawTransaction(event: FireblocksTransactionWebhookV2): Promise<void> {
    if (!event.data.externalTxId) {
      this.logger.warn('Withdrawal webhook missing externalTxId, skipping');
      return;
    }

    const transaction = await this.userTransactionService.getTransactionById(event.data.externalTxId);

    if (!transaction) {
      this.logger.warn(`Withdrawal transaction not found: externalTxId=${event.data.externalTxId}`);
      return;
    }

    const userId = transaction.userId;
    const transactionStatus = this.mapTransactionStatus(event.data.status);
    const statusChanged = transaction.status !== transactionStatus;

    if (!statusChanged) {
      return;
    }

    this.logger.log(
      `Withdrawal status changed: transactionId=${transaction.id}, ${transaction.status} -> ${transactionStatus}`,
    );

    if (transactionStatus === TransactionStatus.FAILED) {
      await this.handleWithdrawalRefund(transaction, 'Transaction failed on Fireblocks processing transaction');

      await this.userTransactionService.updateTransaction(transaction.id, {
        status: transactionStatus,
        transactionHash: event.data.txHash,
        externalStatus: event.data.status,
        externalSubStatus: event.data.subStatus,
        refunded: true,
      });
      return;
    }

    if (transactionStatus === TransactionStatus.COMPLETED) {
      await this.notificationService.createNotification(
        userId,
        'Withdraw Confirmed',
        `Your withdraw $${event.data.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been confirmed. Transaction ID: ${transaction.id}`,
        'warning',
        this.mapTxHashToLink(transaction.asset, event.data.txHash || transaction.transactionHash),
      );

      await this.userTransactionService.updateTransaction(transaction.id, {
        status: transactionStatus,
        transactionHash: event.data.txHash,
        externalStatus: event.data.status,
        externalSubStatus: event.data.subStatus,
      });
      return;
    }

    if (transactionStatus === TransactionStatus.PENDING) {
      if (event.data.txHash && !transaction.transactionHash) {
        await this.notificationService.createNotification(
          userId,
          `Withdraw Sent`,
          `Your withdraw $${event.data.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been sent. Transaction ID: ${transaction.id}`,
          'warning',
          this.mapTxHashToLink(transaction.asset, event.data.txHash),
        );
      }

      await this.userTransactionService.updateTransaction(transaction.id, {
        status: transactionStatus,
        transactionHash: event.data.txHash,
        transactionId: event.data.id,
        externalStatus: event.data.status,
        externalSubStatus: event.data.subStatus,
      });
      return;
    }

    await this.userTransactionService.updateTransaction(transaction.id, {
      status: transactionStatus,
      transactionHash: event.data.txHash,
      externalStatus: event.data.status,
      externalSubStatus: event.data.subStatus,
    });
  }

  async processDepositTransaction(userId: string, event: FireblocksTransactionWebhookV2): Promise<void> {
    if (!event.data.id) throw new Error('Data not valid, no event data ID present');

    const transactionStatus = this.mapTransactionStatus(event.data.status);
    const normalizedAsset = event.data.assetId === 'USDT_ERC20' ? 'USDT' : event.data.assetId;

    // Drive the entire deposit-credit flow inside one DB transaction so the
    // trx upsert + the balance credit are atomic, and use a conditional
    // UPDATE so duplicate webhook deliveries can never double-credit.
    const credited = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.getRepository(UserTransaction).findOne({
        where: { transactionId: event.data.id },
      });

      let trxId: string;

      if (!existing) {
        const created = await this.userTransactionService.createTransaction(
          {
            status: transactionStatus,
            amount: event.data.amount,
            amountUsd: event.data.amountUSD,
            fee: 0,
            networkFee: event.data.networkFee,
            userId,
            asset: normalizedAsset,
            type: 'deposit',
            destinationAddress: event.data.destinationAddress,
            senderAddress: event.data.sourceAddress,
            transactionHash: event.data.txHash,
            transactionId: event.data.id,
            externalStatus: event.data.status,
            externalSubStatus: event.data.subStatus,
          },
          manager,
        );
        trxId = created.id;

        if (transactionStatus !== TransactionStatus.COMPLETED) {
          return null;
        }
      } else {
        trxId = existing.id;
        if (existing.status === TransactionStatus.COMPLETED) {
          // Idempotent no-op: a previous webhook delivery already credited this deposit.
          return null;
        }

        if (transactionStatus !== TransactionStatus.COMPLETED) {
          await manager.getRepository(UserTransaction).update(
            { id: existing.id },
            {
              status: transactionStatus,
              externalStatus: event.data.status,
              externalSubStatus: event.data.subStatus,
              transactionHash: event.data.txHash,
            },
          );
          return null;
        }
      }

      // We are about to credit. Use a conditional UPDATE that flips to
      // COMPLETED only if the row isn't already COMPLETED, so the credit
      // and the COMPLETED transition are atomic and exclusive.
      const claimed = await this.userTransactionService.claimDepositCompletion(
        trxId,
        {
          externalStatus: event.data.status,
          externalSubStatus: event.data.subStatus,
          transactionHash: event.data.txHash,
        },
        manager,
      );

      if (!claimed) {
        // Another concurrent webhook beat us to it — nothing to do.
        return null;
      }

      await this.userService.updateBalance(userId, event.data.amountUSD, manager, {
        logType: BalanceLogType.DEPOSIT,
        relatedTransactionId: trxId,
        reason: `Crypto deposit (${normalizedAsset})`,
      });

      return trxId;
    });

    if (credited) {
      await this.notificationService.createNotification(
        userId,
        'Deposit Credited',
        `You deposited $${event.data.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Transaction ID: ${credited}`,
        'success_one',
        this.mapTxHashToLink(normalizedAsset, event.data.txHash),
      );
    }
  }

  async createWithdrawalRequest(userId: string, payload: UserWithdrawDTO) {
    if (payload.withdrawAmountUsd < 10) {
      throw new ServiceError('Withdraw amount must be $10 or above');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ServiceError('User not found');
    }

    const cachedRate = await this.getAssetPrice(payload.asset);

    if (!cachedRate || cachedRate <= 0) {
      throw new ServiceError(`Something went wrong. ${payload.asset} rate fetch failed`);
    }

    const withdrawFee = payload.withdrawAmountUsd * 0.02;
    const withdrawAmountUsdWithFee = payload.withdrawAmountUsd - withdrawFee;
    const withdrawAmount = withdrawAmountUsdWithFee / cachedRate;

    // Debit the balance and create the trx in a single transaction. If either
    // fails the whole thing rolls back — no orphaned trx, no missing debit.
    const withdrawTrx = await this.dataSource.transaction(async (manager) => {
      const trx = manager.create(UserTransaction, {
        amountUsd: payload.withdrawAmountUsd,
        amount: withdrawAmount,
        fee: withdrawFee,
        asset: payload.asset,
        destinationAddress: payload.walletAddress,
        status: TransactionStatus.REQUESTED,
        type: 'withdraw',
        user: { id: userId },
      });
      const savedTrx = await manager.save(trx);

      await this.userService.updateBalance(userId, -payload.withdrawAmountUsd, manager, {
        logType: BalanceLogType.WITHDRAW,
        relatedTransactionId: savedTrx.id,
        reason: `Crypto withdrawal (${payload.asset})`,
      });

      return savedTrx;
    });

    // Only fire user-visible notifications after the debit + trx commit succeeded.
    await this.notificationService.createNotification(
      userId,
      'Withdraw Requested',
      `Withdraw request of $${payload.withdrawAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been sent. Please wait until we approve your request. Transaction ID: ${withdrawTrx.id}`,
      'warning',
    );

    if (this.configService.getTelegramNotificationsEnabled()) {
      try {
        await this.telegramService.sendWithdrawNotification({
          userId,
          userName: user.username,
          amount: withdrawAmount,
          amountUsd: payload.withdrawAmountUsd,
          asset: payload.asset,
          destinationAddress: payload.walletAddress,
          transactionId: withdrawTrx.id,
          feeUsd: withdrawFee,
          fee: withdrawFee / cachedRate,
        });
      } catch (telegramErr) {
        // A Telegram outage must not roll back a successful withdraw request.
        this.logger.error(
          `Telegram withdraw notification failed (transactionId=${withdrawTrx.id})`,
          telegramErr instanceof Error ? telegramErr.stack : String(telegramErr),
        );
      }
    }
  }

  async processRequestedWithdrawal(transaction: UserTransaction) {
    try {
      const res = await this.fireblocks.transactions.createTransaction({
        transactionRequest: {
          assetId: transaction.asset === 'USDT' ? 'USDT_ERC20' : transaction.asset,
          amount: transaction.amount,
          source: {
            type: TransferPeerPathType.VaultAccount,
            id: '6',
          },
          destination: {
            type: TransferPeerPathType.OneTimeAddress,
            oneTimeAddress: { address: transaction.destinationAddress },
          },
          note: `User withdrawal of ${transaction.amount} (${transaction.asset}) for user ${transaction.userId}`,
          externalTxId: transaction.id,
        },
      });

      this.logger.log(
        `Withdrawal submitted to Fireblocks: transactionId=${transaction.id}, fireblocksId=${res.data?.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create Fireblocks withdrawal: transactionId=${transaction.id}, userId=${transaction.userId}`,
        error,
      );

      await this.handleWithdrawalRefund(transaction, 'Fireblocks transaction creation failed');

      throw new ServiceError('Withdraw: Failed to create transaction');
    }

    await this.userTransactionService.updateTransaction(transaction.id, { status: TransactionStatus.PENDING });
  }

  private async handleWithdrawalRefund(transaction: UserTransaction, reason: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockedTransaction = await queryRunner.manager.findOne(UserTransaction, {
        where: { id: transaction.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedTransaction) {
        await queryRunner.rollbackTransaction();
        throw new ServiceError('Transaction not found');
      }

      if (lockedTransaction.refunded) {
        await queryRunner.rollbackTransaction();
        this.logger.debug(`Withdrawal already refunded: transactionId=${transaction.id}`);
        return;
      }

      lockedTransaction.status = TransactionStatus.FAILED;
      lockedTransaction.refunded = true;
      await queryRunner.manager.save(lockedTransaction);

      await this.userService.updateBalance(transaction.userId, transaction.amountUsd, queryRunner.manager, {
        logType: BalanceLogType.WITHDRAW_FAILED_REFUND,
        relatedTransactionId: transaction.id,
        reason: `Withdrawal refund - ${reason} (${transaction.asset})`,
      });

      await queryRunner.commitTransaction();

      this.logger.log(`Withdrawal refunded: transactionId=${transaction.id}, reason=${reason}`);

      await this.notificationService.createNotification(
        transaction.userId,
        'Withdraw Failed',
        `Your withdraw $${transaction.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} failed and was refunded. Transaction ID: ${transaction.id}`,
        'warning',
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process withdrawal refund: transactionId=${transaction.id}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleDeclinedWithdrawalRefund(transaction: UserTransaction, reason = 'Transaction declined') {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockedTransaction = await queryRunner.manager.findOne(UserTransaction, {
        where: { id: transaction.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedTransaction) {
        await queryRunner.rollbackTransaction();
        throw new ServiceError('Transaction not found');
      }

      if (lockedTransaction.refunded) {
        await queryRunner.rollbackTransaction();
        this.logger.debug(`Declined withdrawal already refunded: transactionId=${transaction.id}`);
        return;
      }

      lockedTransaction.refunded = true;
      await queryRunner.manager.save(lockedTransaction);

      await this.userService.updateBalance(transaction.userId, transaction.amountUsd, queryRunner.manager, {
        logType: BalanceLogType.WITHDRAW_DECLINED_REFUND,
        relatedTransactionId: transaction.id,
        reason: `Withdrawal refund - ${reason} (${transaction.asset})`,
      });

      await queryRunner.commitTransaction();

      this.logger.log(`Declined withdrawal refunded: transactionId=${transaction.id}`);

      await this.notificationService.createNotification(
        transaction.userId,
        'Withdraw Declined',
        `Your withdraw $${transaction.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} was declined and refunded. Transaction ID: ${transaction.id}`,
        'warning',
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process declined withdrawal refund: transactionId=${transaction.id}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private mapAsset(asset: WalletAsset): string {
    if (this.configService.isFireblocksSandbox()) {
      return (
        {
          BTC: 'BTC_TEST',
          ETH: 'ETH_TEST5',
          USDT: 'USDT_TEST5',
          LTC: 'LTC_TEST',
          SOL: 'SOL_TEST',
        }[asset] ?? asset
      );
    }
    return (
      {
        BTC: 'BTC',
        ETH: 'ETH',
        USDT: 'USDT_ERC20',
        LTC: 'LTC',
        SOL: 'SOL',
      }[asset] ?? asset
    );
  }

  private mapTxHashToLink = (symbol: string, txHash?: string): string => {
    if (!txHash) return '';
    switch (symbol) {
      case 'BTC':
        return `https://www.blockchain.com/explorer/transactions/btc/${txHash}`;
      case 'USDT':
      case 'USDT_ERC20':
      case 'ETH':
        return `https://etherscan.io/tx/${txHash}`;
      case 'SOL':
        return `https://solscan.io/tx/${txHash}`;
      case 'LTC':
        return `https://www.blockchain.com/explorer/transactions/ltc/${txHash}`;
      default:
        return '';
    }
  };

  mapTransactionStatus(status?: string) {
    switch (status) {
      case 'COMPLETED':
        return TransactionStatus.COMPLETED;
      case 'CANCELLING':
      case 'CANCELLED':
      case 'BLOCKED':
      case 'REJECTED':
      case 'FAILED':
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.PENDING;
    }
  }
}
