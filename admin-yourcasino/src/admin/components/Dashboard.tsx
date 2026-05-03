import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableBody, TableCell, TableRow, Box, H1, H3, Loader } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

function formatCurrency(value: number, decimals = 2, currency = 'USD') {
  if (value == null) return '-';
  return (
    new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value) +
    ' ' +
    currency
  );
}

export default function CustomDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getDashboard().then(({ data }) => {
      console.log('data', data);
      setStats(data);
    });
  }, []);

  if (!stats) {
    return (
      <Box variant="grey" p="xxl" display="flex" justifyContent="center" alignItems="center" height="300px">
        <Loader />
      </Box>
    );
  }

  return (
    <Box variant="grey" p="xxl">
      <H1>Welcome to the YOURCASINO Admin Panel</H1>

      <Box flex flexWrap="wrap" style={{ gap: '40px' }}>
        <Box flex="1 1 400px" minWidth="300px">
          <H3>Overall statistics</H3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Total Users</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{stats.total.userCount}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Wagered</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  {formatCurrency(stats.total.totalRouletteWagered + stats.total.totalBlackjackWagered)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Lobby Profit</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  {formatCurrency(stats.total.totalRouletteProfit + stats.total.totalBlackjackProfit)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Games Played</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  {stats.total.totalBlackjackGames + stats.total.totalRouletteGames}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Box flex="1 1 400px" minWidth="300px">
          <H3>Transaction Statistics</H3>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Count</TableCell>
                <TableCell style={{ textAlign: 'right' }}>Amount (USD)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Total Transactions</TableCell>
                <TableCell>{stats.total.totalTransactions}</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Deposit Transactions</TableCell>
                <TableCell>{stats.total.totalDepositTransactions}</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{formatCurrency(stats.total.allTimeDeposits)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Withdraw Transactions</TableCell>
                <TableCell>{stats.total.totalWithdrawTransactions}</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{formatCurrency(stats.total.allTimeWithdrawals)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>House Profit Withdrawals (Lobby)</TableCell>
                <TableCell></TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  {formatCurrency(stats.total.totalHouseProfitWithdrawals)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box mt="xxl" mb="xl" flex flexWrap="wrap" style={{ gap: '40px' }}>
        <Box flex="1 1 400px" minWidth="300px">
          <H3>Blackjack Statistics</H3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Total Games Played</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{stats.total.totalBlackjackGames}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Current Active Games</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{stats.total.totalBlackjackCurrentGames}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Wagered</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  {formatCurrency(stats.total.totalBlackjackWagered)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Lobby Profit</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{formatCurrency(stats.total.totalBlackjackProfit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Box flex="1 1 400px" minWidth="300px">
          <H3>Roulette Statistics</H3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Total Games Played</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{stats.total.totalRouletteGames}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Current Active Games</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{stats.total.totalRouletteCurrentGames}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Wagered</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{formatCurrency(stats.total.totalRouletteWagered)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Lobby Profit</TableCell>
                <TableCell style={{ textAlign: 'right' }}>{formatCurrency(stats.total.totalRouletteProfit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box style={{ overflowX: 'auto' }}>
        <H3>Daily statistics - Last 7 days</H3>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date (YYYY-MM-DD)</TableCell>
              <TableCell>New Users</TableCell>
              <TableCell>First Time Deposits</TableCell>
              <TableCell>House Profit Withdrawals</TableCell>
              <TableCell>Total Transactions</TableCell>
              <TableCell>Deposit Transactions</TableCell>
              <TableCell>Withdraw Transactions</TableCell>
              <TableCell>Deposits (USD)</TableCell>
              <TableCell>Withdrawals (USD)</TableCell>
              <TableCell>Blackjack games</TableCell>
              <TableCell>Blackjack Wagered (USD)</TableCell>
              <TableCell>Blackjack Profit (USD)</TableCell>
              <TableCell>Roulette games</TableCell>
              <TableCell>Roulette Wagered (USD)</TableCell>
              <TableCell>Roulette Profit (USD)</TableCell>
              <TableCell>Profit by day</TableCell>
              <TableCell>Wagered by day</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.daily.map((row: any) => (
              <TableRow key={row.date}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.newUsers}</TableCell>
                <TableCell>{row.firstTimeDeposits}</TableCell>
                <TableCell>{formatCurrency(row.houseProfitWithdrawals)}</TableCell>
                <TableCell>{row.transactions}</TableCell>
                <TableCell>{row.depositTransactions}</TableCell>
                <TableCell>{row.withdrawTransactions}</TableCell>
                <TableCell>{formatCurrency(row.deposits)}</TableCell>
                <TableCell>{formatCurrency(row.withdrawals)}</TableCell>
                <TableCell>{row.blackjackGames}</TableCell>
                <TableCell>{formatCurrency(row.blackjackWagered)}</TableCell>
                <TableCell>{formatCurrency(row.blackjackProfit)}</TableCell>
                <TableCell>{row.rouletteGames}</TableCell>
                <TableCell>{formatCurrency(row.rouletteWagered)}</TableCell>
                <TableCell>{formatCurrency(row.rouletteProfit)}</TableCell>
                <TableCell>{formatCurrency(row.rouletteProfit + row.blackjackProfit)}</TableCell>
                <TableCell>{formatCurrency(row.rouletteWagered + row.blackjackWagered)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
