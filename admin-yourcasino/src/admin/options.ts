import { dark } from '@adminjs/themes';
import { AdminJSOptions } from 'adminjs';

import crypto from 'crypto';
import { join } from 'path';
import { In } from 'typeorm';
import { BlackjackBet } from '../entities/blackjack-bet.entity.js';
import { BlackjackGame, BlackjackGameStatus } from '../entities/blackjack-game.entity.js';
import { BlackjackHand } from '../entities/blackjack-hand.js';
import { BlackjackPlayer } from '../entities/blackjack-player.entity.js';
import { LobbyTransaction, TransactionType as LobbyTransactionType } from '../entities/lobby-transaction.entity.js';
import { Lobby } from '../entities/lobby.entity.js';
import { RouletteBet } from '../entities/roulette-bet.entity.js';
import { RouletteGame, RouletteGameStatus } from '../entities/roulette-game.entity.js';
import { TransactionStatus, UserTransaction } from '../entities/transaction.entity.js';
import { User } from '../entities/user.entity.js';
import { VerificationEntity } from '../entities/verification.entity.js';
import componentLoader from './component-loader.js';

function convertTimestampToBanDuration(bannedUntil: Date | null): string {
  if (!bannedUntil) return 'none';

  const now = new Date();
  if (bannedUntil <= now) return 'none';

  const diffMs = bannedUntil.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (bannedUntil.getFullYear() >= 2099) return 'permanent';
  if (diffDays < 2) return '1day';
  if (diffDays < 10) return '1week';
  if (diffDays < 60) return '1month';
  if (diffDays < 400) return '1year';
  return 'permanent';
}

function convertBanDurationToTimestamp(duration: string): Date | null {
  const now = new Date();

  switch (duration) {
    case 'none':
      return null;
    case '1day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '1week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1month':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '1year':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case 'permanent':
      return new Date('2099-12-31T23:59:59.999Z');
    default:
      return null;
  }
}

function formatBanStatusForDisplay(bannedUntil: Date | null): string {
  if (!bannedUntil) return 'Active';

  const now = new Date();
  if (bannedUntil <= now) return 'Active (ban expired)';

  const diffMs = bannedUntil.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (bannedUntil.getFullYear() >= 2099) {
    return 'BANNED (Permanent)';
  }

  if (diffDays < 2) {
    return `BANNED (${diffDays + 1} day${diffDays === 0 ? '' : 's'} remaining)`;
  }

  if (diffDays < 10) {
    return `BANNED (${diffDays} days remaining)`;
  }

  if (diffDays < 60) {
    return `BANNED (~${Math.floor(diffDays / 7)} weeks remaining)`;
  }

  if (diffDays < 400) {
    return `BANNED (~${Math.floor(diffDays / 30)} months remaining)`;
  }

  return `BANNED (~${Math.floor(diffDays / 365)} years remaining)`;
}

function formatBanStatusShort(bannedUntil: Date | null): string {
  if (!bannedUntil) return 'Active';
  const now = new Date();
  return bannedUntil > now ? 'BANNED' : 'Active';
}

function createUserRecordParams(user: User, sampleRecord: any) {
  const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date();

  return {
    id: user.id,
    title: user.username,
    params: {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      bannedStatus: isBanned ? 'BANNED' : 'Active',
    },
    populated: sampleRecord?.populated || {},
    errors: sampleRecord?.errors || {},
    bulkActions: sampleRecord?.bulkActions || [],
    recordActions: sampleRecord?.recordActions || [],
  };
}

