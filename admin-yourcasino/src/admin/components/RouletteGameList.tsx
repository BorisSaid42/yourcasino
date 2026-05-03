import { Badge, Box, Header, Loader, Pagination, Text } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouletteGame {
  id: string;
  isCurrent: boolean;
  status: string;
  result: number | null;
  profitAmount: number;
  wagered: number;
  lobbyId: string;
  updatedAt: string;
  createdAt: string;
}

const RouletteGameList: React.FC = () => {
  const [games, setGames] = useState<RouletteGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<{
    status?: string;
    isCurrent?: string;
    lobbyId?: string;
    userId?: string;
  }>({});
  const [lobbyIdInput, setLobbyIdInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const api = new ApiClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters: any = {};

    if (params.get('filters.status')) newFilters.status = params.get('filters.status');
    if (params.get('filters.isCurrent')) newFilters.isCurrent = params.get('filters.isCurrent');
    if (params.get('filters.lobbyId')) newFilters.lobbyId = params.get('filters.lobbyId');
    if (params.get('filters.userId')) newFilters.userId = params.get('filters.userId');

    setFilters(newFilters);
    setLobbyIdInput(params.get('filters.lobbyId') || '');
    setUserIdInput(params.get('filters.userId') || '');
    setPage(parseInt(params.get('page') || '1'));
  }, [location.search]);

  useEffect(() => {
    if (lobbyIdInput === (filters.lobbyId || '')) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);

      if (lobbyIdInput) {
        params.set('filters.lobbyId', lobbyIdInput);
      } else {
        params.delete('filters.lobbyId');
      }
      params.set('page', '1');

      navigate(`${location.pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [lobbyIdInput]);

  useEffect(() => {
    if (userIdInput === (filters.userId || '')) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);

      if (userIdInput) {
        params.set('filters.userId', userIdInput);
      } else {
        params.delete('filters.userId');
      }
      params.set('page', '1');

      navigate(`${location.pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [userIdInput]);

  useEffect(() => {
    fetchGames();
  }, [page, filters]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const query: any = {
        page,
        perPage,
        sortBy: 'updatedAt',
        direction: 'desc',
      };

      if (filters.status) query['filters.status'] = filters.status;
      if (filters.isCurrent) query['filters.isCurrent'] = filters.isCurrent;
      if (filters.lobbyId) query['filters.lobbyId'] = filters.lobbyId;
      if (filters.userId) query['filters.userId'] = filters.userId;

      const response = await api.resourceAction({
        resourceId: 'RouletteGame',
        actionName: 'list',
        params: query,
      });

      const records = response.data.records || [];
      setGames(
        records.map((r: any) => ({
          id: r.params.id,
          isCurrent: r.params.isCurrent,
          status: r.params.status,
          result: r.params.result,
          profitAmount: r.params.profitAmount,
          wagered: r.params.wagered,
          lobbyId: r.params.lobbyId,
          updatedAt: r.params.updatedAt,
          createdAt: r.params.createdAt,
        })),
      );

      setTotal(response.data.meta?.total || 0);
      setPerPage(response.data.meta?.perPage || 20);
    } catch (error) {
      console.error('Error fetching roulette games:', error);
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
    navigate(`/resources/RouletteGame/records/${id}/show`);
  };

  const statusColors: Record<string, string> = {
    waiting_bets: 'info',
    countdown: 'warning',
    playing: 'primary',
    finished: 'success',
  };

  const statusLabels: Record<string, string> = {
    waiting_bets: 'Waiting Bets',
    countdown: 'Countdown',
    playing: 'Playing',
    finished: 'Finished',
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

  const formatAmount = (amount: number) => {
    if (amount == null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Box>
      <Header.H3 mb="xl">Roulette Games</Header.H3>

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
              All Statuses
            </option>
            <option value="waiting_bets" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Waiting Bets
            </option>
            <option value="countdown" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Countdown
            </option>
            <option value="playing" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Playing
            </option>
            <option value="finished" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Finished
            </option>
          </select>
        </Box>

        <Box flex="2" maxWidth="250px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Current Game
          </Text>
          <select
            value={filters.isCurrent || ''}
            onChange={e => handleFilterChange('isCurrent', e.target.value)}
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
              All Games
            </option>
            <option value="true" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Current Only
            </option>
            <option value="false" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Not Current
            </option>
          </select>
        </Box>

        <Box flex="3" maxWidth="350px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Lobby ID
          </Text>
          <input
            type="text"
            value={lobbyIdInput}
            onChange={e => setLobbyIdInput(e.target.value)}
            placeholder="Search by lobby ID"
            style={{
              width: '100%',
              padding: '8px 0px 8px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: '#1a1a1a',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </Box>

        <Box flex="4" maxWidth="350px" style={{ marginLeft: '15px' }}>
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Player (User ID)
          </Text>
          <input
            type="text"
            value={userIdInput}
            onChange={e => setUserIdInput(e.target.value)}
            placeholder="Search by user ID"
            style={{
              width: '100%',
              padding: '8px 0px 8px 12px',
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
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Current</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Result</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Wagered</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Profit</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Lobby ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {games.map(game => (
                  <tr
                    key={game.id}
                    onClick={() => handleRowClick(game.id)}
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
                      <Badge variant={statusColors[game.status] || 'default'} size="sm">
                        {statusLabels[game.status] || game.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {game.isCurrent ? (
                        <Badge variant="success" size="sm">
                          YES
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          NO
                        </Badge>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>
                      {game.result != null ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            fontWeight: 'bold',
                          }}
                        >
                          {game.result}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{formatAmount(game.wagered)}</td>
                    <td
                      style={{
                        padding: '16px',
                        fontWeight: 500,
                        color: game.profitAmount > 0 ? '#4ade80' : game.profitAmount < 0 ? '#f87171' : 'white',
                      }}
                    >
                      {formatAmount(game.profitAmount)}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {game.lobbyId || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {formatDate(game.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Mobile Card View */}
          <Box display={['block', 'block', 'none']}>
            {games.map(game => (
              <Box
                key={game.id}
                onClick={() => handleRowClick(game.id)}
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
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="sm" flexWrap="wrap" gap="xs">
                  <Badge variant={statusColors[game.status] || 'default'} size="sm">
                    {statusLabels[game.status] || game.status}
                  </Badge>
                  {game.isCurrent ? (
                    <Badge variant="success" size="sm">
                      CURRENT
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      NOT CURRENT
                    </Badge>
                  )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb="sm">
                  <Box>
                    <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Result
                    </Text>
                    {game.result != null ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          fontWeight: 'bold',
                          fontSize: '18px',
                        }}
                      >
                        {game.result}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px' }}>-</span>
                    )}
                  </Box>

                  <Box textAlign="right">
                    <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Wagered / Profit
                    </Text>
                    <Text fontWeight="bold" fontSize="md" style={{ color: 'white' }}>
                      {formatAmount(game.wagered)}
                    </Text>
                    <Text
                      fontWeight="bold"
                      fontSize="md"
                      style={{
                        color: game.profitAmount > 0 ? '#4ade80' : game.profitAmount < 0 ? '#f87171' : 'white',
                      }}
                    >
                      {formatAmount(game.profitAmount)}
                    </Text>
                  </Box>
                </Box>

                <Box mt="sm" pt="sm" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Lobby ID
                  </Text>
                  <Text
                    fontSize="sm"
                    mb="xs"
                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'monospace', wordBreak: 'break-all' }}
                  >
                    {game.lobbyId || 'N/A'}
                  </Text>

                  <Text fontSize="xs" mt="sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Last Updated: {formatDate(game.updatedAt)}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>

          {games.length === 0 && (
            <Box textAlign="center" p="xxl">
              <Text color="grey60">No roulette games found</Text>
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

export default RouletteGameList;
