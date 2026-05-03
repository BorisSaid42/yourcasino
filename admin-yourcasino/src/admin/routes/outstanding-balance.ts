import { Router } from 'express';
import { User } from '../../entities/user.entity.js';
import { Lobby } from '../../entities/lobby.entity.js';

const router = Router();

router.get('/data', async (_, res) => {
  try {
    // Calculate total user balances
    const userBalanceResult = await User.createQueryBuilder('user')
      .select('SUM(user.balance)', 'total')
      .addSelect('COUNT(user.id)', 'count')
      .getRawOne();

    const totalUserBalances = Number(userBalanceResult?.total || 0);
    const userCount = Number(userBalanceResult?.count || 0);

    // Calculate total lobby bankrolls (both blackjack and roulette)
    const lobbyBankrollResult = await Lobby.createQueryBuilder('lobby')
      .select('SUM(lobby.bankroll)', 'blackjackTotal')
      .addSelect('SUM(lobby.rouletteBankroll)', 'rouletteTotal')
      .addSelect('COUNT(lobby.id)', 'count')
      .where(`lobby.status = 'active'`)
      .getRawOne();

    const lobbyPausedBankrollResult = await Lobby.createQueryBuilder('lobby')
      .select('SUM(lobby.bankroll)', 'blackjackTotal')
      .addSelect('SUM(lobby.rouletteBankroll)', 'rouletteTotal')
      .addSelect('COUNT(lobby.id)', 'count')
      .where(`lobby.status = 'paused'`)
      .getRawOne();

    const totalBlackjackBankrolls = Number(lobbyBankrollResult?.blackjackTotal || 0);
    const totalRouletteBankrolls = Number(lobbyBankrollResult?.rouletteTotal || 0);
    const totalPausedBlackjackBankrolls = Number(lobbyPausedBankrollResult?.blackjackTotal || 0);
    const totalPausedRouletteBankrolls = Number(lobbyPausedBankrollResult?.rouletteTotal || 0);
    const totalLobbyBankrolls = totalBlackjackBankrolls + totalRouletteBankrolls;
    const totalPausedLobbyBankrolls = totalPausedBlackjackBankrolls + totalPausedRouletteBankrolls;
    const lobbyCount = Number(lobbyBankrollResult?.count || 0);
    const lobbyPausedCount = Number(lobbyPausedBankrollResult?.count || 0);

    // Calculate overall total
    const overallTotal = totalUserBalances + totalLobbyBankrolls + totalPausedLobbyBankrolls;

    res.json({
      data: {
        totalUserBalances,
        totalLobbyBankrolls,
        totalPausedLobbyBankrolls,
        totalBlackjackBankrolls,
        totalRouletteBankrolls,
        totalPausedBlackjackBankrolls,
        totalPausedRouletteBankrolls,
        overallTotal,
        userCount,
        lobbyCount,
        lobbyPausedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching outstanding balance:', error);
    return res.status(500).json({ error: 'Failed to fetch outstanding balance' });
  }
});

export default router;
