import { createFileRoute } from '@tanstack/react-router';
import { TOS } from '../components/tos/tos';

export const Route = createFileRoute('/tos')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TOS />;
}
