import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Badge, Text, Loader, Header, Button } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

interface RouletteBet {
  id: string;
  betPlace: string;
  amount: number;
  wonAmount: number;
  profitAmount: number;
  userId: string;
  username: string;
  createdAt: string;
}

interface RouletteGameDetails {
  id: string;
  isCurrent: boolean;
  status: string;
  result: number | null;
  profitAmount: number;
  wagered: number;
  lobbyId: string;
  serverSeed: string | null;
  fairnessRandom: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RouletteGameShowProps {
  record?: any;
  resource?: any;
}

const RouletteGameShow: React.FC<RouletteGameShowProps> = ({ record }) => {
  const navigate = useNavigate();
  const api = new ApiClient();
  const id = record?.params?.id;

  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [betsLoading, setBetsLoading] = useState(true);

  const game: RouletteGameDetails | null = record
    ? {
        id: record.params.id,
        isCurrent: record.params.isCurrent,
        status: record.params.status,
        result: record.params.result,
        profitAmount: record.params.profitAmount,
        wagered: record.params.wagered,
        lobbyId: record.params.lobbyId,
        serverSeed: record.params.serverSeed,
        fairnessRandom: record.params.fairnessRandom,
        createdAt: record.params.createdAt,
        updatedAt: record.params.updatedAt,
      }
    : null;

  useEffect(() => {
    if (id) {
      fetchGameBets();
    }
  }, [id]);

  const fetchGameBets = async () => {
    setBetsLoading(true);
    try {
      const response = await api.resourceAction({
        resourceId: 'RouletteBet',
        actionName: 'list',
        params: {
          'filters.gameId': id,
          perPage: 1000,
        },
      });

      const records = response.data.records || [];

      const gameBets = records.filter((r: any) => r.params.gameId === id);

      setBets(
        gameBets.map((r: any) => ({
          id: r.params.id,
          betPlace: r.params.betPlace,
          amount: r.params.amount,
          wonAmount: r.params.wonAmount,
          profitAmount: r.params.profitAmount,
          userId: r.params.userId,
          username: r.params.username || 'Unknown',
          createdAt: r.params.createdAt,
        })),
      );
    } catch (error) {
      console.error('Error fetching game bets:', error);
    } finally {
      setBetsLoading(false);
    }
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
      second: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    if (amount == null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const groupBetsByPlayer = () => {
    const playerMap = new Map<
      string,
      {
        userId: string;
        username: string;
        totalBet: number;
        totalWon: number;
        totalProfit: number;
        bets: RouletteBet[];
        betsByPlace: Map<string, RouletteBet[]>;
      }
    >();

    bets.forEach(bet => {
      if (!playerMap.has(bet.userId)) {
        playerMap.set(bet.userId, {
          userId: bet.userId,
          username: bet.username,
          totalBet: 0,
          totalWon: 0,
          totalProfit: 0,
          bets: [],
          betsByPlace: new Map(),
        });
      }

      const player = playerMap.get(bet.userId)!;
      player.totalBet += bet.amount;
      player.totalWon += bet.wonAmount;
      player.totalProfit += bet.profitAmount;
      player.bets.push(bet);

      if (!player.betsByPlace.has(bet.betPlace)) {
        player.betsByPlace.set(bet.betPlace, []);
      }
      player.betsByPlace.get(bet.betPlace)!.push(bet);
    });

    return Array.from(playerMap.values());
  };

  const playerGroups = groupBetsByPlayer();

  if (!game || !id) {
    return (
      <Box p="xxl">
        <Text>Game not found</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb="xl" display="flex" alignItems="center" justifyContent="space-between">
        <Header.H3>Roulette Game Details</Header.H3>
        <Button onClick={() => navigate('/resources/RouletteGame')} variant="text">
          ← Back to List
        </Button>
      </Box>

      {/* Game Information */}
      <Box
        mb="xl"
        p="xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Header.H5 mb="lg">Game Information</Header.H5>

        <Box display="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Game ID
            </Text>
            <Text fontWeight="bold" style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
              {game.id}
            </Text>
          </Box>

          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Status
            </Text>
            <Badge variant={statusColors[game.status] || 'default'} size="sm">
              {statusLabels[game.status] || game.status}
            </Badge>
          </Box>

          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Current Game
            </Text>
            {game.isCurrent ? (
              <Badge variant="success" size="sm">
                YES
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                NO
              </Badge>
            )}
          </Box>

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
              <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }}>No result yet</Text>
            )}
          </Box>

          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Total Wagered
            </Text>
            <Text fontWeight="bold" fontSize="lg">
              {formatAmount(game.wagered)}
            </Text>
          </Box>

          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              House Profit
            </Text>
            <Text
              fontWeight="bold"
              fontSize="lg"
              style={{
                color: game.profitAmount > 0 ? '#4ade80' : game.profitAmount < 0 ? '#f87171' : 'white',
              }}
            >
              {formatAmount(game.profitAmount)}
            </Text>
          </Box>

          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Lobby ID
            </Text>
            <Text fontWeight="bold" style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
              {game.lobbyId || 'N/A'}
            </Text>
          </Box>

          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Created At
            </Text>
            <Text fontSize="sm">{formatDate(game.createdAt)}</Text>
          </Box>

          <Box>
            <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Last Updated
            </Text>
            <Text fontSize="sm">{formatDate(game.updatedAt)}</Text>
          </Box>
        </Box>

        {/* Fairness Data - Only show if game is finished */}
        {game.status === 'finished' && (game.serverSeed || game.fairnessRandom) && (
          <Box mt="xl" pt="xl" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Header.H6 mb="default">Provably Fair Data</Header.H6>

            {game.serverSeed && (
              <Box mb="default">
                <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Server Seed
                </Text>
                <Text
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  {game.serverSeed}
                </Text>
              </Box>
            )}

            {game.fairnessRandom && (
              <Box>
                <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Random.org String
                </Text>
                <Text
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  {game.fairnessRandom}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Player Bets Section */}
      <Box>
        <Header.H5 mb="lg">
          Player Bets ({playerGroups.length} {playerGroups.length === 1 ? 'Player' : 'Players'}, {bets.length}{' '}
          {bets.length === 1 ? 'Bet' : 'Bets'})
        </Header.H5>

        {betsLoading ? (
          <Box display="flex" justifyContent="center" p="xl">
            <Loader />
          </Box>
        ) : bets.length === 0 ? (
          <Box
            p="xl"
            textAlign="center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
            }}
          >
            <Text color="grey60">No bets placed on this game</Text>
          </Box>
        ) : (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {playerGroups.map(player => (
              <Box
                key={player.userId}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}
              >
                {/* Player Header */}
                <Box
                  p="lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap">
                    <Box mb={['default', 'default', 'none']}>
                      <Text fontSize="sm" fontWeight="bold" mb="xs">
                        {player.username}
                      </Text>
                      <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>
                        {player.userId}
                      </Text>
                    </Box>

                    <Box display="flex" style={{ gap: '24px' }} flexWrap="wrap">
                      <Box>
                        <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Total Bet
                        </Text>
                        <Text fontSize="lg" fontWeight="bold">
                          {formatAmount(player.totalBet)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Total Won
                        </Text>
                        <Text fontSize="lg" fontWeight="bold">
                          {formatAmount(player.totalWon)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Net Profit
                        </Text>
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          style={{
                            color: player.totalProfit > 0 ? '#4ade80' : player.totalProfit < 0 ? '#f87171' : 'white',
                          }}
                        >
                          {formatAmount(player.totalProfit)}
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Bets Grouped by Bet Place - Card Grid */}
                <Box
                  p="lg"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {Array.from(player.betsByPlace.entries()).map(([betPlace, placeBets]) => {
                    const totalPlaceBet = placeBets.reduce((sum, bet) => sum + bet.amount, 0);
                    const totalPlaceWon = placeBets.reduce((sum, bet) => sum + bet.wonAmount, 0);
                    const totalPlaceProfit = placeBets.reduce((sum, bet) => sum + bet.profitAmount, 0);

                    return (
                      <Box
                        key={betPlace}
                        p="default"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {/* Bet Place Badge */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Badge variant="info" size="sm">
                            {betPlace}
                          </Badge>
                          <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            ×{placeBets.length}
                          </Text>
                        </Box>

                        {/* Stats */}
                        <Box>
                          <Box mb="xs">
                            <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              Total Bet
                            </Text>
                            <Text fontSize="sm" fontWeight="bold">
                              {formatAmount(totalPlaceBet)}
                            </Text>
                          </Box>

                          <Box mb="xs">
                            <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              Total Won
                            </Text>
                            <Text fontSize="sm" fontWeight="bold">
                              {formatAmount(totalPlaceWon)}
                            </Text>
                          </Box>

                          <Box>
                            <Text fontSize="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              Profit/Loss
                            </Text>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              style={{
                                color: totalPlaceProfit > 0 ? '#4ade80' : totalPlaceProfit < 0 ? '#f87171' : 'white',
                              }}
                            >
                              {totalPlaceProfit >= 0 ? '+' : ''}
                              {formatAmount(totalPlaceProfit)}
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RouletteGameShow;
