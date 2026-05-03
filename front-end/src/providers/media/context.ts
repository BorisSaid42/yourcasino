import { createContext, useContext } from 'react';

export interface IMediaContextType {
  isMuted: boolean;
  handleIsMuted: () => void;
}

const defaultMediaContext = {
  isMuted: false,
  handleIsMuted: () => {},
};

export const MediaContext = createContext<IMediaContextType>(defaultMediaContext);

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return ctx;
}
