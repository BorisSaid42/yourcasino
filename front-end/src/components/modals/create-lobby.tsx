import { useStore } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { use, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import aceIcon from '../../assets/icons/common/ace-icon.svg';
import copyIcon from '../../assets/icons/common/copy-icon.svg';
import checkIcon from '../../assets/icons/common/check-icon-green.svg';
import crossIcon from '../../assets/icons/common/cross-icon.svg';
import dollarIcon from '../../assets/icons/common/dollar-icon.svg';
import shuffleIcon from '../../assets/icons/common/shuffle-icon.svg';
import createLobbyIcon from '../../assets/icons/lobby/create-lobby-icon.svg';
import rouletteIcon from '../../assets/roulette/roulette-icon-blue.svg';
import { classNames, getRandomString } from '../../lib/utils';
import { ModalContext } from '../../providers/modal/context';
import { SocketLockContext } from '../../providers/socket-locks/context';
import { useCredentials } from '../../queries/auth';
import { useCreateLobby } from '../../queries/lobby';
import { useUser } from '../../queries/user';
import { InfoTooltip } from '../common/info-tooltip';
import { useAppForm } from '../form/provider';
import { TextField } from '../form/text-field';
import { notify } from '../toast';

const MAX_BANKROLL = 1000000;

const blackjackSchema = z
  .object({
    bankroll: z.coerce
      .number({ invalid_type_error: 'Bankroll is required' })
      .min(25, 'Bankroll must be at least 25')
      .max(MAX_BANKROLL, `Bankroll can't exceed ${MAX_BANKROLL}`),
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
    rouletteBankroll: z.coerce
      .number({ invalid_type_error: 'Bankroll is required' })
      .min(25, 'Bankroll must be at least 25')
      .max(MAX_BANKROLL, `Bankroll can't exceed ${MAX_BANKROLL}`),
    rouletteMinBet: z.coerce.number({ invalid_type_error: 'Min bet is required' }),
    rouletteMaxBet: z.coerce.number({ invalid_type_error: 'Max bet is required' }),
  })
  .refine((data) => data.rouletteMinBet <= data.rouletteMaxBet, {
    path: ['rouletteMaxBet'],
    message: 'rouletteMaxBet must be greater than or equal to rouletteMinBet',
  });

const lobbySchema = z
  .object({
    lobbyCode: z.string().min(5).max(32),
    inviteLink: z.string(),
    isPrivate: z.boolean(),
    isSideBetsAllowed: z.boolean(),
    isRouletteSelected: z.boolean(),
    isBlackjackSelected: z.boolean(),
    tos: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms of Service' }),
    }),

    // optional at the root
    bankroll: z.coerce.number(),
    minBet: z.coerce.number(),
    maxBet: z.coerce.number(),
    rouletteBankroll: z.coerce.number(),
    rouletteMinBet: z.coerce.number(),
    rouletteMaxBet: z.coerce.number(),
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

export const CreateLobbyModal = () => {
  const createLobby = useCreateLobby();
  const { closeModal } = use(ModalContext);
  const initialCode = getRandomString(8);
  const navigate = useNavigate();
  const { data: credentials } = useCredentials();
  const { data: user } = useUser();
  const [isCopied, setIsCopied] = useState(false);

  const { isLocked, setLock } = use(SocketLockContext);

  const form = useAppForm({
    onSubmit: async ({ value, formApi }) => {
      setLock('lobby-create', true);

      formApi.resetField('bankroll');
      const data = await createLobby.mutateAsync(
        {
          isBlackjackSelected: value.isBlackjackSelected,
          bankroll: value.isBlackjackSelected ? value.bankroll : undefined,
          minBet: value.isBlackjackSelected ? value.minBet : undefined,
          maxBet: value.isBlackjackSelected ? value.maxBet : undefined,
          code: value.lobbyCode,
          isPrivate: value.isPrivate,
          sideBets: value.isSideBetsAllowed,
          isRouletteSelected: value.isRouletteSelected,
          rouletteBankroll: value.isRouletteSelected ? value.rouletteBankroll : undefined,
          rouletteMaxBet: value.isRouletteSelected ? value.rouletteMaxBet : undefined,
          rouletteMinBet: value.isRouletteSelected ? value.rouletteMinBet : undefined,
          tos: value.tos,
        },
        {
          onError: () => {
            setLock('lobby-create', false);
          },
        },
      );

      setLock('lobby-create', false);
      closeModal(true);
      formApi.reset();

      if (data?.code) {
        navigate({ to: `/lobby/${data.code}` });
      }
    },
    validators: {
      onSubmit: lobbySchema,
    },
    defaultValues: {
      bankroll: 0,
      minBet: 0,
      maxBet: 0,
      lobbyCode: initialCode,
      inviteLink: `${import.meta.env.VITE_BASE_APP_URL}/lobby/${initialCode}`,
      isPrivate: false,
      isSideBetsAllowed: false,
      isRouletteSelected: false,
      isBlackjackSelected: true,
      tos: false,
      rouletteBankroll: 0,
      rouletteMinBet: 0,
      rouletteMaxBet: 0,
    },
  });
  const getInviteLink = (code: string) => `${import.meta.env.VITE_BASE_APP_URL}/lobby/${code}`;

  const handleChangeInviteCode = () => {
    const sub = form.getFieldValue('lobbyCode');
    form.setFieldValue('inviteLink', `${import.meta.env.VITE_BASE_APP_URL}/lobby/${sub}`);
  };

  const generateCode = () => {
    const getRandomChars = (chars: string, length: number) =>
      Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const code = getRandomChars(letters, 5) + getRandomChars(digits, 2);

    form.setFieldValue('lobbyCode', code);
    form.setFieldValue('inviteLink', `${import.meta.env.VITE_BASE_APP_URL}/lobby/${code}`);
  };

  const handleMax = useCallback(
    (field: 'bankroll' | 'rouletteBankroll') => {
      form.setFieldValue(field, user?.balance || 0);
    },
    [form, user?.balance],
  );

  const handleCopy = useCallback(() => {
    const inviteLink = getInviteLink(form.getFieldValue('lobbyCode'));
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        notify('success', { content: 'Copied to clipboard', title: 'Success' });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(console.error);
  }, [form]);

  const isBlackjackSelected = useStore(form.store, (state) => state.values.isBlackjackSelected);
  const isRouletteSelected = useStore(form.store, (state) => state.values.isRouletteSelected);

  useEffect(() => {
    if (!isBlackjackSelected) {
      form.resetField('bankroll');
      form.resetField('minBet');
      form.resetField('maxBet');
    }

    if (!isRouletteSelected) {
      form.resetField('rouletteBankroll');
      form.resetField('rouletteMinBet');
      form.resetField('rouletteMaxBet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouletteSelected, isBlackjackSelected]);

  return (
    <form
      className="min-h-[461px] min-w-[720px] rounded-[12px] bg-[#152947] max-md:w-[100vw] max-md:min-w-[unset] max-md:rounded-none"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!credentials?.user) {
          return;
        }

        if (!isLocked('lobby-create')) {
          form.handleSubmit();
        }
      }}
    >
      <div className="flex w-full items-center justify-between border-b border-[#12223B] px-9 pt-[29px] pb-6 text-2xl font-extrabold max-md:px-4">
        <div>Creating Lobby</div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      <div className="flex flex-col gap-6 border-b border-[#12223B]">
        <div className="mt-6 flex w-full justify-start px-3 max-md:px-4">
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
        </div>
        <div className="flex w-full gap-12 px-9 pb-6 max-md:flex-col max-md:px-4">
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
                  className: 'pl-9 bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-[#6E88AF] relative',
                  onFocus: (e) => {
                    if (+e.target.value === 0) {
                      e.target.value = '';
                    }
                  },
                }}
              >
                <img className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none" src={dollarIcon} />
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
          <div className="flex w-full gap-4">
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
                </field.NumberField>
              )}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 border-b border-[#12223B]">
        <div className="mt-6 flex w-full justify-start px-3 max-md:px-4">
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
        </div>
        <div className="flex w-full gap-12 px-9 pb-6 max-md:flex-col max-md:px-4">
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
                <img className="pointer-events-none absolute top-[40px] left-5 min-w-3 select-none" src={dollarIcon} />
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
          <div className="flex w-full gap-4">
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
                </field.NumberField>
              )}
            />
          </div>
        </div>
      </div>
      <div className="flex w-full gap-12 border-b border-[#12223B] px-9 pt-[29px] pb-6 max-md:gap-4 max-md:px-4">
        <form.AppField
          name="lobbyCode"
          listeners={{
            onChange: () => handleChangeInviteCode(),
          }}
          children={(field) => (
            <field.TextField
              className="relative gap-2"
              labelProps={{
                children: (
                  <div className="flex items-center gap-1.5 text-[#6E88AF8F]">
                    Lobby Code{' '}
                    <InfoTooltip
                      isClickable={false}
                      isHoverable={true}
                      content="This will be your unique lobby code. Users will use this code to join your lobby."
                      className="z-20"
                      tooltipClass="min-w-[250px] text-white font-normal"
                    />
                  </div>
                ),
              }}
              inputProps={{
                placeholder: 'Enter lobby code',
                className: 'bg-[#08152A] border border-[#253C60] placeholder-[#6E88AF] text-white relative',
                onFocus: (e) => {
                  e.target.select();
                },
              }}
            >
              <button
                type="button"
                onClick={generateCode}
                className="absolute top-[38px] right-3 min-h-7 cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF] max-md:top-[34px]"
              >
                <img src={shuffleIcon} />
              </button>
            </field.TextField>
          )}
        />
        <div className="flex w-full gap-4">
          <form.AppField name="inviteLink" listeners={{}}>
            {() => (
              <TextField
                className="relative gap-2"
                labelProps={{ children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Invite Link</div> }}
                inputProps={{
                  value: getInviteLink(form.getFieldValue('lobbyCode')),
                  className:
                    'bg-[#253C60] border border-[#253C60] placeholder-[#6E88AF] text-white relative disabled:bg-[#253C60] disabled:text-[#6E88AF8F]',
                  disabled: true,
                }}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopy();
                  }}
                  type="button"
                  className="absolute top-[38px] right-3 min-h-7 cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF] max-md:top-[34px]"
                >
                  {isCopied ? <img src={checkIcon} /> : <img src={copyIcon} />}
                </button>
              </TextField>
            )}
          </form.AppField>
        </div>
      </div>
      <div className="w-full bg-[#12223B] py-2 text-center font-extrabold text-[#6E88AF8F]">
        Lobbies can be cancelled at anytime after creation.
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
              >
                <button
                  type="button"
                  className="absolute top-[38px] right-3 min-h-7 cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF]"
                ></button>
              </field.ToggleField>
            )}
          />
          <form.AppField
            name="isSideBetsAllowed"
            children={(field) => (
              <field.ToggleField
                className="relative gap-2"
                labelProps={{
                  children: <div className="flex items-center gap-1.5 text-[#6E88AF8F]">Side Bets</div>,
                }}
              >
                <button className="absolute top-[38px] right-3 min-h-7 cursor-pointer rounded-[5px] bg-[#1D3353] px-2 py-[5px] font-bold text-[#6E88AF]"></button>
              </field.ToggleField>
            )}
          />
        </div>
        <div className="flex items-center gap-6">
          <form.AppField
            name="tos"
            children={(field) => (
              <field.CheckboxField
                className="w-full"
                checkboxProps={{
                  className: 'tos-checkbox',
                }}
                labelProps={{
                  className: 'tos-text max-sm:text-xs!',
                  children: (
                    <div className="flex gap-2">
                      <InfoTooltip
                        isClickable={false}
                        isHoverable={true}
                        content="I confirm that I am complying with all applicable laws and regulations regarding hosting an online gaming platform in my jurisdiction. I confirm that I possess the necessary authorization/licensing to operate games of chance in said jurisdiction."
                        className="z-20"
                        tooltipClass="min-w-[250px] text-white font-normal top-[-50px] left-[20px]"
                      />{' '}
                      I accept Terms of Service.
                    </div>
                  ),
                }}
              />
            )}
          ></form.AppField>
        </div>
        <div>
          <form.AppForm>
            <form.SubmitButtonAlt
              leftIcon={<img src={createLobbyIcon} />}
              text="Create Lobby"
              skin="primary"
              className={classNames('max-md:justify-center')}
            ></form.SubmitButtonAlt>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
};
