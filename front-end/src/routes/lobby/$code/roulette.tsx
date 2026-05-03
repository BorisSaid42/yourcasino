import { createFileRoute, useParams } from '@tanstack/react-router';
import { RoulettePage } from '../../../components/lobby/roulette';
import { LobbyProvider } from '../../../providers/lobby/provider';
import { RouletteProvider } from '../../../providers/roulette/provider';

export const Route = createFileRoute('/lobby/$code/roulette')({
  component: RouteComponent,
});

function RouteComponent() {
  const { code } = useParams({ from: '/lobby/$code/roulette' });

  return (
    <LobbyProvider code={code}>
      <RouletteProvider>
        <RoulettePage />
      </RouletteProvider>
    </LobbyProvider>
  );
}
