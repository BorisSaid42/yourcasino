import { createFileRoute, useParams } from '@tanstack/react-router';
import { Lobby } from '../../../components/lobby';
import { LobbyProvider } from '../../../providers/lobby/provider';
import { BlackjackProvider } from '../../../providers/blackjack/provider';

export const Route = createFileRoute('/lobby/$code/blackjack')({
  component: RouteComponent,
});

function RouteComponent() {
  const { code } = useParams({ from: '/lobby/$code/blackjack' });

  return (
    <LobbyProvider code={code}>
      <BlackjackProvider>
        <Lobby />
      </BlackjackProvider>
    </LobbyProvider>
  );
}
