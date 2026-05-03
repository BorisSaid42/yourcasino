import { QueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { use, useCallback, useState } from 'react';
import btnIconAdd from '../../../assets/icons/btn-icon-add.svg';
import crossIcon from '../../../assets/icons/common/cross-icon.svg';
import { api } from '../../../lib/interaction/api';
import { BreakpointEnum, useBreakpoint } from '../../../lib/utils';
import { ModalContext } from '../../../providers/modal/context';
import { LobbyType, useLobbyStats } from '../../../queries/lobby';
import { EmptyList } from '../../empty-list/empty-list';
import { notify } from '../../toast';
import { ManageTablesRow } from './manage-tables-row';
import { ManageTablesRowMobile } from './manage-tables-row-mobile';
import { GenericButton } from '../../common/buttons';

const MANAGE_TABLES_HEADERS = [
  { value: 'Table Name/Code' },
  { value: '' },
  { value: 'Min-Max' },
  { value: 'Bankroll' },
  { value: 'Gross Profit' },
  { value: 'Actions' },
];

export const ManageTablesModal = () => {
  const { closeModal, replaceModal } = use(ModalContext);
  const queryClient = new QueryClient();
  const navigate = useNavigate();
  const isSmallerScreen = useBreakpoint(BreakpointEnum.LG);
  const [page, setPage] = useState(1);

  const { data: lobbyStats } = useLobbyStats(page);

  const handleOpenCreateLobbyModal = useCallback(() => {
    return replaceModal((prevOptions) => ({
      key: 'create-lobby',
      props: prevOptions.props,
      closable: prevOptions.closable,
    }));
  }, [replaceModal]);

  const handleLobbyClick = async (e: React.MouseEvent, code: string) => {
    e.preventDefault();

    try {
      await queryClient.fetchQuery({
        queryKey: ['lobby', 'details', code.toUpperCase()],
        queryFn: () => api.get<LobbyType, LobbyType>(`/lobby/${code}`),
      });

      navigate({ to: `/lobby/${code?.toUpperCase()}` });
      closeModal();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      notify('error', { content: 'Lobby not found or no longer available.', title: 'Error' });
    }
  };

  return (
    <div className="flex min-h-[320px] w-[900px] flex-col rounded-xl bg-[#152947] max-lg:min-h-[90vh] max-lg:w-[90vw] max-md:w-[100vw]">
      <div className="flex items-center justify-between border-b border-b-[#12223B] px-9 py-[21px]">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Manage Tables</span>
        </div>
        <button onClick={() => closeModal()} className="cursor-pointer rounded-[5px] bg-[#182E51] p-3.5">
          <img src={crossIcon} />
        </button>
      </div>
      {!!lobbyStats?.data.length && !isSmallerScreen && (
        <div className="flex w-full flex-col">
          <div className="w-full bg-[#12223B] px-9">
            <div className="grid grid-cols-[5fr_1fr_2fr_2fr_2fr_3fr] py-2 text-[#6E88AF8F]">
              {MANAGE_TABLES_HEADERS.map((betHistoryHeader, idx) => (
                <div
                  className={`font-extrabold ${idx + 1 === MANAGE_TABLES_HEADERS.length ? 'text-end' : ''}`}
                  key={`deposit-history-header-${betHistoryHeader.value}`}
                >
                  {betHistoryHeader.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 px-[30px] py-6">
        {lobbyStats?.data.length ? (
          lobbyStats?.data.map((tableData, idx) =>
            !isSmallerScreen ? (
              <ManageTablesRow key={idx} idx={idx} tableData={tableData} handleLobbyClick={handleLobbyClick} />
            ) : (
              <ManageTablesRowMobile idx={idx} tableData={tableData} handleLobbyClick={handleLobbyClick} />
            ),
          )
        ) : (
          <EmptyList />
        )}
      </div>
      {!!lobbyStats?.data.length && (
        <div className="relative mx-[35px] mb-8 flex items-center justify-center gap-3">
          <GenericButton
            skin="secondaryDark"
            onClick={() => setPage((p) => (p <= lobbyStats.totalPages ? p - 1 : p))}
            isDisabled={page <= 1}
            className="min-h-12 min-w-[60px] text-[#6E88AF] disabled:opacity-[24%]"
            text="Prev"
          ></GenericButton>
          <div className="flex min-w-[108px] items-center justify-center rounded-[5px] border border-[#253C60] py-4 font-bold disabled:cursor-default disabled:opacity-[24%]">
            {lobbyStats?.page}/{lobbyStats?.totalPages} Pages
          </div>
          <GenericButton
            skin="secondaryDark"
            onClick={() => setPage((p) => (p < lobbyStats.totalPages ? p + 1 : p))}
            isDisabled={lobbyStats.page >= lobbyStats.totalPages}
            className="min-h-12 min-w-[60px] text-[#6E88AF] disabled:opacity-[24%]"
            text="Next"
          ></GenericButton>
          {!isSmallerScreen && (
            <GenericButton
              skin="primary"
              onClick={() => handleOpenCreateLobbyModal()}
              className="absolute left-full w-max -translate-x-full gap-2"
              text="Create Table"
              leftIcon={<img className="max-lg:ml-4" src={btnIconAdd} alt="banner sign" />}
            ></GenericButton>
          )}
        </div>
      )}
    </div>
  );
};
