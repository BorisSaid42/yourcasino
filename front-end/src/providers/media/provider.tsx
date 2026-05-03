import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { MediaContext } from './context';

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const isMuted = localStorage.getItem('isMuted');

    if (isMuted === 'true') {
      setIsMuted(true);
    }
  }, []);

  const handleIsMuted = useCallback(() => {
    localStorage.setItem('isMuted', 'true');
    setIsMuted((prevState) => {
      localStorage.setItem('isMuted', (!prevState).toString());
      return !prevState;
    });
  }, []);

  const value = useMemo(
    () => ({
      isMuted,
      handleIsMuted,
    }),
    [handleIsMuted, isMuted],
  );

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
};
