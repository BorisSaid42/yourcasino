import { useStore } from '@tanstack/react-form';
import { use, useCallback, useEffect, useRef } from 'react';
import { usePrevious } from 'react-use';
import { z } from 'zod';
import aceIcon from '../../assets/icons/common/ace-icon.svg';
import crossIcon from '../../assets/icons/common/cross-icon.svg';
import dollarIcon from '../../assets/icons/common/dollar-icon.svg';
import pauseIcon from '../../assets/icons/common/pause-icon-light-blue.svg';
import playIcon from '../../assets/icons/common/play-icon.svg';
import createLobbyIcon from '../../assets/icons/lobby/create-lobby-icon.svg';
import rouletteIcon from '../../assets/roulette/roulette-icon-blue.svg';
import { classNames } from '../../lib/utils';
import { ModalContext, ModalProps } from '../../providers/modal/context';
import { SocketLockContext } from '../../providers/socket-locks/context';
import { useCredentials } from '../../queries/auth';
import {
  LobbyGame,
  LobbyState,
  useActivateLobby,
  useLobbyDataById,
  usePauseLobby,
  useUpdateLobby,
} from '../../queries/lobby';
import { useUser } from '../../queries/user';
import { GenericButton } from '../common/buttons';
import { InfoTooltip } from '../common/info-tooltip';
import { useAppForm } from '../form/provider';
import { BlackjackGameStatus, useCurrentGame } from '../../queries/blackjack';
import { useQueryClient } from '@tanstack/react-query';

const blackjackSchema = z
  .object({
    minBet: z.coerce
      .number({ invalid_type_error: 'Min bet is required' })
      .min(0.5, 'Min Bet must be greater than or equal to 0.5')
      .max(5000, 'Min Bet must be less than or equal to 5000'),
    maxBet: z.coerce.number({ invalid_type_error: 'Max bet is required' }),
  })
  .refine((data) => data.minBet <= data.maxBet, {
    path: ['maxBet'],
    message: 'maxBet must be greater than or equal to minBet',
  });

const rouletteSchema = z
  .object({
    rouletteMinBet: z.coerce.number({ invalid_type_error: 'Min bet is required' }),
    rouletteMaxBet: z.coerce.number({ invalid_type_error: 'Max bet is required' }),
  })
  .refine((data) => data.rouletteMinBet <= data.rouletteMaxBet, {
    path: ['rouletteMaxBet'],
    message: 'rouletteMaxBet must be greater than or equal to rouletteMinBet',
  });

const lobbySchema = z
  .object({
    isPrivate: z.boolean(),
    sideBets: z.boolean(),
    isRouletteSelected: z.boolean(),
    isBlackjackSelected: z.boolean(),
    status: z.nativeEnum(LobbyState),

    // optional at the root
    minBet: z.coerce.number(),
    maxBet: z.coerce.number(),
    rouletteMinBet: z.coerce.number(),
    rouletteMaxBet: z.coerce.number(),
    bankroll: z.coerce.number(),
    rouletteBankroll: z.coerce.number(),
  })
  .superRefine((data, ctx) => {
    if (data.isBlackjackSelected) {
      const parsed = blackjackSchema.safeParse(data);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: issue.path }));
      }
    }

    if (data.isRouletteSelected) {
      const parsed = rouletteSchema.safeParse(data);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: issue.path }));
      }
    }
  });

