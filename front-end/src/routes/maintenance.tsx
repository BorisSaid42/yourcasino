import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useMaintenanceStatus } from '../queries/maintenance';

export const Route = createFileRoute('/maintenance')({
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: maintenanceStatus } = useMaintenanceStatus();

  useEffect(() => {
    if (maintenanceStatus) {
      localStorage.removeItem('__yourcasino.maintenance');
      navigate({ to: '/' });
    }
  }, [maintenanceStatus, navigate]);

  return (
    <div className="flex w-full flex-col gap-10 px-4 py-72">
      <div className="font-spacegrotesk flex flex-col gap-4 text-center">
        <div className="text-base capitalize md:text-2xl">We'll Be Back Soon</div>
        <h1 className="font-chakra text-3xl uppercase md:text-5xl">Currently under maintenance</h1>
        <div className="text-base capitalize md:text-2xl">Thank you for your patience!</div>
      </div>
    </div>
  );
}
