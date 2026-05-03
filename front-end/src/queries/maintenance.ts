import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../lib/interaction/api';

export type MaintenanceStatus = {
  isInMaintenance: boolean;
  isPaused: boolean;
  isBlackjackPaused: boolean;
  isRoulettePaused: boolean;
};

export type RouletteGameBet = {
  id: string;
  userId: string;
  username: string;
  amount: number;
  wonAmount: number;
  betPlace: string;
};

export const qo_getMaintenanceStatus = <T = MaintenanceStatus>(select?: (overview: MaintenanceStatus) => T) =>
  queryOptions<MaintenanceStatus, Error, T>({
    queryKey: ['maintenance', 'status'],
    queryFn: async () => {
      return api.get<MaintenanceStatus, MaintenanceStatus>('/maintenance/status');
    },
    select,
  });

export const useMaintenanceStatus = () => {
  return useQuery(qo_getMaintenanceStatus());
};

export const useIsInMaintenance = () =>
  useQuery(qo_getMaintenanceStatus((maintenanceStatus) => maintenanceStatus.isInMaintenance));
export const useIsPaused = () => useQuery(qo_getMaintenanceStatus((maintenanceStatus) => maintenanceStatus.isPaused));
export const useIsBlackjackPaused = () =>
  useQuery(
    qo_getMaintenanceStatus((maintenanceStatus) => maintenanceStatus.isBlackjackPaused || maintenanceStatus.isPaused),
  );
export const useIsRoulettePaused = () =>
  useQuery(
    qo_getMaintenanceStatus((maintenanceStatus) => maintenanceStatus.isRoulettePaused || maintenanceStatus.isPaused),
  );
