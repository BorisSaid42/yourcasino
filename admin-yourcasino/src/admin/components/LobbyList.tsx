import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Badge, Text, Loader, Pagination, Header } from '@adminjs/design-system';
import { ApiClient, useTranslation } from 'adminjs';

interface Lobby {
  id: string;
  code: string;
  name: string;
  isBlackjackEnabled: boolean;
  bankroll: number;
  isRouletteEnabled: boolean;
  rouletteBankroll: number;
  status: string;
  isPrivate: boolean;
  ownerId?: string;
  blackjackWagered: number;
  blackjackProfitAmount: number;
  rouletteWagered: number;
  rouletteProfitAmount: number;
}

const LobbyList: React.FC = () => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<{
    status?: string;
    code?: string;
    isPrivate?: string;
  }>({});
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const navigate = useNavigate();
  const location = useLocation();
  const { translateMessage } = useTranslation();
  const api = new ApiClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters: any = {};

    if (params.get('filters.status')) newFilters.status = params.get('filters.status');
    if (params.get('filters.code')) newFilters.code = params.get('filters.code');
    if (params.get('filters.isPrivate')) newFilters.isPrivate = params.get('filters.isPrivate');

    setFilters(newFilters);
    setSearchInput(params.get('filters.code') || '');
    setPage(parseInt(params.get('page') || '1'));
    setSortBy(params.get('sortBy') || '');
    setSortDirection((params.get('direction') as 'asc' | 'desc') || 'asc');
  }, [location.search]);

  useEffect(() => {
    if (searchInput === (filters.code || '')) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);

      if (searchInput) {
        params.set('filters.code', searchInput);
      } else {
        params.delete('filters.code');
      }
      params.set('page', '1');

      navigate(`${location.pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchLobbies();
  }, [page, filters, sortBy, sortDirection]);

  const fetchLobbies = async () => {
    setLoading(true);
    setLobbies([]);

    try {
      const query: any = { page, perPage };

      if (filters.status) query['filters.status'] = filters.status;
      if (filters.code) query['filters.code'] = filters.code;
      if (filters.isPrivate) query['filters.isPrivate'] = filters.isPrivate;
      if (sortBy) {
        query.sortBy = sortBy;
        query.direction = sortDirection;
      }

      const response = await api.resourceAction({
        resourceId: 'Lobby',
        actionName: 'list',
        params: query,
      });

      const records = response.data.records || [];

      const mappedLobbies = records.map((r: any) => ({
        id: r.params.id,
        code: r.params.code,
        name: r.params.name,
        isBlackjackEnabled: r.params.isBlackjackEnabled,
        bankroll: r.params.bankroll,
        isRouletteEnabled: r.params.isRouletteEnabled,
        rouletteBankroll: r.params.rouletteBankroll,
        status: r.params.status,
        isPrivate: r.params.isPrivate,
        ownerId: r.params.ownerId,
        blackjackWagered: r.params.blackjackWagered,
        blackjackProfitAmount: r.params.blackjackProfitAmount,
        rouletteWagered: r.params.rouletteWagered,
        rouletteProfitAmount: r.params.rouletteProfitAmount,
      }));

      setLobbies(mappedLobbies);
      setTotal(response.data.meta?.total || 0);
      setPerPage(response.data.meta?.perPage || 20);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
      setLobbies([]);
      setTotal(0);
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
    navigate(`/resources/Lobby/records/${id}/show`);
  };

  const handleSort = (field: string) => {
    const params = new URLSearchParams(location.search);

    if (sortBy === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      params.set('direction', newDirection);
    } else {
      params.set('sortBy', field);
      params.set('direction', 'desc');
    }

    if (sortBy !== field) {
      params.set('sortBy', field);
    }

    params.set('page', '1');
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const statusColors: Record<string, string> = {
    active: 'success',
    inactive: 'danger',
    paused: 'warning',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const getTotalBankroll = (lobby: Lobby) => {
    return (lobby.bankroll || 0) + (lobby.rouletteBankroll || 0);
  };

  const getTotalProfit = (lobby: Lobby) => {
    return (lobby.blackjackProfitAmount || 0) + (lobby.rouletteProfitAmount || 0);
  };

  return (
    <Box>
      <Header.H3 mb="xl">Lobbies</Header.H3>

      {/* Filters */}
      <Box mb="xl" display="flex" flexDirection={['column', 'column', 'row']} style={{ gap: '5px' }} flexWrap="wrap">
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
            <option value="active" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Active
            </option>
            <option value="inactive" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Inactive
            </option>
            <option value="paused" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Paused
            </option>
          </select>
        </Box>

        <Box flex="1" maxWidth="250px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Visibility
          </Text>
          <select
            value={filters.isPrivate || ''}
            onChange={e => handleFilterChange('isPrivate', e.target.value)}
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
            <option value="true" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Private
            </option>
            <option value="false" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Public
            </option>
          </select>
        </Box>

        <Box flex="1" maxWidth="350px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Lobby Code
          </Text>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by lobby code"
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
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Code</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Games</th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('totalBankroll')}
                  >
                    Bankroll {sortBy === 'totalBankroll' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort('totalProfit')}
                  >
                    Profit {sortBy === 'totalProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {lobbies.map(lobby => (
                  <tr
                    key={lobby.id}
                    onClick={() => handleRowClick(lobby.id)}
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
                      <Text fontWeight="bold">{lobby.code}</Text>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Box display="flex" style={{ gap: '5px' }} flexWrap="wrap">
                        {lobby.isBlackjackEnabled && (
                          <Badge variant="primary" size="sm">
                            Blackjack
                          </Badge>
                        )}
                        {lobby.isRouletteEnabled && (
                          <Badge variant="secondary" size="sm">
                            Roulette
                          </Badge>
                        )}
                      </Box>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{formatCurrency(getTotalBankroll(lobby))}</td>
                    <td
                      style={{
                        padding: '16px',
                        fontWeight: 500,
                        color: getTotalProfit(lobby) >= 0 ? '#4ade80' : '#f87171',
                      }}
                    >
                      {formatCurrency(getTotalProfit(lobby))}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge variant={statusColors[lobby.status] || 'default'} size="sm">
                        {lobby.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge variant={lobby.isPrivate ? 'info' : 'default'} size="sm">
                        {lobby.isPrivate ? 'Private' : 'Public'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Mobile Card View */}
          <Box display={['block', 'block', 'none']}>
            {lobbies.map(lobby => (
              <Box
                key={lobby.id}
                onClick={() => handleRowClick(lobby.id)}
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
                {/* Header Row */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="sm">
                  <Text fontWeight="bold" fontSize="lg" style={{ color: 'white' }}>
                    {lobby.code}
                  </Text>
                  <Badge variant={statusColors[lobby.status] || 'default'} size="sm">
                    {lobby.status}
                  </Badge>
                </Box>

                {/* Games & Type Row */}
                <Box display="flex" style={{ gap: '5px' }} mb="default" flexWrap="wrap">
                  {lobby.isBlackjackEnabled && (
                    <Badge variant="primary" size="sm">
                      Blackjack
                    </Badge>
                  )}
                  {lobby.isRouletteEnabled && (
                    <Badge variant="secondary" size="sm">
                      Roulette
                    </Badge>
                  )}
                  <Badge variant={lobby.isPrivate ? 'info' : 'default'} size="sm">
                    {lobby.isPrivate ? 'Private' : 'Public'}
                  </Badge>
                </Box>

                {/* Stats Grid */}
                <Box
                  display="grid"
                  style={{
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <Box>
                    <Text fontSize="xs" mb="xxs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Total Bankroll
                    </Text>
                    <Text fontWeight="bold" fontSize="sm" style={{ color: 'white' }}>
                      {formatCurrency(getTotalBankroll(lobby))}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" mb="xxs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Total Profit
                    </Text>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      style={{ color: getTotalProfit(lobby) >= 0 ? '#4ade80' : '#f87171' }}
                    >
                      {formatCurrency(getTotalProfit(lobby))}
                    </Text>
                  </Box>
                </Box>

                {/* Additional Stats */}
                {(lobby.isBlackjackEnabled || lobby.isRouletteEnabled) && (
                  <Box
                    mt="default"
                    pt="default"
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Box
                      display="grid"
                      style={{
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                      }}
                    >
                      {lobby.isBlackjackEnabled && (
                        <Box>
                          <Text fontSize="xs" mb="xxs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            BJ Bankroll
                          </Text>
                          <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {formatCurrency(lobby.bankroll)}
                          </Text>
                        </Box>
                      )}
                      {lobby.isRouletteEnabled && (
                        <Box>
                          <Text fontSize="xs" mb="xxs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            RLT Bankroll
                          </Text>
                          <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {formatCurrency(lobby.rouletteBankroll)}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          {lobbies.length === 0 && (
            <Box textAlign="center" p="xxl">
              <Text color="grey60">No lobbies found</Text>
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

export default LobbyList;
