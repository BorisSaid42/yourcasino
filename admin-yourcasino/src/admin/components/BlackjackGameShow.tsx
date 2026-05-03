import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Badge, Text, Loader, Header, Button } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

interface BlackjackBet {
  id: string;
  betPlace: string;
  amount: number;
  wonAmount: number;
  profitAmount: number;
  insurance: boolean;
  handId: string;
  createdAt: string;
}

interface BlackjackHand {
  id: string;
  hand: string[];
  handTotal: number;
  hasStood: boolean;
  isBusted: boolean;
  hasDoubled: boolean;
  hasSplitted: boolean;
  handIndex: number;
  payoutResult: string | null;
  bets: BlackjackBet[];
}

interface BlackjackPlayer {
  id: string;
  userId: string;
  username: string;
  seatIndex: number;
  insured: boolean;
  payedOut: boolean;
  hands: BlackjackHand[];
  sideBets: BlackjackBet[];
  createdAt: string;
}

interface BlackjackGameDetails {
  id: string;
  isCurrent: boolean;
  status: string;
  dealerHand: string[];
  dealerHandTotal: number;
  profitAmount: number;
  wagered: number;
  lobbyId: string;
  serverSeed: string | null;
  fairnessRandom: string | null;
  deck: string[];
  shuffledDeck: string[];
  payedOut: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlackjackGameShowProps {
  record?: any;
  resource?: any;
}

const BlackjackGameShow: React.FC<BlackjackGameShowProps> = ({ record }) => {
  const navigate = useNavigate();
  const api = new ApiClient();
  const id = record?.params?.id;

  const [players, setPlayers] = useState<BlackjackPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  const reconstructArray = (params: any, prefix: string): string[] => {
    const result: string[] = [];
    let index = 0;

    while (params[`${prefix}.${index}`] !== undefined) {
      result.push(params[`${prefix}.${index}`]);
      index++;
    }

    if (result.length === 0 && Array.isArray(params[prefix])) {
      return params[prefix];
    }

    return result;
  };

  const game: BlackjackGameDetails | null = record
    ? {
        id: record.params.id,
        isCurrent: record.params.isCurrent,
        status: record.params.status,
        dealerHand: reconstructArray(record.params, 'dealerHand'),
        dealerHandTotal: record.params.dealerHandTotal,
        profitAmount: record.params.profitAmount,
        wagered: record.params.wagered,
        lobbyId: record.params.lobbyId,
        serverSeed: record.params.serverSeed,
        fairnessRandom: record.params.fairnessRandom,
        deck: reconstructArray(record.params, 'deck'),
        shuffledDeck: reconstructArray(record.params, 'shuffledDeck'),
        payedOut: record.params.payedOut || false,
        createdAt: record.params.createdAt,
        updatedAt: record.params.updatedAt,
      }
    : null;

  useEffect(() => {
    if (id) {
      fetchGamePlayers();
    }
  }, [id]);

  const fetchGamePlayers = async () => {
    setPlayersLoading(true);
    try {
      const playersResponse = await api.resourceAction({
        resourceId: 'BlackjackPlayer',
        actionName: 'list',
        params: {
          'filters.gameId': id,
          perPage: 1000,
        },
      });

      const playerRecords = playersResponse.data.records || [];

      const playersWithData = await Promise.all(
        playerRecords.map(async (playerRecord: any) => {
          const playerId = playerRecord.params.id;

          const handsResponse = await api.resourceAction({
            resourceId: 'BlackjackHand',
            actionName: 'list',
            params: {
              'filters.playerId': playerId,
              perPage: 1000,
            },
          });

          const handRecords = handsResponse.data.records || [];

          const betsResponse = await api.resourceAction({
            resourceId: 'BlackjackBet',
            actionName: 'list',
            params: {
              'filters.playerId': playerId,
              perPage: 1000,
            },
          });

          const betRecords = betsResponse.data.records || [];

          const betsByType: Record<string, BlackjackBet> = {};
          const betsByHandId: Record<string, BlackjackBet[]> = {};

          betRecords.forEach((betRecord: any) => {
            const bet: BlackjackBet = {
              id: betRecord.params.id,
              betPlace: betRecord.params.betPlace,
              amount: betRecord.params.amount,
              wonAmount: betRecord.params.wonAmount,
              profitAmount: betRecord.params.profitAmount,
              insurance: betRecord.params.insurance,
              handId: betRecord.params.handId,
              createdAt: betRecord.params.createdAt,
            };

            const handId = betRecord.params.handId;
            const betPlace = betRecord.params.betPlace;

            if (!betsByType[betPlace]) {
              betsByType[betPlace] = bet;
            } else {
              betsByType[betPlace].amount += bet.amount;
              betsByType[betPlace].wonAmount += bet.wonAmount;
              betsByType[betPlace].profitAmount += bet.profitAmount;
            }

            if (handId) {
              if (!betsByHandId[handId]) {
                betsByHandId[handId] = [];
              }
              betsByHandId[handId].push(bet);
            }
          });

          const allPlayerBets = Object.values(betsByType).sort((a, b) => a.betPlace.localeCompare(b.betPlace));

          const hands: BlackjackHand[] = handRecords.map((handRecord: any) => {
            const handCards = reconstructArray(handRecord.params, 'hand');

            return {
              id: handRecord.params.id,
              hand: handCards,
              handTotal: handRecord.params.handTotal,
              hasStood: handRecord.params.hasStood,
              isBusted: handRecord.params.isBusted,
              hasDoubled: handRecord.params.hasDoubled,
              hasSplitted: handRecord.params.hasSplitted,
              handIndex: handRecord.params.handIndex,
              payoutResult: handRecord.params.payoutResult,
              bets: betsByHandId[handRecord.params.id] || [],
            };
          });

          return {
            id: playerId,
            userId: playerRecord.params.userId,
            username: playerRecord.params.username || 'Unknown',
            seatIndex: playerRecord.params.seatIndex,
            insured: playerRecord.params.insured,
            payedOut: playerRecord.params.payedOut,
            hands: hands.sort((a, b) => a.handIndex - b.handIndex),
            sideBets: allPlayerBets,
            createdAt: playerRecord.params.createdAt,
          };
        }),
      );

      setPlayers(playersWithData.sort((a, b) => a.seatIndex - b.seatIndex));
    } catch (error) {
      console.error('Error fetching game players:', error);
    } finally {
      setPlayersLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    waiting_bets: 'info',
    playing: 'primary',
    finished: 'success',
  };

  const statusLabels: Record<string, string> = {
    waiting_bets: 'Waiting Bets',
    playing: 'Playing',
    finished: 'Finished',
  };

  const payoutResultColors: Record<string, string> = {
    win: 'success',
    lose: 'danger',
    push: 'default',
    blackjack: 'success',
  };

  const payoutResultLabels: Record<string, string> = {
    win: 'WIN',
    lose: 'LOSE',
    push: 'PUSH',
    blackjack: 'BLACKJACK',
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

  const renderCard = (card: string) => {
    const suit = card.slice(-1);
    const value = card.slice(0, -1);
    const suitSymbols: Record<string, string> = {
      H: '♥',
      D: '♦',
      C: '♣',
      S: '♠',
    };
    const isRed = suit === 'H' || suit === 'D';

    return (
      <span
        key={card}
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          margin: '0 2px',
          backgroundColor: 'white',
          color: isRed ? '#ef4444' : '#1f2937',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '14px',
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {value}
        {suitSymbols[suit]}
      </span>
    );
  };

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
        <Header.H3>Blackjack Game Details</Header.H3>
        <Button onClick={() => navigate('/resources/BlackjackGame')} variant="text">
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
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Game ID
            </Text>
            <Text fontWeight="bold" style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
              {game.id}
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Status
            </Text>
            <Badge variant={statusColors[game.status] || 'default'} size="sm">
              {statusLabels[game.status] || game.status}
            </Badge>
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
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
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Dealer Hand Total
            </Text>
            <Box display="flex" style={{ gap: '8px' }} alignItems="center">
              <Text fontWeight="bold" fontSize="lg">
                {game.dealerHandTotal || 0}
              </Text>
              {game.dealerHandTotal === 21 && game.dealerHand.length === 2 && (
                <Badge variant="success" size="sm">
                  BJ
                </Badge>
              )}
              {game.dealerHandTotal > 21 && (
                <Badge variant="danger" size="sm">
                  BUST
                </Badge>
              )}
            </Box>
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Dealer Cards Count
            </Text>
            <Text fontWeight="bold" fontSize="lg">
              {game.dealerHand?.length || 0} cards
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Total Wagered
            </Text>
            <Text fontWeight="bold" fontSize="lg">
              {formatAmount(game.wagered)}
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
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
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Payout Status
            </Text>
            {game.payedOut ? (
              <Badge variant="success" size="sm">
                PAID OUT
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                PENDING
              </Badge>
            )}
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Lobby ID
            </Text>
            <Text fontWeight="bold" style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
              {game.lobbyId || 'N/A'}
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Created At
            </Text>
            <Text fontSize="md">{formatDate(game.createdAt)}</Text>
          </Box>

          <Box>
            <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Last Updated
            </Text>
            <Text fontSize="md">{formatDate(game.updatedAt)}</Text>
          </Box>
        </Box>

        {/* Fairness Data - Only show if game is finished */}
        {game.status === 'finished' && (game.serverSeed || game.fairnessRandom) && (
          <Box mt="xl" pt="xl" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Header.H6 mb="default">Provably Fair Data</Header.H6>

            {game.serverSeed && (
              <Box mb="default">
                <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
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
                <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
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
        {/* Deck Information */}
        {game.shuffledDeck.length > 0 && (
          <Box mt="xl" pt="xl" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Header.H6 mb="default">Deck Information</Header.H6>

            <Box
              display="grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
              mb="default"
            >
              {game.shuffledDeck.length > 0 && (
                <Box>
                  <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Full Deck Size
                  </Text>
                  <Text fontWeight="bold" fontSize="lg">
                    {game.shuffledDeck.length} cards
                  </Text>
                </Box>
              )}

              {game.shuffledDeck.length > 0 && game.deck.length > 0 && (
                <Box>
                  <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Cards Used
                  </Text>
                  <Text fontWeight="bold" fontSize="lg">
                    {game.shuffledDeck.length - game.deck.length} cards
                  </Text>
                </Box>
              )}
            </Box>

            {/* Full Deck Display */}
            {game.shuffledDeck.length > 0 && (
              <Box mb="default">
                <Text fontSize="md" fontWeight="bold" mb="sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Full Shuffled Deck (All {game.shuffledDeck.length} Cards)
                </Text>
                <Box
                  p="default"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    maxHeight: '250px',
                    overflowY: 'auto',
                  }}
                >
                  <Box display="flex" flexWrap="wrap" style={{ gap: '5px' }}>
                    {game.shuffledDeck.map((card, idx) => (
                      <Box key={`full-${idx}`} display="flex" flexDirection="column" alignItems="center">
                        {renderCard(card)}
                        <Text fontSize="md" style={{ color: 'rgba(255, 255, 255, 0.3)', marginTop: '2px' }}>
                          #{idx + 1}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Dealer Hand */}
        {game.dealerHand && game.dealerHand.length > 0 && (
          <Box mt="xl" pt="xl" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box mb="default" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Header.H6 mb="xs">Dealer Hand</Header.H6>
              <Box display="flex" style={{ gap: '8px' }} alignItems="center">
                <Text fontSize="xl" fontWeight="bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total: {game.dealerHandTotal}
                </Text>
                {game.dealerHandTotal === 21 && game.dealerHand.length === 2 && (
                  <Badge variant="success" size="sm">
                    BLACKJACK
                  </Badge>
                )}
                {game.dealerHandTotal > 21 && (
                  <Badge variant="danger" size="sm">
                    BUST
                  </Badge>
                )}
              </Box>
            </Box>
            <Box
              p="default"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box display="flex" flexWrap="wrap" style={{ gap: '8px' }}>
                {game.dealerHand.map((card, idx) => (
                  <Box
                    key={`${card}-${idx}`}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    style={{ gap: '5px' }}
                  >
                    {renderCard(card)}
                    <Text fontSize="md" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                      Card {idx + 1}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Players Section */}
      <Box>
        <Header.H5 mb="lg">Players ({players.length})</Header.H5>

        {playersLoading ? (
          <Box display="flex" justifyContent="center" p="xl">
            <Loader />
          </Box>
        ) : players.length === 0 ? (
          <Box
            p="xl"
            textAlign="center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
            }}
          >
            <Text color="grey60">No players in this game</Text>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" style={{ gap: '10px' }}>
            {players.map(player => {
              const totalWagered = player.sideBets.reduce((sum, bet) => sum + bet.amount, 0);
              const totalWon = player.sideBets.reduce((sum, bet) => sum + bet.wonAmount, 0);
              const totalProfit = player.sideBets.reduce((sum, bet) => sum + bet.profitAmount, 0);

              return (
                <Box
                  key={player.id}
                  p="lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {/* Player Header */}
                  <Box
                    mb="default"
                    pb="default"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb="xs">
                        {player.username} (Seat {player.seatIndex + 1})
                      </Text>
                      <Text fontSize="md" style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>
                        User ID: {player.userId}
                      </Text>
                    </Box>
                    <Box display="flex" style={{ gap: '8px' }} alignItems="center">
                      {player.insured && (
                        <Badge variant="info" size="sm">
                          INSURED
                        </Badge>
                      )}
                      {player.payedOut && (
                        <Badge variant="success" size="sm">
                          PAID OUT
                        </Badge>
                      )}
                    </Box>
                  </Box>

                  {/* Player Summary */}
                  <Box
                    mb="default"
                    pb="default"
                    display="grid"
                    style={{
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Box>
                      <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Total Wagered
                      </Text>
                      <Text fontWeight="bold">{formatAmount(totalWagered)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Total Won
                      </Text>
                      <Text fontWeight="bold">{formatAmount(totalWon)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Net Result
                      </Text>
                      <Text
                        fontWeight="bold"
                        style={{
                          color: totalProfit > 0 ? '#4ade80' : totalProfit < 0 ? '#f87171' : 'white',
                        }}
                      >
                        {formatAmount(totalProfit)}
                      </Text>
                    </Box>
                  </Box>

                  {/* All Bets (Main, Side 21+3, Perfect Pair) */}
                  {player.sideBets.length > 0 && (
                    <Box mb="default" pb="default" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Text fontSize="md" fontWeight="bold" mb="sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Bets
                      </Text>
                      <Box display="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        {player.sideBets.map(bet => (
                          <Box
                            key={bet.id}
                            p="default"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <Box mb="xs" display="flex" justifyContent="space-between" alignItems="center">
                              <Badge variant={bet.betPlace === 'main' ? 'primary' : 'secondary'} size="sm">
                                {bet.betPlace === 'main'
                                  ? 'MAIN BET'
                                  : bet.betPlace === 'side_21_3'
                                    ? 'SIDE 21+3'
                                    : 'PERFECT PAIR'}
                              </Badge>
                              {bet.insurance && (
                                <Badge variant="warning" size="sm">
                                  INSURANCE
                                </Badge>
                              )}
                            </Box>
                            <Box display="flex" flexDirection="column" style={{ gap: '4px' }}>
                              <Box display="flex" justifyContent="space-between">
                                <Text fontSize="sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                  Bet:
                                </Text>
                                <Text fontSize="md" fontWeight="bold">
                                  {formatAmount(bet.amount)}
                                </Text>
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Text fontSize="sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                  Won:
                                </Text>
                                <Text fontSize="md" fontWeight="bold">
                                  {formatAmount(bet.wonAmount)}
                                </Text>
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Text fontSize="sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                  P/L:
                                </Text>
                                <Text
                                  fontSize="md"
                                  fontWeight="bold"
                                  style={{
                                    color:
                                      bet.profitAmount > 0 ? '#4ade80' : bet.profitAmount < 0 ? '#f87171' : 'white',
                                  }}
                                >
                                  {formatAmount(bet.profitAmount)}
                                </Text>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Player Hands */}
                  <Box>
                    <Text fontSize="md" fontWeight="bold" mb="sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Hands ({player.hands.length})
                    </Text>

                    {player.hands.map((hand, idx) => (
                      <Box
                        key={hand.id}
                        mb="default"
                        p="default"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Box mb="sm" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                          <Text fontSize="md" fontWeight="bold">
                            Hand {hand.handIndex + 1}
                          </Text>
                          <Box display="flex" style={{ gap: '5px' }} flexWrap="wrap">
                            {hand.payoutResult && (
                              <Badge variant={payoutResultColors[hand.payoutResult] || 'default'} size="sm">
                                {payoutResultLabels[hand.payoutResult] || hand.payoutResult.toUpperCase()}
                              </Badge>
                            )}
                            {hand.isBusted && (
                              <Badge variant="danger" size="sm">
                                BUSTED
                              </Badge>
                            )}
                            {hand.hasStood && (
                              <Badge variant="default" size="sm">
                                STOOD
                              </Badge>
                            )}
                            {hand.hasDoubled && (
                              <Badge variant="info" size="sm">
                                DOUBLED
                              </Badge>
                            )}
                            {hand.hasSplitted && (
                              <Badge variant="info" size="sm">
                                SPLIT
                              </Badge>
                            )}
                          </Box>
                        </Box>

                        {/* Hand Cards */}
                        <Box mb="sm">
                          <Text fontSize="md" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Cards (Total: {hand.handTotal})
                          </Text>
                          <Box display="flex" flexWrap="wrap" style={{ gap: '5px' }}>
                            {hand.hand.map(card => renderCard(card))}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BlackjackGameShow;
