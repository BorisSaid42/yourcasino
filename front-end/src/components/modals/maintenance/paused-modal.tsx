export const MaintenancePausedModal = () => {
  return (
    <div className="flex min-h-[170px] min-w-[672px] flex-col rounded-xl bg-[#152947] max-md:w-screen max-md:min-w-0 max-md:rounded-none">
      <div className="flex items-center justify-center border-b border-b-[#12223B] px-9 py-[21px] max-md:px-3.5 max-md:py-4">
        <div className="flex gap-6 text-base font-extrabold">
          <span className={`'text-white`}>Lobby paused</span>
        </div>
      </div>
      <div className="w-full py-6 text-lg font-extrabold text-[#6E88AF]">
        <div className="flex h-full w-full flex-col items-center justify-center gap-5">
          <div>This lobby is currently paused.</div>
        </div>
      </div>
    </div>
  );
};
