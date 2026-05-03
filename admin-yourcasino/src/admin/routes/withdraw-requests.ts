import { Router } from 'express';
import datasource from '../../db/datasource.js';
import { UserTransaction } from '../../entities/transaction.entity.js';
import { TransactionStatus } from '../../entities/transaction.entity.js';

const router = Router();

router.get('/data', async (_, res) => {
  try {
    const requestedWithdrawals = await datasource
      .getRepository(UserTransaction)
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('users', 'user', 'user.id = transaction.userId')
      .select([
        'transaction.id',
        'transaction.amount',
        'transaction.amountUsd',
        'transaction.asset',
        'transaction.userId',
        'transaction.destinationAddress',
        'transaction.createdAt',
        'transaction.status',
        'user.username',
      ])
      .where('transaction.type = :type', { type: 'withdraw' })
      .andWhere('transaction.status = :status', { status: TransactionStatus.REQUESTED })
      .orderBy('transaction.createdAt', 'DESC')
      .getRawMany();

    const formattedWithdrawals = requestedWithdrawals.map(row => ({
      id: row.transaction_id,
      amount: row.transaction_amount,
      amountUsd: row.transaction_amount_usd,
      asset: row.transaction_asset,
      userId: row.transaction_user_id,
      username: row.user_username,
      destinationAddress: row.transaction_destination_address,
      createdAt: row.transaction_created_at,
      status: row.transaction_status,
    }));

    res.json({ withdrawals: formattedWithdrawals });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
  }
});

router.post('/approve', async (req, res) => {
  const queryRunner = datasource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id } = (req as any).fields || req.body;

    if (!id) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const transaction = await queryRunner.manager.findOne(UserTransaction, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!transaction) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== TransactionStatus.REQUESTED) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({
        error: `Only requested transactions can be approved. Current status: ${transaction.status}`,
      });
    }

    transaction.status = TransactionStatus.APPROVED;
    await queryRunner.manager.save(transaction);

    await queryRunner.commitTransaction();

    return res.status(200).json({
      message: 'Withdrawal request approved successfully',
      transaction,
    });
  } catch (e) {
    await queryRunner.rollbackTransaction();
    console.log(e);
    return res.status(500).json({ error: 'Failed to approve withdrawal request' });
  } finally {
    await queryRunner.release();
  }
});

router.post('/decline', async (req, res) => {
  const queryRunner = datasource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id, refund } = (req as any).fields || req.body;

    if (!id) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const transaction = await queryRunner.manager.findOne(UserTransaction, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!transaction) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== TransactionStatus.REQUESTED) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({
        error: `Only requested transactions can be declined. Current status: ${transaction.status}`,
      });
    }

    transaction.status = refund ? TransactionStatus.DECLINED : TransactionStatus.DECLINED_WITHOUT_REFUND;
    await queryRunner.manager.save(transaction);

    await queryRunner.commitTransaction();

    return res.status(200).json({
      message: 'Withdrawal request declined successfully',
      transaction,
    });
  } catch (e) {
    await queryRunner.rollbackTransaction();
    console.log(e);
    return res.status(500).json({ error: 'Failed to decline withdrawal request' });
  } finally {
    await queryRunner.release();
  }
});

export default router;
