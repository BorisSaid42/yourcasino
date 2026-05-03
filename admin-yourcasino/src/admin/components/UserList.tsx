import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Badge, Text, Loader, Pagination, Header } from '@adminjs/design-system';
import { ApiClient, useTranslation } from 'adminjs';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  bannedStatus: string;
  totalProfit: string;
  totalWagered: string;
  totalBets: number;
  totalGames: number;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<{
    username?: string;
    email?: string;
  }>({});
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email'>('username');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const navigate = useNavigate();
  const location = useLocation();
  const { translateMessage } = useTranslation();
  const api = new ApiClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters: any = {};

    if (params.get('filters.username')) newFilters.username = params.get('filters.username');
    if (params.get('filters.email')) newFilters.email = params.get('filters.email');

    setFilters(newFilters);

    if (params.get('filters.username')) {
      const usernameSearch = params.get('filters.username') || '';
      setSearchInput(usernameSearch);
      setSearchType('username');
    } else if (params.get('filters.email')) {
      const emailSearch = params.get('filters.email') || '';
      setSearchInput(emailSearch);
      setSearchType('email');
    }

    setPage(parseInt(params.get('page') || '1'));
    setSortBy(params.get('sortBy') || '');
    setSortDirection((params.get('direction') as 'asc' | 'desc') || 'asc');
  }, [location.search]);

  useEffect(() => {
    if (searchInput === (filters[searchType] || '')) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);

      params.delete('filters.username');
      params.delete('filters.email');

      if (searchInput) {
        params.set(`filters.${searchType}`, searchInput);
      }
      params.set('page', '1');

      navigate(`${location.pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, searchType]);

  useEffect(() => {
    fetchUsers();
  }, [page, filters, sortBy, sortDirection]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query: any = { page, perPage };

      if (filters.username) query['filters.username'] = filters.username;
      if (filters.email) query['filters.email'] = filters.email;
      if (sortBy) {
        query.sortBy = sortBy;
        query.direction = sortDirection;
      }

      const response = await api.resourceAction({
        resourceId: 'User',
        actionName: 'list',
        params: query,
      });

      const records = response.data.records || [];
      setUsers(
        records.map((r: any) => ({
          id: r.params.id,
          username: r.params.username,
          email: r.params.email,
          balance: r.params.balance,
          bannedStatus: r.params.bannedStatus || '✓ Active',
          totalProfit: r.params.totalProfit,
          totalWagered: r.params.totalWagered,
          totalBets: r.params.totalBets,
          totalGames: r.params.totalGames,
        })),
      );

      setTotal(response.data.meta?.total || 0);
      setPerPage(response.data.meta?.perPage || 20);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTypeChange = (type: 'username' | 'email') => {
    setSearchType(type);
    setSearchInput('');
    const params = new URLSearchParams(location.search);
    params.delete('filters.username');
    params.delete('filters.email');
    params.set('page', '1');
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage.toString());
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleSort = (field: string) => {
    const params = new URLSearchParams(location.search);
    let newDirection: 'asc' | 'desc' = 'asc';

    if (sortBy === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    params.set('sortBy', field);
    params.set('direction', newDirection);
    params.set('page', '1'); // Reset to first page when sorting
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleRowClick = (id: string) => {
    navigate(`/resources/User/records/${id}/show`);
  };

  const formatBalance = (balance: number) => {
    return `${balance?.toFixed(2) || '0.00'} USD`;
  };

  return (
    <Box>
      <Header.H3 mb="xl">Users</Header.H3>

      {/* Filters */}
      <Box mb="xl" display="flex" flexDirection={['column', 'column', 'row']} style={{ gap: '5px' }} flexWrap="wrap">
        <Box flex="1" maxWidth="250px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            Search By
          </Text>
          <select
            value={searchType}
            onChange={e => handleSearchTypeChange(e.target.value as 'username' | 'email')}
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
            <option value="username" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Username
            </option>
            <option value="email" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              Email
            </option>
          </select>
        </Box>

        <Box flex="2" maxWidth="400px">
          <Text mb="sm" fontSize="sm" fontWeight="medium">
            {searchType === 'username' ? 'Username' : 'Email'}
          </Text>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={`Search by ${searchType}`}
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
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Username</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                  <th
                    onClick={() => handleSort('balance')}
                    style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Balance{getSortIcon('balance')}
                  </th>
                  <th
                    onClick={() => handleSort('totalProfit')}
                    style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Total Profit{getSortIcon('totalProfit')}
                  </th>
                  <th
                    onClick={() => handleSort('totalWagered')}
                    style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Total Wagered{getSortIcon('totalWagered')}
                  </th>
                  <th
                    onClick={() => handleSort('totalBets')}
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Bets{getSortIcon('totalBets')}
                  </th>
                  <th
                    onClick={() => handleSort('totalGames')}
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Games{getSortIcon('totalGames')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => handleRowClick(user.id)}
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
                    <td style={{ padding: '16px', fontWeight: 500 }}>{user.username}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {user.email}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: user.bannedStatus?.includes('BANNED') ? '#ff6b6b' : '#51cf66'
                    }}>
                      {user.bannedStatus}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>
                      {formatBalance(user.balance)}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: user.totalProfit?.includes('-') ? '#ff6b6b' : '#51cf66',
                      }}
                    >
                      {user.totalProfit}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      {user.totalWagered}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>{user.totalBets}</td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>{user.totalGames}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Mobile Card View */}
          <Box display={['block', 'block', 'none']}>
            {users.map(user => (
              <Box
                key={user.id}
                onClick={() => handleRowClick(user.id)}
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
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'white' }}>
                      {user.username}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: user.bannedStatus?.includes('BANNED') ? 'rgba(255, 68, 68, 0.15)' : 'rgba(81, 207, 102, 0.15)',
                      color: user.bannedStatus?.includes('BANNED') ? '#ff6b6b' : '#51cf66',
                      border: `1px solid ${user.bannedStatus?.includes('BANNED') ? '#ff6b6b' : '#51cf66'}`,
                    }}>
                      {user.bannedStatus}
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', marginBottom: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {user.email}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Balance</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>
                      {formatBalance(user.balance)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Total Profit</div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: user.totalProfit?.includes('-') ? '#ff6b6b' : '#51cf66',
                      }}
                    >
                      {user.totalProfit}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Total Wagered</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>{user.totalWagered}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '12px' }}>
                    <div style={{ flex: '1' }}>
                      <div style={{ fontSize: '12px', marginBottom: '4px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        Bets
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>{user.totalBets}</div>
                    </div>
                    <div style={{ flex: '1' }}>
                      <div style={{ fontSize: '12px', marginBottom: '4px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        Games
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>{user.totalGames}</div>
                    </div>
                  </div>
                </div>
              </Box>
            ))}
          </Box>

          {users.length === 0 && (
            <Box textAlign="center" p="xxl">
              <Text color="grey60">No users found</Text>
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

export default UserList;
