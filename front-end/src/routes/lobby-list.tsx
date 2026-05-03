import { createFileRoute } from '@tanstack/react-router';
import { LobbyList } from '../components/lobby-list/lobby-list';

export const Route = createFileRoute('/lobby-list')({
  component: RouteComponent,
});

function RouteComponent() {
  return <LobbyList />;
}