export const EditLobbyModal = ({ lobbyId, game, choice, currentValues }: ModalProps<'edit-lobby'>) => {
  const { closeModal, replaceModal } = use(ModalContext);
  const { data: lobby } = useLobbyDataById(lobbyId);
  const updateLobby = useUpdateLobby(lobbyId);
  const { data: credentials } = useCredentials();
  const pauseLobby = usePauseLobby();
  const { data: user } = useUser();
  const activateLobby = useActivateLobby();

  const queryClient = useQueryClient();

  const { data: currentGame } = useCurrentGame(lobbyId);

  const isCancelDisabledRef = useRef(
    currentGame
      ? [BlackjackGameStatus.PLAYING, BlackjackGameStatus.DEALER_PLAYING].includes(currentGame.status)
        ? true
        : false
      : false,
  );

  useEffect(() => {
    let timeout = null;
    if (currentGame) {
      if (
        [BlackjackGameStatus.PLAYING, BlackjackGameStatus.DEALER_PLAYING].includes(currentGame.status) &&
        !isCancelDisabledRef.current
      ) {
        isCancelDisabledRef.current = true;
      } else if (
        ![BlackjackGameStatus.PLAYING, BlackjackGameStatus.DEALER_PLAYING].includes(currentGame.status) &&
        isCancelDisabledRef.current
      ) {
        timeout = setTimeout(() => {
          isCancelDisabledRef.current = false;
        }, 2000);
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [currentGame]);

  const { isLocked, setLock } = use(SocketLockContext);

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      setLock('lobby-edit', true);
      await updateLobby.mutateAsync(
        {
          minBet: value.isBlackjackSelected ? value.minBet : undefined,
          maxBet: value.isBlackjackSelected ? value.maxBet : undefined,
          rouletteMinBet: value.isRouletteSelected ? value.rouletteMinBet : undefined,
          rouletteMaxBet: value.isRouletteSelected ? value.rouletteMaxBet : undefined,
          isPrivate: value.isPrivate,
          sideBets: value.sideBets,
          isBlackjackSelected: value.isBlackjackSelected,
          isRouletteSelected: value.isRouletteSelected,
          bankroll: value.isBlackjackSelected ? value.bankroll : undefined,
          rouletteBankroll: value.isRouletteSelected ? value.rouletteBankroll : undefined,
          status: value.status,
        },
        {
          onError: () => {
            setLock('lobby-edit', false);
          },
        },
      );

      setLock('lobby-edit', false);
      handleCloseModal();
    },
    validators: {
      onSubmit: lobbySchema,
    },
    defaultValues: currentValues ?? {
      bankroll: lobby?.bankroll ?? 0,
      rouletteBankroll: lobby?.rouletteBankroll ?? 0,
      minBet: !lobby?.isBlackjackEnabled ? 0 : lobby?.minBet,
      maxBet: !lobby?.isBlackjackEnabled ? 0 : lobby?.maxBet,
      rouletteMinBet: !lobby?.isRouletteEnabled ? 0 : lobby?.rouletteMinBet,
      rouletteMaxBet: !lobby?.isRouletteEnabled ? 0 : lobby?.rouletteMaxBet,
      isPrivate: lobby?.isPrivate ?? false,
      sideBets: lobby?.sideBets ?? false,
      isRouletteSelected: game === LobbyGame.ROULETTE && choice === 'accept' ? false : !!lobby?.isRouletteEnabled,
      isBlackjackSelected: game === LobbyGame.BLACKJACK && choice === 'accept' ? false : !!lobby?.isBlackjackEnabled,
      status: lobby?.status ?? LobbyState.ACTIVE,
    },
  });

  const handleToggleLobbyState = useCallback(
    async (newState: LobbyState.ACTIVE | LobbyState.PAUSED) => {
      if (newState === LobbyState.PAUSED) {
        await pauseLobby.mutateAsync(lobbyId);
      } else if (newState === LobbyState.ACTIVE) {
        await activateLobby.mutateAsync(lobbyId);
      }
      queryClient.invalidateQueries({ queryKey: ['roulette', 'game', 'current', lobbyId] });
      queryClient.invalidateQueries({ queryKey: ['blackjack', 'game', 'current', lobbyId] });
      queryClient.invalidateQueries({ queryKey: ['lobby', 'details', lobby?.code.toUpperCase()] });

      replaceModal(() => ({
        key: 'lobby-deactivated',
        props: { code: lobby?.code ?? '' },
        closable: false,
        lightBlur: true,
      }));
    },
    [activateLobby, lobby?.code, lobbyId, pauseLobby, queryClient, replaceModal],
  );
  const currentFormValues = useStore(form.store, (state) => state.values);

  const handleDeactivateLobby = useCallback(
    (code: string) => {
      replaceModal((prevOptions) => ({
        key: 'closing-lobby-confirmation-modal',
        props: { code },
        closable: prevOptions.closable,
      }));
    },
    [replaceModal],
  );

  const handleMax = useCallback(
    (field: 'bankroll' | 'rouletteBankroll') => {
      form.setFieldValue(field, user?.balance || 0);
    },
    [form, user?.balance],
  );

  const isBlackjackSelected = useStore(form.store, (state) => state.values.isBlackjackSelected);
  const isRouletteSelected = useStore(form.store, (state) => state.values.isRouletteSelected);

  const prevBlackjackSelected = usePrevious(isBlackjackSelected);
  const prevRouletteSelected = usePrevious(isRouletteSelected);

  useEffect(() => {
    if (!game || choice !== 'cancel') return;

    if (game === LobbyGame.BLACKJACK) {
      form.setFieldValue('isBlackjackSelected', true);
    }
    if (game === LobbyGame.ROULETTE) {
      form.setFieldValue('isRouletteSelected', true);
    }
  }, [choice, game, form]);

  useEffect(() => {
    if (!lobby) return;
    if (lobby.isBlackjackEnabled && lobby.bankroll > lobby.minBet && prevBlackjackSelected && !isBlackjackSelected) {
      form.setFieldValue('isBlackjackSelected', false);
      replaceModal((prevOptions) => ({
        key: 'closing-game-confirmation-modal',
        props: { code: lobby?.code, game: LobbyGame.BLACKJACK, currentValues: currentFormValues },
        closable: prevOptions.closable,
      }));
    }
  }, [currentFormValues, form, isBlackjackSelected, lobby, prevBlackjackSelected, replaceModal]);

  useEffect(() => {
    if (!lobby) return;
    if (
      lobby.isRouletteEnabled &&
      lobby.rouletteBankroll > lobby.rouletteMinBet &&
      prevRouletteSelected &&
      !isRouletteSelected
    ) {
      form.setFieldValue('isRouletteSelected', false);
      replaceModal((prevOptions) => ({
        key: 'closing-game-confirmation-modal',
        props: { code: lobby?.code, game: LobbyGame.ROULETTE, currentValues: currentFormValues },
        closable: prevOptions.closable,
      }));
    }
  }, [currentFormValues, form, isRouletteSelected, lobby, prevRouletteSelected, replaceModal]);

  const handleCloseModal = useCallback(() => {
    if (lobby?.status === LobbyState.PAUSED) {
      return replaceModal(() => ({
        key: 'lobby-deactivated',
        props: { code: lobby.code },
        closable: false,
        lightBlur: true,
      }));
    }

    closeModal();
  }, [closeModal, lobby?.code, lobby?.status, replaceModal]);

  return (
    <form
      className="min-h-[300px] min-w-[720px] rounded-[12px] bg-[#152947] max-md:min-w-[90vw] max-sm:h-[100vh] max-sm:w-[100vw]"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!credentials?.user) {
          return;
        }

        if (!isLocked('lobby-edit')) {
          form.handleSubmit();
        }
      }}
    >
      <div className="flex justify-between border-b border-[#12223B] px-9 pt-[29px] pb-6 text-2xl font-extrabold">
        <div>Editing Lobby</div>
        <button onClick={handleCloseModal} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      <div className="flex w-full gap-12 border-b border-[#12223B] px-9 pt-[29px] pb-6 max-md:flex-col max-md:px-4">
        <div className="flex w-full flex-col gap-4">
          <form.AppField
            name="isBlackjackSelected"
            children={(field) => (
              <field.ToggleField
                className="relative gap-2"
                labelProps={{
                  children: (
                    <div className="flex items-center gap-3.5 text-xl text-[#4486DD]">
                      <img src={aceIcon} alt="roulette table" /> Blackjack Table
                    </div>
                  ),
                }}
                toggleProps={{ className: 'min-w-[42px] min-h-6' }}
              >
                <button
                  type="button"
                  className="absolute top-[38px] right-3 min-h-7 cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF]"
                ></button>
              </field.ToggleField>
            )}
          ></form.AppField>
          {isBlackjackSelected && !lobby?.isBlackjackEnabled && (
            <form.AppField
              name="bankroll"
              children={(field) => (
                <field.NumberField
                  className="relative gap-2"
                  labelProps={{
                    children: (
                      <div className="flex items-center gap-1.5 text-[#60A4FD]">
                        Bankroll
                        <InfoTooltip
                          isClickable={false}
                          isHoverable={true}
                          content="Bankroll is the available balance in your lobby. This balance can be wagered against by users who join your lobby. Balance can be added or removed from Bankroll at any time."
                          className="z-20"
                          tooltipClass="min-w-[250px] text-white font-normal"
                        />
                      </div>
                    ),
                  }}
                  inputProps={{
                    disabled: !isBlackjackSelected,
                    placeholder: '0.00',
                    decimals: 2,
                    step: '0.1',
                    className:
                      'pl-9 bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF] relative',
                    onFocus: (e) => {
                      if (+e.target.value === 0) {
                        e.target.value = '';
                      }
                    },
                  }}
                >
                  <img
                    className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none"
                    src={dollarIcon}
                  />
                  <button
                    onClick={() => handleMax('bankroll')}
                    type="button"
                    className="absolute top-[34px] right-3 cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF]"
                  >
                    Max
                  </button>
                </field.NumberField>
              )}
            />
          )}
          <form.AppField
            name="minBet"
            children={(field) => (
              <field.NumberField
                className="relative gap-2"
                labelProps={{
                  children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Min Bet</div>,
                }}
                inputProps={{
                  disabled: !isBlackjackSelected,
                  placeholder: '0.00',
                  decimals: 2,
                  step: '0.1',
                  className: 'pl-9 bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF] relative',
                  onFocus: (e) => {
                    if (+e.target.value === 0) {
                      e.target.value = '';
                    }
                  },
                }}
              >
                <img className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none" src={dollarIcon} />
              </field.NumberField>
            )}
          />
          <form.AppField
            name="maxBet"
            children={(field) => (
              <field.NumberField
                className="relative gap-2"
                labelProps={{
                  children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Max Bet</div>,
                }}
                inputProps={{
                  disabled: !isBlackjackSelected,
                  placeholder: '0.00',
                  decimals: 2,
                  step: '0.1',
                  className: 'pl-9 bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF] relative',
                  onFocus: (e) => {
                    if (+e.target.value === 0) {
                      e.target.value = '';
                    }
                  },
                }}
              >
                <img className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none" src={dollarIcon} />
              </field.NumberField>
            )}
          />
        </div>
        <div className="flex w-full flex-col gap-4">
          <form.AppField
            name="isRouletteSelected"
            children={(field) => (
              <field.ToggleField
                className="relative gap-2"
                labelProps={{
                  children: (
                    <div className="flex items-center gap-3.5 text-xl text-[#4486DD]">
                      <img src={rouletteIcon} alt="roulette table" /> Roulette Table
                    </div>
                  ),
                }}
                toggleProps={{ className: 'min-w-[42px] min-h-6' }}
              >
                <button
                  type="button"
                  className="absolute top-[38px] right-3 min-h-7 cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF]"
                ></button>
              </field.ToggleField>
            )}
          ></form.AppField>
          {isRouletteSelected && !lobby?.isRouletteEnabled && (
            <form.AppField
              name="rouletteBankroll"
              children={(field) => (
                <field.NumberField
                  className="relative gap-2"
                  labelProps={{
                    children: (
                      <div className="flex items-center gap-1.5 text-[#60A4FD]">
                        Bankroll
                        <InfoTooltip
                          isClickable={false}
                          isHoverable={true}
                          content="Bankroll is the available balance in your lobby. This balance can be wagered against by users who join your lobby. Balance can be added or removed from Bankroll at any time."
                          className="z-20"
                          tooltipClass="min-w-[250px] text-white font-normal"
                        />
                      </div>
                    ),
                  }}
                  inputProps={{
                    disabled: !isRouletteSelected,
                    placeholder: '0.00',
                    decimals: 2,
                    step: '0.1',
                    className:
                      'pl-9 bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF] relative disabled:bg-[#253C60] disabled:text-[#6E88AF8F]',
                    onFocus: (e) => {
                      if (+e.target.value === 0) {
                        e.target.value = '';
                      }
                    },
                  }}
                >
                  <img
                    className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none"
                    src={dollarIcon}
                  />
                  <button
                    disabled={!isRouletteSelected}
                    onClick={() => handleMax('rouletteBankroll')}
                    type="button"
                    className={classNames(
                      'absolute top-[34px] right-3 rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF]',
                      isRouletteSelected ? 'cursor-pointer' : 'opacity-80',
                    )}
                  >
                    Max
                  </button>
                </field.NumberField>
              )}
            />
          )}
          <form.AppField
            name="rouletteMinBet"
            children={(field) => (
              <field.NumberField
                className="relative gap-2"
                labelProps={{
                  children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Min Bet</div>,
                }}
                inputProps={{
                  disabled: !isRouletteSelected,
                  placeholder: '0.00',
                  decimals: 2,
                  step: '0.1',
                  className: 'pl-9 bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF] relative',
                  onFocus: (e) => {
                    if (+e.target.value === 0) {
                      e.target.value = '';
                    }
                  },
                }}
              >
                <img className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none" src={dollarIcon} />
              </field.NumberField>
            )}
          />
          <form.AppField
            name="rouletteMaxBet"
            children={(field) => (
              <field.NumberField
                className="relative gap-2"
                labelProps={{
                  children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Max Bet</div>,
                }}
                inputProps={{
                  disabled: !isRouletteSelected,
                  placeholder: '0.00',
                  decimals: 2,
                  step: '0.1',
                  className: 'pl-9 bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF] relative',
                  onFocus: (e) => {
                    if (+e.target.value === 0) {
                      e.target.value = '';
                    }
                  },
                }}
              >
                <img className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none" src={dollarIcon} />
              </field.NumberField>
            )}
          />
        </div>
      </div>

      <div className="flex w-full justify-between px-[38px] py-6 max-md:flex-col max-md:gap-5 max-md:px-4">
        <div className="flex items-center gap-6">
          <form.AppField
            name="isPrivate"
            children={(field) => (
              <field.ToggleField
                className="relative gap-2"
                labelProps={{
                  children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Private Lobby</div>,
                }}
              ></field.ToggleField>
            )}
          />
          <form.AppField
            name="sideBets"
            children={(field) => (
              <field.ToggleField
                className="relative gap-2"
                labelProps={{
                  children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Side Bets</div>,
                }}
              ></field.ToggleField>
            )}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex w-full min-w-fit gap-4">
            <GenericButton
              text="Close Table"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!lobby) return;
                handleDeactivateLobby(lobby?.code);
              }}
              isDisabled={currentGame ? isCancelDisabledRef.current : false}
              className="min-w-fit"
              padding="px-3"
              bgColor="bg-[#FF5656] hover-base"
            />
            <GenericButton
              leftIcon={<img src={lobby?.status === LobbyState.ACTIVE ? pauseIcon : playIcon} alt="pause" width={20} />}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleToggleLobbyState(lobby?.status === LobbyState.ACTIVE ? LobbyState.PAUSED : LobbyState.ACTIVE);
              }}
              isDisabled={currentGame ? isCancelDisabledRef.current : false}
              className="min-w-[49px] border-b border-[#253C60] duration-200"
              bgColor="bg-[#08152A] hover:bg-[#182E51]"
              padding="p-0"
            />
          </div>
          <form.AppForm>
            <form.SubmitButtonAlt
              skin="primary"
              className={classNames('w-full gap-2 max-md:justify-center')}
              text="Save Changes"
              leftIcon={<img src={createLobbyIcon} />}
            ></form.SubmitButtonAlt>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
};
