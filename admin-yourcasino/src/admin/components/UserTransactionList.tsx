import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Badge, Text, Loader, Pagination, Header } from '@adminjs/design-system';
import { ApiClient, useTranslation } from 'adminjs';
import AmountUSDList from './AmountUSDList.js';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  amountUsd: number;
  asset: string;
  username: string;
  status: string;
  externalStatus?: string;
  externalSubStatus?: string;
  updatedAt: string;
}

const UserTransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<{
    type?: string;
    status?: string;
    userId?: string;
  }>({});
  const [searchInput, setSearchInput] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { translateMessage } = useTranslation();
  const api = new ApiClient();

  // Parse URL query parameters for filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters: any = {};

    if (params.get('filters.type')) newFilters.type = params.get('filters.type');
    if (params.get('filters.status')) newFilters.status = params.get('filters.status');
    if (params.get('filters.userId')) newFilters.userId = params.get('filters.userId');

    setFilters(newFilters);
    setSearchInput(params.get('filters.userId') || '');
    setPage(parseInt(params.get('page') || '1'));
  }, [location.search]);

  // Debounce search input
  useEffect(() => {
    // Skip if searchInput matches current filter (to prevent infinite loop)
    if (searchInput === (filters.userId || '')) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);

      if (searchInput) {
        params.set('filters.userId', searchInput);
      } else {
        params.delete('filters.userId');
      }
      params.set('page', '1');

      navigate(`${location.pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const query: any = { page, perPage };

      if (filters.type) query['filters.type'] = filters.type;
      if (filters.status) query['filters.status'] = filters.status;
      if (filters.userId) query['filters.userId'] = filters.userId;

      const response = await api.resourceAction({
        resourceId: 'UserTransaction',
        actionName: 'list',
        params: query,
      });

      const records = response.data.records || [];
      setTransactions(
        records.map((r: any) => ({
          id: r.params.id,
          type: r.params.type,
          amount: r.params.amount,
          amountUsd: r.params.amountUsd,
          asset: r.params.asset,
          username: r.params.username,
          status: r.params.status,
          externalStatus: r.params.externalStatus,
          externalSubStatus: r.params.externalSubStatus,
          updatedAt: r.params.updatedAt,
        })),
      );

      setTotal(response.data.meta?.total || 0);
      setPerPage(response.data.meta?.perPage || 20);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    const params = new URLSearchParams(location.search);

    if (value) {
      params.set(`filters.${filterName}`, value);
    } else {
      params.delete(`filters.${filterName}`);
    }
    params.set('page', '1');

    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage.toString());
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleRowClick = (id: string) => {
    navigate(`/resources/UserTransaction/records/${id}/show`);
  };

  const statusColors: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    requested: 'info',
    approved: 'primary',
    declined: 'danger',
    declined_without_refund: 'danger',
    cancelled: 'default',
  };

  const typeColors: Record<string, string> = {
    deposit: 'primary',
    withdraw: 'secondary',
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, asset: string) => {
    return `${amount?.toFixed(6) || '0.000000'} ${asset || ''}`;
  };

  const formatUSDAmount = (amount: number) => {
    return `${amount?.toFixed(2) || '0.00'} USD`;
  };

  return (
    <Box>
      <Header.H3 mb="xl">User Transactions</Header.H3>

      {/* Filters */}
      <Box mb="xl" display="flex" flexDirection={['column', 'column', 'row']} style={{ gap: '5px' }} flexWrap="wrap">
        <Box flex="1" maxWidth="250px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Type
          </Text>
          <select
            value={filters.type || ''}
            onChange={e => handleFilterChange('type', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: '#1a1a1a',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              All
            </option>
            <option value="deposit" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Deposit
            </option>
            <option value="withdraw" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Withdraw
            </option>
          </select>
        </Box>

        <Box flex="1" maxWidth="250px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Status
          </Text>
          <select
            value={filters.status || ''}
            onChange={e => handleFilterChange('status', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: '#1a1a1a',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              All
            </option>
            <option value="pending" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Pending
            </option>
            <option value="completed" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Completed
            </option>
            <option value="failed" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Failed
            </option>
            <option value="requested" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Requested
            </option>
            <option value="approved" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Approved
            </option>
            <option value="declined" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Declined
            </option>
            <option value="declined_without_refund" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Declined Without Refund
            </option>
            <option value="cancelled" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Cancelled
            </option>
          </select>
        </Box>

        <Box flex="1" maxWidth="400px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            User ID / Username
          </Text>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by user ID or username"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: '#1a1a1a',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p="xxl">
          <Loader />
        </Box>
      ) : (
        <>
          {/* Desktop Table View */}
          <Box
            display={['none', 'none', 'block']}
            style={{
              overflowX: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Amount USD</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => handleRowClick(tx.id)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <Badge variant={typeColors[tx.type] || 'default'} size="sm">
                        {tx.type?.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{formatAmount(tx.amount, tx.asset)}</td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{formatUSDAmount(tx.amountUsd)}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {tx.username}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge variant={statusColors[tx.status] || 'default'} size="sm">
                        {tx.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {formatDate(tx.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Mobile Card View */}
          <Box display={['block', 'block', 'none']}>
            {transactions.map(tx => (
              <Box
                key={tx.id}
                onClick={() => handleRowClick(tx.id)}
                mb="default"
                p="lg"
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="sm">
                  <Badge variant={typeColors[tx.type] || 'default'} size="sm">
                    {tx.type?.toUpperCase()}
                  </Badge>
                  <Badge variant={statusColors[tx.status] || 'default'} size="sm">
                    {tx.status}
                  </Badge>
                </Box>

                <Text fontWeight="bold" fontSize="lg" mb="sm" style={{ color: 'white' }}>
                  {formatAmount(tx.amount, tx.asset)}
                </Text>

                <Text fontSize="sm" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {tx.username}
                </Text>

                <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {formatDate(tx.updatedAt)}
                </Text>
              </Box>
            ))}
          </Box>

          {transactions.length === 0 && (
            <Box textAlign="center" p="xxl">
              <Text color="grey60">No transactions found</Text>
            </Box>
          )}

          {/* Pagination */}
          {total > perPage && (
            <Box mt="xl" display="flex" justifyContent="center">
              <Pagination page={page} perPage={perPage} total={total} onChange={handlePageChange} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default UserTransactionList;
