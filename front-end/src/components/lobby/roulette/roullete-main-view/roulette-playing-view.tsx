import { animate } from 'animejs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { classNames } from '../../../../lib/utils';
import { RouletteGame, RouletteGameStatus } from '../../../../queries/roulette';
import { findColorResult, rouletteMap } from '../utils';
import { RoulettePayoutResult } from '../roulette-payout-result';
import { useCredentials } from '../../../../queries/auth';
import { sockets } from '../../../../lib/interaction/sockets';
import { resourceManager } from '../../../../providers/resource-manager';
import { useMedia } from '../../../../providers/media/context';

type RoulettePlayingProps = {
  currentGame?: RouletteGame;
};

const totalNumbers = rouletteMap.length - 2;

export const RoulettePlayingView = ({ currentGame }: RoulettePlayingProps) => {
  const [isSpinActive, setIsSpinActive] = useState(false);
  const { data: credentials } = useCredentials();
  const bezier = useMemo(() => [0.165, 1, 1, 1.005], []);
  const { isMuted } = useMedia();

  const singleRotationDegree = useMemo(() => 360 / totalNumbers, []);

  const singleSpinDuration = 5000;
  const muteRef = useRef(false);

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.volume = isMuted ? 0 : 1;
      }
    });
  }, [isMuted]);

  useEffect(() => {
    muteRef.current = isMuted;
  }, [isMuted]);

  const handleSpin = useCallback(() => {
    setIsSpinActive(true);
    const spinAudio = resourceManager.playAudio('roulette-spin', {
      volume: isMuted ? 0 : 100,
      clone: true,
    });
    if (spinAudio) {
      audioRefs.current.spin = spinAudio;
    }
    setTimeout(() => {
      const fallAudio = resourceManager.playAudio('fall-into-pocket', { volume: isMuted ? 0 : 100, clone: true });
      if (fallAudio) {
        audioRefs.current.fall = fallAudio;
      }
    }, 3000);
    animate('.ball-container', {
      rotate: 0,
      duration: 0,
    });

    animate('.ball', {
      y: -60,
      duration: 0,
    });

    const fieldIndex = rouletteMap.findIndex((field) => field.value === currentGame?.result?.toString());

    animate('.ball-container', {
      rotate: Math.floor(Math.random() * 4 + 3) * 360 - (360 - fieldIndex * singleRotationDegree),
      duration: singleSpinDuration,
      ease: `cubicBezier(${bezier.join(',')})`,
    });

    animate('.ball', {
      duration: singleSpinDuration,
      ease: `cubicBezier(${bezier.join(',')})`,
      y: [
        { to: -95, duration: 1000 },
        { to: -100, duration: 1000 },
        { to: -95, duration: 1500 },
        { to: -110, duration: 1500 },
      ],
    });
  }, [bezier, currentGame?.result, isMuted, singleRotationDegree]);

  useEffect(() => {
    animate(['.wrapper-wheel'], {
      rotate: -360,
      duration: 10000,
      ease: 'linear',
      loop: true,
    });
  }, []);

  useEffect(() => {
    if (!currentGame?.status || currentGame?.status !== RouletteGameStatus.FINISHED) {
      return;
    }

    const fieldIndex = rouletteMap.findIndex((field) => field.value === currentGame?.result?.toString());

    animate('.ball-container', {
      rotate: Math.floor(Math.random() * 4 + 3) * 360 - (360 - fieldIndex * singleRotationDegree),
      duration: 0,
      ease: `cubicBezier(${bezier.join(',')})`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.status]);

  useEffect(() => {
    const onHandleBallSpin = () => {
      if (currentGame?.status !== RouletteGameStatus.PLAYING || currentGame?.result === null) return;
      setTimeout(() => handleSpin(), 200);

      setTimeout(() => {
        setIsSpinActive(false);
      }, 10000);
    };

    sockets.on('roulette:gamestart:spin', onHandleBallSpin);
    return () => {
      sockets.off('roulette:gamestart:spin', onHandleBallSpin);
    };
  }, [currentGame?.result, currentGame?.status, handleSpin]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <div className="wrapper-wheel relative h-full max-h-[300px] w-full max-w-[300px] rounded-[50%] bg-[#293E5C]">
        <div className="roulette-center absolute top-1/2 left-1/2 aspect-square min-w-[226px] -translate-1/2 bg-[url('assets/roulette/roulette-wheel-center.png')] bg-contain bg-center bg-no-repeat"></div>
        <div className="roulette-wheel absolute top-1/2 left-1/2 min-h-[300px] min-w-[300px] -translate-1/2 rounded-[50%] bg-[url('assets/roulette/roulette-fields.png')] bg-contain bg-center bg-no-repeat"></div>
        <div
          className="ball-container relative aspect-square min-w-[226px] rounded-[50%] border-0 border-blue-500"
          style={{ transform: 'rotate(0deg)' }}
        >
          <div
            className={'ball absolute top-1/2 left-1/2 -mx-[7px] h-3 w-3 rounded-[50%] bg-[#E9E9E9]'}
            style={{
              transform: 'translateY(-110px)',
              visibility: isSpinActive || currentGame?.status === RouletteGameStatus.FINISHED ? 'visible' : 'hidden',
            }}
          ></div>
        </div>
      </div>
      {currentGame && currentGame.result >= 0 && currentGame?.status === RouletteGameStatus.FINISHED && (
        <div className="absolute top-1/2 left-1/2 flex min-h-[108px] -translate-x-1/2 -translate-y-1/4 flex-col items-center justify-start gap-4">
          <div className="rounded-[5px] border border-[#253C60] bg-[#183158] p-2">
            <div
              className={classNames('flex h-10 w-10 items-center justify-center rounded-[5px] text-lg font-extrabold', {
                'bg-[#328C3C]': findColorResult(currentGame.result.toString()) === 'green',
                'bg-[#FF3C48]': findColorResult(currentGame.result.toString()) === 'red',
                'bg-[#364E71]': findColorResult(currentGame.result.toString()) === 'black',
              })}
            >
              {currentGame.result}
            </div>
          </div>
          <RoulettePayoutResult currentGame={currentGame} currentUser={credentials?.user} />
        </div>
      )}
    </div>
  );
};
