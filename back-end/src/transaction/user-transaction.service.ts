import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BalanceLogType } from '../user/user-balance-log.entity';
import { UserService } from '../user/user.service';
import { CreateUserTransactionDTO } from './dto/create-user-transaction.dto';
import { TransactionHistoryResultDTO } from './dto/transaction-history-paginated.dto';
import { TransactionHistoryDTO } from './dto/transaction-history.dto';
import { TransactionStatus, UserTransaction } from './user-transaction.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UserTransactionService {
  private readonly logger = new Logger(UserTransactionService.name);

  constructor(
    @InjectRepository(UserTransaction) private readonly userTransactionRepository: Repository<UserTransaction>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  public async createTransaction(payload: CreateUserTransactionDTO, manager?: EntityManager): Promise<UserTransaction> {
    const repo = manager ? manager.getRepository(UserTransaction) : this.userTransactionRepository;

    const transaction = repo.create({
      ...payload,
      user: { id: payload.userId },
    });

    const savedTransaction = await repo.save(transaction);

    this.logger.log(
      `Transaction created: id=${savedTransaction.id}, type=${payload.type}, userId=${payload.userId}, status=${payload.status}`,
    );

    return savedTransaction;
  }

  /**
   * Atomically transition a deposit transaction to COMPLETED only if it isn't
   * already. Returns true if THIS call won the race (and the caller therefore
   * owes the user a balance credit).
   */
  public async claimDepositCompletion(
    id: string,
    update: Partial<UserTransaction>,
    manager: EntityManager,
  ): Promise<boolean> {
    const result = await manager
      .getRepository(UserTransaction)
      .createQueryBuilder()
      .update()
      .set({ ...update, status: TransactionStatus.COMPLETED })
      .where('id = :id', { id })
      .andWhere('status != :completed', { completed: TransactionStatus.COMPLETED })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  public async checkForApprovedWithdrawRequests() {
    return await this.userTransactionRepository.find({ where: { status: TransactionStatus.APPROVED } });
  }

  /**
   * Atomically transition a single transaction from APPROVED to PROCESSING.
   * Returns true only if THIS call won the claim. Used by the withdrawal cron
   * to prevent two cron ticks from submitting the same withdrawal twice.
   */
  public async claimApprovedForProcessing(id: string): Promise<boolean> {
    const result = await this.userTransactionRepository
      .createQueryBuilder()
      .update()
      .set({ status: TransactionStatus.PROCESSING })
      .where('id = :id', { id })
      .andWhere('status = :status', { status: TransactionStatus.APPROVED })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  public async checkForDeclinedWithdrawRequests() {
    return await this.userTransactionRepository.find({
      where: { status: TransactionStatus.DECLINED, refunded: false },
    });
  }

  public async updateTransaction(id: string, transaction: Partial<UserTransaction>): Promise<void> {
    await this.userTransactionRepository.update({ id }, transaction);

    if (transaction.status) {
      this.logger.log(`Transaction updated: id=${id}, status=${transaction.status}`);
    }
  }

  public async getTransactionByExternalId(transactionId: string): Promise<UserTransaction | null> {
    return this.userTransactionRepository.findOne({ where: { transactionId: transactionId } });
  }

  public async getTransactionById(id: string): Promise<UserTransaction | null> {
    return this.userTransactionRepository.findOne({ where: { id } });
  }

  public async markTransactionAsRefunded(id: string): Promise<void> {
    await this.userTransactionRepository.update({ id }, { refunded: true });
  }

  public async getUserTransactionHistory(
    userId: string,
    type: 'deposit' | 'withdraw',
    page: number,
    limit: number,
  ): Promise<TransactionHistoryResultDTO> {
    const [data, total] = await this.userTransactionRepository.findAndCount({
      where: {
        user: { id: userId },
        type,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new TransactionHistoryResultDTO({
      data: data.map((trx) => new TransactionHistoryDTO(trx)),
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  }

  public async cancelUserWithdrawal(userId: string, transactionId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(UserTransaction, {
        where: { id: transactionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        await queryRunner.rollbackTransaction();
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.userId !== userId) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException('You can only cancel your own withdrawal requests');
      }

      if (transaction.status !== TransactionStatus.REQUESTED) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(
          `Cannot cancel withdrawal with status: ${transaction.status}. Only requested withdrawals can be cancelled.`,
        );
      }

      if (transaction.type !== 'withdraw') {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException('Only withdrawal transactions can be cancelled');
      }

      transaction.status = TransactionStatus.CANCELLED;
      transaction.refunded = true;
      await queryRunner.manager.save(transaction);

      const refundAmount = transaction.amountUsd;
      await this.userService.updateBalance(userId, refundAmount, queryRunner.manager, {
        logType: BalanceLogType.WITHDRAW_CANCELLED_REFUND,
        relatedTransactionId: transaction.id,
        reason: `Withdrawal cancelled - ${transaction.asset} ${transaction.amount.toFixed(6)}`,
      });

      await queryRunner.commitTransaction();

      this.logger.log(`Withdrawal cancelled by user: transactionId=${transactionId}, userId=${userId}`);

      await this.notificationService.createNotification(
        transaction.userId,
        'Withdraw Cancelled',
        `Your withdraw amount of $${transaction.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been cancelled and refunded.`,
        'warning',
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to cancel withdrawal: transactionId=${transactionId}, userId=${userId}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
