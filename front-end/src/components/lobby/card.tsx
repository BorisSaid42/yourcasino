import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { classNames } from '../../lib/utils';
import { useMedia } from '../../providers/media/context';
import { resourceManager } from '../../providers/resource-manager';

type CardProps = {
  value?: string;
  faceDown?: boolean;
  cardGlow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  initialOpacity?: number;
  isFacedUp?: boolean;
};

export const Card = ({
  value,
  faceDown = false,
  cardGlow = false,
  className,
  style,
  delay = 0,
  fromX = 0,
  fromY = -200,
  toX = 0,
  toY = 0,
  initialOpacity = 0,
  isFacedUp = false,
}: CardProps) => {
  const controls = useAnimation();
  const innerControls = useAnimation();
  const { isMuted } = useMedia();

  useEffect(() => {
    const sequence = async () => {
      setTimeout(() => {
        if (initialOpacity === 0) {
          resourceManager.playAudio('card-deal', { volume: isMuted ? 0 : 20, clone: true });
        }
      }, delay * 1000);

      // Entrance animation
      await controls.start({
        x: toX,
        y: toY,
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 200,
          damping: 25,
          delay,
        },
      });

      if (initialOpacity === 1) {
        resourceManager.playAudio('card-flip', { volume: isMuted ? 0 : 100, clone: true });
      }
      // Flip animation on inner wrapper
      await innerControls.start({
        rotateY: faceDown ? 180 : 0,
        transition: { duration: 0.3 },
      });
    };

    sequence();
  }, [controls, innerControls, faceDown, delay, toX, toY, initialOpacity, isMuted]);

  return (
    <motion.div
      initial={{ x: fromX, y: fromY, opacity: initialOpacity }}
      animate={controls}
      style={{
        perspective: 1000,
        width: '65px',
        height: '85px',
        ...style,
      }}
      className={classNames('absolute', className)}
    >
      <motion.div
        initial={{ rotateY: isFacedUp ? 0 : 180 }}
        animate={innerControls}
        style={{
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
        }}
        className={classNames('relative h-full w-full', cardGlow ? 'card-glow' : '')}
      >
        {/* Front of the card */}
        <img
          src={`/cards/${value}.svg`}
          alt={value}
          className="absolute top-0 left-0 h-auto w-full drop-shadow-md"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        />

        {/* Back of the card */}
        <img
          src={`/cards/back.svg`}
          alt="Face Down"
          className="absolute top-0 left-0 h-auto w-full drop-shadow-md"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        />
      </motion.div>
    </motion.div>
  );
};
