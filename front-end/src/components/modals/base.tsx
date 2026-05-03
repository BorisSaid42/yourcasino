import { ReactNode } from '@tanstack/react-router';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ModalContext } from '../../providers/modal/context';

export function ModalBase({ children }: { children: ReactNode }) {
  const { currentConfig, closeModal } = use(ModalContext);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isMouseDownInside, setIsMouseDownInside] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // const closeOnBackdrop = useCallback(
  //   (e: MouseEvent<HTMLDivElement>) => {
  //     if (e.target === e.currentTarget) {
  //       closeModal();
  //     }
  //   },
  //   [closeModal],
  // );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsMouseDownInside(false);
    } else {
      setIsMouseDownInside(true);
    }
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const isInside = e.target !== e.currentTarget;
      if (!isInside && !isMouseDownInside && currentConfig?.closable) {
        closeModal();
      }
    },
    [closeModal, isMouseDownInside, currentConfig?.closable],
  );

  useEffect(() => {
    if (currentConfig) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentConfig]);

  useEffect(() => {
    if (!currentConfig) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [currentConfig]);

  useEffect(() => {
    if (!currentConfig) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentConfig.closable) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [currentConfig, closeModal]);

  useEffect(() => {
    if (currentConfig && modalRef.current) {
      modalRef.current.focus();
    }
  }, [currentConfig]);

  if (!shouldRender) {
    return null;
  }

  const backdropClasses = clsx(
    'fixed inset-0 z-[200] flex items-center justify-center',
    'transition-all duration-300 ease-out',
    {
      'bg-[#111111]/10 opacity-100 backdrop-blur-xl': isVisible && !currentConfig?.lightBlur,
      'bg-[#111111]/10 opacity-100 backdrop-blur-[1px]': currentConfig?.lightBlur,
      'bg-[#111111]/0 opacity-0 backdrop-blur-none': !isVisible,
    },
  );

  const contentClasses = clsx(
    'relative max-h-[90vh] max-w-[90vw] overflow-auto outline-none max-md:max-w-[100vw] max-md:max-h-[100vh]',
    'transition-all duration-300 ease-out',
    {
      'translate-y-0 scale-100 opacity-100': isVisible,
      'translate-y-4 scale-95 opacity-0': !isVisible,
    },
  );

  return (
    <div
      ref={modalRef}
      className={backdropClasses}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <div className={contentClasses} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
