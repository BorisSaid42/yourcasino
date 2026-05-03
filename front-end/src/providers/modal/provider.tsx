import { useCallback, useMemo, useState } from 'react';
import { ModalContext, ModalKey, ModalOptions } from './context';
import { ReactNode } from '@tanstack/react-router';
import { Modals } from '../../components/modals';

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [current, setCurrent] = useState<ModalOptions<ModalKey> | null>(null);

  const open = useCallback(<TKey extends ModalKey>(options: ModalOptions<TKey>) => {
    setCurrent((prev) => (prev ? prev : options));
  }, []);

  const replace = useCallback(
    <TKey extends ModalKey, TOldKey extends ModalKey>(
      setter: (prevOptions: ModalOptions<TOldKey>) => ModalOptions<TKey>,
    ) => {
      setCurrent((prev) => (!prev ? prev : setter(prev as ModalOptions<TOldKey>)));
    },
    [],
  );

  const close = useCallback(
    (skipCallbacks = false) => {
      if (!skipCallbacks) {
        current?.onClose?.();
      }
      setCurrent(null);
    },
    [current],
  );

  const value = useMemo(
    () => ({
      currentConfig: current,
      openModal: open,
      replaceModal: replace,
      closeModal: close,
    }),
    [close, current, open, replace],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modals />
    </ModalContext.Provider>
  );
};
