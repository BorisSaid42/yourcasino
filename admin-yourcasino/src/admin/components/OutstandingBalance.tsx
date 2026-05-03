import React, { useState, useEffect } from 'react';
import { Box, H1, H3, Table, TableHead, TableBody, TableCell, TableRow, Loader } from '@adminjs/design-system';

interface OutstandingBalanceData {
  totalUserBalances: number;
  totalLobbyBankrolls: number;
  totalPausedLobbyBankrolls: number;
  totalBlackjackBankrolls: number;
  totalRouletteBankrolls: number;
  totalPausedBlackjackBankrolls: number;
  totalPausedRouletteBankrolls: number;
  overallTotal: number;
  userCount: number;
  lobbyCount: number;
  lobbyPausedCount: number;
}

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

export default function OutstandingBalance() {
  const [data, setData] = useState<OutstandingBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOutstandingBalance();
  }, []);

  const fetchOutstandingBalance = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/admin/outstanding-balance/data');
      const result = await response.json();

      if (response.ok && result.data) {
        setData(result.data);
      } else {
        setError('Failed to load outstanding balance data');
      }
    } catch (err) {
      console.error('Error fetching outstanding balance:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box variant="grey" p="xxl" display="flex" justifyContent="center" alignItems="center" height="300px">
        <Loader />
      </Box>
    );
  }

  if (error) {
    return (
      <Box variant="grey" p="xxl">
        <H1>Outstanding Balance</H1>
        <Box mt="default" style={{ color: '#e74c3c' }}>
          Error: {error}
        </Box>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box variant="grey" p="xxl">
        <H1>Outstanding Balance</H1>
        <Box mt="default">No data available</Box>
      </Box>
    );
  }

  return (
    <Box variant="grey" p="xxl">
      <H1>Outstanding Balance</H1>

      <Box mt="xl" mb="xl">
        <H3>Summary</H3>
        <Table style={{ maxWidth: '800px', marginTop: '20px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell style={{ textAlign: 'right' }}>Amount (USD)</TableCell>
              <TableCell style={{ textAlign: 'right' }}>Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Total User Balances</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '16px' }}>
                {formatCurrency(data.totalUserBalances)}
              </TableCell>
              <TableCell style={{ textAlign: 'right' }}>{data.userCount} users</TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Total Active Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '16px' }}>
                {formatCurrency(data.totalLobbyBankrolls)}
              </TableCell>
              <TableCell style={{ textAlign: 'right' }}>{data.lobbyCount} lobbies</TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Total Paused Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '16px' }}>
                {formatCurrency(data.totalPausedLobbyBankrolls)}
              </TableCell>
              <TableCell style={{ textAlign: 'right' }}>{data.lobbyPausedCount} lobbies</TableCell>
            </TableRow>
            <TableRow style={{ backgroundColor: '#b6b6b6', fontWeight: 'bold' }}>
              <TableCell style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '18px' }}>
                Total Outstanding Balance
              </TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '18px', color: '#2c3e50' }}>
                {formatCurrency(data.overallTotal)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      <Box mt="xxl" mb="xl">
        <H3>Detailed Breakdown</H3>
        <Table style={{ maxWidth: '800px', marginTop: '20px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell style={{ textAlign: 'right' }}>Amount (USD)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>User Balances</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                {formatCurrency(data.totalUserBalances)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Total Active Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatCurrency(data.totalLobbyBankrolls)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingLeft: '30px' }}>Blackjack Active Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                {formatCurrency(data.totalBlackjackBankrolls)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingLeft: '30px' }}>Roulette Active Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                {formatCurrency(data.totalRouletteBankrolls)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Total Paused Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatCurrency(data.totalPausedLobbyBankrolls)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingLeft: '30px' }}>Blackjack Paused Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                {formatCurrency(data.totalPausedBlackjackBankrolls)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingLeft: '30px' }}>Roulette Paused Lobby Bankrolls</TableCell>
              <TableCell style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                {formatCurrency(data.totalPausedRouletteBankrolls)}
              </TableCell>
            </TableRow>
            <TableRow style={{ backgroundColor: '#b6b6b6' }}>
              <TableCell style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '16px' }}>Overall Total</TableCell>
              <TableCell
                style={{
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                }}
              >
                {formatCurrency(data.overallTotal)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
