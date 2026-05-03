import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useAuthOnlyRoute } from '../../components/hooks/useAuthOnlyRoute';
import { useCredentials } from '../../queries/auth';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: credentials } = useCredentials();

  useAuthOnlyRoute();

  return !credentials?.user ? null : <Outlet />;
}
