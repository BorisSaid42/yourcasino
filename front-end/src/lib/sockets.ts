import { sockets } from './interaction/sockets';

const lastJoinMap: { [key: string]: number } = {};

export const socketJoinLeaveEmit = (key: string, handleJoin: () => void, handleLeave?: () => void): (() => void) => {
  sockets.on('connect', () => {
    if (!handleLeave || Date.now() - (lastJoinMap[key] ?? 0) > 100) {
      handleJoin();
      lastJoinMap[key] = Date.now();
    }
  }); // handle reconnects
  // sockets.on('disconnect', handleLeave); // handle reconnects

  if (!handleLeave || Date.now() - (lastJoinMap[key] ?? 0) > 100) {
    handleJoin();
    lastJoinMap[key] = Date.now();
  }

  return () => {
    if (!handleLeave || Date.now() - (lastJoinMap[key] ?? 0) > 100) {
      handleLeave?.();
    }

    sockets.off('connect', () => {
      handleJoin();
    }); // handle reconnects
    // sockets.off('disconnect', handleLeave); // handle reconnects
  };
};
