import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useLobbyData } from '../../../queries/lobby';

export const Route = createFileRoute('/lobby/$code/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { code } = useParams({ from: '/lobby/$code/' });
  const { data: lobby } = useLobbyData(code);

  useEffect(() => {
    if (!lobby) return;

    if (code) {
      if (lobby.isBlackjackEnabled) {
        navigate({ to: '/lobby/$code/blackjack', params: { code: lobby.code } });
        return;
      }

      if (lobby.isRouletteEnabled) {
        navigate({ to: '/lobby/$code/roulette', params: { code: lobby.code } });
        return;
      }
    } else {
      navigate({ to: '/' });
    }
  }, [code, lobby, navigate]);

  return null;
}