const options: AdminJSOptions = {
  componentLoader,
  defaultTheme: dark.id,
  availableThemes: [dark],
  branding: {
    companyName: 'Yourcasino admin',
    favicon: '/logo-favicon.png',
    logo: '/logo-favicon.png',
    withMadeWithLove: false,
  },
  rootPath: '/',
  pages: {
    balances: {
      component: 'Balances',
    },
    outstandingBalance: {
      component: 'OutstandingBalance',
    },
    withdrawRequests: {
      component: 'WithdrawRequests',
    },
  },
  resources: [
    {
      resource: User,
      options: {
        navigation: null,
        listProperties: ['username', 'email', 'balance', 'bannedStatus'],
        showProperties: ['userStats'],
        editProperties: ['username', 'email', 'balance', 'bannedUntil'],
        filterProperties: ['username', 'email'],
        properties: {
          bannedStatus: {
            type: 'string',
            isVisible: { list: true, show: false, edit: false, filter: false },
            label: 'Ban Status',
          },
          bannedUntil: {
            type: 'string',
            isVisible: { list: false, show: false, edit: true, filter: false },
            label: 'Ban Duration',
            availableValues: [
              { value: 'none', label: 'None (Unban)' },
              { value: '1day', label: '1 Day' },
              { value: '1week', label: '1 Week' },
              { value: '1month', label: '1 Month' },
              { value: '1year', label: '1 Year' },
              { value: 'permanent', label: 'Permanent' },
            ],
          },
          // Custom component for user stats
          userStats: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'User Statistics',
            components: {
              show: 'UserStatsShow',
            },
          },
          // Sortable fields
          balance: {
            type: 'number',
            isSortable: true,
            isVisible: { list: false, show: false, edit: true, filter: false },
            label: 'Balance',
          },
          // Transactions
          allTimeDeposits: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'All time deposits',
          },
          allTimeWithdraws: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'All time withdraws',
          },
          // Roulette
          totalRouletteProfit: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Roulette Profit',
          },
          totalRouletteWagered: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Roulette Wagered',
          },
          totalRouletteBets: {
            type: 'number',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Roulette Bets',
          },
          totalRouletteGames: {
            type: 'number',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Roulette Games',
          },

          // Blackjack
          totalBlackjackProfit: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Blackjack Profit',
          },
          totalBlackjackWagered: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Blackjack Wagered',
          },
          totalBlackjackBets: {
            type: 'number',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Blackjack Bets',
          },
          totalBlackjackGames: {
            type: 'number',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Blackjack Games',
          },
          // Lobby stats (as owner)
          totalLobbiesOwned: {
            type: 'number',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Lobbies Owned',
          },
          totalLobbyProfit: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Lobby Profit (as Owner)',
          },
          totalLobbyWagered: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Lobby Wagered (as Owner)',
          },

          // Combined totals
          totalProfit: {
            type: 'string',
            isSortable: true,
            isVisible: { list: true, show: true, edit: false, filter: false },
            label: 'Total Profit',
          },
          totalWagered: {
            type: 'string',
            isSortable: true,
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Wagered',
          },
          totalBets: {
            type: 'number',
            isSortable: true,
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Bets',
          },
          totalGames: {
            type: 'number',
            isSortable: true,
            isVisible: { list: false, show: true, edit: false, filter: false },
            label: 'Total Games',
          },
        },
        actions: {
          new: { isVisible: false, isAccessible: false },
          bulkDelete: { isVisible: false, isAccessible: false },
          search: { isVisible: false, isAccessible: false },
          delete: { isVisible: false, isAccessible: false },
          edit: {
            before: async request => {
              const banDuration = request.payload?.bannedUntil;
              const recordId = request.params?.recordId;

              if (banDuration && recordId) {
                const existingUser = await User.findOne({ where: { id: recordId } });
                const originalTimestamp = existingUser?.bannedUntil;
                const originalDuration = convertTimestampToBanDuration(originalTimestamp || null);

                // If unchanged, preserve original timestamp to avoid extending ban
                if (banDuration === originalDuration && originalTimestamp) {
                  request.payload.bannedUntil = originalTimestamp;
                  return request;
                }

                // Convert new duration to timestamp
                const newTimestamp = convertBanDurationToTimestamp(banDuration);
                request.payload.bannedUntil = newTimestamp;
              }

              return request;
            },
            after: async response => {
              const record = response.record;
              const bannedUntil = record?.params?.bannedUntil ? new Date(record.params.bannedUntil) : null;
              record.params.bannedUntil = convertTimestampToBanDuration(bannedUntil);
              return response;
            },
          },
          list: {
            isAccessible: true,
            showFilter: false,
            component: 'UserListResponsive',
            before: async request => {
              const usernameFilter = request.query?.['filters.username'];
              const emailFilter = request.query?.['filters.email'];

              if (usernameFilter) {
                request.query['__usernameSearch'] = usernameFilter;
                delete request.query['filters.username'];
              }

              if (emailFilter) {
                request.query['__emailSearch'] = emailFilter;
                delete request.query['filters.email'];
              }

              const sortBy = request.query?.sortBy;
              const direction = request.query?.direction || 'asc';

              if (sortBy && ['balance', 'totalProfit', 'totalWagered', 'totalBets', 'totalGames'].includes(sortBy)) {
                request.query['__sortBy'] = sortBy;
                request.query['__direction'] = direction;
                delete request.query.sortBy;
                delete request.query.direction;
              }

              return request;
            },
            after: async (response, request) => {
              const usernameSearch = request.query?.['__usernameSearch'];
              const emailSearch = request.query?.['__emailSearch'];
              const sortBy = request.query?.['__sortBy'];
              const direction = request.query?.['__direction'] || 'asc';
              const page = parseInt(request.query?.page as string) || 1;
              const perPage = parseInt(request.query?.perPage as string) || 20;

              const formatValue = (value: number) =>
                new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) +
                ' USD';

              // Helper function to calculate profit data for users
              const calculateProfitData = async (users: User[]) => {
                const sampleRecord = response.records?.[0];
                const records = [];

                for (const user of users) {
                  // Roulette totals
                  const rawRoulette = await RouletteBet.createQueryBuilder('bet')
                    .select('SUM(bet.profitAmount)', 'totalProfit')
                    .addSelect('SUM(bet.amount)', 'totalWagered')
                    .addSelect('COUNT(bet.id)', 'totalBets')
                    .addSelect('COUNT(DISTINCT bet.gameId)', 'totalGames')
                    .where('bet.userId = :userId', { userId: user.id })
                    .getRawOne();

                  // Blackjack totals
                  const rawBJ = await BlackjackBet.createQueryBuilder('bet')
                    .leftJoin('blackjack_players', 'player', 'player.id = bet.playerId')
                    .leftJoin('users', 'bjUser', 'bjUser.id = player.userId')
                    .select('SUM(bet.profitAmount)', 'totalProfit')
                    .addSelect('SUM(bet.amount)', 'totalWagered')
                    .addSelect('COUNT(bet.id)', 'totalBets')
                    .addSelect('COUNT(DISTINCT player.gameId)', 'totalGames')
                    .where('bjUser.id = :userId', { userId: user.id })
                    .getRawOne();

                  // Combine totals
                  const totalProfit = Number(rawRoulette?.totalProfit || 0) + Number(rawBJ?.totalProfit || 0);
                  const totalWagered = Number(rawRoulette?.totalWagered || 0) + Number(rawBJ?.totalWagered || 0);
                  const totalBets = Number(rawRoulette?.totalBets || 0) + Number(rawBJ?.totalBets || 0);
                  const totalGames = Number(rawRoulette?.totalGames || 0) + Number(rawBJ?.totalGames || 0);

                  records.push({
                    id: user.id,
                    title: user.username,
                    params: {
                      id: user.id,
                      username: user.username,
                      email: user.email,
                      balance: user.balance,
                      totalProfit: formatValue(totalProfit),
                      totalWagered: formatValue(totalWagered),
                      totalBets,
                      totalGames,
                      _totalProfitRaw: totalProfit,
                      _totalWageredRaw: totalWagered,
                    },
                    populated: sampleRecord?.populated || {},
                    errors: sampleRecord?.errors || {},
                    bulkActions: sampleRecord?.bulkActions || [],
                    recordActions: sampleRecord?.recordActions || [],
                  });
                }

                return records;
              };

              // Handle username search
              if (usernameSearch) {
                let query = User.createQueryBuilder('user').where('LOWER(user.username) LIKE LOWER(:username)', {
                  username: `%${usernameSearch}%`,
                });

                // Apply sorting at database level if sorting by balance
                if (sortBy === 'balance') {
                  query = query.orderBy('user.balance', direction.toUpperCase() as 'ASC' | 'DESC');
                }

                const [allUsers, total] = await query.getManyAndCount();

                // Calculate profit data for all matching users
                const allRecords = await calculateProfitData(allUsers);

                // Sort by custom fields if needed
                if (sortBy && sortBy !== 'balance') {
                  allRecords.sort((a, b) => {
                    let aVal, bVal;

                    if (sortBy === 'totalProfit') {
                      aVal = a.params._totalProfitRaw || 0;
                      bVal = b.params._totalProfitRaw || 0;
                    } else if (sortBy === 'totalWagered') {
                      aVal = a.params._totalWageredRaw || 0;
                      bVal = b.params._totalWageredRaw || 0;
                    } else if (sortBy === 'totalBets') {
                      aVal = Number(a.params.totalBets) || 0;
                      bVal = Number(b.params.totalBets) || 0;
                    } else if (sortBy === 'totalGames') {
                      aVal = Number(a.params.totalGames) || 0;
                      bVal = Number(b.params.totalGames) || 0;
                    }

                    return direction === 'desc' ? bVal - aVal : aVal - bVal;
                  });
                }

                // Paginate the sorted results
                const skip = (page - 1) * perPage;
                const paginatedRecords = allRecords.slice(skip, skip + perPage);

                response.records = paginatedRecords;
                response.meta = {
                  ...response.meta,
                  total,
                  perPage,
                  page,
                  sortBy: sortBy || undefined,
                  direction: sortBy ? direction : undefined,
                };

                return response;
              }

              // Handle email search
              if (emailSearch) {
                let query = User.createQueryBuilder('user').where('LOWER(user.email) LIKE LOWER(:email)', {
                  email: `%${emailSearch}%`,
                });

                // Apply sorting at database level if sorting by balance
                if (sortBy === 'balance') {
                  query = query.orderBy('user.balance', direction.toUpperCase() as 'ASC' | 'DESC');
                }

                const [allUsers, total] = await query.getManyAndCount();

                // Calculate profit data for all matching users
                const allRecords = await calculateProfitData(allUsers);

                // Sort by custom fields if needed
                if (sortBy && sortBy !== 'balance') {
                  allRecords.sort((a, b) => {
                    let aVal, bVal;

                    if (sortBy === 'totalProfit') {
                      aVal = a.params._totalProfitRaw || 0;
                      bVal = b.params._totalProfitRaw || 0;
                    } else if (sortBy === 'totalWagered') {
                      aVal = a.params._totalWageredRaw || 0;
                      bVal = b.params._totalWageredRaw || 0;
                    } else if (sortBy === 'totalBets') {
                      aVal = Number(a.params.totalBets) || 0;
                      bVal = Number(b.params.totalBets) || 0;
                    } else if (sortBy === 'totalGames') {
                      aVal = Number(a.params.totalGames) || 0;
                      bVal = Number(b.params.totalGames) || 0;
                    }

                    return direction === 'desc' ? bVal - aVal : aVal - bVal;
                  });
                }

                // Paginate the sorted results
                const skip = (page - 1) * perPage;
                const paginatedRecords = allRecords.slice(skip, skip + perPage);

                response.records = paginatedRecords;
                response.meta = {
                  ...response.meta,
                  total,
                  perPage,
                  page,
                  sortBy: sortBy || undefined,
                  direction: sortBy ? direction : undefined,
                };

                return response;
              }

              // Handle default list (no search)
              // If sorting by custom fields, fetch all users, calculate, sort, then paginate
              if (sortBy && sortBy !== 'balance') {
                const allUsers = await User.find();
                const allRecords = await calculateProfitData(allUsers);

                // Sort by the requested field
                allRecords.sort((a, b) => {
                  let aVal, bVal;

                  if (sortBy === 'totalProfit') {
                    aVal = a.params._totalProfitRaw || 0;
                    bVal = b.params._totalProfitRaw || 0;
                  } else if (sortBy === 'totalWagered') {
                    aVal = a.params._totalWageredRaw || 0;
                    bVal = b.params._totalWageredRaw || 0;
                  } else if (sortBy === 'totalBets') {
                    aVal = Number(a.params.totalBets) || 0;
                    bVal = Number(b.params.totalBets) || 0;
                  } else if (sortBy === 'totalGames') {
                    aVal = Number(a.params.totalGames) || 0;
                    bVal = Number(b.params.totalGames) || 0;
                  }

                  return direction === 'desc' ? bVal - aVal : aVal - bVal;
                });

                // Paginate
                const skip = (page - 1) * perPage;
                const paginatedRecords = allRecords.slice(skip, skip + perPage);

                response.records = paginatedRecords;
                response.meta = {
                  ...response.meta,
                  total: allRecords.length,
                  perPage,
                  page,
                  sortBy,
                  direction,
                };

                return response;
              }

              // Default case: calculate profit data for current page
              const records = response.records;
              if (records?.length) {
                // Fetch all users with bannedUntil info
                const userIds = records.map(r => r.params.id);
                const usersWithBanInfo = await User.createQueryBuilder('user')
                  .select(['user.id', 'user.bannedUntil'])
                  .whereInIds(userIds)
                  .getMany();

                const banInfoMap = new Map(usersWithBanInfo.map(u => [u.id, u.bannedUntil]));

                for (const record of records) {
                  const userId = record.params.id;
                  const bannedUntil = banInfoMap.get(userId);
                  record.params.bannedStatus = formatBanStatusShort(bannedUntil || null);

                  // Roulette totals
                  const rawRoulette = await RouletteBet.createQueryBuilder('bet')
                    .select('SUM(bet.profitAmount)', 'totalProfit')
                    .addSelect('SUM(bet.amount)', 'totalWagered')
                    .addSelect('COUNT(bet.id)', 'totalBets')
                    .addSelect('COUNT(DISTINCT bet.gameId)', 'totalGames')
                    .where('bet.userId = :userId', { userId })
                    .getRawOne();

                  // Blackjack totals
                  const rawBJ = await BlackjackBet.createQueryBuilder('bet')
                    .leftJoin('blackjack_players', 'player', 'player.id = bet.playerId')
                    .leftJoin('users', 'user', 'user.id = player.userId')
                    .select('SUM(bet.profitAmount)', 'totalProfit')
                    .addSelect('SUM(bet.amount)', 'totalWagered')
                    .addSelect('COUNT(bet.id)', 'totalBets')
                    .addSelect('COUNT(DISTINCT player.gameId)', 'totalGames')
                    .where('user.id = :userId', { userId })
                    .getRawOne();

                  // Combine totals
                  const totalProfit = Number(rawRoulette?.totalProfit || 0) + Number(rawBJ?.totalProfit || 0);
                  const totalWagered = Number(rawRoulette?.totalWagered || 0) + Number(rawBJ?.totalWagered || 0);
                  const totalBets = Number(rawRoulette?.totalBets || 0) + Number(rawBJ?.totalBets || 0);
                  const totalGames = Number(rawRoulette?.totalGames || 0) + Number(rawBJ?.totalGames || 0);

                  record.params.totalProfit = formatValue(-totalProfit);
                  record.params.totalWagered = formatValue(totalWagered);
                  record.params.totalBets = totalBets;
                  record.params.totalGames = totalGames;

                  // Store raw values for sorting
                  record.params._totalProfitRaw = totalProfit;
                  record.params._totalWageredRaw = totalWagered;
                }
              }

              return response;
            },
          },
          show: {
            after: async response => {
              const record = response.record;
              if (record?.params?.id) {
                const userId = record.params.id;

                // Format ban status for display
                const bannedUntil = record.params.bannedUntil ? new Date(record.params.bannedUntil) : null;
                record.params.bannedStatus = formatBanStatusForDisplay(bannedUntil);

                const rawDepositTransactions = await UserTransaction.createQueryBuilder('transaction')
                  .select('SUM(transaction.amountUsd)', 'totalDeposit')
                  .where('transaction.userId = :userId', { userId })
                  .andWhere('transaction.type = :depoType', { depoType: 'deposit' })
                  .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
                  .getRawOne();

                const rawWithdrawTransactions = await UserTransaction.createQueryBuilder('transaction')
                  .select('SUM(transaction.amountUsd)', 'totalWithdraw')
                  .where('transaction.userId = :userId', { userId })
                  .andWhere('transaction.type = :depoType', { depoType: 'withdraw' })
                  .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
                  .getRawOne();

                // Transaction counts
                const depositCountCompleted = await UserTransaction.count({
                  where: {
                    userId,
                    type: 'deposit',
                    status: TransactionStatus.COMPLETED,
                  },
                });

                const withdrawCountCompleted = await UserTransaction.count({
                  where: {
                    userId,
                    type: 'withdraw',
                    status: TransactionStatus.COMPLETED,
                  },
                });

                const withdrawCountPending = await UserTransaction.count({
                  where: {
                    userId,
                    type: 'withdraw',
                    status: TransactionStatus.PENDING,
                  },
                });

                const withdrawCountFailed = await UserTransaction.count({
                  where: {
                    userId,
                    type: 'withdraw',
                    status: TransactionStatus.FAILED,
                  },
                });

                const rawRoulette = await RouletteBet.createQueryBuilder('bet')
                  .select('SUM(bet.profitAmount)', 'totalProfit')
                  .addSelect('SUM(bet.amount)', 'totalWagered')
                  .addSelect('COUNT(bet.id)', 'totalBets')
                  .addSelect('COUNT(DISTINCT bet.gameId)', 'totalGames') // total roulette games
                  .where('bet.userId = :userId', { userId })
                  .getRawOne();

                const rawBJ = await BlackjackBet.createQueryBuilder('bet')
                  .leftJoin('blackjack_players', 'player', 'player.id = bet.playerId')
                  .leftJoin('users', 'user', 'user.id = player.userId')
                  .select('SUM(bet.profitAmount)', 'totalProfit')
                  .addSelect('SUM(bet.amount)', 'totalWagered')
                  .addSelect('COUNT(bet.id)', 'totalBets')
                  .addSelect('COUNT(DISTINCT player.gameId)', 'totalGames') // total blackjack games
                  .where('user.id = :userId', { userId })
                  .getRawOne();

                const userLobbies = await Lobby.createQueryBuilder('lobby')
                  .select('lobby.id')
                  .where('lobby.ownerId = :userId', { userId })
                  .getMany();

                const lobbyIds = userLobbies.map(l => l.id);
                const totalLobbiesCount = lobbyIds.length;

                let rawLobbyBlackjackStats = { totalProfit: 0, totalWagered: 0 };
                let rawLobbyRouletteStats = { totalProfit: 0, totalWagered: 0 };

                if (lobbyIds.length > 0) {
                  rawLobbyBlackjackStats = await BlackjackGame.createQueryBuilder('game')
                    .select('SUM(game.profitAmount)', 'totalProfit')
                    .addSelect('SUM(game.wagered)', 'totalWagered')
                    .where('game.lobbyId IN (:...lobbyIds)', { lobbyIds })
                    .getRawOne();

                  rawLobbyRouletteStats = await RouletteGame.createQueryBuilder('game')
                    .select('SUM(game.profitAmount)', 'totalProfit')
                    .addSelect('SUM(game.wagered)', 'totalWagered')
                    .where('game.lobbyId IN (:...lobbyIds)', { lobbyIds })
                    .getRawOne();
                }

                const totalDepositAmountUsd = Number(rawDepositTransactions?.totalDeposit || 0);
                const totalWithdrawAmountUsd = Number(rawWithdrawTransactions?.totalWithdraw || 0);

                const totalRouletteProfit = Number(rawRoulette?.totalProfit || 0);
                const totalRouletteWagered = Number(rawRoulette?.totalWagered || 0);
                const totalRouletteBets = Number(rawRoulette?.totalBets || 0);
                const totalRouletteGames = Number(rawRoulette?.totalGames || 0);

                const totalBJProfit = Number(rawBJ?.totalProfit || 0);
                const totalBJWagered = Number(rawBJ?.totalWagered || 0);
                const totalBJBets = Number(rawBJ?.totalBets || 0);
                const totalBlackjackGames = Number(rawBJ?.totalGames || 0);

                const totalProfit = totalRouletteProfit + totalBJProfit;
                const totalWagered = totalRouletteWagered + totalBJWagered;
                const totalBets = totalRouletteBets + totalBJBets;
                const totalGames = totalRouletteGames + totalBlackjackGames;

                const totalLobbyBlackjackProfit = Number(rawLobbyBlackjackStats?.totalProfit || 0);
                const totalLobbyBlackjackWagered = Number(rawLobbyBlackjackStats?.totalWagered || 0);
                const totalLobbyRouletteProfit = Number(rawLobbyRouletteStats?.totalProfit || 0);
                const totalLobbyRouletteWagered = Number(rawLobbyRouletteStats?.totalWagered || 0);
                const totalLobbyProfit = totalLobbyBlackjackProfit + totalLobbyRouletteProfit;
                const totalLobbyWagered = totalLobbyBlackjackWagered + totalLobbyRouletteWagered;
                const totalLobbies = totalLobbiesCount;

                const formatValue = (value: number) =>
                  new Intl.NumberFormat('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(value) + ' USD';

                record.params.allTimeDeposits = formatValue(totalDepositAmountUsd);
                record.params.allTimeWithdraws = formatValue(totalWithdrawAmountUsd);

                // Transaction counts
                record.params.depositCountCompleted = depositCountCompleted;
                record.params.withdrawCountCompleted = withdrawCountCompleted;
                record.params.withdrawCountPending = withdrawCountPending;
                record.params.withdrawCountFailed = withdrawCountFailed;

                record.params.totalRouletteProfit = formatValue(totalRouletteProfit);
                record.params.totalRouletteWagered = formatValue(totalRouletteWagered);
                record.params.totalRouletteBets = totalRouletteBets;
                record.params.totalRouletteGames = totalRouletteGames;

                record.params.totalBlackjackProfit = formatValue(totalBJProfit);
                record.params.totalBlackjackWagered = formatValue(totalBJWagered);
                record.params.totalBlackjackBets = totalBJBets;
                record.params.totalBlackjackGames = totalBlackjackGames;

                record.params.totalProfit = formatValue(totalProfit);
                record.params.totalWagered = formatValue(totalWagered);
                record.params.totalBets = totalBets;
                record.params.totalGames = totalGames;

                record.params.totalLobbiesOwned = totalLobbies;
                record.params.totalLobbyProfit = formatValue(totalLobbyProfit);
                record.params.totalLobbyWagered = formatValue(totalLobbyWagered);

                record.params.totalLobbyBlackjackProfit = formatValue(totalLobbyBlackjackProfit);
                record.params.totalLobbyBlackjackWagered = formatValue(totalLobbyBlackjackWagered);

                record.params.totalLobbyRouletteProfit = formatValue(totalLobbyRouletteProfit);
                record.params.totalLobbyRouletteWagered = formatValue(totalLobbyRouletteWagered);
              }
              return response;
            },
          },
        },
      },
    },
    {
      resource: UserTransaction,
      options: {
        navigation: null,
        listProperties: [],
        sort: {
          sortBy: 'updatedAt',
          direction: 'desc',
        },
        showProperties: [
          'id',
          'type',
          'asset',
          'amount',
          'amountUsd',
          'username',
          'status',
          'transactionId',
          'transactionHash',
          'externalStatus',
          'externalSubStatus',
          'senderAddress',
          'destinationAddress',
          'updatedAt',
        ],
        properties: {
          amount: {
            type: 'number',
            isVisible: { list: true, show: true, edit: false, filter: false },
            label: 'Amount',
            components: {
              list: componentLoader.add('AmountList', join(process.cwd(), 'src/admin/components/AmountList.tsx')),
            },
          },
          amountUsd: {
            type: 'number',
            isVisible: { list: true, show: true, edit: false, filter: false },
            label: 'Amount USD',
            components: {
              list: componentLoader.add('AmountUSDList', join(process.cwd(), 'src/admin/components/AmountUSDList.tsx')),
            },
          },
          asset: {
            type: 'string',
            isVisible: { list: true, show: true, edit: false, filter: false },
            label: 'Asset',
            components: {
              list: componentLoader.add('AssetList', join(process.cwd(), 'src/admin/components/AssetList.tsx')),
            },
          },
          username: {
            type: 'string',
            isVisible: { list: true, show: true, edit: false, filter: false },
            label: 'User ID',
          },
          updatedAt: {
            type: 'datetime',
            isSortable: true,
            label: 'Last Updated',
            isVisible: { list: true, show: true, edit: false, filter: false },
          },
          type: {
            availableValues: [
              { value: 'deposit', label: 'Deposit' },
              { value: 'withdraw', label: 'Withdraw' },
            ],
          },
          status: {
            availableValues: [
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'requested', label: 'Requested' },
              { value: 'approved', label: 'Approved' },
              { value: 'declined', label: 'Declined' },
              { value: 'declined_without_refund', label: 'Declined Without Refund' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
          },
        },
        actions: {
          new: { isVisible: false, isAccessible: false },
          bulkDelete: { isVisible: false, isAccessible: false },
          search: { isVisible: false, isAccessible: false },
          list: {
            isAccessible: true,
            showFilter: false,
            component: componentLoader.add(
              'UserTransactionList',
              join(process.cwd(), 'src/admin/components/UserTransactionList.tsx'),
            ),
            before: async request => {
              const userIdFilter = request.query?.['filters.userId'];

              if (userIdFilter) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                if (!uuidRegex.test(userIdFilter)) {
                  request.query['__usernameSearch'] = userIdFilter;
                  delete request.query['filters.userId'];
                }
              }
              return request;
            },
            after: async (response, request) => {
              const usernameSearch = request.query?.['__usernameSearch'];

              const formatAmount = (value: number) => {
                if (value == null) return 0;
                const multiplier = Math.pow(10, 6);
                return Math.floor(value * multiplier) / multiplier;
              };

              if (usernameSearch) {
                const users = await User.createQueryBuilder('user')
                  .where('LOWER(user.username) LIKE LOWER(:username)', { username: `%${usernameSearch}%` })
                  .getMany();

                if (users.length > 0) {
                  const userIds = users.map(u => u.id);

                  const page = parseInt(request.query?.page as string) || 1;
                  const perPage = parseInt(request.query?.perPage as string) || 20;
                  const skip = (page - 1) * perPage;

                  const [transactions, total] = await UserTransaction.createQueryBuilder('transaction')
                    .where('transaction.userId IN (:...userIds)', { userIds })
                    .orderBy('transaction.updatedAt', 'DESC')
                    .skip(skip)
                    .take(perPage)
                    .getManyAndCount();

                  const sampleRecord = response.records?.[0];

                  const newRecords = transactions.map(transaction => {
                    const user = users.find(u => u.id === transaction.userId);

                    return {
                      id: transaction.id,
                      title: transaction.id,
                      params: {
                        id: transaction.id,
                        type: transaction.type,
                        asset: transaction.asset,
                        amount: formatAmount(transaction.amount),
                        amountUsd: transaction.amountUsd,
                        networkFee: transaction.networkFee,
                        userId: transaction.userId,
                        username: user ? `${transaction.userId} (${user.username})` : transaction.userId || 'N/A',
                        status: transaction.status,
                        transactionId: transaction.transactionId,
                        transactionHash: transaction.transactionHash,
                        externalStatus: transaction.externalStatus,
                        externalSubStatus: transaction.externalSubStatus,
                        senderAddress: transaction.senderAddress,
                        destinationAddress: transaction.destinationAddress,
                        createdAt: transaction.createdAt,
                        updatedAt: transaction.updatedAt,
                      },
                      populated: sampleRecord?.populated || {},
                      errors: sampleRecord?.errors || {},
                      bulkActions: sampleRecord?.bulkActions || [],
                      recordActions: sampleRecord?.recordActions || [],
                    };
                  });

                  response.records = newRecords;
                  response.meta = {
                    total,
                    perPage,
                    page,
                    direction: 'desc',
                    sortBy: 'updatedAt',
                  };

                  return response;
                }

                response.records = [];
                response.meta = {
                  total: 0,
                  perPage: 20,
                  page: 1,
                  direction: 'asc',
                  sortBy: 'id',
                };
                return response;
              }

              const records = response.records;
              if (records?.length) {
                for (const record of records) {
                  const userId = record.params.userId;
                  if (userId) {
                    const user = await User.findOne({
                      where: { id: userId },
                    });
                    record.params.username = user ? `${userId} (${user.username})` : userId;
                  } else {
                    record.params.username = 'N/A';
                  }
                  if (record.params.amount != null) {
                    record.params.amount = formatAmount(record.params.amount);
                  }
                }
              }
              return response;
            },
          },
          show: {
            after: async response => {
              const record = response.record;

              const formatAmount = (value: number) => {
                if (value == null) return 0;
                const multiplier = Math.pow(10, 6);
                return Math.floor(value * multiplier) / multiplier;
              };

              if (record?.params?.userId) {
                const userId = record.params.userId;
                const user = await User.findOne({
                  where: { id: userId },
                });
                record.params.username = user ? `${userId} (${user.username})` : userId;
              } else {
                record.params.username = 'N/A';
              }

              if (record?.params?.amount != null) {
                record.params.amount = formatAmount(record.params.amount);
              }

              return response;
            },
          },
        },
      },
    },
    {
      resource: BlackjackBet,
      options: {
        navigation: null,
        listProperties: ['id', 'betPlace', 'amount', 'wonAmount', 'profitAmount', 'playerId', 'username', 'insurance'],
        showProperties: ['id', 'betPlace', 'amount', 'wonAmount', 'profitAmount', 'playerId', 'username', 'insurance'],
        editProperties: ['amount', 'wonAmount', 'profitAmount'],
        filterProperties: ['id', 'betPlace', 'amount', 'wonAmount', 'profitAmount', 'playerId', 'insurance'],
        properties: {
          username: {
            type: 'string',
            isVisible: { list: true, show: true, edit: false, filter: false },
            label: 'Username',
          },
          playerId: {
            type: 'string',
            isVisible: { list: true, show: true, edit: false, filter: true },
            label: 'Player ID (search by username here)',
          },
        },
        actions: {
          list: {
            isVisible: false,
            before: async request => {
              const playerIdFilter = request.query?.['filters.playerId'];

              if (playerIdFilter) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                if (!uuidRegex.test(playerIdFilter)) {
                  // Not a UUID, treat as username search
                  request.query['__usernameSearch'] = playerIdFilter;
                  delete request.query['filters.playerId'];
                }
              }
              return request;
            },
            after: async (response, request) => {
              const usernameSearch = request.query?.['__usernameSearch'];

              if (usernameSearch) {
                // Find users matching the username
                const users = await User.createQueryBuilder('user')
                  .where('LOWER(user.username) LIKE LOWER(:username)', { username: `%${usernameSearch}%` })
                  .getMany();

                if (users.length > 0) {
                  const userIds = users.map(u => u.id);

                  // Find all players for those users
                  const players = await BlackjackPlayer.createQueryBuilder('player')
                    .where('player.userId IN (:...userIds)', { userIds })
                    .getMany();

                  if (players.length > 0) {
                    const playerIds = players.map(p => p.id);

                    // Get paginated bets
                    const page = parseInt(request.query?.page as string) || 1;
                    const perPage = parseInt(request.query?.perPage as string) || 20;
                    const skip = (page - 1) * perPage;

                    const [bets, total] = await BlackjackBet.createQueryBuilder('bet')
                      .where('bet.playerId IN (:...playerIds)', { playerIds })
                      .orderBy('bet.createdAt', 'DESC')
                      .skip(skip)
                      .take(perPage)
                      .getManyAndCount();

                    // Copy structure from existing records
                    const sampleRecord = response.records?.[0];

                    // Map bets to AdminJS record format with usernames
                    const newRecords = bets.map(bet => {
                      const player = players.find(p => p.id === bet.playerId);
                      const user = player ? users.find(u => u.id === player.userId) : null;

                      return {
                        id: bet.id,
                        title: bet.id,
                        params: {
                          id: bet.id,
                          betPlace: bet.betPlace,
                          amount: bet.amount,
                          wonAmount: bet.wonAmount,
                          profitAmount: bet.profitAmount,
                          playerId: bet.playerId,
                          insurance: bet.insurance,
                          username: user?.username || 'N/A',
                          handId: bet.handId,
                          version: bet.version,
                          createdAt: bet.createdAt,
                          updatedAt: bet.updatedAt,
                        },
                        populated: sampleRecord?.populated || {},
                        errors: sampleRecord?.errors || {},
                        bulkActions: sampleRecord?.bulkActions || [],
                        recordActions: sampleRecord?.recordActions || [],
                      };
                    });

                    response.records = newRecords;
                    response.meta = {
                      total,
                      perPage,
                      page,
                      direction: 'desc',
                      sortBy: 'createdAt',
                    };

                    return response;
                  }
                }

                // No results found
                response.records = [];
                response.meta = {
                  total: 0,
                  perPage: 20,
                  page: 1,
                  direction: 'asc',
                  sortBy: 'id',
                };
                return response;
              }

              const records = response.records;
              if (records?.length) {
                for (const record of records) {
                  const playerId = record.params.playerId;
                  if (playerId) {
                    const player = await BlackjackPlayer.findOne({
                      where: { id: playerId },
                    });
                    if (player?.userId) {
                      const user = await User.findOne({
                        where: { id: player.userId },
                      });
                      record.params.username = user?.username || 'N/A';
                    } else {
                      record.params.username = 'N/A';
                    }
                  } else {
                    record.params.username = 'N/A';
                  }
                }
              }
              return response;
            },
          },
          show: {
            after: async response => {
              const record = response.record;
              if (record?.params?.playerId) {
                const playerId = record.params.playerId;
                const player = await BlackjackPlayer.findOne({
                  where: { id: playerId },
                });
                if (player?.userId) {
                  const user = await User.findOne({
                    where: { id: player.userId },
                  });
                  record.params.username = user?.username || 'N/A';
                } else {
                  record.params.username = 'N/A';
                }
              } else {
                record.params.username = 'N/A';
              }
              return response;
            },
          },
        },
      },
    },
    {
      resource: RouletteBet,
      options: {
        navigation: null,
        listProperties: ['id', 'betPlace', 'amount', 'wonAmount', 'profitAmount', 'gameId', 'userId'],
        showProperties: ['id', 'betPlace', 'amount', 'wonAmount', 'profitAmount', 'gameId', 'userId'],
        editProperties: ['amount', 'wonAmount', 'profitAmount'],
        filterProperties: ['id', 'betPlace', 'amount', 'wonAmount', 'profitAmount', 'gameId', 'userId'],
        properties: {
          betPlace: {
            isVisible: { list: true, show: true, edit: true, filter: true },
            availableValues: [],
            components: {},
          },
        },
        actions: {
          list: {
            isVisible: false,
            handler: async (request, response, context) => {
              const gameIdFilter = request.query?.['filters.gameId'];
              const userIdFilter = request.query?.['filters.userId'];
              const page = Number(request.query?.page) || 1;
              const perPage = Number(request.query?.perPage) || 20;

              let betQuery = RouletteBet.createQueryBuilder('bet');

              if (gameIdFilter) {
                betQuery = betQuery.where('bet.gameId = :gameId', { gameId: gameIdFilter });
              }

              if (userIdFilter) {
                if (gameIdFilter) {
                  betQuery = betQuery.andWhere('bet.userId = :userId', { userId: userIdFilter });
                } else {
                  betQuery = betQuery.where('bet.userId = :userId', { userId: userIdFilter });
                }
              }

              const total = await betQuery.getCount();

              betQuery = betQuery
                .orderBy('bet.createdAt', 'DESC')
                .skip((page - 1) * perPage)
                .take(perPage);

              const bets = await betQuery.getMany();

              const userIds = [...new Set(bets.map(b => b.userId))];
              const users = await User.createQueryBuilder('user')
                .select(['user.id', 'user.username'])
                .whereInIds(userIds)
                .getMany();

              const userMap = new Map(users.map(u => [u.id, u.username]));

              const records = bets.map(bet => {
                const record = context.resource.build(bet);
                record.params.username = userMap.get(bet.userId) || 'Unknown';
                return record;
              });

              return {
                records,
                meta: {
                  total,
                  perPage,
                  page,
                },
              };
            },
          },
        },
      },
    },
    {
      resource: VerificationEntity,
      options: {
        navigation: null,
        listProperties: ['id', 'code', 'used', 'type', 'userId', 'expireAt'],
        showProperties: ['id', 'code', 'used', 'type', 'userId', 'expireAt'],
        editProperties: ['used', 'expireAt'],
        filterProperties: ['used', 'type', 'userId'],
      },
    },
    {
      resource: RouletteGame,
      options: {
        navigation: null,
        listProperties: ['id', 'isCurrent', 'status', 'result', 'profitAmount', 'wagered', 'lobbyId'],
        showProperties: [
          'id',
          'isCurrent',
          'status',
          'result',
          'profitAmount',
          'wagered',
          'lobbyId',
          'serverSeed',
          'fairnessRandom',
          'createdAt',
          'updatedAt',
        ],
        editProperties: ['isCurrent', 'status', 'result', 'profitAmount', 'wagered'],
        filterProperties: ['id', 'isCurrent', 'status', 'result', 'profitAmount', 'wagered', 'lobbyId'],
        sort: {
          sortBy: 'updatedAt',
          direction: 'desc',
        },
        actions: {
          edit: { isVisible: false, isAccessible: false },
          delete: { isVisible: false, isAccessible: false },
          new: { isVisible: false, isAccessible: false },
          show: {
            isAccessible: true,
            component: 'RouletteGameShowResponsive',
            showInDrawer: false,
          },
          list: {
            isAccessible: true,
            showFilter: false,
            component: 'RouletteGameListResponsive',
            handler: async (request, response, context) => {
              const userIdFilter = request.query?.['filters.userId'];
              const lobbyIdFilter = request.query?.['filters.lobbyId'];
              const statusFilter = request.query?.['filters.status'];
              const isCurrentFilter = request.query?.['filters.isCurrent'];

              const page = Number(request.query?.page) || 1;
              const perPage = Number(request.query?.perPage) || 20;
              const sortBy = request.query?.sortBy || 'updatedAt';
              const direction = (request.query?.direction || 'desc') as 'ASC' | 'DESC';

              let gameQuery = RouletteGame.createQueryBuilder('game');

              if (userIdFilter) {
                const subQuery = RouletteBet.createQueryBuilder('bet')
                  .select('DISTINCT bet.gameId')
                  .where('bet.userId = :userId', { userId: userIdFilter });

                gameQuery = gameQuery.where(`game.id IN (${subQuery.getQuery()})`);
                gameQuery.setParameter('userId', userIdFilter);
              }

              if (lobbyIdFilter) {
                gameQuery = gameQuery.andWhere('game.lobbyId = :lobbyId', { lobbyId: lobbyIdFilter });
              }

              if (statusFilter) {
                gameQuery = gameQuery.andWhere('game.status = :status', { status: statusFilter });
              }

              if (isCurrentFilter) {
                const isCurrent = isCurrentFilter === 'true';
                gameQuery = gameQuery.andWhere('game.isCurrent = :isCurrent', { isCurrent });
              }

              const total = await gameQuery.getCount();

              gameQuery = gameQuery
                .orderBy(`game.${sortBy}`, direction.toUpperCase() as 'ASC' | 'DESC')
                .skip((page - 1) * perPage)
                .take(perPage);

              const games = await gameQuery.getMany();

              const records = games.map(game => context.resource.build(game));

              return {
                records,
                meta: {
                  total,
                  perPage,
                  page,
                },
              };
            },
          },
        },
      },
    },
    {
      resource: BlackjackGame,
      options: {
        navigation: null,
        listProperties: [
          'id',
          'isCurrent',
          'status',
          'dealerHand',
          'dealerHandTotal',
          'profitAmount',
          'wagered',
          'lobbyId',
        ],
        showProperties: [
          'id',
          'isCurrent',
          'status',
          'dealerHand',
          'dealerHandTotal',
          'profitAmount',
          'wagered',
          'createdAt',
          'updatedAt',
          'currentPlayerId',
          'lobbyId',
          'serverSeed',
          'fairnessRandom',
          'fullDeck',
          'shuffledDeck',
          'deck',
          'payedOut',
        ],
        editProperties: ['isCurrent', 'status', 'profitAmount', 'wagered'],
        filterProperties: ['id', 'isCurrent', 'status', 'dealerHandTotal', 'profitAmount', 'wagered', 'lobbyId'],
        sort: {
          sortBy: 'updatedAt',
          direction: 'desc',
        },
        properties: {
          dealerHand: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            components: {
              list: componentLoader.add(
                'DealerHandList',
                join(process.cwd(), 'src/admin/components/DealerHandList.tsx'),
              ),
              show: componentLoader.add(
                'DealerHandShow',
                join(process.cwd(), 'src/admin/components/DealerHandShow.tsx'),
              ),
            },
          },
          shuffledDeck: {
            components: {
              show: componentLoader.add(
                'ShuffledDeckShow',
                join(process.cwd(), 'src/admin/components/ShuffledDeckShow.tsx'),
              ),
            },
            isVisible: { list: false, show: true, edit: false, filter: false },
          },
        },
        actions: {
          edit: { isVisible: false, isAccessible: false },
          delete: { isVisible: false, isAccessible: false },
          new: { isVisible: false, isAccessible: false },
          list: {
            isAccessible: true,
            showFilter: false,
            component: 'BlackjackGameListResponsive',
            handler: async (request, response, context) => {
              const userIdFilter = request.query?.['filters.userId'];
              const lobbyIdFilter = request.query?.['filters.lobbyId'];
              const statusFilter = request.query?.['filters.status'];
              const isCurrentFilter = request.query?.['filters.isCurrent'];

              let gameQuery = BlackjackGame.createQueryBuilder('game');
              let hasWhere = false;

              if (userIdFilter) {
                const subQuery = BlackjackPlayer.createQueryBuilder('player')
                  .select('DISTINCT player.gameId')
                  .where('player.userId = :userId', { userId: userIdFilter });

                gameQuery = gameQuery.where(`game.id IN (${subQuery.getQuery()})`);
                gameQuery.setParameter('userId', userIdFilter);
                hasWhere = true;
              }

              if (lobbyIdFilter) {
                if (hasWhere) {
                  gameQuery = gameQuery.andWhere('game.lobbyId = :lobbyId', { lobbyId: lobbyIdFilter });
                } else {
                  gameQuery = gameQuery.where('game.lobbyId = :lobbyId', { lobbyId: lobbyIdFilter });
                  hasWhere = true;
                }
              }

              if (statusFilter) {
                if (hasWhere) {
                  gameQuery = gameQuery.andWhere('game.status = :status', { status: statusFilter });
                } else {
                  gameQuery = gameQuery.where('game.status = :status', { status: statusFilter });
                  hasWhere = true;
                }
              }

              if (isCurrentFilter !== undefined && isCurrentFilter !== null && isCurrentFilter !== '') {
                const isCurrentBool = isCurrentFilter === 'true' || isCurrentFilter === true;
                if (hasWhere) {
                  gameQuery = gameQuery.andWhere('game.isCurrent = :isCurrent', { isCurrent: isCurrentBool });
                } else {
                  gameQuery = gameQuery.where('game.isCurrent = :isCurrent', { isCurrent: isCurrentBool });
                  hasWhere = true;
                }
              }

              const sortBy = request.query?.sortBy || 'updatedAt';
              const sortOrder = request.query?.direction === 'asc' ? 'ASC' : 'DESC';
              gameQuery = gameQuery.orderBy(`game.${sortBy}`, sortOrder);

              const page = parseInt(request.query?.page || '1');
              const perPage = parseInt(request.query?.perPage || '10');
              const offset = (page - 1) * perPage;

              gameQuery = gameQuery.skip(offset).take(perPage);

              const [games, total] = await gameQuery.getManyAndCount();

              const records = games.map(game => ({
                id: game.id,
                params: {
                  id: game.id,
                  isCurrent: game.isCurrent,
                  status: game.status,
                  dealerHand: game.dealerHand,
                  dealerHandTotal: game.dealerHandTotal,
                  profitAmount: game.profitAmount,
                  wagered: game.wagered,
                  lobbyId: game.lobbyId,
                  createdAt: game.createdAt,
                  updatedAt: game.updatedAt,
                },
                populated: {},
                errors: {},
                baseError: null,
              }));

              return {
                records,
                meta: {
                  total,
                  perPage,
                  page,
                  direction: sortOrder.toLowerCase(),
                  sortBy,
                },
              };
            },
          },
          show: {
            component: 'BlackjackGameShowResponsive',
            showInDrawer: false,
            after: async response => {
              const record = response.record;

              const fullDeckArray: string[] = [];
              if (record?.params) {
                Object.keys(record.params).forEach(key => {
                  const match = key.match(/^fullDeck\.(\d+)$/);
                  if (match) {
                    const index = parseInt(match[1], 10);
                    fullDeckArray[index] = record.params[key];
                    delete record.params[key];
                  }
                });
              }

              if (record?.params?.status !== 'finished') {
                record.params.serverSeed = '';
                record.params.fairnessRandom = '';
                record.params.fullDeck = [];
              } else {
                record.params.fullDeck = fullDeckArray;
              }

              if (
                record?.params?.status === 'finished' &&
                record?.params?.serverSeed &&
                record?.params?.fairnessRandom
              ) {
                response.record.params.shuffledDeck = fullDeckArray;
              }
              return response;
            },
          },
        },
      },
    },
    {
      resource: BlackjackPlayer,
      options: {
        navigation: null,
        listProperties: ['id', 'userId', 'insured', 'playersHands'],
        showProperties: ['id', 'userId', 'insured', 'playersHands'],
        filterProperties: ['id', 'userId'],
        properties: {
          playersHands: {
            components: {
              show: componentLoader.add(
                'PlayerHandsShow',
                join(process.cwd(), 'src/admin/components/PlayerHandsShow.tsx'),
              ),
            },
            isVisible: {
              list: true,
              show: true,
              edit: false,
              filter: false,
            },
            label: 'Player Hands',
            type: 'string',
          },
        },

        actions: {
          show: {
            after: async response => {
              const record = response.record;
              if (record?.params?.id) {
                const playerId = record.params.id;
                const hands = await BlackjackHand.createQueryBuilder('hand')
                  .where('hand.playerId = :playerId', { playerId })
                  .orderBy('hand.handIndex', 'ASC')
                  .getMany();

                record.params.playersHands = hands.map(h => h.hand.join(', ')).join(' | ') || 'No hands';
              }
              return response;
            },
          },

          list: {
            isVisible: false,
            handler: async (request, response, context) => {
              const gameIdFilter = request.query?.['filters.gameId'];

              let query = BlackjackPlayer.createQueryBuilder('player').leftJoinAndSelect('player.user', 'user');

              if (gameIdFilter) {
                query = query.where('player.gameId = :gameId', { gameId: gameIdFilter });
              }

              const page = parseInt(request.query?.page || '1');
              const perPage = parseInt(request.query?.perPage || '10');
              const offset = (page - 1) * perPage;

              query = query.skip(offset).take(perPage);

              const [players, total] = await query.getManyAndCount();

              // Fetch hands for all players
              const playerIds = players.map(p => p.id);
              let handsMap = new Map<string, string[]>();

              if (playerIds.length > 0) {
                const hands = await BlackjackHand.createQueryBuilder('hand')
                  .where('hand.playerId IN (:...ids)', { ids: playerIds })
                  .orderBy('hand.playerId', 'ASC')
                  .addOrderBy('hand.handIndex', 'ASC')
                  .getMany();

                for (const h of hands) {
                  const arr = handsMap.get(h.playerId) || [];
                  arr.push(h.hand.join(', '));
                  handsMap.set(h.playerId, arr);
                }
              }

              const records = players.map(player => ({
                id: player.id,
                params: {
                  id: player.id,
                  userId: player.userId,
                  username: player.user?.username || 'Unknown',
                  insured: player.insured,
                  playersHands: (handsMap.get(player.id) || []).join(' | ') || 'No hands',
                  seatIndex: player.seatIndex,
                  payedOut: player.payedOut,
                  createdAt: player.createdAt,
                },
                populated: {},
                errors: {},
                baseError: null,
              }));

              return {
                records,
                meta: {
                  total,
                  perPage,
                  page,
                  direction: 'desc',
                  sortBy: 'createdAt',
                },
              };
            },
          },
        },
      },
    },
    {
      resource: BlackjackHand,
      options: {
        navigation: null,
        listProperties: [
          'id',
          'playerId',
          'hand',
          'handTotal',
          'payoutResult',
          'isBusted',
          'hasDoubled',
          'hasSplitted',
        ],
        showProperties: [
          'id',
          'playerId',
          'hand',
          'handTotal',
          'payoutResult',
          'isBusted',
          'hasDoubled',
          'hasSplitted',
          'hasStood',
          'handIndex',
        ],
        filterProperties: ['id', 'playerId'],
        actions: {
          list: {
            isVisible: false,
            handler: async (request, response, context) => {
              const playerIdFilter = request.query?.['filters.playerId'];

              let query = BlackjackHand.createQueryBuilder('hand');

              if (playerIdFilter) {
                query = query.where('hand.playerId = :playerId', { playerId: playerIdFilter });
              }

              query = query.orderBy('hand.handIndex', 'ASC');

              const page = parseInt(request.query?.page || '1');
              const perPage = parseInt(request.query?.perPage || '10');
              const offset = (page - 1) * perPage;

              query = query.skip(offset).take(perPage);

              const [hands, total] = await query.getManyAndCount();

              const records = hands.map(hand => ({
                id: hand.id,
                params: {
                  id: hand.id,
                  playerId: hand.playerId,
                  hand: hand.hand,
                  handTotal: hand.handTotal,
                  payoutResult: hand.payoutResult,
                  isBusted: hand.isBusted,
                  hasDoubled: hand.hasDoubled,
                  hasSplitted: hand.hasSplitted,
                  hasStood: hand.hasStood,
                  handIndex: hand.handIndex,
                  createdAt: hand.createdAt,
                },
                populated: {},
                errors: {},
                baseError: null,
              }));

              return {
                records,
                meta: {
                  total,
                  perPage,
                  page,
                  direction: 'asc',
                  sortBy: 'handIndex',
                },
              };
            },
          },
        },
      },
    },
    {
      resource: Lobby,
      options: {
        navigation: null,
        listProperties: [
          'id',
          'code',
          'isBlackjackEnabled',
          'bankroll',
          'isRouletteEnabled',
          'rouletteBankroll',
          'status',
        ],
        showProperties: [
          'id',
          'code',
          'isBlackjackEnabled',
          'bankroll',
          'minBet',
          'maxBet',
          'isRouletteEnabled',
          'rouletteBankroll',
          'rouletteMinBet',
          'rouletteMaxBet',
          'status',
          'blackjackWagered',
          'blackjackProfitAmount',
          'rouletteWagered',
          'rouletteProfitAmount',
          'isPrivate',
          'sideBets',
          'ownerId',
        ],
        editProperties: [
          'code',
          'isBlackjackEnabled',
          'bankroll',
          'minBet',
          'maxBet',
          'isRouletteEnabled',
          'rouletteBankroll',
          'rouletteMinBet',
          'rouletteMaxBet',
          'status',
          'blackjackWagered',
          'blackjackProfitAmount',
          'rouletteWagered',
          'rouletteProfitAmount',
          'isPrivate',
        ],
        filterProperties: [
          'id',
          'code',
          'isBlackjackEnabled',
          'bankroll',
          'minBet',
          'maxBet',
          'isRouletteEnabled',
          'rouletteBankroll',
          'rouletteMinBet',
          'rouletteMaxBet',
          'status',
          'blackjackWagered',
          'blackjackProfitAmount',
          'rouletteWagered',
          'rouletteProfitAmount',
          'isPrivate',
        ],
        properties: {
          status: {
            availableValues: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'paused', label: 'Paused' },
            ],
          },
          totalBankroll: {
            type: 'number',
            isSortable: true,
            isVisible: { list: false, show: false, edit: false, filter: false },
            label: 'Total Bankroll',
          },
          totalProfit: {
            type: 'number',
            isSortable: true,
            isVisible: { list: false, show: false, edit: false, filter: false },
            label: 'Total Profit',
          },
        },
        actions: {
          list: {
            isAccessible: true,
            showFilter: false,
            component: 'LobbyListResponsive',
            before: async request => {
              const sortBy = request.query?.sortBy;
              const direction = request.query?.direction || 'asc';

              if (sortBy && ['totalBankroll', 'totalProfit'].includes(sortBy)) {
                request.query['__sortBy'] = sortBy;
                request.query['__direction'] = direction;

                delete request.query.sortBy;
                delete request.query.direction;
              }

              return request;
            },
            after: async (response, request) => {
              let records = response.records;

              // Apply status filter manually if present
              const statusFilter = request.query?.['filters.status'];
              if (statusFilter && records?.length) {
                records = records.filter(record => record.params.status === statusFilter);
                response.records = records;
                response.meta.total = records.length;
              }

              if (records?.length) {
                for (const record of records) {
                  const totalBankroll = (record.params.bankroll || 0) + (record.params.rouletteBankroll || 0);

                  const totalProfit =
                    (record.params.blackjackProfitAmount || 0) + (record.params.rouletteProfitAmount || 0);

                  record.params._totalBankrollRaw = totalBankroll;
                  record.params._totalProfitRaw = totalProfit;
                }
              }

              const sortBy = request.query?.['__sortBy'];
              const direction = request.query?.['__direction'] || 'asc';

              if (sortBy && records?.length) {
                records.sort((a, b) => {
                  let aVal, bVal;

                  if (sortBy === 'totalBankroll') {
                    aVal = a.params._totalBankrollRaw || 0;
                    bVal = b.params._totalBankrollRaw || 0;
                  } else if (sortBy === 'totalProfit') {
                    aVal = a.params._totalProfitRaw || 0;
                    bVal = b.params._totalProfitRaw || 0;
                  }

                  if (direction === 'desc') {
                    return bVal - aVal;
                  }
                  return aVal - bVal;
                });

                if (response.meta) {
                  response.meta.sortBy = sortBy;
                  response.meta.direction = direction;
                }
              }

              return response;
            },
          },
        },
      },
    },
  ],
  dashboard: {
    component: 'CustomDashboard',
    handler: async () => {
      //   Total users
      const totalUsers = await User.count();

      //   All-time totals (amounts)
      const allTimeDeposits = await UserTransaction.createQueryBuilder('ut')
        .select('SUM(ut.amountUsd)', 'total')
        .where('ut.type = :type', { type: 'deposit' })
        .andWhere('ut.status = :status', { status: TransactionStatus.COMPLETED })
        .getRawOne();

      const allTimeWithdrawals = await UserTransaction.createQueryBuilder('ut')
        .select('SUM(ut.amountUsd)', 'total')
        .where('ut.type = :type', { type: 'withdraw' })
        .andWhere('ut.status = :status', { status: TransactionStatus.COMPLETED })
        .getRawOne();

      //   All-time transaction counts
      const totalTransactions = await UserTransaction.count();
      const totalDepositTransactions = await UserTransaction.count({
        where: { type: 'deposit', status: TransactionStatus.COMPLETED },
      });
      const totalWithdrawTransactions = await UserTransaction.count({
        where: { type: 'withdraw', status: TransactionStatus.COMPLETED },
      });

      //  BLACKJACK TOTAL
      const totalBlackjackGames = await BlackjackGame.count();
      const totalBlackjackCurrentGames = await BlackjackGame.count({
        where: {
          status: In([
            BlackjackGameStatus.COUNTDOWN,
            BlackjackGameStatus.DEALING,
            BlackjackGameStatus.PLAYING,
            BlackjackGameStatus.RESOLVING_BETS,
            BlackjackGameStatus.RESOLVING_USER_PAYOUTS,
            BlackjackGameStatus.DEALER_PLAYING,
          ]),
        },
      });

      const totalBlackjackWageredRaw = await BlackjackBet.createQueryBuilder('bet')
        .select('SUM(bet.amount)', 'total')
        .getRawOne();

      const totalBlackjackProfitRaw = await BlackjackBet.createQueryBuilder('bet')
        .select('SUM(bet.profitAmount)', 'total')
        .getRawOne();

      //  ROULETTE TOTAL
      const totalRouletteGames = await RouletteGame.count();
      const totalRouletteCurrentGames = await RouletteGame.count({
        where: { status: In([RouletteGameStatus.COUNTDOWN, RouletteGameStatus.PLAYING]) },
      });

      const totalRouletteWageredRaw = await RouletteBet.createQueryBuilder('bet')
        .select('SUM(bet.amount)', 'total')
        .getRawOne();

      const totalRouletteProfitRaw = await RouletteBet.createQueryBuilder('bet')
        .select('SUM(bet.profitAmount)', 'total')
        .getRawOne();

      //  LOBBY HOUSE PROFIT WITHDRAWALS
      const totalHouseProfitWithdrawalsRaw = await LobbyTransaction.createQueryBuilder('lt')
        .select('SUM(lt.amount)', 'total')
        .where('lt.type = :type', { type: LobbyTransactionType.WITHDRAW_HOUSE_PROFIT })
        .getRawOne();

      //  DATE RANGE: LAST 7 DAYS
      const now = new Date();

      const daily: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const dayStr = day.toISOString().slice(0, 10);
        daily.push({
          date: dayStr,
          deposits: 0,
          withdrawals: 0,
          transactions: 0,
          depositTransactions: 0,
          withdrawTransactions: 0,
          blackjackGames: 0,
          blackjackWagered: 0,
          blackjackProfit: 0,
          rouletteGames: 0,
          rouletteWagered: 0,
          rouletteProfit: 0,
          newUsers: 0,
          firstTimeDeposits: 0,
          houseProfitWithdrawals: 0,
        });
      }
      daily.reverse();

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);

      //  NEW USERS DAILY
      const newUsersDaily = await User.createQueryBuilder('u')
        .select(["DATE_TRUNC('day', u.createdAt) AS day", 'COUNT(*) AS count'])
        .where('u.createdAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: endOfToday })
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany();

      newUsersDaily.forEach(row => {
        const dayStr = new Date(row.day).toISOString().slice(0, 10);
        const index = daily.findIndex(d => d.date === dayStr);
        if (index >= 0) {
          daily[index].newUsers = Number(row.count);
        }
      });

      //  USER TRANSACTIONS AMOUNTS
      const transactionsAmounts = await UserTransaction.createQueryBuilder('ut')
        .select([
          "DATE_TRUNC('day', ut.createdAt) AS day",
          'ut.type AS type',
          'ut.status AS status',
          'SUM(ut.amountUsd) AS total',
        ])
        .where('ut.createdAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: endOfToday })
        .groupBy('day, ut.type, ut.status')
        .orderBy('day', 'ASC')
        .getRawMany();

      transactionsAmounts.forEach(tx => {
        const dayStr = new Date(tx.day).toISOString().slice(0, 10);
        const index = daily.findIndex(d => d.date === dayStr);
        if (index >= 0) {
          if (tx.type === 'deposit' && tx.status === TransactionStatus.COMPLETED)
            daily[index].deposits = Number(tx.total);
          if (tx.type === 'withdraw' && tx.status === TransactionStatus.COMPLETED)
            daily[index].withdrawals = Number(tx.total);
        }
      });

      //  USER TRANSACTIONS COUNTS
      const transactionsCounts = await UserTransaction.createQueryBuilder('ut')
        .select([
          "DATE_TRUNC('day', ut.createdAt) AS day",
          'ut.type AS type',
          'ut.status as status',
          'COUNT(*) AS count',
        ])
        .where('ut.createdAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: endOfToday })
        .groupBy('day, ut.type, ut.status')
        .orderBy('day', 'ASC')
        .getRawMany();

      transactionsCounts.forEach(tx => {
        const dayStr = new Date(tx.day).toISOString().slice(0, 10);
        const index = daily.findIndex(d => d.date === dayStr);
        if (index >= 0) {
          daily[index].transactions += Number(tx.count);
          if (tx.type === 'deposit' && tx.status === TransactionStatus.COMPLETED)
            daily[index].depositTransactions = Number(tx.count);
          if (tx.type === 'withdraw' && tx.status === TransactionStatus.COMPLETED)
            daily[index].withdrawTransactions = Number(tx.count);
        }
      });

      //  FIRST TIME DEPOSITS DAILY
      const firstTimeDepositsDaily = await UserTransaction.createQueryBuilder('ut')
        .select(["DATE_TRUNC('day', ut.createdAt) AS day", 'COUNT(DISTINCT ut.userId) AS count'])
        .where('ut.type = :type', { type: 'deposit' })
        .andWhere('ut.status = :status', { status: TransactionStatus.COMPLETED })
        .andWhere('ut.createdAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: endOfToday })
        .andWhere(qb => {
          const subQuery = qb
            .subQuery()
            .select('MIN(ut2.createdAt)')
            .from(UserTransaction, 'ut2')
            .where('ut2.userId = ut.userId')
            .andWhere('ut2.type = :type', { type: 'deposit' })
            .andWhere('ut2.status = :status', { status: TransactionStatus.COMPLETED })
            .getQuery();
          return `ut.createdAt = ${subQuery}`;
        })
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany();

      firstTimeDepositsDaily.forEach(row => {
        const dayStr = new Date(row.day).toISOString().slice(0, 10);
        const index = daily.findIndex(d => d.date === dayStr);
        if (index >= 0) {
          daily[index].firstTimeDeposits = Number(row.count);
        }
      });

      //  BLACKJACK DAILY
      const blackjackDaily = await BlackjackBet.createQueryBuilder('bet')
        .leftJoin('blackjack_players', 'player', 'player.id = bet.playerId')
        .leftJoin('blackjack_games', 'game', 'game.id = player.gameId')
        .select([
          "DATE_TRUNC('day', bet.createdAt) AS day",
          'COUNT(DISTINCT game.id) AS games',
          'SUM(bet.amount) AS wagered',
          'SUM(bet.profitAmount) AS profit',
        ])
        .where('bet.createdAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: endOfToday })
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany();

      blackjackDaily.forEach(row => {
        const dayStr = new Date(row.day).toISOString().slice(0, 10);
        const index = daily.findIndex(d => d.date === dayStr);
        if (index >= 0) {
          daily[index].blackjackGames = Number(row.games);
          daily[index].blackjackWagered = Number(row.wagered);
          daily[index].blackjackProfit = Number(row.profit);
        }
      });

      //  ROULETTE DAILY
      const rouletteDaily = await RouletteBet.createQueryBuilder('bet')
        .select([
          "DATE_TRUNC('day', bet.createdAt) AS day",
          'COUNT(DISTINCT bet.gameId) AS games',
          'SUM(bet.amount) AS wagered',
          'SUM(bet.profitAmount) AS profit',
        ])
        .where('bet.createdAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: endOfToday })
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany();

      rouletteDaily.forEach(row => {
        const dayStr = new Date(row.day).toISOString().slice(0, 10);
        const index = daily.findIndex(d => d.date === dayStr);
        if (index >= 0) {
          daily[index].rouletteGames = Number(row.games);
          daily[index].rouletteWagered = Number(row.wagered);
          daily[index].rouletteProfit = Number(row.profit);
        }
      });

      //  HOUSE PROFIT WITHDRAWALS DAILY
      const houseProfitWithdrawalsDaily = await LobbyTransaction.createQueryBuilder('lt')
        .select(["DATE_TRUNC('day', lt.createdAt) AS day", 'SUM(lt.amount) AS total'])
        .where('lt.type = :type', { type: LobbyTransactionType.WITHDRAW_HOUSE_PROFIT })
        .andWhere('lt.createdAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: endOfToday })
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany();

      houseProfitWithdrawalsDaily.forEach(row => {
        const dayStr = new Date(row.day).toISOString().slice(0, 10);
        const index = daily.findIndex(d => d.date === dayStr);
        if (index >= 0) {
          daily[index].houseProfitWithdrawals = Number(row.total || 0) / 100; // Convert cents to dollars
        }
      });

      //  FINAL TOTAL OBJECT
      const total = {
        userCount: totalUsers,
        allTimeDeposits: Number(allTimeDeposits.total || 0),
        allTimeWithdrawals: Number(allTimeWithdrawals.total || 0),
        totalTransactions,
        totalDepositTransactions,
        totalWithdrawTransactions,
        totalBlackjackGames,
        totalBlackjackCurrentGames,
        totalBlackjackWagered: Number(totalBlackjackWageredRaw.total || 0),
        totalBlackjackProfit: -Number(totalBlackjackProfitRaw.total || 0),
        totalRouletteGames,
        totalRouletteCurrentGames,
        totalRouletteWagered: Number(totalRouletteWageredRaw.total || 0),
        totalRouletteProfit: -Number(totalRouletteProfitRaw.total || 0),
        totalHouseProfitWithdrawals: Number(totalHouseProfitWithdrawalsRaw.total || 0) / 100, // Convert cents to dollars
      };

      return {
        total,
        daily,
      };
    },
  },
  databases: [],
};

export default options;
