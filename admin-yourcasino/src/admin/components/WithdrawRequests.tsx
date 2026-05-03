import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  H1,
  Loader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
  Badge,
} from '@adminjs/design-system';

interface Withdrawal {
  id: string;
  amount: number;
  amountUsd: number;
  asset: string;
  userId: string;
  username: string;
  destinationAddress: string;
  createdAt: string;
  status: string;
}

function formatCurrency(value: number, decimals = 2, currency = 'USD') {
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

function formatCrypto(value: number, decimals = 6) {
  if (value == null) return '-';
  const multiplier = Math.pow(10, decimals);
  const roundedValue = Math.floor(value * multiplier) / multiplier;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(roundedValue);
}

const WithdrawRequests = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/admin/withdraw-requests/data');
      const data = await response.json();
      setWithdrawals(data.withdrawals);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      setMessage({ type: 'error', text: 'Failed to fetch withdrawal requests' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      setMessage(null);

      const response = await fetch('/admin/withdraw-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Withdrawal request approved successfully' });
        await fetchWithdrawals();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to approve withdrawal request' });
      }
    } catch (error) {
      console.error('Failed to approve withdrawal:', error);
      setMessage({ type: 'error', text: 'Failed to approve withdrawal request' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string, refund = false) => {
    try {
      setProcessingId(id);
      setMessage(null);

      const response = await fetch('/admin/withdraw-requests/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, refund }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Withdrawal request declined successfully' });
        await fetchWithdrawals();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to decline withdrawal request' });
      }
    } catch (error) {
      console.error('Failed to decline withdrawal:', error);
      setMessage({ type: 'error', text: 'Failed to decline withdrawal request' });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(id);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (isLoading && withdrawals.length === 0) {
    return (
      <Box variant="grey" p="xxl" display="flex" justifyContent="center" alignItems="center" height="300px">
        <Loader />
      </Box>
    );
  }

  return (
    <Box variant="grey" p="xxl">
      <Box mb="xxl">
        <H1>Withdrawal Requests</H1>
      </Box>

      {message && (
        <Box
          mb="xl"
          p="lg"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            border:
              message.type === 'success' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: '8px',
          }}
        >
          <Text
            style={{
              color: message.type === 'success' ? '#4caf50' : '#f44336',
              fontWeight: 500,
            }}
          >
            {message.text}
          </Text>
        </Box>
      )}

      <Box mb="lg" display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Badge
            variant="primary"
            style={{
              backgroundColor: 'rgba(33, 150, 243, 0.15)',
              color: '#2196f3',
              padding: '6px 12px',
              fontSize: '14px',
            }}
          >
            {withdrawals.length} Pending Request{withdrawals.length !== 1 ? 's' : ''}
          </Badge>
        </Box>
        <Button onClick={fetchWithdrawals} disabled={isLoading} size="sm">
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {withdrawals.length === 0 ? (
        <Box
          p="xxl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <Text opacity={0.6} fontSize="lg">
            No pending withdrawal requests
          </Text>
        </Box>
      ) : (
        <>
          {/* Desktop Table View */}
          <Box
            display={['none', 'none', 'block']}
            style={{
              width: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Table
              style={{
                tableLayout: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              <TableHead>
                <TableRow style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>Created</TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>
                    User ID
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>Asset</TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>Amount</TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>USD Value</TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Destination address
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>
                    Status
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map(withdrawal => (
                  <TableRow
                    key={withdrawal.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: processingId === withdrawal.id ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    }}
                  >
                    <TableCell>
                      <Text style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {formatDate(withdrawal.createdAt)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" alignItems="center" gap="xs">
                        <Text
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            maxWidth: 'fit-content',
                          }}
                        >
                          {withdrawal.userId}
                        </Text>
                        {withdrawal.username && (
                          <Text
                            style={{
                              fontSize: '13px',
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontWeight: 500,
                            }}
                          >
                            @{withdrawal.username}
                          </Text>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="primary"
                        style={{
                          backgroundColor: 'rgba(93, 62, 240, 0.15)',
                          color: '#5d3ef0',
                          padding: '4px 10px',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        {withdrawal.asset}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.85)' }}>
                        {formatCrypto(withdrawal.amount)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text style={{ fontSize: '14px', fontWeight: 600, color: '#4caf50' }}>
                        {formatCurrency(withdrawal.amountUsd)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      {withdrawal.destinationAddress ? (
                        <Box display="flex" alignItems="center" style={{ gap: '10px' }}>
                          <Text
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.5)',
                            }}
                            title={withdrawal.destinationAddress}
                          >
                            {`${withdrawal.destinationAddress.substring(0, 6)}...${withdrawal.destinationAddress.substring(
                              withdrawal.destinationAddress.length - 4,
                            )}`}
                          </Text>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(withdrawal.destinationAddress, withdrawal.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor:
                                copiedAddress === withdrawal.id ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              color: copiedAddress === withdrawal.id ? '#4caf50' : 'rgba(255, 255, 255, 0.7)',
                              minHeight: 'auto',
                              minWidth: '70px',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {copiedAddress === withdrawal.id ? '✓ Copied' : 'Copy'}
                          </Button>
                        </Box>
                      ) : (
                        <Text
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          N/A
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="warning"
                        style={{
                          backgroundColor: 'rgba(255, 193, 7, 0.15)',
                          color: '#ffc107',
                          padding: '4px 10px',
                          fontWeight: 600,
                          fontSize: '12px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Box flex style={{ gap: '10px' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                            style={{
                              width: '100%',
                              color: '#fff',
                              backgroundColor: processingId === withdrawal.id ? 'rgba(76, 175, 80, 0.3)' : '#4caf50',
                              border: 'none',
                              fontWeight: 600,
                              padding: '6px 14px',
                              fontSize: '13px',
                            }}
                          >
                            {processingId === withdrawal.id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDecline(withdrawal.id, true)}
                            disabled={processingId === withdrawal.id}
                            style={{
                              width: '100%',
                              color: '#fff',
                              backgroundColor: processingId === withdrawal.id ? 'rgba(244, 67, 54, 0.3)' : '#f44336',
                              border: 'none',
                              fontWeight: 600,
                              padding: '6px 14px',
                              fontSize: '13px',
                            }}
                          >
                            {processingId === withdrawal.id ? 'Processing...' : 'Decline'}
                          </Button>
                        </Box>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDecline(withdrawal.id, false)}
                          disabled={processingId === withdrawal.id}
                          style={{
                            width: '100%',
                            color: '#fff',
                            backgroundColor: processingId === withdrawal.id ? 'rgba(244, 67, 54, 0.3)' : '#f44336',
                            border: 'none',
                            fontWeight: 600,
                            padding: '6px 14px',
                            fontSize: '13px',
                          }}
                        >
                          {processingId === withdrawal.id ? 'Processing...' : 'Decline Without Refund'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Mobile Card View */}
          <Box display={['block', 'block', 'none']}>
            {withdrawals.map(withdrawal => (
              <Box
                key={withdrawal.id}
                mb="default"
                p="lg"
                style={{
                  backgroundColor:
                    processingId === withdrawal.id ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  {/* Header: Username and Status */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                        @{withdrawal.username || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {withdrawal.userId}
                      </div>
                    </div>
                    <Badge
                      variant="warning"
                      style={{
                        backgroundColor: 'rgba(255, 193, 7, 0.15)',
                        color: '#ffc107',
                        padding: '4px 10px',
                        fontWeight: 600,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {withdrawal.status}
                    </Badge>
                  </div>

                  {/* Asset and Amount */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div>
                      <Badge
                        variant="primary"
                        style={{
                          backgroundColor: 'rgba(93, 62, 240, 0.15)',
                          color: '#5d3ef0',
                          padding: '4px 10px',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        {withdrawal.asset}
                      </Badge>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '2px' }}>
                        {formatCrypto(withdrawal.amount)}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#4caf50' }}>
                        {formatCurrency(withdrawal.amountUsd)}
                      </div>
                    </div>
                  </div>

                  {/* Destination Address */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
                      Destination Address
                    </div>
                    {withdrawal.destinationAddress ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {`${withdrawal.destinationAddress.substring(0, 10)}...${withdrawal.destinationAddress.substring(
                            withdrawal.destinationAddress.length - 8,
                          )}`}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(withdrawal.destinationAddress, withdrawal.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            backgroundColor:
                              copiedAddress === withdrawal.id ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: copiedAddress === withdrawal.id ? '#4caf50' : 'rgba(255, 255, 255, 0.7)',
                            minHeight: 'auto',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {copiedAddress === withdrawal.id ? '✓' : 'Copy'}
                        </Button>
                      </div>
                    ) : (
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Created Date */}
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '16px' }}>
                    Created: {formatDate(withdrawal.createdAt)}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(withdrawal.id)}
                        disabled={processingId === withdrawal.id}
                        style={{
                          flex: 1,
                          color: '#fff',
                          backgroundColor: processingId === withdrawal.id ? 'rgba(76, 175, 80, 0.3)' : '#4caf50',
                          border: 'none',
                          fontWeight: 600,
                          padding: '10px 14px',
                          fontSize: '13px',
                        }}
                      >
                        {processingId === withdrawal.id ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDecline(withdrawal.id)}
                        disabled={processingId === withdrawal.id}
                        style={{
                          flex: 1,
                          color: '#fff',
                          backgroundColor: processingId === withdrawal.id ? 'rgba(244, 67, 54, 0.3)' : '#f44336',
                          border: 'none',
                          fontWeight: 600,
                          padding: '10px 14px',
                          fontSize: '13px',
                        }}
                      >
                        {processingId === withdrawal.id ? 'Processing...' : 'Decline'}
                      </Button>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDecline(withdrawal.id, true)}
                      disabled={processingId === withdrawal.id}
                      style={{
                        color: '#fff',
                        backgroundColor: processingId === withdrawal.id ? 'rgba(244, 67, 54, 0.3)' : '#f44336',
                        border: 'none',
                        fontWeight: 600,
                        padding: '6px 14px',
                        fontSize: '13px',
                      }}
                    >
                      {processingId === withdrawal.id ? 'Processing...' : 'Decline Without Refund'}
                    </Button>
                  </div>
                </div>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default WithdrawRequests;
