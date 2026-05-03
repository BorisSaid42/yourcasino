import React from 'react';
import { Box, H3, Text } from '@adminjs/design-system';
import { ShowPropertyProps } from 'adminjs';

interface StatItemProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, highlight = false }) => {
  return (
    <Box
      flex
      flexDirection="column"
      p="lg"
      style={{
        minWidth: '200px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #2d2d2d',
        borderRadius: '8px',
      }}
    >
      <Text fontSize="sm" mb="sm" style={{ color: '#a0a0a0' }}>
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" style={{ color: highlight ? '#ffffff' : '#e0e0e0' }}>
        {value}
      </Text>
    </Box>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <Box
    mb="xl"
    style={{
      backgroundColor: '#151515',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #2d2d2d',
    }}
  >
    <Box
      mb="lg"
      style={{
        paddingBottom: '12px',
        borderBottom: '1px solid #2d2d2d',
      }}
    >
      <H3 mb="none" style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
        {title}
      </H3>
    </Box>
    <Box
      flex
      flexWrap="wrap"
      gap="default"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '16px',
      }}
    >
      {children}
    </Box>
  </Box>
);

export default function UserStatsShow(props: ShowPropertyProps) {
  const { record } = props;
  const params = record?.params || {};

  const formatValue = (value: any) => {
    if (value === undefined || value === null) return '0.00 USD';
    return value;
  };

  const formatNumber = (value: any) => {
    if (value === undefined || value === null) return '0';
    return value.toString();
  };

  const isBanned = params.bannedStatus && params.bannedStatus.includes('BANNED');

  return (
    <Box style={{ backgroundColor: '#0a0a0a', padding: '32px', minHeight: '100vh' }}>
      {isBanned && (
        <Box
          mb="xl"
          style={{
            backgroundColor: '#3d1515',
            border: '2px solid #ff4444',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <Text fontSize="lg" style={{ color: '#ffaaaa' }}>
            {params.bannedStatus}
          </Text>
        </Box>
      )}

      <Section title="Account Information">
        <StatItem label="User ID" value={params.id || 'N/A'} />
        <StatItem label="Username" value={params.username || 'N/A'} highlight />
        <StatItem label="Email" value={params.email || 'N/A'} />
        <StatItem label="Current Balance" value={formatValue(params.balance)} highlight />
      </Section>

      <Section title="User Transactions - Deposit History">
        <StatItem label="All Time Deposits" value={formatValue(params.allTimeDeposits)} />
        <StatItem label="Successful Deposits Count" value={formatNumber(params.depositCountCompleted)} highlight />
      </Section>
      <Section title="User Transactions - Withdraw History">
        <StatItem label="All Time Withdrawals" value={formatValue(params.allTimeWithdraws)} />
        <StatItem label="Successful Withdrawals Count" value={formatNumber(params.withdrawCountCompleted)} highlight />
        <StatItem label="Pending Withdrawals Count" value={formatNumber(params.withdrawCountPending)} />
        <StatItem label="Failed Withdrawals Count" value={formatNumber(params.withdrawCountFailed)} />
      </Section>

      <Section title="Overall Gaming Statistics (as Player)">
        <StatItem label="Total Profit" value={formatValue(params.totalProfit)} highlight />
        <StatItem label="Total Wagered" value={formatValue(params.totalWagered)} />
        <StatItem label="Total Bets" value={formatNumber(params.totalBets)} />
        <StatItem label="Total Games" value={formatNumber(params.totalGames)} />
      </Section>

      <Section title="Roulette Statistics (as Player)">
        <StatItem label="Roulette Profit" value={formatValue(params.totalRouletteProfit)} highlight />
        <StatItem label="Roulette Wagered" value={formatValue(params.totalRouletteWagered)} />
        <StatItem label="Roulette Bets" value={formatNumber(params.totalRouletteBets)} />
        <StatItem label="Roulette Games" value={formatNumber(params.totalRouletteGames)} />
      </Section>

      <Section title="Blackjack Statistics (as Player)">
        <StatItem label="Blackjack Profit" value={formatValue(params.totalBlackjackProfit)} highlight />
        <StatItem label="Blackjack Wagered" value={formatValue(params.totalBlackjackWagered)} />
        <StatItem label="Blackjack Bets" value={formatNumber(params.totalBlackjackBets)} />
        <StatItem label="Blackjack Games" value={formatNumber(params.totalBlackjackGames)} />
      </Section>

      {params.totalLobbiesOwned && parseInt(params.totalLobbiesOwned) > 0 ? (
        <>
          <Section title="Lobby Statistics (as Owner) - Overview">
            <StatItem label="Total Lobbies Owned" value={formatNumber(params.totalLobbiesOwned)} highlight />
            <StatItem label="Total Profit" value={formatValue(params.totalLobbyProfit)} highlight />
            <StatItem label="Total Wagered" value={formatValue(params.totalLobbyWagered)} />
          </Section>

          <Section title="Lobby Statistics (as Owner) - Blackjack">
            <StatItem label="Blackjack Profit" value={formatValue(params.totalLobbyBlackjackProfit)} highlight />
            <StatItem label="Blackjack Wagered" value={formatValue(params.totalLobbyBlackjackWagered)} />
          </Section>

          <Section title="Lobby Statistics (as Owner) - Roulette">
            <StatItem label="Roulette Profit" value={formatValue(params.totalLobbyRouletteProfit)} highlight />
            <StatItem label="Roulette Wagered" value={formatValue(params.totalLobbyRouletteWagered)} />
          </Section>
        </>
      ) : (
        <></>
      )}
    </Box>
  );
}
