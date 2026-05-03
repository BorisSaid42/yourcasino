export const maxWinExceedsBlackjackBankroll = (bankroll?: number, maxBet?: number): boolean => {
  if (!bankroll || !maxBet) return false;
  const maxWin = maxBet * 36;

  if (maxWin > bankroll) {
    return true;
  }

  return false;
};
