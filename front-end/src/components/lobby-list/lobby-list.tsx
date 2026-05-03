import { use, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import btnIconAdd from '../../assets/icons/btn-icon-add.svg';
import bankIconGrayed from '../../assets/icons/common/bank-icon-grayed.svg';
import bankIcon from '../../assets/icons/common/bank-icon.svg';
import searchIcon from '../../assets/icons/common/search-icon.svg';
import sortIcon from '../../assets/icons/common/sort-icon.svg';
import triangleDownIcon from '../../assets/icons/common/triangle-down.svg';
import { sockets } from '../../lib/interaction/sockets';
import { BreakpointEnum, classNames, useBreakpoint } from '../../lib/utils';
import { ModalContext } from '../../providers/modal/context';
import { useCredentials } from '../../queries/auth';
import { LobbyFilterField, LobbySortField, LobbyType, useLobbyList } from '../../queries/lobby';
import { EmptyList } from '../empty-list/empty-list';
import { Dropdown } from '../form/inputs/dropdown';
import { useAppForm } from '../form/provider';
import { useDebounce } from '../hooks/useDebounce';
import { AuthModalOpened } from '../modals/auth/auth-modal.enum';
import { LobbyListRow } from './lobby-list-row';
import { LobbyListRowMobile } from './lobby-list-row-mobile';

export const LOBBY_LIST_HEADERS = [
  { value: 'Players', gridSpan: 1 },
  { value: 'Lobby', gridSpan: 1 },
  { value: '', gridSpan: 1 },
  { value: 'Bankroll', gridSpan: 1, icon: bankIcon },
  { value: 'Min-Max', gridSpan: 1 },
  { value: 'Owner', gridSpan: 1 },
  { value: 'View', gridSpan: 1 },
];

const lobbySearchSchema = z.object({
  search: z.string().min(2).max(20),
});

const SORT_OPTIONS = [
  { value: LobbySortField.BANKROLL, label: 'Bankroll' },
  { value: LobbySortField.MIN_BET, label: 'Min bet' },
  { value: LobbySortField.MAX_BET, label: 'Max bet' },
];

const FILTER_OPTIONS = [
  { value: LobbyFilterField.OPEN_SLOTS, label: 'Open slots' },
  { value: LobbyFilterField.BLACKJACK_ONLY, label: 'Blackjack only' },
  { value: LobbyFilterField.ROULETTE_ONLY, label: 'Roulette only' },
];

export const LobbyList = () => {
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebounce(searchInput, 400);
  const [sortState, setSortState] = useState(SORT_OPTIONS[0]);
  const [filterState, setFilterState] = useState<LobbyFilterField[] | undefined>(undefined);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const { data, fetchNextPage } = useLobbyList(sortState.value as LobbySortField, 10, searchTerm, filterState);
  const { openModal } = use(ModalContext);
  const isSmallerScreen = useBreakpoint(BreakpointEnum.MD);
  const { data: credentials } = useCredentials();
  const [lobbiesData, setLobbiesData] = useState<LobbyType[]>([]);

  useEffect(() => {
    const lobbyMap = new Map<string, LobbyType>();
    data?.pages.forEach((page) => {
      page.data.forEach((lobby) => {
        if (!lobbyMap.has(lobby.id)) {
          lobbyMap.set(lobby.id, lobby);
        }
      });
    });

    setLobbiesData(Array.from(lobbyMap.values()));
  }, [data]);

  useEffect(() => {
    const updateLobbyList = (data: {
      lobbyId: string;
      action: 'add' | 'remove';
      key: 'currentPlayerCount' | 'roulettePlayerCount';
    }) => {
      setLobbiesData((prevState) =>
        prevState.map((lobby) =>
          lobby.id === data.lobbyId
            ? { ...lobby, [data.key]: +lobby[data.key] + (data.action === 'add' ? 1 : -1) }
            : lobby,
        ),
      );
    };

    sockets.on('gamePlayersUpdate', updateLobbyList);
    return () => {
      sockets.off('gamePlayersUpdate', updateLobbyList);
    };
  }, []);

  const total = data?.pages[0]?.total ?? 0;

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      setSearchInput(value.search);
    },
    validators: {
      onSubmit: lobbySearchSchema,
    },
    defaultValues: {
      search: '',
    },
  });

  const handleOpenCreateLobbyModal = useCallback(() => {
    if (!credentials) {
      openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
      return;
    }
    openModal({ key: 'create-lobby', props: {}, closable: true });
  }, [credentials, openModal]);

  const handleOpenJoinLobbyModal = useCallback(() => {
    if (!credentials) {
      openModal({ key: 'auth', props: { tab: AuthModalOpened.LOGIN }, closable: true });
      return;
    }
    openModal({ key: 'join-lobby', props: {}, closable: true });
  }, [credentials, openModal]);

  const toggleSortDropdown = useCallback(() => {
    setSortDropdownOpen((prev) => {
      return !prev;
    });
  }, []);

  const handleSortSelect = useCallback((option: { value: LobbySortField; label: string }) => {
    setSortState(option);
    setSortDropdownOpen(false);
  }, []);

  const getLobbyHeaderTextColor = useCallback((header: string, sortState: string) => {
    if (
      (header === 'Bankroll' && sortState === 'bankroll') ||
      (header === 'Min-Max' && (sortState === 'minBet' || sortState === 'maxBet'))
    ) {
      return 'text-[#60A4FD]';
    }

    return 'text-[#6E88AF8F]';
  }, []);

  const handleFilterSelect = useCallback((newFilter: LobbyFilterField) => {
    setFilterState((prevState) => {
      if (!prevState) return [newFilter];
      if (prevState.includes(newFilter)) return prevState.filter((prevFilter) => prevFilter !== newFilter);
      return [...prevState, newFilter];
    });
  }, []);

  return (
    <div className="flex-column flex min-h-[calc(100vh)] justify-center pt-[72px]">
      <div className="w-full max-w-[1200px] px-6">
        <div className="flex gap-6 text-2xl font-extrabold">
          <div>{total} Lobbies</div>
        </div>
        <div className="mt-6 flex flex-col justify-between gap-3 max-sm:flex-col-reverse lg:flex-row">
          <form
            className="flex w-full gap-3 max-sm:flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();

              form.handleSubmit();
            }}
          >
            <div className="relative flex w-full max-w-[372px] items-center gap-2.5 rounded-[5px] border-[1px] border-[#253C60] bg-[#08152A] px-6 py-4 max-sm:max-w-full">
              <form.AppField
                name="search"
                children={(field) => (
                  <>
                    <img src={searchIcon} />
                    <field.TextField
                      className=""
                      inputProps={{
                        placeholder: 'Search for lobby...',
                        onChange: (e) => {
                          const value = e.target.value;
                          field.handleChange(value);
                          setSearchInput(value);
                        },
                        className:
                          'w-full focus:outline-none text-white placeholder-[#6E88AF] bg-transparent p-0 border-0',
                      }}
                    />
                  </>
                )}
              />
            </div>
            <div className="relative w-full max-w-[240px] select-none max-sm:max-w-full">
              <div
                className="hover-base flex cursor-pointer items-center rounded-[5px] bg-[#182E51] px-6 py-4 max-sm:justify-between"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  toggleSortDropdown();
                }}
              >
                <img src={sortIcon} alt="sort" />
                <div className="mx-2 flex items-center gap-1 font-bold text-[#6E88AF]">
                  Sort by:<span className="text-white"> {sortState.label}</span>
                </div>
                <img
                  src={triangleDownIcon}
                  className={classNames('duration-500', isSortDropdownOpen ? 'rotate-x-180' : '')}
                  alt="toggle"
                />
              </div>

              {isSortDropdownOpen && (
                <Dropdown
                  isOpen={isSortDropdownOpen}
                  onClose={() => setSortDropdownOpen(false)}
                  className="absolute top-full left-0 z-10 mt-1 w-full rounded-md border border-[#253C60] bg-[#0E1C35] text-white shadow-md"
                >
                  <ul className="py-2">
                    {SORT_OPTIONS.map((option) => (
                      <li
                        key={option.value}
                        className="cursor-pointer bg-transparent px-4 py-2 font-bold duration-200 hover:bg-[#1F3256]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSortSelect(option);
                        }}
                      >
                        {option.label}
                      </li>
                    ))}
                    <div className="h-0.5 w-full bg-[#12223B]"></div>
                    {FILTER_OPTIONS.map((filterOption) => (
                      <li
                        key={filterOption.value}
                        className="flex w-full cursor-pointer items-center justify-between bg-transparent px-4 py-2 font-bold duration-200 hover:bg-[#1F3256]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilterSelect(filterOption.value);
                        }}
                      >
                        <span>{filterOption.label}</span>
                        <input
                          className="h-4 w-4 cursor-pointer appearance-none rounded-sm bg-[#12223B] checked:border-blue-600 checked:bg-[#4486DD]"
                          checked={filterState?.includes(filterOption.value)}
                          type="checkbox"
                        />
                      </li>
                    ))}
                  </ul>
                </Dropdown>
              )}
            </div>
          </form>
          <div className="h-[1px] w-full bg-[#12223B] lg:hidden" />
          <div className="flex w-full gap-3 lg:justify-end">
            <div
              onClick={handleOpenJoinLobbyModal}
              className="font-montserrat btn-secondary btn-common hover-base flex items-center justify-center gap-2 max-sm:w-full"
            >
              Join Lobby
            </div>
            <div
              onClick={handleOpenCreateLobbyModal}
              className="font-montserrat btn-primary btn-common hover-base flex justify-center gap-2 max-sm:w-full"
            >
              <img className="max-lg:ml-4" src={btnIconAdd} alt="banner sign" />
              Create Lobby
            </div>
          </div>
        </div>
        <div className="mt-9 mb-6 grid grid-cols-[1fr_3fr_1fr_2fr_3fr_200px_1fr] bg-[#12223B] py-2 max-md:hidden">
          {LOBBY_LIST_HEADERS.map((lobbyHeader) => (
            <div
              key={`lobby-list-header-${lobbyHeader.value}`}
              className={`flex items-center justify-center gap-1.5 text-center text-[13px] font-extrabold ${getLobbyHeaderTextColor(lobbyHeader.value, sortState.value)}`}
            >
              {lobbyHeader.value === 'Bankroll' && (
                <img src={sortState.value === 'bankroll' ? bankIcon : bankIconGrayed} />
              )}
              {lobbyHeader.value}
            </div>
          ))}
        </div>
        <div className="mb-9">
          {lobbiesData.length ? (
            <>
              {!isSmallerScreen &&
                lobbiesData.map((lobbyRow) => (
                  <LobbyListRow lobbyRow={lobbyRow} key={lobbyRow.id} sortState={sortState.value} />
                ))}
              {isSmallerScreen &&
                lobbiesData.map((lobbyRow) => <LobbyListRowMobile key={lobbyRow.id} lobbyRow={lobbyRow} />)}
            </>
          ) : (
            <div className="max-md:mt-6">
              <EmptyList text="No Active Lobbies" />
            </div>
          )}
        </div>
        {data && lobbiesData && lobbiesData.length < total && (
          <div className="mb-6.5 flex w-full justify-center">
            <div onClick={() => fetchNextPage()} className="btn-common btn-secondary-dark hover-base text-center">
              Load More ({lobbiesData.length}/{total})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
