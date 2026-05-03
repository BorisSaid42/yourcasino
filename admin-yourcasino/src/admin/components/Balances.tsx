import React, { useState, useEffect } from 'react';
import {
  Box,
  H1,
  H3,
  Button,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Loader,
  Input,
  Label,
} from '@adminjs/design-system';

interface Balance {
  asset: string;
  amount: number;
  amountUsd: number;
}

function formatCurrency(value: number, decimals = 8, currency = 'SOL') {
  if (value == null) return '-';
  return (
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value) +
    ' ' +
    currency
  );
}

export default function Balances() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [hotWalletBalances, setHotWalletBalances] = useState<Balance[]>([]);
  const [coldWalletBalances, setColdWalletBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [fundEthMessage, setFundEthMessage] = useState('');
  const [usdtMessage, setUsdtMessage] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState('SOL');
  const [transferMessage, setTransferMessage] = useState('');

  useEffect(() => {
    fetchBalances();
    fetchWalletBalances();
  }, []);

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/admin/balances/data');
      const data = await response.json();

      if (response.ok && data.balances) {
        setBalances(data.balances);
      } else {
        setMessage('Error: Failed to load balances');
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      setMessage('Error: Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletBalances = async () => {
    try {
      const response = await fetch('/admin/balances/wallet-data');
      const data = await response.json();

      if (response.ok && data.hotWallet && data.coldWallet) {
        setHotWalletBalances(data.hotWallet);
        setColdWalletBalances(data.coldWallet);
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }
  };

  const handleWithdrawUsdt = async () => {
    setIsLoading(true);
    setUsdtMessage('');

    try {
      const response = await fetch('/admin/balances/withdraw-usdt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok || response.status === 207) {
        let messageText = data.message || 'USDT withdrawal successful!';

        if (data.successes && data.successes.length > 0) {
          messageText += '\n\nSuccessful transactions:\n' + data.successes.map((s: string) => `✓ ${s}`).join('\n');
        }

        if (data.errors && data.errors.length > 0) {
          messageText += '\n\nFailed transactions:\n' + data.errors.map((e: string) => `✗ ${e}`).join('\n');
        }

        setUsdtMessage(messageText);

        setTimeout(() => {
          fetchBalances();
          fetchWalletBalances();
        }, 2000);
      } else {
        let errorMessage = 'Error: ' + (data.error || 'Failed to withdraw USDT');

        if (data.details) {
          if (Array.isArray(data.details)) {
            errorMessage += '\n\nDetails:\n' + data.details.map((d: string) => `• ${d}`).join('\n');
          } else {
            errorMessage += '\n\nDetails: ' + data.details;
          }
        }

        if (data.processedCount !== undefined) {
          errorMessage += `\n\nProcessed: ${data.processedCount} transaction(s)`;
        }

        setUsdtMessage(errorMessage);
      }
    } catch (error) {
      console.error('USDT withdraw error:', error);
      setUsdtMessage('Error: Failed to connect to server. Please check your network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/admin/balances/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok || response.status === 207) {
        let messageText = data.message || 'Withdrawal request successful!';

        if (data.successes && data.successes.length > 0) {
          messageText += '\n\nSuccessful transactions:\n' + data.successes.map((s: string) => `✓ ${s}`).join('\n');
        }

        if (data.errors && data.errors.length > 0) {
          messageText += '\n\nFailed transactions:\n' + data.errors.map((e: string) => `✗ ${e}`).join('\n');
        }

        setMessage(messageText);

        setTimeout(() => {
          fetchBalances();
          fetchWalletBalances();
        }, 2000);
      } else {
        let errorMessage = 'Error: ' + (data.error || 'Failed to withdraw');

        if (data.details) {
          if (Array.isArray(data.details)) {
            errorMessage += '\n\nDetails:\n' + data.details.map((d: string) => `• ${d}`).join('\n');
          } else {
            errorMessage += '\n\nDetails: ' + data.details;
          }
        }

        if (data.processedCount !== undefined) {
          errorMessage += `\n\nProcessed: ${data.processedCount} transaction(s)`;
        }

        setMessage(errorMessage);
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      setMessage('Error: Failed to connect to server. Please check your network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundEth = async () => {
    setIsLoading(true);
    setFundEthMessage('');

    try {
      const response = await fetch('/admin/balances/fund-eth-for-usdt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        let messageText = data.message || 'ETH funding completed!';

        if (data.funded && data.funded.length > 0) {
          messageText += '\n\nFunded accounts:\n' + data.funded.map((f: string) => `✓ ${f}`).join('\n');
        }

        if (data.errors && data.errors.length > 0) {
          messageText += '\n\nFailed:\n' + data.errors.map((e: string) => `✗ ${e}`).join('\n');
        }

        setFundEthMessage(messageText);

        setTimeout(() => {
          fetchBalances();
          fetchWalletBalances();
        }, 2000);
      } else {
        setFundEthMessage('Error: ' + (data.error || 'Failed to fund ETH'));
      }
    } catch (error) {
      console.error('Fund ETH error:', error);
      setFundEthMessage('Error: Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setTransferMessage('Error: Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setTransferMessage('');

    try {
      const response = await fetch('/admin/balances/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(transferAmount),
          currency: transferCurrency,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTransferMessage('Transfer successful! ' + data.message);
        setTransferAmount('');

        fetchWalletBalances();
      } else {
        setTransferMessage('Error: ' + (data.error || 'Failed to transfer'));
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferMessage('Error: Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && balances.length === 0) {
    return (
      <Box variant="grey" p="xxl" display="flex" justifyContent="center" alignItems="center" height="300px">
        <Loader />
      </Box>
    );
  }

  return (
    <Box variant="grey" p="xxl" style={{ padding: '16px' }}>
      <H1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Wallet Balances</H1>

      <Box mt="xl" mb="xl">
        <H3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Available Assets</H3>
        <Box style={{ overflowX: 'auto', marginTop: '20px' }}>
          <Table style={{ minWidth: '300px', width: '100%', maxWidth: '600px' }}>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell style={{ textAlign: 'right' }}>Amount</TableCell>
                <TableCell style={{ textAlign: 'right' }}>Amount USD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {balances.map(balance => (
                <TableRow key={balance.asset}>
                  <TableCell style={{ fontWeight: 'bold' }}>{balance.asset}</TableCell>
                  <TableCell
                    style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                  >
                    {formatCurrency(balance.amount, balance.asset === 'USDT' ? 2 : 8, balance.asset)}
                  </TableCell>
                  <TableCell
                    style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                  >
                    {formatCurrency(balance.amountUsd, 2, 'USD')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
      <Box mt="xxl">
        <Box style={{ display: 'flex', gap: '12px', maxWidth: '50%', flexWrap: 'wrap' }}>
          <Button
            variant="default"
            onClick={handleFundEth}
            disabled={isLoading}
            style={{ flex: '1 1 auto', minWidth: '100px', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
          >
            {isLoading ? 'Processing...' : 'Fund ETH for USDT Gas'}
          </Button>
          <Button
            variant="info"
            onClick={handleWithdrawUsdt}
            disabled={isLoading}
            style={{ flex: '1 1 auto', minWidth: '100px', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
          >
            {isLoading ? 'Processing...' : 'Withdraw USDT'}
          </Button>
          <Button
            variant="primary"
            onClick={handleWithdraw}
            disabled={isLoading}
            style={{ flex: '1 1 auto', minWidth: '100px', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
          >
            {isLoading ? 'Processing...' : 'Withdraw Other Assets'}
          </Button>
        </Box>
        {message && (
          <Box
            mt="default"
            style={{
              color: message.startsWith('Error') ? '#e74c3c' : '#27ae60',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
              padding: '12px',
              backgroundColor: message.startsWith('Error') ? '#ffebee' : '#e8f5e9',
              borderRadius: '4px',
              border: `1px solid ${message.startsWith('Error') ? '#e74c3c' : '#27ae60'}`,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {message}
          </Box>
        )}
        {fundEthMessage && (
          <Box
            mt="default"
            style={{
              color: fundEthMessage.startsWith('Error') ? '#e74c3c' : '#3498db',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
              padding: '12px',
              backgroundColor: fundEthMessage.startsWith('Error') ? '#ffebee' : '#e3f2fd',
              borderRadius: '4px',
              border: `1px solid ${fundEthMessage.startsWith('Error') ? '#e74c3c' : '#3498db'}`,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {fundEthMessage}
          </Box>
        )}
        {usdtMessage && (
          <Box
            mt="default"
            style={{
              color: usdtMessage.startsWith('Error') ? '#e74c3c' : '#9b59b6',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
              padding: '12px',
              backgroundColor: usdtMessage.startsWith('Error') ? '#ffebee' : '#f3e5f5',
              borderRadius: '4px',
              border: `1px solid ${usdtMessage.startsWith('Error') ? '#e74c3c' : '#9b59b6'}`,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {usdtMessage}
          </Box>
        )}
      </Box>
      <Box
        mt="xl"
        mb="xl"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '40px',
          flexWrap: 'wrap'
        }}
        className="wallet-sections"
      >
        <style>
          {`
            @media (max-width: 768px) {
              .wallet-sections {
                flex-direction: column !important;
              }
            }
          `}
        </style>
        <Box style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <H3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Hot Wallet</H3>
          <Box style={{ overflowX: 'auto', marginTop: '20px' }}>
            <Table style={{ minWidth: '300px', width: '100%', maxWidth: '600px' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Amount</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Amount USD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hotWalletBalances.map(balance => (
                  <TableRow key={balance.asset}>
                    <TableCell style={{ fontWeight: 'bold' }}>{balance.asset}</TableCell>
                    <TableCell
                      style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                    >
                      {formatCurrency(balance.amount, balance.asset === 'USDT' ? 2 : 8, balance.asset)}
                    </TableCell>
                    <TableCell
                      style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                    >
                      {formatCurrency(balance.amountUsd, 2, 'USD')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box mt="xl">
            <H3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Transfer to Cold Wallet</H3>
            <Box mt="default" style={{ width: '100%', maxWidth: '600px' }}>
              <Box mb="default">
                <Label htmlFor="transferCurrency">Currency</Label>
                <select
                  id="transferCurrency"
                  value={transferCurrency}
                  onChange={e => setTransferCurrency(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    padding: '8px 12px',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    borderRadius: '4px',
                  }}
                >
                  {hotWalletBalances.map(balance => (
                    <option key={balance.asset} value={balance.asset}>
                      {balance.asset}
                    </option>
                  ))}
                </select>
              </Box>

              <Box mb="default">
                <Label htmlFor="transferAmount">Amount ({transferCurrency})</Label>
                <Input
                  id="transferAmount"
                  type="number"
                  value={transferAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferAmount(e.target.value)}
                  placeholder={`Enter amount to transfer`}
                  step="0.00000001"
                  min="0"
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  }}
                />
              </Box>

              <Button
                variant="primary"
                onClick={handleTransfer}
                disabled={isLoading}
                style={{ width: '100%', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                {isLoading ? 'Processing...' : 'Transfer to Cold Wallet'}
              </Button>

              {transferMessage && (
                <Box
                  mt="default"
                  style={{
                    color: transferMessage.startsWith('Error') ? '#e74c3c' : '#27ae60',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
                    padding: '12px',
                    backgroundColor: transferMessage.startsWith('Error') ? '#ffebee' : '#e8f5e9',
                    borderRadius: '4px',
                    border: `1px solid ${transferMessage.startsWith('Error') ? '#e74c3c' : '#27ae60'}`,
                    wordBreak: 'break-word',
                  }}
                >
                  {transferMessage}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Box style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <H3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Cold Wallet</H3>
          <Box style={{ overflowX: 'auto', marginTop: '20px' }}>
            <Table style={{ minWidth: '300px', width: '100%', maxWidth: '600px' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Amount</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>Amount USD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coldWalletBalances.map(balance => (
                  <TableRow key={balance.asset}>
                    <TableCell style={{ fontWeight: 'bold' }}>{balance.asset}</TableCell>
                    <TableCell
                      style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                    >
                      {formatCurrency(balance.amount, balance.asset === 'USDT' ? 2 : 8, balance.asset)}
                    </TableCell>
                    <TableCell
                      style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                    >
                      {formatCurrency(balance.amountUsd, 2, 'USD')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
